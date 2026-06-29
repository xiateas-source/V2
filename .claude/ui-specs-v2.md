# UI Specs — CharSheet, Cargo, Treasury, Journal, Combat

---

## 1. Character Sheet

### Field Inventory & Ownership

*Canonical field ownership reference. CLAUDE.md has the summary; this table has every field.*

| Field | Owner | Can Edit | AI Can Write | Notes |
|-------|-------|----------|-------------|-------|
| `name` | Player | Always | No | Identity field |
| `race` | System | Creation wizard | No | Affects bonuses. Set once. |
| `class` | System | Level-up wizard | No | |
| `subclass` | System | Level-up wizard | No | |
| `level` | System | Level-up wizard | No | XP threshold triggers wizard |
| `background` | System | Creation wizard | No | Locked during play |
| `alignment` | System | Creation wizard | No | Editable via manual override |
| `hp` | AI (player override) | Vitals +/- | Yes (`hp:`) | Override uses `aiSet()` with flag. Clamped 0–hp_max |
| `hp_max` | System | Level-up only | No | Guard rejects AI writes |
| `hp_temp` | System + AI | Combat tab | Yes (`hp_temp:`) | |
| `ac` | Player | Edit mode | No | |
| `initiative` | Derived | No | No | DEX modifier |
| `speed` | Player | Edit mode | No | |
| `str/dex/con/int/wis/cha` | System | Level-up (ASI) | No | Modifier = floor((score-10)/2) |
| `xp` | System + AI | Tap to edit | Yes (deltas only) | |
| `skillProfs[]` | System | Level-up wizard | No | |
| `slots[{max,used}]` | System | Level-up sets max | Partial (`slot:` decrements) | |
| `resources[]` | System | Level-up adds | Partial (can decrement) | |
| `conditions[]` | AI + Player | Picker | Yes (`conditions:`) | Combat-only auto-clear |
| `concentrating` | AI | End button | Yes (`concentration:`) | |
| `features` | System | Level-up wizard | No | |
| `spellbook[]` | System + Player | Wizard/compendium | No | |
| `attacks[]` | Player | Edit mode | No | |
| `inventory[]` | Player + AI | Edit, `add_item:` | Yes (add only) | |
| `familiar` | Player | Edit mode | Partial (`familiar_hp/add/update`) | |
| `backstory`, `personality`, `traits` | Player | Edit mode | No | |
| `color` | Player | Color picker | No | |
| `exhaustion` | AI + Player | Pips | Yes | 0–6 |
| `hd_used` | System | Pip tap | No | |
| `death_saves` | Player | Tap | No | {successes, failures} |
| `inspiration` | AI + Player | Toggle | Yes | Boolean |
| `languages[]` | Player | Edit mode | No | |

### Layout — 6 Tabs

```
┌─────────────────────────────────────┐
│ [←]  Slasher                    [🔒] │
│ Fighter (Battle Master) Lv.3 — Human │
│ [OK] / [HURT] / [DOWN]         [📤] │
├─────────────────────────────────────┤
│ 42/45 HP  AC 18  Init +2  Spd 30ft  │
│ ████████████████████░░░  HD: 2/3d10  │
│ Prof: +2  PP: 14  ☆ Inspiration      │
│ ───── XP: 900 / 2700 ─────────────  │
├─────────────────────────────────────┤
│ [Stats] [Vitals] [Spells] [Features] │
│ [Equipment] [Bio]                    │
└─────────────────────────────────────┘
```

### Tab Contents

**Stats** — 3×2 ability grid (tappable to roll). Saving throws (prof dot, tappable). Skills (18 rows, prof/expertise dots, tappable). Quick reference: Initiative, Prof bonus, Speed, PP, PI.

**Vitals** — HP controls (+/-). AC with source. Attacks (tappable). Conditions (chips + durations). Concentration badge + end button. Death saves. Hit dice pips. Exhaustion pips. Familiar/mount card. Rest buttons (Short/Long).

**Spells** — Spell Save DC / Attack / Ability at top. Concentration pinned. Slot pips per level. Known spells by level (expand for full details). Cantrips. Browse Compendium button.

**Features** — Class features by level. Racial traits. Resources with pip counters. Feats. Proficiency tags.

**Equipment** — Encumbrance bar (weight / STR×15). Items with type tags. Party currency footer → Treasury link. "Wagon & Hoard in Cargo" link.

**Bio** — Race reference card (from compendium). Identity (Background, Alignment, Languages). Appearance, Personality, Backstory, Notes (player-owned, tap to edit).

### Tap Flows

| Action | Result |
|--------|--------|
| Tap ability/skill/save (locked) | Roll d20 + modifier |
| Tap XP bar | Set XP manually |
| Tap lock toggle | Toggle `sheetLocked` |
| Tap condition chip | Remove condition |
| Tap hit die pip | Spend: roll + CON mod, heal |
| Tap exhaustion pip | Set exhaustion level |
| Tap death save pip | Toggle save |
| Tap inspiration | Toggle boolean |
| Tap spell | Show detail |
| Tap 📤 | Copy character JSON |

### Level-Up Wizard
Triggered when `levelReady = true`. Steps: HP increase → ASI/Feat → Features → Spell changes → Confirm. Re-entry: "Redo Level N" button in Features tab.

---

## 2. Cargo / Inventory

### Layout — Three Containers

```
┌─────────────────────────────────────┐
│ 📦 Cargo                            │
│ [Carried ▾] [Wagon] [Hoard]         │
├─────────────────────────────────────┤
│ Carried: Slasher ▾                  │
│ 47 / 240 lbs (STR 16 × 15)         │
├─────────────────────────────────────┤
│ ⚔ Equipped                          │
│ [Longsword ×1] [Chain Mail] [Shield]│
│ 🎒 Carried                          │
│ [Rations ×10] [Rope 50ft] [Torch×5]│
│                     [+ Add Item]    │
├─────────────────────────────────────┤
│ [All 12] [Supply 3] [Loot 4] ...   │
│ 🔍 [search...]                      │
└─────────────────────────────────────┘
```

