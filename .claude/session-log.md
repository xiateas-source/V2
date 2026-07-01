# Session Log — S75 (2026-07-01)

## Branch / Build
Branch: `claude/workboard-sprint-deadline-ka8m7y` · S74 merged to main this session ("go live" confirmed, deploy verified green via GitHub Actions) · S75 not yet merged · build clean, 88/88 tests passing

---

## What Shipped This Session

### CharSheet swipe shows stale PC data

A follow-up export from the same playtest session flagged, via testerNotes: "Thorns hp on his character sheet, under vitals show 31/31 if i swipe from ivy." Ivy's real HP is 31/31; Thorn's is 23/27 — after swiping from Ivy's sheet to Thorn's (the touch-swipe gesture that switches which PC `CharSheet.jsx` displays) while staying on the Vitals tab, the numbers stayed frozen at Ivy's.

Traced the root cause: all six tab-render functions (`StatsTab`, `VitalsTab`, `SpellsTab`, `FeaturesTab`, `EquipmentTab`, `BioTab`) capture `const p = pc();` once at the top and read `p.hp`/`p.ac`/etc. throughout their JSX. Each is wrapped in an *unkeyed* `<Show when={activeTab() === 'X'}>`, which only re-invokes its children on a false→true boolean transition — not when `activePC()` changes while the tab itself stays selected. So the currently-displayed tab keeps showing whichever PC was active when it first mounted, until the player also changes tabs. This affects all six tabs identically — the user just happened to notice it on Vitals, since that's what they check most.

Fixed by wrapping the tab-content block in an outer *keyed* `<Show when={pc()} keyed>` (`CharSheet.jsx` ~line 1223). Keyed mode compares by reference identity rather than truthiness, so any time `pc()` resolves to a *different* character proxy (i.e., an actual swipe happened), the whole block tears down and remounts, re-invoking whichever tab is currently active with a fresh read. Keyed on the `pc()` object rather than the raw `activePC()` index specifically because index 0 is falsy and would silently break rendering for the first PC. Ordinary in-place HP/stat mutations don't change the proxy's identity, so this doesn't cause spurious remounts during normal play — only on genuine swipes. This required touching only that one block; none of the six Tab functions themselves needed changes.

Had a Plan agent pressure-test the design before implementing (same rigor pattern as S74, though this is a much smaller/lower-stakes fix) — confirmed the Show/keyed semantics are correct, confirmed none of CharSheet's other local state (`expandedSpells`, `showOverride`, `hpDelta`, etc. — all declared in the outer `CharSheet(props)` scope) gets incorrectly wiped by the remount, and flagged one accepted side effect: an in-progress unsaved edit on a Bio field (trait/ideal/bond/flaw/backstory) is discarded if you swipe to a different PC before saving. That's correct, intended behavior, not a regression — you shouldn't keep editing Ivy's backstory while looking at Thorn's sheet.

File: `src/ui/reference/CharSheet.jsx`. No new tests (Solid JSX/reactivity fix, no new testable pure logic; this suite has no component/DOM testing infrastructure, same as every other UI-only fix this sprint). 88/88 tests passing, build clean.

### Also answered this session (no code change)
The user asked what the testing tab's "Mid-Combat Turn" scenario button actually does — explained in plain language that it skips initiative and drops you into a fake combat with your first PC's turn already active, specifically to test the Action Economy fix (S67): tapping a second Action-type quick-action button in the same turn should be disabled. Unrelated to the S74 turn-desync fix, which the user was also asking about in the same breath — clarified those are two different mechanics.

---

## Decisions Made
See `.claude/decisions.md` → "CharSheet swipe shows stale PC data (S75)" for the full root-cause trace and the Plan-agent review notes.

---

## Known Issues / Follow-ups
- S75's fix needs a real phone check: open a PC's sheet, swipe to a different PC while staying on each of the six tabs in turn, confirm the displayed data updates immediately without needing to also switch tabs.
- S74's combat-turn-loop fix (merged to main and deployed this session) is still the highest-stakes unverified item this sprint — needs a real multi-round combat encounter with at least one attack roll to confirm the turn indicator advances exactly once per turn and a missed attack doesn't leave stale pre-resolved damage.
- The user is continuing to send real playtest exports mid-session rather than in discrete batches — this session picked up a second bug from an export sent minutes after the S74 deploy was confirmed live. Worth continuing to treat each export as its own potential work item rather than assuming one export = one session's findings.

---

## Next Up (per workboard Priorities, deadline July 11)
Priority #1 (SRD gap-analysis) closed as of S69. Remaining: #4 AI DC determination (deliberately last, complex), #5 Scene transition gate, #8 Multiplayer bundles MVP. Playtest-driven fixes remain the dominant source of work this sprint.

---

## Branch State
`claude/workboard-sprint-deadline-ka8m7y` has this session's S75 commits (pending push as of writing). S74 was merged to `main` this session and confirmed deployed (GitHub Actions "Deploy to Firebase Hosting" run completed successfully for commit `b69b9ce`). S75 has not been merged — no "go live" given yet for this specific fix.
