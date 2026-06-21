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

export function markActionUsed(type) {
  if (!store.campaign.combatState.active) return;
  setStore('campaign', 'combatState', 'actionsUsed', type, true);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
