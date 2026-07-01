import { DEFAULT_CHARACTER } from '../state/campaign.js';

const ABILITY_ALIASES = {
  str: ['str', 'strength', 'STR'],
  dex: ['dex', 'dexterity', 'DEX'],
  con: ['con', 'constitution', 'CON'],
  int: ['int', 'intelligence', 'INT'],
  wis: ['wis', 'wisdom', 'WIS'],
  cha: ['cha', 'charisma', 'CHA'],
};

const FIELD_ALIASES = {
  hpMax: ['hpMax', 'hp_max', 'maxHp', 'max_hp', 'hitPoints', 'hit_points', 'maxHitPoints', 'hp'],
  ac: ['ac', 'armorClass', 'armor_class', 'AC'],
  speed: ['speed', 'walkSpeed', 'walk_speed', 'movement'],
  knownSpells: ['knownSpells', 'spells_known', 'spellList', 'spell_list', 'spells', 'prepared_spells', 'preparedSpellsLevel1'],
  cantrips: ['cantrips', 'cantrip_list'],
  proficiencies: ['proficiencies', 'proficiency', 'proficient_in'],
  features: ['features', 'class_features', 'traits', 'abilities'],
  savingThrows: ['savingThrows', 'saving_throws', 'saves'],
  languages: ['languages', 'language_list'],
  attacks: ['attacks', 'weapons', 'weapon_attacks'],
};

// AI-generated character sheets often group related fields one level deep
// under a semantically-named wrapper (e.g. "attributes": {...}, "combatStats":
// {...}) instead of at the top level. Before fuzzy-matching, fold the contents
// of any of these known wrappers up to the top level so the existing
// alias-matching logic below can find them without duplicating any aliases.
const KNOWN_WRAPPERS = ['attributes', 'stats', 'abilities', 'ability_scores', 'combatStats', 'stat_block', 'magic'];

function flattenKnownWrappers(raw) {
  const flat = { ...raw };
  for (const wrapper of KNOWN_WRAPPERS) {
    const value = raw[wrapper];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flat, value);
    }
  }
  return flat;
}

// appearance/personality/backstory sometimes arrive as a multi-part object
// (e.g. { posture, features, attire, gear }) instead of a single string. Turn
// that into readable prose instead of dropping it or passing the raw object
// through to a plain-text field.
function flattenBio(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return Object.entries(value)
    .filter(([, v]) => typeof v === 'string' && v.trim())
    .map(([k, v]) => `${titleCase(k)}: ${v.trim()}`)
    .join('\n\n');
}

function titleCase(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
}

const TRAIT_KEYS = ['trait', 'ideal', 'bond', 'flaw'];

// personality sometimes doubles as the container for Trait/Ideal/Bond/Flaw
// instead of a sibling "traits" object. Lift those four out (if present) so
// the rest of the app's trait-aware logic (CharCreate's traits fallback,
// forge.js's composePersonality) still works, then flatten whatever's left
// into the personality prose string.
function extractPersonality(value) {
  if (typeof value === 'string' || !value || typeof value !== 'object') {
    return { personality: flattenBio(value), traits: null };
  }
  const hasTraits = TRAIT_KEYS.some(k => typeof value[k] === 'string' && value[k].trim());
  if (!hasTraits) return { personality: flattenBio(value), traits: null };

  const traits = {};
  const rest = {};
  for (const [k, v] of Object.entries(value)) {
    if (TRAIT_KEYS.includes(k)) traits[k] = v;
    else rest[k] = v;
  }
  return { personality: flattenBio(rest), traits };
}

export function detectFormat(json) {
  if (!json || typeof json !== 'object') return 'invalid';
  if (json.abilityScores && json.hpMax !== undefined) return 'native';
  if (json.stats || json.abilities || json.ability_scores) return 'generic-ai';
  if (json.baseHitPoints || json.modifiers) return 'dndbeyond';
  if (json.name && (json.class || json.race)) return 'minimal';
  return 'unknown';
}

export function normalizeCharacter(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const format = detectFormat(raw);

  let normalized;
  switch (format) {
    case 'native': normalized = raw; break;
    case 'generic-ai': normalized = mapGenericAI(raw); break;
    case 'minimal': normalized = raw; break;
    default: normalized = attemptFuzzyMap(raw); break;
  }

  return mergeWithDefaults(normalized);
}

function mapGenericAI(rawInput) {
  const raw = flattenKnownWrappers(rawInput);
  const result = { ...raw };

  const abilities = raw.stats || raw.abilities || raw.ability_scores || raw.abilityScores;
  if (abilities && typeof abilities === 'object') {
    result.abilityScores = {};
    for (const [canonical, aliases] of Object.entries(ABILITY_ALIASES)) {
      for (const alias of aliases) {
        if (abilities[alias] !== undefined) {
          result.abilityScores[canonical] = abilities[alias];
          break;
        }
      }
      if (!result.abilityScores[canonical]) result.abilityScores[canonical] = 10;
    }
    delete result.stats;
    delete result.abilities;
    delete result.ability_scores;
  }

  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (alias !== canonical && raw[alias] !== undefined) {
        result[canonical] = raw[alias];
        delete result[alias];
        break;
      }
    }
  }

  if (raw.hit_dice || raw.hitDie || raw.hitDice) {
    const hd = raw.hit_dice || raw.hitDie || raw.hitDice;
    if (typeof hd === 'string') {
      result.hitDice = { die: hd.includes('d') ? hd : `d${hd}`, total: raw.level || 1, used: 0 };
    }
    delete result.hit_dice;
    delete result.hitDie;
  }

  result.appearance = flattenBio(raw.appearance);
  result.backstory = flattenBio(raw.backstory);
  const { personality, traits } = extractPersonality(raw.personality);
  result.personality = personality;
  if (traits) result.traits = traits;

  return result;
}

