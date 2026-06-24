import { createSignal } from 'solid-js';
import { store, setStore } from '../state/index.js';
import { buildPrompt, buildAskDmPrompt } from './prompt.js';
import { callProvider } from './providers.js';
import { extractMechanics, validateMechanics, applyMechanics, buildMechReceipt, getPendingConcentrationInfo } from './mechanics.js';
import { ASK_DM_SYSTEM } from './contracts.js';
import { pruneIfNeeded } from './memory.js';
import { detectDrift } from './drift.js';
import { runGate1, runGate2, runGate3, runGate4, runGate5, runGate6, runGate7, runGate8, runGate9, advanceCombatToNextPC, isAwaitingInitiative } from './gates.js';
import { createNarrativeMsg, createOOCMsg, msgToRole, isPlayMsg } from './messages.js';

let activeController = null;
let wasAborted = false;
const [sending, setSending] = createSignal(false);

export function isSending() { return sending(); }

export function stopGeneration() {
  if (activeController) {
    wasAborted = true;
    activeController.abort();
    activeController = null;
  }
  setSending(false);
}

function currentActorName() {
  const cs = store.campaign.combatState;
  return cs.initiative[cs.currentTurn]?.name || 'the active character';
}

// Kickoff violation: the AI should set the scene and resolve NPC turns before the
// first PC, but NOT deal damage to PCs or resolve PC actions.
function kickoffViolation(mechanics) {
  const hpEntries = mechanics.filter(m => m.key === 'hp');
  for (const m of hpEntries) {
    const entries = m.value.split(',').map(e => e.split('=')[0].trim());
    const lower = store.campaign.characters.map(c => c.name.toLowerCase());
    if (entries.some(n => lower.includes(n.toLowerCase()))) {
      return 'PC HP was changed during combat kickoff — no PC actions have been declared yet.';
    }
  }
  if (mechanics.some(m => m.key === 'combat_end')) {
    return 'Combat was ended during kickoff before any PC acted.';
  }
  return null;
}

// Detect the two combat-turn problems worth a re-prompt: resolving a roll in the
// same beat it was requested (incl. ending combat on it), and running more than
// the current actor's single turn.
function combatViolation(mechanics, responseText) {
  const keys = mechanics.map(m => m.key);
  if (keys.includes('roll_request') && keys.includes('combat_end')) {
    return 'A roll was requested and combat was ended in the same response.';
  }
  const g2 = runGate2(mechanics, responseText);
  if (g2.some(f => f.type === 'multi_action' || f.type === 'wrong_turn')) {
    return 'More than the current actor\'s single turn was resolved.';
  }
  return null;
}

