# Session Log — S79 (2026-07-01)

## Branch / Build
Branch: `claude/workboard-sprint-deadline-ka8m7y` · S78 (contextual AI-determined DCs + doc reconciliation) merged to main and deployed earlier this conversation · S79 not yet merged · build clean, 116/116 tests passing

---

## What Shipped This Session

### Broken echo detection + missing reconcile() — NPC info closing on open

User reported: "i currently cant open npc info without it closing on me immediately." What started as one UI bug turned into a foundational sync-correctness gap, root-caused through three sequential, independently-verified agent passes — given unusually heavy scrutiny because the user asked pointed, specific questions about whether this connected to two other past bugs, and because any sync-path change risks the multiplayer presence system they'd spent real effort getting right.

**Two real, distinct bugs:**

1. `src/data/firebase.js`'s `isEcho()` — built in a past session (S60) specifically to stop a device's own write from being reprocessed as if it were a remote change — has likely been silently non-functional since it shipped. It compares `JSON.stringify` of what was written against what Firebase RTDB hands back, but RTDB always returns object children in its own canonical (alphabetical, for non-integer-like keys) order, while the app's payload builder uses a fixed, unrelated source order. `JSON.stringify` is key-order-sensitive, so the comparison mismatches on nearly every write, not occasionally.
2. No `setStore('campaign', ...)` call site anywhere in the codebase ever used Solid's `reconcile()` (confirmed by grep — zero usages project-wide). Every cloud-merge landing as a whole-object replace tears down and rebuilds any keyed `<For>` over campaign data whose array references changed, even when nothing in it actually changed. `Journal.jsx`'s NPC cards are one such list — remounting resets their local "expanded" signal. Bug #1 made this fire on nearly every action-driven sync round-trip instead of only genuine external changes, which is why it reproduced even in solo play.

**User asked directly whether this was the same root cause as two older bugs — verified rather than assumed:**
- **Combat tracker auto-closing (S66): unrelated.** Different mechanism entirely (a `createEffect` re-firing on unrelated reads, fixed by removing the auto-behavior). Today's minimize state is a plain signal rendered as a singleton, never inside a keyed list — structurally immune to this bug regardless.
- **Presence flicker (S60): related family, but already fixed at an earlier point in the pipeline.** Traced the exact call site: `mergeCampaign()`'s per-uid, timestamp-based presence merge fully resolves the correct value *before* `reconcile()` would ever wrap the result — `reconcile()` only changes how an already-decided value gets applied to the store, with no way to see or bypass that merge. Confirmed no regression path exists.

**Fix:** a new `stableStringify()` helper (`firebase.js`) sorts object keys recursively before comparing (arrays keep their order — they're ordered data, not reordered RTDB object keys), restoring the original S60 fix's intent. Added `reconcile()` at all three whole-campaign `setStore` call sites: `sync.js`'s live-sync listener (the main fix, since this runs repeatedly during play), `joinCampaign()`'s initial load, and `persist.js`'s `restoreSession()` (both lower-impact but consistent, since nothing's mounted yet at those points to lose identity from). Confirmed via the existing two-device mocked test suite (`tests/sync.test.js`, which directly exercises `joinCampaign` and a presence round-trip) that nothing regressed.

Files: `src/data/firebase.js`, `src/data/sync.js`, `src/data/persist.js`, `tests/foundations.test.js`. 4 new tests (`stableStringify`: object key-order independence, nested-object key-order independence, array-order preservation, genuine-difference detection survives reordering), 116/116 passing, build clean.

---

## Decisions Made
See `.claude/decisions.md` → "Broken echo detection + missing reconcile() — NPC info closing on open (S79)" for full detail, including the verdict table on the two connected-bug questions the user asked directly.

---

## Known Issues / Follow-ups
- **This touches the core sync path used by every session, solo and multiplayer — not live-verified.** Needs real confirmation: open an NPC card mid-play and confirm it survives a normal sync cycle without closing itself; if a second device is available, confirm presence still displays correctly on both sides.
- S78's contextual-DC feature also still needs its own real-device check (unrelated to this session's fix).
- Remaining scheduled priority: #8 Multiplayer bundles MVP (the only one left).
- All prior sessions' unverified items remain outstanding (see workboard.md's Known Issues section for the full running list).

---

## Next Up (per workboard Priorities, deadline July 11)
Priorities #1-5 and #7 closed. Only #8 (Multiplayer bundles MVP) remains scheduled. This session was entirely playtest-driven, following the sprint's established pattern.

---

## Branch State
`claude/workboard-sprint-deadline-ka8m7y` has this session's commits pending push as of writing. S78 is merged to `main` and deployed. S79 has not been merged — no "go live" given yet for this session's work.
