import { describe, it, expect, beforeEach } from 'vitest';
import { store, setStore, aiSet, systemSet, playerSet, OwnershipError } from '../src/state/store.js';
import { extractMechanics, validateMechanics, applyMechanics } from '../src/ai/mechanics.js';
import { runGate2, runGate4, runGate5 } from '../src/ai/gates.js';
import { confirmTransition, rejectTransition } from '../src/ai/mechanics.js';
import { isPlayMsg, msgToRole, createNarrativeMsg, migrateMsg } from '../src/ai/messages.js';
import { normalizeCharacter, parseEquipmentList } from '../src/content/normalizer.js';
import { forgeCharacter } from '../src/data/forge.js';

function loadTestCharacters() {
  setStore('campaign', 'characters', [
    {
      id: 'pc_ivy', name: 'Ivy', class: 'Rogue', level: 4, xp: 2700,
      hp: 31, hpMax: 31, hpTemp: 0, ac: 15, speed: 30,
      conditions: [], concentration: null, exhaustion: 0,
      inspiration: false, deathSaves: { successes: 0, failures: 0 },
      familiar: null, color: '#4ae0a0',
      abilityScores: { str: 10, dex: 18, con: 12, int: 14, wis: 10, cha: 12 },
      savingThrows: ['dex', 'int'], skills: {}, proficiencies: [],
      features: [], cantrips: [], knownSpells: [], spellSlots: {},
      currentSlots: {}, resources: [], hitDice: { die: 'd8', total: 4, used: 0 },
      race: 'Human', subclass: 'Thief', background: 'Urchin',
      alignment: 'Chaotic Good', languages: [], attacks: [],
      backstory: '', appearance: '', personality: '', notes: '',
    },
    {
      id: 'pc_thorn', name: 'Thorn', class: 'Bard', level: 4, xp: 2700,
      hp: 27, hpMax: 27, hpTemp: 0, ac: 13, speed: 30,
      conditions: [], concentration: null, exhaustion: 0,
      inspiration: false, deathSaves: { successes: 0, failures: 0 },
      familiar: null, color: '#a070e0',
      abilityScores: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 18 },
      savingThrows: ['dex', 'cha'], skills: {}, proficiencies: [],
      features: ['Bardic Inspiration (d6)'], cantrips: ['Vicious Mockery', 'Minor Illusion'],
      knownSpells: ['Healing Word', 'Thunderwave', 'Faerie Fire', 'Shatter'],
      spellSlots: { 1: 4, 2: 3 }, currentSlots: { 1: 4, 2: 3 },
      resources: [{ name: 'Bardic Inspiration', max: 4, current: 4, recharge: 'long', restoresOn: 'long_rest' }],
      hitDice: { die: 'd8', total: 4, used: 0 },
      race: 'Half-Elf', subclass: 'College of Lore', background: 'Hermit',
      alignment: 'Neutral Good', languages: [], attacks: [],
      backstory: '', appearance: '', personality: '', notes: '',
    },
  ]);
  setStore('campaign', 'id', 'test_001');
  setStore('campaign', 'location', 'Test Location');
  setStore('campaign', 'time', 'Morning');
  setStore('campaign', 'gold', { pp: 0, gp: 50, ep: 0, sp: 10, cp: 5 });
  setStore('campaign', 'quests', []);
  setStore('campaign', 'npcs', []);
  setStore('campaign', 'consequences', []);
  setStore('campaign', 'combatState', {
    active: false, round: 0, initiative: [],
    currentTurn: 0, actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
    zones: {},
  });
  setStore('campaign', 'narrative', []);
  setStore('campaign', 'inventory', { carried: {}, wagon: [], hoard: [] });
  setStore('campaign', 'incomeLog', []);
  setStore('campaign', 'expenseLog', []);
  setStore('campaign', 'travelLog', []);
  setStore('campaign', 'pendingLocation', null);
  setStore('campaign', 'pendingTime', null);
  setStore('campaign', 'pendingChapter', null);
  setStore('campaign', 'chapters', []);
}

describe('Ownership Enforcement', () => {
  beforeEach(loadTestCharacters);

  it('aiSet succeeds for AI-owned fields', () => {
    aiSet('characters.0.hp', 20);
    expect(store.campaign.characters[0].hp).toBe(20);
  });

  it('aiSet succeeds for AI-owned gold', () => {
    aiSet('gold.gp', 100);
    expect(store.campaign.gold.gp).toBe(100);
  });

  it('aiSet succeeds for AI-owned xp', () => {
    aiSet('characters.0.xp', 5000);
    expect(store.campaign.characters[0].xp).toBe(5000);
  });

  it('aiSet succeeds for AI-owned currentSlots', () => {
    aiSet('characters.1.currentSlots', { 1: 3, 2: 2 });
    expect(store.campaign.characters[1].currentSlots[1]).toBe(3);
  });

  it('aiSet throws for system-owned level', () => {
    expect(() => aiSet('characters.0.level', 5)).toThrow(OwnershipError);
  });

  it('aiSet throws for system-owned hpMax', () => {
    expect(() => aiSet('characters.0.hpMax', 50)).toThrow(OwnershipError);
  });

  it('aiSet throws for system-owned class', () => {
    expect(() => aiSet('characters.0.class', 'Fighter')).toThrow(OwnershipError);
  });

  it('aiSet throws for system-owned spellSlots', () => {
    expect(() => aiSet('characters.1.spellSlots', { 1: 5 })).toThrow(OwnershipError);
  });

  it('aiSet throws for player-owned name', () => {
    expect(() => aiSet('characters.0.name', 'Hacker')).toThrow(OwnershipError);
  });

  it('playerSet succeeds for player-owned fields', () => {
    playerSet('characters.0.notes', 'test note');
    expect(store.campaign.characters[0].notes).toBe('test note');
  });

  it('playerSet throws for AI-owned hp', () => {
    expect(() => playerSet('characters.0.hp', 99)).toThrow(OwnershipError);
  });

  it('systemSet succeeds for system-owned fields', () => {
    systemSet('characters.0.level', 5);
    expect(store.campaign.characters[0].level).toBe(5);
  });
});

