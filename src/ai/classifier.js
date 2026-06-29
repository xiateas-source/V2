import { store } from '../state/index.js';

const ACTION_PATTERNS = [
  // Physical
  { pattern: /\b(search(es|ing)?|look\s+for|investigate|examine\s+closely|rummage|rifle\s+through|inspect)\b/i, skill: 'Investigation', tier: 'medium' },
  { pattern: /\b(look\s+around|scan(s|ning)?|watch(es|ing)?|listen(s|ing)?|keep\s+(an?\s+)?eye|spot|peer|notice)\b/i, skill: 'Perception', tier: 'medium' },
  { pattern: /\b(sneak|sneaks|sneaking|hide[s]?|hiding|creep|slip\s+(past|by|through|around)|move\s+quietly|stealth(ily)?|skulk|prowl)\b/i, skill: 'Stealth', tier: 'medium' },
  { pattern: /\b(climb|scale|jump|leap|swim|lift|shove|grapple|push(es)?\s+(past|through|open)|pull|force\s+open|break\s+down|kick\s+(down|open|in)|batter|ram)\b/i, skill: 'Athletics', tier: 'medium' },
  { pattern: /\b(tumble|dodge[s]?|balance|flip|roll\s+(out|away|under)|acrobatic|cartwheel|backflip|vault|swing\s+(across|from|over))\b/i, skill: 'Acrobatics', tier: 'medium' },
  { pattern: /\b(pick\s+(the\s+)?lock|lockpick|disarm\s+(the\s+)?trap|sleight|pickpocket|steal|palm|plant\s+(the|a|something))\b/i, skill: 'Sleight of Hand', tier: 'hard' },

  // Social
  { pattern: /\b(persuade|convince|negotiate|plea|entreat|reason\s+with|appeal|talk\s+(them|him|her|it)\s+into|calm\s+(them|him|her)\s+down)\b/i, skill: 'Persuasion', tier: 'medium' },
  { pattern: /\b(deceive|lie\s+to|bluff|mislead|trick|pretend|feign|fake|fool)\b/i, skill: 'Deception', tier: 'medium' },
  { pattern: /\b(intimidate|threaten|menace|scare|frighten|bully|coerce|loom|glare\s+at|stare\s+down)\b/i, skill: 'Intimidation', tier: 'medium' },
  { pattern: /\b(perform|play\s+(the|my|a)\s+\w+|sing(s|ing)?|dance[s]?|recite|entertain|juggle)\b/i, skill: 'Performance', tier: 'medium' },

  // Knowledge/Awareness
  { pattern: /\b(track|follow\s+(the\s+)?trail|forage|navigate|find\s+(the\s+)?way|orient|survive|find\s+food|find\s+shelter)\b/i, skill: 'Survival', tier: 'medium' },
  { pattern: /\b(treat|stabilize|bandage|first\s+aid|tend\s+(to\s+)?(the\s+)?wound|medical|diagnose|heal\s+without)\b/i, skill: 'Medicine', tier: 'easy' },
  { pattern: /\b(recall|identify\s+(the\s+)?magic|arcane|recognize\s+(the\s+)?spell|know\s+about\s+.*(magic|arcane|spell))\b/i, skill: 'Arcana', tier: 'medium' },
  { pattern: /\b(calm\s+(the\s+)?(animal|beast|horse|mount)|tame|train|handle\s+(the\s+)?(animal|beast|horse)|ride\s+(through|over|past))\b/i, skill: 'Animal Handling', tier: 'medium' },
  { pattern: /\b(sense\s+motive|read\s+(them|him|her|his|their)|tell\s+if.*(lying|honest|true)|gauge|get\s+a\s+read)\b/i, skill: 'Insight', tier: 'medium' },
  { pattern: /\b(know\s+about\s+.*(history|lore|legend)|recall\s+.*(history|lore)|remember\s+.*(ancient|old|past))\b/i, skill: 'History', tier: 'medium' },
  { pattern: /\b(identify\s+.*(creature|monster|beast|plant)|know\s+about\s+.*(creature|nature|plant|beast))\b/i, skill: 'Nature', tier: 'medium' },
  { pattern: /\b(pray|know\s+about\s+.*(god|deity|religion|undead|fiend)|recognize\s+.*(symbol|holy|unholy))\b/i, skill: 'Religion', tier: 'medium' },
];

