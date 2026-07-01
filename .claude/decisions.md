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
| Side drawers (S63): combat companion, not CharSheet duplication | Left drawer = vitals + attacks. Right drawer = spells + resources. Full CharSheet still reachable via link at bottom. Drawers intentionally omit ability scores, skills, bio, equipment, XP — those live in CharSheet. HP/slots/resources still go through the mechanics pipeline. Handles are fixed-position on screen edges so they're always reachable even when combat overlay covers CharTiles. |
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
| Deploy pipeline ships hosting + database rules | `deploy.yml` runs both `action-hosting-deploy` and `firebase deploy --only database` on every push to main (S58) — `database.rules.json` is the source of truth, not the Console. |

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
| Action economy enforced at the quick-action UI, not by re-parsing AI prose | See "Action Economy enforcement (S67)" below |

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
| `STARTING_EQUIPMENT` covers all 12 classes, not just Fighter/Rogue/Bard (S53) | Was the original 3-class slice; Quick Pick/Guided Build can roll any of the 12 `CLASS_DATA` classes but 9 silently got zero gear. See "Onboarding Repair (S53)". |
| Quick Pick card shows starting gear + gold before commit | Matches standard VTT quick-build UX (e.g. D&D Beyond) — players shouldn't accept a character blind to what's in their pack |

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

## Onboarding Repair (S53)

| Decision | Rationale |
|----------|-----------|
| Filled `STARTING_EQUIPMENT` for Barbarian/Cleric/Druid/Monk/Paladin/Ranger/Sorcerer/Warlock/Wizard | Root cause of "Quick Pick characters get no gear" — `AVAILABLE_CLASSES` (12) always exceeded `STARTING_EQUIPMENT`'s coverage (3). Affected both Quick Pick and the Guided Build wizard equally, since both read the same table. Used standard 5e PHB starting-gear tables, same always/choices/goldOption schema as the existing 3 classes. |
| `forge.js` AC now reads `classInfo.startingAC` directly | Found while fixing the gear gap: AC was hardcoded to 16 for Fighter and `11+dexMod` (light-armor math) for every other "supported" class, ignoring the per-class `startingAC` field that already existed in `CLASS_DATA` and was correct. A Quick Pick Paladin was getting AC ~11 instead of 18. Classic Law 2 gap — data existed, wasn't read. |
| `CHAR_BUILDER_SYSTEM` prompt updated to list all 12 classes | The "Talk to AI" builder was still telling players "Supported classes: Fighter, Rogue, Bard ONLY" and steering them away from the other 9, even though Quick Pick/Guided Build/the Forge fully supported them. Stale instruction predating the 12-class CLASS_DATA expansion. |

## Rules Enforcement (S54)

| Decision | Rationale |
|----------|-----------|
| Death-save auto-fail and massive damage instant death enforced in `applyDamage()`/`handleDeathFromDamage()`, not left to the AI | Picked off the S52 punch list item: "Death Saves partial (no auto-fail on damage at 0 HP, no massive-damage instant death)". Same Law 2 pattern as the S52 `damage:` mechanic — the AI was told the SRD rule in `contracts.js` but nothing in code checked it, so a player's life/death outcome depended on the model doing the math correctly every time. |
| Massive damage threshold computed two ways depending on starting HP | If a hit drops a PC from >0 to 0 with leftover damage >= hp max, that's instant death (the classic "overkill" case). If a PC is already at 0 and takes a hit >= hp max, that whole hit counts (they have nothing to absorb it). Both match SRD wording; unifying them under one "remaining damage >= hp max" check would undercount the already-at-0 case since there's no "remaining" to subtract from. |
| `killPC()` extracted as a shared helper | The existing `death_save` mechanic's 3-failures branch and the new automatic-failure path both need to add the `Dead` condition and clear `deathSaves` — kept it in one place instead of duplicating. |
| AI contract updated to say "don't emit death_save for this, don't fight the code's Dead call" | Without this, the AI would keep narrating/emitting its own death_save mechanic on the same hit the code already auto-failed, double-counting failures, or narrate a death save prompt on a hit code already ruled instant death. |

## Multiplayer Join Bug Fix (S55)

A live bug report (with an exported campaign JSON as evidence) traced to three related multiplayer gaps, all fixed together since they share one root cause family — code paths that read/restore campaign or system state without going through the same healing/persistence machinery other paths already use.

| Decision | Rationale |
|----------|-----------|
| `joinCampaign()` now runs the Firebase data through `healArrays()` before committing it to the store | This was the actual crash: `joinCampaign()` wrote `dbRead()`'s result straight into `store.campaign` with no healing, unlike `restoreSession()` and `mergeCampaign()` which both already call `healArrays()`. Firebase RTDB drops empty arrays on write, so the host's character with `conditions: []` came back with `conditions` missing entirely; the guest's first message crashed in `genLedger()` on `pc.conditions.length`. Exported as `healArrays` from `persist.js` (was module-private) so `sync.js` can reuse it instead of re-implementing the heal logic a third time. |
| `system.multiplay` added to `persist.js`'s local snapshot/restore cycle | It was never persisted at all — every page reload silently reset a guest's `role`/`hostUid` back to the default `{role:'solo', hostUid:''}`, so all of that guest's subsequent Firebase writes went to their own orphaned uid path instead of the host's. This is why "Finch never saw Melody populate." Restored conditionally — only if `restoreGuestSession()` (which runs first at boot and checks a Firebase pointer) didn't already establish guest mode — so the more-authoritative cloud value wins when both are available. |
| `dbRead()` wrapped in a 10s timeout | `get()` can hang indefinitely with no network/no RTDB connection, which is the literal mechanism behind "page left pending indefinitely showing 'Joining…'" — `joinCampaign()`'s `await dbRead(...)` had nothing to make it ever resolve. Mirrors the existing 5s timeout pattern already used in `initFirebase()`'s auth race. |
| `html`/`body`/`#app` height switched from fixed `100%` to `100dvh` (with `100%` fallback) | "Character creation was cut off at the bottom" on mobile — a fixed-height, `overflow:hidden` shell doesn't shrink when the on-screen keyboard opens, so content below the fold (e.g. CharCreate's AI builder submit button) becomes unreachable. `100dvh` (dynamic viewport height) tracks the actual visible viewport including keyboard intrusion on supporting mobile browsers. |

### Follow-up (S55, same session): healArrays() generalized, host crash + cut-off DM messages

The first round of fixes above shipped, but the user's live two-device test then reported the *host's* ("Finch") game crashing with the identical `Cannot read properties of undefined (reading 'length')` error, plus DM messages appearing cut off mid-sentence. Both traced back to gaps the first round didn't cover.