**Carried**: PC selector, weight/capacity bar, Equipped vs Carried split. Tap chip → inline edit.
**Wagon**: Party-shared cargo. Items have timestamp and location.
**Hoard**: Long-term storage for valuables.

### AI Interaction
- `add_item:` / `remove_item:` mechanics. AI cannot edit item details (qty, weight, notes).

### Tap Flows

| Action | Result |
|--------|--------|
| Tap item chip | Inline edit |
| Tap ✕ | Delete with confirmation |
| Tap type filter | Filter items |
| Tap + Add | Inline add form |
| Long-press item | Quick actions: Move to Wagon/Hoard/Delete |

---

## 3. Treasury

### Layout

```
┌─────────────────────────────────────┐
│ 💰 Treasury                         │
├─────────────────────────────────────┤
│ Total: 127.5 GP equivalent          │
│  PP    GP    EP    SP    CP          │
│  0     112   0     15    50          │
│ Lifestyle: Modest (1 GP/day)        │
├─────────────────────────────────────┤
│ 📊 Income / Expense Log             │
│ │ + 50 GP  Quest reward    Jun 18  │
│ │ − 15 GP  Supplies        Jun 17  │
│ [+ Add Entry]                       │
├─────────────────────────────────────┤
│ 🏪 Business Profile (collapsible)   │
└─────────────────────────────────────┘
```

Denomination: `1 PP = 10 GP = 2 EP = 100 SP = 1000 CP`. GP equivalent = `pp*10 + gp + ep*0.5 + sp*0.1 + cp*0.01`.

### AI Interaction
- `gold:` / `treasury:` / `income:` / `expense:` mechanics. Treasury floors at 0. Income log auto-created from mechanics, deduped.

---

## 4. Journal — 4 Tabs

```
┌─────────────────────────────────────┐
│ 📔 Journal                          │
│ [Quests] [Places] [People] [Secrets]│
├─────────────────────────────────────┤
│ Location: Greenest · Day 3 · Dusk   │
└─────────────────────────────────────┘
```

**Quests**: Active (status dots: 🟡 active, ✅ done, ❌ failed), Completed/Failed (collapsed). Each: location chip, quest giver NPC chip, editable notes.

**Places**: Discovered locations with type, first/last visit, reputation, anchored NPCs, history timeline. Undiscovered gated by `aiOnly`.

**People**: NPC cards with disposition badge, last seen location, details. Filter by disposition.

**Secrets**: Player-known secrets (👁) + AI-only (🔒). Active consequences with type, timer, location, [Resolve] button.

### AI Interaction
- Mechanics: `quest_add/done/fail`, `npc_add`, `npc_mood`, `location_add/visit/history`, `town_rep`, `consequence_add/resolve`
- AI is append-only — cannot delete/edit journal entries
- Location changes gated by Gate 4 (scene transition)
- Consequences with timers injected into prompt with priority
- Secrets with `aiOnly: true` included in AI prompt but hidden from player UI

### Tap Flows
Tap quest card → expand with notes, NPC/location chips, status toggle. Tap NPC chip → People tab. Tap location chip → Places tab. Tap [Resolve] → mark resolved. Tap + Add → inline form.

---

## 5. Combat — Phase 1: Zone Grid

### Layout

```
┌─────────────────────────────────────┐
│ ⚔ Combat · Round 3                  │
│ [End Combat]     [AI Move / Manual] │
├─────────────────────────────────────┤
│ Initiative: [S:18] [A:15] [G1:12]  │
├─────────────────────────────────────┤
│ ┌─────┐ ┌─────────┐ ┌─────┐       │
│ │ Air │ │Frontline│ │ L.F │       │
│ └─────┘ │ S  G1   │ └─────┘       │
│ ┌─────┐ │         │ ┌─────┐       │
│ │ Rear│ │Backline │ │ R.F │       │
│ │ T   │ │ A  G2   │ │     │       │
│ └─────┘ └─────────┘ └─────┘       │
├─────────────────────────────────────┤
│ ACTIVE: Slasher · 42/45 HP · AC 18 │
│ [+1] [+5] [-1] [-5] [Custom]       │
│ Conditions: [+ add]                │
├─────────────────────────────────────┤
│ 💡 Slasher's turn. What do you do? │
└─────────────────────────────────────┘
```

### Turn Enforcement
1. Combat starts → initiative established
2. `currentIdx` → active combatant
3. PC turn → prompt overlay → player submits → AI resolves ONE turn
4. `next_turn:` mechanic advances pointer
5. NPC turns auto-stream
6. Engine stops on each PC

### AI Interaction
Mechanics: `combat_start/end`, `zone_move/add_enemy/remove/effect/label/fog`. HP via `hp:` mechanic. Concentration checks auto-triggered on damage. Condition durations tick on turn end. Combat-only conditions (Prone, Grappled, Restrained) auto-clear on `combat_end:`.

### Tap Flows

| Action | Result |
|--------|--------|
| Tap initiative chip | Select combatant, show card |
| Tap token (manual mode) | Select for movement |
| Tap zone (with selection) | Move token |
| Tap HP +/- | Adjust HP (triggers concentration check if damage) |
| Tap condition chip | Remove condition |
| Tap [End Combat] | Confirmation → sync conditions, clear combat |
| Tap [Short Rest] | HD spending prompt, restore short-rest resources |
| Tap [Long Rest] | Restore HP, half HD, long-rest resources, clear exhaustion 1 |
