# Session Log — Handoff Note

## Session 34 · 2026-06-21

### Shipped
- **QuickActions** (`QuickActions.jsx`) — 22 presets across 5 categories, context-aware pill-bar, swipe-up drawer, full customization, instant/prefill modes, localStorage persistence
- **DevTools extraction** (`DevTools.jsx`) — moved ~160 lines of test infra out of InputBar, added 5 new test batches (temp_hp, hit_dice_use, inspiration, death_save, round_advance), lazy-loaded with Suspense
- **Combat end button** (`Combat.jsx`) — manual "End" button fires `combat_end` mechanic
- **Scene transition confirmation** (`ContextBanner.jsx` + `mechanics.js`) — `pendingLocation` gate: AI location changes require player Go/Stay confirmation (Law 2)
- **Previously On** (`PreviouslyOn.jsx`) — session recap when returning after >1hr idle, shows location/party/quests/consequences
- **Nav badges** (`App.jsx`) — dot indicators on Cargo/Journal when state changes while on Play tab
- **Unmentioned PC detection** (`drift.js` + `engine.js`) — drift warning when AI narrates actions for a PC the player didn't mention (Law 2, Gate 5)
- **CharSheet manual override** (`CharSheet.jsx`) — tap HP to edit inline (clamped to 0–hpMax), tap conditions to remove, + button to add new conditions
- **NPC name linking** (`Chat.jsx`) — NPC names in chat auto-link to NPC tracker, tap for details popup
- **Glossary term linking** (`Chat.jsx`) — D&D terms auto-link from IndexedDB glossary, tap for definition popup
- **Tooltip popup system** (`Chat.jsx` + CSS) — tap-to-dismiss overlay for NPC/term detail (Law 4: tap-to-source)
- **Ask DM interception** (`engine.js`) — inventory/gold/spells/HP/location queries answered instantly from local state without API call (Law 5: zero cost)
- **Level-up glow** (`CharTiles.jsx`) — tiles pulse green when XP >= next level threshold (character IS the notification)
- **SituationBar enhanced** (`SituationBar.jsx`) — chips tappable with detail popups, consequences sorted by urgency, deadlined ones pulse
- **Firebase auth fix** — 5s timeout prevents app hanging when offline

### Decisions Made (Session 34)
- QuickActions uses two-state pattern: collapsed pill-bar (always visible) + expanded drawer (swipe up)
- "Say It" mode toggle: instant-fire vs pre-fill input bar for editing
- Scene transition uses pending pattern — AI sets `pendingLocation`, UI confirms
- Ask DM interception returns instant answers for factual state queries, passes complex questions through to AI
- CharSheet HP edit is clamped (can't go below 0 or above hpMax) — prevents accidental invalid state
- NPC/term linking uses delegated event handlers on chat container (no per-message listeners)
- Glossary terms filtered to >3 chars to avoid false-positive linking on short words
- Level-up detection uses inlined XP thresholds (small array, avoids async IndexedDB call)

### Known Issues
- No push notifications
- ElevenLabs TTS not integrated (free tier only for now)
- Setup mode (SessionZero, CharCreate) still unbuilt
- No multi-player mode toggle (single player only currently)
- Gate 1 (Roll confirmation) not built
- Gate 2 (Combat turn enforcement) not built
- Gate 6 (Spell validation) not built
- Gate 7 (Skill check requirement) not built
- Gate 8 (XP audit) not built
- Gate 9 (Income/loot reconciliation) not built
- Citation linking (PHB page references) not built
- Term glossary linking may false-positive on creative NPC dialogue
- No scroll-position-aware auto-scroll or "new messages" indicator yet

### In Progress
- Nothing mid-task — clean stopping point

### Next Up
1. **Enforcement gates** — Gate 1 (roll confirmation) and Gate 2 (combat turns) are highest priority for play quality
2. **Multi-player toggle** — mode switch + Previously On handoff trigger
3. **Setup mode** — SessionZero wizard for new campaigns
4. **Push notifications** — Web Push for multi-player awareness
5. **Scroll behavior** — conditional auto-scroll + "N new messages" indicator
6. **Citation linking** — auto-link PHB references to compendium

### Branch State
- Branch: `claude/session-start-protocol-o8jf7j`
- Last commit: 4877685
- All code committed and pushed
- Not merged to main
- 4 commits this session (on top of 3 from earlier this session + previous sessions)
