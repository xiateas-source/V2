# Workboard

*Active work, queued items, build plan. The living status of V2.*

---

## Reality Snapshot — Session 46 · 2026-06-25

Reconciled after deploying 8 feature areas + 2 post-deploy fixes. Verified via full-demo JSON export and MechTest audit.

**Verification legend**
- ✅ **tested** — passing unit tests (33 tests, `tests/foundations.test.js`)
- 🟢 **built** — substantial code, wired, rendering or executing
- 🟠 **face** — UI renders but not play-verified with a live AI session
- ⛔ **stub** — placeholder (returns null / empty export)
- ◻️ **absent** — no representation yet

### Engine (`src/ai/`)
| File | Lines | Status | Note |
|------|-------|--------|------|
| mechanics.js | 1051 | ✅ | 72 mechanic keys. extract/validate/apply tested. Familiar, combat, economy, story tracking all wired. |
| store.js (state) | 137 | ✅ | Ownership enforcement tested (ai/player/system cross-write throws). |
| messages.js | 54 | ✅ | Schema + old→new migration tested. |
| gates.js | 421 | 🟢 | Gates 4 & 5 tested; combat/other gates untested. |
| engine.js | 240 | 🟢 | sendMsg loop; stop-generation tested. |
| prompt.js | 252 | 🟢 | buildPrompt / genLedger. |
| providers.js | 248 | 🟢 | Gemini + OpenRouter, retry/fallback. |
| contracts.js | 103 | 🟢 | Narrative + Ask DM voices. |
| memory.js | 87 | 🟢 | summarize/prune. |
| drift.js | 75 | 🟢 | Drift detector. |
| rules.js | 95 | 🟢 | Rules helpers. |
| setupPrompts.js | 80 | 🟢 | Setup prompt assembly. |

### State / Data
| File | Lines | Status | Note |
|------|-------|--------|------|
| state/campaign.js, system.js | 113/31 | 🟢 | Data shapes + resetCampaign. Familiar field on character. |
| data/firebase.js, sync.js | 132/89 | 🟢 | Init/auth/sync, offline fallback. |
| data/local.js, seed.js | 151/73 | 🟢 | IndexedDB v4 seed: 339 spells, 12 classes, 56 feats, 84 glossary, 34 rules, 16 maneuvers. `getSpellsForClass()`, `countStore()`. |
| data/persist.js | 191 | 🟢 | **Local-first persistence built.** IndexedDB snapshots, boot restore, cloud reconcile, activeCampaignId hydration. |
| data/quickBuild.js | 319 | 🟢 | Quick-build char path. |
| data/forge.js | ~200 | 🟢 | Canonical character builder. |
| data/keys.js, demo.js | 113/323 | 🟢 | Demo includes familiar (Quill on Ivy). |
| data/bundles.js, migrate.js | 1/1 | ⛔ | Content packs + state migration unbuilt. |

