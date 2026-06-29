# V1 Seed Data — For V2 Content Pipeline

*Extracted from `src/main.js`. Reference data that V2 needs for character creation, level-up, spell validation, and UI glossary.*

---

## XP Thresholds (Levels 1–20)

```
Level:  1     2     3      4      5      6      7      8      9      10
XP:     0   300   900  2,700  6,500 14,000 23,000 34,000 48,000 64,000

Level: 11      12      13      14      15      16      17      18      19      20
XP:  85,000 100,000 120,000 140,000 165,000 195,000 225,000 265,000 305,000 355,000
```

Source: `XP_T` array at line 6.

---

## Level-Up Data (Fighter / Rogue / Bard, L2–L10)

### Fighter (hit die: d10)

| Level | Auto Features | Choices |
|-------|--------------|---------|
| 2 | Action Surge (1/Short Rest) | — |
| 3 | — | Subclass: Champion, Battle Master, Eldritch Knight |
| 4 | — | ASI |
| 5 | Extra Attack (2 attacks per Attack action) | — |
| 6 | — | ASI |
| 7 | Battle Master: 5 maneuvers, 5 superiority dice (d8). Champion: Remarkable Athlete | — |
| 8 | — | ASI |
| 9 | Indomitable (1/Long Rest): reroll failed save | — |
| 10 | Battle Master: 7 maneuvers, +1 die. Champion: Additional Fighting Style | — |

### Rogue (hit die: d8)

| Level | Auto Features | Choices |
|-------|--------------|---------|
| 2 | Cunning Action (Dash/Disengage/Hide as Bonus Action) | — |
| 3 | Sneak Attack 2d6 | Subclass: Arcane Trickster, Assassin, Thief, Mastermind, Swashbuckler |
| 4 | — | ASI |
| 5 | Uncanny Dodge, Sneak Attack 3d6 | — |
| 6 | Expertise (2 more skills) | — |
| 7 | Evasion, Sneak Attack 4d6 | — |
| 8 | — | ASI |
| 9 | Arcane Trickster: Magical Ambush, Sneak Attack 5d6 | 1 spell (up to 2nd level) |
| 10 | — | ASI |

### Bard (hit die: d8)

**Spell slots by level:**

| Bard Level | 1st | 2nd | 3rd | 4th | 5th |
|-----------|-----|-----|-----|-----|-----|
| 1 | 2 | — | — | — | — |
| 2 | 3 | — | — | — | — |
| 3 | 4 | 2 | — | — | — |
| 4 | 4 | 3 | — | — | — |
| 5 | 4 | 3 | 2 | — | — |
| 6 | 4 | 3 | 3 | — | — |
| 7 | 4 | 3 | 3 | 1 | — |
| 8 | 4 | 3 | 3 | 2 | — |
| 9 | 4 | 3 | 3 | 3 | 1 |
| 10 | 4 | 3 | 3 | 3 | 2 |

| Level | Auto Features | Choices |
|-------|--------------|---------|
| 2 | Jack of All Trades, Song of Rest (d6) | 1 spell (1st level) |
| 3 | Expertise (2 skills) | Subclass: Lore, Valor, Glamour, Whispers, Creation. 1 spell (up to 2nd) |
| 4 | — | ASI. 1 spell or cantrip |
| 5 | Bardic Inspiration → d8, Font of Inspiration (Short Rest recharge) | 1 spell (up to 3rd) |
| 6 | Lore: Additional Magical Secrets (2 spells, any class, up to 3rd). Countercharm | 2 Magical Secrets spells |
| 7 | — | 1 spell (up to 4th) |
| 8 | — | ASI. 1 spell (up to 4th) |
| 9 | Song of Rest → d8 | 1 spell (up to 5th) |
| 10 | Bardic Inspiration → d10, Expertise (2 more), Magical Secrets (2 spells, any class, up to 5th) | 2 Magical Secrets spells |

Source: `LEVEL_UP_DATA` at line 19.

---

## Bard Spell List (by spell level)