export async function sendMsg(text, options = {}) {
  if (sending()) return;
  setSending(true);
  wasAborted = false;

  const { tab = 'narrative', contextInject = '', onChunk, combatKickoff = false } = options;

  try {
    if (tab === 'ooc') {
      return await sendOOC(text, onChunk);
    }

    const userMsg = createNarrativeMsg('player', text);
    setStore('campaign', 'narrative', [...store.campaign.narrative, userMsg]);

    const receipt = contextInject;
    const { prompt: systemPrompt } = await buildPrompt(receipt);

    await pruneIfNeeded('narrative');

    const messages = store.campaign.narrative
      .filter(m => isPlayMsg(m))
      .map(m => ({ role: msgToRole(m), content: m.content }));

    activeController = new AbortController();
    const stream = callProvider(messages, systemPrompt, activeController.signal);

    let fullResponse = '';
    const assistantIdx = store.campaign.narrative.length;
    const dmMsg = createNarrativeMsg('dm', '', { partial: true });
    setStore('campaign', 'narrative', [...store.campaign.narrative, dmMsg]);

    for await (const chunk of stream) {
      fullResponse += chunk;
      setStore('campaign', 'narrative', assistantIdx, 'content', fullResponse);
      if (onChunk) onChunk(chunk, fullResponse);
    }

    activeController = null;
    setStore('campaign', 'narrative', assistantIdx, 'partial', false);

    let mechanics = extractMechanics(fullResponse);

    // Combat: keep the AI to one PC's turn and stop it resolving rolls / ending
    // combat before the dice are in. On a violation, discard and re-prompt once
    // (the player never sees the bad take).
    if (store.campaign.combatState.active && !isAwaitingInitiative()) {
      const reason = combatKickoff ? kickoffViolation(mechanics) : combatViolation(mechanics, fullResponse);
      if (reason) {
        const actorName = currentActorName();
        const correction = combatKickoff
          ? `CORRECTION — combat kickoff rules were broken: ${reason}\nRewrite your response. Set the scene, resolve any NPC/enemy turns that come BEFORE the first player character in initiative order, then STOP and state whose turn it is. Do NOT deal damage to PCs or resolve PC actions — the players haven't acted yet. Do NOT emit combat_end or round_advance.`
          : `CORRECTION — combat turn rules were broken: ${reason}\nRewrite your previous response. Resolve ONLY ${actorName}'s single declared action, plus any enemies that act before the next player character in initiative order, then STOP and state whose turn is next. Do NOT resolve the outcome of a roll you are requesting — emit the roll_request and wait. Do NOT emit combat_end unless an enemy is already at 0 HP. Do NOT emit round_advance (the app tracks rounds). Keep the same scene; just fix the turn scope.`;
        try {
          fullResponse = '';
          setStore('campaign', 'narrative', assistantIdx, 'content', '');
          setStore('campaign', 'narrative', assistantIdx, 'partial', true);
          activeController = new AbortController();
          const retryStream = callProvider([...messages, { role: 'user', content: correction }], systemPrompt, activeController.signal);
          for await (const chunk of retryStream) {
            fullResponse += chunk;
            setStore('campaign', 'narrative', assistantIdx, 'content', fullResponse);
            if (onChunk) onChunk(chunk, fullResponse);
          }
          activeController = null;
          setStore('campaign', 'narrative', assistantIdx, 'partial', false);
          mechanics = extractMechanics(fullResponse);
        } catch (_) {
          // If the retry fails, fall through with whatever we have.
          setStore('campaign', 'narrative', assistantIdx, 'partial', false);
        }
      }
    }

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
      const gate3Flags = runGate3(fullResponse, applied, text);
      const gate4Flags = runGate4(applied);
      const gate5Flags = runGate5(fullResponse, applied, text);
      const gate6Flags = runGate6(fullResponse, applied);
      const gate7Flags = runGate7(fullResponse, applied, text);
      const gate8Flags = runGate8(applied, fullResponse);
      const gate9Flags = runGate9(applied);
      const allGateFlags = [...gate1Flags, ...gate2Flags, ...gate3Flags, ...gate4Flags, ...gate5Flags, ...gate6Flags, ...gate7Flags, ...gate8Flags, ...gate9Flags];
      if (allGateFlags.length) {
        setStore('campaign', 'narrative', assistantIdx, 'gateFlags', allGateFlags);
      }

    } else {
      const driftOpts = { playerMessage: text, characters: store.campaign.characters };
      const driftWarnings = detectDrift(fullResponse, [], driftOpts);
      if (driftWarnings.length) {
        setStore('campaign', 'narrative', assistantIdx, 'driftWarnings', driftWarnings);
      }

      const gate1Flags = runGate1(fullResponse, [], text);
      const gate3Flags = runGate3(fullResponse, [], text);
      const gate5Flags = runGate5(fullResponse, [], text);
      const noMechGateFlags = [...gate1Flags, ...gate3Flags, ...gate5Flags];
      if (noMechGateFlags.length) {
        setStore('campaign', 'narrative', assistantIdx, 'gateFlags', noMechGateFlags);
      }
    }

    // Combat turn engine: code owns the turn pointer. Once initiative is rolled,
    // land the pointer on the next player character. On the kickoff the current
    // actor may itself be the PC who acts first (or an enemy ahead of them), so
    // the search is inclusive; otherwise the active PC just acted, so advance
    // past them. Enemies between PCs are resolved by the AI in its narration.
    if (store.campaign.combatState.active && !isAwaitingInitiative()) {
      advanceCombatToNextPC({ inclusive: combatKickoff });
    }

    return fullResponse;
  } catch (e) {
    if (e.name === 'AbortError') {
      if (wasAborted) {
        const idx = store.campaign.narrative.length - 1;
        setStore('campaign', 'narrative', idx, 'partial', false);
        window.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Response stopped — mechanics skipped' } }));
      }
      wasAborted = false;
      return;
    }
    const errMsg = createNarrativeMsg('system', `Error: ${e.message}`);
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
  const userMsg = createOOCMsg('player', text);
  setStore('campaign', 'ooc', [...store.campaign.ooc, userMsg]);

  const intercepted = interceptAskDm(text);
  if (intercepted) {
    const reply = createOOCMsg('dm_advisory', intercepted);
    setStore('campaign', 'ooc', [...store.campaign.ooc, reply]);
    return intercepted;
  }

  const systemPrompt = ASK_DM_SYSTEM;
  const askPrompt = buildAskDmPrompt(text);

  const messages = [
    ...store.campaign.ooc
      .filter(m => isPlayMsg(m))
      .slice(-6)
      .map(m => ({ role: msgToRole(m), content: m.content })),
  ];
  messages[messages.length - 1] = { role: 'user', content: askPrompt };

  activeController = new AbortController();
  const stream = callProvider(messages, systemPrompt, activeController.signal);

  let fullResponse = '';
  const assistantIdx = store.campaign.ooc.length;
  const dmMsg = createOOCMsg('dm_advisory', '', { partial: true });
  setStore('campaign', 'ooc', [...store.campaign.ooc, dmMsg]);

  for await (const chunk of stream) {
    fullResponse += chunk;
    setStore('campaign', 'ooc', assistantIdx, 'content', fullResponse);
    if (onChunk) onChunk(chunk, fullResponse);
  }

  activeController = null;
  setStore('campaign', 'ooc', assistantIdx, 'partial', false);
  return fullResponse;
}

export function sendTableTalk(text) {
  const msg = createOOCMsg('player', text);
  setStore('campaign', 'ooc', [...store.campaign.ooc, msg]);
}
