# Workboard

*What to build next. Updated Session 53 · 2026-06-30.*

---

## Current State

The app deploys, renders, navigates. Engine pipeline (sendMsg → extract → validate → apply) is tested. Persistence works. Combat has turn enforcement. Character creation works (3 paths + guided wizard, plus mid-campaign via Settings). Level-up wizard handles all 12 classes. 39 unit tests passing.

**Onboarding repair: Quick Pick characters were getting no gear (S53)** — user-reported bug. Root cause: `STARTING_EQUIPMENT` only covered 3 of the 12 `CLASS_DATA` classes (Fighter/Rogue/Bard); Quick Pick and the Guided Build wizard both silently produced zero starting gear for the other 9. Filled in standard PHB starting-gear tables for Barbarian/Cleric/Druid/Monk/Paladin/Ranger/Sorcerer/Warlock/Wizard, fixing both paths at once since they share the table. While fixing it, found and fixed a second Law 2 gap in `forge.js`: AC was hardcoded to 16 for Fighter and a light-armor `11+dexMod` heuristic for every other class, ignoring the per-class `startingAC` field that already existed and was correct (a Quick Pick Paladin was getting AC ~11 instead of 18) — now reads `classInfo.startingAC` directly. Also fixed the "Talk to AI" builder's system prompt, which still told players "Supported classes: Fighter, Rogue, Bard ONLY" and steered them away from the other 9 even though every other path supported them. UX addition: the Quick Pick card now shows starting gear + gold before the player commits, matching standard VTT quick-build conventions (e.g. D&D Beyond) instead of handing over an unseen inventory. See decisions.md "Onboarding Repair (S53)".

**SRD 2024 gap-analysis + enforcement pass (S52)**: a background agent diffed the codebase against the uploaded SRD glossary/playing-the-book docs and returned a 10-item punch list. Shipped the top two: (1) encumbrance switched from a wrong duplicated 2014 two-tier model (4 locations) to the 2024 SRD single STR×15 hard cap, and exhaustion switched from disadvantage-based to the 2024 flat −2/level penalty; (2) all 15 conditions now have real roll-time mechanical effects in `RollBar.jsx` (previously only 4 had partial effects), Paralyzed/Stunned/Unconscious/Petrified now force auto-fail on Str/Dex saves instead of just disadvantage, and a new `damage: PCname,amount,DamageType` mechanic lets the app compute resistance/vulnerability/immunity multipliers itself instead of trusting AI narration math. Also found and fixed a real three-phase-loop bug: the pre-send roll path showed garbled "rolled -1" text instead of a clean auto-fail message. See decisions.md "Rules Enforcement (S52)" for full list and remaining gaps (Charmed/Deafened/Grappled left cosmetic — no data to enforce them correctly).

**Stale DM contract fixed + rules enforcement gaps closed (S51)**: `DEFAULT_CONTRACTS.never` still told the AI to use the pre-S48 roll-and-wait flow for everything; fixed, plus a one-time migration in `persist.js` heals existing campaigns whose `contracts.never` still holds the old text verbatim. Drift detector extended to catch narrated enemy/PC defeat language (collapses, dies, knocked out, etc.) with no matching `hp` mechanic — found via a real bug transcript (Vesper's Adventure). Encumbrance and conditions (Poisoned, Frightened, Restrained, Prone) were tracked in state and shown to the AI in the ledger, but nothing enforced them — extended the existing exhaustion-disadvantage path in `RollBar.jsx` so Heavily Encumbered PCs and these conditions now actually apply disadvantage on rolls. See decisions.md "Rules Enforcement (S51)" and session-log.md for detail.

**Three-phase action resolution shipped** (S48): player actions are now classified before the AI responds. Code detects skill checks (Investigation, Stealth, Persuasion, etc.), shows the roll bar with DC, waits for the player's roll, then sends the predetermined outcome to the AI for narration. Skip button lets players bypass false classifications.

**Live test crash fixed** (S49): first live test on mobile hit `"Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing."` when typing "Search the room". Root cause: mobile browsers close IndexedDB connections when backgrounded; the cached `dbInstance` in `local.js` went stale and the next read (rules lookup in `buildRulesBlock()`) threw, killing the whole send. Fixed: `openDB()` now checks connection liveness before reuse, and `buildRulesBlock()` fails soft instead of crashing the action.

**Three-phase loop play-verified end-to-end** (S49): second live test confirmed the full flow on "Search the area" — classifier detected Investigation (DC 13), correctly picked Ivy over Thorn (her +4 beats his +1), roll bar appeared, Ivy rolled 18, SUCCESS was appended to the message, and the AI narrated the success faithfully (found the portal behind the tapestry) without contradicting the roll. Combat kickoff, `zone_add_enemy` mechanics, and duplicate-`combat_start` rejection also behaved correctly in the same session.

**Multiplayer shipped** (S50): invite links, live Firebase sync between host/guest devices, shared player identity ("Who Am I?"), shared API key so guests don't need their own. Mid-campaign character creation added to Settings.

**Boot crash cascade fixed** (S50): three "Something went wrong" live crash reports, all traced to the same root cause at increasing depth — Firebase RTDB nullifies/omits empty arrays on write, and `DEFAULT_CAMPAIGN`/`DEFAULT_CHARACTER` defaults were getting silently overwritten with `null`/`undefined` on restore. Fixed top-level campaign arrays, then per-character fields (`conditions`, `deathSaves`), then nested object fields (`combatState.initiative`/`actionsUsed`/`zones`). Also added a generic error-UI fallback in `main.jsx` so a boot-time throw never again produces a blank screen. See session-log.md S50 for full root-cause chain.

---

## Priorities (user-set, deadline July 11)

1. **Continue SRD gap-analysis punch list (S52 follow-up)** — encumbrance/exhaustion ruleset fix and conditions+resistance enforcement are done (see decisions.md "Rules Enforcement (S52)"). Remaining items from the same gap analysis, not yet started: Critical Hits told-not-enforced (no code doubles dice on a nat 20), Action Economy is heuristic-only, Cover missing entirely, Death Saves partial (no auto-fail on damage at 0 HP, no massive-damage instant death), Short Rest missing Hit Dice healing surfacing, Concentration missing the 30 DC cap. Also flagged: CharSheet's manual HP override bypasses the mechanics pipeline (no temp-HP absorption, no concentration check).
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
- Critical hits, Cover, full Death Saves (auto-fail at 0 HP, massive damage instant death), and Concentration's 30 DC cap are told-not-enforced (AI-narration only) — see S52 punch list in Priorities #1
- Charmed, Deafened, and part of Grappled have no roll-time enforcement (cosmetic only) — no data exists to determine which checks "require hearing/sight" or who a PC's grappler is; see decisions.md "Rules Enforcement (S52)"
- CharSheet's manual HP override bypasses the mechanics pipeline entirely (no temp-HP absorption, no concentration check)

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