**Cantrips (0):** Dancing Lights, Friends, Light, Mage Hand, Mending, Message, Minor Illusion, Prestidigitation, True Strike, Vicious Mockery

**1st:** Animal Friendship, Bane, Charm Person, Comprehend Languages, Cure Wounds, Detect Magic, Disguise Self, Faerie Fire, Feather Fall, Healing Word, Heroism, Identify, Illusory Script, Longstrider, Silent Image, Sleep, Speak with Animals, Thunderwave, Unseen Servant

**2nd:** Animal Messenger, Blindness/Deafness, Calm Emotions, Cloud of Daggers, Crown of Madness, Detect Thoughts, Enhance Ability, Enthrall, Heat Metal, Hold Person, Invisibility, Knock, Lesser Restoration, Locate Object, Magic Mouth, Phantasmal Force, See Invisibility, Shatter, Silence, Suggestion, Zone of Truth

**3rd:** Bestow Curse, Clairvoyance, Dispel Magic, Fear, Hypnotic Pattern, Major Image, Nondetection, Plant Growth, Sending, Slow, Speak with Dead, Stinking Cloud, Tongues

**4th:** Compulsion, Confusion, Dimension Door, Freedom of Movement, Greater Invisibility, Hallucinatory Terrain, Locate Creature, Polymorph

**5th:** Animate Objects, Awaken, Dominate Person, Dream, Geas, Greater Restoration, Hold Monster, Legend Lore, Mass Cure Wounds, Mislead, Modify Memory, Planar Binding, Raise Dead, Scrying, Seeming, Teleportation Circle

Source: `BARD_SPELLS` at line 74.

---

## Spell Compendium (94 spells)

### Cantrips (22)

| Spell | School | Cast | Range | Duration | Components | Classes |
|-------|--------|------|-------|----------|------------|---------|
| Acid Splash | Conjuration | 1 action | 60 ft | Instant | V, S | wizard |
| Blade Ward | Abjuration | 1 action | Self | 1 round | V, S | bard, wizard |
| Booming Blade | Evocation | 1 action | Self (5 ft) | 1 round | S, M | wizard |
| Chill Touch | Necromancy | 1 action | 120 ft | 1 round | V, S | wizard |
| Dancing Lights | Evocation | 1 action | 120 ft | Conc, 1 min | V, S, M | bard, wizard |
| Fire Bolt | Evocation | 1 action | 120 ft | Instant | V, S | wizard |
| Friends | Enchantment | 1 action | Self | Conc, 1 min | S, M | bard, wizard |
| Green-Flame Blade | Evocation | 1 action | Self (5 ft) | Instant | S, M | wizard |
| Guidance | Divination | 1 action | Touch | Conc, 1 min | V, S | druid |
| Light | Evocation | 1 action | Touch | 1 hour | V, M | bard, wizard |
| Mage Hand | Conjuration | 1 action | 30 ft | 1 min | V, S | bard, wizard |
| Mending | Transmutation | 1 min | Touch | Instant | V, S, M | bard, wizard |
| Message | Transmutation | 1 action | 120 ft | 1 round | V, S, M | bard, wizard |
| Minor Illusion | Illusion | 1 action | 30 ft | 1 min | S, M | bard, wizard |
| Mold Earth | Transmutation | 1 action | 30 ft | Instant/1 hr | S | druid, wizard |
| Poison Spray | Conjuration | 1 action | 10 ft | Instant | V, S | wizard |
| Prestidigitation | Transmutation | 1 action | 10 ft | 1 hour | V, S | bard, wizard |
| Ray of Frost | Evocation | 1 action | 60 ft | Instant | V, S | wizard |
| Shocking Grasp | Evocation | 1 action | Touch | Instant | V, S | wizard |
| Thunderclap | Evocation | 1 action | 5 ft | Instant | S | bard |
| True Strike | Divination | 1 action | 30 ft | Conc, 1 round | S | bard, wizard |
| Vicious Mockery | Enchantment | 1 action | 60 ft | Instant | V | bard |

### 1st Level (28)

