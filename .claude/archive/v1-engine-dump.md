# V1 Engine Dump — Mechanics, Real Data Shapes, Organic State

Extracted from `src/main.js` (10,800+ lines, 30+ sessions of gameplay). This is the ground truth, not the spec.

---

## Part 1: Every Mechanic Key → What It Writes

65 mechanic keys handled by `parseMechanics()`. Format: `key: value` in the AI response's MECHANICS block.

### Character State

| Key | Format | Writes To | Notes |
|-----|--------|-----------|-------|
| `hp` | `Name=value` or `Name=value, Name2=value` | `pc.hp` | Clamped to 0–hp_max. Clears Unconscious/Dying conditions if HP rises above 0. Triggers "PC Down" checkpoint if HP=0 |
| `hp_max` | `Name=value` | `pc.hp_max` | **Warns via toast** — level-up wizard should handle this, not AI |
| `conditions` | `Name+Condition` or `Name-Condition` or `Name=Condition` | `pc.conditions[]` | Add (+/=) or remove (-). Deduplicates. Array of strings |
| `concentration` | `Name=SpellName` or `Name=none` | `pc.concentrating` | Single string or empty |
| `slot_use` | `Name=Level` | `pc.slots[level-1].used++` | Increments used count for that slot level |
| `slot_restore` | `Name=Level` or `Name=all` | `pc.slots[].used=0` | Restores specific level or all slots |
| `resource_use` | `Name, ResourceName` | `pc.resources[].used++` | Fuzzy-matches resource name |
| `resource_restore` | `Name=all` or `Name=ResourceName` | `pc.resources[].used=0` | Restores all or specific resource |
| `xp` | `Name+Amount` or `party+Amount` | `pc.xp += amount` | Triggers `checkLevelUp()`. Injects XP receipt into `_ctxInject`. Warns if delta ≥ existing total (cumulative vs encounter). Dedup check against last 3 messages |
| `shell_defense` | `Name=on/off` | `pc.conditions[]` | Adds/removes Shell Defense + Prone + Incapacitated (campaign-specific) |
| `short_rest` | `Name, Name2` | Toast only | Notes short rest features restored; doesn't auto-restore (player confirms) |
| `pc_update` | `Name, field, value` | `pc[field]` | Whitelisted fields only: name/race/class/level/etc. Dangerous — V2 should restrict |
| `pc_add` | `Name, Race, Class, Level, HP, AC, Init` | `state.pcs.push(...)` | Creates new PC with defaults |
| `pc_delete` | `Name` | `state.pcs.splice(...)` | Requires >1 PC |
| `spell_add` | `PCname\|SpellName\|level\|castTime\|range\|duration\|components\|desc` | `pc.spellbook.push(...)` | Auto-sorts after add. Dedup by name |
| `death_save` | `PCname\|success` or `PCname\|failure` | `pc.death_saves.successes/failures` | Auto-stabilizes at 3 successes (hp=1), death at 3 failures |

### World State

| Key | Format | Writes To | Notes |
|-----|--------|-----------|-------|
| `location` | Location name | `state.worldData.location` | Also appends to `travelLog[]` with old→new transition |
| `time` | Time string | `state.worldData.time` | |
| `weather` | Weather string | `state.worldData.weather` | |
| `loc_desc` | Description | `state.worldData.loc_desc` | Scene description |
| `travel_note` | Note text | `state.worldData.travelLog[last] += note` | Appends to most recent travel log entry |
| `primary_mission` | Mission text | `state.worldData.primaryMission` | Main quest objective |

### Treasury

| Key | Format | Writes To | Notes |
|-----|--------|-----------|-------|
| `gp` | `+50` or `-20` or `100` | `state.treasuryData.gp` | +/- = delta (also creates incomeLog entry), plain number = set. Floors at 0 |
| `sp` | Same as gp | `state.treasuryData.sp` | |
| `cp` | Same as gp | `state.treasuryData.cp` | |
| `ep` | Same as gp | `state.treasuryData.ep` | |
| `pp` | Same as gp | `state.treasuryData.pp` | |
| `income` | `Amount, Category, Description` | `state.treasuryData.incomeLog.push(...)` + `treasuryData.gp` | Categories: sale/quest/misc (in) or overhead/emergency (out). Also adjusts GP. Rejects if description contains "xp" |
| `expense` | `Amount, Description` | `state.treasuryData.incomeLog.push(...)` + `treasuryData.gp` | Always type='out', category='expense'. Floors GP at 0 |

