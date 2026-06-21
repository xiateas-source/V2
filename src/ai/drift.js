const GOLD_PATTERNS = /(\d+)\s*(gold|gp|silver|sp|copper|cp|platinum|pp)/i;
const ITEM_GIVE_PATTERNS = /\b(finds?|receives?|picks?\s*up|grabs?|takes?|loots?|hands?\s*(you|them|her|him)|gives?)\b.*?\b[A-Z][a-z]+/;
const NPC_INTRO_PATTERNS = /\b(introduces?\s+(herself|himself|themselves)|"[^"]*,?\s*I'?m\s+[A-Z]|meet\s+[A-Z])/;
const HP_NARRATION = /\b(takes?\s+\d+\s+(points?\s+of\s+)?damage|loses?\s+\d+\s+h(it\s*)?p(oints?)?|heals?\s+\d+)/i;
const ROLL_IN_PROSE = /\b(rolls?\s+(a\s+)?\d+|rolled\s+(a\s+)?\d+|rolls?\s+a\s+natural|nat(ural)?\s+(20|1)|the\s+d(ice|20)\s+(shows?|lands?|comes?\s+up))/i;

export function detectDrift(narrative, mechanics) {
  const warnings = [];
  if (!narrative) return warnings;

  const mechanicKeys = new Set((mechanics || []).map(m => m.key));

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

  if (ROLL_IN_PROSE.test(narrative)) {
    if (!mechanicKeys.has('roll_request')) {
      warnings.push({ type: 'roll', text: 'PC roll resolved in narration — rolls must come from player' });
    }
  }

  return warnings;
}
