# AI Failure Record — Law 2 Audit Trail

*Every entry is a documented AI failure. Each needs a code constraint or contract clause. When a failure gets a code fix, mark ✅ and the contract clause can be removed. Append-only — this list grows as long as we play.*

---

## Mechanical Failures (code-enforceable)

- **HP without mechanics** — AI adjusted HP in narration without `hp:` mechanic. Fix: reject HP changes without mechanic.
- **Skipped concentration saves** — damage to concentrating caster, no save requested. Fix: auto-trigger on damage.
- **Resolved without rolls** — actions requiring checks resolved without requesting a roll. Fix: roll confirmation gate.
- **Narrated state without mechanics** — gold, items, NPCs, conditions narrated but not emitted. Fix: drift detectors.
- **Action economy violation** — spell + bonus action + help in one turn. Fix: action tracking per turn.
- **Entity duplication** — new NPC entries for existing characters. ✅ partial (S46): fuzzy dedup built.
- **HP/stat fabrication** — AI set level, hp_max, class via mechanics. ✅ built: field ownership enforcement.
- **Combined/skipped turns** — multiple players' turns in one response. ✅ partial (S37): turn pointer is code-owned; AI stopping at each PC still prompt-enforced.
- **Skill check skipping** — gave results without requiring checks. Fix: action-type → required-check mapping.
- **Consequence timer ignored** — forgot time-sensitive events. Fix: inject into prompt, engine flags expiring timers.
- **Prose dice rolling** — AI rolled dice in narration text. Fix: detect and reject AI-generated rolls.
- **Selective roll requesting** — requests one roll, auto-resolves 2-3 others. Fix: one roll per character per action.
- **PC autopiloting** — AI fills in actions for unmentioned PCs. Fix: flag unmentioned PC actions.
- **Spell slot tracking absent** — unlimited spell use, no accounting. Fix: spell use as mechanics, slot deduction enforced.
- **Spell list not verified** — characters use spells they don't know. Fix: validate against known spells.
- **XP omission** — forgot to award XP across entire arcs. Fix: drift detector after encounter resolution.
- **Scene transition without confirmation** — switches scenes without confirming player is done. Fix: detect and gate scene changes.
- **Unconfirmed rolls** — resolves rolls without player submission. Fix: reject mechanics depending on unsubmitted rolls.
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
