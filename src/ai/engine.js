import { store, setStore } from '../state/index.js';
import { buildPrompt, buildAskDmPrompt } from './prompt.js';
import { callProvider } from './providers.js';
import { extractMechanics, validateMechanics, applyMechanics, buildMechReceipt } from './mechanics.js';
import { ASK_DM_SYSTEM } from './contracts.js';
import { pruneIfNeeded } from './memory.js';

let activeController = null;
let sending = false;

export function isSending() { return sending; }

export function stopGeneration() {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
  sending = false;
}

export async function sendMsg(text, options = {}) {
  if (sending) return;
  sending = true;

  const { tab = 'narrative', contextInject = '', onChunk } = options;

  try {
    if (tab === 'ooc') {
      return await sendOOC(text, onChunk);
    }

    const userMsg = { role: 'user', content: text, ts: Date.now() };
    setStore('campaign', 'narrative', [...store.campaign.narrative, userMsg]);

    const receipt = contextInject;
    const { prompt: systemPrompt } = buildPrompt(receipt);

    await pruneIfNeeded('narrative');

    const messages = store.campaign.narrative
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }));

    activeController = new AbortController();
    const stream = callProvider(messages, systemPrompt, activeController.signal);

    let fullResponse = '';
    const assistantIdx = store.campaign.narrative.length;
    setStore('campaign', 'narrative', [...store.campaign.narrative, { role: 'assistant', content: '', ts: Date.now() }]);

    for await (const chunk of stream) {
      fullResponse += chunk;
      setStore('campaign', 'narrative', assistantIdx, 'content', fullResponse);
      if (onChunk) onChunk(chunk, fullResponse);
    }

    activeController = null;

    const mechanics = extractMechanics(fullResponse);
    if (mechanics.length > 0) {
      const { valid, rejected } = validateMechanics(mechanics);
      const applied = applyMechanics(valid);
      const mechReceipt = buildMechReceipt(applied.filter(m => m.applied), rejected);

      if (mechReceipt) {
        setStore('campaign', 'narrative', assistantIdx, 'mechReceipt', mechReceipt);
        setStore('campaign', 'narrative', assistantIdx, 'mechanics', { applied, rejected });
      }
    }

    return fullResponse;
  } catch (e) {
    if (e.name === 'AbortError') return;
    const errMsg = { role: 'system', content: `Error: ${e.message}`, ts: Date.now() };
    setStore('campaign', 'narrative', [...store.campaign.narrative, errMsg]);
    throw e;
  } finally {
    sending = false;
    activeController = null;
  }
}

async function sendOOC(text, onChunk) {
  const userMsg = { role: 'user', content: text, ts: Date.now() };
  setStore('campaign', 'ooc', [...store.campaign.ooc, userMsg]);

  const systemPrompt = ASK_DM_SYSTEM;
  const askPrompt = buildAskDmPrompt(text);

  const messages = [
    ...store.campaign.ooc
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content })),
  ];
  messages[messages.length - 1] = { role: 'user', content: askPrompt };

  activeController = new AbortController();
  const stream = callProvider(messages, systemPrompt, activeController.signal);

  let fullResponse = '';
  const assistantIdx = store.campaign.ooc.length;
  setStore('campaign', 'ooc', [...store.campaign.ooc, { role: 'assistant', content: '', ts: Date.now() }]);

  for await (const chunk of stream) {
    fullResponse += chunk;
    setStore('campaign', 'ooc', assistantIdx, 'content', fullResponse);
    if (onChunk) onChunk(chunk, fullResponse);
  }

  activeController = null;
  return fullResponse;
}
