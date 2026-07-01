# Session Log — S65 (2026-07-01)

## Branch / Build
Branch: `claude/latest-test-analysis-v64a6i` · last commit: see below · build clean · 60/60 tests

---

## What Shipped This Session

### Gate 3 drift_hp false positive fix (`b3c3e90`)
- Gate 3 was flagging every combat turn as "HP change narrated without mechanic"
- Root cause: PC damage uses `damage:` mechanic, not `hp:`. Gate 3 only checked for `hp:`
- Fix: added `&& !mechanicKeys.has('damage') && !mechanicKeys.has('temp_hp')` to the condition
- File: `src/ai/gates.js`

### NPC deep-link in Journal (`b3c3e90`)
- Tapping "View in Journal" on an NPC tooltip in chat now navigates to Journal → People and auto-opens the matching NPCCard, scrolling it into view
- New: `pendingNpcFocus` signal + `navigateToNPC()` function in `sourceBus.js`
- Chat.jsx: NPC tooltip action uses `navigateToNPC(a.npc)` instead of `navigateTo('journal')`
- Journal.jsx: Section reactive to `props.open`; NPCCard has deep-link `createEffect` that matches name, opens card, scrolls
- Files: `src/ui/shared/sourceBus.js`, `src/ui/play/Chat.jsx`, `src/ui/reference/Journal.jsx`

### Gate 8 tappable XP request (`b3c3e90`)
- `missing_xp` gate flag was static text — no click handler
- Now renders as a `<button>` that pre-fills the input with an XP request
- File: `src/ui/play/Chat.jsx`

### style.css: gate-tap button styles (`b3c3e90`)
- Added `.gate-flag.gate-tap` and `.gate-flag.gate-tap:active` styles

### CharDrawer + CharSheet: dead `roll-request` events connected (`HEAD`)
- ALL `roll-request` CustomEvent dispatches in CharDrawer and CharSheet were firing into void — no listener
- Fixed by routing to `prefill-input` instead (consistent with ActionsDrawer's spell flow)
- CharDrawer: attack tap → `prefill-input: "${name} attacks with ${weapon}."` + closes drawer
- CharSheet abilities: tap → `prefill-input: "${name} makes a Strength ability check."`
- CharSheet saves: tap → `prefill-input: "${name} makes a Strength saving throw."`
- CharSheet skills: tap → `prefill-input: "${name} makes an Acrobatics check."`
- CharSheet attacks: tap → `prefill-input: "${name} attacks with ${weapon}."` + navigate to play
- CharSheet initiative: tap → `prefill-input: "Roll initiative for ${name}."`
- CharSheet spell attack: tap → `prefill-input: "${name} makes a spell attack."`
- Files: `src/ui/play/CharDrawer.jsx`, `src/ui/reference/CharSheet.jsx`

---

## Phase Status

### Phase 1 — No broken mechanics (COMPLETE)
- ✅ Action Economy enforcement — Gate 2 does this via prose scanning
- ✅ Scene Transition gate — pendingLocation + ContextBanner "Go/Stay" already built
- ✅ Gate 3 false positives in combat — fixed this session
- ✅ Gate 8 XP flag — now tappable/actionable

### Phase 2 — Christian's active experience (COMPLETE)
- ✅ Spell DB expansion past L2 — already had L0-L9 for all classes (339 spells)
- ✅ Inline NPC name linking — already built; now with Journal deep-link
- ✅ Quest log UX — search + ✓ button already shipped S64
- ✅ CharDrawer/CharSheet rollable elements — now connected to prefill-input

### Phase 3 — Second player ready
- Nyx's player joining cleanly
- Guest experience audit

### Phase 4 — July 11 deadline
- [ ] AI DC determination (complex, do last)

---

## All Player-Requests (player-requests-v2.md) Status
- ✅ SPELL_DB expansion past L2 — already done
- ✅ Pre-built class progression downloads — already done (all 12 classes in data/level-up-*.json, seeded via seed.js)
- ✅ Inline NPC name linking — done (deep-link added this session)
- ✅ Quest log UX refresh — search + archive button shipped S64
- CharWizard supports all 12 classes (AVAILABLE_CLASSES = Object.keys(CLASS_DATA))

---

## Autonomy Rules
- **Safe to build fast:** UI, CSS, new mechanic handlers, contracts, Journal/Cargo/drawer improvements
- **Flag before touching:** engine.js pipeline, mechanics.js enforcement logic, Firebase schema, state ownership

---

## Known Gaps Still Unbuilt
- AI DC determination (Phase 4 — complex)
- Multiplayer bundles MVP (data/bundles.js stub)
- `dbWrite()` still never surfaces write failures to callers (cosmetic, flagged S61)
- S62 features need live two-device verification

## Live Verification Still Needed
- S62: presence badge two-device, join auto-retry, tab-kill character merge
- S57: PC attack-roll/Critical Hits (needs live combat)
- All S64 features (need real play session with Christian)
- This session: NPC deep-link, Gate 8 tap, CharDrawer/CharSheet roll connections