### Inventory

| Key | Format | Writes To | Notes |
|-----|--------|-----------|-------|
| `item_add` | `[target,] ItemName, Qty, Type, Weight` | wagon.cargo, wagon.hoard, partyInventory, or pc.inventory | Target: wagon/cargo/hoard/party/PCname. Default=wagon. Fuzzy-match stacking (dedup). Auto-adds provenance note (time + location) |
| `item_remove` | `Target, ItemName, Qty` | Same arrays | Fuzzy-match by name, decrements qty or removes |
| `wagon_add` | `Name\|Capacity\|Weight\|AC\|Condition` | `state.wagon.{name,capacity,wagonWeight,ac,condition}` | Pipe-separated |
| `wagon_cell_add` | `Name, Size, Temperament, EscDC, Weight` | `state.wagon.cells.push(...)` | Holding cells for creatures |
| `wagon_cell_update` | `Name, Temperament` | `state.wagon.cells[].temperament` | |
| `wagon_cell_remove` | `Name` | `state.wagon.cells.splice(...)` | |
| `wagon_hp` | `Value` | `state.wagon.hp` | |

### Animals & Familiars

| Key | Format | Writes To | Notes |
|-----|--------|-----------|-------|
| `ox_hp` | `Value` | `wagon.animals[draft].hp` + `wagon.ox.hp` | Writes to both old and new animal systems |
| `ox_condition` | `Value` | `wagon.animals[draft].conditions` + `wagon.ox.conditions` | Same dual-write |
| `familiar_hp` | `Name\|HP` | `findAnimal(name).hp` + `pc.familiar.hp` | Writes to both animal registry and PC familiar |
| `animal_hp` | `Name=HP` | `findAnimal(name).hp` | |
| `animal_condition` | `Name=Conditions` | `findAnimal(name).conditions` | |

### Journal / Tracking

| Key | Format | Writes To | Notes |
|-----|--------|-----------|-------|
| `quest_add` | `QuestText` | `state.quests.push(...)` | Dedup by first 30 chars. Extracts discovery paragraph from AI prose. Anchors to current location (adds location history entry). Shows navToast with tap-to-open. Sets `chatMsgId` for message linking |
| `quest_done` | `QuestName` | `quest.status='done'` | Fuzzy matches by text |
| `quest_fail` | `QuestName` | `quest.status='failed'` | |
| `quest_update` | `QuestName\|NoteText` | `quest.notes += note` | Appends to notes |
| `npc_add` | `Name, Disposition, Details` | `state.npcs.push(...)` or updates existing | Also anchors NPC to current location's `npcs[]` array |
| `npc_mood` | `Name=Disposition` | `npc.disposition` | |
| `consequence_add` | `Text\|Type` | `state.consequences.push(...)` | Types: background, faction, environmental, etc. 60% fuzzy dedup. Adds location + timestamp |
| `consequence_resolve` | `Text` | `consequence.resolved=true` | Fuzzy match, adds resolvedTs |
| `town_rep` | `Town, Status, Notes` | `state.worldData.townReputation[]` | Upserts by town name. **Reputation ripple**: if status changes to burned/fled, auto-creates a consequence about word spreading |
| `location_add` | `Name\|Type\|Description` | `state.locations.push(...)` | Types: waypoint, town, dungeon, etc. Updates existing if found. Adds history entry from description |
| `location_visit` | `Name` | `location.status='visited'` + lastVisited | |
| `location_history` | `LocationName\|Text[\|dmOnly]` | `location.history.push(...)` | Optional dmOnly flag |
| `location_investment` | `LocationName\|Description\|Amount` | `location.investments.push(...)` | |

### Combat

