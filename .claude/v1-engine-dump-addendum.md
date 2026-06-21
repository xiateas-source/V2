# V1 Engine Dump — Addendum (Second Sweep)

Everything below was missed or only partially covered in the first dump. This focuses on: realistic JSON shapes with gameplay-representative values, the full combat state object, support systems (persistence, prompt construction, sync), and small structural items.

---

## 1. Full Combat State Object (realistic mid-combat snapshot)

```js
state.combat = {
  active: true,
  round: 4,
  currentIdx: 2,           // index into list[] — whose turn it is
  moveMode: "ai",           // "ai" (DM moves tokens) or "manual" (player taps token→zone)
  list: [
    // PC combatant (synced from state.pcs on render)
    {
      name: "Slasher",
      val: 18,               // initiative roll total
      hp: 23,                // LIVE — synced from pc.hp each renderCombat()
      hp_max: 28,            // synced from pc.hp_max
      ac: 16,                // synced from pc.ac
      isPC: true,
      zone: "front",         // one of: front, back, left, right, air, rear
      conditions: ["Raging"],
      concentrating: "",
      condDurations: {}      // {condName: roundsRemaining} — ticked on turn advance
    },
    // NPC enemy combatant
    {
      name: "Cult Fanatic",
      val: 14,               // initiative
      hp: 15,
      hp_max: 22,
      ac: 13,
      isPC: false,
      zone: "front",
      conditions: [],
      concentrating: "Hold Person",
      condDurations: {}
    },
    // Cloned enemy (auto-numbered by clone function)
    {
      name: "Cultist 2",
      val: 11,
      hp: 9,
      hp_max: 9,
      ac: 12,
      isPC: false,
      zone: "left",
      conditions: ["Prone"],
      concentrating: "",
      condDurations: { "Prone": 2 }  // expires in 2 rounds
    }
  ],
  zones: {
    front:  { label: "Frontline",    effect: "",                    terrain: "",              hidden: false },
    back:   { label: "Backline",     effect: "",                    terrain: "",              hidden: false },
    left:   { label: "Left Flank",   effect: "Darkness (15ft)",     terrain: "difficult",     hidden: false },
    right:  { label: "Right Flank",  effect: "",                    terrain: "",              hidden: false },
    air:    { label: "Air Space",    effect: "",                    terrain: "",              hidden: false },
    rear:   { label: "Rear Guard",   effect: "",                    terrain: "",              hidden: true  }  // fog of war
  }
}
```

### Combat lifecycle
1. **Start**: `combat_start` mechanic → `state.combat.active=true`, zones initialized via `_defaultZones()`
2. **Add enemies**: `zone_add_enemy` mechanic or `loadPreset()` → pushed to `list[]` with random initiative
3. **Roll initiative**: `rollInitiativeToChat()` → maps PCs into `list[]` with d20+DEX, sorts by total
4. **Turn cycle**: `nextTurn()` → ticks `condDurations` for current entity, advances `currentIdx`, wraps to round+1 at end
5. **End**: `endCombat()` → confirm dialog → syncs persistent conditions back to PCs (filters out Prone/Grappled/Restrained), syncs animal/familiar HP, writes summary to location history, resets `state.combat` to defaults

### PC sync during combat
`renderCombat()` runs `state.combat.list.forEach(c => { if(c.isPC) { const pc = state.pcs.find(...); c.hp = pc.hp; c.ac = pc.ac; c.hp_max = pc.hp_max; }})` — PC combatant entries are always re-synced from the canonical `state.pcs` on every render.

### Combat-only conditions
`COMBAT_ONLY_CONDS = new Set(['Prone', 'Grappled', 'Restrained'])` — stripped on combat end, not synced back to PC sheets.

---

## 2. Canonical PC Template (what addNewChar() creates)

