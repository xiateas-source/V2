# Decisions Log

*Design choices already made. Check here before re-deciding something.*

---

## Architecture

| Decision | Rationale |
|----------|-----------|
| SolidJS with signals | Fine-grained reactivity without virtual DOM overhead |
| Vite build system | Fast dev server, clean builds |
| Five-piece architecture: UI, Engine, State, Data, Content | Clear boundaries, each piece has one job |
| Module map organized by mode (play/reference/setup/manage) | Law 4 — directory boundaries prevent mode bleed |
| Dispatch table pattern for mechanics | Each mechanic key registers a handler. Extensible without touching core. 72 keys in V2. |
| The Forge (`data/forge.js`) — one builder, four doors | All creation paths funnel through `forgeCharacter(intent)`. Doors supply creative intent; the Forge derives ALL mechanics. AI's math is never trusted. |
| `traits {trait,ideal,bond,flaw}` — structured, player-owned | Legacy `personality` string composed from traits. Sheet edits rewrite traits and recompose. |
| Quick Pick = fully random; "Recommended" = optimal-but-chosen | Two different affordances. Quick Pick rolls everything for instant play. |
| Separate Firebase project for v2 | Clean break, no data collision with v1 |
| Build order: interface first (Phases 3→4→5→6→0→1→2→7→8) | Building UI first prevents confusing engine code for a working game |

## Modes & Navigation

| Decision | Rationale |
|----------|-----------|
| Four modes: setup, play, reference, manage | Every feature belongs to exactly one mode |
| 4-item bottom nav: Cargo / Play (d20) / Journal / Settings | Developer reinstated Play button (S43) — clear way back to session |
| Combat overlay, not combat tab | Appears when combat starts, disappears when it ends |
| Level-up wizard is event-driven | Triggers on XP threshold, not from a button |
| Setup locks after campaign launch | One-way transition. Setup → Play. |
| Reference is overlay, not navigation | Tap character tile → sheet slides up. No mode switch. |

## UI Principles

| Decision | Rationale |
|----------|-----------|
| Mobile only — no desktop fallback | Law 3. Portrait mode, one-handed. |
| Tap-to-source — no dead text | Any displayed information tappable → navigates to source |
| Situation bar replaces quest bar | Main quest pinned left, consequences sorted by urgency, overflow = +N chip → Journal |
| Context banner: single slim line | Location · time · weather · listen toggle. All tappable. |
| No suggestion chips | Cut — Quick Actions + Ask DM replace the need |
| No `//` command system | V2 mechanics pipeline replaces them. Dev commands in DevTools. |
| Two chat tabs: Narrative + OOC | Narrative = full AI pipeline. OOC = player text + Ask DM (advisory, no mechanics). |
| Ask DM gets context from both tabs | Full situation awareness, advisory-only behavior |
| No visible OOC echo | Recent Ask DM exchanges silently injected into buildPrompt |
| Overlays vs persisted messages | Roll requests, scene holds, combat prompts = ephemeral. Gate flags, XP audits = persisted. |
| Stop generation button | Cancel streaming, keep text, discard partial mechanics |
| CharSheet tab "Vitals" not "Combat" | Avoids confusion with the combat overlay |
| "What changed" tab badges | Pulsing gold dot on tabs where AI mechanics changed fields |
| Swipe between PCs in character sheet | Dot indicators show position |
| Rest buttons on Vitals tab | System operations, not AI chat |
| Every modifier is a roll | All d20-eligible fields tappable for instant rolls |
| Spell Save DC + Attack at top of Spells tab | Always visible — casters need these constantly |
| Derived bonuses, not stored | All bonuses computed at render time. Nothing stored that can be computed. |

## Data & Storage

