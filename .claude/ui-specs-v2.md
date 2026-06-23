# V2 UI Specs — Character Sheet, Cargo, Journal, Treasury, Combat

Extracted from v1 codebase (src/main.js, features.md, ai-failures.md). Each spec covers: what exists, what broke, field inventory with ownership, V2 layout, and tap flows. Detailed enough for an agent to build without guessing.

---

## 1. Character Sheet

### V1 Problems
- **No field ownership** — player, AI, and system could all write to any field. AI set `hp_max`, `level`, `class`, `features`, `spells`, `slots` via mechanics — corrupted system-owned data. Led to SHEET_FIELDS bug that required two migration gates (v10, v11) to fix.
- **Lock/unlock was cosmetic** — `sheetLocked` toggled edit mode on the overview, but `parseMechanics()` still wrote to locked fields.
- **Edit sheet and overview were separate views** — `renderSheets()` (full edit form in Party tab) vs `renderPCOverview()` (bottom sheet with 6 read tabs). Duplicate rendering logic, different field coverage.
- **No re-entry to level-up wizard** — once a level-up choice was made or skipped, no way to fix system-owned fields.

### Field Inventory & Ownership

| Field | Owner | Can Edit | AI Can Write | Notes |
|-------|-------|----------|-------------|-------|
| `name` | Player | Always | No | Identity field |
| `race` | System | Creation wizard | No | System-owned (S31). Affects bonuses. Set once at creation. |
| `class` | System | Level-up wizard | No | Set by wizard, never by AI mechanic |
| `subclass` | System | Level-up wizard | No | |
| `level` | System | Level-up wizard | No | XP threshold triggers wizard |
| `background` | System | Creation wizard | No | System-owned. Set at creation, locked during play. |
| `alignment` | System | Creation wizard | No | System-owned. Set at creation, editable via manual override (unlock). |
| `hp` | AI (player override) | Vitals tab +/- | Yes (`hp:` mechanic) | AI-owned (S31). Player inline +/- uses `aiSet()` with `player_override` flag, logged for audit. Clamped to 0–hp_max |
| `hp_max` | System | Level-up wizard only | No | hp_max guard rejects AI writes |
| `hp_temp` | System + AI | Combat tab | Yes (`hp_temp:` mechanic) | Temporary HP |
| `ac` | Player | Edit mode | No | Could be calc'd in V2 (base + armor + shield + dex) |
| `initiative` | Derived | No direct edit | No | DEX modifier + proficiency if applicable |
| `speed` | Player | Edit mode | No | Race-based default |
| `str/dex/con/int/wis/cha` | System | Level-up wizard (ASI) | No | Base scores. Modifier = floor((score-10)/2) |
| `xp` | System + AI | Tap to edit, `xp:` mechanic | Yes (encounter deltas only) | XP receipt injection validates |
| `skillProfs[]` | System | Level-up wizard, checkboxes | No | Array of proficient skill names |
| `slots[{max,used}]` | System | Level-up sets max, AI/player toggle used | Partial (`slot:` mechanic decrements used) | Max = wizard, Used = gameplay |
| `resources[{name,max,used,restore,desc}]` | System | Level-up wizard adds, player edits | Partial (can decrement used) | Second Wind, Bardic Inspiration, etc. |
| `conditions[]` | AI + Player | Combat condition picker | Yes (`conditions:` mechanic) | Deduplicated. Combat-only conditions auto-clear on endCombat |
| `concentrating` | AI | End button in combat | Yes (`concentration:` mechanic) | Single spell name or empty |
| `features` | System | Level-up wizard | No | Text block of class/race features |
| `magic` | Player | Edit mode | No | Spellcasting notes (freeform text) |
| `spellbook[]` | System + Player | Wizard adds, compendium browse, manual add | No | Array of known spells |
| `attacks[]` | Player | Edit mode | No | {name, bonus, damage, notes} |
| `inventory[]` | Player + AI | Edit mode, `add_item:` mechanic | Yes (add only) | Per-PC carried items |
| `familiar` | Player | Edit mode | Partial (`familiar_hp:`) | {name, type, ac, hp, hp_max, abilities} |
| `backstory_origin/motivation/secret` | Player | Edit mode | No | Roleplay text |
| `personality/ideals/bonds/flaws` | Player | Edit mode | No | Roleplay text |
| `color` | Player | Color picker | No | Character accent color |
| `exhaustion` | AI + Player | Combat tab pips | Yes | 0–6 scale |
| `hd_used` | System | Combat tab pip tap | No | Hit dice spent (short rest healing) |
| `death_saves` | Player | Combat tab tap | No | {successes, failures} — 0–3 each |
| `inspiration` | AI + Player | Tap toggle | Yes | Boolean |
| `sheetLocked` | Player | Lock/unlock button | No | V2: enforcement is real, not cosmetic |
| `levelReady` | System | Auto-set by XP threshold | No | Triggers level-up wizard |
| `languages[]` | Player | Edit mode | No | Known languages |

