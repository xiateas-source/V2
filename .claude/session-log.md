# Session Log — Handoff

## Session 49 · 2026-06-29

Branch `main` @ `2b5c9d2` · pushed, auto-deploying. Build clean, 33 tests passing.

### What Shipped

1. **Fixed live-test crash in the three-phase loop** — first live test (typing "Search the room") threw `"Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing."` Root cause: mobile browsers can close IndexedDB connections when the app is backgrounded; `local.js` cached the `dbInstance` handle and never checked if it was still alive. The next read (`buildRulesBlock()` pulling rules context) hit the dead handle and threw, which killed the entire `sendMsg()` call.
   - `src/data/local.js`: `openDB()` now probes the cached connection (`isConnectionAlive()`) before reusing it, and re-opens if it's dead. Added `onclose` handler to clear the cache proactively.
   - `src/ai/rules.js`: `buildRulesBlock()` now catches errors and returns `''` instead of propagating — a missing rules block should never crash a player's action.
2. **Three-phase loop play-verified end-to-end** — second live test on "Search the area": classifier detected Investigation (DC 13), correctly picked Ivy over Thorn (her +4 beats his +1), roll bar appeared, Ivy rolled 18, SUCCESS appended to the message, AI narrated the success faithfully (found the portal behind the tapestry) without contradicting the roll. No crash. Combat kickoff, `zone_add_enemy` mechanics, and duplicate-`combat_start` rejection also behaved correctly in the same test session.

### Decisions

- IndexedDB reads must fail soft in the AI pipeline — losing the rules context block is acceptable, crashing the player's turn is not.

### Known Issues

- Classifier DCs are fixed tiers, not context-aware.
- Classifier skips combat (existing flow handles it).

### Next Up

1. Expand classifier coverage — combat attacks, saving throws, contested checks
2. Context-aware DCs via Phase 1 AI call
3. Scene transition gate
4. Deadline: July 11
