# Session Log — S78 (2026-07-01)

## Branch / Build
Branch: `claude/workboard-sprint-deadline-ka8m7y` · S77 (classifier/contract fix) merged to main and deployed earlier this conversation, plus a docs-only reconciliation commit (ai-failures.md, enforcement-spec.md, CLAUDE.md) pushed to the feature branch but not yet merged · S78 not yet merged · build clean, 112/112 tests passing

---

## What Shipped This Session

### 1. Doc reconciliation (ai-failures.md, enforcement-spec.md, CLAUDE.md)

User noticed `.claude/ai-failures.md` and `.claude/enforcement-spec.md` hadn't been touched in days/weeks and worried the documentation system had broken. It hadn't — every session's findings were going into `decisions.md`'s narrative, but these two *operational* tracking docs never got looped back to. Given the user's explicit history of past agents misreading this project's architecture, had an independent Explore agent re-verify every claim (which `ai-failures.md` items are actually fixed, the exact `gates.js` gate mapping) directly against source before writing anything — it found the gate-numbering mismatch was worse than first spotted (7 of 9 gates shifted, not just the one originally noticed).

Marked six already-fixed `ai-failures.md` items ✅ with their real fix locations and sessions, added two new S77 findings, added a verified gate-mapping table to `enforcement-spec.md`, and added one line to `CLAUDE.md`'s session-end checklist so this doesn't quietly drift again. Pure documentation, no code, no tests.

### 2. Contextual AI-determined DCs (Priority #4)

The last of the deliberately-ordered scheduled priorities. The classifier's pre-send skill checks used a flat DC-tier lookup (10/13/15/18) regardless of fictional context. Confirmed with the user directly which of two shapes this should take: a real extra AI call before the roll bar appears (chosen, accepting latency), not just better guidance for the DM's own already-flexible `roll_request` DCs.

Because this inserts a new async step into the sacred core loop, gave it the heaviest review of the sprint: an Explore agent traced the exact classify→RollBar wiring first (confirmed `classifyAction()` is called once inside `sendMsg()`, populates a `preSendRolls` signal `RollBar.jsx` reads reactively — delaying that signal's population is all that's needed, no new UI plumbing). Then two **independent, sequential** Plan-agent passes red-teamed the design — the second explicitly tasked with finding whatever the first missed, not re-deriving it. Between them they caught four real bugs before any code shipped:

1. Stop button didn't actually cancel the wait (`activeController` was `null` during this window) — fixed by giving the DC lookup its own `AbortController` wired into the same field `stopGeneration()` already aborts.
2. Reusing the main provider call's full retry chain for a tiny call would blow the latency budget and poison shared provider-health state for the *next* real DM turn — fixed with a new lean `callProviderOnce()` export (`providers.js`) that never retries and never calls `recordFailure()`, sharing a new `pickHealthyProviders()` helper with `callProvider` so the two don't duplicate/drift.
3. A bare `Promise.race` against a timer doesn't actually cancel the losing fetch — fixed by explicitly calling `.abort()` in the timeout.
4. Per-line DC parsing had no defense against a misaligned response (blank line, stray number in a preamble) silently handing the wrong DC to the wrong roll — fixed: `parseDCResponse()` rejects the whole response wholesale on any count mismatch, falling back to every roll's own tier default, rather than trusting index alignment.

Also settled: one combined AI call per classified message, not one per roll — cheaper, avoids hammering a free-tier rate-limited key with parallel requests on a multi-PC compound action.

Files: `src/ai/providers.js` (`callProviderOnce`, `pickHealthyProviders`), `src/ai/engine.js` (`determineContextualDCs`, `parseDCResponse`, wired into `sendMsg()`'s classifier branch), `tests/foundations.test.js`. 5 new tests (`parseDCResponse`: aligned, misaligned/short, empty/unparseable, clamping, blank-line filtering), 112/112 passing, build clean.

---

## Decisions Made
See `.claude/decisions.md` → "Contextual AI-determined DCs (S78) — Priority #4" for full detail on the design and all four caught bugs.

---

## Known Issues / Follow-ups
- S78's contextual-DC feature is **not live-verified** — needs a real phone check: an unusual action should get a plausibly different DC after a brief pause (not the flat tier default); tapping Stop during that pause should prevent the roll bar from appearing at all; a network hiccup should still produce a working roll bar rather than hanging.
- User separately flagged a new bug mid-session, not yet investigated: "i currently cant open npc info without it closing on me immediately" — likely a UI issue in the Journal/NPC detail view (tooltip or drawer closing itself immediately on open). Explicitly deferred to be picked up right after this session's core-loop work, per the user's own request not to split attention mid-review.
- Remaining scheduled priority: #8 Multiplayer bundles MVP (the only one left).
- All prior sessions' unverified items remain outstanding (see workboard.md's Known Issues section for the full running list).

---

## Next Up (per workboard Priorities, deadline July 11)
Priorities #1, #2, #3, #4, #5, #7 now closed. Only #8 (Multiplayer bundles MVP) remains scheduled. Immediate next item: the NPC info panel closing-on-open bug flagged mid-session but not yet investigated.

---

## Branch State
`claude/workboard-sprint-deadline-ka8m7y` has this session's commits pending push as of writing. S77 (code) is merged to `main` and deployed; the S77 doc-reconciliation commit and this session's S78 work are both on the feature branch only — no "go live" given yet for either.
