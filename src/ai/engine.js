import { createSignal } from 'solid-js';
import { store, setStore } from '../state/index.js';
import { buildPrompt, buildAskDmPrompt } from './prompt.js';
import { callProvider, callProviderOnce } from './providers.js';
import { extractMechanics, validateMechanics, applyMechanics, buildMechReceipt, getPendingConcentrationInfo } from './mechanics.js';
import { ASK_DM_SYSTEM } from './contracts.js';
import { pruneIfNeeded } from './memory.js';
import { detectDrift } from './drift.js';
import { runGate1, runGate2, runGate3, runGate4, runGate5, runGate6, runGate7, runGate8, runGate9, advanceCombatToNextPC, isAwaitingInitiative } from './gates.js';
import { createNarrativeMsg, createOOCMsg, msgToRole, isPlayMsg } from './messages.js';
import { classifyAction } from './classifier.js';

let activeController = null;
let wasAborted = false;
const [sending, setSending] = createSignal(false);
const [preSendRolls, setPreSendRolls] = createSignal(null);

export function getPreSendRolls() { return preSendRolls(); }
export function clearPreSendRolls() { setPreSendRolls(null); }

export function isSending() { return sending(); }

export function stopGeneration() {
  if (activeController) {
    wasAborted = true;
    activeController.abort();
    activeController = null;
  }
  setSending(false);
}

// A stream error (network drop, provider failure) thrown mid-response leaves the
// in-progress DM message stuck at partial:true with whatever text arrived before
// the throw — it never streams further and never gets finalized, so it renders as
// a permanently cut-off message. Mark it final wherever an error catch block runs,
// for both the narrative and OOC logs (mirrors the AbortError handling in sendMsg).
function finalizeStuckPartial() {
  for (const key of ['narrative', 'ooc']) {
    const list = store.campaign[key];
    const idx = list.length - 1;
    if (list[idx]?.partial) {
      setStore('campaign', key, idx, 'partial', false);
    }
  }
}

function currentActorName() {
  const cs = store.campaign.combatState;
  return cs.initiative[cs.currentTurn]?.name || 'the active character';
}

const DC_DETERMINATION_SYSTEM = `You are assisting a D&D 5e game by picking a Difficulty Class (DC) for one or more skill checks, given the current scene. Standard tiers: Easy=10, Medium=13, Hard=15, Very Hard=18, Nearly Impossible=20+. A routine task in ordinary conditions should stay near the standard tier; genuine obstacles (poor visibility, hostile resistance, exceptional skill required) push it higher; trivial or favorable conditions push it lower. Respond with ONLY one integer per line, in the same order as the checks listed, and nothing else — no words, no explanation, no extra lines.`;

// Pure, unit-testable — clamps each number to 5-30, and rejects the WHOLE
// response (falling back to every roll's own tier default) if the line count
// doesn't match exactly. A misaligned line (a blank line, a stray number in a
// preamble sentence despite instructions) would otherwise shift every
// subsequent index, producing a plausible-looking but wrong DC — worse than an
// out-of-range number, which safely falls back on its own.
export function parseDCResponse(raw, defaults) {
  const nums = (raw || '').trim().split('\n')
    .map(l => parseInt(l.match(/\d+/)?.[0], 10))
    .filter(Number.isFinite);
  if (nums.length !== defaults.length) return defaults;
  return nums.map((n, i) => (n >= 5 && n <= 30) ? n : defaults[i]);
}