| Spell | School | Cast | Range | Duration | Components | Classes |
|-------|--------|------|-------|----------|------------|---------|
| Absorb Elements | Abjuration | 1 reaction | Self | 1 round | S | wizard |
| Animal Friendship | Enchantment | 1 action | 30 ft | 24 hours | V, S, M | bard |
| Bane | Enchantment | 1 action | 30 ft | Conc, 1 min | V, S, M | bard |
| Charm Person | Enchantment | 1 action | 30 ft | 1 hour | V, S | bard, wizard |
| Color Spray | Illusion | 1 action | Self (15 ft cone) | 1 round | V, S, M | wizard |
| Comprehend Languages | Divination | 1 action (ritual) | Self | 1 hour | V, S, M | bard, wizard |
| Cure Wounds | Evocation | 1 action | Touch | Instant | V, S | bard |
| Detect Magic | Divination | 1 action (ritual) | Self | Conc, 10 min | V, S | bard, wizard |
| Disguise Self | Illusion | 1 action | Self | 1 hour | V, S | bard, wizard |
| Dissonant Whispers | Enchantment | 1 action | 60 ft | Instant | V | bard |
| Entangle | Conjuration | 1 action | 90 ft | Conc, 1 min | V, S | druid |
| Faerie Fire | Evocation | 1 action | 60 ft | Conc, 1 min | V | bard |
| Feather Fall | Transmutation | 1 reaction | 60 ft | 1 min | V, M | bard, wizard |
| Find Familiar | Conjuration | 1 hr (ritual) | 10 ft | Instant | V, S, M | wizard |
| Grease | Conjuration | 1 action | 60 ft | 1 min | V, S, M | wizard |
| Healing Word | Evocation | 1 bonus action | 60 ft | Instant | V | bard |
| Heroism | Enchantment | 1 action | Touch | Conc, 1 min | V, S | bard |
| Identify | Divination | 1 min (ritual) | Touch | Instant | V, S, M | bard, wizard |
| Illusory Script | Illusion | 1 min (ritual) | Touch | 10 days | S, M | bard, wizard |
| Longstrider | Transmutation | 1 action | Touch | 1 hour | V, S, M | bard, wizard |
| Shield | Abjuration | 1 reaction | Self | 1 round | V, S | wizard |
| Silent Image | Illusion | 1 action | 60 ft | Conc, 10 min | V, S, M | bard, wizard |
| Sleep | Enchantment | 1 action | 90 ft | 1 min | V, S, M | bard, wizard |
| Snare | Abjuration | 1 min | Touch | 8 hours | S, M | wizard |
| Speak with Animals | Divination | 1 action (ritual) | Self | 10 min | V, S | bard |
| Tasha's Hideous Laughter | Enchantment | 1 action | 30 ft | Conc, 1 min | V, S, M | bard, wizard |
| Thunderwave | Evocation | 1 action | Self (15 ft cube) | Instant | V, S | bard, wizard |
| Unseen Servant | Conjuration | 1 action (ritual) | 60 ft | 1 hour | V, S, M | bard, wizard |

### 2nd Level (26)