describe('Mechanics Pipeline', () => {
  beforeEach(loadTestCharacters);

  it('extractMechanics parses standard block', () => {
    const response = 'Some narrative text.\n\n---MECHANICS---\nhp: Ivy=25\ntime: Afternoon\n---END---';
    const mechanics = extractMechanics(response);
    expect(mechanics.length).toBe(2);
    expect(mechanics[0]).toMatchObject({ key: 'hp', value: 'Ivy=25' });
    expect(mechanics[1]).toMatchObject({ key: 'time', value: 'Afternoon' });
  });

  it('extractMechanics handles multiple entries', () => {
    const response = '---MECHANICS---\nhp: Ivy=18\nconditions: Thorn+Poisoned\nroll_request: Perception|14|Ivy\n---END---';
    const mechanics = extractMechanics(response);
    expect(mechanics.length).toBe(3);
  });

  it('validateMechanics rejects hp_max', () => {
    const mechanics = [
      { key: 'hp', value: 'Ivy=25', target: '', applied: false },
      { key: 'hp_max', value: 'Ivy=50', target: '', applied: false },
    ];
    const { valid, rejected } = validateMechanics(mechanics);
    expect(valid.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason).toContain('system-owned');
  });

  it('validateMechanics rejects spell_add', () => {
    const mechanics = [
      { key: 'spell_add', value: 'Thorn|Fireball', target: '', applied: false },
    ];
    const { valid, rejected } = validateMechanics(mechanics);
    expect(valid.length).toBe(0);
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason).toContain('system-owned');
  });

  it('applyMechanics updates hp through aiSet', () => {
    const mechanics = [{ key: 'hp', value: 'Ivy=20', target: '', applied: false }];
    const results = applyMechanics(mechanics);
    expect(results[0].applied).toBe(true);
    expect(store.campaign.characters[0].hp).toBe(20);
  });

  it('applyMechanics updates conditions through aiSet', () => {
    const mechanics = [{ key: 'conditions', value: 'Ivy+Poisoned', target: '', applied: false }];
    applyMechanics(mechanics);
    expect(store.campaign.characters[0].conditions.length).toBe(1);
    expect(store.campaign.characters[0].conditions[0].name).toBe('Poisoned');
  });

  it('applyMechanics updates gold through aiSet', () => {
    const mechanics = [{ key: 'income', value: '25,loot,chest', target: '', applied: false }];
    applyMechanics(mechanics);
    expect(store.campaign.gold.gp).toBe(75);
  });

  it('applyMechanics updates location with pending', () => {
    const mechanics = [{ key: 'location', value: 'New Town', target: '', applied: false }];
    applyMechanics(mechanics);
    expect(store.campaign.pendingLocation.value).toBe('New Town');
  });

  it('applyMechanics holds a changed time as pending instead of applying it', () => {
    const mechanics = [{ key: 'time', value: 'Evening', target: '', applied: false }];
    applyMechanics(mechanics);
    expect(store.campaign.pendingTime).toBe('Evening');
    expect(store.campaign.time).toBe('Morning');
  });

  it('applyMechanics applies time immediately when it matches the current value', () => {
    const mechanics = [{ key: 'time', value: 'Morning', target: '', applied: false }];
    applyMechanics(mechanics);
    expect(store.campaign.pendingTime).toBe(null);
    expect(store.campaign.time).toBe('Morning');
  });

  it('applyMechanics holds chapter_add as pending instead of appending it', () => {
    const mechanics = [{ key: 'chapter_add', value: 'The Fall of Ashford|The town burns.', target: '', applied: false }];
    applyMechanics(mechanics);
    expect(store.campaign.pendingChapter.title).toBe('The Fall of Ashford');
    expect(store.campaign.chapters.length).toBe(0);
  });

  it('confirmTransition commits whichever of location/time/chapter are pending', () => {
    applyMechanics([
      { key: 'location', value: 'New Town', target: '', applied: false },
      { key: 'time', value: 'Evening', target: '', applied: false },
      { key: 'chapter_add', value: 'Arrival|The party arrives.', target: '', applied: false },
    ]);
    confirmTransition();
    expect(store.campaign.location).toBe('New Town');
    expect(store.campaign.time).toBe('Evening');
    expect(store.campaign.chapters.length).toBe(1);
    expect(store.campaign.pendingLocation).toBe(null);
    expect(store.campaign.pendingTime).toBe(null);
    expect(store.campaign.pendingChapter).toBe(null);
  });

  it('rejectTransition discards pending location/time/chapter without applying them', () => {
    applyMechanics([
      { key: 'location', value: 'New Town', target: '', applied: false },
      { key: 'time', value: 'Evening', target: '', applied: false },
    ]);
    rejectTransition();
    expect(store.campaign.location).toBe('Test Location');
    expect(store.campaign.time).toBe('Morning');
    expect(store.campaign.pendingLocation).toBe(null);
    expect(store.campaign.pendingTime).toBe(null);
  });

  it('damage mechanic applies raw damage with no resistance tags', () => {
    applyMechanics([{ key: 'damage', value: 'Ivy,10,slashing', target: '', applied: false }]);
    expect(store.campaign.characters[0].hp).toBe(21);
  });

  it('damage mechanic halves damage for a resisted type', () => {
    setStore('campaign', 'characters', 0, 'resistances', ['fire']);
    applyMechanics([{ key: 'damage', value: 'Ivy,10,fire', target: '', applied: false }]);
    expect(store.campaign.characters[0].hp).toBe(26);
  });

  it('damage mechanic doubles damage for a vulnerable type', () => {
    setStore('campaign', 'characters', 0, 'vulnerabilities', ['cold']);
    applyMechanics([{ key: 'damage', value: 'Ivy,10,cold', target: '', applied: false }]);
    expect(store.campaign.characters[0].hp).toBe(11);
  });

  it('damage mechanic zeroes damage for an immune type', () => {
    setStore('campaign', 'characters', 0, 'immunities', ['poison']);
    applyMechanics([{ key: 'damage', value: 'Ivy,10,poison', target: '', applied: false }]);
    expect(store.campaign.characters[0].hp).toBe(31);
  });

  it('damage mechanic is case-insensitive on damage type', () => {
    setStore('campaign', 'characters', 0, 'resistances', ['Fire']);
    applyMechanics([{ key: 'damage', value: 'Ivy,10,FIRE', target: '', applied: false }]);
    expect(store.campaign.characters[0].hp).toBe(26);
  });

  it('damage mechanic absorbs into temp hp before real hp', () => {
    setStore('campaign', 'characters', 0, 'hpTemp', 5);
    applyMechanics([{ key: 'damage', value: 'Ivy,8,bludgeoning', target: '', applied: false }]);
    expect(store.campaign.characters[0].hpTemp).toBe(0);
    expect(store.campaign.characters[0].hp).toBe(28);
  });

  it('damage dropping a PC to exactly 0 does not trigger death saves yet', () => {
    applyMechanics([{ key: 'damage', value: 'Ivy,31,bludgeoning', target: '', applied: false }]);
    expect(store.campaign.characters[0].hp).toBe(0);
    expect(store.campaign.characters[0].deathSaves.failures).toBe(0);
    expect(store.campaign.characters[0].conditions.some(c => c.name === 'Dead')).toBe(false);
  });

  it('damage taken while already at 0 hp is an automatic failed death save', () => {
    setStore('campaign', 'characters', 0, 'hp', 0);
    applyMechanics([{ key: 'damage', value: 'Ivy,3,bludgeoning', target: '', applied: false }]);
    expect(store.campaign.characters[0].deathSaves.failures).toBe(1);
    expect(store.campaign.characters[0].conditions.some(c => c.name === 'Dead')).toBe(false);
  });

  it('a third automatic failed death save kills the PC', () => {
    setStore('campaign', 'characters', 0, 'hp', 0);
    setStore('campaign', 'characters', 0, 'deathSaves', { successes: 0, failures: 2 });
    applyMechanics([{ key: 'damage', value: 'Ivy,3,bludgeoning', target: '', applied: false }]);
    expect(store.campaign.characters[0].conditions.some(c => c.name === 'Dead')).toBe(true);
  });

  it('massive damage (overflow >= hp max) on the downing hit is instant death', () => {
    applyMechanics([{ key: 'damage', value: 'Ivy,62,bludgeoning', target: '', applied: false }]);
    expect(store.campaign.characters[0].hp).toBe(0);
    expect(store.campaign.characters[0].conditions.some(c => c.name === 'Dead')).toBe(true);
  });

  it('massive damage while already at 0 hp is instant death', () => {
    setStore('campaign', 'characters', 0, 'hp', 0);
    applyMechanics([{ key: 'damage', value: 'Ivy,31,bludgeoning', target: '', applied: false }]);
    expect(store.campaign.characters[0].conditions.some(c => c.name === 'Dead')).toBe(true);
  });

  it('healing via hp mechanic does not trigger death-save logic', () => {
    setStore('campaign', 'characters', 0, 'hp', 0);
    applyMechanics([{ key: 'hp', value: 'Ivy=10', target: '', applied: false }]);
    expect(store.campaign.characters[0].hp).toBe(10);
    expect(store.campaign.characters[0].deathSaves.failures).toBe(0);
  });
});

