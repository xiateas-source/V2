// The Forge — canonical character builder.
//
// Every creation path (Quick Pick, Guided Build, Talk to AI, Import JSON)
// funnels through forgeCharacter(intent). The doors supply *intent* — the
// creative choices a human or AI makes (name, race, class, level, ability
// scores, background, spells, bio). The forge derives every *mechanical*
// field (HP, AC, attacks, resources, features, spell slots, proficiency).
//
// This is Law 2 made literal: the AI cannot emit wrong HP because the AI
// does not emit HP at all — the forge computes it.

import {
  CLASS_DATA, RACE_BONUSES, RACE_SPEED, RACE_LANGUAGES,
  getClassFeatures, CHAR_COLORS, STANDARD_ARRAY, composePersonality, autoSelectSpells,
} from './quickBuild.js';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export function abilityMod(score) {
  return Math.floor(((score || 10) - 10) / 2);
}

export function proficiencyBonus(level) {
  return Math.floor(((level || 1) - 1) / 4) + 2;
}

// Apply racial bonuses to base (pre-racial) scores.
export function applyRacialBonuses(baseScores, race) {
  const result = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ...baseScores };
  const bonuses = RACE_BONUSES[race] || {};
  for (const [k, v] of Object.entries(bonuses)) {
    if (k in result) result[k] += v;
  }
  return result;
}

// Auto-assign the standard array to a class's ability priority order, then
// apply racial bonuses. Used by paths that don't let the player assign scores.
export function autoAssignScores(className, race) {
  const classInfo = CLASS_DATA[className];
  const priority = classInfo?.primaryAbilities || ['str', 'con', 'dex', 'wis', 'int', 'cha'];
  const pool = [...STANDARD_ARRAY];
  const base = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  for (let i = 0; i < priority.length && i < pool.length; i++) {
    base[priority[i]] = pool[i];
  }
  return applyRacialBonuses(base, race);
}

// Normalize a skills input (array of display names OR object map) to a map
// keyed by lowercased, despaced skill name → true.
function normalizeSkills(skills) {
  const map = {};
  if (!skills) return map;
  if (Array.isArray(skills)) {
    for (const s of skills) {
      if (typeof s === 'string') map[s.toLowerCase().replace(/\s+/g, '')] = true;
    }
  } else if (typeof skills === 'object') {
    for (const [k, v] of Object.entries(skills)) {
      if (v) map[k.toLowerCase().replace(/\s+/g, '')] = true;
    }
  }
  return map;
}