| Spell | School | Cast | Range | Duration | Components | Classes |
|-------|--------|------|-------|----------|------------|---------|
| Animal Messenger | Enchantment | 1 action (ritual) | 30 ft | 24 hours | V, S, M | bard |
| Blindness/Deafness | Necromancy | 1 action | 30 ft | 1 min | V | bard, wizard |
| Blur | Illusion | 1 action | Self | Conc, 1 min | V | wizard |
| Calm Emotions | Enchantment | 1 action | 60 ft | Conc, 1 min | V, S | bard |
| Cloud of Daggers | Conjuration | 1 action | 60 ft | Conc, 1 min | V, S, M | bard, wizard |
| Crown of Madness | Enchantment | 1 action | 120 ft | Conc, 1 min | V, S | bard, wizard |
| Detect Thoughts | Divination | 1 action | Self | Conc, 1 min | V, S, M | bard, wizard |
| Enhance Ability | Transmutation | 1 action | Touch | Conc, 1 hour | V, S, M | bard |
| Enthrall | Enchantment | 1 action | 60 ft | 1 min | V, S | bard |
| Heat Metal | Transmutation | 1 action | 60 ft | Conc, 1 min | V, S, M | bard |
| Hold Person | Enchantment | 1 action | 60 ft | Conc, 1 min | V, S, M | bard, wizard |
| Invisibility | Illusion | 1 action | Touch | Conc, 1 hour | V, S, M | bard, wizard |
| Knock | Transmutation | 1 action | 60 ft | Instant | V | bard, wizard |
| Lesser Restoration | Abjuration | 1 action | Touch | Instant | V, S | bard |
| Locate Object | Divination | 1 action | Self | Conc, 10 min | V, S, M | bard, wizard |
| Magic Mouth | Illusion | 1 min (ritual) | 30 ft | Until dispelled | V, S, M | bard, wizard |
| Mirror Image | Illusion | 1 action | Self | 1 min | V, S | wizard |
| Misty Step | Conjuration | 1 bonus action | Self | Instant | V | wizard |
| Phantasmal Force | Illusion | 1 action | 60 ft | Conc, 1 min | V, S, M | bard, wizard |
| See Invisibility | Divination | 1 action | Self | 1 hour | V, S, M | bard, wizard |
| Shadow Blade | Illusion | 1 bonus action | Self | Conc, 1 min | V, S | wizard |
| Shatter | Evocation | 1 action | 60 ft | Instant | V, S, M | bard, wizard |
| Silence | Illusion | 1 action (ritual) | 120 ft | Conc, 10 min | V, S | bard |
| Suggestion | Enchantment | 1 action | 30 ft | Conc, 8 hours | V, M | bard, wizard |
| Zone of Truth | Enchantment | 1 action | 60 ft | 10 min | V, S | bard |

### 3rd Level (18)

| Spell | School | Cast | Range | Duration | Components | Classes |
|-------|--------|------|-------|----------|------------|---------|
| Bestow Curse | Necromancy | 1 action | Touch | Conc, 1 min | V, S | bard, wizard |
| Clairvoyance | Divination | 10 min | 1 mile | Conc, 10 min | V, S, M | bard, wizard |
| Dispel Magic | Abjuration | 1 action | 120 ft | Instant | V, S | bard, wizard |
| Fear | Illusion | 1 action | Self (30 ft cone) | Conc, 1 min | V, S, M | bard, wizard |
| Hypnotic Pattern | Illusion | 1 action | 120 ft | Conc, 1 min | S, M | bard, wizard |
| Leomund's Tiny Hut | Evocation | 1 min (ritual) | Self (10 ft) | 8 hours | V, S, M | bard, wizard |
| Major Image | Illusion | 1 action | 120 ft | Conc, 10 min | V, S, M | bard, wizard |
| Nondetection | Abjuration | 1 action | Touch | 8 hours | V, S, M | bard, wizard |
| Plant Growth | Transmutation | 1 action/8 hr | 150 ft | Instant | V, S | bard |
| Sending | Evocation | 1 action | Unlimited | 1 round | V, S, M | bard, wizard |
| Slow | Transmutation | 1 action | 120 ft | Conc, 1 min | V, S, M | bard, wizard |
| Speak with Dead | Necromancy | 1 action | 10 ft | 10 min | V, S, M | bard, wizard |
| Stinking Cloud | Conjuration | 1 action | 90 ft | Conc, 1 min | V, S, M | bard, wizard |
| Tongues | Divination | 1 action | Touch | 1 hour | V, M | bard, wizard |

---

## Battle Master Maneuvers (16)