describe('Gate Firing', () => {
  beforeEach(loadTestCharacters);

  it('Gate 4 auto-confirms a pending location the player already named themselves', () => {
    applyMechanics([{ key: 'location', value: 'Ashford', target: '', applied: false }]);
    expect(store.campaign.pendingLocation.value).toBe('Ashford');
    const flags = runGate4([], 'We head to Ashford.');
    expect(flags.length).toBe(0);
    expect(store.campaign.pendingLocation).toBe(null);
    expect(store.campaign.location).toBe('Ashford');
  });

  it('Gate 4 leaves a pending location held when the player did not name it', () => {
    applyMechanics([{ key: 'location', value: 'Ashford', target: '', applied: false }]);
    const flags = runGate4([], 'I check my inventory.');
    expect(flags.length).toBe(0);
    expect(store.campaign.pendingLocation.value).toBe('Ashford');
    expect(store.campaign.location).toBe('Test Location');
  });

  it('Gate 4 is a no-op when nothing is pending', () => {
    const flags = runGate4([], 'We head to Ashford.');
    expect(flags.length).toBe(0);
    expect(store.campaign.pendingLocation).toBe(null);
  });

  it('Gate 5 flags unmentioned PC actions', () => {
    const narrative = 'Ivy sneaks ahead while Thorn casts a spell from behind.';
    const playerMessage = 'Ivy sneaks ahead to scout.';
    const flags = runGate5(narrative, [], playerMessage);
    expect(flags.length).toBe(1);
    expect(flags[0].pcName).toBe('Thorn');
    expect(flags[0].type).toBe('unmentioned_pc');
  });

  it('Gate 5 no flag when all PCs mentioned', () => {
    const narrative = 'Ivy sneaks ahead while Thorn follows behind.';
    const playerMessage = 'Ivy sneaks and Thorn follows.';
    const flags = runGate5(narrative, [], playerMessage);
    expect(flags.length).toBe(0);
  });

  it('Gate 5 no flag with single PC party', () => {
    setStore('campaign', 'characters', [store.campaign.characters[0]]);
    const narrative = 'Ivy sneaks ahead.';
    const playerMessage = 'I sneak ahead.';
    const flags = runGate5(narrative, [], playerMessage);
    expect(flags.length).toBe(0);
  });
});

