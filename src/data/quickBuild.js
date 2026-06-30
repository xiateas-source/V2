import { getByIndex, getSpellsForClass } from './local.js';
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
    cantripsKnown: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    spellsKnown: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
    slotTable: {
      1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 },
      5: { 1: 4, 2: 3, 3: 2 }, 6: { 1: 4, 2: 3, 3: 3 }, 7: { 1: 4, 2: 3, 3: 3, 4: 1 },
      8: { 1: 4, 2: 3, 3: 3, 4: 2 }, 9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
      11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
      18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
      20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
    },
  },
  'Barbarian': {
    hitDie: 'd12',
    primaryAbilities: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    savingThrows: ['str', 'con'],
    proficiencies: ['Light armor', 'Medium armor', 'Shields', 'Simple weapons', 'Martial weapons'],
    startingAC: 15,
    attacks: [{ name: 'Greataxe', bonus: 5, damage: '1d12+3', type: 'slashing' }],
    skills: { athletics: true, perception: true },
  },
  'Cleric': {
    hitDie: 'd8',
    primaryAbilities: ['wis', 'con', 'str', 'cha', 'dex', 'int'],
    savingThrows: ['wis', 'cha'],
    proficiencies: ['Light armor', 'Medium armor', 'Shields', 'Simple weapons'],
    startingAC: 16,
    attacks: [{ name: 'Mace', bonus: 4, damage: '1d6+2', type: 'bludgeoning' }],
    skills: { medicine: true, religion: true },
    cantrips: ['Sacred Flame', 'Guidance', 'Toll the Dead'],
    cantripsKnown: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    slotTable: {
      1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 },
      5: { 1: 4, 2: 3, 3: 2 }, 6: { 1: 4, 2: 3, 3: 3 }, 7: { 1: 4, 2: 3, 3: 3, 4: 1 },
      8: { 1: 4, 2: 3, 3: 3, 4: 2 }, 9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
      11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 }, 12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 }, 16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
    },
  },
  'Druid': {
    hitDie: 'd8',
    primaryAbilities: ['wis', 'con', 'dex', 'int', 'cha', 'str'],
    savingThrows: ['int', 'wis'],
    proficiencies: ['Light armor', 'Medium armor', 'Shields (non-metal)', 'Simple weapons'],
    startingAC: 14,
    attacks: [{ name: 'Quarterstaff', bonus: 4, damage: '1d6+2', type: 'bludgeoning' }],
    skills: { nature: true, perception: true },
    cantrips: ['Druidcraft', 'Produce Flame'],
    cantripsKnown: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    slotTable: {
      1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 },
      5: { 1: 4, 2: 3, 3: 2 }, 6: { 1: 4, 2: 3, 3: 3 }, 7: { 1: 4, 2: 3, 3: 3, 4: 1 },
      8: { 1: 4, 2: 3, 3: 3, 4: 2 }, 9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
      11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 }, 12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 }, 16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
    },
  },
  'Monk': {
    hitDie: 'd8',
    primaryAbilities: ['dex', 'wis', 'con', 'str', 'cha', 'int'],
    savingThrows: ['str', 'dex'],
    proficiencies: ['Simple weapons', 'Shortswords'],
    startingAC: 15,
    attacks: [{ name: 'Unarmed Strike', bonus: 5, damage: '1d6+3', type: 'bludgeoning' }],
    skills: { acrobatics: true, stealth: true },
  },
  'Paladin': {
    hitDie: 'd10',
    primaryAbilities: ['str', 'cha', 'con', 'wis', 'dex', 'int'],
    savingThrows: ['wis', 'cha'],
    proficiencies: ['All armor', 'Shields', 'Simple weapons', 'Martial weapons'],
    startingAC: 18,
    attacks: [{ name: 'Longsword', bonus: 5, damage: '1d8+3', type: 'slashing' }],
    skills: { athletics: true, religion: true },
    slotTable: {
      2: { 1: 2 }, 3: { 1: 3 }, 4: { 1: 3 }, 5: { 1: 4, 2: 2 }, 6: { 1: 4, 2: 2 },
      7: { 1: 4, 2: 3 }, 8: { 1: 4, 2: 3 }, 9: { 1: 4, 2: 3, 3: 2 }, 10: { 1: 4, 2: 3, 3: 2 },
      11: { 1: 4, 2: 3, 3: 3 }, 12: { 1: 4, 2: 3, 3: 3 }, 13: { 1: 4, 2: 3, 3: 3, 4: 1 },
      14: { 1: 4, 2: 3, 3: 3, 4: 1 }, 15: { 1: 4, 2: 3, 3: 3, 4: 2 }, 16: { 1: 4, 2: 3, 3: 3, 4: 2 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    },
  },
  'Ranger': {
    hitDie: 'd10',
    primaryAbilities: ['dex', 'wis', 'con', 'str', 'cha', 'int'],
    savingThrows: ['str', 'dex'],
    proficiencies: ['Light armor', 'Medium armor', 'Shields', 'Simple weapons', 'Martial weapons'],
    startingAC: 15,
    attacks: [{ name: 'Longbow', bonus: 5, damage: '1d8+3', type: 'piercing' }],
    skills: { nature: true, perception: true, stealth: true },
    slotTable: {
      2: { 1: 2 }, 3: { 1: 3 }, 4: { 1: 3 }, 5: { 1: 4, 2: 2 }, 6: { 1: 4, 2: 2 },
      7: { 1: 4, 2: 3 }, 8: { 1: 4, 2: 3 }, 9: { 1: 4, 2: 3, 3: 2 }, 10: { 1: 4, 2: 3, 3: 2 },
      11: { 1: 4, 2: 3, 3: 3 }, 12: { 1: 4, 2: 3, 3: 3 }, 13: { 1: 4, 2: 3, 3: 3, 4: 1 },
      14: { 1: 4, 2: 3, 3: 3, 4: 1 }, 15: { 1: 4, 2: 3, 3: 3, 4: 2 }, 16: { 1: 4, 2: 3, 3: 3, 4: 2 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    },
  },
  'Sorcerer': {
    hitDie: 'd6',
    primaryAbilities: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
    savingThrows: ['con', 'cha'],
    proficiencies: ['Simple weapons'],
    startingAC: 12,
    attacks: [{ name: 'Fire Bolt', bonus: 5, damage: '1d10', type: 'fire' }],
    skills: { arcana: true, persuasion: true },
    cantrips: ['Fire Bolt', 'Prestidigitation', 'Ray of Frost', 'Shocking Grasp'],
    cantripsKnown: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    spellsKnown: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
    slotTable: {
      1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 },
      5: { 1: 4, 2: 3, 3: 2 }, 6: { 1: 4, 2: 3, 3: 3 }, 7: { 1: 4, 2: 3, 3: 3, 4: 1 },
      8: { 1: 4, 2: 3, 3: 3, 4: 2 }, 9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
      11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 }, 12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 }, 16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
    },
  },
  'Warlock': {
    hitDie: 'd8',
    primaryAbilities: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
    savingThrows: ['wis', 'cha'],
    proficiencies: ['Light armor', 'Simple weapons'],
    startingAC: 13,
    attacks: [{ name: 'Eldritch Blast', bonus: 5, damage: '1d10', type: 'force' }],
    skills: { arcana: true, deception: true },
    cantrips: ['Eldritch Blast', 'Minor Illusion'],
    cantripsKnown: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    spellsKnown: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
    slotTable: {
      1: { 1: 1 }, 2: { 1: 2 }, 3: { 2: 2 }, 4: { 2: 2 },
      5: { 3: 2 }, 6: { 3: 2 }, 7: { 4: 2 }, 8: { 4: 2 },
      9: { 5: 2 }, 10: { 5: 2 }, 11: { 5: 3 }, 12: { 5: 3 },
      13: { 5: 3 }, 14: { 5: 3 }, 15: { 5: 3 }, 16: { 5: 3 },
      17: { 5: 4 }, 18: { 5: 4 }, 19: { 5: 4 }, 20: { 5: 4 },
    },
  },
  'Wizard': {
    hitDie: 'd6',
    primaryAbilities: ['int', 'con', 'dex', 'wis', 'cha', 'str'],
    savingThrows: ['int', 'wis'],
    proficiencies: ['Simple weapons'],
    startingAC: 12,
    attacks: [{ name: 'Fire Bolt', bonus: 5, damage: '1d10', type: 'fire' }],
    skills: { arcana: true, investigation: true },
    cantrips: ['Fire Bolt', 'Mage Hand', 'Prestidigitation'],
    cantripsKnown: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    slotTable: {
      1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 },
      5: { 1: 4, 2: 3, 3: 2 }, 6: { 1: 4, 2: 3, 3: 3 }, 7: { 1: 4, 2: 3, 3: 3, 4: 1 },
      8: { 1: 4, 2: 3, 3: 3, 4: 2 }, 9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
      11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 }, 12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 }, 16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
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
  Barbarian: {
    goldOption: 50,
    always: [
      { name: 'Javelin', qty: 4, type: 'weapon', weight: 2 },
      { name: "Explorer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 rations, waterskin, 50 ft rope' },
    ],
    choices: [
      {
        label: 'Weapon',
        options: [
          { label: 'Greataxe', items: [{ name: 'Greataxe', qty: 1, type: 'weapon', weight: 7 }] },
          { label: 'Longsword', items: [{ name: 'Longsword', qty: 1, type: 'weapon', weight: 3 }] },
        ],
      },
      {
        label: 'Secondary',
        options: [
          { label: '2 Handaxes', items: [{ name: 'Handaxe', qty: 2, type: 'weapon', weight: 2 }] },
          { label: 'Spear', items: [{ name: 'Spear', qty: 1, type: 'weapon', weight: 3 }] },
        ],
      },
    ],
  },
  Cleric: {
    goldOption: 125,
    always: [
      { name: 'Shield', qty: 1, type: 'armor', weight: 6 },
      { name: 'Holy Symbol', qty: 1, type: 'component', weight: 1 },
    ],
    choices: [
      {
        label: 'Weapon',
        options: [
          { label: 'Mace', items: [{ name: 'Mace', qty: 1, type: 'weapon', weight: 4 }] },
          { label: 'Warhammer', items: [{ name: 'Warhammer', qty: 1, type: 'weapon', weight: 2 }] },
        ],
      },
      {
        label: 'Armor',
        options: [
          { label: 'Scale Mail', items: [{ name: 'Scale Mail', qty: 1, type: 'armor', weight: 45 }] },
          { label: 'Leather Armor', items: [{ name: 'Leather Armor', qty: 1, type: 'armor', weight: 10 }] },
          { label: 'Chain Mail', items: [{ name: 'Chain Mail', qty: 1, type: 'armor', weight: 55 }] },
        ],
      },
      {
        label: 'Ranged',
        options: [
          { label: 'Light Crossbow + Bolts', items: [{ name: 'Light Crossbow', qty: 1, type: 'weapon', weight: 5 }, { name: 'Bolts', qty: 20, type: 'ammo', weight: 1.5 }] },
          { label: 'Spear', items: [{ name: 'Spear', qty: 1, type: 'weapon', weight: 3 }] },
        ],
      },
      {
        label: 'Pack',
        options: [
          { label: "Priest's Pack", items: [{ name: "Priest's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, blanket, 10 candles, tinderbox, alms box, 2 blocks incense, censer, vestments, 2 rations, waterskin' }] },
          { label: "Explorer's Pack", items: [{ name: "Explorer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 rations, waterskin, 50 ft rope' }] },
        ],
      },
    ],
  },
  Druid: {
    goldOption: 50,
    always: [
      { name: 'Leather Armor', qty: 1, type: 'armor', weight: 10 },
      { name: "Explorer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 rations, waterskin, 50 ft rope' },
      { name: 'Druidic Focus', qty: 1, type: 'component', weight: 0, note: 'Sprig of mistletoe' },
    ],
    choices: [
      {
        label: 'Off-Hand',
        options: [
          { label: 'Wooden Shield', items: [{ name: 'Wooden Shield', qty: 1, type: 'armor', weight: 6 }] },
          { label: 'Dagger', items: [{ name: 'Dagger', qty: 1, type: 'weapon', weight: 1 }] },
        ],
      },
      {
        label: 'Weapon',
        options: [
          { label: 'Scimitar', items: [{ name: 'Scimitar', qty: 1, type: 'weapon', weight: 3 }] },
          { label: 'Quarterstaff', items: [{ name: 'Quarterstaff', qty: 1, type: 'weapon', weight: 4 }] },
        ],
      },
    ],
  },
  Monk: {
    goldOption: 13,
    always: [
      { name: 'Darts', qty: 10, type: 'weapon', weight: 0.25 },
    ],
    choices: [
      {
        label: 'Weapon',
        options: [
          { label: 'Shortsword', items: [{ name: 'Shortsword', qty: 1, type: 'weapon', weight: 2 }] },
          { label: 'Quarterstaff', items: [{ name: 'Quarterstaff', qty: 1, type: 'weapon', weight: 4 }] },
        ],
      },
      {
        label: 'Pack',
        options: [
          { label: "Dungeoneer's Pack", items: [{ name: "Dungeoneer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 rations, waterskin, 50 ft rope' }] },
          { label: "Explorer's Pack", items: [{ name: "Explorer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 rations, waterskin, 50 ft rope' }] },
        ],
      },
    ],
  },
  Paladin: {
    goldOption: 125,
    always: [
      { name: 'Chain Mail', qty: 1, type: 'armor', weight: 55 },
      { name: 'Holy Symbol', qty: 1, type: 'component', weight: 1 },
    ],
    choices: [
      {
        label: 'Weapon',
        options: [
          { label: 'Longsword + Shield', items: [{ name: 'Longsword', qty: 1, type: 'weapon', weight: 3 }, { name: 'Shield', qty: 1, type: 'armor', weight: 6 }] },
          { label: '2 Longswords', items: [{ name: 'Longsword', qty: 2, type: 'weapon', weight: 3 }] },
        ],
      },
      {
        label: 'Secondary',
        options: [
          { label: '5 Javelins', items: [{ name: 'Javelin', qty: 5, type: 'weapon', weight: 2 }] },
          { label: 'Mace', items: [{ name: 'Mace', qty: 1, type: 'weapon', weight: 4 }] },
        ],
      },
      {
        label: 'Pack',
        options: [
          { label: "Priest's Pack", items: [{ name: "Priest's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, blanket, 10 candles, tinderbox, alms box, 2 blocks incense, censer, vestments, 2 rations, waterskin' }] },
          { label: "Explorer's Pack", items: [{ name: "Explorer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 rations, waterskin, 50 ft rope' }] },
        ],
      },
    ],
  },
  Ranger: {
    goldOption: 125,
    always: [
      { name: 'Longbow', qty: 1, type: 'weapon', weight: 2 },
      { name: 'Arrows', qty: 20, type: 'ammo', weight: 1 },
    ],
    choices: [
      {
        label: 'Armor',
        options: [
          { label: 'Scale Mail', items: [{ name: 'Scale Mail', qty: 1, type: 'armor', weight: 45 }] },
          { label: 'Leather Armor', items: [{ name: 'Leather Armor', qty: 1, type: 'armor', weight: 10 }] },
        ],
      },
      {
        label: 'Weapon',
        options: [
          { label: '2 Shortswords', items: [{ name: 'Shortsword', qty: 2, type: 'weapon', weight: 2 }] },
          { label: '2 Handaxes', items: [{ name: 'Handaxe', qty: 2, type: 'weapon', weight: 2 }] },
        ],
      },
      {
        label: 'Pack',
        options: [
          { label: "Dungeoneer's Pack", items: [{ name: "Dungeoneer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 rations, waterskin, 50 ft rope' }] },
          { label: "Explorer's Pack", items: [{ name: "Explorer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 rations, waterskin, 50 ft rope' }] },
        ],
      },
    ],
  },
  Sorcerer: {
    goldOption: 75,
    always: [
      { name: 'Dagger', qty: 2, type: 'weapon', weight: 1 },
    ],
    choices: [
      {
        label: 'Weapon',
        options: [
          { label: 'Light Crossbow + Bolts', items: [{ name: 'Light Crossbow', qty: 1, type: 'weapon', weight: 5 }, { name: 'Bolts', qty: 20, type: 'ammo', weight: 1.5 }] },
          { label: 'Quarterstaff', items: [{ name: 'Quarterstaff', qty: 1, type: 'weapon', weight: 4 }] },
        ],
      },
      {
        label: 'Focus',
        options: [
          { label: 'Component Pouch', items: [{ name: 'Component Pouch', qty: 1, type: 'component', weight: 2 }] },
          { label: 'Arcane Focus', items: [{ name: 'Arcane Focus (Crystal)', qty: 1, type: 'component', weight: 1 }] },
        ],
      },
      {
        label: 'Pack',
        options: [
          { label: "Dungeoneer's Pack", items: [{ name: "Dungeoneer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 rations, waterskin, 50 ft rope' }] },
          { label: "Explorer's Pack", items: [{ name: "Explorer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 rations, waterskin, 50 ft rope' }] },
        ],
      },
    ],
  },
  Warlock: {
    goldOption: 100,
    always: [
      { name: 'Leather Armor', qty: 1, type: 'armor', weight: 10 },
      { name: 'Dagger', qty: 2, type: 'weapon', weight: 1 },
    ],
    choices: [
      {
        label: 'Weapon',
        options: [
          { label: 'Light Crossbow + Bolts', items: [{ name: 'Light Crossbow', qty: 1, type: 'weapon', weight: 5 }, { name: 'Bolts', qty: 20, type: 'ammo', weight: 1.5 }] },
          { label: 'Sickle', items: [{ name: 'Sickle', qty: 1, type: 'weapon', weight: 2 }] },
        ],
      },
      {
        label: 'Focus',
        options: [
          { label: 'Component Pouch', items: [{ name: 'Component Pouch', qty: 1, type: 'component', weight: 2 }] },
          { label: 'Arcane Focus', items: [{ name: 'Arcane Focus (Wand)', qty: 1, type: 'component', weight: 1 }] },
        ],
      },
      {
        label: 'Pack',
        options: [
          { label: "Scholar's Pack", items: [{ name: "Scholar's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, book of lore, ink, ink pen, 10 parchment, bag of sand, small knife' }] },
          { label: "Dungeoneer's Pack", items: [{ name: "Dungeoneer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 rations, waterskin, 50 ft rope' }] },
        ],
      },
    ],
  },
  Wizard: {
    goldOption: 100,
    always: [
      { name: 'Spellbook', qty: 1, type: 'component', weight: 3 },
    ],
    choices: [
      {
        label: 'Weapon',
        options: [
          { label: 'Quarterstaff', items: [{ name: 'Quarterstaff', qty: 1, type: 'weapon', weight: 4 }] },
          { label: 'Dagger', items: [{ name: 'Dagger', qty: 1, type: 'weapon', weight: 1 }] },
        ],
      },
      {
        label: 'Focus',
        options: [
          { label: 'Component Pouch', items: [{ name: 'Component Pouch', qty: 1, type: 'component', weight: 2 }] },
          { label: 'Arcane Focus', items: [{ name: 'Arcane Focus (Crystal)', qty: 1, type: 'component', weight: 1 }] },
        ],
      },
      {
        label: 'Pack',
        options: [
          { label: "Scholar's Pack", items: [{ name: "Scholar's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, book of lore, ink, ink pen, 10 parchment, bag of sand, small knife' }] },
          { label: "Explorer's Pack", items: [{ name: "Explorer's Pack", qty: 1, type: 'gear', weight: 0, note: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 rations, waterskin, 50 ft rope' }] },
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

// One-line plain-language skill descriptions for tap-to-source in the wizard.
// Keeps a new (or child) player from picking skills blind.
export const SKILL_DESC = {
  Acrobatics: 'Keep your balance, tumble, and stay on your feet in tricky spots.',
  'Animal Handling': 'Calm, train, or read the intentions of animals and mounts.',
  Arcana: 'Recall lore about spells, magic items, and the planes.',
  Athletics: 'Climb, jump, swim, grapple, and shove with raw physical effort.',
  Deception: 'Lie convincingly, bluff, or hide the truth with a straight face.',
  History: 'Recall events, lost kingdoms, wars, and famous people.',
  Insight: "Read body language to sense lies, moods, and what someone really wants.",
  Intimidation: 'Influence through threats, hostile displays, or sheer presence.',
  Investigation: 'Search for clues, deduce, and figure out how things work.',
  Medicine: 'Stabilize the dying and diagnose illness or injury.',
  Nature: 'Recall lore about terrain, plants, animals, and the weather.',
  Perception: 'Spot, hear, or otherwise notice things around you.',
  Performance: 'Delight an audience with music, dance, acting, or storytelling.',
  Persuasion: 'Influence with tact, social grace, and good faith.',
  Religion: 'Recall lore about deities, rites, holy symbols, and the divine.',
  'Sleight of Hand': 'Pick pockets, plant objects, or perform tricks unseen.',
  Stealth: 'Move silently and stay hidden from notice.',
  Survival: 'Track, hunt, forage, navigate, and weather the wilds.',
};

// Emoji avatar choices. Empty string ('') = fall back to name monogram.
export const AVATAR_EMOJI = [
  '🗡️', '🏹', '🛡️', '🎻', '🪄', '🔮', '⚔️', '🪓', '🗝️', '🎭',
  '🐺', '🦊', '🦅', '🐉', '👑', '💀', '🌿', '🔥', '❄️', '⭐',
];

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
    const pool = await getSpellsForClass(className);
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