| Decision | Rationale |
|----------|-----------|
| `healArrays()` rewritten from a flat/special-cased loop to a recursive `healStructure(value, defaults)` walk over `DEFAULT_CAMPAIGN`/`DEFAULT_CHARACTER` | The old version only checked `Array.isArray(defVal)` on *top-level* `DEFAULT_CAMPAIGN` keys, plus one hand-coded special case for `combatState`. `inventory` (`{carried:{}, wagon:[], hoard:[]}`) and `wagonState` (`{animals:[], maxWeight:0}`) are objects at the top level, so the loop skipped them entirely — `inventory.wagon`/`hoard`/`carried` and `wagonState.animals` were never healed, in any of the three call sites (`restoreSession()`, `mergeCampaign()`, `joinCampaign()`). `genLedger()` reads `c.inventory.wagon.length` unconditionally on every single message from any player — this is what crashed Finch's own client once his Firebase data lost that field (independent of the guest's bug; his own live-sync listener calls `mergeCampaign()` → `healArrays()`, which never fixed this). The recursive version heals any array/object field at any depth against its default shape, so this class of gap can't recur the same way for a new nested field added later. |
| Stream errors (not just `AbortError`) now finalize a stuck `partial:true` DM/OOC message before the error toast is shown | Root cause of "half the last messages from the DM have been cut off": `sendNarrative()`/`sendOOC()` create a `partial:true` placeholder message and stream into it; if the stream throws for any reason other than user-initiated abort (network drop, provider error, or any other mid-stream failure), the old catch blocks appended a new `system` error message but never reset that placeholder's `partial` flag — it stayed stuck forever showing whatever partial text had streamed in, i.e. visibly cut off. Added `finalizeStuckPartial()` in `engine.js`, called from every non-abort catch path, mirroring the manual `partial`-clearing the `AbortError` branch already did. |

### Restore-time partial-message healing (post-S55, found via test transcript analysis)

A later test transcript showed the *same* stuck-`partial:true` symptom recurring even after the S55 follow-up shipped. Root cause: `finalizeStuckPartial()` only runs inside a JS `catch` block during live execution — a reload or backgrounded tab that interrupts a stream mid-flight throws no JS exception at all, so neither the success path nor the catch path ever fires, and the placeholder stays `partial:true` in the saved snapshot forever.

| Decision | Rationale |
|----------|-----------|
| `healPartialMessages()` added to `persist.js`, wired into `healArrays()` for both `narrative` and `ooc` | `healArrays()` is the one choke point already shared by `restoreSession()`, `mergeCampaign()`, and `joinCampaign()` (`sync.js`) — fixing it there closes the gap for solo restore, cloud merge, *and* multiplayer join in one place, matching how the S55 fix itself was structured. |
| Only the trailing array entry is ever checked/healed | Exactly one stream runs at a time, so a `partial:true` message can only ever be the last one in the array; checking deeper would mask a real bug rather than fix one. |
| Targeted audit run immediately after, scoped to "external-data-ingestion points that should call `healArrays()` but might not" | This bug shape (healed at one restore boundary, not another) has now recurred 3 times in two sessions — worth one scoped pass rather than waiting for a 4th live bug report. Found and fixed one real instance: `Settings.jsx`'s "Load save" file import wrote `data.campaign` straight into the store, with zero healing — the one external-data boundary that had been missed by both S55 rounds. Fixed with the same one-line pattern as `joinCampaign()`. The other three ingestion points (`restoreSession()`, `mergeCampaign()`/live-sync listener, `joinCampaign()`) were already confirmed healed. |

## Known Issues triage (S56, same session as restore-time healing)

User asked to "eliminate known issues to clear space on context files" — agreed scope: fix what's quickly fixable in code, leave feature-sized gaps tracked, compress the docs either way.

| Decision | Rationale |
|----------|-----------|
| Concentration save DC capped with `Math.min(30, ...)` in both `applyDamage()` branches | 2024 SRD caps concentration DC at 30; `Math.max(10, Math.floor(rawDamage/2))` had no upper bound, so a single huge hit could demand an unbeatable save. Low-risk, 2-line fix in code that already computes the DC. |
| `joinCampaign()` now writes `players/{uid}/joined` synchronously, in addition to the existing 3s-debounced `scheduleSync()` write | A guest who reloaded within ~3s of joining had no cloud pointer yet, relying entirely on the local-snapshot fallback to recover guest role. Mirrors the synchronous-write pattern already used elsewhere; closes the race without touching the debounce used for steady-state syncs. |
| CharSheet's manual HP override (`adjustHP()` buttons and `ManualOverride()`'s hp field) now dispatches an `hp` mechanic through `validateMechanics`/`applyMechanics` instead of writing `setStore(...'hp'...)` directly | Per the documented "hp is AI-owned via mechanics, with a player override allowed" model — the override was allowed but was bypassing the *mechanics*, not just the AI. Routing it through the same `hp` mechanic the AI uses means a player's manual edit also gets `applyDamage()`'s temp-HP absorption, concentration-save trigger, and Death Saves/massive-damage enforcement, instead of being a raw number write that skips all of it. This does not reintroduce "trusting AI math" — `applyDamage()` is pure code, not AI-computed; the player still types the same number, it just now flows through the rules engine. Same pattern already used by `castSpell()`'s `slot_use` mechanic. |
| Action Economy, Classifier DC/coverage expansion, Critical Hits, Cover, and Charmed/Deafened/Grappled left untouched, still tracked in Priorities/Known Issues | All are feature-sized (new mechanics, new data models, or multi-file classifier work), not quick fixes — per the user-approved triage scope. |

## Invite-link "Campaign not found" investigation (post-S56)

Live bug report: host invited a second player into a fresh test campaign, guest got "Campaign not found." Investigated `joinCampaign()`/`dbRead()`/`scheduleSync()`/`startLiveSync()`/`flushPending()` end to end. Confirmed deployed Firebase Console RTDB rules match `database.rules.json` exactly (`auth != null` on both `campaigns` and `players`) — ruled out rules drift as the cause.

| Decision | Rationale |
|----------|-----------|
| `shareInvite()` (`Settings.jsx`) now shows an `alert()` instead of silently returning when `buildShareId()` is null | If the host's anonymous auth hadn't completed yet (`getUid()` still null), the old code did nothing at all when "Invite Players" was tapped — no link, no error, no clipboard write. A host who didn't notice could easily send a stale link from earlier testing instead, which would legitimately 404 for the guest. This was a real, previously silent failure mode and the most likely explanation for the reported incident. |
| `shareInvite()` now calls `forceSyncNow()` immediately before building the link | Previously the link relied on whatever the last 3s-debounced background sync happened to push. Forcing a sync at share-time guarantees the host's current state is actually at the Firebase path before a guest can read it. |
| Root cause not reproducible in this sandboxed environment (no live Firebase/two-device access) | Both fixes close real, verified gaps in the share flow; user should live-test the invite flow again to confirm full resolution. |
| Gate 8/XP player-facing prompt (S56 transcript finding) still not implemented | User has not yet confirmed authorizing this change; stays a documented, unconfirmed item. |

**Live retest result (S57)**: User ran a real two-device join test (host + guest exports compared directly). `campaign.id`, full character state, and all 24 narrative messages were byte-identical across both devices except the expected per-device `updatedAt` timestamp. The join completed and synced correctly — the `shareInvite()` fixes are confirmed working live. Investigation closed.

## Priority #2 audit (S57) — unguarded nested-field access sweep

Continuation of the S56 audit. Broad grep for unguarded `.field.(map|filter|find|some|every|forEach|reduce|length)(` across `src/ui/**/*.jsx`, triaged file by file against each field's default shape and ingestion path.