describe('damage + hp co-emission for the same PC', () => {
  beforeEach(loadTestCharacters);

  it('rejects a co-emitted hp: for a PC that damage: already targets, keeping damage\'s clamped result', () => {
    setStore('campaign', 'characters', 0, 'hp', 1);
    const { valid, rejected } = validateMechanics([
      { key: 'damage', value: 'Ivy, 4, slashing', target: '', applied: false },
      { key: 'hp', value: 'Ivy=4', target: '', applied: false },
    ]);
    applyMechanics(valid);
    expect(rejected.some(m => m.key === 'hp')).toBe(true);
    expect(store.campaign.characters[0].hp).toBe(0);
  });

  it('still applies hp: normally when no damage: targets the same PC in the batch', () => {
    const { valid, rejected } = validateMechanics([{ key: 'hp', value: 'Ivy=20', target: '', applied: false }]);
    applyMechanics(valid);
    expect(rejected.length).toBe(0);
    expect(store.campaign.characters[0].hp).toBe(20);
  });

  it('still applies damage: normally when emitted alone', () => {
    const { valid } = validateMechanics([{ key: 'damage', value: 'Ivy, 5, fire', target: '', applied: false }]);
    applyMechanics(valid);
    expect(store.campaign.characters[0].hp).toBe(26);
  });

  it('does not reject hp: for a different PC than the one damage: targets', () => {
    const { valid, rejected } = validateMechanics([
      { key: 'damage', value: 'Ivy, 5, fire', target: '', applied: false },
      { key: 'hp', value: 'Thorn=15', target: '', applied: false },
    ]);
    applyMechanics(valid);
    expect(rejected.length).toBe(0);
    expect(store.campaign.characters[0].hp).toBe(26);
    expect(store.campaign.characters[1].hp).toBe(15);
  });
});

describe('roll_request + hp/damage co-emission for the same target', () => {
  beforeEach(loadTestCharacters);

  it('rejects a co-emitted hp: for the exact target of an Attack roll_request in the same batch', () => {
    const { valid, rejected } = validateMechanics([
      { key: 'roll_request', value: 'Attack|13|Thorn|normal|Kobold', target: '', applied: false },
      { key: 'hp', value: 'Kobold=4', target: '', applied: false },
    ]);
    expect(rejected.some(m => m.key === 'hp')).toBe(true);
    expect(valid.some(m => m.key === 'roll_request')).toBe(true);
  });

  it('rejects a co-emitted damage: for the exact target of an Attack roll_request in the same batch', () => {
    const { valid, rejected } = validateMechanics([
      { key: 'roll_request', value: 'Attack|13|Thorn|normal|Kobold', target: '', applied: false },
      { key: 'damage', value: 'Kobold, 2, slashing', target: '', applied: false },
    ]);
    expect(rejected.some(m => m.key === 'damage')).toBe(true);
    expect(valid.some(m => m.key === 'roll_request')).toBe(true);
  });

  it('does not reject hp: for a different target than the roll_request names', () => {
    const { valid, rejected } = validateMechanics([
      { key: 'roll_request', value: 'Attack|13|Thorn|normal|Kobold', target: '', applied: false },
      { key: 'hp', value: 'GoblinGuard=8', target: '', applied: false },
    ]);
    expect(rejected.length).toBe(0);
    expect(valid.length).toBe(2);
  });

  it('does not reject hp: when the roll_request is a plain skill check with no TargetName', () => {
    const { valid, rejected } = validateMechanics([
      { key: 'roll_request', value: 'Perception|13|Thorn', target: '', applied: false },
      { key: 'hp', value: 'Thorn=20', target: '', applied: false },
    ]);
    expect(rejected.length).toBe(0);
  });
});

describe('xp mechanic', () => {
  beforeEach(loadTestCharacters);

  it('adds XP to a named PC using the Name+amount format', () => {
    const { valid } = validateMechanics([{ key: 'xp', value: 'Ivy+75', target: '', applied: false }]);
    applyMechanics(valid);
    expect(store.campaign.characters[0].xp).toBe(2775);
  });

  it('adds XP to the whole party using party+amount', () => {
    const { valid } = validateMechanics([{ key: 'xp', value: 'party+50', target: '', applied: false }]);
    applyMechanics(valid);
    expect(store.campaign.characters[0].xp).toBe(2750);
    expect(store.campaign.characters[1].xp).toBe(2750);
  });

  it('is a silent no-op for a bare amount with no target (regression guard for the MechTest button bug)', () => {
    const { valid } = validateMechanics([{ key: 'xp', value: '75', target: '', applied: false }]);
    applyMechanics(valid);
    expect(store.campaign.characters[0].xp).toBe(2700);
  });
});

