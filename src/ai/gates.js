import { store, setStore } from '../state/index.js';
import { createSignal } from 'solid-js';
import { createNarrativeMsg } from './messages.js';

const [pendingRolls, setPendingRolls] = createSignal([]);
const [gateFlags, setGateFlags] = createSignal([]);

export function getPendingRolls() { return pendingRolls(); }
export function getGateFlags() { return gateFlags(); }
export function clearGateFlags() { setGateFlags([]); }

export function addPendingRoll(roll) {
  setPendingRolls([...pendingRolls(), roll]);
}

export function removePendingRoll(id) {
  setPendingRolls(pendingRolls().filter(r => r.id !== id));
}

export function resolvePendingRoll(id, result) {
  const roll = pendingRolls().find(r => r.id === id);
  if (!roll) return null;
  removePendingRoll(id);
  return { ...roll, result };
}

function addFlag(flag) {
  setGateFlags([...gateFlags(), { ...flag, id: `gate_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, ts: Date.now() }]);
}

export function dismissFlag(id) {
  setGateFlags(gateFlags().filter(f => f.id !== id));
}

export function runGate1(narrative, mechanics, playerMessage) {
  const flags = [];

  const rollPatterns = [
    /\b(\w+)\s+rolls?\s+(a\s+)?(\d+)/ig,
    /\b(\w+)'?s?\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Athletics|Acrobatics|Sleight of Hand|Stealth|Arcana|History|Investigation|Nature|Religion|Animal Handling|Insight|Medicine|Perception|Survival|Deception|Intimidation|Performance|Persuasion)\s+check\s*(succeeds?|fails?|results?\s+in|of\s+\d+)/ig,
    /\brolled?\s+(a\s+)?nat(ural)?\s+(20|1)\b/ig,
  ];

  const hasRollRequest = mechanics.some(m => m.key === 'roll_request');
  const pending = pendingRolls();

  for (const pattern of rollPatterns) {
    const matches = [...narrative.matchAll(pattern)];
    for (const match of matches) {
      const pcName = match[1];
      const pc = store.campaign.characters.find(c =>
        c.name.toLowerCase() === pcName?.toLowerCase() ||
        c.name.toLowerCase().startsWith(pcName?.toLowerCase())
      );
      if (!pc) continue;

      const wasRequested = pending.some(r =>
        r.pcName?.toLowerCase() === pc.name.toLowerCase() && r.resolved
      );
      if (wasRequested) continue;

      if (!hasRollRequest) {
        const skill = match[2] || 'unknown';
        flags.push({
          gate: 1,
          type: 'fabricated_roll',
          text: `DM resolved ${pc.name}'s ${skill} check without your roll`,
          pcName: pc.name,
          skill,
        });
      }
    }
  }

  if (flags.length) {
    for (const f of flags) addFlag(f);
  }
  return flags;
}