| Decision | Rationale |
|----------|-----------|
| `restoreQuickActions()` (`data/keys.js`) now heals the restored `localStorage` config against `DEFAULT_SYSTEM.settings.quickActions` instead of replacing the store value wholesale | Same bug class as the `campaign`-store healing work (S55/S56), but on the `system` store: `restoreQuickActions()` did `setStore('system','settings','quickActions', config)` with only a truthy check, no shape validation. A `quickActions` object missing `active`/`custom` (e.g. from an older app version or partial write) would clobber the store and crash `QuickActions.jsx`'s `qaConfig().custom.find(...)`. `campaign` data has always gone through `healArrays()` at every ingestion point; `system` data had no equivalent. Fixed by merging the restored config over the default shape, coercing `active`/`custom` back to arrays if not already arrays. |
| All other audit candidates (Rewind.jsx, Chat.jsx, TurnPrompt.jsx, SituationBar.jsx, Combat.jsx, QuickActions.jsx, Journal.jsx, Cargo.jsx, CharCreate.jsx, CampaignConfig.jsx, DevTools.jsx, LevelUp.jsx) traced and confirmed safe, no fix needed | Every candidate resolves to a `DEFAULT_CAMPAIGN`/`DEFAULT_CHARACTER` field healed by the existing `healArrays()`/`healStructure()` walk, with array items always populated with required string fields (`name`/`text`) by the `mechanics.js` DISPATCH functions that construct them. `LevelUp.jsx:1235`'s `ci.attacks.map` is already guarded one line above (`if (!ci?.attacks) return [];`) — a grep false positive, not a real gap. |

## Player name not shown in multiplayer chat (found via live S57 test transcript)

Live-reported in-game: a player typed "I [...] who isn't at all distinct in chat from [the other player]" during the two-device test. Every narrative message already carries a `playerName` field (`messages.js`), but `Chat.jsx`'s message renderer never displayed it — `grep playerName src/ui/play/Chat.jsx` returned nothing.

| Decision | Rationale |
|----------|-----------|
| `Chat.jsx` now renders a small name label above a player message's bubble, gated on `msg.type === 'player' && msg.playerName && store.campaign.characters.length > 1` | Gating on party size > 1 (not on `multiplay.role`) covers both real multiplayer *and* a single device running multiple PCs (`playerIdentity.mode: 'multi'`), and avoids relying on `multiplay.role`, which only ever flips to `'guest'` on the joining device — the host's own `role` stays `'solo'` forever even with guests connected, so it isn't a reliable signal for "multiple humans are playing." Solo single-PC campaigns never show the label, so there's no clutter for the common case. |

## Priority #3 small win (S57) — contested-check contract guidance

