import { createSignal } from 'solid-js';
import { store, setStore } from '../state/index.js';
import { buildPrompt, buildAskDmPrompt } from './prompt.js';
import { callProvider } from './providers.js';
import { extractMechanics, validateMechanics, applyMechanics, buildMechReceipt, getPendingConcentrationInfo } from './mechanics.js';
import { ASK_DM_SYSTEM } from './contracts.js';
import { pruneIfNeeded } from './memory.js';
import { detectDrift } from './drift.js';
import { runGate1, runGate2, advanceTurn } from './gates.js';

let activeController = null;
const [sending, setSending] = createSignal(false);

export function isSending() { return sending(); }

export function stopGeneration() {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
  setSending(false);
}

export async function sendMsg(text, options = {}) {
  if (sending()) return;
  setSending(true);

  const { tab = 'narrative', contextInject = '', onChunk } = options;

  try {
    if (tab === 'ooc') {
      return await sendOOC(text, onChunk);
    }

    const userMsg = { role: 'user', content: text, ts: Date.now() };
    setStore('campaign', 'narrative', [...store.campaign.narrative, userMsg]);

    const receipt = contextInject;
    const { prompt: systemPrompt } = await buildPrompt(receipt);

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

      const { drops, saves } = getPendingConcentrationInfo();
      for (const save of saves) {
        applied.push({ key: 'roll_request', value: `Constitution|${save.dc}|${save.pc}`, target: '', applied: true });
      }

      const mechReceipt = buildMechReceipt(applied.filter(m => m.applied), rejected);

      if (mechReceipt || drops.length) {
        setStore('campaign', 'narrative', assistantIdx, 'mechReceipt', mechReceipt);
        setStore('campaign', 'narrative', assistantIdx, 'mechanics', { applied, rejected });
      }

      const driftOpts = { playerMessage: text, characters: store.campaign.characters };
      const driftWarnings = detectDrift(fullResponse, applied, driftOpts);
      if (driftWarnings.length) {
        setStore('campaign', 'narrative', assistantIdx, 'driftWarnings', driftWarnings);
      }

      const gate1Flags = runGate1(fullResponse, applied, text);
      const gate2Flags = runGate2(applied, fullResponse);
      if (gate1Flags.length || gate2Flags.length) {
        setStore('campaign', 'narrative', assistantIdx, 'gateFlags', [...gate1Flags, ...gate2Flags]);
      }

      if (store.campaign.combatState.active && !gate2Flags.length) {
        const hasRoundAdvance = applied.some(m => m.key === 'round_advance');
        const currentActor = store.campaign.combatState.initiative[store.campaign.combatState.currentTurn];
        if (currentActor?.type === 'pc' && !hasRoundAdvance) {
          advanceTurn();
        }
      }
    } else {
      const driftOpts = { playerMessage: text, characters: store.campaign.characters };
      const driftWarnings = detectDrift(fullResponse, [], driftOpts);
      if (driftWarnings.length) {
        setStore('campaign', 'narrative', assistantIdx, 'driftWarnings', driftWarnings);
      }

      const gate1Flags = runGate1(fullResponse, [], text);
      if (gate1Flags.length) {
        setStore('campaign', 'narrative', assistantIdx, 'gateFlags', gate1Flags);
      }
    }

    return fullResponse;
  } catch (e) {
    if (e.name === 'AbortError') return;
    const errMsg = { role: 'system', content: `Error: ${e.message}`, ts: Date.now() };
    setStore('campaign', 'narrative', [...store.campaign.narrative, errMsg]);
    throw e;
  } finally {
    setSending(false);
    activeController = null;
  }
}

function interceptAskDm(text) {
  const lower = text.toLowerCase();
  const inv = /\b(inventory|items?|carrying|backpack|what('?s| do i have))\b/;
  const gold = /\b(gold|money|coins?|gp|how much)\b/;
  const spells = /\b(spells?|cantrips?|what.*(spells?|can i cast))\b/;
  const hp = /\b(h\.?p|hit points?|health|how (hurt|injured))\b/;
  const loc = /\b(where am i|location|where are we)\b/;

  if (inv.test(lower) && !/\b(can|should|would|if)\b/.test(lower)) {
    const carried = store.campaign.inventory?.carried || {};
    const all = Object.values(carried).flat();
    if (all.length === 0) return 'Your inventory is empty. Check the Cargo tab for details.';
    const list = all.slice(0, 10).map(i => `${i.name}${i.qty > 1 ? ' x' + i.qty : ''}`).join(', ');
    return `You're carrying: ${list}${all.length > 10 ? ` (+${all.length - 10} more)` : ''}. Open Cargo for the full list.`;
  }
  if (gold.test(lower) && !/\b(can|should|worth|sell)\b/.test(lower)) {
    const g = store.campaign.gold;
    const parts = [];
    if (g.pp) parts.push(`${g.pp} PP`);
    if (g.gp) parts.push(`${g.gp} GP`);
    if (g.ep) parts.push(`${g.ep} EP`);
    if (g.sp) parts.push(`${g.sp} SP`);
    if (g.cp) parts.push(`${g.cp} CP`);
    return parts.length ? `Party treasury: ${parts.join(', ')}.` : 'Party treasury is empty.';
  }
  if (spells.test(lower) && /\b(what|list|know)\b/.test(lower)) {
    const chars = store.campaign.characters;
    const lines = chars.filter(c => c.knownSpells?.length || c.cantrips?.length).map(c => {
      const all = [...(c.cantrips || []), ...(c.knownSpells || [])];
      return `${c.name}: ${all.join(', ')}`;
    });
    return lines.length ? lines.join('\n') : 'No spellcasters in the party.';
  }
  if (hp.test(lower) && /\b(how|what|check)\b/.test(lower)) {
    const lines = store.campaign.characters.map(c => `${c.name}: ${c.hp}/${c.hpMax} HP${c.conditions.length ? ' [' + c.conditions.map(x => x.name || x).join(', ') + ']' : ''}`);
    return lines.join('\n');
  }
  if (loc.test(lower)) {
    const l = store.campaign.location;
    const t = store.campaign.time;
    const w = store.campaign.weather;
    return `${l || 'Unknown location'}${t ? ' — ' + t : ''}${w ? ', ' + w : ''}`;
  }
  return null;
}

async function sendOOC(text, onChunk) {
  const userMsg = { role: 'user', content: text, ts: Date.now() };
  setStore('campaign', 'ooc', [...store.campaign.ooc, userMsg]);

  const intercepted = interceptAskDm(text);
  if (intercepted) {
    const reply = { role: 'assistant', content: intercepted, ts: Date.now() };
    setStore('campaign', 'ooc', [...store.campaign.ooc, reply]);
    return intercepted;
  }

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
