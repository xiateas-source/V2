# Session Log — S74 (2026-07-01)

## Branch / Build
Branch: `claude/workboard-sprint-deadline-ka8m7y` · S73 not yet merged to main as of this session's start · S74 not yet merged · build clean, 88/88 tests passing

---

## What Shipped This Session

### Combat turn desync + pre-resolved roll outcome — core loop fix

User reported the turn indicator skipping mid-combat, in their own words: "Because thorn rolled for his vicious mockery after the DM narration my turn got skipped. Current card is showing it's thorns turn." This is a bug in the "sacred" core combat loop itself (Law 1), not a UI issue like recent sessions' fixes — treated it accordingly: traced with an Explore agent against the actual transcript first, then had a Plan agent pressure-test the fix design before writing any code, since a mistake here has real blast radius.

**Bug A — turn pointer double-advance.** `sendNarrative()` (`engine.js`) advanced the turn pointer unconditionally at the end of every response while combat was active, guarded only by `isAwaitingInitiative()` (initiative rolls only — not mid-combat `roll_request`s). So: AI asks for an attack roll → turn pointer advances immediately, before the player has even rolled. Player's roll then comes back through the *same* `sendNarrative()` pipeline → turn pointer advances *again*. Net: every turn involving a roll advanced the pointer twice, which is exactly what desynced the indicator in the transcript.

Fixed by tracking whether the *current actor's* roll is still pending, and skipping the non-kickoff advance when it is. Two real gaps in my first draft, both caught by the Plan agent before implementation: (1) the check needs to be scoped to the current actor specifically, not "any roll_request present" — otherwise a forced roll for a *different* PC (e.g. a reaction save) would incorrectly hold the current actor's turn open; (2) it needs to be computed *after* the concentration-save `roll_request` gets injected into `applied`, not before — computing it earlier silently misses concentration-save-triggered holds entirely. Combat kickoff (`inclusive: true`) is explicitly exempted — it establishes whose turn it is for the first time, it isn't confirming a resolution, so a pending roll shouldn't block it.

**Bug B — HP resolved before its own roll.** Same transcript: the AI emitted `roll_request: Attack|13|Thorn|normal|Kobold` (asking for the roll) and `hp: Kobold=4` (already resolving a hit) in the same mechanics batch. When the player's roll came back a miss, the kobold's HP was never corrected — stayed at the pre-resolved value, with no code path to catch it. (`runGate1`'s Roll Confirmation gate only regex-scans narrative prose for phrasing like "X rolls a NN" — it never inspects the mechanics block for this shape of problem.)

Fixed with a batch-level rule in `validateMechanics()` (`mechanics.js`), mirroring the existing S73 same-PC damage+hp rule exactly: collect the `TargetName` (5th field) from any `roll_request` mechanics in the batch, then reject any `hp:`/`damage:` mechanic naming that same target in the same batch. Plain skill-check `roll_request`s (no 5th field) are naturally excluded. Accepted trade-off, consistent with this codebase's existing philosophy for this rule class: a genuinely unrelated hp change to a same-named target that happens to share a message with an unrelated roll_request would also get rejected — rare, and preferred over silently letting a fabricated combat outcome through.

Files: `src/ai/engine.js`, `src/ai/mechanics.js`. 4 new tests in `tests/foundations.test.js` (co-emitted hp/damage rejected for the exact roll_request target; regression checks that a different target, or a plain skill-check roll_request, doesn't get caught). 88/88 tests passing (up from 84), build clean.

---

## Decisions Made
See `.claude/decisions.md` → "Combat turn desync + pre-resolved roll outcome (S74) — core loop fix" for the full writeup, including the two design flaws the Plan agent caught and the reasoning for each fix.

---

## Known Issues / Follow-ups
- **This is the highest-stakes unverified fix of the sprint.** Cannot live-verify in this sandbox (Firebase boot hangs before render, as with every prior session). Needs a real multi-round combat encounter with at least one attack roll to confirm: the turn indicator advances exactly once per turn (not twice, not skipped), and a missed attack roll no longer leaves stale pre-resolved damage on the target. Flag this clearly to the user before considering it fully closed — the test suite and Plan-agent review give high confidence, but this touches the core loop directly and deserves a real playtest before being trusted blind.
- Fix A (`engine.js`) has no automated test — this suite has no precedent for testing `sendNarrative()` itself (would require mocking a live AI provider call), consistent with how other `engine.js` changes this sprint (e.g. S67's Action Economy) were also verified by trace + review rather than direct unit test.
- The user directly asked, mid-review, whether this touches "the three pass loop" (the classify → roll bar → narrate architecture) — worth keeping in mind for the next session that the user is starting to track the architecture's shape, not just symptoms, and plain-language explanations of *why* a fix works are landing well.

---

## Next Up (per workboard Priorities, deadline July 11)
Priority #1 (SRD gap-analysis) closed as of S69. Remaining: #4 AI DC determination (deliberately last, complex), #5 Scene transition gate, #8 Multiplayer bundles MVP. This session's fix came from the same playtest-and-report loop as recent sessions (S70-S73) — expect that to keep being the primary source of work, alongside the scheduled priority list.

---

## Branch State
`claude/workboard-sprint-deadline-ka8m7y` has this session's commits (code + docs, pushed by end of session). Not merged to `main` — the user's most recent message ("you're good to go ahead") authorized *implementing* this fix, not a production deploy. Wait for an explicit "go live" before merging S74 to main.
