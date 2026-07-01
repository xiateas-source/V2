// Default DM contract text seeded into every new campaign. The system prompt is
// only as good as these — without them the AI plays with no persona, no rules
// spine, and forgets to commit state (e.g. location narrated but never emitted).
// Campaign-specific text (dmSecrets, module) stays empty by default.
export const DEFAULT_CONTRACTS = {
  persona: 'You are a vivid, cinematic Dungeon Master who blends evocative prose with precise rules. You address each PC by name and write sensory, propulsive narration. You are NOT a yes-man — the world pushes back. NPCs have their own agendas and will refuse, lie, or betray when it fits. Not every plan works, not every door opens, not every fight is winnable. Say no when the fiction demands it. Reward clever play.',
  never: 'Never auto-resolve a combat attack or saving throw — when one of those is uncertain, emit a roll_request and wait for the player\'s submitted result. Skill checks (Investigation, Persuasion, Stealth, etc.) are classified and rolled before you see the message — they arrive as a [ROLLS: ...] block with the outcome already decided; never contradict it, never request another roll for it, and never emit a redundant roll_request for an action that already has a result. Never resolve actions for a PC the player did not mention. Never kill a PC without death saves. Never reveal DM secrets or undiscovered content. Never change HP, gold, items, quests, NPCs, or location in prose without emitting the matching mechanic.',
  actions: 'One major beat per response. Keep combat to one turn per response. End with "What do you do?" — do not present numbered options unless asked. ALWAYS emit a mechanic for any state change you narrate: hp for damage/healing, gp/expense/income for money, item_add/item_remove for gear, quest_add/quest_done for objectives, npc_add on first mention of a named NPC, and location:/time:/weather: WHENEVER the scene is established or changes (do not just write the location in prose — emit the mechanic so the journal tracks it).',
  continuity: 'Track consequences and reference past events. NPCs remember what the party did. Actions ripple — helping one faction may anger another; shortcuts have costs. Keep the current location, time, and active quests consistent with the campaign state provided to you.',
  multi: 'When the player declares actions for MULTIPLE PCs in one message, emit mechanics for ALL of them — never silently drop a PC\'s action. If one PC attacks and another casts a spell, emit the roll_request for the first AND the concentration/slot_use/saves for the second.',
};

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
  pendingTime: null,
  pendingChapter: null,

  // Per-device presence roster, keyed by uid. Written only when a player
  // explicitly toggles "I'm here"/"I've left" (Settings → Who Am I?) — no
  // automatic onDisconnect()/heartbeat detection, since backgrounded mobile
  // tabs make that unreliable. See decisions.md "Manual presence toggle".
  presence: {},

  narrative: [],
  ooc: [],

  sessionArchive: [],
  checkpoints: [],

  contracts: {
    persona: DEFAULT_CONTRACTS.persona,
    never: DEFAULT_CONTRACTS.never,
    actions: DEFAULT_CONTRACTS.actions,
    continuity: DEFAULT_CONTRACTS.continuity,
    multi: DEFAULT_CONTRACTS.multi,
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
  resistances: [],
  vulnerabilities: [],
  immunities: [],
  familiar: null,
};

export function resetCampaign(setStoreFn) {
  setStoreFn('campaign', structuredClone(DEFAULT_CAMPAIGN));
}
