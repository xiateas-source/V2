# V1 Engine Reference — For V2 Development

*Extracted from `src/main.js`. The three most-tested pieces of v1: how the prompt is built, what the state ledger looks like, and how mechanics are parsed.*

---

## buildPrompt() — How the System Prompt is Assembled

**Location:** `src/main.js:5538`

**Assembly order (top to bottom of the system prompt):**

1. **Contract 1: DM Persona** (`ai-persona`) — tone, campaign setting, character addressing rules
2. **Locked Campaign Premise** (if set) — fixed facts the AI cannot contradict
3. **Session Zero** — tone, party origin, goal, content boundaries (Lines & Veils)
4. **Contract 2: Never Do** (`ai-never`) — hard prohibitions + inventory integrity guard
5. **Contract 3: Actions** (`ai-actions`) — roll procedure, when to call for checks, pacing rules
6. **Contract 4: Continuity** (`ai-continuity`) — state verification, wagon tracking, time tracking
7. **Contract 5: Multi-Player** (`ai-multi`) — per-character addressing, player agency, combat turns
8. **Contract 6: Mechanics Block** (hardcoded) — the full format spec, key reference, combat zone system, critical rules
9. **Contract 9: Module Fidelity** (if module loaded) — published module rules, episode tracker, active episode content
10. **Contract 7: Secret DM Notes** (if set) — AI-only information
11. **Contract 8: Reference Material** (active snippets) — scene/snippet text injected as reference
12. **Campaign History** (session summaries) — auto-archived previous session recaps
13. **Current Campaign State** — the genLedger() output (see below)

**Input:** `buildPrompt(ledger)` — takes the ledger string from genLedger()

**Contract source:** Contracts are read from `state.aiContracts` (Firebase-synced) with DOM element fallback. Key mapping via `_CONTRACT_KEYS`:
- `persona` → `ai-persona`
- `never` → `ai-never`
- `actions` → `ai-actions`
- `continuity` → `ai-continuity`
- `multi` → `ai-multi`

**Hardcoded elements (not editable by player):**
- Contract 6 (mechanics format spec) — hardcoded in buildPrompt, includes wagon capacity from `getMaxLb()`
- Inventory integrity guard — always appended after Contract 2
- Module fidelity rules (Contract 9) — generated from `state.moduleProgress`

**Token budget concern:** The prompt includes everything above plus the full ledger. For a party at Day 26 with full quests, NPCs, inventory, module progress, and session summaries, this can exceed 7,000 tokens in the system prompt alone.

---

## genLedger() — The Compact State Summary

**Location:** `src/main.js:3829`

**Two modes:** `compact` (default, used in prompt) and `full` (used in manage/debug)

### Compact Mode (what goes into buildPrompt)

```
=== CAMPAIGN COMPACT STATE ===
Location: Hunting Lodge Ruins | Time: Day 26, 01:15 AM | Weather: Clear

Valenns Vogelsang (Half-Elf Wizard (Illusionist) Lv5): HP 33/33 | AC 14 | Slots: L1:3/4 L2:1/3 L3:0/2 | Carry: 45.2/150lb
Slasher (Dragonborn Fighter (Eldritch Knight) Lv5): HP 43/43 | AC 18 | Slots: L1:2/3 | Carry: 82.0/240lb
Aria Windchime (Tiefling Bard (College of Eloquence) Lv5): HP 37/37 | AC 15 | Carry: 28.5/120lb

[Combat block if active — see below]
Ol' Rivet (draft): HP 18/18 | Feed: Hay
Treasury: GP 247
=== END COMPACT ===
```

**Compact includes:** Location/time/weather, each PC's name/race/class/level/HP/AC/conditions/concentration/resources/slots/carry weight, wagon animals, treasury GP.

**Compact does NOT include:** Stats, skills, features, magic, inventory details, quests, NPCs, backstory, travel log, secrets, reputation. These are in the full ledger only.

### Full Mode (debug/manage, also used when AI needs more context)

Sections in order:

```
=== HOARD OF THE DRAGON QUEEN — CAMPAIGN STATE LEDGER ===

━━━ PARTY STATUS ━━━
[Each PC: full stats, skills with computed bonuses, features, magic, spell slots, backstory, inventory with weights]

━━━ WORLD ━━━
[Time, season, weather, location, location description, active scene, scene conditions]

━━━ TREASURY ━━━
[PP, GP, EP, SP, CP]

━━━ PARTY INVENTORY ━━━
[Shared items not on a specific PC]

━━━ WAGON & TRANSPORT ━━━
[Animals with HP/AC/feed/conditions, cargo weight, holding cells, cargo items, hoard items]

━━━ QUESTS ━━━
[Main quest + all quest entries with status]

━━━ NPCs ━━━
[All non-deceased NPCs with disposition, HP, details]

━━━ PLOT ━━━
[DM plot notes if set]

━━━ SESSION SUMMARY ━━━
[Previous session summary if exists]

━━━ STORY CHAPTERS ━━━
[Chapter list with titles and dates]

━━━ ACTIVE COMBAT — ROUND N ━━━
[If combat active: movement mode, zone layout with all combatants, adjacency rules]

━━━ CAMPAIGN PROGRESS ━━━
[Module name, episode progress tracker]

━━━ TOWN REPUTATION ━━━
[Town names with status and notes]
[Reputation Ripple section if any towns burned/fled]

━━━ BUSINESS PROFILE ━━━
[If party has a business: real stock, snake oil, reputation]

━━━ ACTIVE CAMPAIGN THREADS ━━━
[Player-known campaign secrets]

━━━ PARTY RELATIONSHIPS ━━━
[Dynamic relationship entries, public only]

━━━ WORLD CONSEQUENCES (active) ━━━
[Unresolved consequences with type and location]

=== END LEDGER ===
```