```js
{
  id: "pc_1718730000",          // "pc_" + Date.now()
  name: "New Character",
  race: "Human",
  class: "Fighter",
  level: 1,
  background: "Soldier",
  alignment: "Neutral",
  hp: 10,
  hp_max: 10,
  ac: 14,
  initiative: 2,
  speed: 30,
  passive_perception: 10,
  passive_insight: 10,
  xp: 0,
  color: "#5a8a5a",
  str: "10 (+0)",              // NOTE: stored as formatted strings, not ints
  dex: "10 (+0)",
  con: "10 (+0)",
  int: "10 (+0)",
  wis: "10 (+0)",
  cha: "10 (+0)",
  skills: "",                   // freetext block — "Perception (Proficient)\nStealth (Expertise)"
  features: "",                 // freetext block — class/race features
  magic: "None",                // freetext block — spellcasting description
  conditions: [],               // string[] — active conditions
  slots: [],                    // [{max: 2, used: 0}] per spell level
  inventory: [],                // [{name, qty, weight, type, notes, ts?, location?}]
  backstory_origin: "",
  backstory_motivation: "",
  backstory_secret: "",

  // Fields added by migrate() on first load (not in addNewChar template):
  concentrating: "",            // spell name or ""
  levelReady: false,            // true when XP crosses threshold
  spellbook: [],                // [{name, level, castTime, range, duration, components, desc}]
  familiar: null,               // {name, type, hp, hp_max, ac, speed, str, dex, con, int, wis, cha, passive_perception, notes} or null
  death_saves: { successes: 0, failures: 0 },
  inspiration: false,
  hp_temp: 0,
  exhaustion: 0,                // 0–6
  hd_used: 0,                   // hit dice spent
  personality: "",
  ideals: "",
  bonds: "",                    // NOTE: string here, but wagon.ox.bonds is an object {}
  flaws: "",
  languages: [],                // string[]
  sheetLocked: true,

  // Fields that exist on real PCs but aren't in either template:
  attacks: [],                  // [{name, bonus, damage, notes}] — added via edit sheet
  resources: [],                // [{name, max, used, restore, desc}] — class features
  pending: [],                  // async mechanic queue (rarely used)
  subclass: "",                 // e.g. "Battle Master"
  skillProfs: []                // string[] of proficient skill names
}
```

### Ability score format
Stored as `"16 (+3)"` strings. Parsed everywhere via regex: `parseInt(pc.str)` for raw score, `pc.str.match(/([+-]?\d+)\)$/)[1]` for modifier. V2 should store as integers.

---

## 3. Full WorldData Object (all fields, defaults from code)

```js
state.worldData = {
  // Original spec fields:
  time: "Day 1, Dusk",                    // freetext game clock
  season: "Late Summer",
  weather: "Smoke and haze — Greenest burns",
  illum: "Dim (firelight and smoke)",      // illumination
  location: "Outskirts of Greenest — Trade Way approach",
  setting: "Sword Coast, Forgotten Realms...",  // campaign setting description (multi-line)
  plot: "- Cult of the Dragon: fanatical org...", // DM plot notes (multi-line)
  secrets: "The Cult of the Dragon is gathering treasure...", // DM-only secrets
  timers: "PENDING — Active timers to be established through play.",
  premise: "Hoard of the Dragon Queen. Three adventurers...",

  // Organic fields (grew session by session):
  loc_desc: "The town of Greenest sprawls ahead...",     // current scene description (loc_desc mechanic)
  scene_title: "",         // current scene title
  scene_threat: "",        // scene threat level string
  scene_cond: "",          // scene conditions string
  premiseLocked: false,    // prevents AI from overwriting premise
  primaryMission: "Defend Greenest from the Cult...",   // main quest objective string
  travelLog: [             // chronological location transitions
    { from: "Outskirts of Greenest", to: "Greenest Keep", ts: "Day 1, Dusk", notes: "Arrived during cult raid" }
  ],
  townReputation: [        // per-town standing
    { town: "Greenest", status: "neutral", notes: "Just arriving. Town under attack." }
  ],
  businessProfile: {       // campaign-specific business tracking
    name: "",              // business name
    wagonName: "",         // wagon name (NOTE: duplicates wagon.wagonName)
    realStock: "",         // legitimate inventory description
    snakeOil: "",          // con-artist inventory
    reagents: "",          // reagent notes
    reputation: "",        // business reputation
    notes: ""              // general notes
  },
  campaignSecrets: [       // secrets with visibility tracking
    {
      text: "Leosin Erlanthar has been captured during the raid.",
      playerKnown: false,  // has this been revealed to players?
      pending: false,      // is this a pending reveal?
      aiOnly: true         // only inject into AI context, never display
    }
  ]
}
```

---

## 4. Full Wagon State (all fields, both spec and organic)

