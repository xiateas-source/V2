# V2 Architecture — Draft

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
- Session Zero wizard
- Character creation
- Content import (PDF, epub, mobi, web, JSON)
- Campaign configuration
- API key entry
- Player onboarding (share link, sync, create character)

**Play mode screens:**
- Chat (the canvas — always visible)
  - OOC and Rules as tappable tabs within chat (shared canvas, separate contexts)
  - Mechanic pills in AI responses (tappable → navigates to source)
  - Term glossary — D&D terms auto-linked in AI messages, tap for definition (especially useful for younger players)
- Context banner (location, weather, time — all tappable, each navigates to its source)
- Situation bar: `[Main Quest]` `[⚡Consequence]` `[⚡Countdown]` `[Quest 2]` `[Quest 3]` →
  - Main quest: pinned left, always visible (DM's railroad — keeps players on the story)
  - Active consequences/countdowns: pinned after main quest, visually distinct, auto-sorted by urgency
  - Player quests: scrollable after, player-arranged by preference
- Character tiles (tap → sheet overlay)
- Combat overlay (zone grid, initiative strip — appears when combat starts)
  - Phase 1: zone-based (Frontline/Backline/Flanks) with token chips
  - Phase 2: visual tile map — tappable grid, terrain backgrounds, token movement (mobile VTT inspired)
- Quick Actions (floating action button — common play actions, one tap)
- Dice roller (inline icon, not a tab — small and accessible)
- Input bar
- TTS toggle
- Roll request banners (system prompts player to roll, menu pops up)
- Level-up wizard (event-driven overlay — triggers when XP threshold met, not a button)
- Nav dot badges + in-chat alerts (notify player when state changes elsewhere)
- Previously On / Catch Up — AI-powered session recap and tracker audit, surfaces when returning from AFK

**Reference mode screens:**
- Character sheet (slides up over chat)
  - Familiar/mount section — tied to specific PC, gets own combat token
- Journal (quests, locations, NPCs, travel log, consequences, town reputation, secrets)
- Cargo (inventory, wagon, hoard)
- Treasury (PP/GP/EP/SP/CP, income/expense log, lifestyle tracker, business profile)
- Spell/feat reference (from local compendium)
- Term glossary (D&D reference — conditions, mechanics, class features)

**Manage mode screens:**
- AI contracts editor
- Session review / archive
- Campaign data export/import
- Dev tools (flags, error log, state inspector)
- Settings (providers, TTS config)

### 2. ENGINE — The AI brain
Everything between "player sends message" and "state updates."

```
Player types action
       ↓
   sendMsg()
       ↓
   buildPrompt()  ←── state, contracts, ledger, module content
       ↓
   callAI()  ←── provider abstraction (Gemini, OpenRouter, fallback)
       ↓
   AI responds
       ↓
   extractMechanics()  ←── pulls structured data from response
       ↓
   validateMechanics()  ←── Law 2: clamp, reject, enforce ownership
       ↓
   applyMechanics()  ←── writes to state (only valid changes)
       ↓
   state updates → UI reacts → Firebase syncs
```

**Engine modules:**
- `providers.js` — API wrappers (Gemini, OpenRouter). Retry, timeout, fallback. Never depends on one provider.
- `prompt.js` — buildPrompt() assembles system prompt from state + contracts + ledger + active consequences. genLedger() compiles compact state summary. Prompt budget management. Active consequences with timers injected so the AI can't forget to enforce them.
- `mechanics.js` — dispatch table registry. Each mechanic key registered with handler. parseMechanics() extracts, validateMechanics() checks, applyMechanics() writes. Includes drift detectors — catch when AI narrates state changes (gold, NPCs, damage, conditions, locations) without emitting mechanics. Roll confirmation gate — rejects any mechanic depending on a roll the player didn't submit. Scene transition gate — detects location/time changes and requires player confirmation before applying. PC action gate — flags when AI resolves actions for a PC the player didn't mention. Law 2 enforcement layer.
- `engine.js` — sendMsg() orchestrates the full loop. callAI() handles retry + fallback. Context injection. Double-send guard.
- `contracts.js` — loads, validates, and injects AI contracts. Tracks which are code-enforced vs prompt-enforced.
- `memory.js` — summarizeAndPrune(), session archive, context injection. Keeps prompt lean as history grows.
- `tts.js` — browser TTS + ElevenLabs free tier. Toggle on/off. Not automatic.

### 3. STATE — The single source of truth
One reactive state object (SolidJS signals). Everything reads from here, everything writes through controlled paths.

**Field ownership (Law 2):**
- **AI-owned** — changed only via mechanics pipeline: `hp`, `conditions`, `gold`, `quest status`, `npc data`, `location`, `weather`, `time`, `town reputation`, `secrets`
- **Player-owned** — changed only via editors in manage/setup mode: `name`, `backstory`, `appearance`, `personality`, `notes`
- **System-owned** — changed only via wizards: `level`, `hp_max`, `class`, `features`, `spells`, `slots`, `resources`

**Checkpoint/rewind (Law 2 recovery):**
- State snapshots at key moments (long rest, level-up, PC at 0 HP, periodic auto)
- Rewind stack — one-tap full state restore when enforcement fails
- Surfaces in play mode, not buried in manage — safety nets must be accessible mid-session

**Campaign vs System split (Content portability):**
- **Campaign data** (reset on swap): PCs, worldData, NPCs, quests, chatHistory, combat, treasury, consequences, locations, sessionArchive, campaign-specific contracts
- **System data** (survives swap): spell compendiums, class progressions, feat databases, app settings, player preferences, rules contracts

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
│ contracts    │     │              │     │ players import   │
│ world data   │     │ Never synced │     │ same bundle      │
│ AI-generated │     │ Same on all  │     │ anytime          │
│ items        │     │ devices via  │     │                  │
│              │     │ import       │     │ Firebase carries │
│ Changes      │     │              │     │ "has pack X"     │
│ during play  │     │              │     │ flag only        │
└──────────────┘     └──────────────┘     └──────────────────┘
```

**Offline behavior (Law 1):** When Firebase is unreachable, state writes to localStorage. When connection returns, reconcile. Chat merge uses clock-independent strategy (v1's proven approach).

**Item data split:** Compendium items (from sourcebooks) → IndexedDB. AI-generated items (created during play) → Firebase as inventory game state with structured properties via mechanics pipeline.

**Map images:** Uploaded campaign/area maps stored in IndexedDB (too large for Firebase). Location pins and discovered state sync via Firebase.

**Multi-player model:** Device-local setting for "which PC am I." No formal identity system — family shares informally, one player can act for another. Firebase syncs game state between all connected devices.

**Error recovery:** When callAI() fails, retry + provider fallback. When Firebase disconnects, continue locally and reconcile on reconnect. When AI returns unparseable mechanics, drift detectors flag it, rewind is available. Details designed during implementation.

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
- Play → Reference: tap character tile, tap journal icon. Overlay, not navigation.
- Play → Manage: tap settings. One step removed. Intentional.
- Reference → Play: tap away, close overlay. Instant.

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
│   ├── providers.js      # API wrappers (Gemini, OpenRouter)
│   ├── prompt.js          # buildPrompt(), genLedger()
│   ├── mechanics.js       # dispatch table, extract, validate, apply
│   ├── engine.js          # sendMsg(), callAI(), context injection
│   ├── contracts.js       # contract loading, validation, injection
│   ├── memory.js          # summarize, prune, session archive
│   └── index.js           # barrel export
├── content/
│   ├── fileParser.js      # PDF, epub, mobi parsing
│   ├── webParser.js       # web reference import
│   ├── mdParser.js        # markdown/text parsing
│   ├── jsonParser.js      # AI-generated JSON import
│   ├── normalizer.js      # normalize all inputs to common schemas
│   └── index.js
├── data/
│   ├── firebase.js        # Firebase sync, merge, offline fallback
│   ├── local.js           # IndexedDB for compendiums, localStorage for state
│   ├── bundles.js         # shared content pack generation + import
│   ├── migrate.js         # state version migration
│   └── index.js
├── state/
│   ├── store.js           # SolidJS signal store, field ownership enforcement
│   ├── campaign.js        # campaign data shape + reset
│   ├── system.js          # system data shape (survives campaign swap)
│   └── index.js
├── ui/
│   ├── play/
│   │   ├── Chat.jsx       # chat canvas
│   │   ├── ContextBanner.jsx  # location, weather, time
│   │   ├── QuestBar.jsx   # quest chips, main quest pinned
│   │   ├── CharTiles.jsx  # character HP tiles
│   │   ├── InputBar.jsx   # message input + send
│   │   ├── Combat.jsx     # zone grid → visual tile map evolution, initiative, tokens
│   │   ├── QuickActions.jsx # floating action button, common play actions
│   │   ├── DiceRoller.jsx # d4-d20 roller
│   │   ├── RollRequest.jsx # roll request banners
│   │   ├── Rewind.jsx     # checkpoint/rewind controls (accessible mid-session)
│   │   └── TTS.jsx        # text-to-speech controls
│   ├── reference/
│   │   ├── CharSheet.jsx  # 6-tab character sheet overlay
│   │   ├── Journal.jsx    # quests, locations, NPCs, consequences
│   │   ├── Cargo.jsx      # inventory, wagon, hoard
│   │   ├── Treasury.jsx   # PP/GP/EP/SP/CP, income/expense log, lifestyle, business profile
│   │   ├── Compendium.jsx # spell/feat/item browser
│   │   └── Glossary.jsx   # D&D term definitions, auto-linked in chat
│   ├── setup/
│   │   ├── SessionZero.jsx
│   │   ├── CharCreate.jsx
│   │   ├── ContentImport.jsx
│   │   ├── CampaignConfig.jsx
│   │   └── PlayerOnboard.jsx
│   ├── manage/
│   │   ├── Contracts.jsx  # AI contract editor
│   │   ├── SessionReview.jsx
│   │   ├── DevTools.jsx   # flags, state inspector
│   │   └── Settings.jsx   # API keys, TTS config, preferences
│   ├── shared/
│   │   ├── MechPill.jsx   # tappable mechanic pills
│   │   ├── Toast.jsx      # notification toasts
│   │   ├── Modal.jsx      # bottom sheet overlays
│   │   ├── Nav.jsx        # bottom nav: Cargo / Treasury / Journal / Settings
│   │   └── LevelUp.jsx    # event-driven wizard overlay (triggers on XP threshold)
│   ├── App.jsx            # root component, mode routing
│   └── AppSimple.jsx      # child-friendly entry point — same state/engine, simplified UI
├── audio/
│   ├── browserTTS.js      # free browser speech synthesis
│   └── elevenlabs.js      # ElevenLabs free tier
├── main.js                # entry point
└── style.css              # global styles, palette
```

---

## What This Gives Us

- **AI can build autonomously** — "build the spell compendium browser" → it knows to create `src/ui/reference/Compendium.jsx`, read from `src/data/local.js` IndexedDB, display spells from the normalized schema
- **Law 2 enforced structurally** — mechanics go through extract → validate → apply. No shortcut.
- **Law 4 enforced by folders** — play components can't import manage components. Modes are directory boundaries.
- **Law 5 respected** — clear separation of Firebase (synced) vs IndexedDB (local) vs bundles (one-time transfer)
- **Content pipeline is universal** — any input → normalizer → same schema → IndexedDB. No more hardcoded SPELL_DB.
- **Child-friendly view is a second entry point** — `AppSimple.jsx` wraps the same state and engine with bigger targets, less text, guided choices. Separate URL, same Firebase + API keys. Not a toggle — a different UI root.
