# Workboard

*Active work, queued items, specs. The build plan for V2.*

---

## Status Key

- `[ ]` — not started
- `[~]` — in progress
- `[x]` — done
- `[?]` — needs design / spec before building
- `[!]` — blocked

---

## Spec Dependencies — What to spec before each phase

> Rule: **data shapes** must be specced before the phase that writes to them. **UI specs** can wait until the phase that displays them.

| Phase | Must be specced first | Status | Can wait until display phase |
|-------|----------------------|--------|------------------------------|
| **Phase 0: Foundation** | Campaign data shape, system data shape, color themes | ✅ All done | — |
| **Phase 1: Core Loop** | All mechanic target data shapes — quest, NPC, location, item, consequence, combat, economy. Chat messages. | ⚠️ Chat ✅, characters ✅. **Quests, NPCs, locations, consequences, secrets, town rep are skeletal — need full field specs before mechanics handlers can be built.** | Journal UI, Cargo UI, Treasury UI |
| **Phase 2: Gates** | Field ownership registry, validation rules per gate | ✅ Ownership done. Gate rules defined. | Gate UI (pills, overlays) |
| **Phase 3: Play Mode UI** | Combat state shape, overlay behavior specs | ⚠️ Combat state exists but thin. Overlays specced in chat-system-spec. | — |
| **Phase 4: Reference Mode** | Nothing new — reads existing state | ✅ | Journal UI, Cargo UI (spec when building). CharSheet ✅ |
| **Phase 5: Setup Mode** | Session Zero flow, char creation wizard fields | ❌ Not specced | — |
| **Phase 6: Manage Mode** | — | — | DevTools, contracts editor, session review |
| **Phase 7: Content Pipeline** | Episode/module tracking data shape | ❌ Not specced | — |
| **Phase 8: Multi-Player** | Player identity/onboarding flow | ⚠️ Partially specced | Child-friendly view |

**Build order:** Phase 0 now (no spec needed) → spec Journal data shapes → Phase 1 → Phase 2 → spec as needed from there.

---

## Phase 0: Foundation

> Scaffold the project, establish state management, connect Firebase. Nothing renders yet — this is plumbing.

- [x] Transfer planning docs to V2 repo
- [x] Write workboard.md
- [ ] **Project scaffold** — Vite + SolidJS, create the full module map directory structure from architecture.md. Empty index.js barrels in each folder. `main.js` entry point. `style.css` with CSS custom properties for palette (placeholder values until palette chosen).
- [ ] **State store** — `src/state/store.js`. SolidJS `createStore` with field ownership enforcement. Every field tagged `ai | player | system`. Setter functions that check ownership before writing. `campaign.js` for campaign data shape + `resetCampaign()`. `system.js` for system data shape.
- [ ] **Firebase setup** — New Firebase project (separate from v1). `src/data/firebase.js` with init, auth (anonymous), realtime DB read/write. Offline fallback to localStorage. `src/data/local.js` with IndexedDB wrapper for compendium storage.
- [ ] **Seed data loading** — On first launch (empty IndexedDB), populate from bundled JSON files derived from `v1-seed-data.md`: XP thresholds (L1–20), level-up data (Fighter/Rogue/Bard L2–10), Bard spell list, spell compendium (94 spells), 16 Battle Master maneuvers, 44 feats (PHB + TCoE), 97-term glossary. These are the v1 constants (SPELL_DB, LEVEL_UP_DATA, FEATS_DB, GLOSSARY) converted to IndexedDB records. Seeding runs before content pipeline exists — it's a one-time load from static JSON, not a parser.
- [ ] **Color palette** — 20 themes total: 10 dark palettes + 10 light palettes. Two toggle buttons in Settings: Dark/Light mode switch + palette cycle button. Tapping the cycle button rotates through the 10 palettes within the current mode. All 20 defined as CSS custom property sets in `style.css`. Palette names stored in `system.settings.theme` as `dark-0` through `dark-9` and `light-0` through `light-9`. See palette spec below. v1 Soft Autumn not carrying forward.

### Scaffold spec

```
V2/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.js                  ← mounts App, initializes data layer
│   ├── style.css                ← CSS custom properties (palette, spacing, typography)
│   ├── ai/
│   │   ├── providers.js
│   │   ├── prompt.js
│   │   ├── mechanics.js
│   │   ├── engine.js
│   │   ├── contracts.js
│   │   ├── memory.js
│   │   └── index.js
│   ├── content/
│   │   ├── fileParser.js
│   │   ├── webParser.js
│   │   ├── mdParser.js
│   │   ├── jsonParser.js
│   │   ├── normalizer.js
│   │   └── index.js
│   ├── data/
│   │   ├── firebase.js          ← init, auth, read/write, offline fallback
│   │   ├── local.js             ← IndexedDB wrapper (compendium, seed data)
│   │   ├── bundles.js
│   │   ├── migrate.js
│   │   ├── seed.js              ← first-launch seeding from static JSON
│   │   └── index.js
│   ├── state/
│   │   ├── store.js             ← SolidJS signals + ownership enforcement
│   │   ├── campaign.js          ← campaign data shape + resetCampaign()
│   │   ├── system.js            ← system data shape (survives campaign swap)
│   │   └── index.js
│   ├── ui/
│   │   ├── play/
│   │   │   ├── Chat.jsx
│   │   │   ├── ContextBanner.jsx
│   │   │   ├── SituationBar.jsx
│   │   │   ├── CharTiles.jsx
│   │   │   ├── InputBar.jsx
│   │   │   ├── Combat.jsx
│   │   │   ├── QuickActions.jsx
│   │   │   ├── DiceRoller.jsx
│   │   │   ├── RollRequest.jsx
│   │   │   ├── Rewind.jsx
│   │   │   └── TTS.jsx
│   │   ├── reference/
│   │   │   ├── CharSheet.jsx
│   │   │   ├── Journal.jsx
│   │   │   ├── Cargo.jsx
│   │   │   ├── Treasury.jsx
│   │   │   ├── Compendium.jsx
│   │   │   └── Glossary.jsx
│   │   ├── setup/
│   │   │   ├── SessionZero.jsx
│   │   │   ├── CharCreate.jsx
│   │   │   ├── ContentImport.jsx
│   │   │   ├── CampaignConfig.jsx
│   │   │   └── PlayerOnboard.jsx
│   │   ├── manage/
│   │   │   ├── Contracts.jsx
│   │   │   ├── SessionReview.jsx
│   │   │   ├── DevTools.jsx
│   │   │   └── Settings.jsx
│   │   ├── shared/
│   │   │   ├── MechPill.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Nav.jsx
│   │   │   └── LevelUp.jsx
│   │   ├── App.jsx              ← mode router + bottom nav
│   │   └── AppSimple.jsx        ← child-friendly entry point
│   └── audio/
│       ├── browserTTS.js
│       └── elevenlabs.js
├── data/                        ← static JSON seed files (bundled, not IndexedDB)
│   ├── xp-thresholds.json
│   ├── level-up-fighter.json
│   ├── level-up-rogue.json
│   ├── level-up-bard.json
│   ├── spells.json
│   ├── maneuvers.json
│   ├── feats.json
│   └── glossary.json
├── CLAUDE.md
├── mockup.html
└── .claude/
```

**What scaffold files contain at Phase 0:**
- `main.js` — imports App, mounts to `#app`, calls `initData()` (Firebase + IndexedDB + seed check)
- `App.jsx` — mode router: checks if campaign exists → setup mode or play mode. Bottom nav placeholder (Cargo / Journal / Settings). Renders current mode's screen.
- `style.css` — CSS custom properties only: `--color-bg`, `--color-surface`, `--color-text`, `--color-accent`, etc. Placeholder values. Three `[data-theme]` blocks (default/light/night). Mobile viewport, touch-action, font stack.
- `index.html` — `<meta viewport>` for mobile, `<div id="app">`, Vite script tag
- `vite.config.js` — SolidJS plugin, dev server config
- `package.json` — solid-js, vite, vite-plugin-solid, firebase
- All other `.js`/`.jsx` files — empty exports. Just enough so imports don't break. Example: `export default function Chat() { return null; }`

**Phase 0 does NOT create:** any working UI beyond the mode router. No chat, no character sheet, no forms. Just the skeleton that Phase 1 plugs into.

### State store spec

#### Field ownership

Every field in the store has exactly one owner. The store enforces this — attempting to write a field from the wrong owner throws an error.

```
AI-owned (via mechanics pipeline, player override with audit log):
  characters[].hp, characters[].hpTemp, characters[].conditions,
  characters[].concentration, characters[].exhaustion,
  characters[].inspiration
  gold (pp/gp/ep/sp/cp), incomeLog[], expenseLog[]
  quests[], npcs[], location, weather, time, locDesc
  townReputation[], secrets[], consequences[], combatState
  chapters[], travelLog[], moduleProgress

Player-owned (via UI editors only):
  characters[].name, characters[].backstory, characters[].appearance,
  characters[].personality, characters[].notes
  playerIdentity (name, selectedPCs, mode)

System-owned (via wizards only):
  characters[].level, characters[].hpMax, characters[].class,
  characters[].subclass, characters[].features[], characters[].spells[],
  characters[].knownSpells[], characters[].cantrips[],
  characters[].spellSlots{}, characters[].currentSlots{},
  characters[].resources[], characters[].proficiencies[],
  characters[].savingThrows[], characters[].skills{},
  characters[].abilityScores{}, characters[].race, characters[].ac,
  characters[].hitDice, characters[].speed, characters[].xp,
  characters[].background, characters[].alignment,
  characters[].languages[], characters[].attacks[], characters[].color
```

#### Setter pattern