### Combat Ledger Block (injected into compact when combat active)

Generated by `_combatLedgerBlock()`:
```
ACTIVE COMBAT — ROUND 3
Movement: ai-controlled
Zone layout:
  [Frontline]
    >>> 15 Slasher HP:43/43 AC:18
    9 Dragonclaw 1 HP:22/22 AC:14
  [Backline]
    22 Aria HP:37/37 AC:15
  [Rear Guard]
    15 Valenns HP:33/33 AC:14
Adjacency: Front↔Left, Front↔Right, Front↔Back, Front↔Air, Back↔Rear
```

`>>>` marks the current turn in initiative order.

---

## parseMechanics() — The Contract Between AI Output and Code

**Location:** `src/main.js:5663`

### Expected Format

```
---MECHANICS---
key: value
key: value
---END---
```

### Detection Strategy (in fallback order)

1. `---MECHANICS---` ... `---END---` (preferred)
2. `MECHANICS BLOCK:` ... `---END---`
3. `MECHANICS BLOCK:` ... next double-newline + capital letter
4. `---MECHANICS---` ... end of response (missing ---END---)
5. `MECHANICS:` ... `---END---` or end
6. Any text after a "mechanics" header
7. **Naked mechanic lines** — no header at all, just `key: value` lines matching known keys anywhere in the response

### Pre-processing

- Strips bold (`**`) and italic (`*`) from response before parsing
- Unwraps bracketed mechanics: `[quest_add: text]` → `quest_add: text`
- Splits pipe-separated mechanics: `xp:party+100 | quest_done:...` → separate lines
- Handles AI prefixing lines with character names: `Slasher: hp: Slasher=40` → `hp: Slasher=40`
- Strips bullet markers (`-`, `*`, `•`)

### All 65 Mechanic Keys

```
hp | hp_max | conditions | concentration | location | time | weather |
travel_note | loc_desc | gp | sp | cp | ep | pp | item_add | item_remove |
slot_use | slot_restore | resource_use | resource_restore | shell_defense |
wagon_add | wagon_cell_add | wagon_cell_update | wagon_cell_remove |
wagon_hp | ox_hp | ox_condition | familiar_hp | animal_hp | animal_condition |
income | expense | xp | quest_add | quest_done | quest_fail | quest_update |
primary_mission | npc_add | npc_mood | pc_update | pc_add | pc_delete |
module_episode | short_rest | town_rep | save_game | save | spell_add |
sp_charge | consequence_add | consequence_resolve | chapter_add |
chapter_update | location_add | location_visit | location_history |
location_investment | roll_request | zone_move | zone_add_enemy | zone_remove |
zone_effect | zone_label | combat_start | combat_end | zone_fog | none
```

### Key Format Reference

**Character state:**
```
hp: Name=value                          # set HP (clamped to 0..hp_max)
hp: Name1=val, Name2=val               # multiple in one line
hp_max: Name=value                      # set max HP (flags warning if AI sets this)
conditions: Name+condition              # add condition
conditions: Name-condition              # remove condition
concentration: Name=spell               # set concentration
concentration: Name=none                # clear concentration
slot_use: Name=level                    # use a spell slot
slot_restore: Name=level|all            # restore slots
resource_use: Name,ResourceName         # use a class resource
resource_restore: Name=all              # restore all resources
short_rest: Name                        # note short rest features restored
xp: Name+amount                         # XP DELTA (not total!)
xp: party+amount                        # same amount to all PCs
```

**Economy:**
```
income: amount, category, description   # categories: reward/found/loot/quest/trade
expense: amount, description            # deducts from GP
gp: +amount | -amount | absolute        # direct GP manipulation
```

**Items:**
```
item_add: target, name, qty, type, weight    # target: wagon/cargo/hoard/party/PCname
item_remove: target, name, qty               # remove from target
```

**World state:**
```
location: Name                          # updates location, adds to travel log
time: value                             # updates game time
weather: value                          # updates weather
loc_desc: text                          # updates location description
travel_note: text                       # annotates current travel leg
town_rep: town, status, notes           # status: neutral/friendly/hostile/burned/fled
```

