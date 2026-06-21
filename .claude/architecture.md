# V2 Architecture

## The Pieces

```
┌─────────────────────────────────────────────┐
│                   APP                        │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │    UI    │  │  ENGINE  │  │   DATA    │  │
│  │ (screen) │  │ (brain)  │  │ (storage) │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │              │         │
│       └──────┬───────┘              │         │
│              │                      │         │
│        ┌─────┴─────┐               │         │
│        │   STATE   │───────────────┘         │
│        │  (truth)  │                         │
│        └───────────┘                         │
└─────────────────────────────────────────────┘
```

### 1. UI — What you see and tap
The screens, buttons, chat, overlays. Organized by mode:

**Setup mode screens:**
- Session Zero wizard (campaign name, setting, narration style, module selection)
- Character creation (race, class, abilities, background, equipment, spells)
- Content import (PDF, epub, mobi, web, JSON)
- Campaign configuration
- Player onboarding (share link, identity, character selection, push opt-in)

**Play mode screens:**
- Chat (the canvas — always visible)
  - Two tabs: **Narrative** (full AI pipeline, emits mechanics) + **OOC** (player text + Ask DM button, advisory only)
  - Mechanic pills in AI responses (tappable → navigates to source)
  - Term glossary — D&D terms auto-linked in AI messages, tap for definition
  - Citation linking — spell/feat/PHB references auto-linked to compendium entries
