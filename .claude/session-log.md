# Session Log — Handoff Note

## Session 41 · 2026-06-24 — Character creation Phase 4 (editable re-entry + VTT niceties)

**Theme:** make character creation fully re-editable and bring it up to popular-VTT
standards. Built on branch `claude/character-creation-phase-4-r94wpq` (NOT yet merged
to main — awaiting developer review).

### Shipped (build + 33/33 tests green; not yet deployed)
- **Lossless wizard re-entry (the core ask).** Roster ✏ reopens the guided wizard
  pre-filled from a committed PC; "Save Changes" updates **in place** (same `id`,
  so inventory/combat refs stay linked). Play-state the Forge would reset is
  preserved: current HP (clamped to new max), conditions, XP, slots (clamped),
  familiar, notes. Equipment step is **skipped in edit mode** (gear already in the
  pack → managed in Cargo, never re-issued). Closes the gap where class / abilities
  / skills / spells / background were locked after commit.
- **"Manual" ability method** — 4th option (Standard / Roll / Point Buy / Manual).
  Direct base-score steppers (1–30, no budget). Enables the lossless edit round-trip
  (base = stored final − racial) and is genuine D&D-Beyond-parity entry.
- **Tap-to-source in the wizard** — ⓘ on every spell + skill chip opens a bottom
  sheet with the description (spells from IndexedDB compendium incl. `desc`; skills
  from new `SKILL_DESC` map in quickBuild.js). Accessibility win for the child player.
- **Avatar picker** — new player-owned `avatar` emoji field (DEFAULT_CHARACTER +
  ownership + Forge). Set in the Bio step (emoji grid + name-monogram fallback),
  shown on the roster chip.
- **Party role-coverage hint** — roster nudge (no healer / no frontline / no
  spellcaster) computed from the party.