function attemptFuzzyMap(rawInput) {
  const raw = flattenKnownWrappers(rawInput);
  const result = {};
  const lowKeys = {};
  for (const key of Object.keys(raw)) {
    lowKeys[key.toLowerCase().replace(/[_\s-]/g, '')] = key;
  }

  const directFields = ['name', 'race', 'class', 'subclass', 'level', 'background', 'alignment'];
  for (const field of directFields) {
    const matchKey = Object.keys(lowKeys).find(k => k.includes(field.toLowerCase()));
    if (matchKey) result[field] = raw[lowKeys[matchKey]];
  }

  // Bio fields get their own flattening pass (below) instead of the plain
  // substring match above, since they may arrive as multi-part objects.
  const bioMatch = (field) => {
    const matchKey = Object.keys(lowKeys).find(k => k.includes(field));
    return matchKey ? raw[lowKeys[matchKey]] : undefined;
  };
  result.appearance = flattenBio(bioMatch('appearance'));
  result.backstory = flattenBio(bioMatch('backstory'));
  const { personality, traits } = extractPersonality(bioMatch('personality'));
  result.personality = personality;
  if (traits) result.traits = traits;

  const hitDiceRaw = bioMatch('hitdice') || bioMatch('hitdie');
  if (typeof hitDiceRaw === 'string') {
    result.hitDice = { die: hitDiceRaw.includes('d') ? hitDiceRaw : `d${hitDiceRaw}`, total: raw.level || 1, used: 0 };
  }

  // Passed straight through for CharCreate.jsx's onCharParsed() to fold into
  // carried inventory (equipment) and notes (racialTraits) — neither has a
  // dedicated character field, so there's nothing to alias-match here.
  if (Array.isArray(raw.equipment)) result.equipment = raw.equipment;
  if (raw.racialTraits && typeof raw.racialTraits === 'object') result.racialTraits = raw.racialTraits;

  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[_\s-]/g, '');
      if (lowKeys[cleanAlias]) {
        result[canonical] = raw[lowKeys[cleanAlias]];
        break;
      }
    }
  }

  if (!result.abilityScores) {
    result.abilityScores = {};
    for (const [canonical, aliases] of Object.entries(ABILITY_ALIASES)) {
      for (const alias of aliases) {
        const cleanAlias = alias.toLowerCase();
        if (lowKeys[cleanAlias]) {
          result.abilityScores[canonical] = raw[lowKeys[cleanAlias]];
          break;
        }
      }
    }
  }

  return result;
}

export function mergeWithDefaults(parsed) {
  const base = structuredClone(DEFAULT_CHARACTER);
  const merged = { ...base };

  for (const [key, value] of Object.entries(parsed || {})) {
    if (value !== undefined && value !== null && value !== '') {
      merged[key] = value;
    }
  }

  if (!merged.id) {
    merged.id = `pc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  }
  if (merged.hpMax && !merged.hp) merged.hp = merged.hpMax;
  if (merged.spellSlots && !merged.currentSlots) merged.currentSlots = { ...merged.spellSlots };
  if (merged.hitDice && typeof merged.hitDice === 'string') {
    merged.hitDice = { die: merged.hitDice, total: merged.level || 1, used: 0 };
  }
  if (!Array.isArray(merged.conditions)) merged.conditions = [];

  return merged;
}

const GOLD_PATTERN = /(\d+)\s*(gp\b|gold(?:\s+(?:coins?|pieces?))?)/i;

// A JSON import's freeform "equipment" list (flavor-text gear descriptions,
// sometimes with a parenthetical aside, sometimes a plain currency line) —
// split into carried-inventory items plus any gold pulled out of it, so an
// imported character's gear populates the same way a guided-created
// character's does, instead of being discarded in favor of class defaults.
export function parseEquipmentList(list) {
  const items = [];
  let gold = 0;
  for (const raw of (list || [])) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const trimmed = raw.trim();
    const goldMatch = trimmed.match(GOLD_PATTERN);
    if (goldMatch) {
      gold += parseInt(goldMatch[1], 10) || 0;
      continue;
    }
    const noteMatch = trimmed.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    if (noteMatch && noteMatch[1].trim()) {
      items.push({ name: noteMatch[1].trim(), qty: 1, type: 'gear', weight: 0, note: noteMatch[2].trim() });
    } else {
      items.push({ name: trimmed, qty: 1, type: 'gear', weight: 0 });
    }
  }
  return { items, gold };
}

export function validateCharacter(char) {
  const errors = [];
  if (!char.name) errors.push('Name is required');
  if (!char.class) errors.push('Class is required');
  if (!char.race) errors.push('Race is required');
  if (!char.level || char.level < 1) errors.push('Level must be 1+');
  return { valid: errors.length === 0, errors };
}