```js
const OWNERSHIP = {
  'characters.$.hp': 'ai',
  'characters.$.name': 'player',
  'characters.$.level': 'system',
  // ... every field registered
};

function setField(path, value, owner) {
  const fieldOwner = getOwner(path);  // resolves 'characters.0.hp' → 'characters.$.hp' → 'ai'
  if (fieldOwner !== owner) {
    throw new OwnershipError(
      `${owner} tried to write ${path} (owned by ${fieldOwner})`
    );
  }
  setStore(...parsePath(path), value);
}

// Convenience wrappers
function aiSet(path, value)     { setField(path, value, 'ai'); }
function playerSet(path, value) { setField(path, value, 'player'); }
function systemSet(path, value) { setField(path, value, 'system'); }
```

#### Campaign data shape

Campaign data resets when swapping campaigns. This is the full shape with defaults:

```js
const DEFAULT_CAMPAIGN = {
  // --- Campaign identity ---
  id: '',                     // generated on creation
  name: '',                   // "Hoard of the Dragon Queen"
  setting: '',                // "Forgotten Realms"
  narrationStyle: '',         // "Brandon Sanderson" — freeform, injected into contract
  premise: '',                // locked facts the AI cannot contradict

  // --- Characters (array of PCs) ---
  characters: [
    // Each PC:
    {
      id: '',
      // Player-owned
      name: '',               // "Valenns Vogelsang"
      backstory: '',
      appearance: '',
      personality: '',
      notes: '',

      // System-owned (wizards only)
      race: '',               // "Half-Elf"
      class: '',              // "Wizard"
      subclass: '',           // "Illusionist"
      level: 1,
      xp: 0,
      hpMax: 0,
      ac: 10,
      speed: 30,
      hitDice: { die: 'd8', total: 1, used: 0 },
      abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      savingThrows: [],       // ['int', 'wis'] — proficient saves
      skills: {},             // { arcana: { proficient: true, expertise: false }, ... }
      proficiencies: [],      // ['light armor', 'simple weapons', ...]
      features: [],           // [{ name: 'Arcane Recovery', source: 'Wizard 1', desc: '...' }]
      cantrips: [],           // ['Prestidigitation', 'Fire Bolt']
      knownSpells: [],        // ['Shield', 'Magic Missile', ...]
      spellSlots: {},         // { 1: 4, 2: 3, 3: 2 }  — max per level
      currentSlots: {},       // { 1: 3, 2: 1, 3: 2 }  — remaining
      resources: [],          // [{ name: 'Superiority Dice', max: 4, current: 4, die: 'd8' }]
      background: '',         // "Sage" — chosen at creation
      alignment: '',          // "Chaotic Good"
      languages: [],          // ['Common', 'Elvish', 'Draconic']
      attacks: [],            // [{ name: 'Shortsword', bonus: '+5', damage: '1d6+3', type: 'slashing' }]
      color: '#4a9eff',       // PC accent color for tokens, borders, name displays

      // AI-owned (via mechanics pipeline, player override with audit log)
      hp: 0,
      hpTemp: 0,              // temporary HP — stacks separately
      conditions: [],         // [{ name: 'poisoned', duration: null }] — optional round counter
      concentration: null,    // { spell: 'Shield', since: 'round 3' } or null
      exhaustion: 0,          // 0-6 scale
      inspiration: false,     // ☆/⭐ toggle
      deathSaves: { successes: 0, failures: 0 },

      // Familiar/mount (if any) — gets own conditional tab in charsheet
      familiar: null,         // { name, species, type ('Fey'|'Celestial'|'Fiend'), size, hp, hpMax, ac, speeds: { walk, fly, swim }, abilities: { str, dex, con, int, wis, cha }, senses, skills, passivePerception, specialAbilities: [], status: 'active'|'dismissed'|'dead', source: 'Find Familiar' }
    }
  ],

  // --- World state (AI-owned) ---
  location: '',               // "Hunting Lodge Ruins"
  locDesc: '',                // AI-written location description
  time: '',                   // "Day 26, 01:15 AM"
  weather: '',                // "Clear"
  travelLog: [],              // [{ from, to, note, gameTs }]

  // --- Economy (AI-owned) ---
  gold: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  incomeLog: [],              // [{ amount, category, desc, gameTs }]
  expenseLog: [],             // [{ amount, desc, gameTs }]

  // --- Inventory (AI-owned via item_add/item_remove) ---
  inventory: {
    carried: {},              // { 'pc-id': [{ name, qty, type, weight }] }
    wagon: [],                // [{ name, qty, type, weight }]
    hoard: [],                // [{ name, qty, type, weight }]
  },
  wagonState: {
    animals: [],              // [{ name, type, hp, hpMax, ac, condition, feed }]
    maxWeight: 0,
  },

  // --- Story tracking (AI-owned) ---
  // ⚠️ SKELETAL — need full field specs before Phase 1 mechanics handlers
  quests: [],                 // [{ title, desc, status: 'active'|'done'|'failed', gameTs }]  ← needs: priority, giver NPC, rewards, location, completion criteria
  primaryMission: '',         // main quest text
  npcs: [],                   // [{ name, disposition, details, hp, alive: true }]  ← needs: race, role, location, relationship, last seen, portrait flag, dialogue notes
  chapters: [],               // [{ title, content, gameTs }]
  consequences: [],           // [{ text, type, resolved: false, gameTs }]  ← needs: deadline, urgency, trigger conditions, resolution options
  townReputation: [],         // [{ town, status, notes }]  ← needs: numeric score, events log, faction ties
  secrets: [],                // [{ text, playerKnown: false, aiOnly: true }]  ← needs: category, reveal trigger, source
  moduleProgress: {},         // { moduleName, episodes: [{ num, status }] }  ← needs full episode tracking spec

  // --- Combat (AI-owned, ephemeral during combat) ---
  combatState: {
    active: false,
    round: 0,
    initiative: [],           // [{ name, roll, type: 'pc'|'npc', hp, hpMax, ac, zone }]
    currentTurn: 0,
    actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
    zones: {},                // { front: { label, effect, fog }, back: {}, ... }
  },

  // --- Chat (synced to Firebase) ---
  narrative: [],              // BaseMessage[] — see chat spec
  ooc: [],                    // BaseMessage[] — see chat spec

  // --- Session management ---
  sessionArchive: [],         // [{ summary, startTs, endTs }]
  checkpoints: [],            // [{ ts, state snapshot }]

  // --- AI contracts (editable in manage mode) ---
  contracts: {
    persona: '',              // DM persona contract text
    never: '',                // prohibitions
    actions: '',              // pacing, roll procedure
    continuity: '',           // state verification
    multi: '',                // multi-player addressing
    module: '',               // module fidelity (if loaded)
    dmSecrets: '',            // AI-only information
  },
};
```

#### System data shape

System data survives campaign swap. Stored locally + Firebase:

```js
const DEFAULT_SYSTEM = {
  // --- Player identity (device-local) ---
  playerIdentity: {
    name: '',                 // "Mom" / "Jessica"
    selectedPCs: [],          // ['pc-id-1'] or ['all']
    mode: 'single',           // 'single' | 'multi'
  },

  // --- App settings ---
  settings: {
    theme: 'dark-0',           // 'dark-0'..'dark-9' | 'light-0'..'light-9'
    ttsEnabled: false,
    ttsVoice: null,           // browser voice URI or ElevenLabs voice ID
    pushEnabled: false,
    pushSubscription: null,   // Web Push subscription object
  },

  // --- Provider config ---
  providers: {
    primary: 'gemini',        // 'gemini' | 'openrouter'
    geminiKey: '',
    openrouterKey: '',
    lastProvider: '',         // which one was used last
    health: {},               // { gemini: { failures: 0, lastFail: null }, ... }
  },

  // --- Active campaign pointer ---
  activeCampaignId: '',       // points to which campaign is loaded
};
```

### Firebase schema

Firebase paths — what syncs between devices:

```
v2/
├── campaigns/
│   └── {campaignId}/
│       ├── meta/              ← name, setting, narrationStyle, premise
│       ├── characters/
│       │   └── {charId}/      ← full character object (all owners' fields)
│       ├── world/             ← location, time, weather, locDesc
│       ├── economy/           ← gold, incomeLog, expenseLog
│       ├── inventory/         ← carried, wagon, hoard, wagonState
│       ├── story/             ← quests, primaryMission, npcs, chapters,
│       │                        consequences, townReputation, secrets, moduleProgress
│       ├── combat/            ← combatState (ephemeral — cleared when combat ends)
│       ├── narrative/         ← chat message array
│       ├── ooc/               ← OOC message array
│       ├── contracts/         ← AI contract text per key
│       ├── sessions/          ← sessionArchive array
│       └── checkpoints/       ← checkpoint snapshots
└── players/
    └── {deviceId}/
        ├── identity/          ← name, selectedPCs, mode
        └── settings/          ← theme, tts, push preferences
```

**Sync rules:**
- All campaign data syncs in realtime (both devices see same game state)
- Player identity is device-local in state, but also pushed to `players/{deviceId}` so the other device knows who's connected
- Provider API keys are local-only (never synced to Firebase — security)
- The 3-second dirty-edit guard from the chat spec applies to all Firebase writes, not just chat

**Offline fallback:** If Firebase is unreachable, state writes go to localStorage. On reconnect, merge using the same clock-independent strategy as chat (ID-based dedup, local wins on conflict).

### IndexedDB schema

IndexedDB stores reference content that doesn't change during play. Populated by seed data on first launch, later by the content pipeline.

**Database name:** `tinklepebble-v2`

**Object stores:**