| Key | Format | Writes To | Notes |
|-----|--------|-----------|-------|
| `combat_start` | Any | `state.combat.active=true` | Initializes zones if missing. Rejects if combat already active |
| `combat_end` | `Summary` | Resets entire `state.combat` | Writes summary to current location's history. Clears all combat state |
| `zone_move` | `Name\|ZoneId` | `combatant.zone` | Zone IDs: front, back, left, right, air, rear |
| `zone_add_enemy` | `Name\|HP\|AC\|Zone\|Initiative` | `state.combat.list.push(...)` | Auto-activates combat. Dedup by name (rejects if already in combat) |
| `zone_remove` | `Name` | `state.combat.list.splice(...)` | |
| `zone_effect` | `ZoneId\|Effect\|terrain` | `combat.zones[zoneId].effect` or `.terrain` | |
| `zone_label` | `ZoneId\|Label` | `combat.zones[zoneId].label` | Custom zone names |
| `zone_fog` | `ZoneId\|hide/reveal` | `combat.zones[zoneId].hidden` | Fog of war per zone |

### System

| Key | Format | Writes To | Notes |
|-----|--------|-----------|-------|
| `roll_request` | `Skill\|DC\|PCname` | `window._rollRequestQueue.push(...)` | Dedup by skill+pcname. Renders as banner overlay |
| `module_episode` | `EpisodeNum, Status` | `state.moduleProgress[].status` | Auto-completes earlier episodes when later one activates |
| `chapter_add` | `Title\|Content` | `state.storyChapters.push(...)` | |
| `chapter_update` | `Title\|Content` | `storyChapter.content` | Fuzzy match by title |
| `save_game` / `save` | Any | Calls `save()` | |
| `none` | Any | Nothing | Explicit "no mechanics" — prevents false-positive naked mechanic detection |

---

## Part 2: Real Data Shapes (from live gameplay objects)

These are the actual object shapes that accumulated during 30+ sessions of HotDQ play. Fields in **bold** are organic additions not in the original spec.

### Quest Object (real)
```js
{
  text: "Rescue the prisoners from the cultist camp",
  status: "active",           // "active" | "done" | "failed"
  hidden: false,
  done: false,                // legacy bool, redundant with status
  pending: [],                // pending mechanic actions (rarely used)
  chatMsgId: "msg_1718730000", // links to originating DM message for ⚔ chip
  discovery: {
    text: "Governor Nighthill turns to you with urgency...", // AI prose excerpt
    ts: "6/18/2026, 10:15:00 PM"
  },
  location: "Greenest Keep",  // where quest was given
  notes: "Mill is south of town\nUpdate: guards spotted near mill"  // player/AI appended notes
}
```
**Organic fields**: `chatMsgId` (Session 16 — quest announcement linking), `discovery` (Session 16 — auto-extracted prose), `location` (Session 16 — quest anchoring), `notes` (Session 16 — quest_update mechanic). Original spec only had `text, status, hidden, done`.

### NPC Object (real)
```js
{
  name: "Governor Nighthill",
  disposition: "Friendly",     // Friendly/Neutral/Hostile/Unknown
  details: "Human male, governor of Greenest, injured arm in sling",
  status: "active",            // active/dead/missing
  hp: 0,                       // tracked for some NPCs (combatable ones)
  lastSeen: "Greenest Keep",   // auto-set by npc_add to current location
  pending: []                  // pending mechanic actions
}
```
**Organic fields**: `lastSeen` (Session 19 — NPC location tracking), `hp` (was in spec but rarely used — only for NPCs that enter combat). Original spec: `name, disposition, details, status, pending`.

