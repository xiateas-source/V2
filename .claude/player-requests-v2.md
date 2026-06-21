# Player-Requested UX — Carry to V2

Everything below came from real gameplay feedback, flag exports, or explicit player requests during v1 sessions. These aren't design assumptions — they're battle-tested requirements. If it's marked ✅, v1 shipped it and V2 must preserve it. If it's marked ⬜, it was requested but never built.

---

## Spellbook & Magic

- ✅ **Spellbook auto-sort** — level first, then alphabetical within level (Session 18)
- ✅ **Cantrips as Level 0** — displayed alongside leveled spells, not hidden (Flag 3, Session 15)
- ✅ **Merged Spells + Spellbook tabs** — single view with inline compendium browser (Session 15)
- ✅ **Spell descriptions in level-up picker** — player can read what a spell does before choosing (Session 19)
- ✅ **Spell import from JSON** — paste spellbook data from external tools (Session 25)
- ✅ **Spell swap on level-up** — optional "replace one known spell" step in wizard (Session 17)
- ⬜ **SPELL_DB expansion past Level 2** — current DB only covers cantrips–L2. Characters past level 5 get empty spell pickers unless they import. Need L3+ for all classes
- ⬜ **Pre-built class progression downloads** — ready-made JSON files for common classes so players don't need Gemini to generate them

## Skills & Abilities

- ✅ **Expertise double-proficiency** — "(Expertise)" tag in skill text → ×2 prof bonus on that skill (Flag 8, Session 15)
- ✅ **Dynamic skill modifier calc** — proficiency auto-applied based on checkbox, not manual entry
- ✅ **Tappable skill rows** — tap any skill → instant d20 roll with full modifier shown
- ✅ **Tappable ability scores** — tap STR/DEX/etc. → roll d20 + modifier
- ✅ **Tappable saving throws** — tap any save → roll d20 + save modifier
- ✅ **Proficiency checkboxes** — toggle proficiency per skill/save, modifier recalculates instantly

## Character Sheet UX

- ✅ **Lock/unlock toggle** (🔒/🔓) — read-only during play, deliberate unlock to edit. V2: enforcement must be real, not cosmetic
- ✅ **Inline HP +/-** — preset buttons (+1/+5/-1/-5) plus custom amount input (Session 14)
- ✅ **XP tap-to-edit** — tap XP bar or number to manually set XP (Session 23)
- ✅ **Hit dice pips** — visual circles, tap unspent → spend for healing (shows heal estimate: d{hitDie} + CON mod)
- ✅ **Exhaustion pips** — 0–6 visual scale, tap to set level
- ✅ **Death save pips** — heart (♥) and skull (💀) icons, tap to toggle each pip
- ✅ **Inspiration star toggle** — ☆/⭐ tap to toggle
- ✅ **Input font sizes ≥ 16px** — prevents iOS auto-zoom on input focus (Session 23)
- ✅ **Condition chip tap-to-clear** — tap a condition badge to remove it, with toast feedback (Session 24)
- ✅ **Condition duration tracking** — optional round counter on conditions, auto-expire at 0 (Session 17)
- ✅ **Per-character JSON import** — "Update from JSON" button per character, auto-detects format, preserves HP/XP/conditions (Session 24)
- ✅ **Color picker per PC** — accent color for tokens, name displays, borders
- ✅ **Concentration badge** — shows spell name + "end" button, auto-checked on damage

## Inventory & Cargo

- ✅ **Per-PC inventory in Cargo tab** — Wagon/PC toggle buttons, browse each character's personal items (Flag 13, Session 17)
- ✅ **Encumbrance tracking** — carry weight vs. capacity (STR×15), shown in ledger + validator warning (Flag 14, Session 15)
- ✅ **Chip layout for items** — compact tappable chips instead of long list, tap to expand edit (Session 13)
- ✅ **Type filter bar** — filter by item type (supply/loot/trade/etc.) with count badges
- ✅ **Search bar** — filter items by name/notes text match (Session 20)
- ✅ **Multi-category items** — items can have comma-separated type tags (Flag 2, Session 15)
- ✅ **Fuzzy dedup** — inventory deduplication on add (Session 13)
- ✅ **Equipped vs. Carried split** — gear types (weapon/armor/shield) grouped separately

## Treasury

- ✅ **Income log dedup** — prevents duplicate entries from same mechanic (Flag 4, Session 15)
- ✅ **Tap-to-delete income entries** — with treasury adjustment and confirm dialog (Session 14)
- ✅ **GP delta in status bar** — "+12 gp" / "−5 gp" shown in party status mini strip

## Combat

- ✅ **Quick enemy clone** — one-tap duplicate combatant with auto-numbered suffix, e.g. "Cultist 2" (Session 17)
- ✅ **Encounter presets** — save/load enemy groups for fast setup
- ✅ **Initiative strip** — horizontal scrollable chips showing turn order, active highlighted
- ✅ **Inline HP on active card** — +/- buttons directly on the active combatant card
- ✅ **Concentration check on damage** — auto-triggered when a concentrating entity takes HP damage
- ✅ **Combat-only conditions auto-clear** — Prone/Grappled/Restrained removed on combat end, persistent conditions synced back to PC sheets
- ✅ **Confirm dialog for End Combat** — prevents accidental combat end (Session 23)

## Journal & Tracking

- ✅ **Quest chips on originating message** — ⚔ badge on the DM message that introduced the quest, tap → quest detail (Session 16)
- ✅ **Location link in quest detail** — 📍 tap → navigate to Location Journal entry (Session 16)
- ✅ **Tappable mechanic pills** — `_mechPillNav` pattern-matching navigation to relevant UI section (Session 19)
- ✅ **Consequence cards** — editable with add/update/delete, not just a text list (Session 19)
- ✅ **NPC dedup button** — fuzzy match scan on all trackers (Session 19)
- ✅ **Travel timeline cross-linking** — labeled tappable chips for quests/NPCs/rep at each location (Session 19)
- ⬜ **Inline NPC name linking** — tap NPC names in chat messages → navigate to NPC tracker entry. Requested, designed, never built
- ⬜ **Quest log UX refresh** (Flag 12) — needs design
- ⬜ **Familiar/animal proper home** (Flag 10) — needs design

## General UX

- ✅ **Suggestion chips** — contextual chip row above chat input, changes per channel, surfaces hidden features (Session 14)
- ✅ **`//explain` help system** — 16 in-chat help topics (Session 14)
- ✅ **`//` command system** — note, flag, add item, hp, gold, explain, levelup, help (Session 14)
- ✅ **Per-message moment export (⚠️)** — export target message + 10-message context window for dev review (Session 14)
- ✅ **Context strip carousel** — 7-slide auto-rotation with tap cycling (Flag 11, Session 18)
- ✅ **Customizable header shortcuts** — ☰ menu with drag-to-reorder shortcut grid (Session 13)
- ✅ **Term glossary tooltips** — 97 D&D terms, hover/tap for definition
- ⬜ **Character Creation Wizard** — Level 1 setup flow (race picker, stat roller/point-buy, starting equipment, spell selection). Would replace manual sheet entry for new campaigns
