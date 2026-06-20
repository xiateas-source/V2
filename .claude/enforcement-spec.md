# Mechanics Pipeline Enforcement Spec

*The container. Every gate below replaces a contract clause the AI ignored in v1. Source: `.claude/gameplay-reference-v2.md` compliance analysis.*

*This is the requirements doc for `src/ai/mechanics.js` — the Law 2 enforcement layer.*

---

## Pipeline Overview

```
AI response arrives
       ↓
  extractMechanics(response)     → pulls structured mechanics from response
       ↓
  detectDrift(response, state)   → scans narrative for unlogged state changes
       ↓
  detectProseRolls(response)     → scans narrative for AI-generated dice rolls
       ↓
  validateMechanics(mechanics, state, pendingRolls)  → ownership, spells, rolls
       ↓
  detectSceneChange(mechanics, state)  → location/time shifts need confirmation
       ↓
  detectUnmentionedPCs(response, playerMessage)  → PCs acted on without player input
       ↓
  applyMechanics(validatedMechanics, state)  → writes to state
       ↓
  postApplyChecks(state, mechanics)  → XP audit, income audit, turn order
       ↓
  state updates → UI reacts → Firebase syncs
```

---

## Gate 1: Roll Confirmation

**Contract clause it replaces:** *"state check type and DC, wait. Do not narrate outcome until roll arrives"*

**Why it failed as a contract:** AI requests one "dramatic" roll, fabricates 2-3 others in the same response. Prioritizes narrative momentum over waiting.

**Trigger:** AI response contains a roll result (`\d+d\d+[+-]?\d*\s*=\s*\d+` or `1d20+5 = 18` patterns) that doesn't match a player-submitted roll.

**Detection method:**
1. Maintain a `pendingRolls` set — rolls submitted by the player via roll UI since last AI response
2. On AI response, scan both narrative prose and mechanics block for roll results
3. For each roll result found, check: does a matching player-submitted roll exist in `pendingRolls`?
4. Match on: character name + skill/check type + result value

