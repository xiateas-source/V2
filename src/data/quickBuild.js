import { getByIndex } from './local.js';
import { forgeCharacter, autoAssignScores } from './forge.js';

export const RACE_BONUSES = {
  'Human': { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
  'Elf': { dex: 2, int: 1 },
  'Half-Elf': { cha: 2, dex: 1, con: 1 },
  'Dwarf': { con: 2, wis: 1 },
  'Halfling': { dex: 2, cha: 1 },
  'Tiefling': { cha: 2, int: 1 },
};

export const RACE_SPEED = {
  'Human': 30, 'Elf': 30, 'Half-Elf': 30,
  'Dwarf': 25, 'Halfling': 25, 'Tiefling': 30,
};

export const RACE_LANGUAGES = {
  'Human': ['Common', 'one extra'],
  'Elf': ['Common', 'Elvish'],
  'Half-Elf': ['Common', 'Elvish', 'one extra'],
  'Dwarf': ['Common', 'Dwarvish'],
  'Halfling': ['Common', 'Halfling'],
  'Tiefling': ['Common', 'Infernal'],
};

export const CLASS_DATA = {
  'Fighter': {
    hitDie: 'd10',
    primaryAbilities: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    savingThrows: ['str', 'con'],
    proficiencies: ['All armor', 'Shields', 'Simple weapons', 'Martial weapons'],
    startingAC: 16,
    attacks: [{ name: 'Longsword', bonus: 5, damage: '1d8+3', type: 'slashing' }],
    skills: { athletics: true, perception: true },
  },
  'Rogue': {
    hitDie: 'd8',
    primaryAbilities: ['dex', 'con', 'cha', 'int', 'wis', 'str'],
    savingThrows: ['dex', 'int'],
    proficiencies: ['Light armor', 'Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords', "Thieves' tools"],
    startingAC: 14,
    attacks: [{ name: 'Rapier', bonus: 5, damage: '1d8+3', type: 'piercing' }],
    skills: { stealth: true, acrobatics: true, perception: true, sleightOfHand: true },
  },
  'Bard': {
    hitDie: 'd8',
    primaryAbilities: ['cha', 'dex', 'con', 'wis', 'int', 'str'],
    savingThrows: ['dex', 'cha'],
    proficiencies: ['Light armor', 'Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords', 'Three musical instruments'],
    startingAC: 13,
    attacks: [{ name: 'Rapier', bonus: 5, damage: '1d8+3', type: 'piercing' }],
    skills: { performance: true, persuasion: true, deception: true },
    cantrips: ['Vicious Mockery', 'Minor Illusion'],
    cantripsKnown: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4],
    spellsKnown: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14],
    slotTable: {
      1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 },
      5: { 1: 4, 2: 3, 3: 2 }, 6: { 1: 4, 2: 3, 3: 3 }, 7: { 1: 4, 2: 3, 3: 3, 4: 1 },
      8: { 1: 4, 2: 3, 3: 3, 4: 2 }, 9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    },
  },
};