| Store | Key | Indexes | Example record |
|-------|-----|---------|---------------|
| `spells` | `id` (auto) | `name`, `level`, `school`, `class` | `{ name: 'Shield', level: 1, school: 'Abjuration', castTime: '1 reaction', range: 'Self', duration: '1 round', components: 'V, S', desc: '...', classes: ['Wizard', 'Sorcerer'], source: 'seed' }` |
| `feats` | `id` (auto) | `name`, `prerequisite` | `{ name: 'Alert', prerequisite: 'None', desc: '...', source: 'seed' }` |
| `glossary` | `id` (auto) | `term` | `{ term: 'Advantage', definition: '...', source: 'seed' }` |
| `classData` | `id` (auto) | `class`, `level` | `{ class: 'Fighter', level: 3, hitDie: 'd10', features: [...], choices: [...], spellSlots: null }` |
| `maneuvers` | `id` (auto) | `name` | `{ name: 'Disarming Attack', desc: '...', source: 'seed' }` |
| `xpThresholds` | `level` | — | `{ level: 5, xp: 6500 }` |
| `compendium` | `id` (auto) | `name`, `type`, `source` | Future: items, monsters, races from content pipeline |

**Seed data flow:**
1. `main.js` calls `initData()` on app start
2. `initData()` checks IndexedDB for a `_seeded` flag
3. If not seeded: imports static JSON files from `data/` directory, writes to IndexedDB stores, sets `_seeded = true`
4. Seeding runs once. After that, content pipeline (Phase 7) adds to these same stores.

**Static JSON files** (in `data/` directory, bundled with the app):
- Converted from `v1-seed-data.md` tables into JSON arrays
- Each file is one array of records matching the IndexedDB store schema above
- Example: `data/spells.json` = `[{ name: 'Shield', level: 1, ... }, ...]`

### Color palette spec

**20 themes:** 10 dark + 10 light. Player cycles through them with a button in Settings.

**How it works:**
- `<html data-theme="dark-0">` (or `dark-1`, `light-3`, etc.)
- Each theme is a `[data-theme="..."]` block in `style.css` that sets the same CSS custom properties
- Settings has two controls: Dark/Light toggle + "Next palette" cycle button
- Current theme stored in `system.settings.theme` (e.g., `"dark-4"`)
- On app load, `data-theme` attribute set from stored preference

**CSS custom properties (same for all 20 themes):**
```css
--color-bg             /* page/app background */
--color-surface        /* card/panel background */
--color-surface-alt    /* alternate surface (hover, nested) */
--color-text           /* primary text */
--color-text-muted     /* secondary/hint text */
--color-accent         /* primary action color (buttons, links, active nav) */
--color-accent-dim     /* accent hover/pressed state */
--color-success        /* positive (hp heal, quest done, item add) */
--color-warning        /* caution (low slots, timer expiring) */
--color-danger         /* negative (hp damage, quest fail, error) */
--color-border         /* dividers, input borders */
--color-input-bg       /* text input background */
--color-dm-bubble      /* DM message bubble */
--color-player-bubble  /* player message bubble */
--color-nav-bg         /* bottom nav background */
```