| Decision | Rationale |
|----------|-----------|
| Three data tiers: Firebase, IndexedDB, Shared Bundles | Firebase = game state (synced). IndexedDB = reference (local). Bundles = content packs. |
| Campaign vs System data split | Campaign resets on swap. System survives. |
| Compendium → IndexedDB, AI-generated → Firebase | Sourcebook = reference (local). Play-created = game state (synced). |
| Campaign map images → IndexedDB | Too large for Firebase. Pins sync via Firebase. |
| API keys local-only | Never synced to Firebase |
| Shared API key fallback via `shared/providerKeys` | Guests join with zero setup — host's key is read automatically on boot |
| All Firebase/IDB restores pass through `healArrays()` (persist.js) | RTDB silently nullifies/omits empty arrays on write, at any nesting depth (top-level campaign fields, per-character fields, and nested object fields like `combatState.initiative`). Heal against `DEFAULT_CAMPAIGN`/`DEFAULT_CHARACTER` at the load boundary rather than scattering optional-chaining guards through components (S50, after 3 separate boot crashes traced to this). |
| Deploy pipeline ships hosting only | `database.rules.json` is never auto-deployed; rules changes must be applied manually in Firebase Console until CI gets a `firebase deploy --only database` step |

## State & Ownership

| Decision | Rationale |
|----------|-----------|
| Field ownership: AI / Player / System | No field writable by more than one owner. Full field inventory in `ui-specs-v2.md`. |
| `background` and `alignment` system-owned | Set at creation, locked during play |
| `hp` AI-owned with player override | Normal: AI writes via mechanic. Override: player +/- with audit flag. |
| Checkpoint/rewind in play mode | Law 2: "when enforcement fails, the player can rewind" |

## Engine & AI

| Decision | Rationale |
|----------|-----------|
| Drift detectors in mechanics pipeline | Catch AI narrating state changes without emitting mechanics |
| Active consequences injected into buildPrompt | AI can't forget time-sensitive events |
| Memory is a feature (Law 5) | Session summaries, pruned chat, context injection keep prompt lean |
| Never depend on a single AI provider | Retry + fallback across providers |
| All rolls must be player-confirmed | Engine rejects mechanics depending on unsubmitted rolls |
| Scene transitions require player confirmation | AI cannot switch location/time without player consent |
| AI cannot act for unmentioned PCs | Must ask, not decide |
| Narrative DM = epic narrator + rules lawyer | Both vivid storytelling AND by-the-book structure |
| Narration style field in Session Zero | Player-configurable, injected into contract |
| IndexedDB reads fail soft in the AI pipeline | Mobile browsers can close IDB connections when backgrounded. `openDB()` checks liveness and reopens; `buildRulesBlock()` swallows errors. Losing rules context is acceptable — crashing the player's turn is not. |

## Combat

| Decision | Rationale |
|----------|-----------|
| Phase 1: zone grid. Phase 2: visual tile map | Zone combat is V2 starting point |
| Engine owns the turn pointer; AI only narrates | `advanceCombatToNextPC()` deterministic. Code is single source of truth. |
| PC initiative written deterministically | RollBar writes roll straight into `combatState.initiative[].roll` |
| Enemy turns auto-stream; engine stops on each PC | No per-enemy pause. Enemies resolved in preceding PC's response. |
| Combat engine mode-agnostic (single vs multi) | One enforcement path. Single/multi flag controls push + labeling only. |
| Turn prompt derived from synced state | `combatState.currentTurn` syncs via Firebase → appears on all devices |
| `combatState.initiative` stored pre-sorted | Highest first. Every consumer indexes the same way. |
| Auto-hide CharTiles + SituationBar during combat | Redundant with initiative tracker. Reclaims ~214px. |
| Combat auto-minimize on PC turns | Overlay minimizes on PC turn, expands on NPC turn |
| TurnPrompt minimizable via dice button | During combat, dice button toggles TurnPrompt instead of QuickActions |
| Spell info icons on combat turn card | ⓘ on spell chips → description tooltip |
| `roll_request` code-enforced PC-only | Validation rejects non-PC targets |

## Character Creation