**Response:**
- **Reject** the mechanic that depends on the fabricated roll
- **Flag** it in the response with a visual indicator (e.g., strikethrough or warning pill)
- **Prompt** the player: "The DM resolved [PC]'s [Skill] check without your roll. Roll now or accept the result?"
- Player can: submit the real roll (re-resolve with actual result), or tap "accept" (keep the AI's result as-is)

**Edge cases:**
- Enemy/NPC rolls are AI-owned — the DM rolls for monsters. Don't flag these.
- Passive Perception is not a roll — don't flag passive checks.
- If the AI requests a roll AND resolves it in the same message (asking and answering itself), flag it.

---

## Gate 2: Scene Transition

**Contract clause it replaces:** *"Never advance time more than one scene beat without player input"* and *"narrate step 1 and ask for confirmation before proceeding to step 2"*

**Why it failed as a contract:** AI resolves multi-step plans in a single response. Escape sequences, travel montages, and multi-room explorations compressed into one message.

**Trigger:** AI response contains mechanics indicating a location change, significant time advance, or scene transition.

**Detection method:**
1. Compare `location` in the AI's mechanics/Campaign State block against current state location
2. Compare `time` in the AI's response against current state time
3. Flag if: location changed, OR time advanced more than 30 minutes, OR a `chapter_add` mechanic appears (indicating arc boundary)
4. Scan narrative for transition markers: arriving at new locations, entering new rooms, "hours later," "the next morning," travel montages

**Response:**
- **Hold** the scene transition — don't update location/time in state yet
- **Show** the narrative up to the transition point
- **Prompt** the player: "The DM is moving to [new location/time]. Ready to move on, or is there something you want to do first?"
- Player can: confirm (apply the transition), or say "wait" (inject context telling AI the player isn't done)

**Edge cases:**
- Within-location movement (crossing a room, going upstairs) is not a scene transition — don't gate it
- Combat time advancement (6-second rounds) is not a scene transition
- If the player's own message initiated the move ("we head to the Manor"), lower the gate — they already confirmed intent. Still flag if the AI resolves additional transitions beyond what the player stated.

---

## Gate 3: Unmentioned PC Actions

**Contract clause it replaces:** *"NEVER narrate a PC's action unless that PC's player explicitly stated it"* and *"has every PC been given a chance to act? If not, ask them by name"*

**Why it failed as a contract:** AI fills in actions for PCs the player didn't mention. Narrative reads better with all 3 PCs active, so the AI writes for them.

**Trigger:** AI response narrates actions for a PC whose name doesn't appear in the player's message (as an actor, not a reference).

**Detection method:**
1. Parse the player's message for PC names that appear as actors (doing something, not being referenced passively)
2. Parse the AI's response for PC names that appear as actors
3. Diff: any PC the AI wrote actions for that the player didn't mention is flagged
4. Distinguish between: "Aria stands guard" (AI decided an action) vs "Aria hears the alarm" (AI describing what a PC perceives — this is fine, the DM describes the environment)

**Response:**
- **Flag** the unmentioned PC's actions with a visual indicator
- **Prompt** the player: "[PC name] wasn't given instructions. The DM wrote: '[summary of what AI narrated]'. Accept, or tell [PC] what to do?"
- Player can: accept (keep AI's narration), or type replacement actions

**Edge cases:**
- If the player says "we all do X" — all PCs are mentioned, no flag
- If the player says "Valenns tells everyone to follow" — following is stated intent, no flag for PCs following
- Perception/environmental narration is DM territory: "Aria hears shouting" is fine. "Aria draws her sword" is not fine unless the player said it.
- In combat with initiative: the AI should only resolve the current PC's turn. Other PCs acting = flag.

---

## Gate 4: Spell Validation

**Contract clause it replaces:** *"Check each caster PC's magic field... Never invent spells a PC doesn't have"*

**Why it failed as a contract:** AI treats spell access as vibes. Lets characters cast anything that sounds class-appropriate without checking the actual spell list.

**Trigger:** AI response includes a `spell_use` mechanic or narrates a PC casting a spell.

**Detection method:**
1. Extract spell name and caster from mechanics or narrative
2. Look up caster's known spells in state (system-owned field from character data)
3. For cantrips: check against cantrip list (e.g., Eldritch Knight 5 = 2 cantrips)
4. For leveled spells: check against prepared/known spells AND available slots
5. For concentration: check if caster is already concentrating — if so, previous spell drops

**Response:**
- **Unknown spell:** Reject the mechanic. Flag: "[PC] doesn't know [Spell]. The DM narrated it anyway."
- **No slots remaining:** Reject. Flag: "[PC] is out of level [N] spell slots."
- **Concentration conflict:** Auto-resolve: drop the previous concentration spell, apply the new one. Notify: "[Previous spell] ended because [PC] is now concentrating on [New spell]."

**Data dependency:** Requires system-owned spell data in state. Character creation / level-up wizard must populate: known spells, cantrips, slots per level, current slot usage.

---

## Gate 5: Drift Detectors

**Contract clause it replaces:** *"Every gold transaction MUST have a mechanics line"* and narrated state changes without mechanics generally.

**Why it failed as a contract:** AI narrates loot, gold, NPC introductions, condition changes in prose without emitting corresponding mechanics. State doesn't update.

**Detection method — scan AI narrative for:**

| Pattern | Regex/keyword scan | Expected mechanic |
|---------|-------------------|-------------------|
| Gold/treasure found | "gold," "coins," "gems," "reward," "payment," "treasure" near quantity words | `income:` |
| Item picked up | "picks up," "takes," "pockets," "stows," "grabs," "loots" + item name | `item_add:` |
| Item given away/lost | "gives," "drops," "discards," "stolen," "destroyed" + item name | `item_remove:` |
| NPC introduced | Capitalized name + description pattern, not already in NPC tracker | `npc_add:` |
| HP change | "takes X damage," "heals," "hit points," "wounds" | `hp:` |
| Condition applied | "poisoned," "unconscious," "restrained," "frightened," etc. | `conditions:` |
| Location change | "arrives at," "enters," "reaches," "moves to" + place name | `location:` |
| Time advance | "hours later," "the next morning," specific time stamps | `time:` |

**Response:**
- **Flag** each drift instance with a warning pill in the response
- **Offer** to auto-generate the missing mechanic: "The DM said you found a Gemstone Pouch but didn't log the value. Add income?"
- **Don't auto-reject** — the AI's narrative may be correct, it just forgot the mechanic line. Let the player confirm.

---

## Gate 6: Combat Turn Enforcement

**Contract clause it replaces:** *"Never end a combat turn without stating who goes next"* and *"Each PC gets ONE Action, ONE Bonus Action, ONE Reaction per round"*

**Why it failed as a contract:** AI combines multiple turns into narrative blocks. Initiative exists but isn't enforced per-turn.

**Trigger:** Combat mode is active (combat state flag set).

**Detection method:**
1. When combat starts, engine sets `combat.active = true` and records initiative order
2. Track `combat.currentTurn` — which PC/NPC is acting
3. AI response must only resolve actions for `combat.currentTurn` character
4. If AI response includes actions for other PCs → flag (same as Gate 3, but stricter in combat)
5. Track actions used this turn: action (1), bonus action (1), reaction (1), movement (1)
6. If AI resolves more actions than available → flag action economy violation

**Response:**
- **Enforce turn order:** After resolving current turn, engine prompts: "[Next PC in initiative], it's your turn. What do you do?"
- **Reject multi-turn responses:** If AI resolves 3 PCs' turns in one response, split it — apply only the current turn's PC, hold the rest
- **Action economy warning:** "The DM used [PC]'s Action AND Bonus Action for [spell]. [PC] has no Bonus Action remaining this turn."

**Combat state structure:**
```
combat: {
  active: true,
  round: 1,
  initiative: [
    { name: "Aria", roll: 22, type: "pc" },
    { name: "Valenns", roll: 15, type: "pc" },
    { name: "Slasher", roll: 14, type: "pc" },
    { name: "Dragonclaw 1", roll: 9, type: "npc" }
  ],
  currentTurn: 0,  // index into initiative
  actionsUsed: { action: false, bonus: false, reaction: false, movement: false }
}
```

---

## Gate 7: XP Audit

**Contract clause it replaces:** No explicit clause — this is a gap in the v1 contract. AI simply forgot to award XP across entire arcs.

**Trigger:** Any of these mechanics appear: `quest_done`, `consequence_resolve` (combat-related), combat ends, `chapter_add`.

**Detection method:**
1. After any trigger event, check: was an `xp:` mechanic emitted in the same response or the previous 2 responses?
2. If not, flag it

**Response:**
- **Prompt** the player: "The DM completed [event] but didn't award XP. Request XP calculation?"
- If player confirms: inject context into next AI message requesting XP for the resolved encounter
- Track XP as deltas only (not cumulative) — display format: "+150 XP" not "Total: 1,900 XP"

---

## Gate 8: Skill Check Requirement

**Contract clause it replaces:** *"NEVER resolve a physically challenging action as success without first requesting a roll"* and *"Every uncertain action with meaningful consequences requires a declared DC"*

**Why it failed as a contract:** AI auto-succeeds complex actions (searching, binding, navigating hazards) without requesting checks.

**Detection method:**
Action-type keywords in player messages mapped to expected checks:

| Player action keywords | Expected check | Always required? |
|-----------------------|---------------|-----------------|
| search, look for, investigate, examine | Investigation or Perception | Yes, if target is hidden/concealed |
| sneak, hide, creep, slip past | Stealth | Yes, if enemies are present |
| climb, jump, swim, hold, lift, shove | Athletics | Yes, if physically demanding |
| persuade, convince, negotiate | Persuasion | Yes, if NPC is resistant |
| deceive, lie, bluff, pretend | Deception | Yes, if target can detect the lie |
| intimidate, threaten, scare | Intimidation | Yes, if target has reason to resist |
| pick lock, disarm trap, sleight of hand | Sleight of Hand / Thieves' Tools | Yes |
| bind, tie up, restrain, gag | Athletics or Sleight of Hand | Yes, if target is conscious or powerful |
| cast [spell] | Spell validation (Gate 4) | Slot check required |
| attack, strike, hit | Attack roll | Always in combat |

**Response:**
- After AI response, check: did the player's message contain action keywords that require a check?
- Did the AI's response include a roll request for that action?
- If no roll request and the action requires one: **flag** and **prompt** player: "The DM resolved [action] without a check. Request a roll?"
- If player confirms: inject context telling AI to request the appropriate check before resolving

**Edge cases:**
- Trivial actions for proficient characters don't require rolls (contract already says this)
- "Valenns uses Prestidigitation to clean the robes" — cantrip, no check needed (but slot validation still applies)
- The three-condition test from the contract stays as guidance: uncertain outcome + meaningful consequences + requires skill

---

## Gate 9: Income/Loot Reconciliation

**Contract clause it replaces:** *"Every gold transaction MUST have a mechanics line"*

**Why it failed as a contract:** AI emits `item_add` for loot but doesn't emit `income:` for items with monetary value.

**Trigger:** An `item_add` mechanic is emitted with category "treasure," "jewelry," "gems," or the item description implies monetary value.

**Detection method:**
1. On `item_add`, check if the item category or description suggests gold value
2. Check if a corresponding `income:` mechanic was emitted in the same response
3. If not, flag it

**Response:**
- **Prompt** the player: "[Item] was added to inventory but no gold value was logged. Ask the DM to appraise it?"
- If confirmed: inject context requesting value assessment and `income:` mechanic

---

## Priority Order for Implementation

Build these in order — each gate is independently useful:

| Priority | Gate | Impact | Complexity |
|----------|------|--------|------------|
| 1 | **Roll Confirmation** | Fixes the worst and most frequent failure | Medium — needs roll tracking + prose scanning |
| 2 | **Combat Turn Enforcement** | Fixes combat, which is currently non-functional | Medium — needs combat state + initiative tracking |
| 3 | **Drift Detectors** | Catches narrated-but-untracked state changes | Medium — keyword scanning + mechanic matching |
| 4 | **Scene Transition** | Fixes story steamrolling | Low — location/time diff + confirmation UI |
| 5 | **Unmentioned PC Actions** | Fixes autopiloting | Medium — NLP-ish parsing of player message vs AI response |
| 6 | **Spell Validation** | Fixes spell list/slot issues | Low — lookup against character data |
| 7 | **Skill Check Requirement** | Catches auto-resolved actions | Medium — action keyword mapping |
| 8 | **XP Audit** | Catches forgotten XP | Low — trigger event → check for xp mechanic |
| 9 | **Income/Loot Reconciliation** | Catches unvalued treasure | Low — item_add category check |

---

## What Stays in the Contract

These rules work as contract clauses — the AI follows them reliably. No code enforcement needed:

- Address each PC by name (never generic "you")
- Tone and narrative voice
- Output format: mechanics block, Campaign State, choice presentation
- Quest/NPC/item mechanic format (`quest_done`, `npc_add`, `item_add`, etc.)
- Information gating (don't reveal undiscovered content)
- Dungeon secrets
- Roll request format (`Roll Request: Skill (PC) | DC X | Context`)
- Death save procedure (format, not enforcement — enforcement is Gate 6 combat tracking)
- Concentration save *prompting* (format; actual enforcement is Gate 4 spell tracking)
- Encumbrance rules (contract reminder; drift detector catches untracked weight)
- Continuity self-check ("at start of every response, verify...")
- Story chronicle format (`chapter_add`)
- Advantage/disadvantage reasoning

---

## Design Principles

1. **Gates don't block — they flag and ask.** The player always has the option to accept the AI's output. The gate makes the violation visible, not impossible. Exception: field ownership violations (AI writing to system-owned fields) are hard rejections.

2. **Gates are additive.** Each gate is an independent module. Disable any gate without affecting the others. Roll out incrementally.

3. **False positives are cheap, false negatives are expensive.** Better to flag something that's fine than miss something that's wrong. The player can dismiss flags with one tap.

4. **The AI doesn't know about the gates.** The contract doesn't say "your rolls will be checked." The AI writes normally; the engine validates after. This prevents the AI from trying to game the system.

5. **Flags surface in play, not in a log.** When a gate fires, the player sees it inline — a pill, a banner, a prompt. Not buried in DevTools. Law 4: surface changes where the player is.
