# Session Log — S63 continuation (2026-07-01)

## Branch State
Branch: `main` · last commit: `1294abb` · build clean

---

## What Shipped

### mechanics.js — Bug Fixes (from Christian's campaign analysis)
- `slot_use` / `slot_restore`: AI emits `Name|level` but contract says `Name=level`. Fixed all three handlers: `value.split(/[=|]/)` accepts both.
- `npc_add`: AI started using pipes for newer NPCs, handler expected commas. Fixed: auto-detect separator.
- `ActionsDrawer` null slot: `spellSlots = [null, 4, 3, 3, 1]` rendered a "0th" slot row. Fixed: `.filter(([, max]) => max)`.
- Passive resources "undefined/undefined": resources with no `max` (Song of Rest) showed broken pip display. Fixed: fallback `<span class="drawer-resource-passive">passive</span>`.

### Cargo.jsx — Full Inventory Editing Rewrite (`f3273d4`)
- Every item tappable → expands inline with: qty stepper (−/N/+), context-aware Use/Eat/Drink/Read button, trash delete, note textarea
- `useItem()` fires `prefill-input` with correct verb + decrements qty
- Companion-type wagon items now appear as "Traveling with" chip row, excluded from item list
- "Merge Duplicates" button when same-name same-owner stacks exist
- Player writes (qty, note, delete) go directly to store — player-owned per Law 2. Adds still through mechanics pipeline.

### CharSheet — Link Familiar Form (`1294abb`)
- When `pc.familiar` is null: dashed "Link Familiar" button on Vitals tab
- Inline form: name, species dropdown, HP max, AC, walk, fly — defaults to raven stats
- Saves to `setStore('campaign', 'characters', idx, 'familiar', {...})`
- Context: Kael the raven familiar predated the familiar system. This lets the user manually register him.

### Journal — NPC Rename/Edit (`1294abb`)
- NPCCard dossier now has "Edit" button → inline form for name + disposition
- Saves by NPC id via setStore
- Context: corrupted NPC "Kael|Ally|Companion bird; acts as a scout and combat support." — entire pipe-delimited mechanic string was stored as the name.

---

## How to Fix Kael in the Live App
1. CharSheet → Vitals tab → "Link Familiar" → enter Kael, Raven, adjust HP if needed → Save
2. Journal → People → find the garbled "Kael|Ally|..." card → open → Edit → rename to "Kael", set Ally → Save
3. Cargo → "Kael (The Tattered Raven)" companion item → tap → trash → gone (now redundant)

---

## Gaps / Next Up

### Immediate (small, high value — do this first next session)
- **Familiar HP in CharDrawer**: Kael's HP not visible during combat from the left drawer — must open full CharSheet. Fix: add familiar mini-card to CharDrawer when `pc.familiar` exists. ~30 lines.

### July 11 Deadline (UNTOUCHED — priority)
1. Action Economy enforcement — `actionsUsed` flags exist, no gate checks them
2. Cover mechanic — missing entirely
3. Short Rest / Hit Dice healing surfacing
4. AI DC determination — context-aware (currently flat tiers)
5. Scene transition gate — Gate 2 in enforcement spec

### Medium
- Quest overload — Christian has 15 active quests, 5+ stale. No filter/archive UI in Journal.
- Multiplayer bundles MVP — `data/bundles.js` still stub

### Live Verification Still Needed
- S62: presence badge (two-device), join auto-retry, character union merge (tab-kill)
- S57: PC attack-roll/Critical Hits (needs live combat)