### Location Object (real)
```js
{
  id: "loc_1718730000_a4f2",
  name: "Greenest",
  type: "town",                // town/dungeon/waypoint/camp/temple/etc.
  status: "visited",           // visited/undiscovered
  firstVisited: "Day 1, Dusk",
  lastVisited: "Day 3, Morning",
  rep: {
    disposition: "Friendly",
    notes: "Helped defend the town"
  },
  npcs: ["Governor Nighthill", "Escobert the Red", "Mondath"],  // NPC names anchored here
  investments: [{
    desc: "Donated healing potions to temple",
    amount: 50,
    startDay: "Day 2",
    notes: ""
  }],
  history: [
    { ts: "Day 1, Dusk", text: "Arrived to find the town under attack by cultists and a dragon", dmOnly: false },
    { ts: "Day 1, Night", text: "Quest discovered: Rescue the prisoners", dmOnly: false },
    { ts: "Day 2", text: "Combat ended — Round 6", dmOnly: false },
    { ts: "Day 3", text: "History → Greenest", dmOnly: true }
  ],
  dmNotes: "Cultists will return in 3 days",
  playerNotes: "We need to check the mill",
  mapPos: null                 // {x, y} if placed on area map, null otherwise
}
```
**Organic fields**: `npcs[]` (Session 19 — NPC anchoring by npc_add), `investments[]` (location_investment mechanic), `history[]` with `dmOnly` flag (location_history mechanic), `mapPos` (Session 13 — area map pins). Original spec: `id, name, type, status, firstVisited, lastVisited, rep, dmNotes, playerNotes`.

### Consequence Object (real)
```js
{
  id: "csq_1718730000",
  text: "Word of the incident in Greenest is spreading along trade routes. Merchants, guards, and travelers in nearby settlements may have heard.",
  type: "faction",             // background/faction/environmental/threat
  resolved: false,
  resolvedTs: null,            // ISO string when resolved
  ts: "Day 1, Night",         // game time when created
  location: "Greenest",       // where it originated
  _ripple: true                // **ORGANIC** — auto-generated by reputation ripple system
}
```
**Organic fields**: `_ripple` (Session 9 — reputation ripple auto-consequences, marked so dedup knows it was auto-generated), `location` (Session 19). Original spec: `id, text, type, resolved, ts`.

### Treasury Income Log Entry (real)
```js
{
  desc: "Sold healing potions at Greenest market",
  amt: 25,
  type: "in",                  // "in" or "out"
  category: "sale",            // sale/quest/misc/overhead/emergency/expense
  ts: "Day 2, Morning",
  location: "Greenest"         // **ORGANIC** — added by income/expense handlers
}
```
**Organic field**: `location` — not in original spec, added by the income/expense mechanic handlers to track where transactions happened.

### Wagon Animal Object (real — organic system)
```js
{
  name: "Grit",
  role: "draft",               // draft/familiar/mount/companion
  type: "Tortle",
  hp: 22, hp_max: 22, ac: 17,
  speed: 25,
  conditions: "None",
  feed: "Vegetables",
  backstory: "...",
  personality: "...",
  bonds: {},                   // NPC-style relationship map
  quirks: [],
  experimentLog: "",
  color: "#5a8a5a"
}
// Stored at: state.wagon.animals[]
```
**Entirely organic**. The `wagon.animals[]` array was NOT in the original spec. It grew out of the `wagon.ox` object when the campaign needed multiple animals. `findAnimal()` searches this array. The old `wagon.ox` object still exists for backward compat — mechanics write to BOTH. V2 should pick one system.

### Wagon State (accumulated fields)
```js
state.wagon = {
  // Original spec:
  ox: { name, hp, hp_max, ac, conditions, feed, backstory, personality, bonds, quirks, experimentLog },
  cells: [{name, size, temperament, escDC, weight, notes}],
  cargo: [{name, qty, weight, type, notes, ts, location}],
  hoard: [{name, qty, weight, type, notes, ts, location}],
  hp: 0,                  // wagon hit points
  hp_max: 0,              // wagon max HP
  ac: 11,                 // wagon armor class
  conditions: "",         // wagon conditions string

  // Organic additions:
  wagonName: "The Shelled Alchemist",  // via Setup step 3
  wagonDesc: "A mobile potion shop...", // via Setup step 3
  animals: [{...}],                     // parallel animal registry (see above)
  name: "Cart",                         // from wagon_add mechanic (different from wagonName!)
  capacity: 1080,                       // from wagon_add mechanic
  wagonWeight: 400,                     // from wagon_add mechanic
  condition: "Good"                     // from wagon_add mechanic (different from conditions!)
}
```
**Critical organic mess**: `wagonName` vs `name` (two name fields from different sources), `conditions` vs `condition` (plural from spec, singular from mechanic), `ox` vs `animals[]` (dual animal systems). V2 must consolidate.