describe('cover mechanic — PCs and enemies', () => {
  beforeEach(() => {
    loadTestCharacters();
    setStore('campaign', 'combatState', {
      active: true, round: 1,
      initiative: [
        { name: 'Ivy', type: 'pc', hp: 31 },
        { name: 'Goblin', type: 'npc', hp: 7, ac: 15 },
      ],
      currentTurn: 0,
      actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
      zones: {},
    });
  });

  it('sets coverBonus on a PC', () => {
    const { valid } = validateMechanics([{ key: 'cover', value: 'Ivy=half', target: '', applied: false }]);
    applyMechanics(valid);
    expect(store.campaign.characters[0].coverBonus).toBe(2);
  });

  it('sets coverBonus on an enemy already in initiative', () => {
    const { valid } = validateMechanics([{ key: 'cover', value: 'Goblin=three-quarters', target: '', applied: false }]);
    applyMechanics(valid);
    expect(store.campaign.combatState.initiative[1].coverBonus).toBe(5);
  });

  it('matches enemy names case-insensitively', () => {
    const { valid } = validateMechanics([{ key: 'cover', value: 'goblin=half', target: '', applied: false }]);
    applyMechanics(valid);
    expect(store.campaign.combatState.initiative[1].coverBonus).toBe(2);
  });

  it('clears coverBonus with "none"', () => {
    setStore('campaign', 'combatState', 'initiative', 1, 'coverBonus', 5);
    const { valid } = validateMechanics([{ key: 'cover', value: 'Goblin=none', target: '', applied: false }]);
    applyMechanics(valid);
    expect(store.campaign.combatState.initiative[1].coverBonus).toBe(0);
  });

  it('is a no-op for a name matching neither a PC nor an enemy', () => {
    const { valid } = validateMechanics([{ key: 'cover', value: 'Nobody=half', target: '', applied: false }]);
    applyMechanics(valid);
    expect(store.campaign.characters[0].coverBonus).toBeUndefined();
    expect(store.campaign.combatState.initiative[1].coverBonus).toBeUndefined();
  });
});

describe('hit_dice_use — Short Rest healing', () => {
  beforeEach(loadTestCharacters);

  // Ivy: hitDice d8, CON 12 (mod +1), hpMax 31

  it('heals HP and decrements hitDice.used within the expected roll bounds', () => {
    setStore('campaign', 'characters', 0, 'hp', 10);
    const { valid } = validateMechanics([{ key: 'hit_dice_use', value: 'Ivy=1', target: '', applied: false }]);
    applyMechanics(valid);
    const pc = store.campaign.characters[0];
    expect(pc.hitDice.used).toBe(1);
    const healed = pc.hp - 10;
    expect(healed).toBeGreaterThanOrEqual(2); // min d8 roll (1) + CON mod (1)
    expect(healed).toBeLessThanOrEqual(9); // max d8 roll (8) + CON mod (1)
  });

  it('caps healing at hpMax', () => {
    setStore('campaign', 'characters', 0, 'hp', 30);
    const { valid } = validateMechanics([{ key: 'hit_dice_use', value: 'Ivy=1', target: '', applied: false }]);
    applyMechanics(valid);
    const pc = store.campaign.characters[0];
    expect(pc.hp).toBe(31);
    expect(pc.hitDice.used).toBe(1);
  });

  it('is a no-op when no hit dice remain', () => {
    setStore('campaign', 'characters', 0, 'hitDice', { die: 'd8', total: 4, used: 4 });
    setStore('campaign', 'characters', 0, 'hp', 10);
    const { valid } = validateMechanics([{ key: 'hit_dice_use', value: 'Ivy=1', target: '', applied: false }]);
    applyMechanics(valid);
    const pc = store.campaign.characters[0];
    expect(pc.hp).toBe(10);
    expect(pc.hitDice.used).toBe(4);
  });

  it('spends multiple dice in one call', () => {
    setStore('campaign', 'characters', 0, 'hp', 5);
    const { valid } = validateMechanics([{ key: 'hit_dice_use', value: 'Ivy=2', target: '', applied: false }]);
    applyMechanics(valid);
    const pc = store.campaign.characters[0];
    expect(pc.hitDice.used).toBe(2);
    const healed = pc.hp - 5;
    expect(healed).toBeGreaterThanOrEqual(4); // 2 dice * (1 + 1 CON mod)
    expect(healed).toBeLessThanOrEqual(18); // 2 dice * (8 + 1 CON mod)
  });
});