Investigated the larger "expand classifier coverage" item (see workboard Priority #1/#3). Confirmed `decisions.md`'s existing "classifier skips combat" decision is deliberate and still correct — did not touch it. Skill checks and saving throws already resolve through the existing `roll_request`/`RollBar.jsx` path. The one real, unaddressed gap (PC attack rolls / critical-hit doubling) needs a new structured attack-roll mechanic and an NPC-stats data model expansion — architecturally significant, not started without user confirmation per CLAUDE.md's standing-permissions rule.

| Decision | Rationale |
|----------|-----------|
| Added a "CONTESTED CHECKS" section to `contracts.js` instructing the AI to narrate the NPC's side of an opposed check itself, then use that rolled total as the `dc` in a normal `roll_request` for the PC's side | Achieves code-resolved contested checks (grapple, opposed Stealth, etc.) using the existing `roll_request` mechanism — zero new code, zero schema change, prompt-only. Still told-not-enforced (AI must comply), but no worse than the existing roll-procedure trust model and closes a real SRD gap cheaply. |

## PC Attack Rolls / Critical Hits — code-enforced (S57, same session as Priority #3 win)

Re-investigated the Priority #1 Critical Hits gap and found it smaller than previously scoped: `RollBar.jsx` already had working attack-roll infrastructure unused — `isAttackRoll()`, attack-bonus resolution (`pc.attacks[0].bonus`), and condition-aware advantage/disadvantage for attacks. The actual gap was a missing contract instruction telling the AI to route PC attacks through `roll_request` instead of self-narrating hit/miss/crit. User explicitly asked to discuss Law 2 relevance before approving scope; confirmed attack resolution is fully deterministic (d20+bonus vs AC, known damage dice) and belongs in the same code-enforced category as skill checks, not left told-not-enforced.

| Decision | Rationale |
|----------|-----------|
| New "ATTACK ROLLS" section in `contracts.js`: PC attacks against a target with a determinable AC must go through `roll_request: Attack|<AC>|<PCName>`, same mechanism as skill checks | No new mechanic key needed — `roll_request` already dispatches a generic `roll-request` event; `RollBar.jsx`'s existing `isAttackRoll()` picks up `skill: 'Attack'` automatically. |
| `RollBar.jsx` `submitAll()` now code-determines HIT / MISS / CRITICAL HIT / CRITICAL MISS for attack-type rolls (natural 20 always hits+crits, natural 1 always misses, regardless of total vs AC) | Closes the told-not-enforced gap per Law 2 — code decides the outcome, AI only narrates it. Mirrors the existing SUCCESS/FAILURE code-determination already done for skill checks in `resumeAfterRolls()` (engine.js). |
| On a hit, code also rolls (and doubles on crit) the PC's weapon damage via a new `parseDamageFormula()`/`rollDamage()` pair, reading `pc.attacks[0].damage` (e.g. `"1d8+3"`) | Goes further than the original plan's "AI-reported damage" lean — once Law 2 was reconsidered, computing damage from an already-known formula closes the same trust gap the resistance-multiplier code in `mechanics.js`'s `damage()` closes for damage type, rather than trusting the AI to double dice correctly. Falls back to AI-reported damage only when no stored formula exists (spells, improvised weapons) — the one case code genuinely can't resolve. |
| `engine.js`'s `resumeAfterRolls()` (pre-send roll path) and `contracts.js`'s PREDETERMINED ROLLS / CRITICAL HITS sections updated in parallel to describe the new HIT/MISS/CRITICAL HIT/CRITICAL MISS outcome language and the "use the provided damage number, don't re-roll" instruction | Two separate code paths build the roll-result text the AI reads (`RollBar.jsx`'s mid-conversation `lines` text and `engine.js`'s pre-send `outcomeBlock`/`rollSuffix`) — both needed the same attack-aware branch to stay consistent. |
| `RollBar.jsx` UI: roll display now shows "AC" instead of "DC" for attack rolls, and pass/fail coloring on the rolled total now respects the nat-20/nat-1 auto-hit/auto-miss override | Small follow-on fix so the player-facing roll UI doesn't visually contradict the code-determined outcome it now drives. |
| Known, pre-existing limitation not addressed this session: `pc.attacks[0]` is always used (no weapon/attack selection) | A PC with multiple distinct attacks (different weapon, spell attack, etc.) gets whatever bonus/damage is first in their `attacks` array. Pre-existing in infrastructure built for something else, not newly introduced; left as a follow-up. |
| Scope boundary unchanged: NPC/enemy attacks against PCs remain fully AI-rolled/AI-narrated | Per the existing "DM rolls for NPCs/enemies itself" rule — only PC-initiated attacks route through the new mechanism. |

## Multiplayer Presence + CI Database Deploy (S58)

Continuation of a multiplayer-improvement discussion (V1 had automatic AFK/presence detection via `onDisconnect()`; agreed it solves a problem players already handle socially, and that mobile backgrounding makes connection-based presence flaky). Scoped to a "Pass 1": CI database-rules deploy (workboard Priority #7) + a manual presence toggle + two test aids, before tackling bundles (publish/import/delete/replace/edit) as a separate pass.

| Decision | Rationale |
|----------|-----------|
| Presence is a manual per-player toggle ("I'm here"/"I've left"), not automatic `onDisconnect()`/heartbeat detection | Mirrors the V1 lesson directly: V1's automatic AFK handling solved a problem players already solve by talking to each other. An explicit signal also sidesteps real engineering risk — mobile browsers lag or never fire `onDisconnect()` when backgrounded, so a connection-based "who's here" signal would be unreliable on the one platform (Law 3) this app targets. |
| New `presence: {}` field on `DEFAULT_CAMPAIGN`, keyed by uid → `{name, active, ts}` | Needs to be part of the synced campaign payload (not `system.playerIdentity`, which is local-only) so every device sees every other player's status via the existing live-sync listener — no new Firebase path or rule needed. Heals for free through the existing recursive `healStructure()`/`healArrays()` walk since the default is an empty object. |
| `setPresence(active)` (`sync.js`) writes only the caller's own uid key into `campaign.presence`, then reuses `scheduleSync()` | Same "device holds the merged whole, writes the whole thing back" model already used for `characters`/`quests`/etc. (`mergeCampaign()` is `{...local, ...cloud}` per top-level field) — adding presence didn't require touching the merge logic, just adding it to `getSyncPayload()`. Concurrent toggles can theoretically race like any other field in this model; that's an existing, accepted tradeoff (Law 1: "reconciles on reconnect"), not a new risk. |
| Presence UI lives in Settings → Who Am I?, not ContextBanner | ContextBanner is reserved as "a single slim line" (existing UI Principle); Who Am I? is already where this device's player identity is configured, so the toggle and the roster of currently-active players sit next to the thing they describe. |
| CI: added a `Deploy database rules` step to `deploy.yml` (`npx firebase-tools deploy --only database`, authenticated via the same `FIREBASE_SERVICE_ACCOUNT_PEBBLE_V2` secret through `GOOGLE_APPLICATION_CREDENTIALS`) | Closes workboard Priority #7 — `database.rules.json` had been manually-applied-only since the project started, the exact kind of drift Law 2 exists to prevent in app code and which the deploy pipeline itself was guilty of. `action-hosting-deploy` only ever touched static hosting assets. |
| Test aid 1 (built): `tests/sync.test.js` — mocks `src/data/firebase.js` with an in-memory Map standing in for RTDB, then exercises the *real* `joinCampaign()`/`forceSyncNow()`/`setPresence()`/`mergeCampaign()` functions across two simulated "devices" (switching which uid `getUid()` returns and resetting the store between blocks) | First Firebase-mocking precedent in the test suite — previously `healArrays()` was tested only as a pure function against hand-built plain objects, never through the actual sync entry points. Catches sync-logic bugs (e.g. a future presence/merge regression) without needing live Firebase access, which this sandboxed environment doesn't have. |
| Test aid 2 (scoped down from the original "simulate a second device in DevTools" idea): a DevTools "Multiplayer" tab that writes a fake guest's presence entry directly into the store | A true second-device simulator would need a second fake auth identity coexisting with the real one — this app has exactly one `getUid()`/one Solid store per tab, so faking that cleanly is a bigger lift than the payoff justified for Pass 1. What's actually useful right now (visually checking the new presence roster renders correctly with 2+ players, without a second phone) doesn't need a full second identity — just a fake entry in `campaign.presence`. Flagging this scope-down explicitly since the original ask was a fuller simulator. |

## Multiplayer Sync Bug Audit (S60)

Follow-up agent audit of the S58 presence/sync work, prompted by the flicker risk already called out in `persist.js`'s comments. Found and fixed three real bugs, all in the sync/presence path, no new architecture introduced.

| Decision | Rationale |
|----------|-----------|
| `dbListen()`'s echo suppression switched from a flat 3s time window to content-based matching (`lastWritten`/`isEcho` in `firebase.js`) | The time-window version dropped *any* incoming snapshot on a path for 3s after this device wrote there — not just its own echo. Since the routine debounced campaign auto-sync and another device's write (e.g. a presence toggle) land on the same RTDB path, a same-device write within 3s of a remote change silently swallowed that change until some unrelated update fired `onValue()` again — surfacing as "other device's change doesn't show up without a manual refresh." |
| `startLiveSync()` now also called from `PlayerOnboard.jsx`'s `startAdventure()` | Previously only armed at boot (`main.jsx`) and on guest-join (`joinCampaign()`) — a host creating a brand-new campaign mid-session (Settings → New Campaign → onboarding → Start Adventure) got no realtime listener for the rest of that session, so a guest's join or any other remote change never appeared until the host manually reloaded. |
| `mergeCampaign()` now merges `presence` per-uid by `ts` instead of letting the cloud snapshot wholesale-replace it | `{...localC, ...cloudC}` meant any field present in the cloud snapshot fully overwrote the local value. Presence is the fastest-changing field — a device flipping its own entry locally could have a different device's in-flight full-snapshot write (built before it learned of that change) land moments later and clobber it back to stale, visibly flickering the toggle. Reuses the existing `mergePresence()` helper that was already exported but, before this fix, was wired up incorrectly relative to the wholesale spread. |
| No new Firebase paths or schema changes | All three fixes are logic-only, inside the existing single-campaign-blob sync model. Presence still lives at `campaign.presence`, not a dedicated RTDB path — that idea came up this session as a hypothetical and was explicitly not pursued. |

## Live join failure root-caused: silent write failures only retried at boot (S61)

User hit a real "Campaign not found" join failure in play and shared a full RTDB export. Cross-referencing it against `joinCampaign()`/`shareInvite()`/`dbWrite()` traced the actual mechanism, rather than guessing: `dbWrite()` (`firebase.js`) catches its own failures and queues to `localStorage`'s `fb_pending` without rethrowing, so `forceSyncNow()`'s `await dbWrite(...)` inside `shareInvite()` resolves successfully even when the write never reached RTDB. The host shares a link believing state is pushed; the guest's `dbRead()` hits the real (empty) path and throws before `joinCampaign()` ever reaches the line that records the guest's `joined` pointer — which is why the export showed the campaign's data existing but zero guest `joined` records pointing to it. The queued write was only ever retried by `flushPending()`, and that function's one caller (`initData()`) only runs once at app boot — not on a mid-session reconnect — so a write queued after a connectivity blip sits inert until the device happens to reload.

| Decision | Rationale |
|----------|-----------|
| `initFirebase()`'s existing `.info/connected` listener (`firebase.js`) now also calls `flushPending()` on every false→true transition, not just once via `initData()` at boot | Closes the actual gap per Law 1 ("reconciles on reconnect," not "reconciles on reboot"). Reuses the listener and queue that already existed — no new Firebase path, no schema change, no new mechanism. `flushPending()` is idempotent (re-attempts pending keys, removes on success, stops on first failure) so a redundant call at boot (both the listener's own first connect and `initData()`'s explicit check can fire close together) is harmless. |
| Did not change `dbWrite()` to throw on failure / did not change `shareInvite()`'s error handling | Out of scope for this pass — the offline-first design (cache + queue instead of surfacing every transient write failure to the UI) is intentional per Law 5/Law 1, not the bug. The bug was specifically the *lack of a retry trigger* between "queued" and "next app boot," now fixed. A louder failure signal in `shareInvite()` is a separate, smaller UX question, not pursued without being asked. |

## Play-screen presence indicator (S62)

Live two-device retest of S60/S61 confirmed the sync fixes work, but surfaced real friction: checking whether the other player is online meant leaving Play and digging through Settings → Who Am I?, exactly the navigation cost S58 traded for by keeping presence out of ContextBanner.

| Decision | Rationale |
|----------|-----------|
| Added a small presence icon to ContextBanner's `head-right` icon row (next to the existing multiplayer/TTS icons), badged with a count of other active players, tappable to jump to Settings | Reverses part of S58's "ContextBanner is reserved as a single slim line" decision — but only by adding an icon to the existing icon row (same row pattern as the multiplayer-mode/TTS toggles), not new text/lines. User confirmed this tradeoff explicitly when asked (vs. leaving it Settings-only, or improving the Settings list instead). Settings → Who Am I? remains the full roster/toggle UI; this is just a glanceable signal during Play. |
| Badge counts presence entries excluding the viewer's own uid | The question being answered is "is someone *else* here," not "did I remember to toggle myself in" — counting self would be noise. |
| No new Firebase paths or schema changes | Reads the existing `campaign.presence` field (S58); no new sync logic. |

## Character union merge + immediate sync on char changes (S62)

Guest character Nyx disappeared after user tabbed out on iOS. iOS kills JS before the 3s Firebase debounce fires; on reload, `mergeCampaign()`'s spread let stale cloud `characters` overwrite local.

| Decision | Rationale |
|----------|-----------|
| Union-merge characters by id in `mergeCampaign()` (cloud wins per-id, local-only ids survive) | Safety net: even if a character hasn't reached Firebase yet, it won't be silently dropped on reload by a live-sync callback carrying stale cloud data. Cloud winning per-id ensures HP/stats from another device stay authoritative. Characters without ids (legacy edge case) fall back to cloud-or-local array. |
| `forceSyncNow()` after all CharCreate commit/remove paths | Primary fix: get characters into Firebase before the user can tab out, bypassing the 3s debounce. Immediate sync here is correct — adding a character is a discrete intentional event, not a streaming field change like location or HP. |
| No change to the general 3s sync debounce | The debounce exists for high-frequency fields (every narrative message, every HP tick in combat) — tuning it down globally would burn Firebase quota. Character changes are rare enough that immediate sync is the right exception. |

## Action Economy enforcement (S67)

Workboard gap: `combatState.actionsUsed` flags existed but nothing checked them — Gate 2 was pure prose-regex counting over the *whole* AI response, with no persistence across the turn.

| Decision | Rationale |
|----------|-----------|
| Enforce economy at the point of origin — disable already-spent quick-action buttons in `TurnPrompt.jsx` — rather than trying to detect reuse by cross-referencing `actionsUsed` inside Gate 2 | Traced the actual turn lifecycle: `advanceCombatToNextPC()` resets `actionsUsed` after *every* AI response (turns always advance one-per-message in this engine), so by the time a response comes back, `actionsUsed.action` being `true` almost always just means "the tap that produced this very message" — cross-checking it post-hoc against the new response would false-positive on ordinary single use, not catch anything real. Prevention has to happen before the message is sent, not after. |
| `TurnPrompt.jsx` buttons for an econ slot (`action`/`bonus`) get the native `disabled` attribute once `combatState.actionsUsed[econ]` is true; `take()` now bails early too | Closes the actual hole: a player could previously tap an Attack (econ: action) *and* Dash (also econ: action) in the same turn with nothing stopping it — the "spent" pill was cosmetic only. Free-typed narrative isn't touched by this — the player can still hand-type extra actions; that path stays on Gate 2's prose heuristic, unchanged in kind. |
| `TurnPrompt.jsx`'s `take()` now calls the existing (previously dead/unused) `markActionUsed()` from `gates.js` instead of duplicating the same store write inline | One implementation of "mark this econ slot spent," not two. |
| Gate 2's `multi_action`/`multi_bonus`/`multi_reaction` prose scan now scopes regex matching to sentences mentioning the current actor's name (`actorSentences()` helper), instead of counting matches across the entire response | Real accuracy bug: NPC/enemy turns narrated in the same response (which legitimately happen before/after the current PC's turn) were inflating the count and risked misfiring the hard re-prompt in `engine.js`'s `combatViolation()`. Also added an Extra Attack allowance (threshold 2 instead of 1) alongside the existing Action Surge bypass. |
| Did not add a cross-message "already used" hard-reject to Gate 2 | Considered and rejected — see first row. Would need the engine to support genuinely multi-message turns (it doesn't) before that check could be sound. |

## Hit Dice healing fixed at the source (S68)

Workboard gap: "Short Rest missing Hit Dice healing surfacing." User caught that the paired workboard item ("Rest buttons on CharSheet Vitals tab") was already built — investigation (via an Explore agent) found the *actual* gap one level deeper: `hit_dice_use` in `mechanics.js` already existed and is in the AI's contract (`contracts.js`), but was silently broken — it decremented the hit dice pool then fired `roll_request: HitDice|...`, which `RollBar.jsx` has no handler for (it falls through the generic skill-check path and the result is discarded). The die spent; nothing ever healed. True for both the AI-narrated path and any future player-facing trigger.

| Decision | Rationale |
|----------|-----------|
| Fixed `hit_dice_use` to roll + heal entirely in code (`src/ai/mechanics.js`), removing the `roll_request` round-trip | Matches the existing code-enforced Attack Roll pattern (S57) — roll and apply immediately, no AI dependency for a mechanical outcome that's just arithmetic. Fixes the mechanic for the AI-narrated path too, not just the new UI. |
| Healing reuses `applyDamage(idx, -healed)` (already defined in the same file) instead of a new hpMax-clamp | One clamping implementation, shared with `hp`/`damage`. |
| CON modifier reused from `abilityMod()` in `src/data/forge.js` (imported into `mechanics.js`) | Already exists, already handles missing ability scores — no duplicate math. |
| No per-die minimum-1 floor on healing | SRD doesn't guarantee one; a very low CON PC rolling a 1 can legitimately net 0 HP from a hit die. |
| New "Spend" button in `CharSheet.jsx`'s `VitalsTab()` next to the Hit Dice pip row, spends exactly one die per tap (no quantity picker) | Matches how players actually decide mid-rest ("do I need another?"); avoids introducing a new stepper/quantity-input pattern the codebase doesn't otherwise have. Disabled when no dice remain or already at full HP. |
| No combat-state gating on the new button | Existing Short Rest/Long Rest buttons aren't gated on combat state either — stays consistent rather than adding an asymmetric restriction. |

## Cover — code-enforced for the PC-attacks-enemy path only (S69)

Workboard claimed "Cover missing entirely." Investigation (Explore agent, verified by direct reads) found this wrong in a specific way: a `cover` mechanic already existed, already stored `coverBonus` on a PC, and the character drawer already showed a "+X (cover)" badge — but nothing anywhere read that value. Digging further surfaced a real architecture fork, not just a missing wire: the *only* code-enforced attack-roll path in this engine is PC-attacks-enemy (S57); NPC-attacks-PC is deliberately still AI-narrated (unchanged since S57). The existing `cover` mechanic stored its bonus on the PC — the wrong side for the one path that's actually enforced, since in that path the PC is the attacker, not the target. Surfaced this fork to the user explicitly rather than guessing which direction to build; user chose enemy-side.

| Decision | Rationale |
|----------|-----------|
| Cover now applies to enemies tracked in `combatState.initiative` (populated by the existing, already-mandatory `zone_add_enemy` mechanic), in addition to the existing PC-side storage | This is the side that plugs into the one attack path that's code-enforced. The PC-side storage/badge is left exactly as it was — still inert for now, since enforcing it would mean reopening the NPC-attacks-PC scope, a bigger change deliberately deferred at S57, not decided here. |
| `roll_request: Attack|<AC>|<PCName>|<modifier>|<TargetName>` — added a 5th field (`TargetName`) to the Attack variant only, general `Skill|DC|PCname|modifier` format for non-attack rolls is untouched | There was no way to look up "which specific enemy" from the existing 4-field format. `TargetName` is required for the code lookup — no other viable hook existed (zones are narrative grouping, not spatial/tactical, per the explore agent's report; not a valid basis for cover). |
| Code adds the looked-up `coverBonus` on top of whatever AC the AI reports, rather than fully overriding AC from tracked state | Scoped narrowly to Cover specifically. Base AC accuracy is a separate, bigger question (the AI is still trusted for the base number) — not what was asked, and folding it in here would silently expand the change's blast radius. |
| Single computation point: `coverBonus`/effective `dc` computed once at roll-parse time in `RollBar.jsx`, both the hit/miss check and the on-screen "AC" display read the same value | No duplicate cover-lookup logic between resolution and display. |
| Added a `COVER +N` pill next to the existing ADV/DIS pills in the roll bar | Player should see why a good roll still missed — matches Law 3 (mobile clarity) and the existing pill pattern for other roll modifiers. |
| No RollBar.jsx-level tests added; `cover` mechanic's data-write behavior (PC and enemy targeting, case-insensitivity, `none` reset, no-match no-op) is tested in `mechanics.js`-level tests instead | This codebase has no component-testing infrastructure for SolidJS UI (`tests/foundations.test.js` only exercises pure state/mechanics functions) — introducing one for this alone would be new-pattern scope creep beyond what was asked. |

## Testing tab scroll fix + Testing Notes (S70)

User reported two problems with the testing tab (`MechTest.jsx`, opened via the flask/Test button in `InputBar.jsx`): couldn't scroll to the bottom, and wanted a way to leave a review that travels with a state export.

| Decision | Rationale |
|----------|-----------|
| Scroll bug root cause: `.mechtest`'s `max-height: 80vh` (`style.css`) was too tall for its actual slot — it renders inside `.input-bar`, itself inside `.chat-container` (`height: 100%; overflow: hidden`), so the excess got clipped by the ancestor, not scrolled | Confirmed by comparing to the sibling drawer in the exact same slot (`QuickActions`' controlled drawer, `.qa-controlled .qa-drawer`), which uses `max-height: 46vh` and has no such bug — not a guess, a working precedent in the same file. |
| Fix: changed `.mechtest`'s `max-height` from `80vh` to `46vh`, matching the sibling exactly | One-line change, no other layout touched. |
| "Send json/my own review" implemented as a freeform Testing Notes textarea bundled into the *existing* export (`exportSnapshot()`), not a new structured form or a new export pipeline | User confirmed this directly (asked rather than guessed, since there was no existing feedback mechanism to copy from). Reuses `copyExport()`/`downloadExport()` already wired to Copy/Download buttons — one button, not two new systems. |
| `exportSnapshot(notes = '')` only adds a `testerNotes` field when notes are non-empty | Keeps the other existing caller (`Settings.jsx`'s own export) and MechTest's own pre-existing calls unaffected when no notes are passed. |
| No new CSS, reused `.mechtest-input` (already used for the Inject-a-block textarea) | Same visual language, no duplicate styling. |

## XP test-button bug found via the new export review (S70 follow-up)

The Testing Notes/export feature's first real use: user ran "Run All" on a blank campaign and sent the exported JSON. Reviewed it against the source rather than eyeballing — Kael's `xp` was `0` despite the mass test claiming `xp: 75` applied successfully. Traced it: the `xp` mechanic (`mechanics.js`) only matches `Name+amount` or `party+amount` (per its regex and the AI's actual contract in `contracts.js:27`) — but both `MechTest.jsx`'s Mass Test and Quick Fire XP buttons sent a bare `xp: 75`/`xp: 100` with no target, which fails the match and silently returns. `applyMechanics()` still marked it `applied: true` (that flag only means the dispatch call didn't throw, not that it did anything), so the mass-test log reported a pass on a mechanic that had done nothing.

| Decision | Rationale |
|----------|-----------|
| Fixed both XP button templates in `MechTest.jsx` to send `xp: ${pc}+75` / `xp: ${pc}+100` | Matches the mechanic's actual (and AI's real) format — this bug only ever existed in the test harness's own hardcoded strings, not in the mechanic or the AI contract. |
| Added 3 tests for the `xp` mechanic: `Name+amount`, `party+amount`, and an explicit no-op assertion for a bare amount | The no-op test is a regression guard for this exact bug shape — asserts XP silently doesn't change when the target is missing, so a future test-button edit that regresses back to `xp: 75` gets caught by the suite. |
| Did not change `applyMechanics()`'s `applied: true` semantics (still just "didn't throw," not "did something") | That's a bigger, systemic question — many DISPATCH handlers have early-return guard clauses that would report the same false "applied" status. Fixing that generally is a separate, larger audit, not something to fold into a one-off bug catch. Flagged as a known gap, not fixed here. |

## Playtest audit: HP override bug + companion tracking (S71)

User sent a real solo playtest transcript and asked for a gap audit, flagging their own testing isn't very comprehensive without their co-player. Traced two confirmed issues by reading source against the transcript, not guessing from the export alone.

**HP override bug**: the AI emitted `damage: foot, 4, slashing` then `hp: foot=4` in the same batch, with foot at 1 HP going in. `damage:` correctly clamped to 0 (1-4, floored). The co-emitted `hp:` then ran as an independent absolute-target write, computing a "heal" of 4 to reach its stated number — silently reviving the character with zero narrative mention of healing. Verified via an Explore agent reading `damage()`/`hp()`/`applyDamage()` directly: no batch-level rule prevented this, despite `validateMechanics()` already having a precedent for exactly this shape of cross-mechanic rule (the existing `combat_start` + `hp`/`damage` rejection).

**Companion tracking gap**: an NPC (a "star-fox") was gifted items, asked to join the party three times, and rested alongside the PC across ~15 exchanges, but the AI never emitted `npc_add` — the player noticed and asked in OOC why it wasn't tracked. Turns out `Cargo.jsx` already renders a "Traveling with" row for any wagon-inventory item with `type: 'companion'` — the AI's contract never mentioned this exists at all, so it was structurally invisible to the AI.

| Decision | Rationale |
|----------|-----------|
| Added a batch-level rule in `validateMechanics()` (`mechanics.js`): reject a co-emitted `hp:` for any PC that a `damage:` mechanic in the same batch also targets | Mirrors the existing `combat_start` batch-rule pattern exactly. `damage:` already resolves PC HP correctly (with resistance/vulnerability lookups); a co-emitted `hp:` for the same PC is either redundant or an AI math error, and would otherwise silently override the correct result. |
| Added one line to `contracts.js`'s DAMAGE TYPE ENFORCEMENT section telling the AI not to co-emit both for the same PC, and explaining the app will reject the redundant one | So the AI understands the new rejection instead of being confused by a silently-dropped mechanic. |
| Documented the existing `companion` item type in `contracts.js` (MECHANIC KEY REFERENCE and MANDATORY EMISSIONS) — `item_add: wagon, <Name>, companion` for a recurring NPC that travels with the party | Reuses an already-built UI feature (`Cargo.jsx`'s "Traveling with" row) that the AI had zero visibility into. No new code needed for the display side. |
| Did NOT build automatic "AI forgot npc_add" drift detection | Spec'd in `enforcement-spec.md` (Gate 5) but never implemented in the actual `runGate3`; the narrower existing pattern in `drift.js` only matches explicit self-introduction phrasing and wouldn't have caught this transcript's purely descriptive, never-formally-named creature. User explicitly chose to defer this — building a real detector is a bigger, fuzzier heuristic problem with genuine false-positive risk, better designed in its own session. |
| Did not touch Gate 3's occasional item-drift false positives on narrative physical-contact descriptions (e.g. "vines grab your cloak") | Minor noise, not a correctness bug — consistent with the enforcement spec's own stated design principle that false positives are cheap and false negatives are expensive. |

## Scenario buttons in the testing tab (S72)

User's follow-up to the S71 audit: solo playtesting is fine for freeform play, but hard for *deliberately* exercising one specific mechanic — that usually comes from a second person prompting "now try X." Existing testing-tab tools (Quick Fire, Mass Test) only inject raw mechanics data; they don't drop the player into a live, playable moment.

| Decision | Rationale |
|----------|-----------|
| Added a "Scenarios" section to `MechTest.jsx` with 3 one-tap buttons (Covered Enemy → tests S69 Cover, Low HP + Rest → tests S68 Hit Dice, Mid-Combat Turn → tests S67 Action Economy), each landing the player in a real, playable situation (actual combat state, actual dice, actual UI) rather than just writing data | User confirmed this shape directly over a written-checklist alternative — a tap that gets you into the moment beats a doc telling you what to type. |
| Curated per session, not auto-generated from the workboard's live-verification list | User confirmed this over building a real tracking/generation system. Simpler: I add a scenario when something new ships that needs a live check, remove it once confirmed working, next session. A comment in `MechTest.jsx` above the scenario functions documents this convention so it doesn't get forgotten. |
| Only 3 scenarios shipped, not one for every unverified item (S56 onward) or for S70/S71's changes | Scoped to what's actually testable via a deterministic state setup. S70 (testing tab itself) doesn't need a scenario — it's what you're already using. S71's damage/hp co-emission fix and companion contract nudge both depend on the AI's own narrative behavior, not a state you can force into — no good deterministic "scenario" fits those; they can only be confirmed by playing normally and watching for the (absence of the) old behavior. |
| "Covered Enemy" requires one initiative roll before the PC can act (via the normal `combat_start` rollPending flow) rather than skipping straight to an active turn | Kept authentic to the real combat-kickoff flow rather than over-simulating — incidentally re-exercises initiative/TurnPrompt too. |
| "Mid-Combat Turn" bypasses the mechanics pipeline and writes `combatState` directly (`aiSet`), unlike the other two scenarios which use the normal `run()`/`fire()` mechanic path | There's no single mechanic that starts combat with a PC's turn already active and un-rolled — direct state construction is the only way to reach that exact test setup, matching the existing style of `newCampaign()`/`clearNarrative()` in the same file. |

## Four fixes from a live playtest export (S73)

User played the deployed app (using the S72 scenario buttons) and sent an export with real Testing Notes — the notes feature's first actual use, which immediately surfaced a bug in that same feature. Verified all four against source directly (including confirming the second Explore agent's file-location claim by reading `Chat.jsx` myself, since the user said "side tab" which pointed at `ActionsDrawer.jsx`'s spell buttons, not `CharDrawer.jsx` where the agent first looked).

| Finding | Root cause | Fix |
|---------|-----------|-----|
| "My testing notes dont persist" | `testerNotes` was a local `createSignal('')` in `MechTest.jsx`; the testing tab fully unmounts when its drawer closes, destroying local component state | Moved to `store.system.testerNotes` (new `DEFAULT_SYSTEM` field), persisted the same way `largeText`/`theme` already are — added to `snapshot()` and restored in `restoreSession()` in `persist.js`. Confirmed `system` fields don't sync to Firebase and survive `resetCampaign()` (which only touches `campaign`), so notes now survive closing the tab, reloading, and New Campaign. |
| "Spell compendium from side tab takes to journal, not spells" | The right-side "Spells & actions" drawer's spell ⓘ buttons dispatch `spell-tooltip`, handled in `Chat.jsx`'s `showSpellTooltip()` (two call sites) — both built a tooltip action with `mode: 'journal'`, routed through the generic `navigateTo()`, which only opens the Journal tab | Changed both call sites to `compendium: 'spells'`, added a branch in the tooltip button's click handler to call the already-existing, already-correct `navigateToCompendium('spells')` (used properly elsewhere in `CharSheet.jsx`) instead of the generic journal-only navigation. |
| "Its thorns turn but my side tab is for ivy" | The left "Character vitals" drawer (`CharDrawer.jsx`) picked its displayed PC once on open (from `selectedPCs`/index 0) and never re-synced to whoever's combat turn it was | Added a `currentActorIdx()` helper mirroring `TurnPrompt.jsx`'s existing actor-derivation (`combat().initiative[combat().currentTurn]`), used it both in `defaultIdx()` (fixes opening the drawer mid-combat on the wrong PC) and in a new `createEffect` that re-syncs `pcIdx` whenever the turn actually changes (fixes the drawer staying open across a turn change). Manual tab-switching still works in between — the effect only fires on a real turn change. |
| "Sometimes i want to send a message with my roll" | Confirmed two distinct roll-submission paths in `RollBar.jsx`. The classifier pre-send path already carries the player's original typed message forward (`engine.js`'s `resumeAfterRolls()`); the AI-initiated `roll_request` path (mid-combat rolls the AI asks for) sends a bare mechanical result line with zero room for player text | Added an optional textarea, shown only for the non-preSend path (`!isPreSendRoll()`, already existed) right before the "Send All" button. If filled in, `submitAll()` prepends the trimmed note to the message before sending, then clears it. Didn't touch the pre-send path — it doesn't need this, it already has the player's own words. |

No new tests: all four are UI/persistence-plumbing changes with no new testable pure logic — `persist.js`'s `snapshot()`/`restoreSession()` aren't exported and this suite has no IndexedDB-mocking precedent to test them meaningfully (consistent with why the S70 export/notes feature itself wasn't unit-tested either).

## Combat turn desync + pre-resolved roll outcome (S74) — core loop fix

Another export from the same playtest, sent minutes after S73 shipped, surfaced a genuinely serious bug — not a cosmetic UI issue like the recent run of fixes, but a desync in the combat turn loop itself. Player: "Because thorn rolled for his vicious mockery after the DM narration my turn got skipped. Current card is showing it's thorns turn." Given the stakes (Law 1: "the core loop is sacred"), this got the most rigor of any fix this sprint: an Explore agent to verify the root cause against source, then — because the user (who doesn't code and said so directly) needed to trust this one on the strength of the process, not the code — a Plan agent specifically tasked with finding holes in the first draft before writing anything. It found two real ones.

**Bug A** — `sendNarrative()` (`engine.js`) called `advanceCombatToNextPC()` unconditionally at the end of every response when combat was active, guarded only by `isAwaitingInitiative()` (initiative rolls only — not mid-combat `roll_request`s). So the turn advanced the moment the AI asked for a roll, before the player had even rolled — then advanced *again* when the roll's result came back through the same function. Any turn involving a roll doubled up on advancement.

**Bug B** — in the same transcript, one AI response emitted both `roll_request: Attack|13|Thorn|normal|Kobold` and `hp: Kobold=4` in the same batch — resolving a hit before the roll came back. The roll then missed, and the kobold's HP was never corrected. `runGate1` (the gate meant to catch exactly this) only scans narrative prose for "X rolls a NN"-style patterns — it never inspected the mechanics block itself for this shape of violation.

| Decision | Rationale |
|----------|-----------|
| Fix A: compute `hasPendingRoll` (does the *current actor* have an applied, unresolved `roll_request` in this response) and only suppress the non-kickoff turn advance when true | First draft checked "any roll_request present," not scoped to the current actor — Plan-agent review caught that a forced roll for a *different* PC (e.g. a reaction save) would incorrectly hold the turn open even though the current actor's turn was genuinely over. |
| Compute `hasPendingRoll` *after* the concentration-save `roll_request` gets injected into `applied` (engine.js ~line 250-253), not before | Plan-agent review caught this ordering bug directly: computing it earlier, as originally drafted, would silently miss concentration-save rolls, since that injection happens after `applyMechanics()` returns. |
| Kickoff's `inclusive: true` placement is never held back by `hasPendingRoll` — only the normal advance is gated (`!(hasPendingRoll && !combatKickoff)`) | Plan-agent review flagged that kickoff establishes *whose* turn it is for the first time, it doesn't confirm a resolution — gating it the same way as the normal advance risked leaving the turn pointer stuck at whatever `combat_start` initialized it to, never landing on the first living PC. |
| Fix B: reject `hp:`/`damage:` for the exact TargetName of an Attack-type `roll_request` in the same batch | Mirrors the existing same-PC `damage:`+`hp:` batch rule (S73) exactly — same shape of "second mechanic silently overrides/pre-empts the first" bug, just triggered by a different pairing. Only Attack rolls carry a TargetName field, so plain skill-check `roll_request`s are unaffected — no extra type check needed. |
| Accepted false-positive risk in Fix B: a genuinely unrelated hp change to a same-named target coinciding with an unrelated roll_request in one message would also get rejected | Same trade-off already accepted for the same-PC rule — over-rejecting a rare coincidence beats silently letting a fabricated combat outcome through. |
| No test for Fix A (`engine.js`) | `sendNarrative()` requires a live/mocked AI provider call this suite has no precedent for testing — same limitation as every other `engine.js` change this sprint (e.g. S67's Action Economy). Fix B (`mechanics.js`, pure function) got 4 tests, same pattern as S73's same-PC rule tests. |

## CharSheet swipe shows stale PC data (S75)

Same-session follow-up export, testerNotes: "Thorns hp on his character sheet, under vitals show 31/31 if i swipe from ivy." Ivy's actual hp/hpMax is 31/31; Thorn's is 23/27 — swiping from Ivy's sheet to Thorn's (the touch-swipe gesture in `CharSheet.jsx` that switches which PC is displayed) left the Vitals tab frozen on Ivy's numbers.

Root cause: all six tab-render functions (`StatsTab`, `VitalsTab`, `SpellsTab`, `FeaturesTab`, `EquipmentTab`, `BioTab`) capture `const p = pc();` once at the top, then read `p.hp`/`p.ac`/etc. throughout their JSX. They're each wrapped in an *unkeyed* `<Show when={activeTab() === 'X'}>`, which only re-invokes its children on a false→true transition — not when `activePC()` changes while the boolean stays true. So the currently-active tab keeps a stale snapshot of whichever PC was active when it first mounted, until the player also switches tabs. Affects all six tabs identically; the user just happened to be on Vitals.

Fix: wrapped the tab-content block in an outer *keyed* `<Show when={pc()} keyed>` (`CharSheet.jsx` ~line 1223). Keyed mode compares by reference identity instead of truthiness, so any time `pc()` resolves to a different character-proxy (i.e., the swipe changed `activePC()`), the whole block tears down and remounts — re-invoking whichever tab is active with a fresh `pc()` read. Keyed on `pc()` (the object) rather than `activePC()` (the index) specifically because index 0 is falsy and would break Show's `when` check for the first PC. Ordinary in-place mutations (HP changes via `setStore('campaign','characters',idx,...)`) don't change the proxy's identity, so this doesn't cause spurious remounts during normal play — only on an actual PC swipe. Required touching only that one block, not any of the six Tab functions.

Design pressure-tested by a Plan agent before implementing (confirmed the `keyed` Show semantics, confirmed no other component state — `expandedSpells`/`showOverride`/etc., all declared in the outer `CharSheet(props)` scope — gets incorrectly wiped by the remount). One accepted, intentional side effect: an in-progress unsaved edit on a Bio field (trait/ideal/bond/flaw/backstory) is discarded if you swipe to a different PC before saving — correct behavior, not a regression. No new tests (Solid JSX/reactivity fix, no new testable pure logic; this suite has no component/DOM testing infrastructure, consistent with prior UI-only fixes this sprint). 88/88 tests passing, build clean. **Not live-verified** — needs a real phone check: open a PC's sheet, swipe to a different PC on each of the six tabs in turn, confirm the data updates without also needing to switch tabs.

## Open Questions (not yet answered)

- **Child-friendly view target age** — 7-16 is wide. What's the actual simplification scope?
- **Episode/module tracking system** — How does the AI know where the party is in the story? Needs spec.
- **Quick Actions redesign** — What actions? How presented?
