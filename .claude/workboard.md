# Workboard

*What to build next. Updated Session 57 · 2026-06-30.*

---

## Current State

The app deploys, renders, navigates. Engine pipeline (sendMsg → extract → validate → apply) is tested. Persistence works. Combat has turn enforcement. Character creation works (3 paths + guided wizard, plus mid-campaign via Settings). Level-up wizard handles all 12 classes. Multiplayer (invite links, live Firebase sync, shared identity) shipped S50, **live two-device retested and confirmed working S57**. Three-phase skill-check resolution (classify → roll bar → narrate) shipped S48, live-verified S49. 57 unit tests passing.

**Latest (S57)** — live two-device multiplayer retest confirmed the S56 `shareInvite()` fixes work: host/guest exports compared byte-for-byte identical (campaign state, all 24 narrative messages) except per-device `updatedAt`. The same test transcript surfaced a real bug (player messages weren't visually distinguishable in multiplayer chat — `playerName` was stored but never rendered), now fixed with a name label gated on party size > 1. Priority #2's audit continued: found and fixed one more instance of the recurring "healed at one ingestion point, not another" bug class, this time in the `system` store (`restoreQuickActions()` now heals against `DEFAULT_SYSTEM` instead of replacing wholesale); all other audit candidates traced safe. Priority #3 got a small, decision-compliant win: a contract-only "contested checks" instruction (NPC rolls itself, feeds result into a normal PC `roll_request` as the DC) — zero new code. The larger Critical Hits / PC-attack-roll mechanic remains unbuilt, pending user confirmation (architecturally significant per Standing Permissions). See `decisions.md` and `session-log.md` for full session-by-session history (S48–S57).

---

## Priorities (user-set, deadline July 11)

1. **Continue SRD gap-analysis punch list (S52/S54/S56 follow-up)** — encumbrance/exhaustion, conditions+resistance, Death Saves, Concentration's 30 DC cap, and CharSheet's manual HP override (now routed through the mechanics pipeline) are done (see decisions.md "Rules Enforcement (S52)"/"(S54)"). Remaining items from the same gap analysis, not yet started: Critical Hits told-not-enforced (no code doubles dice on a nat 20 — note: PC attacks are fully AI-narrated, classifier doesn't intercept them, so this needs a new structured mechanic for attack rolls before code can enforce doubling, not just a mechanics.js tweak), Action Economy is heuristic-only, Cover missing entirely, Short Rest missing Hit Dice healing surfacing.
2. **Audit for more unguarded nested-field accesses** — done (S57): broad sweep across `src/ui/**/*.jsx`, one real gap found and fixed (`restoreQuickActions()` missing healing), all other candidates traced safe. See decisions.md "Priority #2 audit (S57)".
3. **Expand classifier coverage** — contested checks got a contract-only win (S57, see decisions.md). Combat attacks and saving throws are already covered by the existing `roll_request`/`RollBar.jsx` path (saving throws) or remain the same unbuilt gap as Critical Hits above (combat attacks — needs the new attack-roll mechanic, not classifier work).
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
- Code fixes are routinely verified via `npm test`/`npm run build` only, not live play — this sandboxed environment can't reach Firebase. S57's two-device live retest confirmed the invite-link fix and the multiplayer join/sync path work correctly end to end. Still unverified live: S56's partial-message healing fixes, this session's mechanics-pipeline fixes from S56, and S57's `restoreQuickActions()`/chat-name-label fixes.
- ~~Live report: guest got "Campaign not found"~~ — **resolved and confirmed live (S57)**. See decisions.md "Invite-link 'Campaign not found' investigation".
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
