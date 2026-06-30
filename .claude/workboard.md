# Workboard

*What to build next. Updated Session 56 · 2026-06-30.*

---

## Current State

The app deploys, renders, navigates. Engine pipeline (sendMsg → extract → validate → apply) is tested. Persistence works. Combat has turn enforcement. Character creation works (3 paths + guided wizard, plus mid-campaign via Settings). Level-up wizard handles all 12 classes. Multiplayer (invite links, live Firebase sync, shared identity) shipped S50. Three-phase skill-check resolution (classify → roll bar → narrate) shipped S48, live-verified S49. 57 unit tests passing.

**Latest (S56)** — a recurring bug class ("state healed at one restore/ingestion boundary but not another") was traced through 4 instances and closed: `healPartialMessages()` now finalizes stuck `partial:true` DM messages at restore time (covering interruptions with no JS exception, not just the live-stream catch path `finalizeStuckPartial()` already handled), and a 4th ingestion point — `Settings.jsx`'s save-file import — was found missing `healArrays()` and fixed. This session also closed a Known Issues triage pass: Concentration's 30 DC cap is now enforced, CharSheet's manual HP override now routes through the same `applyDamage()` mechanics pipeline as AI-driven damage (temp-HP absorption, concentration trigger, death/massive-damage enforcement), and the multiplayer join pointer (`players/{uid}/joined`) now writes synchronously instead of relying on the 3s debounce. All merged to main. See `decisions.md` and `session-log.md` for full session-by-session history (S48–S56).

---

## Priorities (user-set, deadline July 11)

1. **Continue SRD gap-analysis punch list (S52/S54/S56 follow-up)** — encumbrance/exhaustion, conditions+resistance, Death Saves, Concentration's 30 DC cap, and CharSheet's manual HP override (now routed through the mechanics pipeline) are done (see decisions.md "Rules Enforcement (S52)"/"(S54)"). Remaining items from the same gap analysis, not yet started: Critical Hits told-not-enforced (no code doubles dice on a nat 20 — note: PC attacks are fully AI-narrated, classifier doesn't intercept them, so this needs a new structured mechanic for attack rolls before code can enforce doubling, not just a mechanics.js tweak), Action Economy is heuristic-only, Cover missing entirely, Short Rest missing Hit Dice healing surfacing.
2. **Audit for more unguarded nested-field accesses** — the conditions/deathSaves/initiative crash pattern may recur elsewhere; sweep render paths before next live test
3. **Expand classifier coverage** — combat attacks, saving throws, contested checks
4. **AI DC determination** — Phase 1 AI call for context-aware DCs (currently uses standard tiers)
5. **Scene transition gate** — hold scene changes for player confirmation (Gate 2 in enforcement spec)
6. **Rest buttons** on CharSheet Vitals tab
7. **CI: deploy database rules** — `database.rules.json` is never auto-deployed; add `firebase deploy --only database` to the pipeline so it stops drifting from the manually-managed Console rules

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
- Critical hits and Cover are told-not-enforced (AI-narration only) — Critical Hits needs a new structured attack-roll mechanic since PC attacks are fully AI-narrated and the classifier doesn't intercept them; Cover is missing a mechanic + AI awareness entirely. See Priorities #1.
- Charmed, Deafened, and part of Grappled have no roll-time enforcement (cosmetic only) — no data exists to determine which checks "require hearing/sight" or who a PC's grappler is; see decisions.md "Rules Enforcement (S52)"
- Code fixes are routinely verified via `npm test`/`npm run build` only, not live play — this sandboxed environment can't reach Firebase. S55's first multiplayer fix round was live-tested and found incomplete; the S55 follow-up, S56's healing fixes, and this session's mechanics-pipeline fixes have not yet had their own live (especially two-device) re-test.
- Gate 8 (`missing_xp`) detects and flags when the AI skips an XP award after combat, but the flag is purely informational (`Chat.jsx` renders it as static text, no click handler) — `enforcement-spec.md`'s "Gate 7: XP Audit" design also specced a player-facing "Request XP calculation?" prompt that was never built, and `interceptAskDm()` doesn't consult open gate flags when the player asks an OOC question about it. Found via S56 transcript analysis; not yet confirmed/authorized by the user for implementation.

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