| Maneuver | Effect |
|----------|--------|
| Commander's Strike | Forgo one attack → ally uses reaction to attack + superiority die damage |
| Disarming Attack | +superiority die damage. STR save or drop one held item |
| Distracting Strike | +superiority die damage. Next attack by another attacker has advantage |
| Evasive Footwork | +superiority die to AC while moving |
| Feinting Attack | Bonus action → advantage on next attack this turn + superiority die damage |
| Goading Attack | +superiority die damage. WIS save or disadvantage on attacks vs others |
| Lunging Attack | +5 ft reach + superiority die damage |
| Maneuvering Attack | +superiority die damage. Ally can move half speed without opportunity attacks |
| Menacing Attack | +superiority die damage. WIS save or frightened |
| Parry | Reaction: reduce melee damage by superiority die + DEX mod |
| Precision Attack | Add superiority die to attack roll (before or after rolling) |
| Pushing Attack | +superiority die damage. Large or smaller: STR save or pushed 15 ft |
| Rally | Bonus action: ally gains temp HP = superiority die + CHA mod |
| Riposte | Reaction on miss: melee attack + superiority die damage |
| Sweeping Attack | On hit: another creature within 5 ft takes superiority die damage if original roll would hit |
| Trip Attack | +superiority die damage. Large or smaller: STR save or prone |

Source: `MANEUVER_DB` at line 180.

---

## Feats Database (44 feats)

### PHB Feats (38)

| Feat | Half-ASI | Prereq | Summary |
|------|----------|--------|---------|
| Alert | — | — | +5 initiative. Can't be surprised. Hidden attackers don't get advantage |
| Athlete | STR/DEX | — | Stand from prone 5 ft. Climbing no extra cost. Short jump runups |
| Actor | CHA | — | Advantage Deception/Performance for impersonation. Mimic voices |
| Charger | — | — | Dash → bonus action melee (+5 dmg if 10 ft straight) or shove (10 ft) |
| Crossbow Expert | — | — | Ignore loading. No disadvantage at 5 ft. Bonus action crossbow attack |
| Defensive Duelist | — | DEX 13 | Reaction: +proficiency to AC vs melee (finesse weapon required) |
| Dual Wielder | — | — | +1 AC dual wielding. Non-light weapons. Draw/stow two at once |
| Dungeon Delver | — | — | Advantage detecting secrets. Advantage saves vs traps. Trap resistance |
| Durable | CON | — | Min HP from Hit Dice = 2 × CON mod |
| Elemental Adept | — | Spellcasting | Ignore resistance for chosen element. Treat 1s as 2s on damage dice |
| Grappler | — | STR 13 | Advantage on attacks vs grappled. Can pin (both restrained) |
| Great Weapon Master | — | — | Crit/kill → bonus action melee. Heavy weapon: -5 hit/+10 damage |
| Healer | — | — | Stabilize → regain 1 HP. Healer's kit: restore 1d6+4+maxHD HP |
| Heavily Armored | STR | Medium armor | Heavy armor proficiency |
| Heavy Armor Master | STR | Heavy armor | -3 nonmagical bludgeon/pierce/slash while in heavy armor |
| Inspiring Leader | — | CHA 13 | 10 min speech → 6 creatures get temp HP = level + CHA mod |
| Keen Mind | INT | — | Know north, hours to sunrise/sunset. Perfect recall for 1 month |
| Lightly Armored | STR/DEX | — | Light armor proficiency |
| Linguist | INT | — | Learn 3 languages. Create written ciphers |
| Lucky | — | — | 3 luck points/long rest. Extra d20 on attack/check/save |
| Mage Slayer | — | — | Reaction melee on casters within 5 ft. Concentration disadvantage. Save advantage |
| Magic Initiate | — | — | 2 cantrips + 1st-level spell from any class (1/long rest) |
| Martial Adept | — | — | 2 maneuvers + 1 superiority die (d6) |
| Medium Armor Master | — | Medium armor | No Stealth disadvantage. +3 DEX to AC (not +2) |
| Mobile | — | — | +10 ft speed. Dash ignores difficult terrain. No OA from melee targets |
| Moderately Armored | STR/DEX | Light armor | Medium armor + shield proficiency |
| Mounted Combatant | — | — | Advantage vs smaller unmounted. Redirect mount attacks. Mount evasion |
| Observant | INT/WIS | — | +5 passive Perception and Investigation. Read lips |
| Polearm Master | — | — | Bonus action d4 butt-end attack. OA when creatures enter reach |
| Resilient | Any one | — | +1 to chosen ability + save proficiency for that ability |
| Ritual Caster | — | INT/WIS 13 | 2 ritual spells. Copy more from scrolls/books |
| Savage Attacker | — | — | 1/turn reroll melee damage dice, use either |
| Sentinel | — | — | OA → speed 0. OA even on Disengage. Reaction attack when ally targeted within 5 ft |
| Sharpshooter | — | — | No long range disadvantage. Ignore half/3/4 cover. -5 hit/+10 damage |
| Shield Master | — | — | Bonus action shield shove. +shield AC to DEX saves. Reaction: no damage on DEX save success |
| Skilled | — | — | 3 skill or tool proficiencies |
| Skulker | — | DEX 13 | Hide in light obscurement. Missed ranged attack stays hidden. Dim light no Perception penalty |
| Spell Sniper | — | Spellcasting | Double attack spell range. Ignore half/3/4 cover. 1 attack cantrip |
| Tavern Brawler | STR/CON | — | Improvised weapon proficiency. 1d4 unarmed. Bonus action grapple on hit |
| Tough | — | — | +2 HP per level (current and future) |
| War Caster | — | Spellcasting | Advantage concentration saves. Somatic with full hands. Spell as OA |
| Weapon Master | STR/DEX | — | 4 weapon proficiencies |