### UI
| File | Lines | Status | Note |
|------|-------|--------|------|
| App.jsx | ~95 | 🟢 | 4-item nav (Cargo/Play/Journal/Settings). Chronograph theme. |
| play/Chat.jsx | 315 | 🟠 | Two-tab chat. Auto-hides CharTiles/SituationBar during combat. Spell tooltip on combat spells. |
| play/TurnPrompt.jsx | 119 | 🟠 | Turn card with spell/attack quick actions + spell ⓘ tooltips. Minimizable via dice button. |
| play/Combat.jsx | 141 | 🟠 | Initiative tracker. Auto-minimizes on PC turns, expands on NPC turns. |
| play/InputBar.jsx | ~120 | 🟠 | Dice button toggles TurnPrompt during combat, opens QuickActions outside. |
| play/RollBar.jsx | 375 | 🟠 | Initiative/roll UI. |
| play/QuickActions.jsx | 362 | 🟠 | Action drawer. |
| play/CharTiles, SituationBar, ContextBanner, DiceRoller, TTS, PreviouslyOn, Rewind | 32–207 | 🟠 | Chronograph styled. |
| reference/CharSheet.jsx | 989 | 🟠 | 6 tabs. Full familiar stat block in Vitals (abilities, speeds, special abilities, action buttons). |
| reference/Journal.jsx | 155 | 🟠 | Quests/NPCs/Places/Log/Lookup. |
| reference/Cargo.jsx, Treasury.jsx | 98/130 | 🟢 | Inventory + currencies/ledger/lifestyle. |
| reference/Compendium.jsx | 97 | 🟢 | 4 tabs: Spells (339), Rules (34), Glossary (84), Feats (56). Search. |
| setup/CharCreate, CharWizard, CampaignConfig | 488/~400/371 | 🟠 | 3 creation paths + guided wizard. Editable premise. |
| setup/PlayerOnboard, KeyGate | 71/54 | 🟠 | |
| setup/ContentImport, SessionZero | 1/1 | ⛔ | Unbuilt. |
| manage/MechTest.jsx | 237 | 🟢 | Fire mechanics, inject blocks, quick buttons (incl. familiar_add), build audit with color-coded status. |
| manage/DevTools.jsx | 358 | 🟠 | Flags, inspector, gate log. |
| manage/Settings.jsx | 195 | 🟠 | Sub-view routing to Contracts. |
| manage/Contracts.jsx | 101 | 🟢 | 7-section accordion editor for DM contracts. |
| manage/SessionReview.jsx | 1 | ⛔ | Unbuilt. |
| shared/LevelUp.jsx | ~600 | 🟢 | Full 12-class L2-20 wizard (subclass/ASI/feat/spell/expertise/HP). |
| shared/Toast, icons, sourceBus | 47/13/~80 | 🟢 | Toast events, d20 SVG, cross-component navigation bus. |
| shared/MechPill.jsx | 50 | 🟢 | Routes pill taps to CharSheet/Cargo/Journal. |
| shared/Modal.jsx, Nav.jsx | 1 each | ⛔ | Stubs. |
| AppSimple.jsx | 1 | ⛔ | Child-friendly entry unbuilt. |

### Content pipeline (`src/content/`)
| File | Status |
|------|--------|
| adventureParser, markdownAdventureParser, normalizer, chunkSplitter, fileParser | 🟢/🟡 |
| jsonParser, mdParser, webParser | ⛔ |

### Audio
browserTTS.js (58) 🟢 · elevenlabs.js (1) ⛔

