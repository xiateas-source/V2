import { store } from '../state/index.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const GEMINI_FALLBACK_ORDER = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
];

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];

function getProviderConfig() {
  const { providers } = store.system;
  return {
    primary: providers.primary,
    geminiModel: providers.geminiModel || 'gemini-3.1-flash-lite',
    geminiKey: providers.geminiKey,
    openrouterKey: providers.openrouterKey,
    health: providers.health,
  };
}

function recordFailure(provider) {
  const health = store.system.providers.health[provider] || { failures: 0, lastFail: null };
  health.failures++;
  health.lastFail = Date.now();
}

function isHealthy(provider) {
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
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
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

export async function* callProvider(messages, systemPrompt, signal) {
  const config = getProviderConfig();
  const providers = config.primary === 'openrouter'
    ? ['openrouter', 'gemini']
    : ['gemini', 'openrouter'];

  let lastError = null;

  for (const provider of providers) {
    if (!isHealthy(provider)) continue;
    const hasKey = provider === 'gemini' ? config.geminiKey : config.openrouterKey;
    if (!hasKey) continue;

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

export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
