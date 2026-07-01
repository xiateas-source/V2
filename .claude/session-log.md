# Session Log — S77 (2026-07-01)

## Branch / Build
Branch: `claude/workboard-sprint-deadline-ka8m7y` · S76 (JSON import, equipment picker, AI Builder depth) merged to main and deployed earlier this conversation · S77 not yet merged · build clean, 107/107 tests passing

---

## What Shipped This Session

User sent a real playtest export and asked specifically to review the DM's "roll request types." Traced two distinct issues.

### Issue A (flagged, not fixed) — Animal Friendship's roll didn't match the spell

Casting Animal Friendship, the DM's mechanics block correctly described the spell ("Target must succeed on a DC 13 Wisdom saving throw or be charmed") but then requested an **Animal Handling** roll from the caster — the spell never asks the caster to roll anything; the target saves. Gate 6 (Spell Validation, `gates.js`) only checks known-spell/slot availability — nothing validates that a `roll_request` actually matches how the spell it's attached to resolves (attack roll / no-roll-target-saves / caster-check). Real gap, but separate, larger scope (would need a spell-resolution-type lookup table across the spell list). Not built — flagged for a future session.

### Issue B (fixed) — one classified roll silently governed a whole compound message

Player: "Ill set some traps to provide food for the wolves, then ill look around to see what else i can do to spruce up their home." The engine classified this as a single Perception check (DC 13, rolled 7, FAIL) — the DM then narrated **both** the trap-setting and the camp-decorating as failed from that one roll. The player's own follow-up question, answered by the game's built-in rules-advisory (`dm_advisory`), correctly explained a Perception check shouldn't govern either action — proof the game already knows the rule; the code path that ran the scene didn't apply it.

Cross-checked root cause against a second agent's independent handoff — verified its claims against source rather than trusting them at face value (matches this sprint's practice). It matched my own trace almost exactly, with one imprecision I corrected: it conflated this bug with the workboard's "classifier doesn't handle combat attacks or saving throws" Known Issue, which is a different, *intentional* boundary (combat/saves are deliberately routed to `RollBar.jsx`'s own attack flow, not a classifier miss).

Root cause: `classifier.js`'s `ACTION_PATTERNS` had zero pattern for "set/lay a trap or snare" — only "disarm trap" (the opposite action) existed. So "set some traps" was invisible to the classifier; only "look around" matched (→ Perception), and the DM treated the whole message as resolved by that one roll.

User pushed back hard on an early direction I floated (leaning on AI judgment as a backstop for whatever the classifier misses) — correctly pointing out that's exactly what V1 relied on and it didn't work, which is why the code-enforcement layer exists at all. Re-examined the "bigger structural fix" I'd proposed (splitting messages into clauses, then flagging any unmatched clause to the player) and concluded on reflection it doesn't actually hold up: `pattern.test()` already matches anywhere in a string, so multi-skill detection across clauses already works whenever a recognized verb is present — clause-splitting wouldn't have caught "set traps" either, since the real gap is a missing pattern, not a scoping problem in the matcher. And "flag any clause matching nothing" would be very noisy, since most of what players type (dialogue, description, flavor) correctly matches nothing and needs no roll.

**Actual fix, two parts:**
1. Added trap/snare-setting keywords to `classifier.js`'s Survival pattern. Direct, low-risk, root-cause fix — the classifier already dedupes and rolls once per matched skill, so this exact message now correctly produces two rolls (Survival + Perception) instead of one wrongly covering both.
2. Clarified the SCOPE of a classified/predetermined roll in two places: `src/ai/contracts.js`'s `MECHANICS_FORMAT` (a fixed block sent to every campaign unconditionally — fixed here reaches every campaign immediately, no migration needed) and `DEFAULT_CONTRACTS.never` (`state/campaign.js`, for new campaigns), plus a `STALE_CONTRACTS` migration entry in `persist.js` so existing campaigns whose `contracts.never` still holds the old text verbatim (never customized by the player) get it refreshed automatically on next load. `STALE_CONTRACTS` changed from one string per field to an array of superseded strings, since a field can now have more than one past default in its history.

This keeps outcomes exactly as code-enforced as before (Gate 1 still requires a real submitted roll before narration) — it removes an accidental *over-restriction* that was stopping the AI from using a roll_request capability it already reliably uses unprompted (it self-requested the Animal Handling roll with zero classifier involvement, proving the capability already works).

Files: `src/ai/classifier.js`, `src/ai/contracts.js`, `src/state/campaign.js`, `src/data/persist.js`, `tests/foundations.test.js`. 3 new tests (Survival/trap coverage, disarm-trap regression confirming no false-positive overlap with Sleight of Hand), 107/107 passing, build clean.

---

## Decisions Made
See `.claude/decisions.md` → "One roll silently governing a whole compound message (S77)" for full detail, including the rejected clause-splitting approach and why.

---

## Known Issues / Follow-ups
- **Not live-verified** — needs a real compound-action message in play ("set traps... then look around" or similar) to confirm both the Survival pattern match and that the AI actually respects the new scope wording (does it still narrate only the rolled clause, and does it now ask for a second roll for the other one, rather than silently treating the whole message as resolved).
- Issue A (Animal Friendship / spell roll-type mismatch) is flagged but not built — would need a spell-resolution-type lookup table (attack roll / target-saves / caster-check) checked by Gate 6. Separate, larger scope.
- All prior sessions' unverified items remain outstanding (see workboard.md's Known Issues section for the full running list).

---

## Next Up (per workboard Priorities, deadline July 11)
Priorities #1, #2, #3, #5, #7 closed. Remaining: #4 AI DC determination, #8 Multiplayer bundles MVP. This session was entirely playtest-driven, continuing the pattern this sprint — a real transcript surfaced a genuine rules-enforcement gap, cross-checked against a second agent's independent analysis before acting on it.

---

## Branch State
`claude/workboard-sprint-deadline-ka8m7y` has this session's commits pending push as of writing. S76 was merged to `main` and deployed earlier this conversation. S77 has not been merged — no "go live" given yet for this session's work.