**Story tracking:**
```
quest_add: Title|description            # new quest (deduplicates)
quest_done: partial_title               # fuzzy match, marks done
quest_fail: partial_title               # fuzzy match, marks failed
quest_update: name|notes                # append notes to quest
primary_mission: text                   # set main quest
npc_add: name, disposition, details     # add or update NPC
npc_mood: name=mood                     # update NPC disposition
consequence_add: text|type              # types: background/faction/etc
consequence_resolve: partial_text       # fuzzy match, marks resolved
chapter_add: Title | content            # story chronicle entry
chapter_update: partial_title | content # update existing chapter
module_episode: N, active|complete      # advance episode tracker
```

**Location tracking:**
```
location_add: Name|Type|Description     # types: waypoint/town/dungeon/etc
location_visit: Name                    # mark as visited
location_history: Name|Text|dmOnly      # add history entry
location_investment: Name|Desc|Amount   # track party investment
```

**Combat:**
```
combat_start: description               # activates combat mode
combat_end: summary                     # clears combat, logs to location
zone_add_enemy: Name|HP|AC|Zone|Init    # zones: front/back/left/right/air/rear
zone_remove: Name                       # remove from combat
zone_move: Name|Zone                    # move to zone
zone_effect: Zone|Effect|Type           # add zone effect (type: terrain/difficult)
zone_label: Zone|Label                  # rename a zone
zone_fog: Zone|hide|reveal              # fog of war
roll_request: Skill|DC|PCname           # request a roll from player
```

**Other:**
```
spell_add: PC|Name|Level|CastTime|Range|Duration|Components|Desc
familiar_hp: Name|HP
animal_hp: Name=HP
death_save: Name|success/failure
pc_update: Name,field,value
pc_add: Name,Race,Class,Level,HP,AC,Init
pc_delete: Name
```

### Built-in Validation (already in v1 parseMechanics)

- **Junk value filter:** Lines with value `none`, `0`, or `0,...` are silently dropped
- **Combat dedup:** `combat_start` rejected if combat already active; `zone_add_enemy` rejected if name already in combat list
- **XP-as-gold guard:** `income:` or currency keys containing "xp" → rejected with message "XP is not currency"
- **XP duplicate detection:** Compares XP amounts against last 3 messages, rejects if identical
- **XP sanity check:** If delta ≥ previous total, flags "looks like a total — should be encounter-only"
- **hp_max warning:** If AI sets hp_max, emits warning "level-up wizard should handle this"
- **Quest dedup:** `quest_add` checks first 30 chars against existing quests, skips if match
- **NPC dedup:** `npc_add` updates existing NPC instead of creating duplicate
- **Consequence dedup:** Fuzzy match (60% word overlap) against existing consequences

### Post-Parse Actions

After all mechanics applied:
1. `checkLevelUp(pc)` — checks if any PC crossed XP threshold
2. `_autoOpenLevelUp()` — triggers level-up wizard if threshold met
3. `save()` — persists to localStorage + Firebase
4. Re-renders: character tabs, cards, status, sheets, NPCs, quests, consequences, combat, wagon, world, module tracker
5. `mechToast(changes)` — shows notification pills for all applied changes
6. Builds `_lastMechReceipt` — "[MECHANICS RECEIPT] Applied: ... Rejected: ..." for context injection

### Context Injection After XP

When XP is applied, the engine injects into the next AI message:
```
[XP APPLIED] Current XP: Valenns 2400/6500 (Lv5), Slasher 2400/6500 (Lv5), Aria 2400/6500 (Lv5). These are the REAL values — trust them.
```
This prevents the AI from recalculating XP from scratch and emitting cumulative totals.

---

## What V2 Should Carry Forward

**From buildPrompt():**
- Contract ordering (persona → prohibitions → actions → continuity → multi-player → mechanics → module → secrets → history → state)
- Module fidelity injection (episode tracker, active content)
- Active consequence injection
- Session summary as context
- The inventory integrity guard

**From genLedger():**
- Compact mode for prompt budget (essential stats only)
- Full mode for debug/reference
- Computed skill bonuses (proficiency + expertise detection)
- Combat block format with zone layout and current turn marker
- Carry weight tracking per PC
- Token estimation (`chars / 4`)

**From parseMechanics():**
- Flexible detection (the AI WILL drift on format — naked line fallback is essential)
- Pre-processing (strip bold/italic, unwrap brackets, split pipes)
- Built-in dedup for quests, NPCs, consequences, XP
- XP-as-gold guard
- hp_max warning (system-owned field)
- Post-parse level-up check
- Mechanics receipt for context injection
- The 65-key dispatch table structure

**V2 additions (from enforcement spec):**
- Roll confirmation gate (before applying any roll-dependent mechanic)
- Scene transition gate (before applying location/time changes)
- Unmentioned PC flag (after parsing)
- Spell validation (before applying slot_use)
- Drift detection (after parsing, scan narrative for unlogged changes)
- Combat turn enforcement (during combat, validate current turn)
- XP audit (after quest_done/combat_end, check for XP)
- Income audit (after item_add with treasure type, check for income)
