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

## Phase 0: Foundation

> Scaffold the project, establish state management, connect Firebase. Nothing renders yet — this is plumbing.

- [x] Transfer planning docs to V2 repo
- [x] Write workboard.md
- [ ] **Project scaffold** — Vite + SolidJS, create the full module map directory structure from architecture.md. Empty index.js barrels in each folder. `main.js` entry point. `style.css` with CSS custom properties for palette (placeholder values until palette chosen).
- [ ] **State store** — `src/state/store.js`. SolidJS `createStore` with field ownership enforcement. Every field tagged `ai | player | system`. Setter functions that check ownership before writing. `campaign.js` for campaign data shape + `resetCampaign()`. `system.js` for system data shape.
- [ ] **Firebase setup** — New Firebase project (separate from v1). `src/data/firebase.js` with init, auth (anonymous), realtime DB read/write. Offline fallback to localStorage. `src/data/local.js` with IndexedDB wrapper for compendium storage.
- [?] **Color palette** — Design session needed. Three modes: default, light, night. v1 Soft Autumn not carrying forward. CSS custom properties ready, values TBD.

### Scaffold spec

```
V2/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.js
│   ├── style.css
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
│   │   ├── firebase.js
│   │   ├── local.js
│   │   ├── bundles.js
│   │   ├── migrate.js
│   │   └── index.js
│   ├── state/
│   │   ├── store.js
│   │   ├── campaign.js
│   │   ├── system.js
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
│   │   ├── App.jsx
│   │   └── AppSimple.jsx
│   └── audio/
│       ├── browserTTS.js
│       └── elevenlabs.js
├── CLAUDE.md
├── mockup.html
└── .claude/
```

### State store spec

**Field ownership map** (enforced by store.js setters):

```
AI-owned (via mechanics pipeline only):
  hp, conditions, gold, quests, npcs, location, weather, time,
  townReputation, secrets, consequences, combatState

Player-owned (via UI editors only):
  name, backstory, appearance, personality, notes

System-owned (via wizards only):
  level, hpMax, class, subclass, features, spells, knownSpells,
  cantrips, spellSlots, currentSlots, resources, proficiencies,
  savingThrows, skills, abilityScores
```

Setter pattern:
```js
function setField(path, value, owner) {
  const fieldOwner = getOwner(path);
  if (fieldOwner !== owner) throw new OwnershipError(path, fieldOwner, owner);
  setState(path, value);
}
```

---

## Phase 1: Core Loop (MVP)

> Player types → AI responds → mechanics parse → state updates → UI shows it. The minimum viable play session.

- [ ] **Provider abstraction** — `src/ai/providers.js`. Gemini free tier primary. OpenRouter fallback. Shared interface: `callProvider(messages, systemPrompt, options) → response`. Retry with backoff. Provider health tracking. API key storage in system state.
- [ ] **Prompt builder** — `src/ai/prompt.js`. `buildPrompt(state, contracts, ledger, consequences)` assembles system prompt. `genLedger(state)` compiles compact state summary (v1 format preserved — see v1-engine-reference.md). Prompt budget tracking (token estimate). Active consequences with timers injected.
- [ ] **Mechanics pipeline** — `src/ai/mechanics.js`. Dispatch table registry. `extractMechanics(response)` parses mechanics block. `validateMechanics(changes, state)` checks ownership + basic validity. `applyMechanics(valid, state)` writes through owned setters. Start with the v1 mechanic keys (all 65 from v1-engine-reference.md).
- [ ] **Engine orchestrator** — `src/ai/engine.js`. `sendMsg()` runs the full loop. `callAI()` handles retry + fallback. Double-send guard. Context injection for corrections.
- [ ] **Chat UI** — `src/ui/play/Chat.jsx`. Message list (player + AI). Markdown rendering in AI responses. Mechanics block parsed into mechanic pills (tappable, but tap targets come later). Auto-scroll. `src/ui/play/InputBar.jsx` — text input + send button.
- [ ] **App shell** — `src/ui/App.jsx`. Mode routing (setup/play/reference/manage). Bottom nav stub (Cargo / Journal / Settings). Play mode as default after campaign exists.
- [ ] **Contracts loader** — `src/ai/contracts.js`. Load contracts from state. Inject into buildPrompt. v1 contract format preserved (see v1-contract-reference.md). Default contracts seeded from v1.