export const STARTING_EQUIPMENT = {
  Fighter: {
    goldOption: 155,
    always: [],
    choices: [
      {
        label: 'Armor',
        options: [
          { label: 'Chain Mail', items: [{ name: 'Chain Mail', qty: 1, type: 'armor', weight: 55 }] },
          { label: 'Leather + Longbow', items: [{ name: 'Leather Armor', qty: 1, type: 'armor', weight: 10 }, { name: 'Longbow', qty: 1, type: 'weapon', weight: 2 }, { name: 'Arrows', qty: 20, type: 'ammo', weight: 1 }] },
        ],
      },
      {
        label: 'Weapon',
        options: [
          { label: 'Longsword + Shield', items: [{ name: 'Longsword', qty: 1, type: 'weapon', weight: 3 }, { name: 'Shield', qty: 1, type: 'armor', weight: 6 }] },
          { label: 'Battleaxe + Shield', items: [{ name: 'Battleaxe', qty: 1, type: 'weapon', weight: 4 }, { name: 'Shield', qty: 1, type: 'armor', weight: 6 }] },
          { label: 'Greatsword', items: [{ name: 'Greatsword', qty: 1, type: 'weapon', weight: 6 }] },
        ],
      },
      {
        label: 'Sidearm',
        options: [
          { label: 'Light Crossbow', items: [{ name: 'Light Crossbow', qty: 1, type: 'weapon', weight: 5 }, { name: 'Bolts', qty: 20, type: 'ammo', weight: 1.5 }] },
          { label: '2 Handaxes', items: [{ name: 'Handaxe', qty: 2, type: 'weapon', weight: 2 }] },
        ],
      },
      {
        label: 'Pack',
        options: [
          { label: "Explorer's Pack", items: [{ name: "Explorer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 rations, waterskin, 50 ft rope' }] },
          { label: "Dungeoneer's Pack", items: [{ name: "Dungeoneer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 rations, waterskin, 50 ft rope' }] },
        ],
      },
    ],
  },
  Rogue: {
    goldOption: 100,
    always: [
      { name: 'Leather Armor', qty: 1, type: 'armor', weight: 10 },
      { name: 'Dagger', qty: 2, type: 'weapon', weight: 1 },
      { name: "Thieves' Tools", qty: 1, type: 'tool', weight: 1 },
    ],
    choices: [
      {
        label: 'Weapon',
        options: [
          { label: 'Rapier', items: [{ name: 'Rapier', qty: 1, type: 'weapon', weight: 2 }] },
          { label: 'Shortsword', items: [{ name: 'Shortsword', qty: 1, type: 'weapon', weight: 2 }] },
        ],
      },
      {
        label: 'Ranged',
        options: [
          { label: 'Shortbow + Arrows', items: [{ name: 'Shortbow', qty: 1, type: 'weapon', weight: 2 }, { name: 'Arrows', qty: 20, type: 'ammo', weight: 1 }] },
          { label: 'Shortsword', items: [{ name: 'Shortsword', qty: 1, type: 'weapon', weight: 2 }] },
        ],
      },
      {
        label: 'Pack',
        options: [
          { label: "Burglar's Pack", items: [{ name: "Burglar's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, ball bearings, string, bell, 5 candles, crowbar, hammer, pitons, lantern, 2 oil flasks, 5 rations, tinderbox, waterskin, 50 ft rope' }] },
          { label: "Dungeoneer's Pack", items: [{ name: "Dungeoneer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 rations, waterskin, 50 ft rope' }] },
          { label: "Explorer's Pack", items: [{ name: "Explorer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 rations, waterskin, 50 ft rope' }] },
        ],
      },
    ],
  },
  Bard: {
    goldOption: 90,
    always: [
      { name: 'Leather Armor', qty: 1, type: 'armor', weight: 10 },
      { name: 'Dagger', qty: 1, type: 'weapon', weight: 1 },
    ],
    choices: [
      {
        label: 'Weapon',
        options: [
          { label: 'Rapier', items: [{ name: 'Rapier', qty: 1, type: 'weapon', weight: 2 }] },
          { label: 'Longsword', items: [{ name: 'Longsword', qty: 1, type: 'weapon', weight: 3 }] },
          { label: 'Handaxe', items: [{ name: 'Handaxe', qty: 1, type: 'weapon', weight: 2 }] },
        ],
      },
      {
        label: 'Pack',
        options: [
          { label: "Entertainer's Pack", items: [{ name: "Entertainer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, bedroll, 2 costumes, 5 candles, 5 rations, waterskin, disguise kit' }] },
          { label: "Diplomat's Pack", items: [{ name: "Diplomat's Pack", qty: 1, type: 'gear', weight: 0, note: 'Chest, 2 map cases, fine clothes, ink, pen, lamp, 2 oil flasks, 5 paper, perfume, sealing wax, soap' }] },
        ],
      },
      {
        label: 'Instrument',
        options: [
          { label: 'Lute', items: [{ name: 'Lute', qty: 1, type: 'instrument', weight: 2 }] },
          { label: 'Flute', items: [{ name: 'Flute', qty: 1, type: 'instrument', weight: 1 }] },
          { label: 'Drum', items: [{ name: 'Drum', qty: 1, type: 'instrument', weight: 3 }] },
        ],
      },
    ],
  },
};

export function getStartingGold(level) {
  if (level <= 1) return 15;
  if (level <= 4) return 15 + (level - 1) * 50;
  return 500 + (level - 4) * 100;
}

export const BACKGROUNDS = [
  { name: 'Acolyte', desc: 'You spent your life in service to a temple.', skillProfs: ['Insight', 'Religion'], languages: 2, feature: 'Shelter of the Faithful' },
  { name: 'Charlatan', desc: 'You have always had a way with people.', skillProfs: ['Deception', 'Sleight of Hand'], toolProfs: ["Disguise kit", "Forgery kit"], feature: 'False Identity' },
  { name: 'Criminal', desc: 'You have a history of breaking the law.', skillProfs: ['Deception', 'Stealth'], toolProfs: ["Thieves' tools", "One gaming set"], feature: 'Criminal Contact' },
  { name: 'Entertainer', desc: 'You thrive in front of an audience.', skillProfs: ['Acrobatics', 'Performance'], toolProfs: ["Disguise kit", "One instrument"], feature: 'By Popular Demand' },
  { name: 'Folk Hero', desc: 'You come from a humble background but are destined for much more.', skillProfs: ['Animal Handling', 'Survival'], toolProfs: ["One artisan tools", "Vehicles (land)"], feature: 'Rustic Hospitality' },
  { name: 'Guild Artisan', desc: 'You are a member of an artisan guild, skilled in a particular craft.', skillProfs: ['Insight', 'Persuasion'], toolProfs: ["One artisan tools"], languages: 1, feature: 'Guild Membership' },
  { name: 'Hermit', desc: 'You lived in seclusion for a formative part of your life.', skillProfs: ['Medicine', 'Religion'], toolProfs: ["Herbalism kit"], languages: 1, feature: 'Discovery' },
  { name: 'Noble', desc: 'You understand wealth, power, and privilege.', skillProfs: ['History', 'Persuasion'], toolProfs: ["One gaming set"], languages: 1, feature: 'Position of Privilege' },
  { name: 'Outlander', desc: 'You grew up in the wilds, far from civilization.', skillProfs: ['Athletics', 'Survival'], toolProfs: ["One instrument"], languages: 1, feature: 'Wanderer' },
  { name: 'Sage', desc: 'You spent years learning the lore of the multiverse.', skillProfs: ['Arcana', 'History'], languages: 2, feature: 'Researcher' },
  { name: 'Sailor', desc: 'You sailed on a seagoing vessel for years.', skillProfs: ['Athletics', 'Perception'], toolProfs: ["Navigator's tools", "Vehicles (water)"], feature: 'Ship\'s Passage' },
  { name: 'Soldier', desc: 'You trained as a soldier and fought in wars.', skillProfs: ['Athletics', 'Intimidation'], toolProfs: ["One gaming set", "Vehicles (land)"], feature: 'Military Rank' },
  { name: 'Urchin', desc: 'You grew up on the streets, alone and poor.', skillProfs: ['Sleight of Hand', 'Stealth'], toolProfs: ["Disguise kit", "Thieves' tools"], feature: 'City Secrets' },
];

export const CLASS_SKILL_CHOICES = {
  Fighter: { count: 2, from: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'] },
  Rogue: { count: 4, from: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'] },
  Bard: { count: 3, from: null },
};

export const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History',
  'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
  'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival',
];

export const SKILL_ABILITIES = {
  Acrobatics: 'dex', 'Animal Handling': 'wis', Arcana: 'int', Athletics: 'str',
  Deception: 'cha', History: 'int', Insight: 'wis', Intimidation: 'cha',
  Investigation: 'int', Medicine: 'wis', Nature: 'int', Perception: 'wis',
  Performance: 'cha', Persuasion: 'cha', Religion: 'int', 'Sleight of Hand': 'dex',
  Stealth: 'dex', Survival: 'wis',
};

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

// PHB suggested characteristics — generic tables used by the wizard's roll
// buttons and Quick Pick. Player-owned roleplay fields (Law 2: player-owned).
export const PERSONALITY_TABLES = {
  trait: [
    'I idolize a particular hero, and constantly refer to their deeds.',
    'I can find common ground between the fiercest enemies.',
    "I'm full of inspiring proverbs for every occasion.",
    'I judge people by their actions, not their words.',
    'I have a crude sense of humor that gets me into trouble.',
    'I face problems head-on — a simple, direct solution is best.',
    'I misuse long words in an attempt to sound smarter.',
    "I'm always calm, no matter what the situation.",
    "I've seen too much to be shocked by anything anymore.",
    "I'm slow to trust members of other races, tribes, and societies.",
  ],
  ideal: [
    'Greater Good. My gifts are meant to be shared with all, not hoarded.',
    'Freedom. Chains are meant to be broken, as are those who forge them.',
    'Power. I will do whatever it takes to become the strongest.',
    "Honor. I don't steal from others in the trade.",
    'Knowledge. The path to power and self-improvement is through learning.',
    'Glory. I must earn glory in battle, for myself and my people.',
    "Independence. I'm a free spirit — no one tells me what to do.",
    "Redemption. There's a spark of good in everyone.",
    'Tradition. The stories and customs of the past must be preserved.',
    'Change. Life is like the seasons, in constant change.',
  ],
  bond: [
    'I would lay down my life for the people I served with.',
    'I owe my life to the person who took me in when I was orphaned.',
    'A mistake I made cost someone their life. Never again.',
    'I protect those who cannot protect themselves.',
    'My family, clan, or tribe is the most important thing in my life.',
    'I will face any challenge to win the approval of my mentor.',
    "Someone powerful killed someone I love. Someday, I'll have my revenge.",
    'I owe a debt I can never fully repay.',
    'I want to be famous, whatever it takes.',
    'I work to preserve a library, university, scriptorium, or monastery.',
  ],
  flaw: [
    "I can't resist a pretty face — or a full coin purse.",
    "I have a 'tell' that reveals when I'm lying.",
    'I turn tail and run when things look bad.',
    'A tyrant who rules my land will stop at nothing to see me dead.',
    'I am convinced no one could ever fool me — yet I am easily fooled.',
    'My sharp tongue lands me in trouble more often than not.',
    "I'd rather kill someone in their sleep than fight fair.",
    'Once someone questions my courage, I never back down.',
    'I have a weakness for the vices of the city.',
    "I'm too greedy for my own good.",
  ],
};

export function rollPersonality(category) {
  const pool = PERSONALITY_TABLES[category] || [];
  return pool[Math.floor(Math.random() * pool.length)] || '';
}

// Roll a full structured personality set.
export function rollTraits() {
  return {
    trait: rollPersonality('trait'), ideal: rollPersonality('ideal'),
    bond: rollPersonality('bond'), flaw: rollPersonality('flaw'),
  };
}

const FLAVOR_BUILD = ['lean', 'wiry', 'broad-shouldered', 'tall', 'compact', 'rangy', 'sturdy', 'willowy'];
const FLAVOR_FEATURE = [
  'a weathered face', 'sharp, watchful eyes', 'an easy grin', 'a quiet, guarded look',
  'an old scar across one brow', 'calloused hands', 'a restless energy', 'a steady, level gaze',
];

// Zero-cost templated flavor for the creative fields, so any path can produce a
// complete, "ready to play" character without an AI call. Player-owned text the
// user can overwrite on the sheet at any time.
export function randomFlavor({ race = '', className = '', background = '', traits = null } = {}) {
  const build = FLAVOR_BUILD[Math.floor(Math.random() * FLAVOR_BUILD.length)];
  const feature = FLAVOR_FEATURE[Math.floor(Math.random() * FLAVOR_FEATURE.length)];
  const appearance = `A ${build} ${(race || 'wanderer').toLowerCase()} with ${feature}, carrying themselves like a ${(className || 'traveler').toLowerCase()} who has walked a few hard roads.`;

  const bg = BACKGROUNDS.find(b => b.name === background);
  const origin = bg ? bg.desc : 'They came up the hard way, learning to rely on their wits.';
  const bond = traits?.bond ? ` ${traits.bond}` : '';
  const backstory = `${origin}${bond}`.trim();

  return { appearance, backstory };
}

// Compose the four structured fields into a single readable personality string
// (for display on sheets that render the legacy personality field).
export function composePersonality(traits) {
  if (!traits) return '';
  const parts = [];
  if (traits.trait) parts.push(traits.trait);
  if (traits.ideal) parts.push(`Ideal: ${traits.ideal}`);
  if (traits.bond) parts.push(`Bond: ${traits.bond}`);
  if (traits.flaw) parts.push(`Flaw: ${traits.flaw}`);
  return parts.join('\n');
}

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const CHAR_COLORS = ['#4ae0a0', '#a070e0', '#e08040', '#4a9eff', '#e06080', '#e0d040', '#60c0e0'];
export const POINT_BUY_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

// Auto-build a complete character from minimal input. Assigns the standard
// array optimally, auto-selects default spells for casters, then funnels the
// intent through the Forge so all mechanical fields are derived in one place.
export async function buildCharacter({ name, race, className, level }, existingCount = 0) {
  const classInfo = CLASS_DATA[className];
  if (!classInfo) return null;

  // Scores are auto-assigned; spells are auto-filled by the Forge for casters.
  return forgeCharacter({
    name, race, className, level, existingCount,
    abilityScores: autoAssignScores(className, race),
  });
}

// Pick sensible default cantrips/spells for a caster up to its known limits.
export async function autoSelectSpells(className, level) {
  const classInfo = CLASS_DATA[className];
  if (!classInfo?.cantrips) return { cantrips: [], knownSpells: [] };

  const slots = classInfo.slotTable?.[level] || {};
  const maxSpellLevel = Math.max(0, ...Object.keys(slots).map(Number));
  const spellCount = classInfo.spellsKnown?.[level - 1] || 4;
  const cantrips = classInfo.cantrips || [];

  let knownSpells = [];
  try {
    const pool = await getByIndex('spells', 'class', className);
    knownSpells = pool
      .filter(s => s.level > 0 && s.level <= maxSpellLevel)
      .slice(0, spellCount)
      .map(s => s.name);
  } catch (_) {}

  // Fall back whenever the lookup yields nothing — empty result OR error. The
  // spell DB isn't always seeded when a character is built; a caster must never
  // end up with zero spells.
  if (knownSpells.length === 0) {
    knownSpells = SPELL_FALLBACK.slice(0, spellCount);
  }
  return { cantrips, knownSpells };
}

const SPELL_FALLBACK = [
  'Healing Word', 'Thunderwave', 'Faerie Fire', 'Dissonant Whispers',
  'Charm Person', 'Cure Wounds', 'Sleep', 'Heroism', 'Bane', 'Detect Magic',
];

export async function getClassFeatures(className, level) {
  try {
    const data = await getByIndex('classData', 'class', className);
    const features = [];
    for (const entry of data) {
      if (entry.level <= level && entry.features) {
        for (const f of entry.features) {
          features.push(typeof f === 'string' ? f : f.name || f);
        }
      }
    }
    return features.length > 0 ? features : getDefaultFeatures(className, level);
  } catch (_) {
    return getDefaultFeatures(className, level);
  }
}

function getDefaultFeatures(className, level) {
  const base = {
    'Fighter': ['Fighting Style', 'Second Wind'],
    'Rogue': ['Expertise', 'Sneak Attack', "Thieves' Cant"],
    'Bard': ['Spellcasting', 'Bardic Inspiration'],
  };
  const features = [...(base[className] || [])];
  if (className === 'Fighter' && level >= 2) features.push('Action Surge');
  if (className === 'Fighter' && level >= 3) features.push('Martial Archetype');
  if (className === 'Rogue' && level >= 2) features.push('Cunning Action');
  if (className === 'Rogue' && level >= 3) features.push('Roguish Archetype');
  if (className === 'Bard' && level >= 2) features.push('Jack of All Trades', 'Song of Rest');
  if (className === 'Bard' && level >= 3) features.push('Bard College', 'Expertise');
  return features;
}

export const AVAILABLE_CLASSES = Object.keys(CLASS_DATA);
export const AVAILABLE_RACES = Object.keys(RACE_BONUSES);

export function getDefaultEquipment(className) {
  const data = STARTING_EQUIPMENT[className];
  if (!data) return [];
  const items = [...(data.always || [])];
  for (const group of (data.choices || [])) {
    const firstOption = group.options[0];
    if (firstOption) items.push(...firstOption.items);
  }
  return items;
}

export function getSelectedEquipment(className, choices) {
  const data = STARTING_EQUIPMENT[className];
  if (!data) return [];
  const items = [...(data.always || [])];
  for (let i = 0; i < (data.choices || []).length; i++) {
    const group = data.choices[i];
    const picked = choices[i] ?? 0;
    const option = group.options[picked];
    if (option) items.push(...option.items);
  }
  return items;
}
