# Workboard

*Active work, queued items, specs. The build plan for V2.*

> **READ THIS FIRST.** The Phase 0–8 plan below is the **original design reference** — full data shapes and acceptance tests, still useful. But its checkboxes drifted badly (shipped features still showed `[ ]`). The **Reality Snapshot** immediately below supersedes those checkboxes as the current build status. When they disagree, the snapshot wins.

---

## Reality Snapshot — Session 39 · 2026-06-23

Reconciled by reading every `src/` file (line count + content) and the test suite. Decision this session: **build forward from the committed state.** Not recovering the lost uncommitted onboarding.

> **CORRECTION (developer review):** The player-facing app **is a face.** The screens render and the code wires `sendMsg → engine`, but it is **not a working play experience** — you cannot actually sit down and play it. Reading code presence + store-wiring as "functional" is the same mistake S37 made and I repeated. **Two separate axes from here on:**
> - **Engine logic** — real, some of it unit-tested. This is the genuine asset.
> - **Playable experience** — does **not** exist yet. The UI is a façade over the engine, not a functioning game. Verify this axis by *playing*, never by reading code.

**Verification legend** (code axis)
- ✅ **tested** — substantial code + passing unit test (33 tests, `tests/foundations.test.js`)
- 🟢 **logic-real** — substantial non-UI code, in active dev, not unit-tested
- 🟠 **face** — UI renders + has wired handlers, but NOT a functioning play experience (developer-confirmed)
- 🟡 **partial** — thin / wiring unverified
- ⛔ **stub** — 1-line placeholder (returns null / empty export)
- ◻️ **absent** — feature has no real representation yet

### Engine (`src/ai/`) — the strong core
| File | L | Status | Note |
|------|---|--------|------|
| mechanics.js | 986 | ✅ | extract/validate/apply, 175 store-writes. Tested. |
| store.js (state) | 137 | ✅ | ownership enforcement tested (ai/player/system cross-write throws) |
| messages.js | 54 | ✅ | schema + old→new migration tested |
| gates.js | 421 | 🟢 | Gates 4 & 5 tested; combat/other gates untested |
| engine.js | 240 | 🟢 | sendMsg loop; stop-generation tested |
| prompt.js | 252 | 🟢 | buildPrompt / genLedger |
| providers.js | 248 | 🟢 | Gemini + OpenRouter, retry/fallback |
| contracts.js | 103 | 🟢 | Narrative + Ask DM voices |
| memory.js | 87 | 🟢 | summarize/prune |
| drift.js | 75 | 🟢 | drift detector |
| rules.js / setupPrompts.js | 95/80 | 🟢 | |

### State / Data
| File | L | Status | Note |
|------|---|--------|------|
| state/campaign.js, system.js | 113/31 | 🟢 | data shapes + resetCampaign |
| data/firebase.js, sync.js | 132/89 | 🟢 | init/auth/sync, offline fallback |
| data/local.js, seed.js | 135/51 | 🟢 | IndexedDB + first-launch seed |
| data/quickBuild.js | 319 | 🟢 | quick-build char path (survived the loss) |
| data/keys.js, demo.js | 113/175 | 🟢 | |
| data/bundles.js, migrate.js | 1/1 | ⛔ | content packs + state migration unbuilt |

