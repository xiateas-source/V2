const GOLD_PATTERNS = /(\d+)\s*(gold|gp|silver|sp|copper|cp|platinum|pp)/i;
// Only fire on a concrete transfer: a give/receive verb immediately followed by
// an article or quantity (then a noun). This avoids tripping on common words
// like "take kindly", "find her", "gives chase" that aren't item exchanges.
const ITEM_GIVE_PATTERNS = /\b((hands?|gives?|tosses?|offers?|passes?)\s+(you|them|her|him|the party)\s+(a|an|the|some|\d+|two|three|four|five)\b|you\s+(find|receive|obtain|acquire|grab|loot|pick\s*up|are\s+given|are\s+handed)\s+(a|an|the|some|\d+|two|three|four|five)\b|(picks?\s+up|loots?|pockets?)\s+(a|an|the|some|\d+)\b)/i;
const NPC_INTRO_PATTERNS = /\b(introduces?\s+(herself|himself|themselves)|"[^"]*,?\s*I'?m\s+[A-Z]|meet\s+[A-Z])/;
const HP_NARRATION = /\b(takes?\s+\d+\s+(points?\s+of\s+)?damage|loses?\s+\d+\s+h(it\s*)?p(oints?)?|heals?\s+\d+)/i;
// Defeat/incapacitation language that carries no explicit number, so HP_NARRATION
// misses it (e.g. "life-support critically fails" instead of "takes 12 damage").
// Scoped to named combatants so it doesn't fire on generic prose.
const STATUS_VERBS = /\b(collapses?|crumples?|drops?(\s+to\s+the\s+ground|\s+dead)?|falls?(\s+silent|\s+still|\s+to\s+the\s+ground)?|goes?\s+(limp|still|silent)|stops?\s+(moving|breathing)|slumps?|dies?|died|killed|defeated|downed|incapacitat\w*|unconscious|knocked\s+out|life[- ]support\s+(fails?|failed|critical)|critical(ly)?\s+(fails?|wound\w*)|destroyed)\b/i;
const ROLL_IN_PROSE = /\b(rolls?\s+(a\s+)?\d+|rolled\s+(a\s+)?\d+|rolls?\s+a\s+natural|nat(ural)?\s+(20|1)|the\s+d(ice|20)\s+(shows?|lands?|comes?\s+up))/i;

import { store } from '../state/index.js';

export function detectDrift(narrative, mechanics, opts = {}) {
  const warnings = [];
  if (!narrative) return warnings;

  const mechanicKeys = new Set((mechanics || []).map(m => m.key));

  if (opts.playerMessage && opts.characters?.length > 1) {
    const mentioned = new Set();
    const msgLower = opts.playerMessage.toLowerCase();
    for (const pc of opts.characters) {
      if (msgLower.includes(pc.name.toLowerCase())) mentioned.add(pc.name);
    }
    if (mentioned.size > 0) {
      const narrativeLower = narrative.toLowerCase();
      const ACTION_VERBS = /\b(attacks?|casts?|swings?|fires?|shoots?|runs?|dashes?|moves?|sneaks?|picks?\s*up|grabs?|throws?|drinks?|uses?)\b/;

      const identity = store.system.playerIdentity;
      const isMulti = identity.mode === 'multi';
      const selectedPCs = identity.selectedPCs || [];

      for (const pc of opts.characters) {
        if (mentioned.has(pc.name)) continue;
        if (isMulti && selectedPCs.length > 0 && !selectedPCs.includes(pc.id) && !selectedPCs.includes('all')) continue;
        const nameIdx = narrativeLower.indexOf(pc.name.toLowerCase());
        if (nameIdx === -1) continue;
        const vicinity = narrative.slice(nameIdx, nameIdx + 80);
        if (ACTION_VERBS.test(vicinity)) {
          warnings.push({ type: 'unmentioned_pc', text: `AI acted for ${pc.name} without player direction` });
        }
      }
    }
  }

  if (GOLD_PATTERNS.test(narrative)) {
    const hasGoldMech = mechanicKeys.has('income') || mechanicKeys.has('expense') || mechanicKeys.has('gp');
    if (!hasGoldMech) {
      warnings.push({ type: 'gold', text: 'Gold mentioned in narration without income/expense mechanic' });
    }
  }

  if (ITEM_GIVE_PATTERNS.test(narrative)) {
    const hasItemMech = mechanicKeys.has('item_add') || mechanicKeys.has('item_remove');
    if (!hasItemMech) {
      warnings.push({ type: 'item', text: 'Item exchange narrated without item_add/item_remove mechanic' });
    }
  }

  if (NPC_INTRO_PATTERNS.test(narrative)) {
    if (!mechanicKeys.has('npc_add')) {
      warnings.push({ type: 'npc', text: 'New NPC introduced without npc_add mechanic' });
    }
  }

  if (HP_NARRATION.test(narrative)) {
    if (!mechanicKeys.has('hp')) {
      warnings.push({ type: 'hp', text: 'HP change narrated without hp mechanic' });
    }
  }

  if (opts.combatState?.active) {
    const hpTargets = new Set();
    for (const m of (mechanics || [])) {
      if (m.key !== 'hp') continue;
      for (const entry of String(m.value || '').split(',')) {
        const name = entry.split('=')[0]?.trim().toLowerCase();
        if (name) hpTargets.add(name);
      }
    }
    const combatants = [
      ...(opts.characters || []),
      ...(opts.combatState.initiative || []).filter(c => c.type !== 'pc'),
    ];
    const narrativeLower = narrative.toLowerCase();
    for (const c of combatants) {
      if (!c?.name || !(c.hp > 0) || hpTargets.has(c.name.toLowerCase())) continue;
      const nameIdx = narrativeLower.indexOf(c.name.toLowerCase());
      if (nameIdx === -1) continue;
      const vicinity = narrative.slice(Math.max(0, nameIdx - 40), nameIdx + 120);
      if (STATUS_VERBS.test(vicinity)) {
        warnings.push({ type: 'combat_status', text: `${c.name}'s status narrated (defeat/incapacitation language) without a matching hp mechanic` });
      }
    }
  }

  if (ROLL_IN_PROSE.test(narrative)) {
    if (!mechanicKeys.has('roll_request')) {
      warnings.push({ type: 'roll', text: 'PC roll resolved in narration — rolls must come from player' });
    }
  }

  return warnings;
}
