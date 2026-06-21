# Session Log — Handoff Note

## Session 33 · 2026-06-21

### Shipped
- **Combat overlay** (`Combat.jsx`) — initiative order, HP bars, zone map, turn advancement button
- **Rewind/Undo** (`Rewind.jsx`) — reverses all mechanics from last AI response (Law 2 enforcement)
- **Character sheet overlay** (`CharSheet.jsx`) — full sheet: abilities, attacks, slots, spells, features, resources, inventory, proficiencies
- **Drift detector** (`drift.js`) — flags AI narrating state without emitting mechanics (gold, items, NPCs, HP, rolls in prose)
- **Browser TTS** (`browserTTS.js`, `TTS.jsx`) — Web Speech API, auto-read mode for hands-free play
- **Firebase sync** (`sync.js`) — reactive 3s debounced sync, offline-first with localStorage fallback
- **Dice roller** (`DiceRoller.jsx`) — quick d4-d100 buttons with nat 20/1 styling
- **Compendium browser** (`Compendium.jsx`) — searchable spells/rules/glossary from IndexedDB, lazy-loaded in Journal
- **Temp HP mechanic** — absorbs damage first, doesn't stack, cleared on long rest
- **Hit dice spending** — HD use mechanic with CON mod healing
- **Inspiration mechanic** — grant/remove via mechanics pipeline
- **Exhaustion penalties** — disadvantage on ability checks at level 1+
- **Death save tracking** in mechanics pipeline
- **Long rest** — full HP, slot recovery, HD refresh (half), clear temp/exhaustion
- **Combat initiative** — sorted by roll, round/turn tracking, round_advance mechanic
- **Enhanced memory** — summaries preserve mechanics, 16 event retention
- **CharTiles enhanced** — spell slot pips, exhaustion, death saves, temp HP, tap-to-source
- **Combat prompt** — sorted initiative with >>> marker and [DOWN] status

### Decisions Made (Session 33)
- TTS uses free Web Speech API (Law 5), ElevenLabs is future upgrade path
- Firebase sync is reactive with 3s debounce, not on every state change
- Drift detector warns but doesn't block — player sees yellow pills
- Rewind reverses mechanics but keeps the message visible (crossed out)
- Compendium is lazy-loaded tab in Journal, not a separate nav item
- Combat overlay appears automatically when combatState.active = true

### Known Issues
- QuickActions.jsx still a stub (short rest/long rest buttons not built)
- Scene transition confirmation not yet implemented (Law 2: "require player confirmation")
- Gate 5 unmentioned PC detection not built
- "Previously On" session recap not built
- No push notifications
- ElevenLabs TTS not integrated (free tier only for now)
- Setup mode (SessionZero, CharCreate) still unbuilt
- Nav badges for state changes in other modes not built

### Technical Debt / Refactor Notes
- **Test page is undocumented and lives in InputBar.jsx** — SCENARIOS array (8 scenarios) and DIRECT_TESTS array (9 batches) are hardcoded in the input component. Should be extracted to its own `DevTools.jsx` or `src/ui/manage/DevTools.jsx` and documented. Currently tests don't cover: `temp_hp`, `hit_dice_use`, `inspiration`, `death_save`, `round_advance` — all new mechanics from this session.
- **InputBar.jsx is overloaded** — contains ~160 lines of test infrastructure (scenarios, direct tests, export) plus the actual input bar. Split into InputBar + DevPanel.
- **CSS is one giant file** (`style.css`) — 786 lines added this session alone. No component scoping. Works but will get unwieldy.
- **sync.js watches specific fields** — if new state fields are added (e.g. familiar, reputation), sync watchers need manual updating. Consider a more generic approach later.
- **Rewind only undoes the last message** — doesn't support multi-step undo. Fine for now but players may want deeper history.
- **Drift detector is regex-based** — catches obvious cases but can false-positive on creative narration. May need tuning after real gameplay.
- **Combat.jsx has no end-combat UI** — relies on AI emitting `combat_end` mechanic. Player should have a manual "end combat" button.
- **CharSheet is read-only** — no Manual Override / editing yet (specced in workboard as future work)

### Architecture Notes for Next Session
- All new mechanics follow the pattern in `mechanics.js`: handler in `HANDLERS` map → validates → mutates store → returns applied flag
- Drift detector (`drift.js`) exports `detectDrift(narrative, mechanics)` → returns array of `{type, text}` warnings
- TTS (`browserTTS.js`) exports signals: `speaking()`, `autoRead()`, and functions: `speak(text)`, `stop()`, `toggleAutoRead()`
- Firebase sync (`sync.js`) exports: `initSync()` (called in main.jsx), `forceSyncNow()`, `loadCampaignFromCloud()`
- Combat overlay visibility is purely reactive: `<Show when={store.campaign.combatState.active}>`
- CharSheet opens via CharTiles tap → sets a signal → renders sheet-panel overlay
- Compendium reads from IndexedDB stores: 'spells', 'glossary', 'compendium' (seeded by content pipeline)
- Memory pruning (`memory.js`): 12K token threshold → prune to 8K → keep min 4 messages → local summary replaces old messages

### In Progress
- Nothing mid-task — clean stopping point

### Next Up
1. **QuickActions** — short rest / long rest buttons in play UI (most impactful next)
2. **Scene transition confirmation** — Law 2 gate: AI location change requires player OK
3. **Previously On** — session recap when resuming play
4. **Extract DevTools** — move test page out of InputBar, add missing mechanic tests
5. **Setup mode** — SessionZero wizard, CharCreate flow
6. **Nav badges** — show state changes happened in other modes
7. **Combat end button** — manual override for ending combat without AI mechanic

### Branch State
- Branch: `claude/session-start-protocol-o8jf7j`
- Last commit: ab6f70a
- All code committed and pushed
- Not merged to main
- 11 commits on branch total (6 from this session)