const TRIVIAL_PATTERNS = [
  /^\s*(say|tell|ask|speak|talk\s+to|greet|hello|hi|introduce|reply|respond|answer)\b/i,
  /^\s*(open\s+(the\s+)?(unlocked\s+)?door|sit|stand|walk|eat|drink|read\s+(the|a|my)|take\s+out|put\s+away|draw\s+my|sheathe)\b/i,
  /^\s*(look\s+at\b(?!\s+for)|what\s+do|where|who|describe|i\s+(go|head|move|walk)\s+(to|toward|into|back))\b/i,
  /^\s*(cast|use\s+(my|a|the)?\s*(spell|cantrip|ability|feature))\b/i,
  /^\s*(wait|rest|camp|sleep|set\s+up|make\s+camp)\b/i,
  /^\s*(attack|strike|hit|stab|slash|shoot|fire\s+at|swing)\b/i,
];

const DC_TIERS = { easy: 10, medium: 13, hard: 15, very_hard: 18 };

const SKILL_ABILITY = {
  'athletics': 'str', 'acrobatics': 'dex', 'sleight of hand': 'dex',
  'stealth': 'dex', 'arcana': 'int', 'history': 'int',
  'investigation': 'int', 'nature': 'int', 'religion': 'int',
  'animal handling': 'wis', 'insight': 'wis', 'medicine': 'wis',
  'perception': 'wis', 'survival': 'wis', 'deception': 'cha',
  'intimidation': 'cha', 'performance': 'cha', 'persuasion': 'cha',
};

function findBestPC(skill, pcNames) {
  const characters = store.campaign.characters;
  const candidates = pcNames.length > 0
    ? characters.filter(c => pcNames.includes(c.name))
    : characters;

  if (candidates.length === 0) return characters[0]?.name || 'Unknown';
  if (candidates.length === 1) return candidates[0].name;

  const ability = SKILL_ABILITY[skill.toLowerCase()];
  let best = candidates[0];
  let bestScore = -99;

  for (const pc of candidates) {
    const skillKey = skill.toLowerCase().replace(/\s+/g, '');
    const camel = skillKey.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase())
      .replace(/^./, c => c.toLowerCase());
    let score = pc.skills?.[camel] ?? pc.skills?.[skillKey];
    if (score === undefined && ability) {
      const mod = Math.floor(((pc.abilityScores?.[ability] || 10) - 10) / 2);
      score = mod;
    }
    if (score > bestScore) {
      bestScore = score;
      best = pc;
    }
  }
  return best.name;
}

export function classifyAction(playerMessage) {
  if (store.campaign.combatState.active) return null;
  if (!playerMessage || playerMessage.length < 4) return null;

  const trimmed = playerMessage.trim();

  if (/^\s*\?|^(what|where|who|when|why|how|is|are|do|does|can|could|should|would)\b/i.test(trimmed)) {
    return null;
  }

  const isTrivial = TRIVIAL_PATTERNS.some(p => p.test(trimmed));
  const skillMatches = [];
  for (const { pattern, skill, tier } of ACTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      skillMatches.push({ skill, tier });
    }
  }

  if (skillMatches.length === 0) return null;
  if (isTrivial && skillMatches.length === 0) return null;

  const characters = store.campaign.characters;
  const mentionedPCs = [];
  const msgLower = trimmed.toLowerCase();

  for (const pc of characters) {
    const firstName = pc.name.split(' ')[0].toLowerCase();
    if (msgLower.includes(pc.name.toLowerCase()) || msgLower.includes(firstName)) {
      mentionedPCs.push(pc.name);
    }
  }

  const rolls = [];
  const seen = new Set();

  for (const match of skillMatches) {
    if (seen.has(match.skill)) continue;
    seen.add(match.skill);

    const pcName = findBestPC(match.skill, mentionedPCs);
    rolls.push({
      skill: match.skill,
      dc: DC_TIERS[match.tier] || 13,
      pcName,
    });
  }

  if (rolls.length === 0) return null;

  return {
    rolls,
    originalMessage: trimmed,
  };
}