---

## Part 3: Organic State Drift — Fields Not in Original Spec

These fields exist in the codebase and are read/written during gameplay but were never part of the original design. They crept in session by session.

### Top-Level State Fields (organic)

| Field | Added | Purpose | Still Used? |
|-------|-------|---------|-------------|
| `state.classData` | Session 25, v14 | Imported class progression data for level-up wizard. Keyed by class name | Yes — drives `_getLevelUpData()` |
| `state.sessionArchive[]` | Session 10 | Rolling AI summary archive (50-cap). `{ts, gameTs, summary, msgCount}` | Yes — feeds `prevSessionSummary` |
| `state.prevSessionSummary` | Session 10 | Last 3 session archive summaries joined. Used in buildPrompt context | Yes |
| `state.headerShortcuts[]` | Session 13 | Customizable ☰ header menu shortcut IDs | Yes |
| `state.campaignSetup` | Session 22 | Session Zero responses persisted for buildPrompt injection | Yes |
| `state.moduleReference` | Session 21 | Imported module content (markdown/PDF) — reference episodes | Yes |
| `state.dmSecrets` | Session 19 | DM-only text field, separate from worldData.secrets | Yes |
| `state.qaFabIcon` | Unknown | Customizable QA floating button icon | Yes but rarely used |
| `state._locDmMode` | Session 19 | Location detail sheet DM mode toggle | Yes |
| `state._ts` | Session 24 | Dirty-edit timestamp for Firebase sync guard | Yes — critical for sync |
| `state.activeSceneIdx` | Early | Active scene index (scenes panel, mostly unused now) | Barely — scenes panel rarely used |

### PC Fields (organic — added to `pc` objects over sessions)

| Field | Added | Purpose |
|-------|-------|---------|
| `pc.attacks[]` | Session 14 | Attack entries: `{name, bonus, damage, notes}` |
| `pc.spellbook[]` | Session 15 | Known spells: `{name, level, castTime, range, duration, components, desc}` |
| `pc.hp_temp` | Session 23 | Temporary hit points |
| `pc.exhaustion` | Session 23 | 0–6 exhaustion level |
| `pc.hd_used` | Session 23 | Hit dice spent (for short rest healing) |
| `pc.death_saves` | Session 23 | `{successes: 0, failures: 0}` |
| `pc.inspiration` | Session 23 | Boolean |
| `pc.personality` | Session 23 | Roleplay text |
| `pc.ideals` | Session 23 | Roleplay text |
| `pc.bonds` | Session 23 | Roleplay text |
| `pc.flaws` | Session 23 | Roleplay text |
| `pc.familiar` | Session 19 | `{name, type, ac, hp, hp_max, abilities}` or null |
| `pc.skillProfs[]` | Session 15 | Array of proficient skill names (replaced freetext inference) |
| `pc.languages[]` | Session 17 | Known language strings |
| `pc.sheetLocked` | Session 14 | Boolean — lock/unlock edit mode |
| `pc.levelReady` | Session 23 | Boolean — XP threshold reached, wizard ready |
| `pc.subclass` | Session 15 | e.g. "Battle Master", "College of Lore" |
| `pc.color` | Session 1 | Hex color for tokens/borders |

### WorldData Fields (organic)

| Field | Added | Purpose |
|-------|-------|---------|
| `worldData.loc_desc` | Session 13 | Current location scene description |
| `worldData.scene_title` | Session 19 | Current scene title |
| `worldData.scene_threat` | Session 19 | Scene threat level |
| `worldData.scene_cond` | Session 19 | Scene conditions |
| `worldData.premiseLocked` | Session 22 | Boolean — prevents accidental premise overwrites |
| `worldData.businessProfile` | Session 9 | `{name, wagonName, realStock, snakeOil, reagents, reputation, notes}` — campaign-specific business tracking |
| `worldData.campaignSecrets[]` | Session 19 | `{text, playerKnown, pending, aiOnly}` — secrets with visibility flags |

### Cargo/Inventory Fields (organic)

