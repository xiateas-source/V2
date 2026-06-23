# AI Failure Record — Development Reference

*Not a game contract. This is for the development AI and developer — the audit trail for Law 2.*

Every entry is a documented AI failure from v1 gameplay. Each one either needs a code constraint (Law 2: container enforcement) or a contract clause (soft enforcement for what code can't handle). When a failure gets a code fix, the corresponding contract clause can be removed.

---

## Mechanical Failures (code-enforceable)

- **HP without mechanics** — AI adjusted HP in narration without emitting `hp:` mechanic line. Needs: response validation rejects HP changes without mechanic.
- **Skipped concentration saves** — AI dealt damage to a concentrating caster and didn't request a save. Needs: automatic concentration check trigger on any damage to a concentrating PC.
- **Resolved without rolls** — AI resolved actions that require skill checks without requesting a roll. Needs: structural roll gating — certain action types must have a roll_request before resolution.
- **Narrated state without mechanics** — AI narrated gold found, items looted, NPCs met, conditions applied without emitting mechanic lines. State didn't update. Needs: response structure validation — narrated state changes without mechanics flagged or rejected.
- **Action economy violation** — AI let a caster cast a spell, use a bonus action feature, AND help another PC all in one turn. Needs: action economy enforcement — track actions used per turn.
- **Entity duplication** — AI created new NPC entries for characters that already exist in the tracker. Needs: entity dedup — fuzzy match against existing NPCs before creating new ones.
- **HP/stat fabrication** — AI set level, hp_max, class features, or spells via mechanics (should be wizard-only). Needs: field ownership enforcement — system-owned fields reject AI writes.
- **Combined/skipped turns** — AI combined multiple players' turns into one response, skipped players, or advanced the story while players were still deliberating. Needs: enforced turn order in combat — AI waits for all players in initiative order before advancing. **✅ partial (S37):** turn ORDER is now code-owned — the engine (`advanceCombatToNextPC`) holds the pointer and lands it on each living PC; AI only narrates the turn it's handed. The AI *stopping* at each PC is still prompt-enforced (combat block + contract) with Gate 2 flagging over-runs. Promote to full ✅ if a hard truncation gate is added.
- **Skill check skipping** — AI gave players what they wanted without requiring a skill check. Needs: roll requirement enforcement for action types that demand checks.
- **Consequence timer ignored** — AI forgot to enforce time-sensitive consequences (sleep wearing off, enemies tracking party, environmental countdowns). Players also forgot because consequences were buried behind quests. Needs: active consequences injected into prompt with timers, engine flags expiring timers for resolution before AI moves on, situation bar shows consequences with priority placement.
- **Prose dice rolling** — AI rolled dice in narration text ("the goblin rolls a 15 to hit") instead of using the mechanics system. Needs: detection when AI makes rolls in prose, should go through roll mechanics not narration.
- **Selective roll requesting** — AI requests one "dramatic" roll from the player, then auto-resolves 2-3 other characters' rolls in the same response. Example: player rolls Slasher's Stealth (fail), AI auto-rolls Aria's Stealth (18) and Valenns's Stealth (14). Needs: engine enforces one roll request per character per action — all must come from players.
- **PC autopiloting** — When one player controls multiple PCs, AI fills in actions for characters the player didn't mention. Example: player specifies Valenns + Slasher actions, AI narrates Aria "standing guard." Needs: contract clause — never resolve a PC's action unless the player stated it.
- **Spell slot tracking absent** — AI allows unlimited cantrip/spell use with no slot accounting. Multiple spells per scene, no "you have X slots remaining." Needs: spell use emitted as mechanics, slot deduction enforced.
- **Spell list not verified** — AI lets characters use spells they may not know. Example: Slasher (Eldritch Knight, 2 cantrips) casting Mend without verifying it's in his cantrip list. Needs: spell validation against character's known spells.
- **XP omission** — AI forgets to award XP during long narrative arcs. Entire multi-encounter sequences (ambush + infiltration + sabotage + boss capture) produce zero XP. Needs: drift detector — after encounter/quest resolution, check if XP was emitted.
- **Scene transition without player confirmation** — AI switches scenes, advances time, or moves locations without confirming the player is done with the current scene. Example: player loots a room, AI narrates the exit and transitions to next location without asking "are you done here?" Needs: engine detects scene/location/time changes in AI response and requires player confirmation before applying. Promoted from narrative-only — this is code-enforceable.
- **Unconfirmed rolls** — AI resolves ANY roll (skill check, attack, save, initiative) without the player submitting it. Every roll that affects game state must come from the player via the roll UI, never from AI prose. Needs: engine rejects any mechanic that depends on a roll result the player didn't submit.

- **System operations routed through AI chat** — Player asks "Reset everyone's HP" in OOC/Rules. AI narrates "all PCs restored to maximum hit points" but may not emit mechanics — nothing actually changes in state. HP reset, stat corrections, and slot refills are system operations that need dedicated UI, not AI narration. Needs: system actions accessible from character sheet or manage mode (one-tap HP reset, rest operations, stat corrections).
- **No re-entry to level-up wizard** — Player can't modify expertise after Bard 3 level-up because the wizard choice was missed or skipped. Once a level-up choice passes, there's no way to fix system-owned fields. Needs: re-entry path for level-up wizard (edit mode or "redo level N choices") and manual override for system-owned fields in manage mode.

## Information Failures (code-enforceable)

- **Generic addressing** — AI said "you" as a catch-all instead of addressing characters by name. Needs: per-character awareness baked into prompt construction.
- **Hidden enemy resolution** — AI resolved hidden enemies without requiring perception checks first. Needs: information gating — hidden entities not revealed without detection.
- **Dungeon secret leaks** — AI revealed module content (upcoming rooms, plot twists, secrets) before players discovered them through play. Needs: module content gating — imported content has `discovered` flag, AI prompt only includes discovered content.
- **Fabricated content** — AI invented NPCs, locations, items, or lore not in the source material or established campaign. Needs: source verification against imported canon.
- **AI treats app issues as rules questions** — Player says "Can't modify expertise" (a UI bug report) in Rules chat. AI responds with PHB page citations and formula explanations instead of acknowledging it can't fix the app. Needs: OOC/Rules channel needs to distinguish between rules questions and app/system issues — or the system needs a non-AI path for character sheet corrections.

## Narrative Failures (contract-only — code can't fully enforce)

- **Scene progression without consent** — *(Promoted to Mechanical Failures as "Scene transition without player confirmation." Kept here for audit trail.)* AI progressed scenes, moved time forward, or advanced the story without asking players if they were ready.
- **Forgot established personality** — AI changed an NPC's established behavior or disposition mid-scene without reason.
- **Repeated descriptions** — AI gave the same description it already provided in a recent turn.
- **Inconsistent information** — AI told different players different things about the same situation.
- **Misread own ledger** — AI stated wrong HP, gold, or inventory despite correct values in the system prompt.
- **Item/object continuity error** — AI contradicts its own recent narration about item location or state. Example: Staff of Power described as "shattered, wedged in debris" in one message, then Aria has "her hand on the Staff's broken remnants" at a different location two messages later.

---

## v2 Failures (discovered in v2 play-testing)

*Real failures seen running the deployed app, not inherited from v1.*

- **Roll requested FOR an enemy** — AI emitted a `roll_request` targeting an enemy/NPC; the roll bar surfaced it and the player rolled a bare d20 (no modifier) for a creature the DM is supposed to control. The "DM rolls enemies itself" rule was prompt-only. **✅ fixed (S37):** mechanics validation rejects any `roll_request` whose target isn't a player character (party/all excepted; player creatures TBD). Shows as a rejected pill. The DM resolves NPC/enemy rolls in narration.
- **Enemy HP never moved in the tracker** — AI narrated enemy damage ("the goblin staggers, bloodied") without emitting `hp: Name=value`, so the combat tracker's enemy HP stayed full. Enemy HP only updates through the `hp` mechanic. **✅ partial (S37):** contract now requires an `hp` mechanic whenever ANY combatant (enemy or PC) takes damage/heals; Gate 3 (drift) flags HP narration without a matching mechanic. Promote to full ✅ with an engine auto-apply-from-narration fallback if the AI keeps skipping it.
- **Turn overlap / everyone acting at once** — the v2 manifestation of "Combined/skipped turns" (above). Felt sloppy in play: turns blurred together, the story advanced past players. Root cause was split turn ownership (engine + AI both advancing). See the ✅ partial note on that entry.

## How This File Works

- **Append-only** — new failures discovered in v2 get added here
- **Never complete** — this list grows as long as we play
- **Audit trail for Law 2** — when a contract clause keeps getting violated, check here, find the pattern, build a code constraint
- **Tracks enforcement status** — once a failure has a working code constraint, mark it ✅ and the contract clause can be removed