```js
state.wagon = {
  // === The "old" draft animal (original spec) ===
  ox: {
    name: "(No draft animal)",
    hp: 0,
    hp_max: 0,
    ac: 10,
    conditions: "None",     // STRING (not array)
    feed: "N/A",
    backstory: "The party has no mount or draft animal yet.",
    personality: "",
    bonds: {},              // OBJECT (not string like pc.bonds!)
    quirks: [],             // string[]
    experimentLog: ""       // campaign-specific (alchemy experiments on animal)
  },

  // === The "new" animal registry (organic, grew from ox) ===
  animals: [                // parallel system — mechanics write to BOTH ox and animals[]
    {
      name: "Grit",
      role: "draft",        // draft/familiar/mount/companion
      type: "Tortle",
      hp: 22, hp_max: 22, ac: 17,
      speed: 25,
      conditions: "None",   // STRING
      feed: "Vegetables",
      backstory: "...",
      personality: "...",
      bonds: {},
      quirks: [],
      experimentLog: "",
      color: "#5a8a5a"
    }
  ],

  // === Wagon itself ===
  hp: 20,                   // wagon hit points (default 20 from migrate)
  hp_max: 20,               // wagon max HP (default 20)
  ac: 11,                   // wagon AC (default 11)
  conditions: "",           // wagon condition STRING (from spec)
  condition: "Good",        // wagon condition STRING (from wagon_add mechanic — DIFFERENT FIELD!)
  wagonName: "The Shelled Alchemist",  // from Setup step 3
  wagonDesc: "A mobile potion shop...", // from Setup step 3
  name: "Cart",             // from wagon_add mechanic — DIFFERENT from wagonName!
  capacity: 1080,           // max weight in lbs (from wagon_add or default DEFAULT_MAX_LB)
  wagonWeight: 400,         // wagon's own weight (from wagon_add)

  // === Containers ===
  cargo: [                  // items in transit / active use
    { name: "Healing Potion", qty: 3, weight: 0.5, type: "potion", notes: "2d4+2 HP", ts: "Day 2", location: "Greenest" }
  ],
  hoard: [                  // stored treasure / long-term storage
    { name: "Gold Necklace", qty: 1, weight: 0.1, type: "loot", notes: "Cult symbol", ts: "Day 1", location: "Greenest" }
  ],
  cells: [                  // holding cells for captured creatures
    { name: "Kobold prisoner", size: "small", temperament: "hostile", escDC: 12, weight: 35, notes: "Captured during raid" }
  ]
}
```

---

## 5. Relationship Object

```js
state.relationships = [
  {
    from: "pc1",              // PC id
    to: "pc2",                // PC id
    disposition: "neutral",   // freetext
    dynamic: "PENDING -- to be established through play.",  // description
    aiOnly: false,            // DM-only relationship note?
    pending: true             // not yet established in-game
  }
  // One entry per directional pair: pc1→pc2, pc2→pc1, etc.
]
```

---

## 6. Encounter Preset Object

```js
state.encounterPresets = [
  {
    name: "Cult Raiders (Chapter 1)",
    enemies: "Cult Fanatic:22:13, Cultist:9:12, Cultist:9:12, Guard Drake:33:14"
    // Format: Name:HP:AC, comma-separated. loadPreset() parses and pushes to combat.list
  }
]
```

---

## 7. Module Progress Object

```js
state.moduleProgress = [
  {
    name: "Episode 1 — Greenest in Flames",
    status: "complete",     // "pending" | "active" | "complete"
    notes: "",              // player/DM notes
    content: "SETTING: Town of Greenest, under attack by Cult of the Dragon..."
    // content field seeded by migrate() v12 gate with HotDQ episode briefs
  }
]
// module_episode mechanic: auto-completes all episodes before the newly activated one
```

---

## 8. Story Chapter Object

```js
state.storyChapters = [
  {
    id: 1718730000,          // Date.now() at creation
    title: "Prologue",
    content: "Three adventurers arrive at Greenest to find it ablaze...",
    date: "Day 1, Dusk"     // game time
  }
]
// chapter_add / chapter_update mechanics. v8 gate migrated legacy storyThread string into first chapter.
```

---

## 9. Scene Object

```js
state.scenes = [
  {
    name: "The Burning Town",
    text: "Multi-paragraph DM scene text...",
    active: true             // only one active at a time
  }
]
state.activeSceneIdx = 0;    // or -1 if none active
// Scenes panel exists but is rarely used in practice. send_scene QA pushes active scene into chat.
```

---

## 10. Snippet Object

