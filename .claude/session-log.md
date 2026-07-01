# Session Log — S64 (2026-07-01)

## Branch / Build
Branch: `main` · last commit: `562df8d` · build clean · all pushed

---

## What Shipped This Session

### Familiar HP in CharDrawer (`562df8d`)
- Familiar mini-card in left drawer when `pc.familiar` exists and status !== 'dismissed'
- Shows species emoji, name, HP bar, HP text
- −1/+1 buttons route through `familiar_hp` mechanic (by familiar name, not PC name — handler matches on `pc.familiar.name`)
- CSS: `.drawer-familiar`, `.drawer-fam-icon`, `.drawer-fam-info`, `.drawer-fam-name`, `.drawer-fam-hp-bar`, `.drawer-fam-hp-fill`, `.drawer-fam-hp-text`, `.drawer-fam-btns`, `.drawer-fam-btn`

### Hit Dice spending in CharDrawer (`562df8d`)
- HD stat is now a tappable button (`drawer-stat-btn` class)
- `spendHitDie()`: rolls die internally (Math.floor(Math.random() * dieSize) + 1), adds CON mod, heals
- Direct setStore for HD.used (player-owned spend), mechanics pipeline for HP change
- Toast shows result: "+7 HP (d8 rolled 5, CON +2)"
- Grayed out / disabled when `hdAvail() <= 0`
- CSS: `.drawer-stat-btn`, `.drawer-stat-btn.depleted`, `.drawer-stat-cover`

### Cover mechanic (`562df8d`)
- New `cover` mechanic handler in mechanics.js: `cover: Name=half|three-quarters|none`
- half = +2 coverBonus, three-quarters = +5, none = 0
- `combat_end` handler now clears coverBonus for all characters
- AC stat in CharDrawer shows `pc.ac + pc.coverBonus` with inline "+N" badge and "(cover)" label
- Added `cover:` key to contracts.js reference so AI knows to emit it
- Added 'cover' to VALID_KEYS set

### Quest archive in Journal (`562df8d`)
- Each active QuestCard now has a ✓ button → direct setStore write to mark 'done' (player-owned)
- Search input appears when active quest count > 8 (Christian has 15 active)
- CSS: `.quest-done-btn`

### Link Familiar form in CharSheet (`1294abb`)
- "Link Familiar" dashed button on Vitals tab when `!pc.familiar`
- Inline form: name, species dropdown, HP max, AC, walk/fly — defaults to raven stats
- `LinkFamiliarForm` component, setStore write direct
- Lets user manually register Kael who predated the familiar system

### NPC rename in Journal (`1294abb`)
- NPCCard dossier has "Edit" button → inline form for name + disposition
- Fixes corrupted "Kael|Ally|Companion bird;..." NPC entry

### Cargo.jsx full rewrite (`f3273d4`)
- Every item tappable → inline editing: qty stepper, Use/Eat/Drink/Read button, delete, note textarea
- `useItem()` fires prefill-input with correct verb + decrements qty
- Companions (type=companion) → "Traveling with" chip row, excluded from item list
- Merge Duplicates button when same-name same-owner stacks exist
- Player writes direct to store (player-owned); adds still through mechanics pipeline

### mechanics.js bug fixes (`3b6e625`)
- `slot_use`/`slot_restore`: now split on `/[=|]/` — fixes spell slots never decrementing
- `npc_add`: auto-detect pipe vs comma separator — fixes NPC name corruption
- `slotEntries` filter: `.filter(([, max]) => max)` — fixes "0th slot" rendering
- Passive resources: show "passive" label when `r.max` is falsy

---

## How to Fix Kael in Live App (still needed by user)
1. CharSheet → Vitals → "Link Familiar" → name: Kael, species: Raven → Save
2. Journal → People → find "Kael|Ally|..." → open → Edit → fix name, set Ally
3. Cargo → "Kael (The Tattered Raven)" companion item → tap → trash

---

## Agreed Plan (phased, player-first)

**Phase 1 — No broken mechanics** (mostly done this session)
Remaining:
- [ ] Action Economy enforcement: flag when AI uses Action + Bonus Action for same PC in one turn
- [ ] Scene Transition gate: hold location/time changes, prompt player to confirm before applying

**Phase 2 — Christian's active experience**
- [ ] Read player-requests-v2.md — built what fits: spell DB expansion, inline NPC name linking, quest log UX
- [ ] Any other active pain points from play

**Phase 3 — Second player ready**
- [ ] Nyx's player joining cleanly
- [ ] Guest experience audit — can she do everything Christian can?

**Phase 4 — July 11 deadline remainder**
- [ ] AI DC determination (pre-call complexity — do last, don't rush)

**Phase 5 — Content complete** (ongoing)

---

## Autonomy Rules This Session
- **Safe to build fast (no check-in):** UI, CSS, new mechanic handlers, contracts, Journal/Cargo/drawer improvements
- **Flag before touching:** engine.js pipeline, mechanics.js enforcement logic, Firebase schema, state ownership

---

## Known Gaps NOT Yet Built
- Action Economy enforcement (Phase 1 — next up)
- Scene Transition gate (Phase 1 — next up)
- Spell DB expansion past L2 (player request — Phase 2)
- Inline NPC name linking in chat (player request — Phase 2)
- AI DC determination (Phase 4)
- Multiplayer bundles MVP (data/bundles.js stub)

## Live Verification Still Needed
- S62: presence badge two-device, join auto-retry, tab-kill character merge
- S57: PC attack-roll/Critical Hits (needs live combat)
- All S64 features (need real play session with Christian)