// The canonical builder. Takes an intent, returns a fully-derived character.
//
// intent = {
//   name, race, className (or class), level=1, subclass='',
//   abilityScores,          // FINAL scores (post-racial). If omitted, auto-assigned.
//   background='', alignment='',
//   skills,                 // array of names OR object map (class-chosen)
//   extraSkills=[],         // additional skill names (e.g. background) to merge
//   cantrips=[], knownSpells=[],
//   appearance='', personality='', backstory='', notes='',
//   color, existingCount=0,
//   // pass-throughs for unsupported classes (AI/paste):
//   attacks, features, resources, proficiencies, savingThrows, languages,
// }
export async function forgeCharacter(intent) {
  const className = intent.className || intent.class || '';
  const race = intent.race || '';
  const level = Math.max(1, Math.min(20, intent.level || 1));
  const classInfo = CLASS_DATA[className] || null;
  const supported = !!classInfo;

  // --- Ability scores (final, post-racial) ---
  // A truthy-but-empty abilityScores object (an import that found nothing to
  // put in it) must not silently win over a real roll — only treat scores as
  // provided if at least one of the six is actually present.
  const hasScores = intent.abilityScores &&
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].some(k => Number.isFinite(intent.abilityScores[k]));
  const abilities = hasScores
    ? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ...intent.abilityScores }
    : autoAssignScores(className, race);

  const conMod = abilityMod(abilities.con);
  const dexMod = abilityMod(abilities.dex);
  const strMod = abilityMod(abilities.str);
  const profBonus = proficiencyBonus(level);

  // --- Hit points (PHB fixed-average) ---
  const hitDie = classInfo?.hitDie || intent.hitDie || 'd8';
  const hitDieMax = parseInt(hitDie.slice(1)) || 8;
  const hitDieAvg = Math.floor(hitDieMax / 2) + 1;
  const hpMax = Math.max(1, hitDieMax + conMod + (hitDieAvg + conMod) * (level - 1));

  // --- Armor Class ---
  // Each supported class's default starting kit (CLASS_DATA.startingAC) already
  // accounts for its actual starting armor — use it directly instead of
  // re-deriving AC from dex, which only happens to be correct for light-armor
  // classes and is wrong for heavy/medium-armor or unarmored-defense classes.
  let ac;
  if (supported) ac = classInfo.startingAC;
  else ac = (intent.ac && intent.ac > 0) ? intent.ac : 10 + dexMod;

  // --- Attacks ---
  let attacks;
  if (classInfo?.attacks) {
    const atkMod = className === 'Fighter' ? strMod : dexMod;
    attacks = classInfo.attacks.map(a => ({
      ...a,
      bonus: atkMod + profBonus,
      damage: a.damage.replace(/[+-]\d+/, `${atkMod >= 0 ? '+' : ''}${atkMod}`),
    }));
  } else {
    attacks = Array.isArray(intent.attacks) ? intent.attacks : [];
  }

  // --- Class resources ---
  const resources = [];
  if (className === 'Bard') {
    const chaMod = abilityMod(abilities.cha);
    resources.push({
      name: 'Bardic Inspiration', max: Math.max(1, chaMod), current: Math.max(1, chaMod),
      die: level >= 10 ? 'd10' : level >= 5 ? 'd8' : 'd6',
      restoresOn: level >= 5 ? 'short rest' : 'long rest',
    });
  } else if (className === 'Fighter') {
    resources.push({ name: 'Second Wind', max: 1, current: 1, restoresOn: 'short rest' });
    if (level >= 2) resources.push({ name: 'Action Surge', max: 1, current: 1, restoresOn: 'short rest' });
  } else if (className === 'Rogue') {
    resources.push({ name: 'Sneak Attack', max: 1, current: 1, die: `${Math.ceil(level / 2)}d6`, restoresOn: 'turn' });
  } else if (Array.isArray(intent.resources)) {
    resources.push(...intent.resources);
  }

  // --- Spellcasting ---
  const spellSlots = classInfo?.slotTable?.[level] || (supported ? {} : (intent.spellSlots || {}));
  const isCaster = !!(classInfo?.cantrips) || (!supported && (intent.cantrips?.length || intent.knownSpells?.length));
  let cantrips = isCaster ? (intent.cantrips || []) : [];
  let knownSpells = isCaster ? (intent.knownSpells || []) : [];
  // A supported caster must never end up empty. If the door didn't supply
  // spells (Quick Pick, AI/import that omitted them), auto-fill defaults here so
  // every path produces a complete caster.
  if (classInfo?.cantrips && (cantrips.length === 0 || knownSpells.length === 0)) {
    const auto = await autoSelectSpells(className, level);
    if (cantrips.length === 0) cantrips = auto.cantrips;
    if (knownSpells.length === 0) knownSpells = auto.knownSpells;
  }

  // --- Features ---
  let features;
  if (supported) {
    features = await getClassFeatures(className, level);
  } else {
    features = Array.isArray(intent.features) ? intent.features : [];
  }

  // --- Skills ---
  let skills = normalizeSkills(intent.skills);
  if (Object.keys(skills).length === 0 && classInfo?.skills) {
    skills = normalizeSkills(classInfo.skills);
  }
  for (const k of Object.keys(normalizeSkills(intent.extraSkills))) skills[k] = true;

  // --- Proficiencies / saves / languages ---
  const savingThrows = classInfo?.savingThrows || intent.savingThrows || [];
  const proficiencies = classInfo?.proficiencies || intent.proficiencies || [];
  const languages = RACE_LANGUAGES[race] || intent.languages || ['Common'];
  const speed = RACE_SPEED[race] || intent.speed || 30;

  // Structured roleplay fields (Trait/Ideal/Bond/Flaw). Compose a readable
  // personality string so legacy sheets render it; keep the structure too.
  const traits = {
    trait: intent.traits?.trait || '',
    ideal: intent.traits?.ideal || '',
    bond: intent.traits?.bond || '',
    flaw: intent.traits?.flaw || '',
  };
  const composedPersonality = composePersonality(traits);
  const personality = intent.personality || composedPersonality;

  return {
    id: intent.id || `pc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: intent.name || `${race} ${className}`.trim() || 'Adventurer',
    race,
    class: className,
    subclass: intent.subclass || '',
    level,
    xp: intent.xp || 0,
    background: intent.background || '',
    alignment: intent.alignment || '',
    abilityScores: abilities,
    hpMax,
    hp: hpMax,
    hpTemp: 0,
    ac,
    speed,
    hitDice: { die: hitDie, total: level, used: 0 },
    savingThrows,
    skills,
    proficiencies,
    features,
    cantrips,
    knownSpells,
    spellSlots,
    currentSlots: { ...spellSlots },
    resources,
    languages,
    attacks,
    traits,
    color: intent.color || CHAR_COLORS[(intent.existingCount || 0) % CHAR_COLORS.length],
    avatar: intent.avatar || '',
    backstory: intent.backstory || '',
    appearance: intent.appearance || '',
    personality,
    notes: intent.notes || '',
    conditions: [],
    concentration: null,
    exhaustion: 0,
    inspiration: false,
    deathSaves: { successes: 0, failures: 0 },
    familiar: null,
  };
}