### V2 Layout — Mobile Phone (one screen, 6 tabs)

> **Note:** Tab names and contents updated to match decisions.md (S31). See workboard.md Phase 4 for the full authoritative spec (header, swipe, lock bar, "what changed" badges, roll-anything, etc.).

```
┌─────────────────────────────────────┐
│ [←]  Slasher                    [🔒] │  ← fixed header: name, lock toggle
│ Fighter (Battle Master) Lv.3 — Human │
│ [OK] / [HURT] / [DOWN] badge    [📤] │
├─────────────────────────────────────┤
│ 42/45 HP  AC 18  Init +2  Spd 30ft  │  ← always-visible stat strip
│ ████████████████████░░░  HD: 2/3d10  │  ← HP bar + hit dice
│ Prof: +2  PP: 14  ☆ Inspiration      │
│ ───── XP: 900 / 2700 ─────────────  │  ← XP bar (tappable)
├─────────────────────────────────────┤
│ [Stats] [Vitals] [Spells] [Features] │  ← 6 tab row
│ [Equipment] [Bio]                    │
├─────────────────────────────────────┤
│                                     │
│  (tab content scrolls here)         │
│                                     │
└─────────────────────────────────────┘
```

### Tab Contents

**Stats** — 3×2 ability score grid (large number + modifier, tappable to roll). Saving throws list (prof dot + modifier, tappable to roll). Skills (18 rows, prof/expertise dots, tappable to roll). Quick reference: Initiative, Proficiency bonus, Speed, Passive Perception, Passive Investigation.

**Vitals** — HP controls (+/- buttons with amount input, temp HP). AC display with source breakdown. Attacks (tappable to roll). Conditions (chip row + duration counters). Concentration badge with end button. Death saves (heart/skull pips). Hit dice pips (tap to spend, shows heal estimate). Exhaustion pips (0–6). Familiar/mount card (if any). Rest buttons (Short/Long).

**Spells** — Spell Save DC / Spell Attack (tappable) / Spellcasting Ability at top. Concentration pinned spell with End button. Spell slot pips per level. Known spells grouped by level (expand for casting time, range, duration, V/S/M component badges, description). Cantrips. Browse Compendium button.

**Features** — Class features (sorted by acquisition level). Racial traits. Resources with pip counters (Second Wind, Action Surge, Superiority Dice, etc.). Feats. Proficiency tag chips.

**Equipment** — Encumbrance bar (current weight / STR×15 capacity). Items with type tags and acquisition metadata. Party currency footer with "Tap for full Treasury" link. "Wagon & Hoard in Cargo tab" link.

**Bio** — Race reference card (from compendium: lore, traits, size, speed, age). Identity (Background, Alignment, Languages — system-owned). Appearance, Personality, Backstory, Notes (player-owned, tap to edit).

### Tap Flows

| User Action | What Happens |
|-------------|-------------|
| Tap ability score (locked) | Roll d20 + modifier, show result in roll strip |
| Tap skill row | Roll d20 + skill modifier, show result in roll strip |
| Tap saving throw row | Roll d20 + save modifier, show result in roll strip |
| Tap XP bar | Prompt to set XP manually |
| Tap HP number (locked) | Prompt to set HP |
| Tap lock/unlock 🔒/🔓 | Toggle `sheetLocked` — unlocked shows edit inputs on applicable fields |
| Tap condition chip | Remove that condition (with confirmation if negative) |
| Tap hit die pip (unspent) | Spend HD: roll d{hitDie} + CON mod, heal, mark pip spent |
| Tap exhaustion pip | Set exhaustion to that level |
| Tap death save heart/skull | Toggle that save pip |
| Tap inspiration star | Toggle inspiration boolean |
| Tap spell in spellbook | Show spell detail (description, components, duration) |
| Tap 📤 export | Copy character JSON to clipboard |

