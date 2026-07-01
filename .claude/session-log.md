# Session Log — S66 (2026-07-01)

## Branch / Build
Branch: `claude/latest-test-analysis-v64a6i` · merged to main · build clean

---

## What Shipped This Session

### Undo button moved into input row
- Undo is now the leftmost icon button in the input row (↺ counterclockwise arrow, 40px circle matching d20)
- Previously floated as a block between TurnPrompt and the input, causing visual orphaning and overlap
- Appears only when there's something to undo — no permanent space reservation
- Files: `src/ui/play/Rewind.jsx`, `src/ui/play/InputBar.jsx`, `src/ui/play/Chat.jsx`, `src/style.css`

### Dice tab now reachable in combat
- d20 button previously called `setTurnPromptMinimized()` during combat instead of opening QuickActions
- Fixed: d20 always calls `toggle('actions')` regardless of combat state
- Files: `src/ui/play/InputBar.jsx`

### Combat card dismiss button
- TurnPrompt expanded card now has a `−` button (right of header) to minimize to the strip
- Minimized strip taps to re-expand; card starts expanded
- Files: `src/ui/play/TurnPrompt.jsx`, `src/style.css`

### NPC ally guest join flow
- GuestCharPick rebuilt as three-path mode picker:
  1. **Play a character** — pick from existing party PCs (multi-select)
  2. **Join as NPC ally** — pick from campaign NPC list OR enter custom name
  3. **Create new character** — routes to CharCreate
- NPC ally stored as `playerIdentity.mode = 'npc'` / `playerIdentity.npcName`
- `system.js` adds `npcName: ''` to playerIdentity defaults
- Files: `src/ui/setup/GuestCharPick.jsx`, `src/state/system.js`, `src/style.css`

### Prior this session (also on main)
- Spell ⓘ button in ActionsDrawer sidebar
- Combat tracker no longer auto-minimizes (manual control only)
- Victory button when all enemies hit 0 HP
- Conditions parsing: `Name, condition` and `Name, -condition` formats
- Large text mode toggle (Settings → Display, persisted)
- All 20 color themes rebuilt with color theory (60-30-10, named themes)
- Data protection: New Campaign auto-exports JSON before clearing
- Last saved indicator + Check for Update button in Settings

---

## Phase Status

### Phase 1 — No broken mechanics (COMPLETE)
### Phase 2 — Christian's active experience (COMPLETE)

### Phase 3 — Second player ready
- ✅ GuestCharPick three-path flow (Play PC / NPC ally / Create new)
- ✅ NPC ally mode stored and retrievable
- Guest experience audit — needs live two-device test

### Phase 4 — July 11 deadline
- [ ] AI DC determination (complex, do last)

---

## Known Gaps Still Unbuilt
- AI DC determination (Phase 4)
- Multiplayer bundles MVP (`data/bundles.js` stub)
- `dbWrite()` write failures never surface to caller (cosmetic)
- Color themes need live visual verification
- Guest join NPC ally — no UI yet in ContextBanner/presence to show "Fenwick (NPC)" vs "Nyx (PC)"

## Live Verification Still Needed
- S65: NPC deep-link, CharDrawer/CharSheet roll connections, Compendium overhaul
- S66: Combat tracker manual control, Victory button, combat card dismiss button, spell ⓘ in sidebar, undo icon in input row, dice tab reachable in combat, large text toggle, color themes, NPC ally guest join three-path flow