export function runGate2(mechanics, narrative) {
  const combat = store.campaign.combatState;
  if (!combat.active) return [];

  const flags = [];
  const initiative = combat.initiative;
  const currentTurn = combat.currentTurn;
  const currentActor = initiative[currentTurn];

  if (!currentActor || currentActor.type !== 'pc') return flags;

  const pcActions = [];
  for (const pc of store.campaign.characters) {
    const namePattern = new RegExp(`\\b${escapeRegex(pc.name)}\\b.*?\\b(attacks?|casts?|moves?|dashes?|uses?|activates?)\\b`, 'i');
    if (namePattern.test(narrative) && pc.name !== currentActor.name) {
      pcActions.push(pc.name);
    }
  }

  if (pcActions.length > 0) {
    flags.push({
      gate: 2,
      type: 'wrong_turn',
      text: `It's ${currentActor.name}'s turn, but AI acted for: ${pcActions.join(', ')}`,
      expected: currentActor.name,
      acted: pcActions,
    });
  }

  const actionVerbs = /\b(attacks?|strikes?|slashes?|shoots?|fires?|swings?|casts?\s+\w+)\b/ig;
  const bonusVerbs = /\b(bonus\s+action|healing\s+word|misty\s+step|cunning\s+action|second\s+wind|shield\s+master|polearm\s+master|crossbow\s+expert|spiritual\s+weapon|hex|hunter'?s?\s+mark)\b/ig;
  const reactionVerbs = /\b(opportunity\s+attack|counterspell|shield\s+spell|hellish\s+rebuke|reaction)\b/ig;
  const actionCount = [...narrative.matchAll(actionVerbs)].length;
  const bonusCount = [...narrative.matchAll(bonusVerbs)].length;
  const reactionCount = [...narrative.matchAll(reactionVerbs)].length;

  const pcChar = store.campaign.characters.find(c => c.name === currentActor.name);

  if (actionCount > 2 && currentActor.type === 'pc') {
    const hasActionSurge = pcChar?.features?.some(f =>
      (typeof f === 'string' ? f : f.name || '').toLowerCase().includes('action surge')
    );
    if (!hasActionSurge) {
      flags.push({
        gate: 2,
        type: 'multi_action',
        text: `Multiple actions narrated for ${currentActor.name} in one turn`,
        pcName: currentActor.name,
      });
    }
  }

  if (bonusCount > 1) {
    flags.push({
      gate: 2,
      type: 'multi_bonus',
      text: `Multiple bonus actions narrated for ${currentActor.name} — only one per turn`,
      pcName: currentActor.name,
    });
  }

  if (reactionCount > 1) {
    flags.push({
      gate: 2,
      type: 'multi_reaction',
      text: `Multiple reactions narrated for ${currentActor.name} — only one per round`,
      pcName: currentActor.name,
    });
  }

  if (flags.length) {
    for (const f of flags) addFlag(f);
  }
  return flags;
}

export function runGate3(narrative, mechanics, playerMessage) {
  const flags = [];
  const mechanicKeys = new Set(mechanics.map(m => m.key));

  const GOLD_PATTERNS = /(\d+)\s*(gold|gp|silver|sp|copper|cp|platinum|pp)/i;
  const ITEM_GIVE_PATTERNS = /\b(finds?|receives?|picks?\s*up|grabs?|takes?|loots?|hands?\s*(you|them|her|him)|gives?)\b.*?\b[A-Z][a-z]+/;
  const HP_NARRATION = /\b(takes?\s+\d+\s+(points?\s+of\s+)?damage|loses?\s+\d+\s+h(it\s*)?p(oints?)?|heals?\s+\d+)/i;

  if (GOLD_PATTERNS.test(narrative) && !mechanicKeys.has('income') && !mechanicKeys.has('expense') && !mechanicKeys.has('gp')) {
    flags.push({ gate: 3, type: 'drift_gold', text: 'Gold mentioned without mechanic — state may be drifting' });
  }
  if (ITEM_GIVE_PATTERNS.test(narrative) && !mechanicKeys.has('item_add') && !mechanicKeys.has('item_remove')) {
    flags.push({ gate: 3, type: 'drift_item', text: 'Item exchange narrated without mechanic' });
  }
  if (HP_NARRATION.test(narrative) && !mechanicKeys.has('hp')) {
    flags.push({ gate: 3, type: 'drift_hp', text: 'HP change narrated without hp mechanic' });
  }

  if (flags.length) {
    for (const f of flags) addFlag(f);
  }
  return flags;
}

export function runGate4(mechanics) {
  const flags = [];
  const hasLocation = mechanics.some(m => m.key === 'location');
  const hasTime = mechanics.some(m => m.key === 'time');

  if (hasLocation && hasTime) {
    flags.push({
      gate: 4,
      type: 'scene_transition',
      text: 'Scene change detected (location + time) — confirm before continuing',
      action: 'hold',
    });
    addFlag(flags[0]);
  }
  return flags;
}

export function runGate5(narrative, mechanics, playerMessage) {
  const flags = [];
  if (!playerMessage || store.campaign.characters.length <= 1) return flags;

  const mentioned = new Set();
  const msgLower = playerMessage.toLowerCase();
  for (const pc of store.campaign.characters) {
    if (msgLower.includes(pc.name.toLowerCase())) mentioned.add(pc.name);
  }
  if (mentioned.size === 0) return flags;

  const ACTION_VERBS = /\b(attacks?|casts?|swings?|fires?|shoots?|runs?|dashes?|moves?|sneaks?|picks?\s*up|grabs?|throws?|drinks?|uses?)\b/;
  const narrativeLower = narrative.toLowerCase();

  for (const pc of store.campaign.characters) {
    if (mentioned.has(pc.name)) continue;
    const nameIdx = narrativeLower.indexOf(pc.name.toLowerCase());
    if (nameIdx === -1) continue;
    const vicinity = narrative.slice(nameIdx, nameIdx + 80);
    if (ACTION_VERBS.test(vicinity)) {
      flags.push({
        gate: 5,
        type: 'unmentioned_pc',
        text: `AI acted for ${pc.name} — you didn't mention them`,
        pcName: pc.name,
        action: 'accept_or_redirect',
      });
    }
  }

  if (flags.length) {
    for (const f of flags) addFlag(f);
  }
  return flags;
}

export function runGate6(narrative, mechanics) {
  const flags = [];
  const spellCastPattern = /\b(\w+)\s+casts?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  const matches = [...narrative.matchAll(spellCastPattern)];

  for (const match of matches) {
    const casterName = match[1];
    const spellName = match[2];
    const pc = store.campaign.characters.find(c =>
      c.name.toLowerCase() === casterName.toLowerCase() ||
      c.name.toLowerCase().startsWith(casterName.toLowerCase())
    );
    if (!pc) continue;

    const allSpells = [...(pc.cantrips || []), ...(pc.knownSpells || [])];
    if (allSpells.length === 0) continue;

    const known = allSpells.some(s => s.toLowerCase() === spellName.toLowerCase());
    if (!known) {
      flags.push({
        gate: 6,
        type: 'unknown_spell',
        text: `${pc.name} doesn't know ${spellName}`,
        pcName: pc.name,
        spell: spellName,
      });
    }
  }

  const slotUses = mechanics.filter(m => m.key === 'slot_use');
  for (const mech of slotUses) {
    const [name, levelStr] = mech.value.split('=').map(s => s.trim());
    const pc = findPCByName(name);
    if (!pc) continue;
    const current = pc.currentSlots?.[levelStr] || 0;
    const max = pc.spellSlots?.[levelStr] || 0;
    if (max === 0) {
      flags.push({
        gate: 6,
        type: 'no_slots',
        text: `${pc.name} has no level ${levelStr} spell slots`,
        pcName: pc.name,
      });
    }
  }

  if (flags.length) {
    for (const f of flags) addFlag(f);
  }
  return flags;
}

const SKILL_ACTION_MAP = [
  { pattern: /\b(picks?\s+the\s+lock|lockpick|unlock)\b/i, skill: 'Thieves\' Tools' },
  { pattern: /\b(sneaks?\s+(past|by|through|around)|moves?\s+stealthily|creeps?)\b/i, skill: 'Stealth' },
  { pattern: /\b(climbs?\s+(the|up|over|a)|scales?\s+the)\b/i, skill: 'Athletics' },
  { pattern: /\b(persuades?|convinces?|talks?\s+(them|him|her)\s+into)\b/i, skill: 'Persuasion' },
  { pattern: /\b(intimidates?|threatens?|menacing)\b/i, skill: 'Intimidation' },
  { pattern: /\b(deceives?|lies?\s+to|bluffs?)\b/i, skill: 'Deception' },
  { pattern: /\b(searches?\s+(the|for)|investigates?|examines?\s+closely)\b/i, skill: 'Investigation' },
  { pattern: /\b(tracks?|follows?\s+the\s+trail|navigates?)\b/i, skill: 'Survival' },
  { pattern: /\b(leaps?|jumps?\s+(across|over)|acrobatic|tumbles?)\b/i, skill: 'Acrobatics' },
  { pattern: /\b(treats?\s+the\s+wound|stabilizes?|medicine)\b/i, skill: 'Medicine' },
];

export function runGate7(narrative, mechanics, playerMessage) {
  const flags = [];
  const hasRollRequest = mechanics.some(m => m.key === 'roll_request');
  if (hasRollRequest) return flags;

  const resolvedPattern = /\b(succeeds?|successfully|manages?\s+to|fails?\s+to|unable|doesn'?t\s+(soften|budge|agree|relent|comply|accept|believe|waver|yield)|refuses?|rejects?|dismisses?|ignores?|scoffs?|shrugs?\s+off|isn'?t\s+(convinced|persuaded|swayed|moved|impressed))\b/i;

  for (const { pattern, skill } of SKILL_ACTION_MAP) {
    if (pattern.test(narrative)) {
      if (resolvedPattern.test(narrative)) {
        flags.push({
          gate: 7,
          type: 'missing_check',
          text: `${skill} check resolved without player roll`,
          skill,
        });
        addFlag(flags[flags.length - 1]);
        break;
      }
    }
  }
  return flags;
}

export function runGate8(mechanics, recentNarrative) {
  const flags = [];
  const triggerKeys = ['quest_done', 'combat_end', 'chapter_add'];
  const hasTrigger = mechanics.some(m => triggerKeys.includes(m.key));
  if (!hasTrigger) return flags;

  const hasXp = mechanics.some(m => m.key === 'xp');
  if (!hasXp) {
    const trigger = mechanics.find(m => triggerKeys.includes(m.key));
    flags.push({
      gate: 8,
      type: 'missing_xp',
      text: `No XP awarded after ${trigger.key.replace('_', ' ')}`,
    });
    addFlag(flags[0]);
  }
  return flags;
}

export function runGate9(mechanics) {
  const flags = [];
  const itemAdds = mechanics.filter(m => m.key === 'item_add');
  const treasurePatterns = /\b(gem|jewel|treasure|gold|silver|ruby|emerald|diamond|sapphire|pearl|amulet|ring|necklace|bracelet|crown|scepter|goblet)\b/i;

  for (const mech of itemAdds) {
    if (treasurePatterns.test(mech.value)) {
      const hasIncome = mechanics.some(m => m.key === 'income' || m.key === 'gp');
      if (!hasIncome) {
        flags.push({
          gate: 9,
          type: 'missing_value',
          text: `Treasure "${mech.value.split(',')[1]?.trim() || mech.value}" added without gold value`,
        });
        addFlag(flags[flags.length - 1]);
      }
    }
  }
  return flags;
}

function findPCByName(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  return store.campaign.characters.find(pc =>
    pc.name.toLowerCase() === lower ||
    pc.name.toLowerCase().startsWith(lower)
  ) || null;
}

export function advanceTurn() {
  const combat = store.campaign.combatState;
  if (!combat.active) return;

  const next = (combat.currentTurn + 1) % combat.initiative.length;
  setStore('campaign', 'combatState', 'currentTurn', next);
  setStore('campaign', 'combatState', 'actionsUsed', {
    action: false, bonus: false, reaction: false, movement: false,
  });

  if (next === 0) {
    setStore('campaign', 'combatState', 'round', combat.round + 1);
  }
}

// True while combat is up but PCs still owe an initiative roll. During this
// window the engine must NOT advance turns or prompt anyone to act.
export function isAwaitingInitiative() {
  const cs = store.campaign.combatState;
  return cs.active && cs.initiative.some(c => c.rollPending);
}

// The combat turn engine. Code owns the turn pointer (Law 2): the AI narrates
// the turn it is handed and resolves NPCs/enemies up to the next player
// character; this function deterministically lands the pointer on that PC.
// `inclusive` is used on the combat kickoff, where the current actor may itself
// be the first PC (or an enemy ahead of the first PC) and hasn't acted yet.
export function advanceCombatToNextPC({ inclusive = false } = {}) {
  const cs = store.campaign.combatState;
  if (!cs.active) return;
  const init = cs.initiative;
  const len = init.length;
  if (!len) return;

  const start = cs.currentTurn;
  const startStep = inclusive ? 0 : 1;

  for (let step = startStep; step <= len; step++) {
    const idx = (start + step) % len;
    const c = init[idx];
    if (c && c.type === 'pc' && c.hp > 0) {
      const wrapped = step > 0 && (start + step) >= len;
      if (wrapped) {
        const newRound = cs.round + 1;
        setStore('campaign', 'combatState', 'round', newRound);
        pushRoundMarker(newRound);
      }
      setStore('campaign', 'combatState', 'currentTurn', idx);
      setStore('campaign', 'combatState', 'actionsUsed', {
        action: false, bonus: false, reaction: false, movement: false,
      });
      return;
    }
  }
  // No living PC remaining (TPK / all PCs down) — leave the pointer where it is.
  // The AI should emit combat_end; the overlay handles the rest.
}

function pushRoundMarker(round) {
  const msg = createNarrativeMsg('system', `⚔ Round ${round}`, { systemKind: 'combat_event' });
  setStore('campaign', 'narrative', [...store.campaign.narrative, msg]);
}

export function markActionUsed(type) {
  if (!store.campaign.combatState.active) return;
  setStore('campaign', 'combatState', 'actionsUsed', type, true);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
