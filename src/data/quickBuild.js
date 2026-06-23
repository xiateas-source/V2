import { getByIndex } from './local.js';

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

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const CHAR_COLORS = ['#4ae0a0', '#a070e0', '#e08040', '#4a9eff', '#e06080', '#e0d040', '#60c0e0'];
export const POINT_BUY_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

export async function buildCharacter({ name, race, className, level }, existingCount = 0) {
  const classInfo = CLASS_DATA[className];
  if (!classInfo) return null;

  const abilities = assignAbilities(classInfo.primaryAbilities, race);
  const conMod = Math.floor((abilities.con - 10) / 2);
  const dexMod = Math.floor((abilities.dex - 10) / 2);
  const hitDieMax = parseInt(classInfo.hitDie.slice(1));
  const hitDieAvg = Math.floor(hitDieMax / 2) + 1;
  const hpMax = hitDieMax + conMod + (hitDieAvg + conMod) * (level - 1);
  const profBonus = Math.floor((level - 1) / 4) + 2;

  let ac = classInfo.startingAC;
  if (className === 'Rogue' || className === 'Bard') {
    ac = 11 + dexMod;
  }

  const attacks = classInfo.attacks.map(a => {
    const abilityMod = className === 'Fighter' ? Math.floor((abilities.str - 10) / 2) : dexMod;
    return { ...a, bonus: abilityMod + profBonus, damage: a.damage.replace(/\+\d+/, `+${abilityMod}`) };
  });

  let spellSlots = {};
  let cantrips = [];
  let knownSpells = [];
  let resources = [];

  if (className === 'Bard') {
    spellSlots = classInfo.slotTable[level] || {};
    cantrips = classInfo.cantrips || [];
    const spellCount = classInfo.spellsKnown[level - 1] || 4;
    try {
      const bardSpells = await getByIndex('spells', 'class', 'Bard');
      const maxSpellLevel = Math.max(...Object.keys(spellSlots).map(Number));
      knownSpells = bardSpells
        .filter(s => s.level > 0 && s.level <= maxSpellLevel)
        .slice(0, spellCount)
        .map(s => s.name);
    } catch (_) {
      knownSpells = ['Healing Word', 'Thunderwave', 'Faerie Fire', 'Dissonant Whispers'].slice(0, spellCount);
    }
    resources.push({ name: 'Bardic Inspiration', max: Math.floor((abilities.cha - 10) / 2) + (level >= 5 ? profBonus : 0) || 1, current: Math.floor((abilities.cha - 10) / 2) || 1, die: level >= 10 ? 'd10' : level >= 5 ? 'd8' : 'd6', restoresOn: level >= 5 ? 'short rest' : 'long rest' });
  }

  if (className === 'Fighter') {
    resources.push({ name: 'Second Wind', max: 1, current: 1, restoresOn: 'short rest' });
    if (level >= 2) resources.push({ name: 'Action Surge', max: 1, current: 1, restoresOn: 'short rest' });
  }

  if (className === 'Rogue') {
    resources.push({ name: 'Sneak Attack', max: 1, current: 1, die: `${Math.ceil(level / 2)}d6`, restoresOn: 'turn' });
  }

  const features = await getClassFeatures(className, level);

  return {
    id: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name || `${race} ${className}`,
    race,
    class: className,
    subclass: '',
    level,
    xp: 0,
    background: '',
    alignment: '',
    abilityScores: abilities,
    hpMax,
    hp: hpMax,
    hpTemp: 0,
    ac,
    speed: RACE_SPEED[race] || 30,
    hitDice: { die: classInfo.hitDie, total: level, used: 0 },
    savingThrows: classInfo.savingThrows,
    skills: classInfo.skills,
    proficiencies: classInfo.proficiencies,
    features,
    cantrips,
    knownSpells,
    spellSlots,
    currentSlots: { ...spellSlots },
    resources,
    languages: RACE_LANGUAGES[race] || ['Common'],
    attacks,
    color: CHAR_COLORS[existingCount % CHAR_COLORS.length],
    backstory: '',
    appearance: '',
    personality: '',
    notes: '',
    conditions: [],
    concentration: null,
    exhaustion: 0,
    inspiration: false,
    deathSaves: { successes: 0, failures: 0 },
    familiar: null,
  };
}

function assignAbilities(priority, race) {
  const scores = [...STANDARD_ARRAY];
  const result = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  for (let i = 0; i < priority.length && i < scores.length; i++) {
    result[priority[i]] = scores[i];
  }
  const bonuses = RACE_BONUSES[race] || {};
  for (const [key, val] of Object.entries(bonuses)) {
    if (key in result) result[key] += val;
  }
  return result;
}

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
