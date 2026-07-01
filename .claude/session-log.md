# Session Log — S75 (2026-07-01)

## Branch / Build
Branch: `claude/workboard-sprint-deadline-ka8m7y` · S74 and the first S75 fix both merged to main and deployed this session (confirmed via GitHub Actions) · Scene Transition gate (second S75 piece) not yet merged · build clean, 94/94 tests passing

---

## What Shipped This Session

### 1. CharSheet swipe shows stale PC data

A follow-up export from the same playtest session flagged, via testerNotes: "Thorns hp on his character sheet, under vitals show 31/31 if i swipe from ivy." Ivy's real HP is 31/31; Thorn's is 23/27 — after swiping from Ivy's sheet to Thorn's while staying on the Vitals tab, the numbers stayed frozen at Ivy's.

Root cause: all six tab-render functions (`StatsTab`, `VitalsTab`, `SpellsTab`, `FeaturesTab`, `EquipmentTab`, `BioTab`) capture `const p = pc();` once at mount and read `p.hp`/`p.ac`/etc. throughout their JSX. Each is wrapped in an *unkeyed* `<Show when={activeTab() === 'X'}>`, which only re-invokes its children on a false→true boolean transition — not when `activePC()` changes while the tab stays selected. Affects all six tabs identically.

Fixed by wrapping the tab-content block in an outer *keyed* `<Show when={pc()} keyed>` (`CharSheet.jsx` ~line 1223) — keyed mode compares by reference identity, so any time `pc()` resolves to a different character proxy, the block remounts and re-reads. Ordinary in-place HP mutations don't change the proxy's identity, so no spurious remounts during normal play. Required touching only that one block. Design pressure-tested by a Plan agent (confirmed Show/keyed semantics, confirmed no other component state gets wiped, flagged one accepted side effect — an in-progress unsaved Bio-field edit is discarded on swipe, which is correct behavior).

File: `src/ui/reference/CharSheet.jsx`. No new tests (Solid JSX/reactivity fix). Merged to `main` and deployed — confirmed via GitHub Actions ("Deploy to Firebase Hosting" green for commit `be46f7f`).

### 2. Scene Transition gate (workboard Priority #5)

User picked this off the remaining priority list (AI DC determination / Scene transition gate / Multiplayer bundles MVP — asked via AskUserQuestion, user chose Scene transition as the smaller, more contained option).

Per `enforcement-spec.md`'s "Gate 2: Scene Transition," location changes, time jumps, and new chapters should hold for player confirmation instead of applying immediately (the failure mode being multi-step scenes — travel montages, escape sequences — compressed into one AI response with no player input in between).

Had a Plan agent research the existing code before designing anything new, then verified its key claim myself before trusting it: **location-change holding was already built and live** — `mechanics.js`'s `location(value)` dispatch already diffs against current state and stashes into `store.campaign.pendingLocation` instead of applying when it differs, and `ContextBanner.jsx` already has a working "Move to X? Go/Stay" banner wired to `confirmLocation()`/`rejectLocation()`. This has apparently worked all sprint without ever being connected to the gate/priority list. The actual gap: `time` and `chapter_add` applied instantly with zero hold, and the old `runGate4` only produced an inert, passive text pill *after* the state had already changed — not a real gate.

Presented the design to the user (via AskUserQuestion, since it adds two new campaign-store fields — a state schema change per CLAUDE.md's standing confirmation rule) and got approval to proceed:
- Extended the same hold pattern to `time` (`pendingTime`) and `chapter_add` (`pendingChapter`) — two new fields in `DEFAULT_CAMPAIGN` (`src/state/campaign.js`), healed automatically into existing saves via the existing `healStructure()`/`healArrays()` machinery.
- Added `confirmTransition()`/`rejectTransition()` to `mechanics.js`, committing or discarding whichever of the three are pending (a transition can bundle any subset).
- Widened `ContextBanner.jsx`'s existing Go/Stay banner into one combined prompt ("Move to X and advance time to Y?") instead of building a second, separate confirm UI — chose this over a new `Chat.jsx` pill specifically because the user's approved option was to unify into the existing banner, not duplicate.
- Rewrote `runGate4` (`gates.js`) as the sole "player already stated it" check from the spec's edge case: if the player's own message already named the pending location (substring match), commit immediately and silently — no prompt shown for a transition they already asked for. Only location is checked this way; time/chapter text is narrative, not something a player types verbatim.
- Deliberately did not build: real time-delta parsing (spec wants ">30 minutes," but `time` is freeform prose with no structured duration — used "any change" as the heuristic instead, confirmed safe since `time:` is only emitted in the mechanics block on genuine transitions, not restated every message) or narrative prose-scanning for transition markers ("hours later," travel montages) — mechanics-block diffing is deterministic and sufficient; regex-scanning phrasing is the fuzzy-NLP class Law 5 warns against.

Added a "Scene Transition" scenario button to the testing tab (`MechTest.jsx`), following the S72 convention, so the user can test the widened banner without needing a real AI-narrated transition.

Files: `src/ai/mechanics.js`, `src/ai/gates.js`, `src/ai/engine.js` (pass `text` into `runGate4`), `src/state/campaign.js`, `src/ui/play/ContextBanner.jsx`, `src/ui/manage/MechTest.jsx`. 10 new tests (94/94 passing total), build clean.

---

## Decisions Made
See `.claude/decisions.md` → "CharSheet swipe shows stale PC data (S75)" and "Scene Transition gate built (S75) — Priority #5" for full detail on both.

---

## Known Issues / Follow-ups
- Scene Transition gate is **not live-verified** — needs a real phone check: trigger a location/time/chapter change (or the new "Scene Transition" Scenario button), confirm the banner shows the combined prompt, Go commits everything pending / Stay discards it, and a player-stated move ("we head to the Keep") skips the banner and applies immediately.
- S74's combat-turn-loop fix remains the highest-stakes unverified item this sprint (deployed, but needs a real multi-round combat encounter to confirm live).
- S75's CharSheet swipe fix also needs a phone check across all six tabs.
- Remaining scheduled priorities: #4 AI DC determination, #8 Multiplayer bundles MVP.

---

## Next Up (per workboard Priorities, deadline July 11)
Priorities #1, #2, #3, #5, #7 are now closed. Remaining: #4 AI DC determination (deliberately last, most complex — needs an extra AI call), #8 Multiplayer bundles MVP (larger, multiplayer-focused). Playtest-driven fixes remain a steady parallel stream alongside whichever of these gets picked up next.

---

## Branch State
`claude/workboard-sprint-deadline-ka8m7y` has the Scene Transition gate work pending push as of writing. The CharSheet swipe fix (first S75 piece) was merged to `main` and deployed earlier this session. Scene Transition gate has not been merged — no "go live" given yet for this specific piece.