### UI — a face, not a play experience
All 🟠 = code exists and renders; **none of it is confirmed playable.** Line counts say "code was written," not "a player can use it." Treat every row as needing play-verification before it counts as real.
| File | L | Status | Note |
|------|---|--------|------|
| App.jsx | 78 | 🟠 | 3-tab router (Cargo/Journal/Settings) + onboard fallback — renders, wired to store |
| play/Chat.jsx | 311 | 🟠 | two-tab chat; `sendMsg` wired but loop not confirmed working for a player |
| play/RollBar.jsx | 375 | 🟠 | initiative/roll UI (combat rebuild S37) |
| play/QuickActions.jsx | 362 | 🟠 | |
| play/Rewind, Combat, TurnPrompt | 207/127/74 | 🟠 | combat + turn system (S37) |
| play/CharTiles, InputBar, SituationBar, ContextBanner, DiceRoller, TTS, PreviouslyOn | 32–99 | 🟠 | |
| play/RollRequest.jsx | 1 | ⛔ | (RollBar superseded it) |
| reference/CharSheet.jsx | 787 | 🟠 | 6-tab sheet incl. editable Bio (S37) |
| reference/Journal, Cargo, Compendium | 155/98/93 | 🟠 | renders from store; depth unverified |
| reference/Treasury.jsx | 130 | 🟢 | built S41 — currencies + ledger + lifestyle, reached from Cargo |
| reference/Glossary.jsx | 1 | ⛔ | stub on purpose — Compendium's glossary tab is the one home |
| setup/CharCreate.jsx | 488 | 🟠 | 3 paths + editable backstory; backstory edit was the one S37-confirmed-real bit |
| setup/CampaignConfig.jsx | 371 | 🟠 | |
| setup/PlayerOnboard, KeyGate | 71/54 | 🟠 | |
| setup/ContentImport.jsx, SessionZero.jsx | 1/1 | ⛔ | unbuilt |
| manage/DevTools.jsx | 358 | 🟠 | flags, inspector, gate log |
| manage/Settings.jsx | 109 | 🟠 | |
| manage/Contracts.jsx, SessionReview.jsx | 1/1 | ⛔ | unbuilt |
| shared/Toast.jsx | 47 | 🟢 | built S41 — global host for dispatched `toast` events |
| shared/* (MechPill, Modal, Nav, LevelUp) | 1 each | ⛔ | stubs — play UI uses inline elements instead |
| AppSimple.jsx | 1 | ⛔ | child-friendly entry unbuilt |

### Content pipeline (`src/content/`)
| File | L | Status |
|------|---|--------|
| adventureParser, markdownAdventureParser, normalizer, chunkSplitter, fileParser | 59–177 | 🟢/🟡 |
| jsonParser, mdParser, webParser | 1 each | ⛔ |

### Audio
browserTTS.js (58) 🟢 · elevenlabs.js (1) ⛔

### S37 vs S38 conflict — resolved
S37: **"shipped, deployed, playable."** S38: **"mockup only, throwaway."** Developer's call (S39): **S38 was right about playability** — it's a face. S37 mistook "deployed a build" for "the build is playable." The asset is the **engine**; the playable game does not exist yet.

### What's actually built FOR THE PLAYER (developer, S39)
**Only two things are real player experiences:** (1) **onboarding** — half-done (KeyGate → CharCreate → CampaignConfig → Start Adventure), and (2) the **combat system**. Everything else (`App.jsx` router, Chat, reference screens, manage) is scattered components, not a built interface.

**Why every session gets confused:** the loose components *look* like an app, so each fresh Claude assumes the interface exists and trips over the fact that it doesn't. The engine is a brain with no body. **The interface is the missing spine.**

**DECISION (S39): build the interface first.** Don't fill stubs or harden the engine until there's a real play surface for the pieces to live in. The interface is what turns the face into a game.

### Honest "what's left" (build-forward priorities)
0. **BUILD THE INTERFACE.** The connective play surface — the body the engine/combat/onboarding plug into. This is the gate everything else waits behind.
   - **S39 progress:** play-screen **visual style** prototyped in `modern-atmospheric.html` (modern/atmospheric, Phosphor icons, serif+sans type, party HUD, situation bar w/ consequence overflow, dice d20, listen, tap-to-source). Strong working direction, **not yet formally locked**. **Nav resolved (S40): 3-item** (Cargo / Journal / Settings). Open: review items 5–9. Next: lock style → build in SolidJS starting with the persistence spine.
1. **Persistence spine (part of the interface):** `sync.js` writes campaign state to **Firebase only** — no local save, and boot never reloads a campaign (`loadCampaignFromCloud` exists but is never called). So every reload wipes `campaign.id` → back to step-0 onboarding, nothing endures. The architecture.md "offline→localStorage, reconcile on reconnect" (Law 1) is **NOT implemented.** Build local-first persistence + boot restore as part of the interface.
2. ⛔ True stubs to fill *after* the interface holds: Treasury, Glossary, SessionReview, Contracts, ContentImport, SessionZero.
3. ◻️ Absent: multiplayer identity, push notifications, child view (AppSimple), shared bundles, state migration.
4. ✅/🟢 Engine hardening (later): unit tests for untested gates (combat, spell-validation, XP/income), providers, memory.

---

## Status Key

- `[ ]` — not started
- `[~]` — in progress
- `[x]` — done
- `[?]` — needs design / spec before building
- `[!]` — blocked

---

## Spec Dependencies — What to spec before each phase

> Rule: **data shapes** must be specced before the phase that writes to them. **UI specs** can wait until the phase that displays them. Build order is now interface-first (see Build Order below).

| Phase | Must be specced first | Status | Spec locations |
|-------|----------------------|--------|----------------|
| **Phase 3: Play Mode UI** | Visual style, chat system, overlay behavior, combat state | ✅ Visual style: `modern-atmospheric.html`. Chat: `chat-system-spec-v2.md`. Combat: `ui-specs-v2.md` §5. Overlays: `chat-system-spec-v2.md`. S39 decisions in `decisions.md`. | workboard §Phase 3, decisions.md (S39) |
| **Phase 4: Reference Mode** | Nothing new — reads existing state | ✅ All UI specs complete (`ui-specs-v2.md` §1–5). | workboard §Phase 4 |
| **Phase 5: Setup Mode** | Session Zero flow, char creation wizard fields | ❌ Not specced | — |
| **Phase 6: Manage Mode** | — | — | DevTools, contracts editor, session review |
| **Phase 0: Foundation** | Campaign data shape, system data shape, color themes | ✅ All done | workboard §Phase 0 |
| **Phase 1: Core Loop** | All mechanic target data shapes, chat messages | ✅ All done. | workboard §Phase 1, `chat-system-spec-v2.md` |
| **Phase 2: Gates** | Field ownership registry, validation rules per gate | ✅ Ownership done. Gate rules defined. | workboard §Phase 2, `enforcement-spec.md` |
| **Phase 7: Content Pipeline** | Episode/module tracking data shape | ❌ Not specced | — |
| **Phase 8: Multi-Player** | Player identity/onboarding flow | ⚠️ Partially specced | — |

---

## Reference Docs (from v1 transfer)

| File | Use During |
|------|-----------|
| `.claude/chat-system-spec-v2.md` | Phase 3 (chat UI, overlays, streaming, input bar) |
| `.claude/ui-specs-v2.md` | Phase 3–4 (CharSheet, Cargo, Treasury, Journal, Combat) |
| `.claude/player-requests-v2.md` | Every phase — cross-cutting UX requirements, ✅ = must preserve |
| `.claude/v1-engine-dump.md` | Phase 1–2 (mechanic key mapping, validation, pre-parse rejections, real data shapes) |
| `.claude/v1-engine-dump-addendum.md` | Phase 1–2 (full combat state, PC template, worldData, wagon, buildPrompt structure, persistence arch, checkpoint/archive) |

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
  // Full field specs derived from v1 real gameplay objects (v1-engine-dump.md Part 2)
  // + mechanic key formats (v1-engine-reference.md)

  quests: [
    // Written by: quest_add, quest_done, quest_fail, quest_update mechanics
    // Fuzzy dedup: first 30 chars of text matched against existing
    {
      id: '',                   // 'qst_' + Date.now() + random suffix
      text: '',                 // quest description (from quest_add value)
      status: 'active',        // 'active' | 'done' | 'failed'
      location: '',            // auto-set to current location on creation (location anchoring)
      giverNpc: '',            // NPC name who gave the quest (if identifiable from context)
      notes: '',               // player/AI-appended notes (quest_update appends here)
      chatMsgId: '',           // links to originating DM message for ⚔ chip display
      discovery: {             // auto-extracted prose paragraph from AI response at creation
        text: '',
        ts: '',                // wall-clock ISO timestamp
      },
      gameTs: '',              // in-game time when quest was given
      priority: 0,            // player-sortable (0 = default, higher = more urgent)
    }
  ],
  primaryMission: '',          // main quest objective (primary_mission mechanic)

  npcs: [
    // Written by: npc_add, npc_mood mechanics
    // npc_add updates existing if name matches (dedup by name)
    // Also anchors NPC to current location's npcs[] array
    {
      id: '',                   // 'npc_' + Date.now() + random suffix
      name: '',                 // NPC name (from npc_add: name, disposition, details)
      disposition: 'Unknown',  // 'Friendly' | 'Neutral' | 'Hostile' | 'Unknown' (npc_mood updates)
      details: '',             // description text (from npc_add)
      status: 'active',       // 'active' | 'dead' | 'missing'
      hp: null,               // tracked only for combatable NPCs, null otherwise
      lastSeen: '',           // auto-set to current location on npc_add
      race: '',               // e.g. "Human", "Dragonborn" — parsed from details or set manually
      role: '',               // e.g. "governor", "merchant", "guard captain"
      gameTs: '',             // in-game time when first encountered
    }
  ],

  chapters: [
    // Written by: chapter_add, chapter_update mechanics
    // chapter_update fuzzy-matches by title
    {
      id: 0,                   // Date.now() at creation
      title: '',               // chapter title (from chapter_add: Title|Content)
      content: '',             // chapter prose/summary
      gameTs: '',              // in-game time (e.g. "Day 1, Dusk")
    }
  ],

  consequences: [
    // Written by: consequence_add, consequence_resolve mechanics
    // Fuzzy dedup: 60% word overlap against existing consequences
    // consequence_resolve fuzzy-matches and sets resolved + resolvedTs
    // Reputation ripple: town_rep changes to burned/fled auto-create a consequence
    {
      id: '',                   // 'csq_' + Date.now()
      text: '',                 // consequence description (from consequence_add: text|type)
      type: '',                 // 'background' | 'faction' | 'environmental' | 'threat'
      resolved: false,
      resolvedTs: null,        // ISO timestamp when resolved
      gameTs: '',              // in-game time when created
      location: '',            // auto-set to current location on creation
      deadline: null,          // optional: in-game time string when this must be resolved
      _ripple: false,          // true if auto-generated by reputation ripple system
    }
  ],

  townReputation: [
    // Written by: town_rep mechanic (upserts by town name)
    // Reputation ripple: if status changes to burned/fled, auto-creates consequence
    {
      town: '',                // town/settlement name
      status: 'neutral',      // 'neutral' | 'friendly' | 'hostile' | 'burned' | 'fled'
      notes: '',              // context for current standing
      gameTs: '',             // when last updated
      history: [],            // [{ status, notes, gameTs }] — log of status changes over time
    }
  ],

  secrets: [
    // One home for all campaign secrets (Law 4: data has one home)
    // playerKnown + aiOnly flags control visibility
    {
      id: '',                   // 'sec_' + Date.now()
      text: '',                 // secret content
      playerKnown: false,      // true = visible in Journal Secrets tab
      aiOnly: true,            // true = injected into AI prompt, hidden from player UI
      category: '',            // 'plot' | 'npc' | 'location' | 'item' | 'lore'
      source: '',              // where/how the secret was learned (if revealed)
      gameTs: '',              // when created or revealed
    }
  ],

  moduleProgress: [
    // Written by: module_episode mechanic
    // Auto-completes all episodes before the newly activated one
    // Content field holds episode text for buildPrompt injection (only active episode)
    {
      name: '',                // "Episode 1 — Greenest in Flames"
      status: 'pending',      // 'pending' | 'active' | 'complete'
      notes: '',              // player/DM notes
      content: '',            // episode brief text (for AI context when active)
    }
  ],

  locations: [
    // Written by: location_add, location_visit, location_history, location_investment mechanics
    // location_add updates existing if name matches
    // Quest/NPC/consequence creation auto-anchors to current location
    {
      id: '',                   // 'loc_' + Date.now() + random suffix
      name: '',                 // location name (from location_add: Name|Type|Description)
      type: '',                 // 'waypoint' | 'town' | 'dungeon' | 'camp' | 'temple' | etc.
      status: 'undiscovered',  // 'visited' | 'undiscovered' (location_visit updates)
      firstVisited: '',        // in-game time string
      lastVisited: '',         // in-game time string (updated by location_visit)
      rep: {                   // location-specific reputation (mirrors townReputation entry)
        disposition: '',       // 'Friendly' | 'Neutral' | 'Hostile'
        notes: '',
      },
      npcs: [],                // NPC names anchored here (auto-populated by npc_add)
      investments: [           // tracked by location_investment mechanic
        // { desc: '', amount: 0, gameTs: '', notes: '' }
      ],
      history: [               // chronological event log (location_history mechanic)
        // { gameTs: '', text: '', dmOnly: false }
      ],
      dmNotes: '',             // DM-only notes (hidden from player view)
      playerNotes: '',         // player-editable notes
      mapPos: null,            // { x, y } if placed on area map, null otherwise
    }
  ],

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

> Everything the player sees and taps during a session. Full UI detail lives in `ui-specs-v2.md` (§1–5) and `chat-system-spec-v2.md` — not duplicated here. Legend: **[x]** built + wired · **[~]** component renders, verify by *playing* · **[ ]** not built.

**Built + wired**
- [x] Roll request banners — `RollBar.jsx` (PC-only, derives initiative from combatState). [S37]
- [x] Combat overlay + turn system — `Combat.jsx` / `TurnPrompt.jsx`; code owns the turn pointer (`advanceCombatToNextPC`). [S37] Open: enemy auto-roll, manual skip/pass, push→TurnPrompt.
- [x] Nav badges — dot badges on Cargo / Journal when state changes (`App.jsx`).
- [x] Toast host — global `shared/Toast.jsx` renders dispatched `toast` events (engine stop, manual override, rest). [S41]

**Component exists — verify in play, don't trust the code**
- [~] Context banner · Situation bar · Character tiles · Dice roller · TTS toggle · Quick Actions · OOC two-tab Chat. All render + wired to the store; confirm in a real session.

**Not built**
- [ ] Mechanic pills (`shared/MechPill.jsx` stub) — tappable pills in AI responses → source.
- [ ] Term-glossary / citation / inline-NPC linking — auto-link terms, spells, NPC names in chat → popup / Journal. (Glossary + spells are seeded; Compendium already browses them.)
- [ ] Checkpoint/rewind surfacing — `Rewind.jsx` exists; confirm one-tap restore is reachable mid-session.
- [ ] Previously On / Catch Up — AI recap + tracker diff on AFK return / handoff (needs memory.js).
- [ ] Ask DM interception + data injection — route app-issue questions to tools; pull IndexedDB data into the prompt.
- [ ] Push notifications — Web Push + FCM. Without it OOC is dead in 2-player (v1 lesson).

**Quick Actions — design still open:** which actions (rest / recap / check inventory…), AI-directed vs system-directed, FAB ergonomics. `QuickActions.jsx` exists but predates the decision.

---

## Phase 4: Reference Mode

> Mid-session orientation — overlays over chat, tap to open / tap away to close. Full detail in `ui-specs-v2.md`: §1 Character Sheet · §2 Cargo · §3 Treasury · §4 Journal. Legend as Phase 3.

- [~] **Character sheet** (`CharSheet.jsx`, ~856L) — 6 tabs (Stats / Vitals / Spells / Features / Equipment / Bio), editable Bio + TIBF, Manual Override (HP / temp / XP / exhaustion / conditions / inspiration), wizard re-entry edits the build in place [S41]. Verify rolls / rest / swipe-between-PCs in play.
- [~] **Journal** (`Journal.jsx`) — Quests / NPCs / Places / Log / Lookup. Travel calculator + player-known Secrets added [S41].
- [x] **Cargo** (`Cargo.jsx`) — carried (per-PC) / wagon / hoard + tappable Treasury link [S41].
- [x] **Treasury** (`Treasury.jsx`) — PP/GP/EP/SP/CP with inline correction, income + expense ledger, total gp value, lifestyle reference. Reached from Cargo. [S41]
- [x] **Travel calculator** — distance × pace → time, in Journal → Places. Input-based until locations carry distance data. [S41]
- [~] **Compendium** (`Compendium.jsx`) — spell / rules / glossary browser from IndexedDB, search. **This is the home for the Glossary item** (own tab); standalone `Glossary.jsx` left a stub on purpose (one home, Law 4).
- [ ] **Encumbrance / weight** in Cargo + CharSheet Equipment — capacity = STR×15, warning color. Items already carry `weight`; the bar isn't shown yet.

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
| ~~OOC & Rules channels~~ | **Decided: two tabs.** Narrative (full AI) + OOC (player text + Ask DM button). Rules tab eliminated. | Resolved |
| ~~Bottom nav 3 vs 4 items~~ | **Decided: 3 items** (Cargo / Journal / Settings). Play is the default home, not a nav destination. 4th "Play" button from S39 mockup rejected. | Resolved (S40) |

> OOC/Rules design details in `decisions.md` (S31) and `chat-system-spec-v2.md`. V1 data migration: fresh start (S31).

---

## Icebox

> Noted, not planned. Revisit when core is solid.

- **Plugin system** — Accidental v1 feature (superpowers). Could support game-system plugins (Pathfinder, homebrew rules). Not v2 priority.
- **Encounter presets** — Save/load enemy groups for fast combat setup. Built and used in v1. Cut initially for v2 but player-requests confirm value. Could return via content pipeline JSON import or as a combat QoL feature.
- **Desktop layout** — Law 3 says no. But if demand appears, the component architecture supports it.

---

## Build Order — Revised S40

> **Interface first.** The engine is the real asset but the playable experience doesn't exist (see Reality Snapshot). Building UI phases first prevents agents from mistaking engine code for a working game. Phases 1–2 (core loop, gates) are partly built already; they get finished after the interface gives them a home.

1. **Phase 3** → play mode UI (make it feel like an app, not a terminal)
2. **Phase 4** → reference mode (mid-session orientation)
3. **Phase 5** → setup mode (first-launch experience)
4. **Phase 6** → manage mode (between-session tools)
5. **Phase 0** → scaffold gaps (persistence spine, seed data gaps, remaining plumbing)
6. **Phase 1** → core loop completion (AI contracts, memory management, provider hardening)
7. **Phase 2** → enforcement gates (build one at a time, test in play)
8. **Phase 7** → content pipeline (replace hardcoded data)
9. **Phase 8** → multi-player + polish (second player joins)

**Key dependencies:**
- Phase 3 uses the existing engine code as-is — the play surface wraps what's already built
- Persistence spine (local-first save + boot restore) is part of Phase 3, not Phase 0 — it's what makes the interface survive reload
- Previously On (Phase 3) depends on memory.js — build the UI shell first, wire memory when Phase 1 completes
- Gates (Phase 2) interleave with play UI naturally — build a gate, test it against the real interface
- Phases 0–2 specs (data shapes, ownership, gate rules) are already written and still valid — the work is filling implementation gaps, not re-speccing
- Content pipeline (Phase 7) can start earlier if needed — normalizer and IndexedDB are independent of UI
