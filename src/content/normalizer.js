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
  hpMax: ['hpMax', 'hp_max', 'maxHp', 'max_hp', 'hitPoints', 'hit_points', 'maxHitPoints'],
  ac: ['ac', 'armorClass', 'armor_class', 'AC'],
  speed: ['speed', 'walkSpeed', 'walk_speed', 'movement'],
  knownSpells: ['knownSpells', 'spells_known', 'spellList', 'spell_list', 'spells', 'prepared_spells'],
  cantrips: ['cantrips', 'cantrip_list'],
  proficiencies: ['proficiencies', 'proficiency', 'proficient_in'],
  features: ['features', 'class_features', 'traits', 'abilities'],
  savingThrows: ['savingThrows', 'saving_throws', 'saves'],
  languages: ['languages', 'language_list'],
  attacks: ['attacks', 'weapons', 'weapon_attacks'],
};

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

function mapGenericAI(raw) {
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

  if (raw.hit_dice || raw.hitDie) {
    const hd = raw.hit_dice || raw.hitDie;
    if (typeof hd === 'string') {
      result.hitDice = { die: hd.includes('d') ? hd : `d${hd}`, total: raw.level || 1, used: 0 };
    }
    delete result.hit_dice;
    delete result.hitDie;
  }

  return result;
}

function attemptFuzzyMap(raw) {
  const result = {};
  const lowKeys = {};
  for (const key of Object.keys(raw)) {
    lowKeys[key.toLowerCase().replace(/[_\s-]/g, '')] = key;
  }

  const directFields = ['name', 'race', 'class', 'subclass', 'level', 'background', 'alignment', 'backstory', 'appearance', 'personality'];
  for (const field of directFields) {
    const matchKey = Object.keys(lowKeys).find(k => k.includes(field.toLowerCase()));
    if (matchKey) result[field] = raw[lowKeys[matchKey]];
  }

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

export function validateCharacter(char) {
  const errors = [];
  if (!char.name) errors.push('Name is required');
  if (!char.class) errors.push('Class is required');
  if (!char.race) errors.push('Race is required');
  if (!char.level || char.level < 1) errors.push('Level must be 1+');
  return { valid: errors.length === 0, errors };
}