### Level-Up Wizard (overlay, not tab)
Triggered when `levelReady = true`. Steps:
1. HP increase (roll or average + CON mod)
2. ASI or Feat (at appropriate levels)
3. New features (auto-populated from class data)
4. Spell changes (if caster — learn new, optionally swap one)
5. Confirm → system writes to all system-owned fields atomically

**V2 addition: re-entry.** "Redo Level N Choices" button in Features tab. Opens wizard in edit mode for that level's decisions only.

---

## 2. Cargo / Inventory

### V1 Problems
- Three separate inventory arrays with near-identical rendering (`partyInventory`, `wagon.cargo`, `wagon.hoard`) plus per-PC `inventory[]`. Shared `_renderInvChips()` helper, but 4 different add/edit/delete function sets.
- Wagon/cargo was campaign-specific (ox, holding cells) — not generalizable.
- No weight tracking aggregation (individual items had weight, but no "you're carrying X of Y lbs" rollup).
- Type categorization was manual tags, no enforcement.

### V1 State Structure
```
partyInventory: [{name, qty, weight, type, notes}]           // party shared
wagon.cargo: [{name, qty, weight, type, notes, ts, location}] // wagon cargo
wagon.hoard: [{name, qty, weight, type, notes, ts, location}] // stored treasure
pc.inventory: [{name, qty, weight, type, notes}]              // per-PC carried
```
Type values: `supply, foraged, ingredient, trade, loot, hoard, misc, key`
PC item types: `weapon, armor, shield, ammo, potion, scroll, wand, ring, misc, tool, instrument, gear, clothing, container, mount, food, material`
Gear types (equipped): `weapon, armor, shield`

### V2 Layout — Three Containers

```
┌─────────────────────────────────────┐
│ 📦 Cargo                            │
│ [Carried ▾] [Wagon] [Hoard]         │  ← container tabs
├─────────────────────────────────────┤
│ Carried: Slasher ▾                  │  ← PC selector (Carried only)
│ 47 / 240 lbs (STR 16 × 15)         │  ← weight / capacity
├─────────────────────────────────────┤
│ ⚔ Equipped                          │
│ [Longsword ×1] [Chain Mail] [Shield]│  ← chip layout
│                                     │
│ 🎒 Carried                          │
│ [Rations ×10] [Rope 50ft] [Torch×5]│
│                     [+ Add Item]    │
├─────────────────────────────────────┤
│ [All 12] [Supply 3] [Loot 4] ...   │  ← type filter bar
│ 🔍 [search...]                      │  ← search bar
└─────────────────────────────────────┘
```

**Carried tab**: PC selector dropdown at top. Shows selected PC's personal inventory. Weight / capacity bar. Split into Equipped (gear types) and Carried (everything else). Each item is a chip — tap to expand inline edit (name, qty, weight, type dropdown, notes).

**Wagon tab**: Party-shared cargo. Same chip layout. No PC selector, no carry capacity. Items have `ts` and `location` (when/where acquired). Filter bar by type. Add item form at bottom.

**Hoard tab**: Stored treasure/valuables. Same as wagon but for long-term storage. Typically high-value items not carried daily.

### Tap Flows

| Action | Result |
|--------|--------|
| Tap item chip | Expand inline: show edit fields (name, qty, weight, type, notes) |
| Tap ✕ on expanded item | Delete with confirmation |
| Tap type filter chip | Filter visible items to that type |
| Tap + Add Item | Inline add form: name (required), qty, weight, type dropdown, notes |
| Tap PC name in selector | Switch to that PC's carried inventory |
| Long-press item chip | Quick actions: Move to Wagon / Move to Hoard / Delete |

### AI Interaction
- AI can add items via `add_item:` mechanic (to any container, default party)
- AI can remove items via `remove_item:` mechanic
- AI cannot edit item details (qty, weight, notes) — player-only
- `_validateMechanics` deduplicates items with same name/type

---

## 3. Treasury

### V1 State
```
treasuryData: {
  pp: number, gp: number, ep: number, sp: number, cp: number,
  lifestyle: string,
  incomeLog: [{desc, amt, type, category, ts}]
}
```
V1 rendered treasury as part of the World panel — basic inputs for each denomination plus an income log list.

### V2 Layout — Dedicated Screen