```js
state.snippets = [
  {
    name: "Dragon Behavior",
    text: "Lennithon attacks from the air, prefers lightning breath, retreats if bloodied.",
    active: true             // false = excluded from buildPrompt
  }
]
// Active snippets injected into AI prompt as CONTRACT 8 — REFERENCE MATERIAL
```

---

## 11. Quick Action Object

```js
state.quickActions = [
  {
    id: "qa_1",
    label: "Adjust HP",
    type: "hp",              // determines which handler executes
    params: { pc: "", amount: "", mode: "damage" },  // pre-filled defaults
    context: ["tab-party", "tab-combat", "tab-dm"]   // which tabs show this chip
  }
]
// 23 QAs total in default state. Rendered as suggestion chips above chat input.
// Context array controls visibility — chip only shows on matching tabs.
```

### All 23 Default Quick Action Types
| ID | Label | Type | Tab Context |
|----|-------|------|-------------|
| qa_1 | Adjust HP | hp | party, combat, dm |
| qa_2 | Add Condition | condition_add | party, combat, dm |
| qa_3 | Clear Conditions | condition_clear | party, combat, dm |
| qa_4 | Use Resource | resource_use | party, combat, dm |
| qa_5 | Add Foraged Item | item_add_foraged | wagon, world, dm |
| qa_6 | Long Rest | long_rest | dm, party, combat |
| qa_7 | Advance Time | time_advance | world, dm, session |
| qa_8 | Save Game | save_game | all tabs |
| qa_9 | Next Turn | combat_next | combat, dm |
| qa_10 | Add Log Entry | log_entry | session, dm |
| qa_11 | Context Refresh | context_refresh | dm, ait, party |
| qa_12 | Update Town Rep | town_rep | world, dm |
| qa_13 | Roll & Submit | roll_submit | party, combat, dm, world |
| qa_14 | Fix Missing State | state_fix | party, dm, wagon, world, session |
| qa_15 | Re-sync AI | resync_ai | dm, party |
| qa_16 | Surroundings | surroundings | dm, party, world |
| qa_17 | Short Rest | short_rest | dm, party, combat |
| qa_18 | Random Event | random_event | dm, world, wagon |
| qa_19 | Roleplay NPC | roleplay_npc | dm, world |
| qa_20 | Character Moment | char_moment | dm, party |
| qa_21 | Send Active Scene | send_scene | dm, session |
| qa_22 | Module Check-in | module_checkin | dm, session |
| qa_23 | Investigate | investigate | dm, world, party |

---

## 12. Session Log Entry

```js
state.logs = [
  {
    ts: "Day 1, Dusk",       // game time
    type: "dm",              // "dm" | "player" | "combat" | "rest" | "note" | "xp" | "loot" | "travel"
    body: "Hoard of the Dragon Queen — campaign initialized."
  }
]
// Pruned to last 200 on save(), aggressively to 50 on QuotaExceededError.
// Log types used by code: dm, player, combat (zone moves, add enemy, clone), rest (short/long), plus user-entered via addLogEntry.
```

---

## 13. Error Log / Flag System

```js
state.errorLog = [
  {
    id: "dev_visual_redesign",   // unique flag id
    category: "infra",           // infra/gameplay/ux/balance
    sectionCtx: "Dev Plan",      // which section it was flagged in
    location: "Visual Redesign",
    gameTs: "",                  // game timestamp when flagged
    ts: "",                      // wall-clock timestamp
    verdict: null,               // resolution text
    resolved: false,             // whether resolved
    note: "VISUAL REDESIGN — Steampunk Fantasy..."  // flag content (multi-line)
  }
]
// Used for both dev planning flags and gameplay issue tracking.
// Migrate() seeds 3 dev flags: visual_redesign, vtt_roadmap, state_visibility.
```

---

## 14. AI Contracts (system prompt components)

```js
state.aiContracts = {
  persona: "You are the Dungeon Master for Hoard of the Dragon Queen...",  // Contract 1 — AI persona
  never: "NEVER do these things...",    // Contract 2 — prohibitions
  actions: "When players act...",        // Contract 3 — action resolution rules
  continuity: "The wagon...",            // Contract 4 — continuity rules
  multi: "MULTI-PLAYER addressing..."   // Contract 5 — multi-player rules
}
// Stored in state, editable via Setup tab. buildPrompt() reads from state (with DOM fallback).
// migrate() auto-appends DUNGEON SECRETS clause to `never` and PLAYER AGENCY clause to `multi`.
// Contract 6 (Mechanics Block) is hardcoded in buildPrompt, not stored.
```