| Field | Added | Purpose |
|-------|-------|---------|
| `item.ts` | Session 14 | Timestamp when item was acquired |
| `item.location` | Session 14 | Location where item was acquired |
| `incomeLog[].location` | Session 14 | Location where transaction occurred |
| `consequence._ripple` | Session 9 | Boolean — marks auto-generated reputation consequences |
| `consequence.location` | Session 19 | Where consequence originated |
| `consequence.resolvedTs` | Session 19 | ISO timestamp when resolved |
| `quest.chatMsgId` | Session 16 | Links quest to originating DM message for ⚔ chip display |
| `quest.discovery` | Session 16 | `{text, ts}` — auto-extracted prose paragraph from AI response |
| `quest.location` | Session 16 | Where quest was given |
| `quest.notes` | Session 16 | Player/AI-appended notes via quest_update |

### Combat Fields (organic)

| Field | Added | Purpose |
|-------|-------|---------|
| `combat.zones` | Session 12 (v12 gate) | 6-zone grid: `{front, back, left, right, air, rear}` each with `{label, effect, terrain, hidden}` |
| `combat.moveMode` | Session 12 | 'ai' or 'manual' — who controls token movement |
| `combatant.zone` | Session 12 | Which zone the combatant is in |
| `combatant.condDurations` | Session 17 | `{condName: roundsRemaining}` — per-condition round tracking |

---

## Part 4: Validation & Post-Parse Guards

After `parseMechanics()` applies changes, `_validateMechanics()` runs these auto-corrections:

- **HP clamped** to 0–hp_max (prevents negative HP or over-healing)
- **Slot usage clamped** to 0–max per level
- **Resource usage clamped** to 0–max
- **Treasury floored** at 0 (no negative gold)
- **Conditions deduplicated** (no double Prone)
- **Encumbrance warnings** — PC carry weight > STR×15, wagon weight > 1080lb
- **Income log dedup** — same desc+amt+type within recent window → skip
- **hp_max increase guard** — toasts error warning when AI increases hp_max

### Pre-Parse Rejections (lines dropped before processing)

- Value is `none`, `0`, or starts with `0,`
- `combat_start` when combat already active
- `zone_add_enemy` when combatant name already in combat list
- Currency mechanic containing "xp" (confused AI thinking XP is gold)
- `xp` that's a duplicate of the last 3 messages' XP award (same amounts)
- `income` description containing "xp"

---

## Summary: What V2 Would Miss If Specced From Scratch

1. **Dual animal systems** — `wagon.ox` and `wagon.animals[]` coexist. Mechanics write to both. Must consolidate
2. **Dual wagon naming** — `wagon.wagonName` (Setup) vs `wagon.name` (mechanic). Must pick one
3. **Dual wagon condition** — `wagon.conditions` (plural, spec) vs `wagon.condition` (singular, mechanic)
4. **Quest discovery extraction** — AI prose is auto-scanned for quest-related sentences. This was not specced but adds immense value
5. **Quest → message linking** — `chatMsgId` links quests to the DM message that introduced them. Enables ⚔ chips on chat messages
6. **Location anchoring** — Quests, NPCs, consequences, and income all auto-tag with current location when created
7. **Reputation ripple** — Burning/fleeing a town auto-creates a spreading-word consequence. Emergent behavior that became a core feature
8. **Item provenance** — Items get `ts` and `location` noting when/where they were acquired. Never specced, always useful
9. **XP receipt injection** — After XP is applied, real values are injected into the AI's next context so it can't hallucinate totals
10. **Pre-parse rejection** — An entire layer of "things the AI tries to do that we silently drop." This IS enforcement, just pre-gate
11. **Mechanic receipt** — `_lastMechReceipt` captures applied + rejected mechanics for AI awareness next turn
12. **The `pending` field** — On PCs, NPCs, and quests. Rarely used but present everywhere. Was meant for async mechanic resolution
13. **`findPC()` fuzzy matching** — PC lookup by name is case-insensitive, partial-match. AI sends "slasher" and it finds "Slasher". Every mechanic depends on this
14. **`findAnimal()` fuzzy matching** — Same pattern for animals: exact, startsWith, first-word match
15. **Death save auto-resolution** — 3 successes = stabilize (hp=1, reset saves). 3 failures = death toast. Not just tracking