// Replaces the classifier's flat DC_TIERS lookup with a contextual one, for
// the small number of rolls a single classified message produces. Never
// blocks the player: a 4s timeout, any provider failure, or a malformed
// response all fall back silently to the classifier's own tier defaults. Uses
// callProviderOnce (not callProvider) deliberately — no retries, no shared
// provider-health poisoning from a call this disposable. A genuine
// player-initiated Stop tap (stopGeneration(), which sets wasAborted) is
// distinguished from this function's own timeout-triggered abort (which
// doesn't touch wasAborted) so the caller can tell the two apart.
async function determineContextualDCs(rolls, playerMessage) {
  const defaults = rolls.map(r => r.dc);
  const recentContext = store.campaign.narrative.slice(-2).map(m => m.content).join('\n').slice(-600);
  const checklist = rolls.map((r, i) => `${i + 1}. ${r.skill} (standard DC ${r.dc})`).join('\n');
  const prompt = `Recent scene:\n${recentContext}\n\nPlayer action: "${playerMessage}"\n\nChecks needed:\n${checklist}\n\nWhat DC fits each, given this specific situation?`;

  activeController = new AbortController();
  const timeoutId = setTimeout(() => activeController?.abort(), 4000);
  let raw = '';
  try {
    raw = await callProviderOnce([{ role: 'user', content: prompt }], DC_DETERMINATION_SYSTEM, activeController.signal);
  } catch (_) {
    // Timeout, abort, or provider failure — parseDCResponse's fallback on an
    // empty/short string handles all three the same way: use the defaults.
  } finally {
    clearTimeout(timeoutId);
    activeController = null;
  }

  const refined = parseDCResponse(raw, defaults);
  return rolls.map((r, i) => ({ ...r, dc: refined[i] }));
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

export async function resumeAfterRolls(rollResultLines, onChunk) {
  const pending = preSendRolls();
  if (!pending) return;

  const originalMessage = pending.originalMessage;
  setPreSendRolls(null);
  setSending(true);
  wasAborted = false;

  try {
    const outcomeBlock = rollResultLines.map(r => {
      if (r.autoFailReason) return `${r.pcName}: ${r.skill} — automatic failure (${r.autoFailReason}, no roll possible) → FAILURE`;
      if (r.isAttack) {
        const dmgPart = r.damage != null ? ` — damage: ${r.damageDetail}` : '';
        return `${r.pcName}: Attack roll — rolled ${r.total} (d20: ${r.d20} ${r.mod >= 0 ? '+' : ''}${r.mod}) vs AC ${r.dc} → ${r.outcome}${dmgPart}`;
      }
      const outcome = r.total >= r.dc ? 'SUCCESS' : 'FAILURE';
      return `${r.pcName}: ${r.skill} check — rolled ${r.total} (d20: ${r.d20} ${r.mod >= 0 ? '+' : ''}${r.mod}) vs DC ${r.dc} → ${outcome}`;
    }).join('\n');

    const contextInject = `PREDETERMINED ROLL RESULTS (these outcomes are final — narrate accordingly, do not contradict or re-roll):\n${outcomeBlock}`;

    const rollSuffix = rollResultLines.map(r => {
      if (r.autoFailReason) return `${r.pcName} automatically fails ${r.skill} (${r.autoFailReason}) — FAILURE`;
      if (r.isAttack) {
        const dmgPart = r.damage != null ? `, damage ${r.damage}` : '';
        return `${r.pcName} rolled ${r.total} for Attack (AC ${r.dc}) — ${r.outcome}${dmgPart}`;
      }
      return `${r.pcName} rolled ${r.total} for ${r.skill} (DC ${r.dc}) — ${r.total >= r.dc ? 'SUCCESS' : 'FAILURE'}`;
    }).join('; ');
    const combinedText = `${originalMessage}\n\n[ROLLS: ${rollSuffix}]`;

    // Update the existing player message (added when classifier intercepted)
    // to include the roll results, instead of adding a duplicate
    const lastPlayerIdx = store.campaign.narrative.length - 1;
    const lastMsg = store.campaign.narrative[lastPlayerIdx];
    if (lastMsg && (lastMsg.type === 'player' || lastMsg.role === 'user')) {
      setStore('campaign', 'narrative', lastPlayerIdx, 'content', combinedText);
    } else {
      const userMsg = createNarrativeMsg('player', combinedText);
      setStore('campaign', 'narrative', [...store.campaign.narrative, userMsg]);
    }

    return await sendNarrative(combinedText, { contextInject, onChunk });
  } catch (e) {
    finalizeStuckPartial();
    const errMsg = createNarrativeMsg('system', `Error: ${e.message}`);
    setStore('campaign', 'narrative', [...store.campaign.narrative, errMsg]);
    throw e;
  } finally {
    setSending(false);
    activeController = null;
  }
}

export async function sendMsg(text, options = {}) {
  if (sending()) return;
  setSending(true);
  wasAborted = false;

  const { tab = 'narrative', contextInject = '', onChunk, combatKickoff = false, skipClassifier = false } = options;

  try {
    if (tab === 'ooc') {
      return await sendOOC(text, onChunk);
    }

    if (!skipClassifier && !combatKickoff && tab === 'narrative') {
      const classification = classifyAction(text);
      if (classification && classification.rolls.length > 0) {
        const userMsg = createNarrativeMsg('player', text);
        setStore('campaign', 'narrative', [...store.campaign.narrative, userMsg]);

        const refinedRolls = await determineContextualDCs(classification.rolls, text);
        if (wasAborted) {
          // Player tapped Stop while the DC lookup was in flight — respect it
          // rather than showing a roll bar for an action they cancelled.
          wasAborted = false;
          window.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Stopped — no roll requested' } }));
          setSending(false);
          return;
        }

        setPreSendRolls({
          rolls: refinedRolls,
          originalMessage: text,
        });
        setSending(false);
        return '__AWAITING_ROLLS__';
      }
    }

    const userMsg = createNarrativeMsg('player', text);
    setStore('campaign', 'narrative', [...store.campaign.narrative, userMsg]);

    return await sendNarrative(text, { contextInject, onChunk, combatKickoff });
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
    finalizeStuckPartial();
    const errMsg = createNarrativeMsg('system', `Error: ${e.message}`);
    setStore('campaign', 'narrative', [...store.campaign.narrative, errMsg]);
    throw e;
  } finally {
    setSending(false);
    activeController = null;
  }
}

async function sendNarrative(text, { contextInject = '', onChunk, combatKickoff = false } = {}) {
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
          setStore('campaign', 'narrative', assistantIdx, 'partial', false);
        }
      }
    }

    let hasPendingRoll = false;

    if (mechanics.length > 0) {
      const { valid, rejected } = validateMechanics(mechanics);
      const applied = applyMechanics(valid);

      const { drops, saves } = getPendingConcentrationInfo();
      for (const save of saves) {
        applied.push({ key: 'roll_request', value: `Constitution|${save.dc}|${save.pc}`, target: '', applied: true });
      }

      // Turn only advances once the current actor's roll is actually resolved.
      // A roll_request for them here means their turn isn't done — the engine
      // was previously advancing immediately on the request, then advancing
      // AGAIN when the player's roll came back through this same function,
      // double-counting the turn. Scoped to the current actor specifically so
      // a forced roll for someone else (e.g. a reaction save) doesn't hold the
      // turn open when the current actor's turn is genuinely over.
      const actorName = currentActorName();
      hasPendingRoll = applied.some(m =>
        m.key === 'roll_request' && m.applied &&
        m.value.split('|')[2]?.trim().toLowerCase() === actorName.toLowerCase()
      );

      const mechReceipt = buildMechReceipt(applied.filter(m => m.applied), rejected);

      if (mechReceipt || drops.length) {
        setStore('campaign', 'narrative', assistantIdx, 'mechReceipt', mechReceipt);
        setStore('campaign', 'narrative', assistantIdx, 'mechanics', { applied, rejected });
      }

      const driftOpts = { playerMessage: text, characters: store.campaign.characters, combatState: store.campaign.combatState };
      const driftWarnings = detectDrift(fullResponse, applied, driftOpts);
      if (driftWarnings.length) {
        setStore('campaign', 'narrative', assistantIdx, 'driftWarnings', driftWarnings);
      }

      const gate1Flags = runGate1(fullResponse, applied, text);
      const gate2Flags = runGate2(applied, fullResponse);
      const gate3Flags = runGate3(fullResponse, applied, text);
      const gate4Flags = runGate4(applied, text);
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
      const driftOpts = { playerMessage: text, characters: store.campaign.characters, combatState: store.campaign.combatState };
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

    // The kickoff placement (inclusive: true) establishes whose turn it is for
    // the first time — it isn't confirming a resolution, so a pending roll
    // shouldn't hold it back. Only the normal, non-kickoff advance is gated.
    if (store.campaign.combatState.active && !isAwaitingInitiative() && !(hasPendingRoll && !combatKickoff)) {
      advanceCombatToNextPC({ inclusive: combatKickoff });
    }

    return fullResponse;
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
