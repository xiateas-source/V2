# Workboard

*What to build next. Updated Session 47 · 2026-06-25.*

---

## Current State

The app deploys, renders, navigates. Engine pipeline (sendMsg → extract → validate → apply) is tested. Persistence works. Combat has turn enforcement. Character creation works (3 paths + guided wizard). Level-up wizard handles all 12 classes. 33 unit tests passing.

**Not yet play-verified with a live AI session.** The loop hasn't been exercised end-to-end with an API key.

---

## Priorities (user-set)

1. **Play-verify with a real AI session** — the gate. Exercise the full loop with an API key.
2. **Gameplay mechanics** (user elevated S47 — "they make it fun"):
   - Carrying capacity (STR × 15, tracked against inventory weight)
   - Resistance/vulnerability tracking
   - Critical hit enforcement (extra dice)
   - Spell component requirements checking
   - Distance/time tracking during travel
3. **Action economy enforcement** — wire `actionsUsed` flags to Gate 2
4. **Rest buttons** on CharSheet Vitals tab

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
- Still not play-verified with a live AI session

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