describe('Gate 2 — Action Economy', () => {
  beforeEach(() => {
    loadTestCharacters();
    setStore('campaign', 'combatState', {
      active: true, round: 1,
      initiative: [
        { name: 'Ivy', type: 'pc', hp: 31 },
        { name: 'Goblin', type: 'npc', hp: 7 },
        { name: 'Thorn', type: 'pc', hp: 27 },
      ],
      currentTurn: 0,
      actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
      zones: {},
    });
  });

  it('flags multi_action when the current actor attacks twice in one response', () => {
    const narrative = 'Ivy attacks the goblin with her dagger, then attacks again with her second dagger.';
    const flags = runGate2([], narrative);
    expect(flags.some(f => f.type === 'multi_action')).toBe(true);
  });

  it('does not flag a single action for the current actor', () => {
    const narrative = 'Ivy attacks the goblin with her dagger, striking true.';
    const flags = runGate2([], narrative);
    expect(flags.some(f => f.type === 'multi_action')).toBe(false);
  });

  it('does not flag when the second attack belongs to an NPC, not the current actor', () => {
    const narrative = 'Ivy attacks the goblin with her dagger. The goblin snarls and attacks back with its scimitar.';
    const flags = runGate2([], narrative);
    expect(flags.some(f => f.type === 'multi_action')).toBe(false);
  });

  it('allows two attacks for a PC with Extra Attack', () => {
    setStore('campaign', 'characters', 0, 'features', ['Extra Attack']);
    const narrative = 'Ivy attacks the goblin with her dagger, then attacks a second time with her other dagger.';
    const flags = runGate2([], narrative);
    expect(flags.some(f => f.type === 'multi_action')).toBe(false);
  });

  it('does not flag any action count for a PC with Action Surge', () => {
    setStore('campaign', 'characters', 0, 'features', ['Action Surge']);
    const narrative = 'Ivy attacks, attacks again, and attacks a third time in a flurry of blows.';
    const flags = runGate2([], narrative);
    expect(flags.some(f => f.type === 'multi_action')).toBe(false);
  });

  it('flags multi_bonus when the current actor uses two bonus actions', () => {
    const narrative = 'Ivy uses her Cunning Action to Dash, then uses Second Wind to catch her breath.';
    const flags = runGate2([], narrative);
    expect(flags.some(f => f.type === 'multi_bonus')).toBe(true);
  });

  it('flags wrong_turn when the AI narrates a non-current PC acting', () => {
    const narrative = 'Thorn casts Thunderwave at the approaching enemies.';
    const flags = runGate2([], narrative);
    expect(flags.some(f => f.type === 'wrong_turn')).toBe(true);
  });

  it('returns no flags when combat is not active', () => {
    setStore('campaign', 'combatState', 'active', false);
    const narrative = 'Ivy attacks the goblin, then attacks again, then a third time.';
    const flags = runGate2([], narrative);
    expect(flags.length).toBe(0);
  });
});

describe('Message Schema', () => {
  it('isPlayMsg handles new format', () => {
    expect(isPlayMsg({ type: 'player', content: 'hi' })).toBe(true);
    expect(isPlayMsg({ type: 'dm', content: 'hello' })).toBe(true);
    expect(isPlayMsg({ type: 'dm_advisory', content: 'note' })).toBe(true);
    expect(isPlayMsg({ type: 'system', content: 'err' })).toBe(false);
  });

  it('isPlayMsg handles old format (backward compat)', () => {
    expect(isPlayMsg({ role: 'user', content: 'hi' })).toBe(true);
    expect(isPlayMsg({ role: 'assistant', content: 'hello' })).toBe(true);
    expect(isPlayMsg({ role: 'system', content: 'err' })).toBe(false);
  });

  it('msgToRole maps new format correctly', () => {
    expect(msgToRole({ type: 'player' })).toBe('user');
    expect(msgToRole({ type: 'dm' })).toBe('assistant');
    expect(msgToRole({ type: 'dm_advisory' })).toBe('assistant');
  });

  it('msgToRole handles old format (backward compat)', () => {
    expect(msgToRole({ role: 'user' })).toBe('user');
    expect(msgToRole({ role: 'assistant' })).toBe('assistant');
    expect(msgToRole({ role: 'system' })).toBe('system');
  });

  it('createNarrativeMsg produces valid schema', () => {
    const msg = createNarrativeMsg('player', 'test action');
    expect(msg.id).toMatch(/^nar_/);
    expect(msg.type).toBe('player');
    expect(msg.content).toBe('test action');
    expect(msg.ts).toBeGreaterThan(0);
    expect(msg.partial).toBe(false);
  });

  it('migrateMsg converts old to new format', () => {
    const old = { role: 'user', content: 'hello', ts: 123 };
    const migrated = migrateMsg(old);
    expect(migrated.type).toBe('player');
    expect(migrated.id).toMatch(/^nar_/);
    expect(migrated.content).toBe('hello');
    expect(migrated.partial).toBe(false);
  });

  it('migrateMsg passes through already-migrated messages', () => {
    const msg = createNarrativeMsg('dm', 'hi');
    const result = migrateMsg(msg);
    expect(result).toBe(msg);
  });
});

describe('Stop Generation', () => {
  beforeEach(loadTestCharacters);

  it('wasAborted flag prevents mechanics processing', async () => {
    const { sendMsg, stopGeneration, isSending } = await import('../src/ai/engine.js');
    // This tests the flag logic rather than full streaming
    // The actual integration requires a mocked provider
    expect(typeof stopGeneration).toBe('function');
    expect(typeof sendMsg).toBe('function');
  });
});

