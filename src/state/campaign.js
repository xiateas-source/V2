export const DEFAULT_CAMPAIGN = {
  id: '',
  name: '',
  setting: '',
  narrationStyle: '',
  premise: '',

  characters: [],

  location: '',
  locDesc: '',
  time: '',
  weather: '',
  travelLog: [],

  gold: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  incomeLog: [],
  expenseLog: [],

  inventory: {
    carried: {},
    wagon: [],
    hoard: [],
  },
  wagonState: {
    animals: [],
    maxWeight: 0,
  },

  quests: [],
  primaryMission: '',
  npcs: [],
  chapters: [],
  consequences: [],
  townReputation: [],
  secrets: [],
  moduleProgress: [],
  locations: [],

  combatState: {
    active: false,
    round: 0,
    initiative: [],
    currentTurn: 0,
    actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
    zones: {},
  },

  pendingLocation: null,

  narrative: [],
  ooc: [],

  sessionArchive: [],
  checkpoints: [],

  contracts: {
    persona: '',
    never: '',
    actions: '',
    continuity: '',
    multi: '',
    module: '',
    dmSecrets: '',
  },
};

export const DEFAULT_CHARACTER = {
  id: '',
  name: '',
  backstory: '',
  appearance: '',
  personality: '',
  notes: '',

  race: '',
  class: '',
  subclass: '',
  level: 1,
  xp: 0,
  hpMax: 0,
  ac: 10,
  speed: 30,
  hitDice: { die: 'd8', total: 1, used: 0 },
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  savingThrows: [],
  skills: {},
  proficiencies: [],
  features: [],
  cantrips: [],
  knownSpells: [],
  spellSlots: {},
  currentSlots: {},
  resources: [],
  background: '',
  alignment: '',
  languages: [],
  attacks: [],
  traits: { trait: '', ideal: '', bond: '', flaw: '' },
  color: '#4a9eff',
  avatar: '',                 // emoji avatar; '' falls back to name monogram

  hp: 0,
  hpTemp: 0,
  conditions: [],
  concentration: null,
  exhaustion: 0,
  inspiration: false,
  deathSaves: { successes: 0, failures: 0 },
  familiar: null,
};

export function resetCampaign(setStore) {
  setStore('campaign', structuredClone(DEFAULT_CAMPAIGN));
}