| Decision | Rationale |
|----------|-----------|
| Backstory/personality/appearance at creation + editable on sheet | Added to creation flow and Bio tab |
| Lossless wizard re-entry — edit committed PC in place | Roster ✏ reopens wizard pre-filled. Equipment step skipped in edit mode. |
| Manual ability entry (4th method) | Direct base entry alongside Standard Array / Roll / Point Buy |
| `avatar` emoji on character, player-owned | Falls back to name-initial monogram |
| Tap-to-source in wizard | Spell/skill chips carry ⓘ with description |
| Party role-coverage hint | Quiet nudge (no healer / no frontline / no spellcaster) |
| Draft-safety gate (Resume / Start fresh) | Explicit choice instead of silent auto-resume |
| Premise directly editable | Textarea, not read-only. Brainstorm still works as starting point. |

## Familiar System

| Decision | Rationale |
|----------|-----------|
| `familiar_add` / `familiar_update` mechanics | AI creates/updates familiars through the pipeline |
| Full familiar stat block in CharSheet Vitals | Collapsed header + expandable detail |
| NPC fuzzy dedup | exact → startsWith → first-word match |

## Deployment

| Decision | Rationale |
|----------|-----------|
| Auto-deploy on push to main | `.github/workflows/deploy.yml`. ~2 min after push. |
| Live site: `pebble-v2.web.app` | `firebase.json` site=pebble-v2, public=dist |
| Check what's live before deploying | Don't overwrite uncommitted builds |

## Content Pipeline

| Decision | Rationale |
|----------|-----------|
| Four input paths: files, web, homebrew, AI-generated JSON | PDF/epub/mobi, web reference, in-app authoring, structured JSON |
| All content normalized to common schema per type | Engine reads from IndexedDB, not hardcoded constants |
| Spell JSON uses `description`/`castingTime` | Long names match UI expectations |
| Array-based class lookup (`getSpellsForClass`) | `getAll` + filter avoids IndexedDB schema migration |
| Build-time spell script, committed output | `scripts/build-spells.js` → `data/spells.json`. Runs once during dev. |
| D&D 5e primary, not the only system | Architecture supports any game content |

## Game Loop (S48)

| Decision | Rationale |
|----------|-----------|
| Three-phase action resolution: classify → roll → narrate | Fixes "story game" feel. Code decides when rolls happen, not the AI. The AI narrates predetermined outcomes. |
| Code-based classifier with pattern matching | Fast (no AI call), handles 80% of cases. Skip button for false positives. |
| Standard DC tiers (easy=10, medium=13, hard=15) | Ships fast. AI DC call can be added later for context-aware difficulty. |
| Classifier skips combat (existing flow handles it) | Combat already has initiative, turn order, action economy. Don't double-classify. |
| Pre-send rolls as a new RollBar source | Same UI, same dice, different trigger. Player doesn't notice the architectural difference. |
| PREDETERMINED ROLLS contract clause | AI receives outcome facts and narrates them. Can't contradict the dice. |
| `sendNarrative()` extracted from `sendMsg()` | Both the normal flow and `resumeAfterRolls` share the same AI call + mechanics pipeline. |

## Rules Enforcement (S51)

| Decision | Rationale |
|----------|-----------|
| Combat status drift check uses bounded name lookup, not generic prose regex | Mirrors the existing `unmentioned_pc` pattern: scan vicinity of a known PC/enemy name for defeat language, rather than matching defeat phrases anywhere in prose. Avoids false positives on flavor text. |
| Rule penalties (encumbrance, conditions) enforced via `advState` in RollBar, not the AI | Law 2: the AI was told the rule in the contract/ledger but had no obligation to apply it. Mechanical penalties that resolve to "disadvantage on a roll" piggyback on the exhaustion disadvantage path already in `RollBar.jsx`, applied at roll-resolution time using live `pc.conditions`/inventory weight. |
| Auto-fail (vs. disadvantage) deferred for Paralyzed/Stunned/Unconscious/Petrified | Needs a forced-failure path through roll resolution (`effectiveD20`/`total`/`submitAll`/`submitInitiative`), not just an `advState` flip — bigger surface area than the disadvantage-only fixes, left for a follow-up session. |
| Ability-check vs. saving-throw not distinguished in roll data | `roll_request`'s `skill` field is reused for both (e.g. bare "Strength" could be either). Condition effects that differ by check-vs-save (e.g. Poisoned excludes saves under strict RAW) are applied blanket instead of guessing the type. **Superseded S52** — see below. |