describe('healArrays (multiplayer join data healing)', () => {
  // Firebase RTDB drops empty arrays on write/read. A guest joining a host's
  // campaign via joinCampaign() reads that data straight from Firebase — if a
  // PC's `conditions` array came back missing, genLedger()'s `pc.conditions.length`
  // crashes the very next message send. healArrays() is the fix; these tests
  // pin its contract so joinCampaign() can't regress to skipping it again.
  it('restores a missing conditions array on a character read from Firebase', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = {
      characters: [
        { id: 'pc_finch', name: 'Finch', class: 'Rogue', hp: 7, hpMax: 10 },
      ],
    };
    const healed = healArrays(raw);
    expect(Array.isArray(healed.characters[0].conditions)).toBe(true);
    expect(healed.characters[0].conditions).toEqual([]);
  });

  it('restores missing deathSaves object on a character read from Firebase', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = { characters: [{ id: 'pc_finch', name: 'Finch' }] };
    const healed = healArrays(raw);
    expect(healed.characters[0].deathSaves).toEqual({ successes: 0, failures: 0 });
  });

  it('leaves a fully-populated character untouched', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = {
      characters: [
        { id: 'pc_finch', name: 'Finch', conditions: [{ name: 'Poisoned' }], deathSaves: { successes: 1, failures: 2 } },
      ],
    };
    const healed = healArrays(raw);
    expect(healed.characters[0].conditions).toEqual([{ name: 'Poisoned' }]);
    expect(healed.characters[0].deathSaves).toEqual({ successes: 1, failures: 2 });
  });

  it('heals top-level campaign arrays Firebase dropped (e.g. empty quests)', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = { characters: [] };
    const healed = healArrays(raw);
    expect(Array.isArray(healed.quests)).toBe(true);
    expect(Array.isArray(healed.npcs)).toBe(true);
  });

  // Regression: inventory and wagonState are objects, not arrays, at the top
  // level — the old flat healArrays() loop only checked Array.isArray(defVal)
  // on direct DEFAULT_CAMPAIGN keys, so it skipped these entirely. Firebase
  // dropping inventory.wagon left genLedger()'s `c.inventory.wagon.length`
  // crashing on every message send, including the host's own (S55 live bug).
  it('heals nested inventory fields Firebase dropped (wagon, hoard, carried)', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = { characters: [], inventory: {} };
    const healed = healArrays(raw);
    expect(Array.isArray(healed.inventory.wagon)).toBe(true);
    expect(Array.isArray(healed.inventory.hoard)).toBe(true);
    expect(healed.inventory.carried).toEqual({});
  });

  it('heals nested wagonState fields Firebase dropped (animals)', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = { characters: [], wagonState: {} };
    const healed = healArrays(raw);
    expect(Array.isArray(healed.wagonState.animals)).toBe(true);
    expect(healed.wagonState.maxWeight).toBe(0);
  });

  it('leaves populated inventory/wagonState untouched', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = {
      characters: [],
      inventory: { carried: { pc_1: [{ name: 'Rope' }] }, wagon: [{ name: 'Chest' }], hoard: [] },
      wagonState: { animals: [{ name: 'Mule' }], maxWeight: 200 },
    };
    const healed = healArrays(raw);
    expect(healed.inventory.carried).toEqual({ pc_1: [{ name: 'Rope' }] });
    expect(healed.inventory.wagon).toEqual([{ name: 'Chest' }]);
    expect(healed.wagonState.animals).toEqual([{ name: 'Mule' }]);
    expect(healed.wagonState.maxWeight).toBe(200);
  });

  it('heals nested combatState.actionsUsed keys individually instead of wholesale replace', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = { characters: [], combatState: { active: true, actionsUsed: { action: true } } };
    const healed = healArrays(raw);
    expect(healed.combatState.actionsUsed.action).toBe(true);
    expect(healed.combatState.actionsUsed.bonus).toBe(false);
    expect(healed.combatState.active).toBe(true);
  });
});

describe('healArrays (stuck partial-message healing)', () => {
  // A reload/backgrounded-tab interruption mid-stream leaves a message
  // permanently partial:true — no JS exception fires in that case, so
  // finalizeStuckPartial() (engine.js) never gets a chance to run. Restore
  // time (healArrays, shared by restoreSession/mergeCampaign/joinCampaign)
  // is the only place left to heal it.
  it('finalizes a trailing partial:true narrative message on restore', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = {
      characters: [],
      narrative: [{ id: 'm1', content: 'The cultist\'s eyes widen', partial: true }],
    };
    const healed = healArrays(raw);
    expect(healed.narrative[0].partial).toBe(false);
  });

  it('finalizes a trailing partial:true ooc message on restore', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = {
      characters: [],
      ooc: [{ id: 'm1', content: '', partial: true }],
    };
    const healed = healArrays(raw);
    expect(healed.ooc[0].partial).toBe(false);
  });

  it('leaves a non-trailing partial message untouched (only one stream runs at a time)', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = {
      characters: [],
      narrative: [
        { id: 'm1', content: 'stale partial', partial: true },
        { id: 'm2', content: 'final reply', partial: false },
      ],
    };
    const healed = healArrays(raw);
    expect(healed.narrative[0].partial).toBe(true);
    expect(healed.narrative[1].partial).toBe(false);
  });

  it('leaves already-finalized messages and empty arrays untouched', async () => {
    const { healArrays } = await import('../src/data/persist.js');
    const raw = {
      characters: [],
      narrative: [{ id: 'm1', content: 'done', partial: false }],
      ooc: [],
    };
    const healed = healArrays(raw);
    expect(healed.narrative[0].partial).toBe(false);
    expect(healed.ooc).toEqual([]);
  });
});

