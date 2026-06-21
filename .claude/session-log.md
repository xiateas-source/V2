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

### In Progress
- Nothing mid-task — clean stopping point

### Next Up
1. **QuickActions** — short rest / long rest buttons in play UI (most impactful next)
2. **Scene transition confirmation** — Law 2 gate: AI location change requires player OK
3. **Previously On** — session recap when resuming play
4. **Setup mode** — SessionZero wizard, CharCreate flow
5. **Nav badges** — show state changes happened in other modes

### Branch State
- Branch: `claude/session-start-protocol-o8jf7j`
- Last commit: 436033c
- All code committed and pushed
- Not merged to main
- 10 commits on branch total (5 from this session)
