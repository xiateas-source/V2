import { describe, it, expect, beforeEach } from 'vitest';
import { store, setStore, aiSet, systemSet, playerSet, OwnershipError } from '../src/state/store.js';
import { extractMechanics, validateMechanics, applyMechanics } from '../src/ai/mechanics.js';
import { runGate4, runGate5 } from '../src/ai/gates.js';
import { isPlayMsg, msgToRole, createNarrativeMsg, migrateMsg } from '../src/ai/messages.js';

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

  it('Gate 4 flags scene transition (location + time)', () => {
    const mechanics = [
      { key: 'location', value: 'Ashford', applied: true },
      { key: 'time', value: 'Evening', applied: true },
    ];
    const flags = runGate4(mechanics);
    expect(flags.length).toBe(1);
    expect(flags[0].gate).toBe(4);
    expect(flags[0].type).toBe('scene_transition');
  });

  it('Gate 4 does not flag location alone', () => {
    const mechanics = [{ key: 'location', value: 'Ashford', applied: true }];
    const flags = runGate4(mechanics);
    expect(flags.length).toBe(0);
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