## Rules Enforcement (S52)

A gap-analysis agent compared the codebase against the uploaded SRD 2024 `rulesglossary.md`/`playingthegame.md` and returned a 10-item punch list. User chose: switch encumbrance to 2024 SRD, then fix conditions + resistance enforcement.

| Decision | Rationale |
|----------|-----------|
| Encumbrance switched to 2024 SRD single-threshold model (STR×15 cap, no Encumbered/Heavily Encumbered tiers) | The app had the 2014 two-tier model duplicated wrong in 4 places (`contracts.js`, `RollBar.jsx`, `Cargo.jsx`, `CharSheet.jsx`). 2024 SRD has just one hard cap with no disadvantage tiers — picked SRD-accuracy over preserving the old (wrong) tiered penalty. |
| Exhaustion switched to 2024 SRD flat-penalty model (−2 per level to every d20 Test, −5ft speed/level, death at 6, Long Rest removes 1) | `RollBar.jsx` had a 2014-rules disadvantage-at-any-level implementation explicitly marked `// (2014 rules)` in a code comment. Glossary confirmed the 2024 model is flat numeric, not disadvantage-based. |
| `isSavingThrow(skill)` heuristic: a bare ability name (e.g. "Dexterity") is a saving throw; a named skill (e.g. "Acrobatics") or "Initiative" is an ability check | Resolves the S51 "ability check vs. saving throw not distinguished" gap without changing the `roll_request` mechanic format. Works because `classifier.js` only ever emits named skills, never bare ability names — an implicit codebase convention `getSkillBonus()` already relied on. |
| Auto-fail implemented by forcing `total = -1` rather than restructuring success/failure plumbing | Both roll-resolution consumers (`resumeAfterRolls`, the `roll_request` flow) determine outcome purely via `total >= dc`. Forcing `total = -1` guarantees FAILURE regardless of DC with no new plumbing. |
| Auto-fail must carry a human-readable reason through every formatting path, not just the roll bar UI | Found via reading the three-phase pre-send path end to end: `resumeAfterRolls` built its outcome text from raw `total`/`d20`/`mod` numbers, so an auto-fail roll (faked as `total:-1, d20:0, mod:0`) would show "rolled -1 (d20: 0 +0)" to both the AI and the player's visible chat bubble instead of "automatically fails (Paralyzed)". Fixed by threading `autoFailReason` through `rollData` and special-casing it in `engine.js`'s outcome/suffix builders. |
| New `damage: PCname,amount,DamageType` mechanic, separate from `hp: Name=value` | The `hp` mechanic only ever carried an absolute new total — no damage-type signal existed anywhere for `DISPATCH.hp` to apply a resistance/vulnerability/immunity multiplier to. Rather than trust the AI's mental math (the exact "told, not enforced" pattern Law 2 exists to kill), the AI now reports raw damage + type and the app computes the multiplier and final HP itself. `hp:` is kept as-is for healing and enemy/NPC damage (no resistance data tracked for non-PCs). |
| Resistance = ×0.5, vulnerability = ×2, immunity = ×0, applied in that order if a PC somehow has both | Matches SRD wording exactly; applying both in sequence nets back to ×1, which is the correct RAW outcome for double-tagged edge cases without needing special-case logic. |
| Charmed, Deafened, and part of Grappled left cosmetic-only (no roll-time enforcement) | Auto-fail/disadvantage for these requires data the app doesn't capture: which specific check "requires hearing/sight" (Deafened/Blinded's sight-only half), or who the grappler is (Grappled's "disadvantage on attacks against anyone but the grappler"). Documented as a known gap rather than silently dropped or guessed at. |

## Open Questions

- **Child-friendly view target age** — 7-16 is wide. What's the actual simplification scope?
- **Episode/module tracking system** — How does the AI know where the party is in the story? Needs spec.
- **Quick Actions redesign** — What actions? How presented?