```
┌─────────────────────────────────────┐
│ 💰 Treasury                         │
├─────────────────────────────────────┤
│ Total: 127.5 GP equivalent          │  ← auto-calculated
│                                     │
│  PP    GP    EP    SP    CP          │
│  0     112   0     15    50          │  ← tappable to edit
│                                     │
│ Lifestyle: Modest (1 GP/day)        │  ← dropdown selector
├─────────────────────────────────────┤
│ 📊 Income / Expense Log             │
│ ┌───────────────────────────────┐   │
│ │ + 50 GP  Quest reward         │   │  ← green for income
│ │ Jun 18   Greenest             │   │
│ ├───────────────────────────────┤   │
│ │ − 15 GP  Supplies             │   │  ← red for expense
│ │ Jun 17   Greenest             │   │
│ └───────────────────────────────┘   │
│                                     │
│ [+ Add Entry]                       │
├─────────────────────────────────────┤
│ 🏪 Business Profile                 │  ← collapsible
│ Name: Tinkle's Tinctures            │
│ Real Stock / Snake Oil / Reagents   │
│ Reputation: ...                     │
└─────────────────────────────────────┘
```

### Denomination Math
`1 PP = 10 GP = 2 EP = 100 SP = 1000 CP`
GP equivalent = `pp*10 + gp + ep*0.5 + sp*0.1 + cp*0.01`

### Tap Flows

| Action | Result |
|--------|--------|
| Tap denomination value | Inline edit (number input) |
| Tap income log entry | Expand: show full details, delete button |
| Tap + Add Entry | Form: amount, description, type (income/expense), category |
| Tap lifestyle dropdown | Select from: Wretched/Squalid/Poor/Modest/Comfortable/Wealthy/Aristocratic |

### AI Interaction
- AI can adjust via `gold:` mechanic (GP shorthand) or `treasury:` mechanic (any denomination)
- `_validateMechanics` floors treasury at 0 (no negative gold)
- Income log entries auto-created from `gold:` and `income:` mechanics
- Dedup on income log (same desc + amt + type within short window)

---

## 4. Journal

### V1 State
```
quests: [{text, status, hidden, done, pending, chatMsgId, discovery:{text,ts}, notes, location}]
npcs: [{name, disposition, details, status, hp, lastSeen, pending}]
locations: [{id, name, type, status, firstVisited, lastVisited, rep, npcs, investments, history, dmNotes, playerNotes, mapPos}]
consequences: [{id, text, type, resolved, resolvedTs, ts, location}]
worldData.campaignSecrets: [{text, playerKnown, pending, aiOnly}]
worldData.travelLog: [{ts, old_location, new_location, notes}]
worldData.townReputation: [{town, status, notes, ts}]
```

