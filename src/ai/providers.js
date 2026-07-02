import { store, setStore } from '../state/index.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const GEMINI_FALLBACK_ORDER = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];

function getProviderConfig() {
  const { providers } = store.system;
  return {
    primary: providers.primary,
    geminiModel: providers.geminiModel || 'gemini-3.5-flash',
    geminiKey: providers.geminiKey,
    openrouterKey: providers.openrouterKey,
    health: providers.health,
  };
}

// Exported for tests. Must write through setStore — mutating the store proxy
// directly is a silent no-op in Solid (verified live: failures stayed 0
// forever, so isHealthy() was always true and the cooldown below never
// engaged — every message walked the full primary-provider retry chain even
// when it was known-failing).
export function recordFailure(provider) {
  const prev = store.system.providers.health[provider];
  setStore('system', 'providers', 'health', provider, {
    failures: (prev?.failures || 0) + 1,
    lastFail: Date.now(),
  });
}

export function isHealthy(provider) {
  const health = store.system.providers.health[provider];
  if (!health || health.failures === 0) return true;
  const cooldown = Math.min(60000 * Math.pow(2, health.failures - 1), 300000);
  return Date.now() - health.lastFail > cooldown;
}

function buildGeminiBody(messages, systemPrompt) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  return {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 4096,
    },
  };
}

function buildOpenRouterBody(messages, systemPrompt) {
  return {
    model: 'google/gemini-2.0-flash-exp:free',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.9,
    max_tokens: 4096,
    stream: true,
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getFallbackModels(primaryModel) {
  const idx = GEMINI_FALLBACK_ORDER.indexOf(primaryModel);
  if (idx === -1) return GEMINI_FALLBACK_ORDER;
  return [...GEMINI_FALLBACK_ORDER.slice(idx + 1), ...GEMINI_FALLBACK_ORDER.slice(0, idx)];
}

async function* streamGemini(messages, systemPrompt, signal, model) {
  const config = getProviderConfig();
  if (!config.geminiKey) throw new Error('Gemini API key not set');

  const useModel = model || config.geminiModel;
  const url = `${GEMINI_BASE}/${useModel}:streamGenerateContent?key=${config.geminiKey}&alt=sse`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildGeminiBody(messages, systemPrompt)),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    const err = new Error();
    err.status = res.status;
    if (res.status === 429) {
      err.message = `Gemini rate limit (${useModel})`;
      err.retryable = true;
    } else if (res.status === 403) {
      err.message = 'Gemini API key invalid or disabled';
    } else {
      try { err.message = `Gemini: ${JSON.parse(errText).error?.message || errText}`; } catch { err.message = `Gemini ${res.status}: ${errText.slice(0, 120)}`; }
    }
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const parts = parsed.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          // Skip Gemini 2.5 thinking tokens (thought: true) — yield only the response.
          if (!part.thought && part.text) yield part.text;
        }
      } catch {}
    }
  }
}

async function* streamOpenRouter(messages, systemPrompt, signal) {
  const config = getProviderConfig();
  if (!config.openrouterKey) throw new Error('OpenRouter API key not set');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openrouterKey}`,
      'HTTP-Referer': 'https://tinklepebble.app',
    },
    body: JSON.stringify(buildOpenRouterBody(messages, systemPrompt)),
    signal,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {}
    }
  }
}

async function* geminiWithRetryAndFallback(messages, systemPrompt, signal) {
  const config = getProviderConfig();
  if (!config.geminiKey) throw new Error('Gemini API key not set');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = streamGemini(messages, systemPrompt, signal);
      for await (const chunk of stream) {
        yield chunk;
      }
      return;
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      if (!e.retryable || attempt === MAX_RETRIES) {
        if (e.retryable) break;
        throw e;
      }
      await sleep(RETRY_DELAYS[attempt]);
    }
  }

  const fallbacks = getFallbackModels(config.geminiModel);
  for (const model of fallbacks) {
    try {
      const stream = streamGemini(messages, systemPrompt, signal, model);
      for await (const chunk of stream) {
        yield chunk;
      }
      return;
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      if (!e.retryable) throw e;
    }
  }

  throw new Error('All Gemini models rate limited — wait a minute and try again');
}

// Ordered list of providers actually worth trying right now (healthy + keyed),
// primary provider first. Shared by callProvider and callProviderOnce so the
// two can't drift apart on what "worth trying" means.
function pickHealthyProviders(config) {
  const order = config.primary === 'openrouter' ? ['openrouter', 'gemini'] : ['gemini', 'openrouter'];
  return order.filter(provider => {
    if (!isHealthy(provider)) return false;
    const hasKey = provider === 'gemini' ? config.geminiKey : config.openrouterKey;
    return !!hasKey;
  });
}

export async function* callProvider(messages, systemPrompt, signal) {
  const config = getProviderConfig();
  const providers = pickHealthyProviders(config);

  let lastError = null;

  for (const provider of providers) {
    try {
      const stream = provider === 'gemini'
        ? geminiWithRetryAndFallback(messages, systemPrompt, signal)
        : streamOpenRouter(messages, systemPrompt, signal);

      for await (const chunk of stream) {
        yield chunk;
      }
      return;
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      recordFailure(provider);
      lastError = e;
    }
  }

  throw lastError || new Error('No API key set. Go to Settings and add your Gemini key.');
}

// A single, lean attempt for small non-critical calls (e.g. contextual DC
// lookups) that must respect a tight latency budget and must never poison
// shared provider-health state on failure — unlike callProvider, this makes
// no retries and never calls recordFailure(). Returns the full accumulated
// text rather than a stream, since a call this short has no need for
// incremental chunks. Throws (including AbortError) on any failure; callers
// are expected to catch and fall back to a sensible default.
export async function callProviderOnce(messages, systemPrompt, signal) {
  const config = getProviderConfig();
  const providers = pickHealthyProviders(config);
  if (providers.length === 0) throw new Error('No healthy provider available');

  const provider = providers[0];
  const stream = provider === 'gemini'
    ? streamGemini(messages, systemPrompt, signal)
    : streamOpenRouter(messages, systemPrompt, signal);

  let result = '';
  for await (const chunk of stream) {
    result += chunk;
  }
  return result;
}

export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