### Tasha's Cauldron of Everything Feats (6)

| Feat | Half-ASI | Prereq | Summary |
|------|----------|--------|---------|
| Fey Touched | INT/WIS/CHA | — | Misty Step + 1 divination/enchantment spell (1/long rest free) |
| Shadow Touched | INT/WIS/CHA | — | Invisibility + 1 illusion/necromancy spell (1/long rest free) |
| Telekinetic | INT/WIS/CHA | — | Invisible Mage Hand. Bonus action: shove 30 ft (STR save, 5 ft) |
| Telepathic | INT/WIS/CHA | — | 60 ft telepathy. Detect Thoughts 1/long rest free |
| Crusher | STR/CON | — | Bludgeon: move target 5 ft. Crit: advantage on attacks vs target |
| Piercer | STR/DEX | — | Pierce: reroll 1 damage die. Crit: +1 damage die |
| Slasher (Feat) | STR/DEX | — | Slash: -10 ft speed. Crit: disadvantage on target's attacks |
| Skill Expert | Any one | — | 1 skill proficiency + 1 expertise |
| Chef | CON/WIS | — | Cook's utensils proficiency. Short rest: 1d8 extra HP. Long rest: temp HP treats |
| Fighting Initiate | — | Martial weapons | 1 Fighter Fighting Style |
| Eldritch Adept | — | Spellcasting | 1 Eldritch Invocation |
| Metamagic Adept | — | Spellcasting | 2 Metamagic options + 2 sorcery points |
| Gunner | DEX | — | Firearms proficiency. Ignore loading. No 5 ft disadvantage |
| Poisoner | — | — | Bonus action poison application. Poisoner's kit proficiency. Craft potent poison |

Source: `FEATS_DB` at line 200.

---

## D&D Glossary (97 terms)

### Conditions (16)

| Term | Definition |
|------|-----------|
| Prone | Attacks against: advantage if adj (5 ft), disadvantage if ranged. Half movement to stand |
| Blinded | Fails sight checks. Attacks: disadvantage. Attacks against: advantage |
| Stunned | Incapacitated, can't move. Attacks against: advantage. Fails STR/DEX saves |
| Frightened | Disadvantage on checks/attacks while source visible. Can't willingly move closer |
| Grappled | Speed becomes 0. Ends if grappler incapacitated or creature moves out of reach |
| Restrained | Speed 0. Attacks: disadvantage. Attacks against: advantage. DEX saves: disadvantage |
| Incapacitated | Can't take actions or reactions |
| Paralyzed | Incapacitated, can't move or speak. Auto-fail STR/DEX saves. Attacks: advantage (crit within 5 ft) |
| Charmed | Can't attack the charmer. Charmer has advantage on social checks |
| Poisoned | Disadvantage on attack rolls and ability checks |
| Deafened | Can't hear. Auto-fails checks requiring hearing |
| Invisible | Impossible to see without special sense. Attacks: advantage. Attacks against: disadvantage |
| Petrified | Stone. Weight ×10. Incapacitated. Resistance to all damage. Immune to poison/disease |
| Unconscious | Incapacitated, drops items, falls prone. Auto-fail STR/DEX. Attacks: advantage (crit within 5 ft) |
| Exhaustion | Stacks 1–6: disadvantage checks → speed halved → disadvantage attacks/saves → speed 0 → max HP halved → death |
| Concentration | Damaged → CON save (DC 10 or ½ damage). New concentration spell ends previous |

