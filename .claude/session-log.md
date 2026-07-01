# Session Log — S66 (2026-07-01)

## Branch / Build
Branch: `claude/latest-test-analysis-v64a6i` · build clean · all changes merged to main

---

## What Shipped This Session

### Undo button moved left (`PR #5`)
- Undo was at `right: 16px`, right drawer handle is 22px wide from `right: 0` — they overlapped
- Moving undo to `left: 16px` clears the right edge entirely for the sidebar handle and send button
- File: `src/style.css`

### Spell ⓘ button in ActionsDrawer (`PR #6`)
- Each spell chip in the right sidebar now has an ⓘ button that fires the existing `spell-tooltip` event
- Shows level, school, cast time, range, duration, full description inline without leaving play
- Tap the spell name to cast as before
- Files: `src/ui/play/ActionsDrawer.jsx`, `src/style.css`

### Combat tracker auto-close fix + Victory button + Conditions parsing (`PR #7`)
- **Combat tracker staying closed**: `createEffect` was subscribing to all `combatState` changes — any mechanic (HP, condition, etc.) during a PC's turn forced the tracker closed. Fixed with `on(currentTurnIdx, ...)` so auto-minimize only fires on actual turn advances.
- **Victory button**: when all enemies reach 0 HP, `⚑ Victory` appears in the tracker header for one-tap combat end — no more waiting for AI to emit `combat_end:`.
- **Conditions parsing**: handler now parses `Name, condition` (add) and `Name, -condition` (remove) — the comma-space format the AI commonly emits. Strips stray leading dashes so `-poisoned` can't be stored as a condition name.
- Files: `src/ui/play/Combat.jsx`, `src/ai/mechanics.js`

### Test panel height + section reorder (`PR #4`)
- `max-height: 80vh`, `overscroll-behavior: contain`
- Section order: Mass Test → Jump To → Quick Fire → Export → Build Status → Environment → Inject

### CharDrawer + CharSheet: dead `roll-request` events connected (`1612871`)
- ALL `roll-request` CustomEvent dispatches in CharDrawer and CharSheet were firing into void — no listener
- Fixed by routing to `prefill-input` instead (consistent with ActionsDrawer's spell flow)
- CharDrawer: attack tap → `prefill-input: "${name} attacks with ${weapon}."` + closes drawer
- CharSheet abilities/saves/skills/attacks/initiative/spell attack → all now use `prefill-input`
- Files: `src/ui/play/CharDrawer.jsx`, `src/ui/reference/CharSheet.jsx`

### Browse Compendium button on CharSheet (`76c70d3`)
- Button on Spells tab navigates to Journal → Compendium, pre-filtered to the PC's class
- Files: `src/ui/reference/CharSheet.jsx`, `src/ui/shared/sourceBus.js`

### Compendium spell UI overhaul (`96f8737`)
- Class filter chip row + level filter chip row + inline accordion — no page navigation
- Rules / Glossary / Feats tabs: inline accordion too
- Files: `src/ui/reference/Compendium.jsx`, `src/ui/shared/sourceBus.js`, `src/style.css`

### Mass test panel (`18be0dd`)
- 24-mechanic Run All, auto-audit on open, clear chat button
- Files: `src/ui/manage/MechTest.jsx`, `src/style.css`

---

## Player Feedback Collected (Unbuilt)

### Combat card (TurnPrompt) redesign
- **What's good**: "it's your turn" prompt, Action/Bonus/Move economy tracking
- **What's bad**: spell list feels redundant and messy now that sidebar does it better; hard to dismiss before hitting dice button
- **Direction**: strip spells from the card, keep it lean — just the turn prompt + economy slots + attack buttons. Let sidebar own spells.

### Color themes need real design treatment
- All palette swaps look like unstyled hue washes — "plain washes of color, look bad next to the main theme"
- Each theme needs real visual polish, not just a color variable swap

### Accessibility: large text mode
- User struggles to read without glasses
- Need a dedicated large-text theme or toggle

### Multiplayer as NPC ally
- Want to be able to join a session as a named NPC/ally rather than only as a new PC
- Drop-in co-op / asymmetric play

### Dice button
- D20 button currently opens QuickActions. User wonders if it should roll dice.
- DiceRoller component already exists but is wired to nothing.
- Recommendation: add Dice as a tab inside QuickActions, keep D20 as quick-actions opener.

### Narrative/OOC tab bar
- "Somehow off next to the side tabs" — visual polish needed
- May need repositioning or redesign to sit cleanly between the drawer handles

---

## Known Bugs from JSON Analysis
- Christian's conditions array had `{name: "poisoned"}` and `{name: "-poisoned"}` both present — artifact of old conditions parsing. Fixed in this session (PR #7). Existing saved data will clear naturally as conditions are removed in play.

---

## Data Protection — Short-term Plan (Unbuilt)
Three fixes bundled into backlog (see workboard):
1. Settings: "Last saved to cloud X min ago" status indicator
2. Settings: "Check for update" hard refresh button (no data loss — just clears asset cache, not IndexedDB)
3. New Campaign / Reset: confirmation modal with export prompt before wiping

**Long-term**: Replace Firebase anonymous auth with Google sign-in. Anonymous UID lives in Firebase's own IndexedDB — clearing site data generates a new UID and orphans cloud saves. Google sign-in survives device switches and data clears. Not urgent while play is on one device, but the right eventual fix.

---

## Phase Status

### Phase 1 — No broken mechanics (COMPLETE)
### Phase 2 — Christian's active experience (COMPLETE)
- ✅ CharDrawer/CharSheet rollable elements — prefill-input
- ✅ Browse Compendium button on CharSheet Spells tab
- ✅ Compendium: class/level filters, inline accordion, section counts
- ✅ Rules/Glossary/Feats inline accordion
- ✅ Mass test panel — 24-mechanic Run All, auto-audit
- ✅ Undo button left (sidebar handle clear)
- ✅ Spell ⓘ in ActionsDrawer
- ✅ Combat tracker auto-close fix + Victory button
- ✅ Conditions add/remove parsing

### Phase 3 — Second player ready
- Nyx's player joining cleanly
- Multiplayer as NPC ally (new player request)
- Guest experience audit

### Phase 4 — July 11 deadline
- [ ] AI DC determination (complex, do last)

---

## Backlog (Player-First Priority)

1. **Large text accessibility mode** — toggle in Settings, bumps base font size ~30%
2. **Combat card slim-down** — strip spells; keep: turn prompt + round + Action/Bonus/Move + attacks only
3. **Color themes real treatment** — pick 3-4 themes, do real visual polish (not just hue swaps)
4. **Data protection trio** — save indicator + hard refresh + reset confirmation (see above)
5. **Dice tab in QuickActions** — DiceRoller.jsx exists but is wired to nothing
6. **Multiplayer as NPC ally** — Phase 3
7. **AI DC determination** — Phase 4, do last

---

## Known Gaps Still Unbuilt
- Combat card TurnPrompt redesign (strip spells, keep turn prompt + economy)
- Color themes — real design treatment per theme
- Large text accessibility mode
- Dice tab inside QuickActions
- AI DC determination (Phase 4)
- Multiplayer bundles MVP (data/bundles.js stub)
- `dbWrite()` write failures never surface (cosmetic)
- Data protection trio (save indicator, hard refresh, reset confirmation)

## Live Verification Still Needed
- S65: NPC deep-link, Gate 8 tap, CharDrawer/CharSheet roll connections, Compendium overhaul
- S66: Combat tracker fix, Victory button, conditions fix, spell ⓘ in sidebar, undo position