### V1 Problems
- Data scattered across `state.quests`, `state.npcs`, `state.locations`, `state.consequences`, `worldData.campaignSecrets`, `worldData.travelLog`, `worldData.townReputation` — seven separate arrays rendered in one scrollable Journal view.
- Town reputation existed in two places (`worldData.townReputation` and `location.rep`) — confusing, inconsistent.
- Secrets had no proper `playerKnown`/`aiOnly` gating — everything was visible in the same list.
- NPC tracker was flat list with no location anchoring (fixed partially by quest timeline's NPC chips).

### V2 Layout — Tabbed Journal

```
┌─────────────────────────────────────┐
│ 📔 Journal                          │
│ [Quests] [Places] [People] [Secrets]│  ← 4 sub-tabs
├─────────────────────────────────────┤
│ Location: Greenest · Day 3 · Dusk   │  ← context header
│ Weather: Clear · 🌡 Warm             │
├─────────────────────────────────────┤
```

**Quests tab**:
```
│ ⚔ Active Quests (3)                │
│ ┌───────────────────────────────┐   │
│ │ 🟡 Save the mill              │   │  ← status dot: 🟡 active, ✅ done, ❌ failed
│ │ Greenest · Gov. Nighthill      │   │  ← location + quest giver NPC chip
│ │ Notes: Mill is south of town   │   │  ← editable notes
│ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐   │
│ │ 🟡 Rescue prisoners           │   │
│ │ Greenest Keep · Escobert       │   │
│ └───────────────────────────────┘   │
│                                     │
│ ▸ Completed (2)                     │  ← collapsed by default
│ ▸ Failed (0)                        │
```

**Places tab**:
```
│ 📍 Discovered (4)                   │
│ ┌───────────────────────────────┐   │
│ │ Greenest                      │   │
│ │ Town · First: Day 1 · Rep: 🟢 │   │
│ │ NPCs: Nighthill, Escobert     │   │  ← tappable NPC chips
│ │ ▸ History (5 entries)         │   │  ← collapsible
│ └───────────────────────────────┘   │
│                                     │
│ 🗺 Undiscovered                     │  ← DM-only, hidden from player view
│ (content gated by aiOnly flag)      │
```

**People tab**:
```
│ 🧑 Known NPCs (6)                  │
│ ┌───────────────────────────────┐   │
│ │ Gov. Nighthill      Friendly  │   │  ← disposition badge
│ │ 📍 Greenest Keep              │   │  ← last seen location
│ │ Human male, governor of town  │   │  ← details
│ └───────────────────────────────┘   │
│                                     │
│ Filter: [All] [Friendly] [Neutral]  │
│         [Hostile] [Unknown]         │
```

**Secrets tab**:
```
│ 🔮 Campaign Secrets                │
│ ┌───────────────────────────────┐   │
│ │ 👁 The cult seeks dragon eggs │   │  ← playerKnown = true (visible)
│ │ Discovered: Day 2             │   │
│ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐   │
│ │ 🔒 [AI Only — hidden]        │   │  ← aiOnly = true (shown to DM/dev only)
│ └───────────────────────────────┘   │
│                                     │
│ ⏰ Active Consequences (2)          │
│ ┌───────────────────────────────┐   │
│ │ ⚡ Cultists tracking party    │   │
│ │ Type: threat · Since: Day 1   │   │
│ │ 📍 Greenest                   │   │
│ │ [Resolve]                     │   │
│ └───────────────────────────────┘   │
```

### AI Interaction
- AI adds via mechanics: `quest_add:`, `npc_add:`, `location_add:`, `location:`, `town_rep:`, `consequence:`
- `npc_add:` fires on any named NPC reference (not just formal introductions)
- Location changes require player confirmation (Gate 4: Scene Transition)
- AI cannot delete or edit existing journal entries — append-only
- Secrets with `aiOnly: true` are included in AI prompt but hidden from player UI
- Consequences with timers are injected into prompt with priority placement

### Tap Flows

| Action | Result |
|--------|--------|
| Tap quest card | Expand: full text, notes (editable), location chip, NPC chips, status toggle |
| Tap NPC chip (anywhere) | Navigate to People tab, highlight that NPC |
| Tap location chip | Navigate to Places tab, open that location's detail |
| Tap NPC card | Expand: details, disposition dropdown, location, HP (if tracked), notes |
| Tap location card | Expand: history timeline, anchored NPCs, rep, investments, notes |
| Tap consequence [Resolve] | Mark resolved with timestamp, move to resolved section |
| Tap secret 👁 | Toggle playerKnown (dev/DM only) |
| Tap + Add (any section) | Inline add form with appropriate fields |
| Tap dedup button | Fuzzy-match scan, merge duplicates with confirmation |

---

## 5. Combat

### V1 State
```
combat: {
  active: bool, round: num, currentIdx: num,
  moveMode: 'ai' | 'manual',
  list: [{
    name, hp, hp_max, ac, val (initiative), isPC, zone,
    conditions, concentrating,
    condDurations: {condName: roundsRemaining}
  }],
  zones: {
    front: {label, effect, terrain},
    back: {label, effect, terrain},
    left: {label, effect, terrain},
    right: {label, effect, terrain},
    air: {label, effect, terrain},
    rear: {label, effect, terrain}
  }
}
encounterPresets: [{name, enemies: "Name:HP:AC, ..."}]
```

### V1 Problems
- **Turns weren't enforced** — AI could skip players, combine turns, advance combat while players deliberated. Gate 2 (Combat Turn) addresses this.
- **AI auto-rolled for PCs** — AI made attacks/saves for non-active PCs instead of waiting for player input.
- **No initiative input from players** — initiative values were either AI-set or manually entered.
- **Zone grid was text-only** — functional but visually bland. Phase 2 adds visual tile map.

### V2 Layout — Phase 1: Zone Grid

```
┌─────────────────────────────────────┐
│ ⚔ Combat · Round 3                  │
│ [End Combat]     [AI Move / Manual] │
├─────────────────────────────────────┤
│ Initiative: [S:18] [A:15] [G1:12]  │  ← horizontal strip, active highlighted
│             [G2:8] [T:5]           │
├─────────────────────────────────────┤
│ ┌─────┐ ┌─────────┐ ┌─────┐       │
│ │ Air │ │Frontline│ │ L.F │       │  ← 6-zone grid
│ │     │ │ S  G1   │ │     │       │  ← tokens in zones
│ └─────┘ │         │ └─────┘       │
│ ┌─────┐ │         │ ┌─────┐       │
│ │ Rear│ │Backline │ │ R.F │       │
│ │ T   │ │ A  G2   │ │     │       │
│ └─────┘ └─────────┘ └─────┘       │
├─────────────────────────────────────┤
│ ACTIVE: Slasher (Fighter 3)        │  ← active character card
│ 42/45 HP  AC 18  Zone: Frontline   │
│ [+1] [+5] [-1] [-5] [Custom]       │  ← HP adjust
│ Conditions: [+ add]                │
│ Concentration: —                    │
├─────────────────────────────────────┤
│ 💡 Slasher's turn. What do you do? │  ← turn prompt (overlay)
└─────────────────────────────────────┘
```

### When Combat is Inactive
```
┌─────────────────────────────────────┐
│ No active combat                    │
│                                     │
│ [Add Combatant]                     │
│ Name: [___] HP: [__] AC: [__]      │
│                                     │
│ ── Rest ──                          │
│ [Short Rest]  [Long Rest]           │
└─────────────────────────────────────┘
```
> Encounter presets iceboxed (decisions.md S30→31). Could return via content pipeline JSON import.

### Turn Enforcement (V2 Gate 2)
1. Combat starts → initiative order established
2. `currentIdx` points to active combatant
3. If active is PC → turn prompt overlay appears, waits for player action
4. Player submits action → becomes next Narrative message → AI resolves ONLY that PC's turn
5. AI response parsed → `next_turn:` mechanic advances `currentIdx`
6. If next is NPC → AI auto-resolves (with roll requests for contested actions)
7. Repeat until combat ends

### AI Interaction
- Mechanics: `combat_start:`, `combat_end:`, `zone_move:`, `zone_add_enemy:`, `zone_remove:`, `zone_effect:`, `zone_label:`, `zone_fog:`
- AI moves tokens between zones via `zone_move:` mechanic
- Manual mode: player taps token then taps destination zone
- HP changes via standard `hp:` mechanic, applied to combat list AND pc state
- Concentration checks auto-triggered on any damage to concentrating entity
- Condition durations tick at end of combatant's turn, auto-expire at 0
- Combat-only conditions (Prone, Grappled, Restrained) auto-clear on `combat_end:`

### Tap Flows

| Action | Result |
|--------|--------|
| Tap initiative chip | Select that combatant, show their card |
| Tap token in zone (manual mode) | Select for movement, highlight valid zones |
| Tap zone (with token selected) | Move token to that zone |
| Tap HP +/- buttons | Adjust active combatant HP (triggers concentration check if damage) |
| Tap condition chip on card | Remove that condition |
| Tap [End Combat] | Confirmation → sync combat-only conditions back to PCs, clear combat state |
| Tap [Short Rest] | Prompt for HD spending, restore short-rest resources |
| Tap [Long Rest] | Restore all HP, half HD, long-rest resources, clear exhaustion level 1 |
| Tap encounter preset | Load enemies into combat list, auto-start |

---

## Cross-Cutting Concerns

### Mobile-First Constraints
- All layouts assume ~375px width (iPhone SE minimum)
- Tap targets minimum 40px height
- Input font sizes ≥ 16px (prevents iOS zoom)
- No hover states — everything is tap/swipe
- Scroll containers use `-webkit-overflow-scrolling: touch`

### Data Flow
```
AI Response → parseMechanics() → field ownership check → state update → save() → re-render
                                       ↓ rejected
                                  toast("AI tried to set hp_max — blocked")
```

### Firebase Sync
All inventory, treasury, combat, journal, and character data syncs via Firebase. Same merge strategy as chat (ID-based, clock-independent). Dirty-edit guard (3s window) prevents clobber during rapid player edits.

### Import/Export
- Character: JSON import/export (single PC or full party)
- Class progression: JSON import for level-up data
- Spells: JSON import for spellbook
- All exports include version stamp for forward compatibility