**Shared properties (don't change per theme):**
```css
:root {
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', monospace;
  --font-size-sm: 0.85rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;

  --touch-target: 44px;
  --nav-height: 56px;
  --input-height: 48px;
}
```

**The 20 themes** are defined in `palette-sampler.html` with full color values and mini chat mockups for visual review. The agent building Phase 0 should convert those 20 palette objects into `[data-theme="dark-0"]` through `[data-theme="light-9"]` CSS blocks.

**Dark palettes (0-9):** Obsidian, Dragonscale, Grimoire, Hearthstone, Midnight Blue, Blood Moon, Ironwood, Duskfall, Shadowfell, Candlelight
**Light palettes (0-9):** Parchment, Ivory Tower, Meadow, Sandstone, Frost, Rosewood, Daybreak, Lavender, Driftwood, Sea Glass

Default on first launch: `dark-0` (Obsidian).

### Phase 0 acceptance test

When Phase 0 is done, the app should:
1. `npm run dev` starts without errors
2. Browser shows the app shell — a mode router that says "No campaign found" and would route to setup mode
3. Bottom nav renders (Cargo / Journal / Settings) — tapping does nothing yet, just shows placeholder text
4. State store exists with campaign + system shapes, ownership enforcement works (test: calling `aiSet('characters.0.name', 'x')` throws OwnershipError)
5. Firebase connects (anonymous auth), reads/writes to a test path succeed
6. IndexedDB opens, seed data loads on first visit (97 glossary terms, 94 spells, 44 feats, XP thresholds, 3 classes of level-up data, 16 maneuvers)
7. Theme cycling works — `data-theme` attribute changes between all 20 themes, colors swap
8. All import paths resolve (no broken imports from the empty barrel files)

---

## Phase 1: Core Loop (MVP)

> Player types → AI responds → mechanics parse → state updates → UI shows it. The minimum viable play session.

- [ ] **Provider abstraction** — `src/ai/providers.js`. Gemini free tier primary. OpenRouter fallback. Shared interface: `callProvider(messages, systemPrompt, options) → response`. Retry with backoff. Provider health tracking. API key storage in system state.
- [ ] **Prompt builder** — `src/ai/prompt.js`. `buildPrompt(state, contracts, ledger, consequences)` assembles system prompt. `genLedger(state)` compiles compact state summary (v1 format preserved — see v1-engine-reference.md). Prompt budget tracking (token estimate). Active consequences with timers injected.
- [ ] **Mechanics pipeline** — `src/ai/mechanics.js`. Dispatch table registry. `extractMechanics(response)` parses mechanics block. `validateMechanics(changes, state)` checks ownership + basic validity. `applyMechanics(valid, state)` writes through owned setters. Start with the v1 mechanic keys (all 65 from v1-engine-reference.md).
- [ ] **Engine orchestrator** — `src/ai/engine.js`. `sendMsg()` runs the full loop. `callAI()` handles retry + fallback with streaming. Double-send guard. Context injection for corrections. **Stop generation:** cancel button on input bar during AI streaming. Stops the stream, keeps text received so far, discards any partial mechanics block (incomplete mechanics never apply). Works in both Narrative and Ask DM.
- [ ] **Chat UI** — `src/ui/play/Chat.jsx` + `InputBar.jsx`. Two-tab chat system (Narrative + OOC). See full chat system spec below.
- [ ] **App shell** — `src/ui/App.jsx`. Mode routing (setup/play/reference/manage). Bottom nav stub (Cargo / Journal / Settings). Play mode as default after campaign exists.
- [ ] **Contracts loader** — `src/ai/contracts.js`. Load contracts from state. Inject into buildPrompt. v1 contract format preserved (see v1-contract-reference.md). Default contracts seeded from v1.
- [ ] **V2 AI contract text** — The actual system prompt content that `buildPrompt()` injects. Not code — this is a writing task. See spec below.
- [ ] **Memory management** — `src/ai/memory.js`. `summarizeAndPrune(chatHistory, tokenBudget)` compresses old messages into summaries. Session archive on manual trigger or auto-threshold. Context injection: recent messages verbatim + older messages as summary. `sendMsg()` calls this before `buildPrompt()` to keep prompt within free-tier token limits. Critical for any session longer than ~20 messages.

### V2 AI contract spec

The contract is the system prompt text — what the AI reads every turn. Two contracts, two voices:

#### Narrative contract

The Narrative DM is an **epic fantasy narrator who is also a rules lawyer.** Vivid, sensory prose — players loved the storytelling in v1. But every mechanical interaction is grounded in actual rules, named precisely, and tracked. The DM doesn't choose between great story and tight game — it does both. The enforcement gates let the AI lean into narrative because code catches mechanical slips.

**Voice direction:** Not dry rules recitation. Not hand-wavy storytelling. The DM cites rules when they matter, names actual spells/features/mechanics in prose (not vague descriptions), and keeps the game honest while keeping it alive. "Slasher's Mending cantrip weaves the cracked leather back together" — not "Slasher uses his smith's craft to repair the armor."

**Narration style field:** Player-configurable text field injected into the Narrative contract. Set in Session Zero, editable in Settings. Examples: "Brandon Sanderson," "dark and gritty like Joe Abercrombie," "whimsical like Terry Pratchett," or freeform description. Lives in campaign data (different campaigns can have different tones). One line in the prompt that dramatically changes the feel: `"Write narrative prose in the style of [value]."`

**Prompt-enforced clauses** (the 15 things the AI follows reliably — from gameplay-reference.md):
- DM persona: addresses each PC by name, sensory prose, narration style from player config
- Output format: narrative → `***` → Campaign State block → choices
- Campaign State block format: Location, Time, Status, mechanics lines
- Roll request format: `Roll Request: Skill (PC) | DC X | Context`
- Choice presentation: 2–3 bold options with "How do you proceed?"
- Quest mechanics format: `quest_add`, `quest_done`, `primary_mission`
- NPC mechanics format: `npc_add` on first appearance
- Item mechanics format: `item_add`, `item_remove` with properties
- Consequence mechanics: `consequence_add`, `consequence_resolve` with timers
- Chapter tracking: `chapter_add` at milestones
- Information gating: don't reveal undiscovered module content
- Dungeon secrets: don't reveal what hasn't been found
- Continuity self-check: verify state consistency at start of each response
- Advantage/disadvantage: state reasoning when granting
- Death save procedure format

**Removed from contract** (now code-enforced via gates):
- Roll before resolve → Gate 1
- Wait for player input → Gate 4
- Don't act for unmentioned PCs → Gate 5
- Spell verification → Gate 6
- Action economy tracking → Gate 2
- Income on every transaction → Gate 9
- Turn order → Gate 2
- Skill check requirements → Gate 7

**Also needed in Narrative prompt:**
- Ledger (compact state summary from `genLedger()`)
- Active consequences with timers
- Discovered module content (from episode tracking, when built)
- Session summary (from memory.js pruning)
- Active contracts (editable by player in manage mode)
- Narration style directive
- Recent OOC context (silent injection — last N Ask DM exchanges summarized, so the Narrative AI isn't blind to rulings/discussions from OOC)

#### Ask DM contract (OOC tab)

The Ask DM is an **objective rules arbiter with full situation awareness.** By-the-book, structured, precise. Players appreciated this tone in v1's Rules/OOC channels — it added structure to the game. Cite PHB pages and rules text. Ground answers in compendium data injected from IndexedDB.

**System instruction:** "You are a D&D 5e rules arbiter. Answer the question using the character data, campaign situation, and reference material provided. Be precise, cite rules sources. Advisory only — do not emit mechanics, do not advance the game state, do not narrate actions. If the question involves a hypothetical ('what would happen if...'), reason through it using the current situation but make clear this is theoretical."

**Ask DM prompt assembly:**
```
Player taps Ask DM in OOC
  → app reads the question
  → interception layer checks for app issues (route to system tools if match)
  → pulls relevant compendium data from IndexedDB (spells, feats, class features, race data)
  → builds prompt:
      - Ask DM system instruction (advisory only, no mechanics)
      - Current ledger (situation awareness)
      - Recent Narrative history (for theorycrafting context)
      - OOC history (for follow-up questions)
      - Character data (all PCs)
      - Pulled compendium entries (grounded in app data)
  → AI responds in OOC stream
  → citation linking auto-links rules references to compendium
```

**Acceptance test:** Write both contract texts. Narrative: run 5-message exchange, AI responds with vivid prose + correct mechanics blocks + narration style applied. Ask DM: ask 3 questions (rules lookup, theorycrafting, follow-up), AI answers precisely without advancing the game.

### Chat system spec

The chat is the play surface. Two tabs, multiple message types, streaming, sync, export.

#### Two tabs

| Tab | Firebase key | AI involvement | Purpose |
|-----|-------------|----------------|---------|
| **Narrative** | `narrative[]` | Full pipeline (buildPrompt → 9 gates → parseMechanics) | The game. Player actions in, DM narration + mechanics out. |
| **OOC** | `ooc[]` | Selective via Ask DM (advisory prompt, no mechanics) | Table talk, strategy, rules questions, theorycrafting. |

#### Tab UX

```
┌─────────────────────────────┐
│ [Narrative] [OOC •]         │  ← tab bar (• = unread badge)
├─────────────────────────────┤
│                             │
│  chat messages scroll area  │
│                             │
├─────────────────────────────┤
│ [input bar]          [send] │  ← changes per tab
└─────────────────────────────┘
```

- Active tab visually distinct (bold/underlined, accent color)
- Unread count badge on inactive tab — clears on tab tap, not on message render
- Tab switching is instant — both message lists stay in memory, no reload
- Each tab remembers scroll position independently
- Draft text persists per tab — switching doesn't clear what you typed
- Input bar changes per tab:
  - **Narrative:** placeholder "What do you do?", send button (⚡), stop generation button (during streaming), dice roller icon
  - **OOC:** placeholder "Talk to the party...", two buttons side by side:
    - **Send (💬)** — sends player text to OOC stream, no AI. Just table talk.
    - **Ask DM (🧙)** — sends the same input text to the advisory AI. Player types their question in the same input field, then chooses which button to tap. Example: player types "does Sneak Attack work with thrown daggers?" and taps Ask DM. The question appears as a `player` message in OOC, then the AI advisory response appears as `dm_advisory`. If the player types "hey check the chest in room 3" and taps Send, it's just table talk — no AI.

#### OOC → Narrative awareness

**No visible echo.** Narrative stream stays clean — no OOC breadcrumbs cluttering the game. Player awareness handled by nav badge + push notifications. One tap to OOC to see what happened.

**Silent context injection.** Recent OOC messages (especially Ask DM Q&A) injected into `buildPrompt()` so the Narrative AI knows what was discussed. Prevents the AI repeating information just clarified in OOC, or being blind to a ruling the player just got. Player sees clean Narrative; AI sees the full picture.

Injection is lightweight: last N Ask DM exchanges summarized as a few lines in the system prompt, not full OOC history. Format: `"[OOC context: Player asked about Sneak Attack with thrown weapons — ruled yes within 30ft.]"`

#### Message types

```
BaseMessage: {
  id: string,             // 'nar_' | 'ooc_' + timestamp + random suffix
  type: string,           // see below
  content: string,        // markdown text
  ts: number,             // wall clock timestamp (for sync/ordering). Displayed so players
                          // can see WHEN each other played: "Mom sent this at 9:14 PM."
  gameTs: string,         // in-game time from Campaign State ("Day 7, 04:30 PM"). Displayed
                          // so players can track time-sensitive events: "the poison wears off
                          // at Day 7, 06:00 PM — it's 04:30 now." Both timestamps always shown.
  playerName: string,     // who sent it (multi-player: which player/device)
  partial: boolean,       // true while AI is streaming, removed on complete
  cancelled: boolean,     // true if player stopped generation
}

Narrative types: 'player' | 'dm' | 'system' | 'roll_result' | 'checkpoint'  (no echo type — OOC awareness is silent injection)
OOC types: 'player' | 'dm_advisory' | 'system'

dm extends BaseMessage: {
  mechanics: ParsedMechanic[],  // extracted mechanic pills
  raw: string,                  // pre-strip content (before mechanic key removal)
}

roll_result extends BaseMessage: {
  roll: { skill: string, pc: string, result: number, dc: number, outcome: string }
}

system extends BaseMessage: {
  systemKind: 'gate_flag' | 'xp_receipt' | 'audit' | 'combat_event'
}

ParsedMechanic: {
  key: string,      // 'hp' | 'gold' | 'xp' | 'location' | etc.
  value: string,    // raw value
  target: string,   // PC name if applicable
  applied: boolean  // whether state was updated
}
```

**Rendering by type:**
- `player` — right-aligned bubble, player's PC name, action buttons (copy, export)
- `dm` (Narrative) — left-aligned, full width, "Dungeon Master" label, markdown rendered, mechanic pills inline, term glossary auto-linked, citation linking active
- `dm_advisory` (OOC) — left-aligned, visually distinct (DM icon, different background), citation linking active, no mechanic pills
- `system` — centered, no bubble, muted styling, tappable for detail/action
- `roll_result` — inline roll display with skill, PC, result, DC, pass/fail
- `checkpoint` — muted marker, auto-inserted at snapshot points

#### Overlays vs inline messages

Some game events are **persisted system messages** (stored in chat history, scrollable). Others are **ephemeral overlays** (floating UI over chat, need player action, not persisted).

**Persisted (system messages):**

| Source | System message | Player action |
|--------|---------------|---------------|
| Gate 1: Roll confirmation | "DM resolved [PC]'s [Skill] without your roll." | Roll now / Accept |
| Gate 3: Drift detector | "DM said you found [item] but didn't log it." | Add mechanic / Dismiss |
| Gate 5: Unmentioned PC | "[PC] wasn't given instructions. DM wrote: [summary]." | Accept / Redirect |
| Gate 6: Spell validation | "[PC] doesn't know [Spell]." | Acknowledge |
| Gate 7: Skill check | "DM resolved [action] without a check." | Request roll / Accept |
| Gate 8: XP audit | "No XP awarded for [event]." | Request XP / Dismiss |
| Gate 9: Income/loot | "[Item] added but no gold value logged." | Appraise / Dismiss |
| Level-up | "[PC] reached level [N]!" | Open wizard |
| Previously On | Session recap card | Dismiss |

System messages are actionable — one or two buttons, one tap resolves. Resolved messages collapse or fade.

**Ephemeral overlays** (not stored in chat, live in component state):

| Overlay | Trigger | Player action | On resolve |
|---------|---------|---------------|------------|
| Roll Request | `roll_request:` mechanic parsed | Submit roll via dice UI | Insert `roll_result` into Narrative, dismiss |
| Scene Transition Hold | Gate 4 detects location/time change | Confirm / Wait | Confirm: apply changes. Wait: inject correction into next prompt |
| Combat Turn Prompt | Gate 2: it's this player's turn | Submit action | Action becomes next `player` message |

Overlay state is ephemeral — if the app reloads mid-overlay, it's gone. The underlying gate will re-trigger on next response if still relevant.

#### Streaming

```
Player sends → API call begins → streaming response
  ├── Each token → append to message.content → re-render progressively
  ├── Markdown renders as tokens arrive
  ├── Mechanic pills DO NOT render until complete (can't parse partial blocks)
  ├── Auto-scroll follows streaming text (only if player was at bottom — see "Scroll behavior")
  ├── Stop button → mark complete → skip mechanics parse → "(generation stopped)"
  ├── Error → push system message "AI error: ..." → keep partial content
  └── Stream ends → mark complete → parse mechanics → run gates → apply state
```

- **Stop generation**: keeps received text, sets `cancelled: true`, does NOT parse mechanics (partial blocks unreliable). Gates don't run on cancelled messages.
- **Retry on error**: player taps retry → delete failed dm message → resend with same context.
- **System messages from gates**: appear AFTER streaming completes and mechanics are parsed.
- **Input field**: stays editable during streaming. Player can draft next message. Send disabled until stream completes; stop button shown instead. See "Input field during streaming" section.
- **OOC independence**: OOC tab can send/receive during Narrative streaming. Table talk doesn't wait for the DM. Ask DM requests queue until Narrative stream completes.

#### Chat persistence & sync

- **Narrative history** → Firebase (`narrative[]`). Synced across devices. Used in `buildPrompt()`.
- **OOC history** → Firebase (`ooc[]`). Synced across devices. Ask DM responses included.
- **Multi-device merge** — Clock-independent strategy (v1's proven `_mergeChatHistories()`):
  1. Each message has unique `id` (timestamp + random suffix)
  2. On Firebase update: build ID sets from local and remote
  3. Messages only in remote → append to local (new from other device)
  4. Messages only in local → keep (not yet synced — keep wins)
  5. Messages in both → keep local version (local edits take precedence)
  6. Sort merged array by `id` (timestamp-based, chronological)
  7. Deduplicate by `id`
- **Dirty-edit guard** — 3-second window after local edit, ignore remote Firebase updates (prevents clobber during rapid input)
- **Narrative pruning** — `memory.js` summarizes old messages when history exceeds token budget. Summaries stored as special message type. Originals archived (accessible via Session Review in manage mode).
- **OOC pruning** — Lightweight (mostly short text). Keep full history per campaign. Clear on campaign reset.
- **Message deletion** — Soft delete (mark hidden, keep in array for sync integrity). Hidden messages excluded from display and prompt building but survive merge without creating conflicts.

**What does NOT sync:** Overlay state, streaming state (`partial` flag), tab scroll position, input draft text, active tab selection.

#### Chat export

Both tabs exportable for dev review:
- **Moment export** — Long-press a message → export N messages of context around it. Format matches v1:
  ```
  === TINKLE'S TINCTURES — [NARRATIVE|OOC] MOMENT EXPORT ===
  Exported: ISO timestamp
  Target message: #N of total
  Context window: messages X–Y (Z total)
  Location: current location
  PCs: name (class level, hp/max HP), ...
  --- CONTEXT ---
  [timestamp] ROLE:
  content
  >>> TARGET MESSAGE <<<
  ```
- **Session export** — Full session dump. Narrative + OOC interleaved by timestamp. Markdown format.
- **Dev tools integration** — Export also available from DevTools (manage mode).

#### Player identity & onboarding

Every message needs a `playerName`. Set once during `PlayerOnboard` (setup mode) and stored in local state. Never prompt for identity mid-session — it would eat messages and break flow.

**Onboarding flow (from v1 Set Player pattern):**
```
┌─────────────────────────────┐
│       Welcome to V2         │
│                             │
│  Campaign: Tinkle's         │
│           Tinctures         │
│                             │
│  Your name: [________]      │
│                             │
│  Select character:          │
│  ○ Valenns  ○ Aria          │
│  ○ Slasher  ○ All (solo)    │
│                             │
│  Mode:                      │
│  ○ Single player            │
│  ○ Multi player             │
│                             │
│  [Enter Campaign]           │
└─────────────────────────────┘
```

- **Your name** — real name, not PC name. Used in `playerName` field on messages and for multi-device identification. Example: "Mom" or "Jessica."
- **Select character** — which PC(s) this player controls. "All" for solo mode. Determines which PCs Gate 5 checks against (see below).
- **Mode** — single or multi player. Affects Gate 5 behavior and Previously On triggers.
- **Stored in** — local device state (not Firebase). Each device has its own identity. Firebase carries the player roster so other devices know who's connected.
- **Edge case: identity somehow unset** — if `playerName` is null when player tries to send, show inline prompt in input area: "Who's playing? [name field] [Go]". Never block the UI or show a modal — just a gentle inline ask.
- **No auth** — family trust model. No passwords, no accounts. Device-local identity is enough. One player can act for another if needed (hand phone over, or set identity to the other player temporarily).

#### Single / multi player toggle

The game supports fluid handoff between solo and multi-player within a session. Not a permanent setting — a toggle.

**Why this exists:** "Sometimes I need my husband to play for me while I'm busy. That's why we sometimes say to the DM, 'I've been AFK, give me a recap.'" The app should support this naturally, not require restarting.

**Toggle location:** Quick Actions FAB or top bar toggle. One tap to switch. No confirmation modal — it's a low-risk, easily reversible action.

**What changes between modes:**

| Aspect | Single player | Multi player |
|--------|--------------|--------------|
| Character selection | "All" — player controls all PCs | Each player selects their PC(s) |
| Gate 5 (Unmentioned PCs) | Active — checks all PCs against the solo player. If AI acts for a PC the player didn't mention, it's flagged. | Active — only flags PCs belonging to current player |
| Previously On | Triggers on AFK return | Triggers on AFK return AND on player handoff (mode switch) |
| Push notifications | Off (one device) | Active — notifies when other player acts |
| OOC tab | Available for Ask DM questions (no table talk — you're talking to yourself). Send button hidden, Ask DM button only. | Table talk between players + Ask DM |
| Input bar label | "What do you do?" | "What does [PC name] do?" |

**Mode switch triggers Previously On:** When toggling from single → multi (a player is rejoining), the app triggers Previously On so the returning player gets caught up. Example: Mom played solo for an hour, Dad picks up his phone, toggles multi → sees "Previously On" recap of what happened while he was away.

#### Scroll behavior

**Problem from v1:** Player scrolls up to read earlier messages. Another player sends a message. The chat yanks the scrolled-up player back to the bottom. Disorienting and frustrating.

**Solution — conditional auto-scroll:**
```
if (scrollPosition is at bottom or near bottom):
    auto-scroll to new message  ← default behavior, smooth
else:
    do NOT auto-scroll  ← player is reading, don't yank them
    show "↓ New messages" indicator at bottom of chat
    indicator shows count: "↓ 3 new messages"
    tap indicator → smooth-scroll to bottom + dismiss
```

- **"Near bottom" threshold:** within ~100px of the scroll end. Accounts for imprecise tapping.
- **Indicator style:** floating pill/chip at bottom of scroll area, above input bar. Semi-transparent, tappable. Disappears when player scrolls to bottom manually or taps it.
- **Per-tab:** each tab tracks scroll position independently. OOC scroll state doesn't affect Narrative.
- **During AI streaming:** auto-scroll follows streaming text ONLY if player was already at bottom when streaming started. If player scrolled up during streaming, let them read in peace.

#### Gate 5 multi-player awareness

Gate 5 (Unmentioned PC Actions) must be player-aware, not just PC-aware.

**Problem without this:** In multi-player, Gate 5 would flag every PC the AI acts for that the current player didn't mention — including PCs belonging to the OTHER player. That's noise, not signal.

**Fix:** Gate 5 checks which PCs belong to the current player (from PlayerOnboard character selection). It only flags PCs that:
1. Belong to the current player (the one who sent the message)
2. Were NOT mentioned as actors in the player's message
3. WERE given actions by the AI

**Example:**
- Mom controls Valenns. Dad controls Aria and Slasher.
- Mom types "Valenns searches the room."
- AI responds: Valenns searches (good), Aria stands guard (Dad's PC — not flagged by Gate 5 for Mom), Slasher checks the door (Dad's PC — not flagged for Mom).
- If the AI also narrated "Valenns casts Detect Magic" but Mom didn't say that — Gate 5 flags it, because Valenns is Mom's PC and Mom didn't mention casting.

**In single player mode:** Gate 5 checks all PCs against the solo player. One player controls everyone, so if the player says "Valenns searches the room" and the AI narrates Aria and Slasher doing things the player didn't say — that's still a flag. The solo player still deserves to decide what each PC does.

#### Input field during streaming

**The input field stays editable while the AI is streaming a response.** Players draft long, detailed messages — blocking the input during streaming would frustrate them.

**Behavior:**
- Player sends a message → AI starts streaming → input field clears and is immediately available for typing
- Player can draft their next message while reading the AI response
- Send button is disabled until streaming completes (can't send while AI is mid-response — would create prompt ordering issues)
- Stop button replaces send during streaming — tap to cancel, then send button returns
- Draft text persists if player switches tabs during streaming — switching to OOC and back doesn't lose the draft

**OOC is independent:** OOC tab can send messages at any time, even while Narrative is streaming. The two channels are independent — table talk shouldn't wait for the DM to finish narrating. Ask DM during Narrative streaming: queued, sent after Narrative stream completes (prevents prompt conflicts).

#### Push notifications — scope

Push notifications fire for ALL OOC messages, not just Ask DM responses.

**Why:** v1's biggest OOC problem was that no one checked it. Notifications are the fix. If Dad sends "hey are you still playing?" in OOC and Mom's phone doesn't buzz, OOC is dead again.

**What triggers a push notification:**

| Event | Notification text | When |
|-------|------------------|------|
| OOC player message | "[playerName]: [first 50 chars]" | App backgrounded or other player's device |
| OOC Ask DM response | "DM answered your question" | App backgrounded (same device) |
| Narrative AI response (not your turn) | "The story continues..." | Multi-player, other player's device |
| State change needing attention | "Level up available!" / "[PC] is at 0 HP!" | Any time |
| Combat turn | "It's [PC]'s turn!" | Multi-player, that player's device |

**What does NOT trigger a push:**
- Your own messages echoing back from Firebase sync
- System messages from gates (visible inline, not urgent enough for phone buzz)
- Tab badge updates (in-app only)

**Implementation:** Web Push API + Firebase Cloud Messaging (FCM). Both free. Player opts in once during onboarding. Respect OS notification settings.

#### Previously On as handoff tool

Previously On serves two purposes: (1) AFK return recap and (2) player handoff recap.

**AFK return (existing spec):** Triggers when idle time exceeds threshold. Shows narrative recap + state diff. Dismissable card.

**Player handoff (new):** Triggers when multi-player mode is toggled ON, meaning a second player is joining a session that was running solo. The returning player needs to know what happened while they were away.

**Handoff Previously On includes:**
```
┌─────────────────────────────┐
│  📖 Previously On...        │
│                             │
│  [Narrative recap: 2-3      │
│   sentences summarizing     │
│   what happened since last  │
│   multi-player session]     │
│                             │
│  State changes:             │
│  • Valenns: HP 45→38        │
│  • Location: Hunting Lodge  │
│    → Forest Road            │
│  • Quest completed: "Free   │
│    the Prisoners"           │
│  • New NPC: Captain Harwin  │
│  • Gold: +150 (gem pouch)   │
│                             │
│  [Dismiss]                  │
└─────────────────────────────┘
```

- The recap is generated by `memory.js` summary diffed against the last session where multi-player was active
- The state diff is a pure comparison — no AI call needed. Shows HP changes, location, quests completed/added, NPCs met, inventory changes, gold changes
- Dismissable — player can read it and move on. Not blocking.

### Core loop acceptance test

A session where: player types an action → AI responds with narrative + mechanics block → mechanics are parsed and applied to state → state changes visible in UI → next message includes updated ledger in prompt. No enforcement gates yet — just the loop.

---

## Phase 2: Enforcement Gates

> Law 2. Build in priority order from enforcement-spec.md. Each gate is independent — ship one, test it in play, then build the next.

- [ ] **Gate 1: Roll confirmation** — Reject mechanics depending on rolls the player didn't submit. Track `pendingRolls` set. Scan AI prose for roll patterns. Flag fabricated rolls. Prompt player to roll or accept. Enemy/NPC rolls exempt.
- [ ] **Gate 2: Combat turn enforcement** — When `combat.active`, enforce initiative order. One PC per AI response. Track actions used per turn (action/bonus/reaction/movement). Reject multi-turn responses. Prompt next PC after current turn resolves.
- [ ] **Gate 3: Drift detectors** — Scan narrative for state changes without matching mechanics. Gold/items/NPCs/HP/conditions/location/time. Flag with warning pill. Offer to auto-generate missing mechanic. Don't auto-reject.
- [ ] **Gate 4: Scene transition** — Detect location/time changes in mechanics. Hold transition, show narrative up to that point. Prompt player: "Ready to move on?" Player-initiated moves lower the gate.
- [ ] **Gate 5: Unmentioned PC actions** — Parse player message for PC names as actors. Parse AI response for PC names as actors. Diff. Flag PCs the AI acted for that the player didn't mention. Distinguish actions from perceptions. **Player-aware:** in single-player, checks all PCs against the solo player. In multi-player, only flags PCs belonging to the current player (from PlayerOnboard selection). See "Gate 5 multi-player awareness" in chat spec.
- [ ] **Gate 6: Spell validation** — Check spell name against caster's known spells. Check slot availability. Auto-resolve concentration conflicts. Requires system-owned spell data populated by char creation / level-up.
- [ ] **Gate 7: Skill check requirement** — Map action keywords in player messages to expected checks. If AI resolves without requesting a roll, flag it. Three-condition test: uncertain outcome + meaningful consequences + requires skill.
- [ ] **Gate 8: XP audit** — After `quest_done`, combat end, `chapter_add`: check if `xp:` mechanic was emitted in same or previous 2 responses. Flag if missing.
- [ ] **Gate 9: Income/loot reconciliation** — On `item_add` with treasure/jewelry/gems category, check for corresponding `income:` mechanic. Flag if missing.

Full specs for each gate: `.claude/enforcement-spec.md`

---

## Phase 3: Play Mode UI

> Everything the player sees and taps during a session. Build after core loop works.

- [ ] **Context banner** — `ContextBanner.jsx`. Location, weather, time. All tappable → navigates to source (Journal locations, etc). Updates from state signals.
- [ ] **Situation bar** — `SituationBar.jsx`. Horizontal scroll. Main quest pinned left (always visible). Active consequences/countdowns pinned after main quest, sorted by urgency, visually distinct. Player quests scrollable after. Each chip tappable → quest detail.
- [ ] **Character tiles** — `CharTiles.jsx`. HP bar, name, conditions. One per PC. Tap → character sheet overlay. Compact enough for 3 PCs on one screen row, scalable to 6-7.
- [ ] **Dice roller** — `DiceRoller.jsx`. Inline icon (not a tab). d4/d6/d8/d10/d12/d20 selector. Modifier input. Roll result displayed inline. Submits to `pendingRolls` for Gate 1.
- [ ] **Roll request banners** — `RollRequest.jsx`. When AI emits `Roll Request: Skill (PC) | DC X | Context`, banner appears pre-filled. Player taps to roll. Result auto-submitted.
- [ ] **Mechanic pills** — `shared/MechPill.jsx`. Tappable pills in AI responses. `hp: -5` shows as red pill. `item_add: Shortsword` shows as item pill. Tap → navigates to source (character sheet HP, cargo inventory, etc).
- [ ] **Term glossary links** — Auto-link D&D terms in AI messages. Tap → definition popup. Data from `v1-seed-data.md` glossary (97 terms).
- [ ] **Checkpoint/rewind** — `Rewind.jsx`. State snapshots at: long rest, level-up, PC at 0 HP, periodic auto. Rewind stack. One-tap restore. Accessible mid-session in play mode, not buried in manage.
- [ ] **TTS toggle** — `TTS.jsx`. Browser speech synthesis. Toggle on/off per message or continuous. Not automatic. ElevenLabs free tier as upgrade path.
- [ ] **Previously On / Catch Up** — AI-powered session recap. Depends on memory.js (Phase 1) for session summaries and state diff. **Two triggers:** (1) AFK return — detect idle time > threshold. (2) Player handoff — mode switches from single → multi, returning player gets caught up on what happened. Both show: narrative recap (AI call via memory.js summary) + tracker audit (pure state diff: HP, quests, inventory, location, gold, NPCs). UI: dismissable card at top of chat. See "Previously On as handoff tool" in chat spec.
- [?] **Quick Actions** — `QuickActions.jsx`. Floating action button. Needs redesign from v1. See spec below.
- [ ] **Combat overlay** — `Combat.jsx`. Phase 1: zone grid (Frontline/Backline/Flanks). Initiative strip. Token chips per PC/NPC. Appears when `combat.active = true`, disappears when combat ends.
- [ ] **Nav badges** — Dot badges on bottom nav when state changes in other modes. In-chat alerts for important state changes.
- [ ] **OOC tab** — Player text by default, no AI. Ask DM button injects an AI response into the OOC stream. Ask DM prompt includes: current situation from Narrative history + OOC history + character data + relevant compendium data pulled from IndexedDB. System instruction: "advisory only — answer the question, don't emit mechanics, don't advance the game." Two tabs total: Narrative (the game) and OOC (everything else).
- [ ] **Ask DM interception layer** — Before Ask DM sends to the AI, pattern-match the question for app issues. "Can't modify/change/edit [X]" → route to relevant editor/wizard. "What's in my inventory" → open Cargo. "How much gold" → open Treasury. "What are my spells" → open CharSheet Spells tab. Detection patterns: "can't/won't/how do I" + field name → system tool. Only questions the app can't answer directly hit the AI. Saves API calls, gives better answers.
- [ ] **Ask DM data injection** — Before Ask DM prompt goes out, detect what the question is about and pull relevant data from IndexedDB/state. Spell questions → pull spell entries. Feat questions → pull feat data. NPC questions → pull NPC tracker entries. Class feature questions → pull class progression data. Grounds AI answers in actual app data, not training data. Especially important for homebrew content the AI has never seen.
- [ ] **Citation linking** — Auto-link rules references in AI responses (spell names, feat names, conditions, PHB citations) to compendium entries when content is imported. Same auto-linking tech as term glossary, extended to Ask DM and Narrative responses. AI cites "PHB 182" → tappable link to travel pace rules in compendium. Tap-to-source for AI knowledge.
- [ ] **Inline NPC name linking** — Auto-link NPC names in chat messages to NPC tracker entries in Journal. Same tech as term glossary + citation linking. Tap NPC name → navigate to NPC detail. From player-requests: requested, designed in v1, never built.
- [ ] **Push notifications** — Web Push API (free, works on Android Chrome + iOS Safari 16.4+). Fires for ALL OOC messages (not just Ask DM), Narrative responses on other player's device, state changes needing attention, combat turn prompts. Player opts in during onboarding. Pairs with Firebase Cloud Messaging. Needed from day one for 2-player — without it, OOC is dead (v1 problem: no notifications meant no one checked OOC). Full notification table in chat spec "Push notifications — scope" section.

### Quick Actions — design needed

v1 Quick Actions was a FAB with common play actions. Carried forward but needs redesign.

**Questions to resolve:**
- What actions belong here? (Short rest, long rest, check inventory, ask about location, request recap?)
- Are these AI-directed (inject a message) or system-directed (trigger a function)?
- Should system operations (HP reset, stat correction) live here instead of going through AI chat?
- Mobile ergonomics: FAB placement, action list size, one-tap vs two-tap

**Candidate actions:**
- Short rest / Long rest (system operation: restore hit dice, reset slots, HP recovery)
- Check inventory (reference shortcut → Cargo overlay)
- Where are we? (reference shortcut → Journal locations)
- What do I know? (reference shortcut → Journal with discovered filter)
- Request recap (AI message: "Previously On")
- Roll initiative (system operation: start combat mode)
- End combat (system operation: exit combat mode)
- Toggle single/multi player mode (system operation: switches mode, triggers Previously On on multi→single handoff)

---

## Phase 4: Reference Mode

> Mid-session orientation. Overlays over chat — tap to open, tap away to close. No mode switch friction.

- [ ] **Character sheet** — `CharSheet.jsx`. 6-tab overlay (Stats/Vitals/Spells/Features/Equipment/Bio). Full spec below. See `charsheet-mockup.html` for interactive visual reference.

### Character sheet spec

**Layout:** Overlay that slides up from character tile tap. Drag handle to dismiss. Header + XP bar + swipe indicator + lock bar + 6 tabs + scrollable content.

**Header:**
- PC avatar (colored circle with initial, border = PC accent color)
- Name + inspiration star toggle (tap to toggle)
- Class/race/level subtitle
- HP mini badge (always visible regardless of tab)
- **Color picker:** tap avatar color dot → color picker for PC accent color (tokens, borders, name displays). Stored in `characters[].color`.
- **XP bar:** below header. Shows `currentXP / nextLevelXP`. Tap to manually edit XP. **Level-up glow:** when XP >= threshold, bar pulses green. Tapping opens level-up wizard. The character IS the notification.
- **Swipe between PCs:** dot indicators below XP bar. Swipe left/right on header to switch PCs without closing the sheet. All tabs reload for the new PC. Quick reference during combat.
- **JSON import button:** in lock bar. "Update from JSON" per character. Auto-detects format, preserves HP/XP/conditions.

**Lock bar:** "Fields locked during play" + unlock toggle. Unlock enables editing system-owned fields (with confirmation). Lock bar also shows JSON import button.

**"What changed" tab badges:** After AI mechanics apply, pulsing gold dot appears on tabs where fields changed. Vitals dot = HP changed. Spells dot = slot used. Clears on tab view. Tap-to-source in reverse — connects mechanic pills in chat to where they landed.

**Every modifier is a roll:** Any field with a d20 modifier is tappable for a roll. Ability scores → d20+mod. Skills → d20+bonus. Saves → d20+bonus. Initiative → d20+DEX. Attacks → d20+hit. Spell attack → d20+bonus. Fields without roll context (AC, speed, DC) are not rollable. Visual hint: rollable values show in accent color. Active press state: border flash + background tint.

#### Stats tab
- **Ability scores** — 3x2 grid. Each box: abbreviation, score, modifier. All tappable (roll d20+mod).
- **Saving throws** — 6 rows. Proficiency dot (filled = proficient). Name + bonus. All tappable (roll).
- **Skills** — All 18 skills. Proficiency dot (blue = proficient, gold = expertise). Name + ability tag + bonus. All tappable (roll).
- **Quick reference** — Initiative (tappable, roll d20+DEX), Proficiency bonus, Speed, Passive Perception, Passive Investigation.

#### Vitals tab
- **Hit Points** — Large HP display (current/max), HP bar, +/- buttons (-5, -1, custom, +1, +5), temp HP row. AI-owned with player override (logged).
- **Armor Class** — Shield display with AC number, source breakdown (armor type + DEX).
- **Attacks** — Cards with weapon/spell name, hit bonus, damage, range. Tappable (roll d20+hit). "d20" hint on right side.
- **Conditions** — Chips with condition name + optional duration counter (rounds/hours). Tap to remove. Duration auto-decrements. Concentration shown as a condition here too.
- **Hit Dice** — Pip display (filled = available, empty = used). Tap available pip to spend (heal d{hitDie}+CON). Shows heal estimate.
- **Death Saves** — Heart and skull pips, tap to toggle each.
- **Exhaustion** — 1-6 scale, tap to set level.
- **Familiar/mount** — Card with name, type, HP bar, AC, speed. Gets own combat token. Shows when `characters[].familiar` is not null. AI-owned.
- **Rest buttons** — Short Rest and Long Rest side by side at bottom. Short: spend hit dice + class recovery features (Arcane Recovery, etc). Long: full HP, all slots, half hit dice. System operations — not AI chat. The "fix it" button is right where you see depleted resources.

#### Spells tab
- **Spellcasting stats** — Three boxes at top: Spell Save DC (8+prof+ability), Spell Attack bonus (prof+ability, tappable roll), Spellcasting Ability (ability + modifier). Always visible.
- **Concentration pinned spell** — When concentrating, the active spell pins to top with glowing border and "End" button. Reminds player they'll lose concentration if they cast another concentration spell. Same spell also shows as condition in Vitals.
- **Spell slots** — Rows per level. Pip display (filled = available). Tap to use/restore.
- **Spell card layout** — Collapsed: level badge, spell name, school tag, expand arrow. Expanded: three lines — (1) casting time · range · duration, (2) **V, S, M component badges** (prominent purple pills, each component separate — player-requested), (3) description text. Browse Compendium button under spellcasting notes.
- **Cantrips** — Level badge "C", green tag. Same expand/collapse as leveled spells.
- **Known spells** — Grouped by level. Same expand/collapse. Tap for full description (from compendium/IndexedDB).

#### Features tab
- **Class features** — Cards with name, source (class + level), description. Sorted by acquisition level.
- **Racial traits** — Cards with name, source, description.
- **Resources** — Pip displays for limited-use features (Superiority Dice, Channel Divinity, etc). Tap to use/restore.
- **Feats** — Cards with name, source level, description.
- **Proficiencies** — Tag chips (weapons, armor, tools, etc).

#### Equipment tab
- **Encumbrance bar** — Current weight / capacity (STR x 15). Warning color when over 2/3.
- **Items** — Each item shows: name, color-coded type tag (WEAPON/TOOL/SUPPLY/HERB/COMPONENT/ITEM/TREASURE), acquisition metadata ("+4 Day 18, 06:00 AM — Mere of Dead Men"). Tappable for detail.
- **Party currency** — Bottom footer: CP/SP/GP/PP displayed inline. "Tap for full Treasury" link.
- **Footer** — "Wagon & Hoard in Cargo tab" link.

#### Bio tab
- **Race reference card** — Pulled from compendium (IndexedDB). Name, lore description, trait chips (Darkvision, Fey Ancestry, etc), size, speed, age. Read-only. Player shouldn't need to ask AI what their species looks like.
- **Identity** — Background, Alignment, Languages. System-owned.
- **Appearance** — Player-owned. Tap to edit.
- **Personality** — Player-owned. Tap to edit.
- **Backstory** — Player-owned. Tap to edit.
- **Notes** — Player-owned. Tap to edit. Freeform.

#### Manual Override (v1's "Advanced Editor")
Accessed via lock icon / edit button on character sheet. Full form-based editor for when the engine gets it wrong. Not the primary path — wizards and enforcement handle normal play. This is the escape hatch.

- **Core fields** — Name, race, class, subclass, level, background, alignment, HP, max HP, AC, initiative, speed, XP, all 6 ability scores. System-owned fields require unlock confirmation.
- **Skills sub-tab** — Proficiency toggles on saves + skills. All bonuses **derived at render time** (not stored) — `mod = abilityMod + (isProficient ? profBonus : 0)`. V1 stored computed values and they drifted; V2 computes on the fly.
- **Features sub-tab** — Edit feature text, add/remove. Resources with MAX/USED counters.
- **Attacks sub-tab** — Attack builder: stat selector, bonus, prof checkbox, damage dice + modifier, properties (finesse, versatile, thrown, etc). Add/remove attacks.
- **Spells sub-tab** — Spell slot editor (MAX/USED per level). Spell Compendium browser inline (search, filter by class/level, import). Manual add for homebrew.
- **Gear sub-tab** — Add/remove items. Equipped vs Carried. Type, weight, description fields.
- **Familiar** — Full stat block editor (all 6 abilities, HP, AC, speed, passive perception, special abilities). Add/remove.
- **Danger zone** — Delete character, color picker, Update from JSON, Share Character.
- **Audit** — All Manual Override edits are logged (field, old value, new value, timestamp). Visible in DevTools.

- [ ] **Journal** — `Journal.jsx`. Sections: Quests, Locations, NPCs, Travel Log, Consequences, Town Reputation, Secrets. All AI-owned via mechanics. Secrets consolidated to one home with `playerKnown` / `aiOnly` flags. Quests show status (active/completed/failed). Locations show discovered/undiscovered. NPCs show disposition.
- [ ] **Cargo** — `Cargo.jsx`. Three containers: Carried (per-PC), Wagon (party shared), Hoard (stored/stashed). Items from `item_add` mechanics. Weight tracking (encumbrance). AI-generated items (Firebase) vs compendium items (IndexedDB) display the same.
- [ ] **Travel calculator** — In Journal's locations section. Tap a known destination → see distance, estimated travel time at current party speed (accounts for slowest member — mounts, oxen, vehicles), encounter risk level. Math is free (Law 5). AI handles "should we go?" judgment via Ask DM — app handles "how long will it take?" Depends on locations tracked in Journal state with distance/terrain data.
- [ ] **Treasury** — `Treasury.jsx`. PP/GP/EP/SP/CP tracked separately. Income/expense log (every `income:` / `expense:` mechanic). Lifestyle tracker. Business profile (if applicable). All AI-owned via mechanics.
- [ ] **Compendium** — `Compendium.jsx`. Spell browser, feat browser, item browser. Data from IndexedDB (imported content). Search + filter. Spell details include: level, school, casting time, range, components, duration, description. Populated by content pipeline, not hardcoded.
- [ ] **Glossary** — `Glossary.jsx`. D&D term definitions. Seed data from v1 (97 terms in v1-seed-data.md). Expandable. Same data that powers auto-linking in chat.

---

## Phase 5: Setup Mode

> First-launch experience. Mostly locked after campaign starts. Re-entry via manage mode for corrections.

- [ ] **Session Zero wizard** — `SessionZero.jsx`. Campaign name, setting, tone, module selection (if content imported). AI contract defaults. Generates initial world state. **Narration style field:** text input for narrative voice ("Brandon Sanderson," "dark and gritty like Joe Abercrombie," freeform description). Injects into Narrative contract as `"Write narrative prose in the style of [value]."` Lives in campaign data. Also editable mid-campaign in Settings.
- [ ] **Character creation** — `CharCreate.jsx`. Race, class, ability scores, background, equipment. Populates system-owned fields. Spell selection for casters. Uses compendium data from IndexedDB (class progressions from v1-seed-data.md until content pipeline built).
- [ ] **Content import** — `ContentImport.jsx`. File upload (PDF, epub, mobi). Web URL import. Markdown/text paste. JSON import. Routes to appropriate parser. Preview before committing to IndexedDB.
- [ ] **Campaign config** — `CampaignConfig.jsx`. Module selection, episode tracking setup, house rules, contract customization.
- [ ] **Player onboarding** — `PlayerOnboard.jsx`. Share link generation. Content sync (shared bundles). Character creation for new player. Device-local identity: player name, character selection, single/multi mode. See "Player identity & onboarding" in chat spec for full flow mockup. Push notification opt-in prompt during onboarding.

---

## Phase 6: Manage Mode

> Between-session work. Intentional transition — one step removed from play.

- [ ] **AI contracts editor** — `Contracts.jsx`. View/edit AI contracts. Show which are code-enforced vs prompt-enforced. Toggle individual enforcement gates. Default contracts from v1 reference.
- [ ] **Session review** — `SessionReview.jsx`. Archive current session. View past session summaries. Chat export.
- [ ] **Dev tools** — `DevTools.jsx`. State inspector. Error flag log. Enforcement gate fire log. Manual state corrections (system-owner bypass for developer). Combat state viewer.
- [ ] **Settings** — `Settings.jsx`. API key management (Gemini, OpenRouter, ElevenLabs). TTS config. Color mode toggle (default/light/night). Player preferences.
- [ ] **Level-up wizard re-entry** — Re-open level-up wizard to fix missed choices (e.g., Bard 3 expertise). Edit mode for system-owned fields through the wizard path, not raw editing.
- [ ] **System operations UI** — One-tap HP reset, short/long rest mechanics, stat corrections. These bypass AI chat — direct system actions. May overlap with Quick Actions.

---

## Phase 7: Content Pipeline

> The import system. Any content in → normalized schema → IndexedDB → engine/UI reads it.

- [ ] **File parser** — `fileParser.js`. PDF text extraction. Epub/mobi unpacking. Chapter detection. Table parsing (spell tables, class tables).
- [ ] **Web parser** — `webParser.js`. Fetch and parse open reference sites. Extract structured data (spells, classes, feats, monsters).
- [ ] **Markdown parser** — `mdParser.js`. Homebrew content in markdown format. Adventure modules as markdown chapters.
- [ ] **JSON import** — `jsonParser.js`. Structured data from any LLM. Spell lists, class data, adventure outlines. Schema validation.
- [ ] **Normalizer** — `normalizer.js`. All inputs → common schema per content type. Spell schema, class schema, feat schema, monster schema, module schema. One format for the engine regardless of source.
- [?] **Episode/module tracking** — How the AI knows where the party is in the story. See spec below.
- [ ] **Spell DB expansion** — Current seed data only covers cantrips through Level 2. Characters past level 5 get empty spell pickers without imports. Need L3+ for all caster classes. Either: expand seed JSON, or provide pre-built class progression downloads as JSON files players can import. From player-requests.
- [ ] **Pre-built class progression downloads** — Ready-made JSON files for common class/subclass combos (e.g., "Bard L1-20 complete"). Hosted or generated by LLM. Eliminates the gap between seed data and full content pipeline. From player-requests.
- [ ] **Shared bundles** — `bundles.js`. Generate content pack from one player's IndexedDB. Import on another device. Reusable (supports mid-game joins). Firebase carries "has pack X" flag.

### Episode/module tracking — design needed

**The problem:** When a campaign follows a published module (or homebrew adventure), the AI needs to know: what chapter/episode the party is in, what's been discovered, what's ahead, and when to advance. v1 had no system for this — the AI just had the full module text in context, which burned prompt budget and leaked spoilers.

**What needs designing:**
- How chapters/episodes are structured in IndexedDB after import
- Discovery flags: `discovered = true/false` per chapter/scene/location
- What gets injected into buildPrompt: only discovered chapters, plus a "what's next" hint for the AI
- Trigger conditions for chapter progression (location-based? quest-based? AI-detected?)
- How the player sees progress (episode list in Journal? progress bar? chapter markers in chat?)
- Relationship between `chapter_add` mechanic and episode tracking state

**Constraints:**
- Law 2: play/reference modes show discovered content only. Setup/manage show everything.
- Law 5: prompt budget. Full module text can't go into every prompt. Need selective injection.
- Must work for both published modules (structured) and freeform campaigns (emergent).

---

## Phase 8: Multi-Player & Polish

> After solo play works, add the multi-device experience and visual polish.

- [ ] **Firebase real-time sync** — Multi-device state sync. Clock-independent chat merge (v1's proven approach). Conflict resolution for concurrent writes. Connection status indicator.
- [ ] **Shared content bundles** — Generate + import flow. Content packs reusable across players. "Has pack X" flag in Firebase.
- [ ] **Combat phase 2** — Visual tile map. Tappable grid. Terrain backgrounds. Token movement. Mobile VTT inspired. Evolves from phase 1 zone grid — same state, richer UI.
- [x] **20 color themes** — 10 dark + 10 light. CSS custom property swap. Palette defined in Phase 0. Spec complete.
- [?] **Child-friendly view** — `AppSimple.jsx`. Same state/engine, simplified UI. Separate URL entry point. See spec below.
- [ ] **Data migration** — `migrate.js`. State version tracking. Automatic migration on load when schema changes.

### Child-friendly view — design needed

**Open question:** Ages 7-16 is wide. What's the actual target?

**What needs designing:**
- UI simplification scope (bigger targets, less text, guided choices — but how much?)
- Whether it's a full separate UI or a "simplified mode" toggle
- How spell/feat complexity is handled for younger players
- Whether TTS read-aloud is the primary interaction mode
- What management features (if any) are accessible

**Decided:** Separate URL entry point (`AppSimple.jsx`), same state/engine/Firebase/API keys. Not a toggle — a different UI root. Design based on actual play with the child.

---

## Open Questions

> Not yet decided. Need design sessions or gameplay testing to resolve.

| Question | Context | Blocking |
|----------|---------|----------|
| ~~Color palette~~ | **Decided: 20 themes (10 dark + 10 light).** Defined in palette-sampler.html. Spec in Phase 0. | Resolved |
| Child-friendly view target age | 7-16 is wide. What simplification scope? | Phase 8 |
| Episode/module tracking triggers | Location-based? Quest-based? AI-detected? | Phase 7 |
| Quick Actions action list | What actions, system vs AI directed, FAB ergonomics | Phase 3 |
| ~~V1 data migration~~ | **Decided: fresh start.** V1 stays live for reference. V2 launches with a new campaign. No migration code needed. | Resolved |
| ~~OOC & Rules channels~~ | **Decided: two tabs.** Narrative (full AI) + OOC (player text + Ask DM button). Rules tab eliminated. See design below. | Resolved |

### OOC & Rules channels — DECIDED

**V1 had three channels** — Narrative (always AI), Rules (always AI), OOC (player text + Ask DM button). In practice, Rules and OOC described the same function. Players used both for rules questions. OOC was also used for app issues the AI couldn't fix.

**V2 design: two tabs.**

**Narrative tab** — The game. Full AI context (ledger + chat history + contracts + module content). Emits mechanics, advances the story. This is the play session.

**OOC tab** — Everything else. Player text by default (no AI cost). Ask DM button for on-demand AI:
- Gets full situation context: Narrative history + OOC history + character data + compendium data pulled from IndexedDB
- System instruction: "advisory only — answer the question, don't emit mechanics, don't advance the game state"
- Handles: rules interpretation, theorycrafting ("what would happen if..."), rules lookups the compendium can't answer alone
- Ask DM interception layer catches app issues ("can't modify expertise") and routes to system tools before hitting AI
- Ask DM data injection pulls relevant compendium entries into prompt so answers are grounded in actual app data
- Citation linking auto-links spell names, feat names, PHB references to compendium entries

**What moved where:**
- Rules lookup ("what does Mending do?") → reference mode / compendium (free, no AI)
- State lookup ("what's in my inventory?") → reference mode / Cargo (free, no AI)
- App issues ("can't edit expertise") → Ask DM interception → system tools (no AI)
- Rules interpretation ("can Slasher sneak attack with a thrown handaxe?") → Ask DM (AI, advisory only)
- Theorycrafting ("what if we cast Silence on the lair?") → Ask DM (AI, advisory only, situation-aware)
- Player chat ("everyone ready?") → OOC text (no AI)

**Proposed design (pending confirmation):**
- **Narrative tab** — Full AI context (ledger + chat history + contracts + module content). The main play experience.
- **Rules tab** — AI with ledger + character data + rules contracts only. No narrative history. Cheaper prompt, focused answers. System prompt says "answer D&D rules questions using the character and campaign data provided."
- **OOC tab** — Plain text, no AI. Player-to-player messages synced via Firebase. Minimal UI.
- **App issues** — Not a chat channel. System operations UI in manage mode + Quick Actions for common fixes.

### V1 data migration — DECIDED

**Fresh start.** V1 stays live for reference. V2 launches with a new campaign. No migration code needed.

---

## Icebox

> Noted, not planned. Revisit when core is solid.

- **Plugin system** — Accidental v1 feature (superpowers). Could support game-system plugins (Pathfinder, homebrew rules). Not v2 priority.
- **Encounter presets** — Save/load enemy groups for fast combat setup. Built and used in v1. Cut initially for v2 but player-requests confirm value. Could return via content pipeline JSON import or as a combat QoL feature.
- **Desktop layout** — Law 3 says no. But if demand appears, the component architecture supports it.

---

## Build Order

Phases are roughly sequential but overlap where practical:

1. **Phase 0** → scaffold + state + Firebase + seed data (foundation)
2. **Phase 1** → core loop MVP including AI contract text + memory management (can play a session, no enforcement)
3. **Phase 2** → enforcement gates (build one at a time, test in play)
4. **Phase 3** → play mode UI (make it feel like an app, not a terminal)
5. **Phase 4** → reference mode (mid-session orientation)
6. **Phase 5** → setup mode (first-launch experience)
7. **Phase 6** → manage mode (between-session tools)
8. **Phase 7** → content pipeline (replace hardcoded data)
9. **Phase 8** → multi-player + polish (second player joins)

**Key dependencies:**
- AI contract text (Phase 1) is a writing task — can start during Phase 0 scaffolding
- Memory management (Phase 1) is needed before any session longer than ~20 messages
- Color palette (open question) blocks visual polish but not functionality — build with placeholders
- Seed data (Phase 0) is the bridge: v1 constants in IndexedDB before content pipeline exists
- Previously On (Phase 3) depends on memory.js from Phase 1
- Gates (Phase 2) can interleave with play UI (Phase 3) — build a gate, build a UI piece, test in play, repeat
- Content pipeline (Phase 7) can start earlier — normalizer and IndexedDB layer are independent of UI
- V1 data migration (if chosen) is a one-time manage mode tool, not a prerequisite for anything
