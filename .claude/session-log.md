# Session Log — Handoff

## Session 52 · 2026-06-30

Branch `claude/tabletop-gameplay-ux-czwyfb` · committed, not yet pushed to main.

### What Shipped

A background gap-analysis agent diffed the codebase against the uploaded SRD 2024 `rulesglossary.md`/`playingthegame.md` docs and returned a 10-item punch list. User picked the top two to ship this session: switch encumbrance to 2024 SRD rules, then fix conditions + resistance enforcement.

1. **Encumbrance switched to 2024 SRD (single STR×15 hard cap, no tiers)** — the app had the wrong 2014 two-tier model (Encumbered at ×5, Heavily Encumbered at ×10) duplicated in 4 places: `contracts.js` (AI instructions), `RollBar.jsx` (roll penalties), `Cargo.jsx` (the bottom-nav tab players actually see), and `CharSheet.jsx`'s Equipment tab. All 4 now agree: STR×15 lb is a hard cap, nothing more. Also simplified `prompt.js`'s per-PC carry-weight ledger line to match. Removed the now-dead `isHeavilyEncumbered`/`applyEncumbrance` functions from `RollBar.jsx` and the now-unreachable `.encumbered`/`.heavy`/`.cs-enc-mark` CSS rules.
2. **Exhaustion switched to 2024 SRD (flat −2/level, not disadvantage)** — `RollBar.jsx` had a 2014-rules implementation explicitly marked `// (2014 rules)` in its own code comment. Now every level of Exhaustion applies a flat −2 penalty to every d20 Test (not disadvantage) plus −5ft speed/level (no enforcement needed, no movement system exists); a Long Rest removes 1 level. Added an EXHAUSTION section to `contracts.js` (didn't exist before) and rewrote `CharSheet.jsx`'s exhaustion tooltip, which was fully 2014-rules wrong.
3. **All 15 conditions now have real roll-time effects** — previously only Poisoned/Frightened/Restrained/Prone had any effect on rolls, and Poisoned/Frightened were over-broadly applying disadvantage to saving throws too (RAW excludes saves for those two). Rewrote `RollBar.jsx`'s condition-effects logic from scratch against the exact RAW text (read directly from the glossary for all 15 conditions): Blinded/Prone → disadvantage on own attacks; Invisible → advantage on own attacks; Restrained → disadvantage on attacks + Dex saves specifically; Poisoned/Frightened → disadvantage on checks+attacks only, not saves; any Incapacitating condition → disadvantage on Initiative. Built a new `isSavingThrow(skill)` heuristic (bare ability name = save, named skill or "Initiative" = check) to make the check-vs-save distinction possible without changing the `roll_request` mechanic format — this was a documented gap since S51.
4. **Auto-fail for Paralyzed/Stunned/Unconscious/Petrified** — these now force automatic failure on Str/Dex saves (not just disadvantage), closing the S51-documented gap. Implemented by forcing `total = -1` in the roll data so the existing `total >= dc` success/failure check resolves correctly with no plumbing changes; added `AUTO-FAIL` badges reusing existing CSS, and an "Acknowledge" button state instead of a roll button.
5. **Found and fixed a real three-phase-loop bug while wiring auto-fail through** — the pre-send roll path (`engine.js`'s `resumeAfterRolls`, used when the classifier intercepts a message before sending) built its outcome text from raw `total`/`d20`/`mod` numbers. An auto-fail roll (faked as `total:-1, d20:0, mod:0`) would've shown garbled text like "rolled -1 (d20: 0 +0)" to both the AI and the player's own visible chat bubble, instead of "automatically fails (Paralyzed)". The other roll path already worded this correctly — only the pre-send path was broken. Fixed by threading `autoFailReason` through and special-casing it in both of `engine.js`'s text builders.
6. **Resistance/vulnerability/immunity now enforced in code, not AI-narrated** — the `hp` mechanic only ever carried an absolute new HP total, with no damage-type signal anywhere for code to apply a multiplier to; the AI was fully trusted to do the resistance math itself before reporting the final number (the same "told, not enforced" pattern that caused the original encumbrance bug). Added a new `damage: PCname,amount,DamageType` mechanic — the AI now reports raw, un-modified damage + its type, and `mechanics.js` looks up the PC's resistances/vulnerabilities/immunities and computes the final HP itself (resistance ×0.5, vulnerability ×2, immunity ×0). `hp:` is kept as-is for healing and enemy/NPC damage. Refactored the shared temp-HP-absorption/concentration-check/combat-sync logic out of `DISPATCH.hp` into `applyDamage()` so both mechanics use the same path.
7. **6 new unit tests** covering the new `damage` mechanic (plain damage, resistance halving, vulnerability doubling, immunity zeroing, case-insensitive type matching, temp-HP absorption) — 39/39 passing, plus a clean production build.

### Decisions

See `decisions.md` → "Rules Enforcement (S52)" for the full list, including why Charmed/Deafened/part of Grappled were deliberately left cosmetic-only (no data exists to enforce them correctly — documented rather than guessed at).

### Known Issues

- Remaining items from the same gap-analysis punch list, not yet started: Critical Hits told-not-enforced, Action Economy heuristic-only, Cover missing entirely, Death Saves partial (no auto-fail on damage at 0 HP, no massive-damage instant death), Short Rest missing Hit Dice healing surfacing, Concentration missing the 30 DC cap.
- CharSheet's manual HP override still bypasses the mechanics pipeline entirely (no temp-HP absorption, no concentration check) — flagged by the gap analysis, not addressed this session.
- Charmed, Deafened, and part of Grappled remain cosmetic-only — see decisions.md for why.
- `npm install` had not been run in this environment before this session (no `node_modules`); now installed.

### Next Up

1. Work through the remaining gap-analysis punch list items above, roughly in the order listed (Death Saves and Critical Hits are probably the highest-value next two — both are core combat moments).
2. Consider fixing CharSheet's manual HP override to route through `applyDamage()`/the mechanics pipeline instead of writing HP directly, now that that logic is factored out and reusable.
3. Carried-over priorities from S50/S51 (audit unguarded nested-field accesses, classifier coverage expansion, AI DC determination, scene transition gate, rest buttons, CI database rules deploy) — still open, deadline July 11.

---

## Session 51 · 2026-06-30

Branch `main` @ `1936091` · pushed, auto-deploying.

### What Shipped

1. **Fixed stale DM contract** — `DEFAULT_CONTRACTS.never` in `src/state/campaign.js` still told the AI to "auto-resolve a roll" generically and wait, predating the S48 three-phase classifier system (skill checks now arrive pre-resolved as a `[ROLLS: ...]` block; only combat still uses the old roll-and-wait flow). Rewrote it to describe both flows correctly. Added a one-time migration in `persist.js` (`STALE_CONTRACTS`) that refreshes any existing campaign's `contracts.never` if it still holds the old text verbatim, without touching player-customized text. Confirmed via 3 separate exported saves (including the user's own and Christian Birdsong's) that all had the identical stale text — this was a shared-default bug, not a per-campaign drift.
2. **Drift detector: enemy/PC defeat narrated without an `hp` mechanic** — found via a real bug transcript (Vesper's Adventure test campaign): the AI narrated an enemy's defeat ("collapses," "falls still," etc.) with no matching `hp` mechanic, and the existing `HP_NARRATION` regex only catches numeric damage phrasing ("takes 12 damage"), so it missed it. Added a new check to `src/ai/drift.js` using the same bounded-name-lookup pattern as the existing `unmentioned_pc` check (scan the vicinity of a known PC/enemy name above 0 HP for defeat language) rather than a generic prose regex — verified against the real transcript and two negative cases (matching hp mechanic present; already-dead combatant re-mentioned in flavor text) before committing.
3. **Encumbrance and condition rules are now actually enforced, not just narrated** — user reported "the encumbered status not being enforced" on Christian Birdsong's save. Investigation: `genLedger()` in `prompt.js` already computed and injected per-PC carry weight + encumbrance tier into the AI's prompt every turn, and `contracts.js` already told the AI the thresholds — but nothing besides the AI's own narration ever applied the penalty. Birdsong (STR 8, 46.7 lb carried) crosses the Encumbered threshold (40 lb) with zero in-app effect. Same gap existed for tracked conditions (`pc.conditions` — Poisoned, Frightened, Restrained, Prone, etc.) — written by mechanics, never read back by roll resolution. Fixed both by extending the existing exhaustion-disadvantage path in `RollBar.jsx` (same `advState` mechanism, advantage/disadvantage cancel the same way):
   - Heavily Encumbered → disadvantage on STR/DEX/CON checks, saves, and Initiative
   - Poisoned/Frightened → disadvantage on all the PC's own d20 rolls
   - Restrained → disadvantage on attacks and Dex-keyed rolls
   - Prone → disadvantage on the PC's own attack rolls
   Also brought Cargo's weight bar (the actual bottom-nav tab players see) up to the same 3-tier encumbrance display CharSheet's Equipment tab already had.
4. **Branch hygiene** — merged the S48-era `claude/lore-bard-bonus-spells-q4sa51` branch into main twice this session (it kept accumulating new fixes); identified 6 merged-but-undeleted branches for the user to clean up manually in the GitHub UI (no branch-deletion tool available via the GitHub MCP server or git push — got HTTP 403). Recommended enabling "Automatically delete head branches" in repo settings.

### Decisions

See `decisions.md` → "Rules Enforcement (S51)" for the four decisions made this session (bounded-name drift checks, where rule penalties get enforced, why auto-fail is deferred, why check-vs-save isn't distinguished).

### Known Issues

- Paralyzed/Stunned/Unconscious/Petrified don't auto-fail Str/Dex saves yet — that needs a forced-failure path through roll resolution (`effectiveD20`/`total`/`submitAll`/`submitInitiative`), bigger than the disadvantage-only fixes shipped this session. Those conditions also make the PC Incapacitated (can't act), so they rarely reach a roll in practice, but it's a real gap.
- `roll_request`'s `skill` field doesn't distinguish ability check vs. saving throw — condition effects that RAW differ between the two are applied blanket.
- No full gap-analysis has been done yet against the uploaded SRD Rules Glossary (`rulesglossary.md`, ~150 entries: damage types, rests, death saves, AoE shapes, object AC/HP, etc.) beyond the encumbrance/conditions slice fixed this session.
- 6 merged branches still undeleted on GitHub (`claude/app-styling-tabs-c1khdr`, `claude/character-creation-phase-4-r94wpq`, `claude/character-sheet-familiar-tab-2u3wsw`, `claude/documentation-refactor-n5z5h2`, `claude/multiplayer`, `claude/new-session-yp5z21`) — user needs to delete manually, no tool access to do it from here.
- Carried over from S50: `database.rules.json` can drift from live Firebase Console rules (no automated deploy step yet); classifier DCs still fixed tiers; classifier still skips combat.

### Next Up

User is starting a fresh session specifically to continue implementing rules from the uploaded Rules Glossary. Suggested entry points, in order of how directly they extend this session's work:

1. **Auto-fail Str/Dex saves** for Paralyzed/Stunned/Unconscious/Petrified — the natural next step in `RollBar.jsx`, same file just touched.
2. **Full gap analysis against the glossary** — read `rulesglossary.md` against `mechanics.js`/`gates.js`/`drift.js` to produce a prioritized list of what's missing before picking the next implementation batch, rather than guessing at scope again.
3. Carried-over priorities from S50 (audit unguarded nested-field accesses, classifier coverage expansion, AI DC determination, scene transition gate) — still open, deadline July 11.