### What's actually playable
The app deploys, renders, navigates. The engine pipeline (sendMsg → extract → validate → apply) is real and tested. Persistence works (reload doesn't wipe the game). Combat has turn enforcement. Character creation works through multiple paths. Level-up wizard handles all 12 classes.

**Not yet play-verified with a live AI session.** The loop hasn't been exercised end-to-end with an API key. Until that happens, bugs in prompt assembly, streaming, and gate interaction remain unknown.

### Honest "what's left"
1. **Play-verify with a real session.** Exercise the loop: type → AI responds → mechanics apply → state updates → next message includes updated ledger. This is the gate.
2. **Persistence spine is BUILT.** No longer a blocker.
3. ⛔ Stubs to fill: SessionReview, ContentImport, SessionZero, Modal.
4. ◻️ Absent: multiplayer identity, push notifications, child view, shared bundles, state migration.
5. Engine hardening (later): unit tests for untested gates, providers, memory.

---

## Build Plan

> Original Phases 0–8. Specs for data shapes, chat system, enforcement gates, and UI live in their own reference files (listed below). This plan tracks *what to build*, not *how it's shaped*.

### Phase 0: Foundation — ✅ COMPLETE
Project scaffold, state store with ownership, Firebase, IndexedDB seed (v4: 339 spells, 12 classes, 56 feats, 84 glossary, 34 rules, 16 maneuvers), 20 color themes.

### Phase 1: Core Loop — 🟢 MOSTLY BUILT
Provider abstraction, prompt builder, mechanics pipeline (72 keys), engine orchestrator, two-tab chat, contracts, memory management. **Remaining:** AI contract text tuning, memory.js session-length testing, Ask DM data injection from IndexedDB.

### Phase 2: Enforcement Gates — 🟡 PARTIALLY BUILT
Gates 4 (scene transition) and 5 (unmentioned PC) are tested. Gates 1–3, 6–9 exist in `gates.js` but are untested in play. Full specs: `.claude/enforcement-spec.md`.

### Phase 3: Play Mode UI — 🟠 FACE EXISTS
Chat (two tabs), combat overlay (auto-minimize, turn enforcement), TurnPrompt (minimize via dice, spell info icons), roll bar, context banner, situation bar, char tiles, quick actions, input bar, TTS toggle. **Remaining:**
- [ ] Mechanic pills (`MechPill.jsx` stub) — tappable pills in AI responses → source
- [ ] Term-glossary / citation / inline-NPC linking
- [ ] Checkpoint/rewind surfacing (confirm one-tap restore reachable)
- [ ] Previously On / Catch Up (needs memory.js)
- [ ] Ask DM interception + data injection
- [ ] Push notifications (Web Push + FCM)

### Phase 4: Reference Mode — 🟢 MOSTLY BUILT
CharSheet (6 tabs + familiar stat block), Journal, Cargo, Treasury, Compendium (4 tabs), travel calculator. **Remaining:**
- [ ] Encumbrance / weight in Cargo + Equipment (capacity = STR×15)
- [ ] Play-verify charsheet rolls, rest, swipe-between-PCs

### Phase 5: Setup Mode — 🟠 PARTIALLY BUILT
CharCreate (3 paths), CharWizard (guided), CampaignConfig (editable premise), PlayerOnboard, KeyGate. **Remaining:**
- [ ] Session Zero wizard (campaign name, setting, tone, module selection)
- [ ] Content import UI
- [ ] Full player onboarding flow with push opt-in

### Phase 6: Manage Mode — 🟡 PARTIAL
DevTools, Settings, MechTest (with build audit). **Remaining:**
- [x] AI contracts editor (S47)
- [ ] Session review / archive
- [ ] System operations UI (rest buttons, stat corrections)

### Phase 7: Content Pipeline — 🟡 PARTIAL
File parser and normalizer exist. Seed data covers base needs. **Remaining:**
- [ ] Web parser, markdown parser, JSON import
- [ ] Episode/module tracking system (needs spec)
- [ ] Shared bundles
- [ ] Pre-built class progression downloads

### Phase 8: Multi-Player & Polish — 🟡 MINIMAL
20 color themes done. Firebase sync exists. **Remaining:**
- [ ] Multi-device real-time sync verification
- [ ] Shared content bundles
- [ ] Combat phase 2 (visual tile map)
- [ ] Child-friendly view (AppSimple.jsx)
- [ ] Data migration (migrate.js)

---

## Reference Docs

| File | Purpose |
|------|---------|
| `.claude/chat-system-spec-v2.md` | Chat UI, overlays, streaming, input bar, message types |
| `.claude/ui-specs-v2.md` | CharSheet, Cargo, Treasury, Journal, Combat specs |
| `.claude/enforcement-spec.md` | Full gate specs (9 gates) |
| `.claude/player-requests-v2.md` | Cross-cutting UX requirements |
| `.claude/v1-engine-dump.md` | V1 mechanic key mapping, validation, data shapes |
| `.claude/v1-engine-dump-addendum.md` | V1 combat state, PC template, buildPrompt, persistence |

---

## Open Questions

| Question | Blocking |
|----------|----------|
| Child-friendly view target age (7-16 is wide) | Phase 8 |
| Episode/module tracking triggers | Phase 7 |
| Quick Actions action list + ergonomics | Phase 3 |

---

## Icebox

- **Plugin system** — game-system plugins (Pathfinder, homebrew). Not v2 priority.
- **Encounter presets** — save/load enemy groups. Could return via content pipeline.
- **Desktop layout** — Law 3 says no.
