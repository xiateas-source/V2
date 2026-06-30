# Session Log — Handoff

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
