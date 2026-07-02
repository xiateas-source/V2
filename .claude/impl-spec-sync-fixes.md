# Implementation Spec — Audit #1 (echo normalization) & #2 (character union merge)

*Written S81 by the audit session so the implementing session executes a settled
design instead of re-deriving one. Read `audit-2026-07-02.md` findings #1/#2 for the
evidence. These two ship together — same files, same test suite, one live check.*

---

## Fix #1 — Echo detection vs. RTDB empty-collection pruning

**File:** `src/data/firebase.js` only.

**Problem:** `markWritten()` stores `stableStringify(value)` of what the app wrote,
but Firebase RTDB strips empty arrays, empty objects, and null/undefined values from
stored data — so the echo `onValue` hands back omits keys the app wrote as `[]`/`{}`
(`presence: {}`, a character's `conditions: []`, early `ooc: []`...). The strings
almost never match, `isEcho()` returns false, and the device reprocesses its own
writes.

**Design (settled — do not re-litigate):** normalize values the way RTDB does,
*before* stringifying, on BOTH sides (write side in `markWritten`, listen side in
`isEcho`). Add one pure exported function:

```
export function rtdbNormalize(value) {
  // - null/undefined → undefined (key dropped)
  // - [] and {} → undefined (key dropped)
  // - arrays: normalize items; drop trailing/interior undefineds the way JSON
  //   does NOT — RTDB stores arrays as integer-keyed objects, so an array
  //   containing only empty objects becomes empty and is dropped entirely
  // - objects: normalize each value, drop keys that normalized to undefined;
  //   if nothing survives, the object itself → undefined
  // - primitives (incl. 0, '', false): returned as-is — RTDB keeps falsy scalars
}
```

`markWritten(path, value)` → `stableStringify(rtdbNormalize(value))`, and the same
wrap on `incoming` in `isEcho` (a value read back from RTDB is already normalized,
but wrapping both sides costs nothing and makes the comparison symmetric by
construction).

**Explicitly out of scope:** RTDB's integer-key array coercion (sparse arrays coming
back as objects). The app never writes sparse arrays; do not add speculative handling.

**Tests (add to `tests/foundations.test.js` near the existing `stableStringify`
tests, or a new `tests/echo.test.js`):**
1. `rtdbNormalize` drops empty arrays/objects at any depth; keeps `0`, `''`, `false`.
2. A payload with `presence: {}` + a character with `conditions: []` normalizes
   equal to the same payload with those keys absent.
3. End-to-end through the exported pair: `markWritten(p, valueWithEmpties)` then
   `isEcho(p, sameValueWithoutEmpties)` → true (this is the exact production
   mismatch). `markWritten`/`isEcho` aren't exported today — export them.
4. Regression: a genuinely different remote value (one HP changed) is NOT an echo.
5. Existing two-device suite (`tests/sync.test.js`) stays green untouched.

---

## Fix #2 — Character union-by-id merge in `mergeCampaign()`

**File:** `src/data/persist.js` only.

**Problem:** `mergeCampaign()` spreads `{...localC, ...cloudC}` so cloud `characters`
wholesale replaces local — a locally-created character that hasn't reached the cloud
yet is silently deleted by the next merge. (The S62 docs describe this fix as shipped;
it never existed — see the correction note in decisions.md.)

**Design (settled):** add `mergeCharacters(local = [], cloud = [])`, called from
`mergeCampaign` after the existing `narrative`/`ooc`/`presence`/`activeBundles`
lines:

- Union by `id`. **Cloud wins per-id** (another device's HP/XP/condition changes are
  newer than this device's stale copy in the common case — matches the S62 entry's
  stated intent). Local-only ids are appended, in their local order, after the cloud
  ones.
- A character without an `id` on either side (legacy edge): match by exact `name`
  (case-insensitive) instead; if still unmatched, keep it.
- Do NOT deep-merge per-field — whole-character replacement per id, like
  `unionById` does for messages. Per-field timestamped merging is a bigger design
  this spec deliberately avoids (no per-character `ts` exists).

**Known accepted limitation (document in the code comment, don't solve):** if the
SAME character is edited on two devices between syncs, cloud wins whole-character;
solo/near-solo play makes this acceptable, and the 3s debounce + `forceSyncNow` on
character creation keeps the window small.

**Tests (extend the `mergeCampaign` block in `tests/foundations.test.js`):**
1. Local-only character (no cloud counterpart) survives the merge — the Nyx case.
2. Cloud-only character comes through.
3. Same id both sides → cloud's HP/fields win.
4. Id-less character matched by name doesn't duplicate.
5. Two-device suite (`tests/sync.test.js`): add a scenario — device B creates a
   character while device A's snapshot is in flight; B's character survives A's
   subsequent full-payload write landing. (The in-memory fake RTDB already supports
   this shape — see the existing join/presence round-trip test.)

---

## Sequencing & verification

1. Implement #2 first (pure function + tests, no Firebase semantics), then #1.
2. `npm test` + `npm run build` — everything green, no other files touched beyond
   the two named (plus tests).
3. Update: workboard audit table rows #1/#2 → fixed; the S62 checklist row (drop the
   "expect FAIL" note); decisions.md correction note gets a "fixed S8x" line;
   session log.
4. **Live check (phone):** create a character, immediately kill the tab, reload —
   character survives (this was impossible before #2). If two devices available:
   confirm presence toggles still behave (echo path changed — watch for the S60
   flicker class regressing; `reconcile()` + per-uid presence merge should hold).