### Combat Actions (15)

| Term | Definition |
|------|-----------|
| Sneak Attack | Rogue: extra 1d6/2 levels/turn with finesse/ranged + advantage OR ally adjacent to target |
| Opportunity Attack | Triggered leaving reach voluntarily. Uses reaction; one melee attack |
| Advantage | Roll two d20s, use higher |
| Disadvantage | Roll two d20s, use lower |
| Reaction | Once per round, immediate response to trigger. Resets on your turn |
| Bonus Action | Additional action beyond main Action (specific abilities grant one) |
| Dash | Extra movement equal to speed this turn |
| Disengage | Movement doesn't provoke OAs this turn |
| Help | Ally gets advantage on check, OR on attack vs creature within 5 ft |
| Dodge | Until next turn: attacks against you disadvantage, DEX saves advantage |
| Ready | Hold action for specified trigger before next turn |
| Shove | Athletics vs Athletics/Acrobatics: push 5 ft or knock prone |
| Grapple | Athletics vs Athletics/Acrobatics: target becomes Grappled |
| Flanking | Optional: two allies on opposite sides → both have melee advantage |
| Cover | Half: +2 AC/DEX. Three-quarters: +5. Full: can't be targeted |

### Saving Throws & Checks (5)

| Term | Definition |
|------|-----------|
| Saving Throw | d20 + ability mod + proficiency (if proficient). Meet/beat DC |
| Ability Check | d20 + ability mod + proficiency (if applicable). Meet/beat DC |
| Difficulty Class | DC target. 5 very easy, 10 easy, 15 medium, 20 hard, 25 very hard, 30 nearly impossible |
| Proficiency Bonus | +2 (L1–4), +3 (L5–8), +4 (L9–12). Added to proficient skills, saves, attacks, spell DCs |
| Expertise | Double proficiency bonus for chosen skill/tool |

### Combat Mechanics (14)

| Term | Definition |
|------|-----------|
| Passive Perception | 10 + Perception mod. Detects hidden creatures, traps, secret doors without rolling |
| Initiative | d20 + DEX mod at combat start. Determines turn order |
| Armor Class | AC target number to hit |
| Hit Points | HP vitality measure. 0 HP = unconscious + death saves |
| Death Save | d20 at 0 HP: 10+ success, 9- failure. 3 successes = stable. 3 failures = death. Nat 20 = 1 HP |
| Temporary HP | Extra HP buffer. Doesn't stack. Lost first. Can't be healed |
| Hit Dice | Short rest healing pool. Roll + CON mod per die. Regain half on long rest |
| Critical Hit | Nat 20: double damage dice, always hits |
| Natural 1 | Auto-miss on attacks regardless of modifiers |
| Two-Weapon Fighting | Light melee attack → bonus action off-hand attack (no ability mod unless Fighting Style) |
| Finesse | Use STR or DEX for attack and damage |
| Versatile | One- or two-handed, two-handed uses higher die |
| Reach | +5 ft melee range (10 ft total). Affects OAs |
| Thrown | Ranged attack using STR, same damage die |

### Weapon Properties (2)

| Term | Definition |
|------|-----------|
| Heavy | Small creatures: disadvantage on attacks |
| Light | Enables two-weapon fighting without Dual Wielder feat |

### Spellcasting (7)

