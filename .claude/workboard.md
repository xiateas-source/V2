# Workboard

*What to build next. Updated Session 49 · 2026-06-29.*

---

## Current State

The app deploys, renders, navigates. Engine pipeline (sendMsg → extract → validate → apply) is tested. Persistence works. Combat has turn enforcement. Character creation works (3 paths + guided wizard). Level-up wizard handles all 12 classes. 33 unit tests passing.

**Three-phase action resolution shipped** (S48): player actions are now classified before the AI responds. Code detects skill checks (Investigation, Stealth, Persuasion, etc.), shows the roll bar with DC, waits for the player's roll, then sends the predetermined outcome to the AI for narration. Skip button lets players bypass false classifications.

**Live test crash fixed** (S49): first live test on mobile hit `"Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing."` when typing "Search the room". Root cause: mobile browsers close IndexedDB connections when backgrounded; the cached `dbInstance` in `local.js` went stale and the next read (rules lookup in `buildRulesBlock()`) threw, killing the whole send. Fixed: `openDB()` now checks connection liveness before reuse, and `buildRulesBlock()` fails soft instead of crashing the action. User confirmed "Search the room" now classifies without crashing on live site.

**Three-phase loop not yet fully play-verified.** The crash is gone, but full end-to-end (roll bar appears with correct DC → player rolls → AI narrates predetermined outcome correctly) still needs confirmation.

---

## Priorities (user-set, deadline July 11)

1. **Finish play-verifying the three-phase loop** — confirm roll bar appears with correct skill/DC, roll submits, AI narrates the predetermined outcome without contradicting it
2. **Expand classifier coverage** — combat attacks, saving throws, contested checks
3. **AI DC determination** — Phase 1 AI call for context-aware DCs (currently uses standard tiers)
4. **Scene transition gate** — hold scene changes for player confirmation (Gate 2 in enforcement spec)
5. **Rest buttons** on CharSheet Vitals tab

---

## Three-Phase Architecture (S48)

```
Player declares action
       ↓
  classifier.js detects skill check
       ↓
  RollBar shows (skill + DC) — player rolls
       ↓
  Code determines SUCCESS/FAILURE
       ↓
  AI narrates the predetermined outcome
```

Key files: `src/ai/classifier.js`, `src/ai/engine.js` (sendNarrative, resumeAfterRolls), `src/ui/play/RollBar.jsx`

---

## Stubs to Fill

| Stub | File | Purpose |
|------|------|---------|
| SessionReview | `manage/SessionReview.jsx` | Session archive/review UI |
| ContentImport | `setup/ContentImport.jsx` | Content import UI |
| SessionZero | `setup/SessionZero.jsx` | Campaign setup wizard |
| Modal | `shared/Modal.jsx` | Shared modal component |
| AppSimple | `AppSimple.jsx` | Child-friendly view |
| bundles.js | `data/bundles.js` | Shared content packs |
| migrate.js | `data/migrate.js` | State version migration |
| elevenlabs.js | `audio/elevenlabs.js` | ElevenLabs TTS |

---

## Not Yet Built

- Multiplayer identity system
- Push notifications (Web Push + FCM)
- Multi-device real-time sync verification
- Shared content bundles
- Visual tile map (combat phase 2)
- Web/markdown/JSON content parsers
- Episode/module tracking system
- Pre-built class progression downloads

---

## Known Issues

- Action economy: `actionsUsed` flags exist in combatState but aren't checked by any gate
- Classifier DCs are standard tiers (10/13/15) — not context-aware yet
- Classifier doesn't handle combat attacks or saving throws (those go through existing flow)
- Full three-phase loop (roll bar → AI narration) still needs end-to-end play confirmation

---

## Reference Docs

| File | When to Read |
|------|-------------|
| `ui-specs-v2.md` | Building/modifying CharSheet, Cargo, Treasury, Journal, Combat UI |
| `chat-system-spec-v2.md` | Working on chat, streaming, message types, overlays |
| `enforcement-spec.md` | Working on mechanics gates (9 gates) |
| `decisions.md` | Before making a design choice — check if it's already decided |
| `ai-failures.md` | Adding/modifying Law 2 enforcement |
| `prime-directive.md` | Grounding a decision in project vision |
| `player-requests-v2.md` | Checking unbuilt player requests |