### Core loop acceptance test

A session where: player types an action → AI responds with narrative + mechanics block → mechanics are parsed and applied to state → state changes visible in UI → next message includes updated ledger in prompt. No enforcement gates yet — just the loop.

---

## Phase 2: Enforcement Gates

> Law 2. Build in priority order from enforcement-spec.md. Each gate is independent — ship one, test it in play, then build the next.

- [ ] **Gate 1: Roll confirmation** — Reject mechanics depending on rolls the player didn't submit. Track `pendingRolls` set. Scan AI prose for roll patterns. Flag fabricated rolls. Prompt player to roll or accept. Enemy/NPC rolls exempt.
- [ ] **Gate 2: Combat turn enforcement** — When `combat.active`, enforce initiative order. One PC per AI response. Track actions used per turn (action/bonus/reaction/movement). Reject multi-turn responses. Prompt next PC after current turn resolves.
- [ ] **Gate 3: Drift detectors** — Scan narrative for state changes without matching mechanics. Gold/items/NPCs/HP/conditions/location/time. Flag with warning pill. Offer to auto-generate missing mechanic. Don't auto-reject.
- [ ] **Gate 4: Scene transition** — Detect location/time changes in mechanics. Hold transition, show narrative up to that point. Prompt player: "Ready to move on?" Player-initiated moves lower the gate.
- [ ] **Gate 5: Unmentioned PC actions** — Parse player message for PC names as actors. Parse AI response for PC names as actors. Diff. Flag PCs the AI acted for that the player didn't mention. Distinguish actions from perceptions.
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
- [ ] **Previously On** — AI-powered session recap. Surfaces when returning from AFK (detect idle time). Summarizes what happened since last active. Tracker audit — what changed.
- [?] **Quick Actions** — `QuickActions.jsx`. Floating action button. Needs redesign from v1. See spec below.
- [ ] **Combat overlay** — `Combat.jsx`. Phase 1: zone grid (Frontline/Backline/Flanks). Initiative strip. Token chips per PC/NPC. Appears when `combat.active = true`, disappears when combat ends.
- [ ] **Nav badges** — Dot badges on bottom nav when state changes in other modes. In-chat alerts for important state changes.

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

---

## Phase 4: Reference Mode

> Mid-session orientation. Overlays over chat — tap to open, tap away to close. No mode switch friction.

- [ ] **Character sheet** — `CharSheet.jsx`. 6-tab overlay: Stats, Combat, Spells, Features, Equipment, Bio. System-owned fields read-only during play. Player-owned fields (name, backstory, appearance, personality, notes) editable. Familiar/mount section tied to specific PC, gets own combat token.
- [ ] **Journal** — `Journal.jsx`. Sections: Quests, Locations, NPCs, Travel Log, Consequences, Town Reputation, Secrets. All AI-owned via mechanics. Secrets consolidated to one home with `playerKnown` / `aiOnly` flags. Quests show status (active/completed/failed). Locations show discovered/undiscovered. NPCs show disposition.
- [ ] **Cargo** — `Cargo.jsx`. Three containers: Carried (per-PC), Wagon (party shared), Hoard (stored/stashed). Items from `item_add` mechanics. Weight tracking (encumbrance). AI-generated items (Firebase) vs compendium items (IndexedDB) display the same.
- [ ] **Treasury** — `Treasury.jsx`. PP/GP/EP/SP/CP tracked separately. Income/expense log (every `income:` / `expense:` mechanic). Lifestyle tracker. Business profile (if applicable). All AI-owned via mechanics.
- [ ] **Compendium** — `Compendium.jsx`. Spell browser, feat browser, item browser. Data from IndexedDB (imported content). Search + filter. Spell details include: level, school, casting time, range, components, duration, description. Populated by content pipeline, not hardcoded.
- [ ] **Glossary** — `Glossary.jsx`. D&D term definitions. Seed data from v1 (97 terms in v1-seed-data.md). Expandable. Same data that powers auto-linking in chat.