---

## 15. Persistence & Sync Architecture

### STATE_KEYS (what syncs to Firebase)
```js
const STATE_KEYS = [
  'pcs', 'worldData', 'npcs', 'quests', 'treasuryData',
  'partyInventory', 'wagon', 'combat', 'encounterPresets', 'scenes',
  'activeSceneIdx', 'snippets', 'dmSecrets', 'logSummary', 'logs',
  'activeEditTab', 'turnCount', 'turnsSince', 'chkCount', 'chkMode',
  'chkHistory', 'rewindStack', 'wagonFilter', 'chatHistory', 'oocHistory',
  'partyChat', 'plugins', 'errorLog', 'sessionNotes', 'storyChapters',
  'prevSessionSummary', 'aiContracts', 'sessionArchive', 'locations',
  'consequences', 'headerShortcuts', 'moduleProgress', 'moduleReference',
  'campaignSetup', 'classData'
];
// = 37 top-level keys. Everything in this list goes to Firebase on save().
```

### SHEET_FIELDS (canonical PC fields merged on version upgrade)
```js
const SHEET_FIELDS = [
  'name', 'race', 'background', 'alignment', 'ac', 'speed',
  'passive_perception', 'passive_insight', 'str', 'dex', 'con', 'int', 'wis', 'cha',
  'backstory_origin', 'backstory_motivation', 'backstory_secret', 'color', 'initiative'
];
// CRITICAL RULE: Never add level-dependent fields here.
// migrate() owns: level, hp_max, class, features, magic, skills, slots, resources, spellbook.
// On save version upgrade: SHEET_FIELDS from canonical PCs overwrite saved PCs, preserving
// player-accumulated fields (hp, xp, conditions, inventory, etc.).
```

### Save pruning
- `chatHistory` pruned to 80 messages on every `save()` call
- On `QuotaExceededError`: chatHistory to 30, logs to 50, retry once
- `logs` pruned to 200 on every save

### Firebase sync
- `_lastLocalEdit` / `state._ts` — dirty-edit guard (3-second window ignores remote updates)
- `_mergeChatHistories()` — clock-independent merge using message IDs (prevents vanishing messages across devices)
- `fbSave()` writes all STATE_KEYS to Firebase path `/sessions/{sessionId}/`
- `fbLoad()` reads and calls `migrate()` on remote state before merging

---

## 16. buildPrompt — What the AI Actually Sees

The full prompt assembled by `buildPrompt(ledger)`:

```
Contract 1: AI Persona (from state.aiContracts.persona)
  └─ Must contain "MULTI-PLAYER ADDRESSING" — buildPrompt validates this

[If premiseLocked] LOCKED CAMPAIGN PREMISE

[If campaignSetup has values] SESSION ZERO — PERMANENT TABLE CONTRACT
  └─ tone, origin, goal, lines (content boundaries)

Contract 2: WHAT YOU NEVER DO (from state.aiContracts.never)
  └─ Auto-appended: DUNGEON SECRETS, PLAYER AGENCY, SKILL CHECKS, DICE rules
  └─ INVENTORY INTEGRITY guard

Contract 3: HOW YOU HANDLE ACTIONS (from state.aiContracts.actions)

Contract 4: CONTINUITY & WAGON (from state.aiContracts.continuity)

Contract 5: MULTI-PLAYER (from state.aiContracts.multi)
  └─ Auto-appended: PLAYER AGENCY (STRICT) clause

Contract 6: MECHANICS BLOCK (hardcoded)
  └─ Full format spec, example, all key references, combat rules
  └─ 7 format rules + 6 critical rules + combat zone adjacency
  └─ Level-up prohibition (NEVER set hp_max/level/slots via mechanics)
  └─ roll_request NARRATIVE PAUSE rule

[If moduleProgress exists] Contract 9: MODULE FIDELITY
  └─ Episode tracker, active episode content, fabrication rejection rules

Contract 7: SECRET DM NOTES (state.dmSecrets)

Contract 8: REFERENCE MATERIAL (active snippets)

CAMPAIGN HISTORY (prevSessionSummary — last 3 archived summaries)

CURRENT CAMPAIGN STATE (the full genLedger() output)
```