- Context banner (location, weather, time — all tappable, each navigates to its source)
- Situation bar: `[Main Quest]` `[⚡Consequence]` `[⚡Countdown]` `[Quest 2]` `[Quest 3]` →
  - Main quest: pinned left, always visible (DM's railroad — keeps players on the story)
  - Active consequences/countdowns: pinned after main quest, visually distinct, auto-sorted by urgency
  - Player quests: scrollable after, player-arranged by preference
- Character tiles (tap → sheet overlay, swipe between PCs)
- Combat overlay (zone grid, initiative strip — appears when combat starts)
  - Phase 1: zone-based (Frontline/Backline/Flanks) with token chips
  - Phase 2: visual tile map — tappable grid, terrain backgrounds, token movement (mobile VTT inspired)
- Quick Actions (floating action button — common play actions, one tap)
- Dice roller (inline icon, not a tab — small and accessible)
- Input bar (changes per chat tab: Narrative has send + stop; OOC has send + Ask DM)
- TTS toggle
- Roll request banners (system prompts player to roll, pre-filled from AI mechanic)
- Level-up wizard (event-driven overlay — triggers when XP threshold met, not a button)
- Rewind controls (checkpoint restore, accessible mid-session)
- Nav dot badges + in-chat alerts (notify player when state changes elsewhere)
- Push notifications (Web Push + FCM — OOC messages, other player's turns, state changes)
- Previously On / Catch Up — AI-powered session recap + state diff, triggers on AFK return or player handoff

**Reference mode screens:**
- Character sheet (slides up over chat, 6 tabs: Stats/Vitals/Spells/Features/Equipment/Bio)
  - Familiar/mount in Vitals tab — gets own combat token
  - Every modifier is a roll (tap ability/skill/save/attack → d20 + mod)
  - Manual Override editor (escape hatch for when engine gets it wrong)
- Journal (quests, locations, NPCs, travel log, consequences, town reputation, secrets, travel calculator)
- Cargo (inventory: carried per-PC, wagon, hoard — with encumbrance tracking)
- Treasury (PP/GP/EP/SP/CP, income/expense log, lifestyle tracker, business profile)
- Compendium (spell/feat/item browser from IndexedDB)
- Glossary (97 D&D term definitions, auto-linked in chat)

**Manage mode screens:**
- AI contracts editor (view code-enforced vs prompt-enforced)
- Session review / archive
- Campaign data export/import
- Dev tools (flags, error log, state inspector, gate fire log)
- Settings (providers, TTS config, color theme, narration style)
- Level-up wizard re-entry (fix missed choices)

### 2. ENGINE — The AI brain
Everything between "player sends message" and "state updates."

```
Player types action
       ↓
   sendMsg()
       ↓
   memory.summarizeAndPrune()  ←── keep prompt within token budget
       ↓
   buildPrompt()  ←── state, contracts, ledger, consequences, OOC context
       ↓
   callAI()  ←── provider abstraction (Gemini, OpenRouter, fallback)
       ↓
   AI streams response (tokens → UI progressively)
       ↓
   extractMechanics()  ←── pulls structured data from complete response
       ↓
   validateMechanics()  ←── Law 2: 9 enforcement gates
       ↓
   applyMechanics()  ←── writes to state (only valid changes)
       ↓
   state updates → UI reacts → Firebase syncs
```

**Engine modules:**
- `providers.js` — API wrappers (Gemini, OpenRouter). Retry, timeout, fallback. Provider health tracking. Never depends on one provider.
- `prompt.js` — buildPrompt() assembles system prompt from state + contracts + ledger + active consequences + silent OOC context injection. genLedger() compiles compact state summary (v1 format preserved). Prompt budget tracking. Narration style directive injection.
- `mechanics.js` — dispatch table registry. 65 mechanic keys, each registered with handler. extractMechanics() parses, validateMechanics() runs 9 gates, applyMechanics() writes through owned setters. Drift detectors catch AI narrating state changes without emitting mechanics.
- `engine.js` — sendMsg() orchestrates the full loop. callAI() handles streaming + retry + fallback. Double-send guard. Stop generation (keeps partial text, discards incomplete mechanics). Context injection for corrections.
- `contracts.js` — loads, validates, and injects AI contracts. Tracks which are code-enforced vs prompt-enforced. Two contract voices: Narrative DM (epic narrator + rules lawyer) and Ask DM (objective rules arbiter).
- `memory.js` — summarizeAndPrune(), session archive, Previously On generation, context injection. Keeps prompt lean as history grows. Called before buildPrompt() every turn.

**The 9 enforcement gates (validateMechanics):**
1. Roll confirmation — reject mechanics depending on unsubmitted rolls
2. Combat turn — enforce initiative order, action economy per turn
3. Drift detection — flag narrated state changes without matching mechanics
4. Scene transition — hold location/time changes for player confirmation
5. Unmentioned PC actions — flag AI acting for PCs player didn't mention (player-aware in multi-player)
6. Spell validation — check known spells, slot availability, concentration conflicts
7. Skill check requirement — flag actions resolved without appropriate checks
8. XP audit — flag missing XP after quest/combat/chapter events
9. Income/loot reconciliation — flag items without corresponding gold mechanics

### 3. STATE — The single source of truth
One reactive state object (SolidJS signals). Everything reads from here, everything writes through controlled paths.

**Field ownership (Law 2):**
- **AI-owned** (via mechanics pipeline, player override with audit log): `hp`, `hpTemp`, `conditions`, `concentration`, `exhaustion`, `inspiration`, `gold`, `incomeLog`, `expenseLog`, `quests`, `npcs`, `location`, `weather`, `time`, `locDesc`, `townReputation`, `secrets`, `consequences`, `combatState`, `chapters`, `travelLog`, `moduleProgress`
- **Player-owned** (via UI editors only): `name`, `backstory`, `appearance`, `personality`, `notes`, `playerIdentity`
- **System-owned** (via wizards only): `level`, `hpMax`, `class`, `subclass`, `features`, `spells`, `knownSpells`, `cantrips`, `spellSlots`, `currentSlots`, `resources`, `proficiencies`, `savingThrows`, `skills`, `abilityScores`, `race`, `ac`, `hitDice`, `speed`, `xp`, `background`, `alignment`, `languages`, `attacks`, `color`

**Derived, not stored:** All skill/save bonuses derived at render time (`mod = abilityMod + (isProficient ? profBonus : 0)`). Nothing stored that can be computed — prevents v1's stale-bonus drift.

**Checkpoint/rewind (Law 2 recovery):**
- State snapshots at key moments (long rest, level-up, PC at 0 HP, periodic auto)
- Rewind stack — one-tap full state restore when enforcement fails
- Surfaces in play mode, not buried in manage — safety nets must be accessible mid-session

**Campaign vs System split (Content portability):**
- **Campaign data** (reset on swap): PCs, worldData, NPCs, quests, chatHistory, combat, treasury, inventory, consequences, locations, townReputation, secrets, moduleProgress, sessionArchive, contracts
- **System data** (survives swap): spell compendiums, class progressions, feat databases, app settings, player preferences, provider config, active campaign pointer

### 4. DATA — Where things are stored

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Firebase   │     │  IndexedDB   │     │  Shared Bundles  │
│   (synced)   │     │   (local)    │     │   (on import)    │
├──────────────┤     ├──────────────┤     ├──────────────────┤
│ HP, quests   │     │ Spell DB     │     │ Content packs    │
│ inventory    │     │ Class data   │     │ generated by one │
│ chat history │     │ Feat DB      │     │ player, imported │
│ combat state │     │ Module text  │     │ by others as     │
│ NPC tracker  │     │ Parsed books │     │ they join        │
│ locations    │     │ Web imports  │     │                  │
│ treasury     │     │ Monster data │     │ Reusable — new   │
│ contracts    │     │ Glossary     │     │ players import   │
│ world data   │     │ Map images   │     │ same bundle      │
│ consequences │     │ Maneuvers    │     │ anytime          │
│ secrets      │     │              │     │                  │
│ town rep     │     │ Never synced │     │ Firebase carries │
│              │     │ Same on all  │     │ "has pack X"     │
│ Changes      │     │ devices via  │     │ flag only        │
│ during play  │     │ import/seed  │     │                  │
└──────────────┘     └──────────────┘     └──────────────────┘
```

**Firebase path structure:**
```
v2/
├── campaigns/{campaignId}/
│   ├── meta/          ← name, setting, narrationStyle, premise
│   ├── characters/    ← full character objects (all owner fields)
│   ├── world/         ← location, time, weather, locDesc
│   ├── economy/       ← gold, incomeLog, expenseLog
│   ├── inventory/     ← carried, wagon, hoard, wagonState
│   ├── story/         ← quests, npcs, chapters, consequences, townRep, secrets, moduleProgress
│   ├── combat/        ← combatState (ephemeral)
│   ├── narrative/     ← Narrative chat messages
│   ├── ooc/           ← OOC chat messages
│   ├── contracts/     ← AI contract text
│   ├── sessions/      ← session archive
│   └── checkpoints/   ← rewind snapshots
└── players/{deviceId}/
    ├── identity/      ← name, selectedPCs, mode
    └── settings/      ← theme, tts, push
```

**Offline behavior (Law 1):** When Firebase is unreachable, state writes to localStorage. When connection returns, reconcile using clock-independent merge (ID-based dedup, local wins on conflict). 3-second dirty-edit guard on all Firebase writes.

**Item data split:** Compendium items (from sourcebooks) → IndexedDB. AI-generated items (created during play) → Firebase as inventory game state with structured properties via mechanics pipeline.

**Map images:** Uploaded campaign/area maps stored in IndexedDB (too large for Firebase). Location pins and discovered state sync via Firebase.

**Multi-player model:** Device-local setting for "which PC am I." No formal identity system — family shares informally, one player can act for another. Firebase syncs game state between all connected devices. Push notifications (Web Push + FCM) for cross-device awareness.

**Seed data:** On first launch, static JSON files (bundled with app) populate IndexedDB: 94 spells, 44 feats, 97 glossary terms, XP thresholds, 3 class progressions, 16 maneuvers. One-time load before content pipeline exists.

**Error recovery:** When callAI() fails, retry + provider fallback. When Firebase disconnects, continue locally and reconcile on reconnect. When AI returns unparseable mechanics, drift detectors flag it, rewind is available.

### 5. CONTENT — The import pipeline

```
Input                    Parser              Output
─────                    ──────              ──────
PDF/epub/mobi    →    fileParser.js    →    structured data
Web reference    →    webParser.js     →    structured data
Markdown/text    →    mdParser.js      →    structured data
AI-generated JSON →   jsonParser.js    →    structured data
                                              ↓
                                        ┌─────────────┐
                                        │  Normalizer  │
                                        │  (one format │
                                        │   for all)   │
                                        └──────┬──────┘
                                               ↓
                                        ┌─────────────┐
                                        │  IndexedDB   │
                                        │  compendium  │
                                        └─────────────┘
```

**Content types:**
- Spells → spell compendium (replaces hardcoded SPELL_DB)
- Classes → class progression data (replaces hardcoded LEVEL_UP_DATA)
- Feats → feat database (replaces hardcoded FEATS_DB)
- Monsters → encounter reference
- Adventures/modules → episode tracker + chapter text for AI context
- Items → item compendium

All content normalized to a common schema per type. The engine, level-up wizard, spell picker, and module tracker all read from IndexedDB, not constants.

---

## How the Pieces Connect

### The Core Loop (Law 1)
```
Player taps send
  → engine.sendMsg()
    → prompt.buildPrompt(state, contracts, ledger)
    → providers.callAI(messages, systemPrompt)
    → mechanics.extractMechanics(response)
    → mechanics.validateMechanics(changes, state)  ← Law 2
    → mechanics.applyMechanics(validChanges, state)
    → state updates (SolidJS signals)
    → UI reacts automatically
    → data.syncToFirebase(changedFields)
    → data.saveToLocal(state)
```

### Mode Transitions (Law 4)
```
SETUP → first launch, locked after campaign starts
  ↓
PLAY ↔ REFERENCE → seamless, no friction
  ↓        ↑
MANAGE → intentional transition, between sessions
```

- Setup → Play: `launchCampaign()` locks setup
- Play → Reference: tap character tile, bottom nav (Cargo/Journal), or links in chat. Overlay, not navigation.
- Play → Manage: tap Settings in bottom nav. One step removed. Intentional.
- Reference → Play: tap away, close overlay. Instant.

**Bottom nav:** Cargo / Journal / Settings. Three items. Combat and level-up are event-driven overlays, not tabs. Dice roller is inline icon. Treasury accessed via links (charsheet Equipment footer, Cargo).

**Tap-to-source principle:** Any displayed information is tappable and navigates to its source. No dead text. Location in the banner → journal locations. Quest chip → quest detail. Character tile → character sheet. Mechanic pill → relevant reference. The UI is a web of links, not isolated panels.

### Information Gating (Law 2)
```
Imported module content
  → all chapters stored in IndexedDB
  → each chapter has: discovered = true/false
  → buildPrompt() only injects discovered chapters
  → UI only shows discovered content in play/reference
  → setup/manage shows everything
```

---

## Module Map (file structure)

```
src/
├── ai/
│   ├── providers.js       # API wrappers (Gemini, OpenRouter), retry, fallback
│   ├── prompt.js          # buildPrompt(), genLedger(), OOC context injection
│   ├── mechanics.js       # 65 keys, dispatch table, extract, validate (9 gates), apply
│   ├── engine.js          # sendMsg(), callAI(), streaming, stop generation, double-send guard
│   ├── contracts.js       # contract loading, validation, injection (Narrative + Ask DM voices)
│   ├── memory.js          # summarizeAndPrune(), Previously On, session archive
│   └── index.js           # barrel export
├── content/
│   ├── fileParser.js      # PDF, epub, mobi parsing
│   ├── webParser.js       # web reference import
│   ├── mdParser.js        # markdown/text parsing
│   ├── jsonParser.js      # AI-generated JSON import
│   ├── normalizer.js      # normalize all inputs to common schemas
│   └── index.js
├── data/
│   ├── firebase.js        # init, auth, sync, merge, offline fallback
│   ├── local.js           # IndexedDB wrapper (compendiums, seed data)
│   ├── bundles.js         # shared content pack generation + import
│   ├── seed.js            # first-launch seeding from static JSON
│   ├── migrate.js         # state version migration
│   └── index.js
├── state/
│   ├── store.js           # SolidJS signals, field ownership enforcement, owned setters
│   ├── campaign.js        # campaign data shape + resetCampaign()
│   ├── system.js          # system data shape (survives campaign swap)
│   └── index.js
├── ui/
│   ├── play/
│   │   ├── Chat.jsx       # two-tab chat (Narrative + OOC)
│   │   ├── ContextBanner.jsx  # location, weather, time (all tappable)
│   │   ├── SituationBar.jsx   # main quest pinned, consequences, player quests
│   │   ├── CharTiles.jsx  # character HP tiles (tap → sheet)
│   │   ├── InputBar.jsx   # message input (changes per tab: send/stop vs send/Ask DM)
│   │   ├── Combat.jsx     # zone grid → visual tile map, initiative strip, tokens
│   │   ├── QuickActions.jsx # floating action button, common play actions
│   │   ├── DiceRoller.jsx # d4-d20 roller (inline icon)
│   │   ├── RollRequest.jsx # roll request banners (pre-filled from AI mechanic)
│   │   ├── Rewind.jsx     # checkpoint/rewind controls (accessible mid-session)
│   │   └── TTS.jsx        # text-to-speech toggle
│   ├── reference/
│   │   ├── CharSheet.jsx  # 6-tab overlay: Stats/Vitals/Spells/Features/Equipment/Bio
│   │   ├── Journal.jsx    # quests, locations, NPCs, consequences, secrets, travel calc
│   │   ├── Cargo.jsx      # inventory (carried per-PC, wagon, hoard), encumbrance
│   │   ├── Treasury.jsx   # PP/GP/EP/SP/CP, income/expense log, lifestyle
│   │   ├── Compendium.jsx # spell/feat/item browser (reads IndexedDB)
│   │   └── Glossary.jsx   # 97 D&D term definitions, auto-linked in chat
│   ├── setup/
│   │   ├── SessionZero.jsx    # campaign name, setting, narration style, module
│   │   ├── CharCreate.jsx     # race, class, abilities, background, equipment, spells
│   │   ├── ContentImport.jsx  # file upload, web URL, paste, JSON
│   │   ├── CampaignConfig.jsx # module selection, house rules, contract customization
│   │   └── PlayerOnboard.jsx  # identity, character selection, mode, push opt-in
│   ├── manage/
│   │   ├── Contracts.jsx  # AI contract editor (code-enforced vs prompt-enforced)
│   │   ├── SessionReview.jsx  # archive, export, past session summaries
│   │   ├── DevTools.jsx   # flags, state inspector, gate fire log
│   │   └── Settings.jsx   # API keys, TTS, theme toggle + cycle, narration style
│   ├── shared/
│   │   ├── MechPill.jsx   # tappable mechanic pills (tap → source)
│   │   ├── Toast.jsx      # notification toasts
│   │   ├── Modal.jsx      # bottom sheet overlays
│   │   ├── Nav.jsx        # bottom nav: Cargo / Journal / Settings
│   │   └── LevelUp.jsx    # event-driven wizard (triggers on XP threshold)
│   ├── App.jsx            # root component, mode router, bottom nav
│   └── AppSimple.jsx      # child-friendly entry point — same state/engine, simplified UI
├── audio/
│   ├── browserTTS.js      # free browser speech synthesis
│   └── elevenlabs.js      # ElevenLabs free tier
├── main.js                # entry point, mounts App, calls initData()
└── style.css              # 20 themes as [data-theme] blocks, shared properties
```

**Static data (bundled with app, not in src):**
```
data/
├── xp-thresholds.json
├── level-up-fighter.json
├── level-up-rogue.json
├── level-up-bard.json
├── spells.json
├── maneuvers.json
├── feats.json
└── glossary.json
```

---

## What This Gives Us

- **AI can build autonomously** — "build the spell compendium browser" → it knows to create `src/ui/reference/Compendium.jsx`, read from `src/data/local.js` IndexedDB, display spells from the normalized schema
- **Law 2 enforced structurally** — mechanics go through extract → validate (9 gates) → apply. No shortcut. Ownership checked on every write.
- **Law 4 enforced by folders** — play components can't import manage components. Modes are directory boundaries.
- **Law 5 respected** — clear separation of Firebase (synced) vs IndexedDB (local) vs bundles (one-time transfer). Free providers, free hosting.
- **Content pipeline is universal** — any input → normalizer → same schema → IndexedDB. No more hardcoded SPELL_DB.
- **Child-friendly view is a second entry point** — `AppSimple.jsx` wraps the same state and engine with bigger targets, less text, guided choices. Separate URL, same Firebase + API keys. Not a toggle — a different UI root.

---

## Canonical Reference

This file is the architecture source of truth. If it conflicts with other docs:
- **workboard.md** has the most detailed specs (full data shapes, acceptance tests) — architecture.md summarizes
- **decisions.md** records specific design choices — architecture.md reflects their outcome
- When architecture.md drifts from workboard/decisions, update architecture.md (not the other way around)
