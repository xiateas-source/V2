# Session Log — Handoff Note

## Session 32 · 2026-06-21

### Shipped
- **Charsheet mockup v1 parity rewrite** — `charsheet-mockup.html` rewritten to match v1's information density: quick stats line, item type tags with color coding, acquisition metadata, currency on Equipment tab, browse compendium button, spell expand/collapse, full feature text
- **V,S,M component badges** — Spell cards now show V, S, M as prominent purple pill badges on their own line, per explicit player request. Three expanded examples in mockup (Prestidigitation, Shield, Find Familiar, Fireball)
- **Manual Override editor spec** — v1's "Advanced Editor" renamed to "Manual Override" — full form-based escape hatch for when the engine gets things wrong. Sub-tabs: Skills, Features, Attacks, Spells, Gear, Familiar. All edits audited.
- **Derived bonuses decision** — V1's proficiency auto-calc was buggy (stored computed values that drifted). V2 derives all bonuses at render time: `mod = abilityMod + (isProficient ? profBonus : 0)`. Nothing stored, nothing stale.
- **Expanded familiar stat block** — Tap-to-expand on Vitals tab: collapsed (name, status, HP/AC) → expanded (full 6-stat abilities, speeds, senses, skills, special abilities, action buttons). Gets its own conditional 7th tab when character has a familiar.
- **Spec dependency map** — Added to workboard: what must be specced before each build phase. Key gap flagged: Journal data shapes (quests, NPCs, locations, consequences, secrets, town rep) are skeletal.
- **Familiar data shape expanded** — Full stat block fields in campaign data shape

### Decisions Made (Session 32)
- Manual Override editor kept (renamed from "Advanced Editor") — safety net, not primary path
- All bonuses derived at render time, not stored (fixes v1 proficiency bugs)
- Familiar gets conditional 7th charsheet tab (only appears when character has one)
- Spec dependency rule: data shapes before the phase that writes to them, UI specs can wait

### Known Issues
- Journal data shapes are skeletal — quests, NPCs, locations, consequences, secrets, town rep all need full field specs before Phase 1 mechanics handlers can be built
- User plans to ask v1 for actual tracked data (mechanic keys, real save objects, organic fields) to inform the spec

### In Progress
- Nothing code-wise — planning/spec phase

### Next Up
1. **Ask v1** for every mechanic key + real quest/NPC/location objects from live saves + organically added fields
2. **Spec Journal data shapes** using v1's real data as reference — before Phase 1
3. **Phase 0: Foundation** — Vite + SolidJS scaffold, state store, Firebase, color themes (safe to build now, no spec gaps)
4. Then Phase 1: Core Loop MVP (after Journal data shapes are specced)

### Branch State
- Branch: `claude/transfer-v2-planning-docs-hlibvu` on xiateas-source/V2
- Last commit: b3d10c7
- All planning docs committed and pushed
- Not merged to main