### genLedger() — two formats
- **Compact**: Location/Time/Weather + one-line per PC (HP/AC/conditions/slots/resources/carry) + combat block + animals + treasury GP. Used in actual gameplay.
- **Full**: Everything in compact PLUS abilities, skills (with proficiency/expertise calculated), features, magic, spells/slots by level, inventory per PC, full wagon state, quest list, NPC list, relationships, consequences, story chapters, locations with history, business profile.

### Context injection
- `_ctxInject` — one-shot string prepended to next `sendMsg()` call, cleared after use
- `_ctxInjectTs` — timestamp to prevent stale injections
- Used by: turn advance (combat context), XP receipts, resync, level-up complete notifications
- V2 equivalent: this is how OOC context gets into Narrative without visible echo

---

## 17. Mechanic Keys Missed in First Dump

One key documented in `_MECH_KEYS` but not in Part 1 table:

| Key | Format | Writes To | Notes |
|-----|--------|-----------|-------|
| `sp_charge` | Unknown | Unknown | Present in `_MECH_KEYS` string but no handler found in `parseMechanics()`. Likely a dead key from a removed feature (spell points or charges). Safe to drop in V2. |

---

## 18. Checkpoint System

```js
// Checkpoint state fields
state.chkCount = 0;         // total checkpoints saved
state.chkMode = "exploration"; // "exploration" | "combat" | "social" — affects checkpoint frequency
state.msgsSinceChk = 0;     // messages since last checkpoint
state.autoChkInterval = 8;  // auto-checkpoint every N messages
state.chkHistory = [];       // [{ts, gameTs, msgIdx, summary, stateSnapshot}]
state.rewindStack = [];      // stack of checkpoints for undo/rewind

// turnCount / turnsSince — tracks turns for frequency-based triggers
state.turnCount = 0;         // total turns processed
state.turnsSince = 0;        // turns since last checkpoint
```

---

## 19. Session Archive System

```js
state.sessionArchive = [     // rolling archive (50-cap)
  {
    ts: "2026-06-18T22:00:00Z",   // wall-clock ISO timestamp
    gameTs: "Day 3, Morning",     // in-game time
    summary: "The party defended the keep against cultist raiders...",
    msgCount: 42                  // messages in this session segment
  }
]
state.prevSessionSummary = "Session 28: Party defended...\nSession 29: Traveled north...";
// Built from last 3 entries of sessionArchive, joined with newlines
// Injected into buildPrompt as CAMPAIGN HISTORY section
```

---

## 20. Miscellaneous State Fields

```js
state.saveVersion = 14;       // current SAVE_VERSION — increment + add migrate() gate
state.campaignLaunched = false; // true once first chat message sent (v9 gate)
state.prevSessionSummary = ""; // see above
state.sessionNotes = "";       // player session notes (freetext)
state.wagonFilter = "all";     // cargo tab filter: "all" | type string
state.hpSteps = [1, 5];        // HP +/- button increments (player-configurable)
state.plugins = [];             // unused — placeholder for future plugin system
state.logSummary = "";          // AI-generated summary of session log
state.classData = {};           // imported class progression data, keyed by class name
                                // e.g. { "Bard": { levels: [...], spells: [...] } }
state.moduleReference = "";     // imported module text (markdown/PDF content)
state._ts = Date.now();         // dirty-edit timestamp for Firebase sync guard
state._locDmMode = false;       // location detail DM mode toggle
state.qaFabIcon = "";           // custom QA floating button icon
```

---

## Summary: What This Addendum Adds

1. **Full combat state with realistic mid-fight data** — zones, conditions, durations, PC sync behavior
2. **Complete PC template** showing both `addNewChar()` defaults AND `migrate()` additions (30+ fields total)
3. **Full worldData** with all 20+ fields including campaignSecrets visibility model
4. **Full wagon state** showing both spec and organic fields side by side with type mismatches called out
5. **Every support object**: relationships, encounter presets, module progress, story chapters, scenes, snippets, quick actions (all 23), session logs, error log/flags, AI contracts
6. **Persistence architecture**: STATE_KEYS (37 keys), SHEET_FIELDS (19 keys), save pruning, Firebase sync
7. **buildPrompt structure** — exact order of what the AI sees, including context injection mechanism
8. **Checkpoint and session archive systems** with data shapes
9. **One dead mechanic key** (`sp_charge`) confirmed for removal
