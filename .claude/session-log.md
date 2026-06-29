# Session Log — Handoff

## Session 49 · 2026-06-29

Branch `main` @ `2b5c9d2` · pushed, auto-deploying. Build clean, 33 tests passing.

### What Shipped

1. **Fixed live-test crash in the three-phase loop** — first live test (typing "Search the room") threw `"Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing."` Root cause: mobile browsers can close IndexedDB connections when the app is backgrounded; `local.js` cached the `dbInstance` handle and never checked if it was still alive. The next read (`buildRulesBlock()` pulling rules context) hit the dead handle and threw, which killed the entire `sendMsg()` call.
   - `src/data/local.js`: `openDB()` now probes the cached connection (`isConnectionAlive()`) before reusing it, and re-opens if it's dead. Added `onclose` handler to clear the cache proactively.
   - `src/ai/rules.js`: `buildRulesBlock()` now catches errors and returns `''` instead of propagating — a missing rules block should never crash a player's action.
2. **User confirmed fix on live site** — "Search the room" now classifies without crashing.

### Decisions

- IndexedDB reads must fail soft in the AI pipeline — losing the rules context block is acceptable, crashing the player's turn is not.

### Known Issues

- Full three-phase loop not yet confirmed end-to-end: need to verify the roll bar shows the correct skill/DC, the roll submits, and the AI narrates the predetermined outcome without contradicting it.
- Classifier DCs are fixed tiers, not context-aware.
- Classifier skips combat (existing flow handles it).

### Next Up

1. Finish play-verifying the three-phase loop (roll bar → roll → AI narration)
2. Context-aware DCs via Phase 1 AI call
3. Scene transition gate
4. Deadline: July 11
