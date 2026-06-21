import { store, setStore } from '../state/index.js';
import { createSignal } from 'solid-js';

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

  const actionVerbs = /\b(attacks?|strikes?|slashes?|shoots?|fires?|swings?)\b/ig;
  const bonusVerbs = /\b(bonus\s+action|healing\s+word|misty\s+step|cunning\s+action|second\s+wind)\b/ig;
  const actionCount = [...narrative.matchAll(actionVerbs)].length;

  if (actionCount > 2 && currentActor.type === 'pc') {
    const hasActionSurge = store.campaign.characters.some(c =>
      c.name === currentActor.name && c.features?.some(f =>
        (typeof f === 'string' ? f : f.name || '').toLowerCase().includes('action surge')
      )
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

  if (flags.length) {
    for (const f of flags) addFlag(f);
  }
  return flags;
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

export function markActionUsed(type) {
  if (!store.campaign.combatState.active) return;
  setStore('campaign', 'combatState', 'actionsUsed', type, true);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