| Term | Definition |
|------|-----------|
| Spell Slot | Resource to cast spells. Higher slots = stronger effects. Recovered on long rest |
| Cantrip | Level 0. At will. Damage scales at 5th, 11th, 17th |
| Ritual | Cast without slot, +10 min cast time |
| Spell Attack | d20 + spellcasting mod + proficiency vs AC |
| Spell Save DC | 8 + proficiency + spellcasting ability mod |
| Components | V = verbal, S = somatic, M = material. War Caster helps with S |
| Upcasting | Higher slot for enhanced effects |

### Resting (2)

| Term | Definition |
|------|-----------|
| Short Rest | 1+ hour. Spend Hit Dice to heal. Some abilities recharge |
| Long Rest | 8 hours (6 sleeping). Full HP, half max Hit Dice, reset most abilities/slots |

### Movement & Terrain (3)

| Term | Definition |
|------|-----------|
| Difficult Terrain | 2 ft cost per 1 ft moved |
| Climbing | 2 ft per 1 ft (1 ft with climb speed). Athletics on difficult surfaces |
| Swimming | 2 ft per 1 ft (1 ft with swim speed). Athletics in rough water |

### Light & Vision (4)

| Term | Definition |
|------|-----------|
| Darkvision | Dim light → bright, darkness → dim (greyscale). Usually 60 ft |
| Dim Light | Lightly obscured. Perception disadvantage (sight) |
| Bright Light | Normal vision |
| Heavily Obscured | Effectively blinded. Darkness, opaque fog, dense foliage |

### Damage Types (3)

| Term | Definition |
|------|-----------|
| Resistance | Half damage from type. Doesn't stack |
| Vulnerability | Double damage from type |
| Immunity | No damage from type. Blocks related conditions |

### Economy & Equipment (2)

| Term | Definition |
|------|-----------|
| Attunement | Short rest, 3 item limit. Some magic items require it |
| Encumbrance | STR ×5 no penalty, ×10 speed -10 ft, ×15 max carry (speed -20 ft, disadvantage) |

### Class Features (9)

| Term | Definition |
|------|-----------|
| Action Surge | Fighter: +1 action on turn. 1/short rest |
| Second Wind | Fighter: bonus action 1d10 + level HP. 1/short rest |
| Cunning Action | Rogue: Dash/Disengage/Hide as bonus action |
| Bardic Inspiration | Bard: bonus action, ally gets die (d6–d12) for attack/check/save |
| Uncanny Dodge | Rogue: reaction to halve damage from visible attacker |
| Extra Attack | 2 attacks per Attack action (3 at 11th, 4 at 20th for Fighter) |
| Superiority Dice | Battle Master: d8 pool (4→5→6 dice). Fuel maneuvers. Short/long rest |
| Lucky | Halfling: reroll nat 1s. Feat: 3 luck points for extra d20s |
| Stone's Endurance | Goliath: reaction 1d12 + CON mod damage reduction. 1/short rest |

### Race Features (2)

| Term | Definition |
|------|-----------|
| Shell Defense | Tortle: action +4 AC, advantage STR/CON saves, speed 0, disadvantage DEX saves, no reactions |
| Breath Weapon | Dragonborn: action elemental damage line/cone. DC 8 + CON + proficiency. 2d6 scaling. 1/short rest |

Source: `TERM_TIPS` at line 263.

---

## V2 Notes

- **XP thresholds** → IndexedDB reference tier. Used by level-up check and XP display.
- **Level-up data** → IndexedDB reference. Drive the level-up wizard. Extend to all classes (v1 only covers Fighter/Rogue/Bard).
- **Spell compendium** → IndexedDB reference. Used by spell validation gate (Gate 4) and character sheet spell picker.
- **Bard spell list** → IndexedDB reference. Class-specific spell access for spell validation.
- **Maneuvers** → IndexedDB reference. Battle Master subclass feature.
- **Feats** → IndexedDB reference. ASI/feat choice during level-up.
- **Glossary** → IndexedDB reference. Powers the mechanic pills / tap-to-source glossary overlay.
- All data is read-only reference — system-owned, never modified by the AI.