---

## Phase 5: Setup Mode

> First-launch experience. Mostly locked after campaign starts. Re-entry via manage mode for corrections.

- [ ] **Session Zero wizard** — `SessionZero.jsx`. Campaign name, setting, tone, module selection (if content imported). AI contract defaults. Generates initial world state.
- [ ] **Character creation** — `CharCreate.jsx`. Race, class, ability scores, background, equipment. Populates system-owned fields. Spell selection for casters. Uses compendium data from IndexedDB (class progressions from v1-seed-data.md until content pipeline built).
- [ ] **Content import** — `ContentImport.jsx`. File upload (PDF, epub, mobi). Web URL import. Markdown/text paste. JSON import. Routes to appropriate parser. Preview before committing to IndexedDB.
- [ ] **Campaign config** — `CampaignConfig.jsx`. Module selection, episode tracking setup, house rules, contract customization.
- [ ] **Player onboarding** — `PlayerOnboard.jsx`. Share link generation. Content sync (shared bundles). Character creation for new player. Device-local "which PC am I" setting.

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
- [ ] **Three color modes** — Default, light, night. CSS custom property swap. Palette TBD.
- [?] **Child-friendly view** — `AppSimple.jsx`. Same state/engine, simplified UI. Separate URL entry point. See spec below.
- [ ] **Data migration** — `migrate.js`. State version tracking. Automatic migration on load when schema changes.
- [ ] **Memory management** — `memory.js`. `summarizeAndPrune()` for chat history. Session archive. Context injection for AI continuity. Prompt budget management as world grows.

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
| Color palette | Three modes needed. Soft Autumn cut. Design session with UI visible. | Phase 0 (CSS values only) |
| OOC & Rules channel context | Do they share narrative AI context? Does Rules build its own prompt? Does OOC need AI at all? v1 Rules chat was used for both rules questions AND app bug reports. | Phase 3 (chat tabs) |
| Child-friendly view target age | 7-16 is wide. What simplification scope? | Phase 8 |
| Episode/module tracking triggers | Location-based? Quest-based? AI-detected? | Phase 7 |
| Quick Actions action list | What actions, system vs AI directed, FAB ergonomics | Phase 3 |

---

## Icebox

> Noted, not planned. Revisit when core is solid.

- **Plugin system** — Accidental v1 feature (superpowers). Could support game-system plugins (Pathfinder, homebrew rules). Not v2 priority.
- **Encounter preset import** — Design encounters externally, import JSON. Never used in v1. Could tie into content pipeline.
- **Desktop layout** — Law 3 says no. But if demand appears, the component architecture supports it.

---

## Build Order

Phases are roughly sequential but overlap where practical:

1. **Phase 0** → scaffold + state + Firebase (foundation)
2. **Phase 1** → core loop MVP (can play a session, no enforcement)
3. **Phase 2** → enforcement gates (build one at a time, test in play)
4. **Phase 3** → play mode UI (make it feel like an app, not a terminal)
5. **Phase 4** → reference mode (mid-session orientation)
6. **Phase 5** → setup mode (first-launch experience)
7. **Phase 6** → manage mode (between-session tools)
8. **Phase 7** → content pipeline (replace hardcoded data)
9. **Phase 8** → multi-player + polish (second player joins)

Gates (phase 2) can interleave with play UI (phase 3) — build a gate, build a UI piece, test in play, repeat. The enforcement spec has its own priority order.

Content pipeline (phase 7) can start earlier if the team wants to import content before the full UI exists — the normalizer and IndexedDB layer are independent of UI.
