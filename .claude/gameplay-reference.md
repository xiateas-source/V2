# V1 Gameplay Reference — For V2 Engine Development

*From raw gameplay exports (Tinkle's Tinctures, Day 25-26, 80 messages). Solo play by one player controlling all 3 PCs.*

---

## Flagged Moment Analysis (Message #80)

**Context:** Player asks Valenns + Slasher to secure area, strip-loot Talis (incapacitated Wyrmspeaker), bind/gag her, repair her gear with cantrips. Asks if other survivors exist.

**Problems identified:**

1. **Zero rolls for complex actions.** Looting a high-ranking NPC = no Investigation. Binding a spellcaster = no Athletics or Sleight of Hand. Four spells cast = no slot tracking. The AI resolved everything narratively.

2. **AI autopiloted Aria.** Player specified actions for Valenns and Slasher only. AI decided Aria "stands guard at the tunnel entrance" — a tactical decision the player didn't make.

3. **Spell list not verified.** Slasher (Eldritch Knight 5, 2 cantrips) uses Mend. AI frames it as "smith's craft" without checking his actual cantrip list.

4. **Staff of Power continuity error.** Two messages earlier: "shattered into two useless pieces of scorched timber." Target message: Aria has her hand on "the Staff of Power's broken remnants" — but the staff was in the debris at Talis's location, not with Aria.

5. **No XP awarded.** The entire Lodge arc — capturing a Wyrmspeaker, destroying a ley-node, freeing prisoners — produced zero XP mechanics.

**Root causes:** All five are AI failures that code should enforce. (1) is "resolved without rolls." (2) is "PC autopiloting." (3) is "spell validation." (4) is "state tracking." (5) is "XP omission." None are UX gaps — they're contract/enforcement gaps.

---

## Systemic Failures (Full 40-Message Solo Log)

### Prose Dice Rolling — Epidemic

The AI auto-rolls dice in narration constantly. Pattern: it requests one "dramatic" roll from the player, then auto-resolves 2-3 other characters' rolls in the same response.

**Examples from the log:**
- Player rolls Slasher's Stealth (3, fail). AI auto-rolls Aria's Stealth (18) and Valenns's Stealth (14) in the same response.
- AI auto-rolls ALL initiative: Aria 22, Valenns 15, Slasher 14, Dragonclaws 9 — zero player input.
- Player rolls Slasher's Athletics (14). AI auto-rolls Valenns's Arcana (24) — "Critical Success" — in the same response.
- AI auto-rolls Slasher's Athletics/Shove (18) without requesting a roll.

**V2 fix:** Drift detector for `\d+d\d+[+-]\d+\s*=\s*\d+` patterns in AI prose. If the AI generates a roll result that wasn't submitted by the player, flag it and reject the mechanic. Engine must request each roll individually and wait for player input.

### Combat Turn Enforcement — Absent

The "Bog Ambush" (3 Dragonclaws) resolves in ~4 exchanges instead of turn-by-turn:
- Initiative set but never enforced per-turn
- All 3 PCs act in a single narrative block
- No "Valenns, it's your turn" prompts
- Entire combat compressed into collaborative narration

**V2 fix:** When combat is active, engine enforces turn order. AI response for one PC's turn cannot include resolution of another PC's actions. Combat mode flag in state controls this.

### PC Autopiloting

When one player controls multiple PCs, the AI fills in actions for characters the player didn't mention:
- Player says "Slasher creates a distraction" → AI narrates Aria changing clothes AND Valenns looting a room
- Player says "Valenns secures area, Slasher uses mend" → AI adds "Aria stands guard"
- Player says "Valenns will tunnel under" → AI narrates Aria and Slasher reactions

**V2 fix:** If the player specifies actions for 2 of 3 PCs, the AI should ask what the third does — not decide for them. Contract clause: "Never resolve a PC's action unless the player stated it or the PC is explicitly following another character."

### Spell Tracking — Absent

Across the full log, characters cast: Mold Earth (3+), Minor Illusion (1+), Prestidigitation (2+), Mending (2+), Message (1+), Spider Climb (mentioned as faded), Sleepy-Moss tincture (1). Zero spell slot accounting. No "you have X slots remaining." No concentration tracking.

**V2 fix:** Spell use emitted as mechanics (`spell_use: Mold Earth, Valenns, cantrip`). For leveled spells, slot deduction via mechanics pipeline. Concentration tracked in state — if a new concentration spell is cast, previous one drops.

### XP Omission

The entire 40-message arc covers: ambushing 3 Dragonclaws, infiltrating the Hunting Lodge, sabotaging a ley-node, freeing prisoners, capturing a Wyrmspeaker, destroying the Lodge. Zero XP mechanics emitted anywhere.

**V2 fix:** Drift detector for combat/encounter resolution without XP mechanic. After any encounter ends (quest_done, combat resolution, major objective), engine checks if XP was awarded. If not, flags it.

---

## What Works Well

**Narrative quality is high.** Vivid, sensory prose. Each PC gets individual moments and distinct voice. Multi-character scenes are well-staged with spatial awareness.

**Multi-character addressing works.** AI speaks to Valenns, Slasher, and Aria by name with distinct actions and positioning. Split-party tracking is handled well (ceiling joists / kitchens / courtyard).

**Choice presentation is effective.** "How do you proceed?" with 2-3 concrete options. Bold headers make scanning easy on mobile. Choices reference the tactical situation, not abstract options.

**Mechanics blocks are emitted.** `item_add`, `consequence_add`, `consequence_resolve`, `quest_done`, `primary_mission`, `chapter_add` all appear correctly in the mechanics sections. The mechanics *format* works — the problem is selective enforcement, not format.

**Campaign State blocks are consistent.** Location, time, status updates appear reliably at the end of each AI response. These serve as ground truth for state tracking.

**Roll requests work when used.** Format is clear: `Roll Request: Skill (PC) | DC X | Context`. Player rolls appear as `[PC — Skill] d20[N]+mod=total`. The system works — it's just not triggered often enough.

---

## Patterns to Preserve in V2

**AI response structure (when working correctly):**
```
[Narrative prose — 2-4 paragraphs, addresses PCs by name]

***

### Campaign State: [Phase Name]
*   **Location:** [specific]
*   **Time:** [Day X, HH:MM]
*   **Status:** [situation summary]
*   **Inventory:** [item_add mechanics]
*   **Roll Request:** [Skill (PC) | DC X | Context]

**[Choices for players — 2-3 options with bold headers]**
```

**Choice presentation:**
```
**Do you [option A], or [option B]?**
```
Or for more complex decisions:
```
**You have several options:**
*   **Option A:** Description
*   **Option B:** Description
*   **Option C:** Description

**How do you proceed?**
```

**Roll request flow (working correctly):**
```
AI identifies action requiring a roll →
Names the PC, the skill, the DC, the context →
"Roll Request: Deception (Aria) | DC 15 | To pass the guards"
→ Roll request banner appears pre-filled
→ Player submits: [Aria Windchime — Deception] d20[17]+7=24
→ AI narrates the result
```

**Session archive / Previously On format:**
```
[Day X, HH:MM] (N msgs)
[Last line of session]

***

**Previously:** [1-2 paragraph recap]
```

---

## V1 Contract Compliance — What Worked vs What Failed

*Full v1 contract saved in `.claude/v1-contract-reference.md`. This section grades each clause against actual gameplay.*

### Contract Clauses the AI FOLLOWED

| Clause | Evidence |
|--------|----------|
| Multi-player addressing by name | Every response addresses Valenns, Slasher, Aria individually. Never "you" generically. |
| Tone and narrative quality | Consistent epic fantasy with sensory detail throughout. |
| Quest tracking mechanics | `quest_done`, `primary_mission`, `quest_add` emitted correctly. |
| NPC tracking | `npc_add` on first introduction, referenced naturally after. |
| Item add mechanics | `item_add` emitted for loot (quartz shards, potions, keys, robes). |
| Consequence tracking | `consequence_add` and `consequence_resolve` emitted and tracked. |
| Chapter tracking | `chapter_add` at major milestones. |
| Choice presentation | 2-3 options with bold headers, "How do you proceed?" consistently. |
| Dungeon secrets / info gating | Didn't reveal Lodge layout before discovery. |
| Continuity verification (mostly) | Location, conditions tracked between messages (Staff of Power error is an exception). |
| Advantage/disadvantage (when rolling) | Stated "Advantage: Disguise/Robes" on Aria's Deception check. |

### Contract Clauses the AI IGNORED

| Clause | Contract Text | What Actually Happened | V2 Fix |
|--------|--------------|----------------------|--------|
| **Roll before resolve** | "NEVER resolve a physically challenging action as success without first requesting a roll" | Looting Talis, binding, Mold Earth tunneling — all resolved without rolls. | Code: roll confirmation gate |
| **Wait for roll** | "state check type and DC, wait. Do not narrate outcome until roll arrives" | AI auto-rolled Aria Stealth (18), Valenns Stealth (14), all initiative, Valenns Arcana (24), Slasher Shove (18). | Code: reject AI-generated rolls |
| **Resolve each PC separately** | "When multiple PCs act in the same moment, resolve each separately with appropriate checks" | All 3 PCs resolved in single narrative blocks, every response. | Code: one PC per resolution prompt |
| **Never narrate unspoken PC actions** | "NEVER narrate a PC's action, decision, movement, or position unless that PC's player explicitly stated it" | Player says Valenns+Slasher actions; AI narrates Aria "standing guard," changing clothes, maintaining illusion. | Code: flag unmentioned PC actions |
| **Ask every PC** | "After resolving any action, ALWAYS check: has every PC been given a chance to act? If not, ask them by name" | Never once asked "Aria, what do you do?" when player only specified Valenns/Slasher. | Code: unmentioned PC prompt |
| **No auto-complete plans** | "If the party outlines a plan, narrate step 1 and ask for confirmation before proceeding to step 2" | Player says "escape in the chaos" → AI narrates full escape + tunnel + regrouping in one response. | Code: scene transition gate |
| **One scene beat** | "Never advance time more than one scene beat without player input" | AI advanced through: distraction → disguise change → room looting → building collapse → tunnel escape in one message. | Code: scene transition gate |
| **Spell verification** | "Check each caster PC's magic field... Never invent spells a PC doesn't have" | Slasher uses Mend without verifying Eldritch Knight cantrip list. | Code: spell validation against character data |
| **Action economy** | "Track these strictly. State which action type is being used for each action" | Zero action economy tracking outside combat. Inside combat, turns combined. | Code: action tracking in combat state |
| **Skill checks required** | "Every uncertain action with meaningful consequences requires a declared DC, a player roll, and narration" | Searching Talis (Investigation?), binding (Athletics?), navigating rubble (Athletics?) — no checks. | Code: action-type → required-check mapping |
| **Income tracking** | "Every gold transaction MUST have a mechanics line. No exceptions" | Looted Gemstone Pouch — no income mechanic. | Code: drift detector for loot without income |
| **Who goes next** | "Never end a combat turn without stating who goes next" | Bog Ambush: initiative set, turns combined, no turn tracking. | Code: combat turn enforcement |

### The Pattern

**15 clauses followed. 12 clauses ignored.** The clauses that work are:
- Output format rules (how to structure mechanics blocks)
- Identity rules (who to address, what tone)
- Tracking rules (quest/NPC/item mechanics)

The clauses that fail are:
- Behavioral constraints ("wait," "ask first," "don't skip")
- Mechanical enforcement ("track action economy," "require rolls")
- Pacing rules ("one scene at a time," "confirm before advancing")

**The AI follows rules about WHAT to output. It ignores rules about WHEN to stop.** Format compliance is high. Behavioral compliance is low. This is exactly why Law 2 exists — these behavioral rules must become code gates, not contract clauses.

---

## Notes for V2 Contract Writing

**Keep in the contract (AI follows these):**
- Character addressing by name
- Tone and narrative voice
- Output format (mechanics blocks, Campaign State, choices)
- Quest/NPC/item tracking mechanics format
- Information gating language
- Dungeon secrets / discovery rules

**Move to code enforcement (AI ignores these):**
- Roll before resolve → roll confirmation gate
- Wait for player input → scene transition gate
- Don't act for unmentioned PCs → unmentioned PC flag
- Track action economy → combat state tracker
- Verify spell lists → spell validation
- Income on every transaction → loot drift detector
- One scene beat at a time → scene change detection
- Turn order in combat → turn enforcement

**Contract writing principles from v1:**
- The AI responds to specific character names, not "the players"
- "Before narrating X, you MUST Y" imperative patterns work when the AI remembers them
- Short, rule-per-line format beats long paragraphs
- Bold/formatted output rules are followed reliably
- The AI ignores behavioral constraints when narrative momentum is high
- Vague instructions ("be careful with pacing") are always ignored
- Instructions buried in the middle of large text blocks are lost

---

## Timestamp Issue

Multiple messages show stale timestamps (e.g., `[Day 25, 06:00 PM]` for events happening at 7:00-11:45 PM). The display timestamp doesn't update with in-game time progression. This appears to be a v1 UI bug — the timestamp shown is the real-world send time or a fixed value, not the narrative time. V2 should display the in-game time from the Campaign State block, not a fixed timestamp.