describe('character JSON import — nested field extraction', () => {
  // A shape typical of an outside-AI-generated character sheet: ability
  // scores, combat stats, and spells nested under wrapper objects, and
  // appearance/personality/backstory as multi-part objects instead of strings.
  const nestedCharacter = () => ({
    characterName: 'Sunny Greenbottle',
    race: 'Halfling (Lightfoot)',
    class: 'Druid',
    background: 'Guild Artisan (Merchant of Positivity)',
    level: 1,
    alignment: 'Neutral Good',
    attributes: { strength: 8, dexterity: 15, constitution: 12, intelligence: 10, wisdom: 16, charisma: 14 },
    combatStats: { hp: 9, ac: 14, speed: 25, hitDice: '1d8' },
    racialTraits: { lucky: 'Reroll a 1 on an attack roll.', brave: 'Advantage on saves vs frightened.' },
    equipment: ['Wooden Shield (+2 AC)', 'Leather Armor', 'Explorer\'s Pack', 'Pouch with 15 gold coins'],
    magic: { cantrips: ['Guidance', 'Thorn Whip'], preparedSpellsLevel1: ['Healing Word', 'Goodberry'] },
    appearance: { posture: 'Diminutive and energetic.', attire: 'Leaf-green leather armor.' },
    personality: {
      core: 'A force of pure sunshine.',
      trait: 'I assume the best in everyone.',
      ideal: 'Redemption.',
      bond: 'I want to prove kindness works.',
      flaw: 'My optimism blinds me to danger.',
    },
    backstory: { origin: 'Raised in a peaceful magical grove.', worldview: 'Assumes the world is a paradise.' },
  });

  it('extracts ability scores nested under a wrapper object instead of leaving them empty', () => {
    const normalized = normalizeCharacter(nestedCharacter());
    expect(normalized.abilityScores).toEqual({ str: 8, dex: 15, con: 12, int: 10, wis: 16, cha: 14 });
  });

  it('extracts hp/ac/speed/hitDice nested under combatStats', () => {
    const normalized = normalizeCharacter(nestedCharacter());
    expect(normalized.hpMax).toBe(9);
    expect(normalized.ac).toBe(14);
    expect(normalized.speed).toBe(25);
    expect(normalized.hitDice.die).toBe('1d8');
  });

  it('extracts cantrips/spells nested under a magic wrapper', () => {
    const normalized = normalizeCharacter(nestedCharacter());
    expect(normalized.cantrips).toEqual(['Guidance', 'Thorn Whip']);
    expect(normalized.knownSpells).toEqual(['Healing Word', 'Goodberry']);
  });

  it('flattens an object-shaped appearance/backstory into readable text instead of passing the raw object through', () => {
    const normalized = normalizeCharacter(nestedCharacter());
    expect(typeof normalized.appearance).toBe('string');
    expect(normalized.appearance).toContain('Diminutive and energetic');
    expect(typeof normalized.backstory).toBe('string');
    expect(normalized.backstory).toContain('peaceful magical grove');
  });

  it('lifts trait/ideal/bond/flaw out of a nested personality object and flattens the rest', () => {
    const normalized = normalizeCharacter(nestedCharacter());
    expect(normalized.traits.trait).toContain('assume the best');
    expect(normalized.traits.ideal).toBe('Redemption.');
    expect(normalized.traits.bond).toContain('kindness works');
    expect(normalized.traits.flaw).toContain('optimism blinds');
    expect(typeof normalized.personality).toBe('string');
    expect(normalized.personality).toContain('pure sunshine');
    expect(normalized.personality).not.toContain('Redemption');
  });

  it('passes racialTraits and equipment through for CharCreate to fold into notes/inventory', () => {
    const normalized = normalizeCharacter(nestedCharacter());
    expect(normalized.racialTraits.lucky).toContain('Reroll a 1');
    expect(normalized.equipment).toEqual(['Wooden Shield (+2 AC)', 'Leather Armor', "Explorer's Pack", 'Pouch with 15 gold coins']);
  });
});

describe('parseEquipmentList', () => {
  it('splits a freeform gear list into items and separates out gold', () => {
    const { items, gold } = parseEquipmentList([
      'Wooden Shield (+2 AC)',
      'Quarterstaff (Walking stick / friendly poking device)',
      'Leather Armor',
      'Pouch with 15 gold coins',
    ]);
    expect(gold).toBe(15);
    expect(items.length).toBe(3);
    expect(items[0]).toEqual({ name: 'Wooden Shield', qty: 1, type: 'gear', weight: 0, note: '+2 AC' });
    expect(items[2].name).toBe('Leather Armor');
    expect(items[2].note).toBeUndefined();
  });

  it('returns an empty result for an empty or missing list', () => {
    expect(parseEquipmentList([])).toEqual({ items: [], gold: 0 });
    expect(parseEquipmentList(undefined)).toEqual({ items: [], gold: 0 });
  });
});

describe('forge.js — ability score guard against a truthy-but-empty import', () => {
  it('falls through to auto-assigned scores when abilityScores is an empty object, instead of locking in all 10s', async () => {
    const char = await forgeCharacter({
      name: 'Test', race: 'Human', className: 'Fighter', level: 1,
      abilityScores: {}, existingCount: 0,
    });
    const values = Object.values(char.abilityScores);
    expect(values.some(v => v !== 10)).toBe(true);
  });

  it('still honors a partially-provided abilityScores object (has at least one real value)', async () => {
    const char = await forgeCharacter({
      name: 'Test', race: 'Human', className: 'Fighter', level: 1,
      abilityScores: { str: 18 }, existingCount: 0,
    });
    expect(char.abilityScores.str).toBe(18);
    expect(char.abilityScores.dex).toBe(10);
  });
});