- **Draft-safety gate** — Guided Build with an unfinished draft now shows an explicit
  Resume / Start-fresh choice instead of silently auto-resuming. Editing never
  touches the draft slot. Roster is hidden while any builder mode is active (removes
  a mid-edit footgun where another ✏ wouldn't re-hydrate).

### Decisions made (see decisions.md, all Session 40→41 rows)
- `avatar` is a player-owned data-model field (approved as part of Phase 4 scope).
- Edit updates in place by `id`; equipment is Cargo's job, not re-issued on edit.
- Manual ability entry added as a real 4th method.

### Known issues / watch
- **Not merged to main / not deployed** — work is on the feature branch only.
- CharSheet header still shows the name monogram, not the new `avatar` emoji
  (roster + wizard cover it; CharSheet display is a small follow-up).
- Edit mode preserves equipment as-is; changing class in edit does NOT swap starting
  gear (intentional — gear is managed in Cargo). Flag if the family expects it to.
- Spell `desc` only available for compendium-seeded spells; fallback spell lists show
  a "placeholder" note in the info sheet.

### Key files touched
- `src/ui/setup/CharWizard.jsx` — edit re-entry/hydrate, Manual method, tap-to-source
  info sheet, avatar picker, draft-safety gate, Save-Changes commit branch
- `src/ui/setup/CharCreate.jsx` — edit wiring (editIndex/startEdit/handleSaveEdit),
  roster ✏ + emoji avatar, role-coverage hint, roster hidden during builder modes
- `src/data/forge.js` — `avatar` in output
- `src/data/quickBuild.js` — `SKILL_DESC`, `AVATAR_EMOJI`
- `src/state/campaign.js` — `avatar` on DEFAULT_CHARACTER
- `src/state/store.js` — `avatar` registered player-owned
- `src/style.css` — Phase 4 block (gate, info sheet, avatar, coverage, edit btn, chip ⓘ)

### Next up
1. Developer review → merge to main (auto-deploys).
2. Optional: show `avatar` on CharSheet header too.
3. Remaining Phase 4 candidates from S40: AI co-pilot per wizard step; more
   classes/subraces/subclasses; stored spell DC/attack.

**Branch state:** `claude/character-creation-phase-4-r94wpq` (commit pending this
handoff). Built clean (~161kB gzip main), 33/33 tests pass.

---

## Session 40 · 2026-06-23/24 — Character-creation overhaul (the Forge) + deploy

**Theme:** unify and complete character creation across all four paths, then
make the sheet reflect it. All work shipped live to pebble-v2.web.app via the
push-to-main GitHub Action.

### Shipped (all merged to main + deployed)
- **CharWizard** — 7-step guided builder (class/race → background/alignment →
  abilities [3 methods] → skills → spells [auto-skip martial] → equipment →
  name/bio). Replaced the old single-screen QuickBuild. Three original paths
  preserved (AI / Paste / Guided) + a new one.
- **Quick Pick (4th path)** — one tap rolls a full random character (class,
  race, background, alignment, scores, skills, spells, equipment, traits),
  shows a full character card with Re-roll. CharCreate page redesigned: 2×2
  path grid with Quick Pick featured, tappable **party roster**.
- **The Forge (`src/data/forge.js`)** — ONE canonical `forgeCharacter(intent)`.
  All four paths funnel through it: doors supply *creative intent*, the Forge
  derives *all mechanics* (HP, AC, attacks, resources, features, slots, prof).
  Law 2 made literal — the AI's math is never trusted. `buildCharacter`
  delegates to it; wizard `buildAndCommit` collects intent; AI/Paste
  `onCharParsed` enriches through it (keeps creative choices, recomputes math;
  unsupported classes gracefully keep AI-provided attacks/features/spells).
  AI prompt constrained to the 3 supported classes / 6 races.
- **Phase 2** — Trait/Ideal/Bond/Flaw builder (4 fields, 🎲 roll-from-table +
  "Roll all") replacing the single personality box; **draft persistence**
  (wizard autosaves to localStorage, resumes on return, "Start over"); PHB
  **"Recommended"** auto-assign on the standard-array step.
- **Phase 3 — parity + sheet display** — AI/Quick Pick now produce the SAME
  criteria as Guided Build (skills incl. background, spells, alignment, TIBF).
  **CharSheet Bio tab now shows structured Trait/Ideal/Bond/Flaw**, inline-
  editable; saving rewrites traits + recomposes personality for the engine.
  AI prompt requires the full creative set; `onCharParsed` maps traits through
  and merges background skills. Roster characters tappable → full CharSheet
  overlay for review/edit.
- **Spell bug fix** (`2e70025`) — `autoSelectSpells` in quickBuild.js only fell
  back on thrown errors, not empty DB results. Quick Pick and AI Bards got zero
  spells. Fixed at two levels: (1) `autoSelectSpells` checks `length === 0`
  after the query and falls back to `SPELL_FALLBACK`, (2) the Forge guarantees
  supported casters never end up empty by calling `autoSelectSpells()` when
  spells are missing.
- **Criteria parity fix** (`e25ff58`) — Quick Pick was missing appearance and
  backstory (`randomFlavor()` call added). AI path was missing traits, bio,
  background, and alignment when the model omitted them (`onCharParsed`
  backfills with `rollTraits()`, `randomFlavor()`, random background/alignment).
- **Preview enrichment** (`66a5ec0`) — AI/Import draft preview now shows the
  full character: Background, Alignment, Skills, Saving Throws, Spells
  (cantrips + known), Features, Attacks (bonus + damage), Languages. Before
  this, only name/race/class, HP/AC/Speed, abilities, and bio boxes were shown.

### Decisions made
- **New canonical module `forge.js`** — single character builder; doors gather
  intent, Forge derives mechanics. Reduces the contract list (no "AI must
  compute HP" rule). Circular import with quickBuild.js is intentional and safe
  (cross-refs are call-time only).
- **Data-model change (approved): `traits: {trait, ideal, bond, flaw}`** added
  to DEFAULT_CHARACTER, registered **player-owned** in store.js ownership map.
  Personality string is composed from traits (kept for the game engine/prompt);
  legacy characters with personality text but no traits fall back to it.
- **Quick Pick = fully random** (surprise build, great for the child player).
  Distinct from PHB "Recommended" buttons (optimal-but-chosen).

### Known issues / watch
- Only **3 classes** (Fighter/Rogue/Bard) and **6 base races** have data; no
  subraces, no subclasses (subclass always ''), no level-1 choice features
  (Fighting Style, Expertise), no ASIs above L1. Forge is built to fill these
  boxes automatically as data is added.
- Personality tables are **generic** (not per-background). Roll buttons pull
  from a shared set; per-background tables are a future nicety.
- Spell save DC / spell attack bonus are computed on the CharSheet but NOT
  stored on the character (deferred to avoid a wider model change).
- AI may pick a background outside our 13 — then background skills aren't
  auto-merged (AI's own skills object still applies). Acceptable.

### Next up (Phase 4 candidates, from the design map)
1. Tap-to-source rules in the wizard (Law 4 — class features/abilities/spells
   tap through to reference mode).
2. Ambient AI co-pilot inside the wizard ("help me decide" per step) instead of
   a separate path.
3. Portrait/emoji avatar beyond color; party role-coverage hint ("no healer").
4. Content: more classes/subraces/subclasses → fills remaining PHB boxes.
5. Spell DC/attack as stored fields if a model pass is warranted.

### Key files touched this session
- `src/data/forge.js` — NEW, canonical character builder (~230 lines)
- `src/data/quickBuild.js` — `autoSelectSpells` fallback, personality tables,
  `rollTraits()`, `randomFlavor()`, `composePersonality()`, `buildCharacter`
  delegates to forge
- `src/ui/setup/CharCreate.jsx` — Quick Pick, 2×2 grid, party roster, AI/Paste
  backfill, full preview enrichment
- `src/ui/setup/CharWizard.jsx` — TIBF fields, draft persistence, Recommended
  button, delegates to forge
- `src/ui/reference/CharSheet.jsx` — TIBF display/edit on Bio tab
- `src/ai/setupPrompts.js` — AI prompt constrained + enriched
- `src/state/campaign.js` — `traits` added to DEFAULT_CHARACTER
- `src/state/store.js` — traits ownership registered
- `src/style.css` — Quick Pick, roster, TIBF, preview enrichment styles

**Branch state:** `claude/new-session-yp5z21` @ `66a5ec0`; merged to **main**,
deployed (GitHub Actions green). main and feature branch even. Branch is safe to
delete — all work is on main.

---

## Session 39 · 2026-06-23 — Doc reconciliation → visual-style exploration

**Two halves this session:** (1) reconciled docs to reality, (2) began the interface by finding a visual style (lots of mockup iteration, landed on a strong working direction).

### Half 1 — Reconciliation (build-forward baseline)
- **Decision:** restart from committed state; NOT recovering the lost uncommitted onboarding.
- Verified baseline: `npm install` clean · **33/33 tests pass** · `npm run build` clean (~143kB gzip).
- Added a **Reality Snapshot** to `workboard.md` superseding the drifted Phase-0–8 checkboxes; every `src/` file tiered (✅ tested / 🟢 real / 🟠 face / ⛔ stub / ◻️ absent).
- **Key truth:** the app is a **face** — engine is the real, partly-tested asset; the *playable experience does not exist*. Only onboarding (half) + combat are built for the player; everything else is loose components.
- **Root cause of the face (code trace):** no local persistence (`sync.js` is Firebase-only; boot never reloads a campaign — `loadCampaignFromCloud` unused), so every reload wipes `campaign.id` → back to onboarding; nothing endures. Law 1 offline-fallback NOT implemented. Annotated architecture.md accordingly.
- **DECISION: build the interface FIRST** (connective play surface + local-first persistence spine), then fill stubs / harden engine.

### Half 2 — Visual style (the interface starts here)
- Established the right framing through developer corrections: **color is already decided** (10 dark + 10 light rotating palettes) — style is the palette-independent skeleton. Avoid skeuomorphism (developer: an over-textured pass "looked like an early iOS game").
- **Landed direction → `modern-atmospheric.html`** (root): modern/atmospheric register — real type system (Cinzel + EB Garamond + Inter), flat panels, sparing gold, faint grain, **Phosphor icon set** (no emoji), **monogram avatars** + per-PC color ring, compact **party HUD frames** w/ active-turn highlight, **combat strip** (combat-only), **d20 dice icon** (inline SVG) on roll prompt + dice-roller button.
- **Player-experience pass** grounded in `player-requests-v2.md` + Five Laws: 16px input (no iOS zoom), **tap-to-source** (mechanic pills as buttons, linked NPC names, glossary-linked terms), **situation bar** with urgency-sorted consequences + **`+N` overflow → Journal**, **listen** controls (header toggle + per-message speaker), single-line **slim context banner**.
- Deleted the failed style mockups; kept `modern-atmospheric.html` (working base), `charsheet-mockup.html`, `palette-sampler.html`.

### Decisions locked this session (in decisions.md)
- Situation-bar overflow = `+N` chip → Journal's "Active Consequences (N)" (urgency-sorted; chosen over pure horizontal scroll). "For now."
- Context banner = single slim line (location · time · weather icon · listen).

### Known issues / open
- **Style not formally locked** — `modern-atmospheric.html` is the strong working direction, not yet declared THE style. Lock it when ready, then build in SolidJS.
- **Nav discrepancy:** mockup shows a 4-item bar (Cargo/**Play**/Journal/Settings); architecture/decisions say 3-item (Cargo/Journal/Settings, Play = default home). Resolve before building (4-item w/ explicit Play, or revert to 3).
- **Review items 5–9 still open:** rewind/checkpoint access in play, tappable PC frame→sheet + condition→clear, initiative chip strip, dual (wall+game) timestamps, tab naming (spec=Narrative/OOC; mockup drifted to "Table-talk").

### Next up
1. Lock the visual style (modern-atmospheric direction).
2. Resolve the nav discrepancy + review items 5–9.
3. **Build the real interface in SolidJS** on the working engine — start with the **persistence spine** (the root cause of the face) so a session survives reload.

**Branch state:** consolidated — this session merged to **main**; `claude/new-session-mr3qge`, `claude/transfer-v2-planning-docs-hlibvu` (orphan), and `gh-pages` (stale) pruned. **Work from `main` going forward.**
