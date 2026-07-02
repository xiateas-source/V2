# AI Failure Record — Law 2 Audit Trail

*Every entry is a documented AI failure. Each needs a code constraint or contract clause. When a failure gets a code fix, mark ✅ and the contract clause can be removed. Append-only — this list grows as long as we play.*

---

## Mechanical Failures (code-enforceable)

- **HP without mechanics** — AI adjusted HP in narration without `hp:` mechanic. Fix: reject HP changes without mechanic.
- **Skipped concentration saves** — damage to concentrating caster, no save requested. Fix: auto-trigger on damage.
- **Resolved without rolls** — actions requiring checks resolved without requesting a roll. ✅ built: Gate 1 (Roll Confirmation, `runGate1` in gates.js) scans narrative for fabricated results not backed by a submitted roll.
- **Narrated state without mechanics** — gold, items, NPCs, conditions narrated but not emitted. Fix: drift detectors.
- **Action economy violation** — spell + bonus action + help in one turn. ✅ built (S67): `combatState.actionsUsed` tracked per turn; quick-action buttons in `TurnPrompt.jsx` disable once a slot is spent, `runGate2` (Combat Turn Enforcement) flags narrative violations.
- **Entity duplication** — new NPC entries for existing characters. ✅ partial (S46): fuzzy dedup built.
- **HP/stat fabrication** — AI set level, hp_max, class via mechanics. ✅ built: field ownership enforcement.
- **Combined/skipped turns** — multiple players' turns in one response. ✅ partial (S37): turn pointer is code-owned; AI stopping at each PC still prompt-enforced.
- **Skill check skipping** — gave results without requiring checks. ✅ partial: `classifier.js`'s keyword patterns pre-empt a roll before the AI sees the message; `runGate7`/`runGate8` flag narrative that resolves an action without one. **Still a known, live gap (S77):** the classifier's action-verb list is finite — a stated action with no matching pattern (e.g. "set a trap" before S77 added it) is invisible to the whole system, and there's no cross-check confirming every distinct stated action in a message got its own roll.
- **Consequence timer ignored** — forgot time-sensitive events. Fix: inject into prompt, engine flags expiring timers.
- **Prose dice rolling** — AI rolled dice in narration text. Fix: detect and reject AI-generated rolls.
- **Selective roll requesting** — requests one roll, auto-resolves 2-3 others. ✅ built: Gate 1 catches fabricated resolutions; `engine.js`'s `sendNarrative()` (`hasPendingRoll`, S74) holds the turn open until the actual roll for the current actor comes back, so a request can't be quietly skipped past.
- **PC autopiloting** — AI fills in actions for unmentioned PCs. Fix: flag unmentioned PC actions.
- **Spell slot tracking absent** — unlimited spell use, no accounting. Fix: spell use as mechanics, slot deduction enforced.
- **Spell list not verified** — characters use spells they don't know. Fix: validate against known spells.
- **XP omission** — forgot to award XP across entire arcs. Fix: drift detector after encounter resolution.
- **Scene transition without confirmation** — switches scenes without confirming player is done. ✅ built (S75): location/time/chapter changes hold in `pendingLocation`/`pendingTime`/`pendingChapter` until the player taps Go/Stay on `ContextBanner.jsx`'s widened confirm banner (`confirmTransition`/`rejectTransition` in `mechanics.js`).
- **Unconfirmed rolls** — resolves rolls without player submission. ✅ built: Gate 1 plus `validateMechanics()`'s batch rule (S74) rejecting an `hp:`/`damage:` mechanic for the exact target of a same-batch `roll_request` — an outcome can't be written before the roll it depends on actually resolves.
- **System operations through AI chat** — "reset HP" narrated but no mechanics emitted. Fix: dedicated system action UI.
- **No level-up wizard re-entry** — missed choices can't be fixed. ✅ built (S40): re-entry path.

## Information Failures (code-enforceable)

- **Generic addressing** — "you" instead of character names. Fix: per-character awareness in prompt.
- **Hidden enemy resolution** — revealed hidden enemies without perception checks. Fix: information gating.
- **Dungeon secret leaks** — revealed module content before discovery. Fix: `discovered` flag on content.
- **Fabricated content** — invented NPCs/locations not in source material. Fix: source verification.
- **App issues treated as rules questions** — "can't modify expertise" → PHB citations instead of UI fix. ✅ built: Ask DM interception layer.

## Narrative Failures (contract-only)

- **Forgot established personality** — NPC behavior changed without reason
- **Repeated descriptions** — same description given again
- **Inconsistent information** — told different things about same situation
- **Misread own ledger** — stated wrong HP/gold despite correct values in prompt
- **Item continuity error** — contradicted own narration about item location

## V2 Failures (discovered in v2 testing)

- **Roll requested FOR an enemy** — `roll_request` targeting NPC. ✅ fixed (S37): validation rejects non-PC targets.
- **Enemy HP never moved** — narrated damage without `hp:` mechanic. ✅ partial (S37): contract requires mechanic; Gate 3 flags drift.
- **Turn overlap** — turns blurred together from split turn ownership. See combined/skipped turns above.
- **Roll_request type doesn't match the spell's actual mechanic** (S77) — casting Animal Friendship, the DM's own mechanics block correctly said the target makes a WIS save, then requested an **Animal Handling** roll from the caster instead — a check the spell never actually calls for. Gate 4 (Spell Validation, `runGate6`) only checks the spell is known and has slots; nothing validates that a `roll_request`'s type matches how the cast spell resolves. **Not fixed** — flagged for a future session (needs a spell-resolution-type lookup table: attack roll / target-saves / caster-check).
- **Roll-result message re-classified into a second roll** (S81 audit, not yet observed in play) — when the AI self-requests a roll *out of combat* (the S77 Animal Friendship shape), the submitted result text ("Thorn rolled 15 for Stealth" + the player's optional note) is sent back through `classifyAction()`, whose verb patterns can match it and demand a fresh roll before the first result ever reaches the DM. In-combat rolls are shielded only by the classifier's combat guard. Enforcement-layer self-interference, same family as the S77 gap below. **Not fixed** — one-word fix (`skipClassifier: true` in `RollBar.jsx`'s submitAll), workboard Priority 1 (audit #7). Inversion stage 1 (replacing the regex classifier) retires the whole class.
- **One classified roll silently governing a whole compound message** (S77) — "set some traps, then look around" classified as one Perception check; the DM narrated both actions as failed from that single roll, though trap-setting was never itself rolled for. Confirmed as a real bug by the game's own `dm_advisory` OOC assistant, which correctly explained the rule when asked — proving it was known elsewhere in the system but not applied by the code path that ran the scene. ✅ fixed (S77): added the missing Survival pattern for trap/snare-setting (`classifier.js`), and clarified in `contracts.js`'s `MECHANICS_FORMAT` + `DEFAULT_CONTRACTS.never` (with a `STALE_CONTRACTS` migration reaching existing campaigns) that a classified roll covers only the specific action it was rolled for.
