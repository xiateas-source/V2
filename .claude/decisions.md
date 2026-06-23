# V2 Decisions Log

*Design choices made during planning. Reference when a question comes up that was already answered.*

---

## Architecture

| Decision | Rationale | Session |
|----------|-----------|---------|
| SolidJS with signals for reactive state | Decided in v1 Session 29. Fine-grained reactivity without virtual DOM overhead. | 29 |
| Vite build system | Carried from v1. Fast dev server, clean builds. | v1 |
| Five-piece architecture: UI, Engine, State, Data, Content | Clear boundaries. Each piece has one job. AI can build autonomously when boundaries are clear. | 30 |
| Module map organized by mode (play/reference/setup/manage) | Law 4 enforcement — directory boundaries prevent mode bleed. | 30 |
| Dispatch table pattern for mechanics | Built in v1 Session 29. Each mechanic key registers a handler. Extensible without touching core. | 29 |
| v1 stays live while v2 is built | No migration pressure. Other player keeps using v1. V2 launches when it can run a full session. | 30 |
| Separate Firebase project for v2 | New API keys, new database. Clean break, no data collision with v1. | 30 |

## Modes & Navigation

| Decision | Rationale | Session |
|----------|-----------|---------|
| Four modes: setup, play, reference, manage | Every feature belongs to exactly one mode. Setup is onramp (locked after launch). Play is the session. Reference is mid-session orientation. Manage is between sessions. | 30 |
| Bottom nav: Cargo / Journal / Settings | Combat and level-up are event-driven overlays, not tabs. Dice roller is inline icon. | 30 |
| Combat overlay, not combat tab | Appears when combat starts, disappears when it ends. Not a permanent nav destination. | 30 |
| Level-up wizard is event-driven | Triggers on XP threshold, not from a button. Overlay that appears when conditions are met. | 30 |
| Setup locks after campaign launch | One-way transition. Setup → Play. No going back without intentional manage mode access. | 30 |
| Reference is overlay, not navigation | Tap character tile → sheet slides up. Tap away → back to chat. No mode switch, no friction. | 30 |
| Manage is intentional, one step removed | Between-session work. Contract tuning, session review, data fixes. Shouldn't be accessible by accident mid-session. | 30 |

## UI Principles

| Decision | Rationale | Session |
|----------|-----------|---------|
| Mobile only — no desktop fallback | "I have no PC." Law 3. Portrait mode, one-handed, mid-session. | 30 |
| New color palette for v2 | Soft Autumn palette not carrying forward. New palette TBD — design session needed with UI visible. | 30 |
| Tap-to-source — no dead text | Any displayed information is tappable and navigates to its source. Location banner → journal. Quest chip → quest detail. Mechanic pill → reference. | 30 |
| Situation bar replaces quest bar | Main quest pinned left (DM's railroad). Active consequences/countdowns pinned after (visually distinct, sorted by urgency). Player quests scrollable after. | 30 |
| Situation bar overflow = +N chip → Journal | When pending consequences/countdowns stack up, surface the most-urgent (urgency-sorted: imminent=danger, upcoming=warning) and collapse the rest into a `+N` overflow chip that taps through to the Journal's "Active Consequences (N)" list (the stack's one home). Chosen over pure horizontal scroll. "For now" per developer. | 39 |
| Context banner is a single slim line | Location · time · weather (icon) · listen toggle, one row. Two-line time/weather wrapping wasted vertical space the chat needs. Still tap-to-source (location → Journal). | 39 |
| Context banner is interactive | Location, weather, time — all tappable. Location taps through to journal locations section. | 30 |
| Nav dot badges + in-chat alerts for notifications | Player needs to know when state changes elsewhere. Both patterns worked in v1. | 30 |
| Mechanic pills kept | Tappable pills in AI responses — worked well in v1 for connecting features to play loop. Tap navigates to source (tap-to-source). | 30 |
| Term glossary kept | D&D terms auto-linked in chat. Especially useful for younger players. Reference data surfacing in play. | 30 |
| Previously On / Catch Up kept | AI-powered session recap and tracker audit. Very useful when returning from AFK. Surfaces in play mode. | 30 |
| No suggestion chips | Cut from v2. Didn't earn their place. | 30 |
| No `//` command system | v1 slash commands patched broken mechanics. If v2 mechanics pipeline works, players don't need them. Dev commands live in DevTools. | 30 |

## Data & Storage

| Decision | Rationale | Session |
|----------|-----------|---------|
| Three data tiers: Firebase, IndexedDB, Shared Bundles | Firebase = game state (synced during play). IndexedDB = reference content (local, never synced). Bundles = content packs (imported per player, reusable). | 30 |
| Shared bundles are "on import," not "one-time" | New players joining mid-game import the same bundle. Bundle is reusable, not consumed. | 30 |
| Compendium items → IndexedDB, AI-generated items → Firebase | Sourcebook items are reference (local). Items created during play are game state (synced). | 30 |
| Campaign map images → IndexedDB | Too large for Firebase. Location pins and discovered state sync via Firebase. | 30 |
| Campaign vs System data split | Campaign data resets on swap (PCs, world, NPCs, quests, chat, combat). System data survives (spell DB, class data, feats, settings, preferences, rules contracts). | 30 |

## State & Ownership

| Decision | Rationale | Session |
|----------|-----------|---------|
| Field ownership: AI / Player / System | No field writable by more than one owner. AI writes via mechanics pipeline. Player writes via editors. System writes via wizards. | 30 |
| Checkpoint/rewind in play mode, not manage | Safety nets must be accessible mid-session. Law 2: "when enforcement fails, the player can rewind." | 30 |
| Relationships array dropped | Redundant with NPC tracker dispositions. One home for data. | 30 |

## Engine & AI

| Decision | Rationale | Session |
|----------|-----------|---------|
| Drift detectors in mechanics pipeline | Catch when AI narrates state changes without emitting mechanics. Law 2 enforcement. Carried from v1 (detectUnloggedGold, etc.). | 30 |
| Active consequences injected into buildPrompt | AI can't forget to enforce time-sensitive events. Engine flags expiring timers for resolution. | 30 |
| Consequence timer enforcement added to AI failure record | Both AI forgetting and UI burying were problems. Fix is structural on both sides. | 30 |
| Clock-independent chat merge carried forward | v1's proven approach to Firebase sync. Prevents vanishing messages from concurrent device writes. | v1 |
| Memory is a feature (Law 5) | Session summaries, pruned chat, context injection keep prompt lean as world expands. Architecture must manage prompt budget. | 30 |
| Never depend on a single AI provider | Retry + fallback across providers. Free-tier first. | 30 |
| All rolls must be player-confirmed | Engine rejects any mechanic depending on a roll the player didn't submit via roll UI. AI cannot resolve rolls in prose. From v1 gameplay review: AI auto-rolled for 2-3 characters per response. | 30 |
| Scene transitions require player confirmation | AI cannot switch location, advance time, or change scenes without player saying they're done. Engine detects scene changes in AI response and gates them. From v1: AI would loot a room then narrate the exit in one message. | 30 |
| AI cannot act for unmentioned PCs | If player specifies actions for some PCs but not others, AI must ask — not decide. From v1: player says "Valenns + Slasher do X," AI narrates Aria doing something the player never said. | 30 |

## Combat

| Decision | Rationale | Session |
|----------|-----------|---------|
| Phase 1: zone grid. Phase 2: visual tile map | Zone combat (Frontline/Backline/Flanks) is v2 starting point. Visual tile map (mobile VTT inspired) is evolution. Architecture supports both — Combat.jsx grows, nothing else changes. | 30 |
| Combat turn enforcement added to AI failure record | AI combined turns, skipped players, advanced story while players deliberated. Needs enforced turn order. | 30 |
| **Engine owns the turn pointer; AI only narrates** | Root cause of v2 "overlap": turn ownership was split between the engine (auto-bumping the pointer) and the AI (walking turns in prose) with no contract between them — they drifted instantly. Fix (Law 2): code is the single source of truth for whose turn it is. `advanceCombatToNextPC()` deterministically lands the pointer on the next living PC; the AI resolves everything up to that PC and stops. | 37 |
| **PC initiative written deterministically, no AI round-trip** | `combat_start` seeded PCs at `roll:0` and asked them to roll, but nothing wrote the result back — PCs stayed tied at 0 forever (broken order). Now RollBar writes the submitted Initiative roll straight into `combatState.initiative[].roll` (player's own roll into their own slot), re-sorts, then fires a `combatKickoff` send. | 37 |
| **Enemy turns auto-stream; engine stops on each PC** | Matches the table: the DM rolls enemy dice and narrates a run of enemies without pausing, but the spotlight always stops on a player. Enemies between PCs are resolved inside the preceding PC's response (or the kickoff for enemies-on-top). No per-enemy pause, no auto-send needed in the normal case. | 37 |
| **Combat engine is mode-agnostic (single vs multi)** | One enforcement path, not two (Law 2: shrink the contract). The single/multi flag controls push notifications + turn-prompt labeling only — never the turn logic. One-PC-at-a-time even in solo play prevents the v1 "AI resolves 3 PCs in one blob" bug. | 37 |
| **Turn prompt is derived from synced state, shown on all devices** | `combatState.currentTurn` already syncs via Firebase, so TurnPrompt is derived (no new synced field) and appears on every device at once. Non-blocking; any player can tap it. The app enforces turn ORDER, not which person acts. | 37 |
| **`combatState.initiative` stored pre-sorted** | `currentTurn` was used as an index into the *sorted* list by the UI/prompt but advanced against the *unsorted* array — they disagreed whenever order differed. Now initiative is always stored sorted (highest first) and every consumer indexes it the same way. | 37 |
| **Round marker beat + turn-prompt quick actions** | When the pointer wraps, a centered `⚔ Round N` system message drops into the narrative (anchor for condition/consequence timing). The turn prompt surfaces the active PC's attacks/spells as one-tap buttons that prefill the input (eyes-free, one-handed, kid-friendly; Law 3 + tap-to-source). | 37 |
| **roll_request is code-enforced PC-only** | DM-rolls-enemies was prompt-only; the AI could target an enemy with a roll_request and the roll bar handed it to the player (bare d20, no mod). Now validation rejects any roll_request whose target isn't a PC (party/all/familiars excepted later). Law 2. | 37 |
| **Combat tracker: live ally HP, minimize toggle** | Allies (PCs) render HP live from the character store (snapshot in the initiative entry drifted on heal/override/level-up); enemies render from the initiative entry, updated by the `hp` mechanic. Overlay has a minimize button (collapses to round/turn bar). Contract now requires an `hp` mechanic whenever ANY combatant takes damage/heals so enemy HP actually tracks. | 37 |
| **Initiative rolls sourced from combatState, not events** | `combat_start`'s side-effect roll_requests were heard by nobody (no listener; `applyMechanics` only returns top-level mechanics), so initiative never surfaced and combat hung on turn 1. RollBar now derives Initiative prompts from PCs flagged `rollPending`. | 37 |

## Onboarding & Character Creation

| Decision | Rationale | Session |
|----------|-----------|---------|
| **Backstory/personality/appearance captured at creation + editable on sheet** | Onboarding regression: a prior (uncommitted, since-lost) build had these in the creation flow; deployed `main` had none. Added editable fields to the character preview (all 3 paths) saved on commit, plus an editable Bio tab on the character sheet (playerSet → synced) for after-creation edits/recovery. | 37 |
| **NOT yet rebuilt: full D&D-Beyond-style onboarding** | Only the backstory piece was restored from memory. Manual stat-rolling and the other "multiple options" we'd cross-referenced (D&D Beyond import mapping, guided multi-step wizard) still need rebuilding — original spec was lost with the uncommitted build. | 37 |

## Deployment

| Decision | Rationale | Session |
|----------|-----------|---------|
| **Auto-deploy to Firebase Hosting on push to main** | `.github/workflows/deploy.yml` (FirebaseExtended/action-hosting-deploy). Repo secret `FIREBASE_SERVICE_ACCOUNT_PEBBLE_V2` is SET (S37) — auto-deploy live, ~2 min after a push to main. Removes the manual deploy step. | 37 |
| **Live site `pebble-v2.web.app` deploys from main `dist/`** | `firebase.json` site=pebble-v2, public=dist. Manual deploys are no longer needed (CI handles it). The chat-exposed service-account key was rotated/revoked (S37); the old uploaded key is dead — don't reuse it. | 37 |
| **A deploy must check what's currently live first** | Deployed `main` over a more-complete (uncommitted) build, regressing the backstory editor. Lesson (CLAUDE.md): look at the target before overwriting. | 37 |

## Multi-Player

| Decision | Rationale | Session |
|----------|-----------|---------|
| Device-local "which PC am I" setting | No formal identity system. Family shares informally — one player can act for another. Works well in practice. | 30 |
| Expandable to 6-7 players | Universal design. Currently 2, but architecture supports more. | 30 |

## Child-Friendly View

| Decision | Rationale | Session |
|----------|-----------|---------|
| Separate URL entry point (AppSimple.jsx) | Same state, same engine, same Firebase + API keys. Different UI root with bigger targets, less text, guided choices. Not a toggle — a different app shell. | 30 |

## Content Pipeline

| Decision | Rationale | Session |
|----------|-----------|---------|
| Four input paths: files, web, homebrew, AI-generated JSON | PDF/epub/mobi, web reference import, in-app authoring, structured JSON from any LLM. | 30 |
| All content normalized to common schema per type | Engine, level-up wizard, spell picker, module tracker all read from IndexedDB, not hardcoded constants. | 30 |
| D&D 5e primary, not the only system | Architecture supports any game content. System-agnostic content pipeline. | 30 |
| Episode/module tracking is a workboard item | How the AI tracks campaign progress, chapter triggers, discovery conditions — needs its own spec. Architecture acknowledges it exists. | 30 |

## Features Carried Forward (v1 → v2)

| Feature | Status | Session |
|---------|--------|---------|
| Mechanic pills (tappable, navigate to source) | Keep — core play loop connector | 30 |
| Term glossary (84+ terms, auto-linked in chat) | Keep — especially for kids | 30 |
| Previously On / Catch Up | Keep — very useful for AFK return | 30 |
| Quick Actions FAB | Keep — needs redesign | 30 |
| Checkpoint / rewind stack | Keep — Law 2 recovery | 30 |
| Dice roller (inline icon) | Keep — small, accessible, not a tab | 30 |
| Roll request banners | Keep — system prompts player to roll | 30 |
| Familiar / mount system | Keep — lives in character sheet, gets combat token | 30 |
| Session archive | Keep — memory management | 30 |
| Error flag system | Keep — lives in DevTools | 30 |
| OOC / Rules chat tabs | Keep — tabs within main chat canvas | 30 |

## Features Cut (v1 → v2)

| Feature | Reason | Session |
|---------|--------|---------|
| Suggestion chips | Didn't earn their place | 30 |
| `//` command system | Patched broken mechanics — v2 pipeline should handle it | 30 |
| Relationships array | Redundant with NPC dispositions | 30 |
| Encounter presets (as built) | ~~Never used~~ Player-requests say they were built and used. Moved to icebox — could return via content pipeline JSON import. | 30→31 |
| AI DM button / tab | Never used in v1 | 30 |
| Clear character button | Never used, but might need rethinking | 30 |
| Scenes / snippets | Being phased out — replaced by content import pipeline | 30 |

## Audio

| Decision | Rationale | Session |
|----------|-----------|---------|
| TTS is not automatic | Player-triggered toggle. Browser TTS + ElevenLabs free tier. Sometimes the baby is asleep. | 30 |

## Documentation Structure

| Decision | Rationale | Session |
|----------|-----------|---------|
| Six doc files with clear purposes | CLAUDE.md (auto-loaded, laws + architecture). session-log.md (handoff). workboard.md (active work). prime-directive-v2.md (vision). decisions-v2.md (this file). ai-failures.md (Law 2 audit trail). | 30 |
| Five Laws live in CLAUDE.md | Auto-loaded every session. Dev AI can't drift from rules it reads every time. | 30 |
| AI failures in own file, not directive | Keeps the laws clean. Law 2 in CLAUDE.md gets inline examples + pointer to ai-failures.md. | 30 |

## Missed in Initial Planning (added after audit)

| Decision | Rationale | Session |
|----------|-----------|---------|
| Town reputation system carried forward | Useful concept, didn't execute properly in v1. Needs proper implementation. Lives in Journal. AI-owned via mechanics. | 30 |
| Secrets system — one home | v1 had campaign secrets AND dm secrets in multiple places. V2: one secrets model in Journal, with playerKnown/aiOnly flags. Law 4: data has one home. | 30 |
| 20 color themes: 10 dark + 10 light | Replaces v1's three modes. Dark/Light toggle + cycle button in Settings rotates through 10 palettes per mode. Stored as `dark-0`..`dark-9`, `light-0`..`light-9`. Default: `dark-0` (Obsidian). All defined in `palette-sampler.html` and converted to CSS `[data-theme]` blocks. | 31 |
| Prose dice rolling added to AI failures | AI rolls dice in narration instead of using mechanics system. Detection needed. | 30 |
| Scenes/snippets cut | Being phased out — replaced by content import pipeline. | 30 |
| Plugin system — icebox | Created accidentally in v1 (superpowers). Could support game-system plugins (Pathfinder, homebrew rules) someday. Not v2 priority. | 30 |

## System Operations (from OOC/Rules review)

| Decision | Rationale | Session |
|----------|-----------|---------|
| System operations need dedicated UI, not AI chat | "Reset HP" sent through chat → AI narrates it but may not emit mechanics. HP reset, stat corrections, rest operations are system actions — need one-tap access from character sheet or manage mode. | 30 |
| Level-up wizard needs re-entry / edit mode | Player couldn't fix expertise after missing the Bard 3 choice. Once system-owned fields are set, there's no way back. Wizard needs "redo level N choices" or manage-mode manual override. | 30 |
| OOC/Rules channels serve different purposes (partially resolved) | OOC export shows players use Rules chat for two things: actual rules questions AND app bug reports. AI can't help with app issues. Needs: either smart routing (detect "I can't edit X" → system help) or a non-AI path for sheet corrections. | 30 |
| Two tabs: Narrative + OOC. Rules tab eliminated | V1 Rules and OOC described the same function. V2: Narrative (full AI, emits mechanics) + OOC (player text + Ask DM button). Ask DM gets full situation context from both Narrative and OOC history, but is advisory-only (no mechanics, no state changes). Rules interpretation and theorycrafting go through Ask DM. Rules lookups go through reference mode (free). | 31 |
| Ask DM gets situation from both Narrative AND OOC | Ask DM needs narrative context for theorycrafting ("what if I cast Silence here?") and OOC history for follow-ups. Full situation awareness, advisory-only behavior. | 31 |
| No visible echo, silent OOC context injection | V1 echoed OOC into Narrative as breadcrumbs. V2: no visible echo (badge + push handle player awareness). Instead, recent Ask DM exchanges silently injected into buildPrompt() so Narrative AI isn't blind to OOC rulings. Clean Narrative for the player, full picture for the AI. | 31 |
| Overlays vs persisted system messages | Roll requests, scene holds, combat turn prompts are ephemeral overlays (component state, not persisted). Gate flags, XP audits, level-up notifications are persisted system messages in chat history. Overlays disappear on resolve or reload; gates re-trigger if still relevant. | 31 |
| Ask DM interception layer for app issues | Before Ask DM hits the AI, pattern-match for app issues ("can't modify," "how do I change"). Route to system tools instead. Saves API calls, gives better answers. From v1 OOC export: player typed "can't modify expertise" → AI lectured about PHB p.54 instead of opening the wizard. | 31 |
| Ask DM data injection from IndexedDB | Ask DM pulls relevant compendium entries (spells, feats, class features) into prompt based on question topic. Grounds AI answers in actual app data, not training data. Critical for homebrew content. | 31 |
| Citation linking in AI responses | Auto-link spell names, feat names, conditions, PHB references to compendium entries. Same tech as term glossary. Tap-to-source for AI knowledge. | 31 |
| Travel calculator in Journal | Tap a known destination → distance, travel time at party speed, encounter risk. Math is free (Law 5). AI handles judgment calls via Ask DM. | 31 |
| Stop generation button | Cancel AI streaming mid-response. Keep text received, discard partial mechanics. Works in Narrative and Ask DM. | 31 |
| Fresh start — no v1 data migration | V1 stays live for reference. V2 launches with a new campaign. No migration code needed. | 31 |
| Narrative DM = epic narrator + rules lawyer | Players loved vivid storytelling AND appreciated by-the-book structure. V2 Narrative DM does both: sensory prose with precise mechanical grounding. Names actual spells/features in prose, doesn't hand-wave. Enforcement gates let the AI lean into narrative because code catches slips. | 31 |
| Narration style field in Session Zero | Player-configurable text field: "Brandon Sanderson," "dark and gritty," freeform. Injected into Narrative contract. Lives in campaign data. Editable mid-campaign in Settings. One prompt line that changes the game's feel. | 31 |
| Race/species reference data in CharSheet Bio tab | Pulled from compendium: physical description, traits, age range, lore summary. Player shouldn't need to ask the AI about their own character's species. From v1 OOC: player asked "describe a black dragonborn" — should be on the sheet. | 31 |
| Push notifications from day one | Web Push API + FCM. OOC messages, Narrative turns, state changes that need attention. V1 OOC had no notifications → no one checked it. Needed for 2-player, critical for 6-7. | 31 |
| Character sheet tab: "Vitals" not "Combat" | Combat is an overlay that appears during combat. The charsheet tab with HP/AC/attacks/conditions is always-available reference — "Vitals" avoids confusion. | 31 |
| "What changed" tab badges | After AI mechanics apply, pulsing gold dot on tabs where fields changed (Vitals = HP changed, Spells = slot used). Clears on tab view. Tap-to-source in reverse. | 31 |
| Swipe between PCs in character sheet | Swipe left/right on header to switch PCs without closing sheet. Dot indicators show position. Quick reference during combat. | 31 |
| Rest buttons on Vitals tab | Short rest / Long rest buttons right on Vitals tab where depleted resources are visible. System operations, not AI chat. The "fix it" button next to the problem. | 31 |
| Concentration pinned in Spells tab | Active concentration spell pins to top of Spells tab with glow + "End" button. Reminds player before casting another concentration spell. | 31 |
| Level-up glow on XP bar | XP bar pulses green when threshold crossed. Tapping opens level-up wizard. The character IS the notification. | 31 |
| Every modifier is a roll | All d20-eligible fields (abilities, skills, saves, initiative, attacks, spell attack) are tappable for instant rolls. Sheet becomes the dice roller for character-specific checks. | 31 |
| Familiar/mount lives in Vitals tab | Has its own HP/AC/speed — combat-relevant stats belong with other vitals. Gets own combat token when combat overlay appears. | 31 |
| Spell Save DC + Spell Attack at top of Spells tab | Three-box display: DC, Attack bonus (tappable roll), Ability. Always visible. Missing from v1 — casters need these constantly. | 31 |
| Initiative in Stats tab Quick Reference | Tappable for d20+DEX roll. Players check this before every combat. | 31 |
| Color picker on PC avatar | Tap color dot on avatar → picker. Sets accent color for tokens, borders, name displays. Stored in characters[].color. | 31 |
| Per-character JSON import in lock bar | "JSON" button in lock bar. Auto-detects format, preserves HP/XP/conditions. Carried from v1 player-requests. | 31 |
| Condition duration tracking | Conditions store optional round/hour counter. Duration auto-decrements. Visual badge on condition chip. | 31 |
| Manual Override editor (v1's Advanced Editor) | Keep full form-based editor as escape hatch. Renamed from "Advanced Editor" to "Manual Override." Primary path is wizards/enforcement pipeline; this is the safety net when the engine gets something wrong. Player used v1's editor constantly to fix AI/system mistakes — removing it would leave them trapped. | 31 |
| Derived bonuses, not stored | V1's proficiency auto-calc was buggy because it stored computed values that got out of sync. V2 derives all bonuses at render time: `save = abilityMod + (isProficient ? profBonus : 0)`. Nothing stored, nothing stale. | 31 |

## Conflict Resolutions (v1 agent specs vs v2 specs)

| Conflict | Resolution | Session |
|----------|------------|---------|
| Suggestion chips (✅ in player-requests, cut in decisions) | Stay cut. Quick Actions FAB + Ask DM replace the need. | 31 |
| `//` command system (✅ in player-requests, cut in decisions) | Stay cut. v2 mechanics pipeline + system operations UI replace them. | 31 |
| `//explain` help system (✅ in player-requests, cut with `//`) | Stay cut. Help moves to onboarding tooltips + Ask DM interception layer. | 31 |
| Encounter presets (✅ in player-requests, cut in decisions) | Moved to icebox. Player-requests say they were built and used. Could return via content pipeline. | 31 |
| Context strip carousel (✅ in player-requests) | Superseded by Situation Bar + Context Banner. Better design: tappable, always visible, urgency-sorted. | 31 |
| Character sheet tab names (Core/Skills/Combat/Spells/Gear/Features vs Stats/Vitals/Spells/Features/Equipment/Bio) | Use v2 spec: Stats/Vitals/Spells/Features/Equipment/Bio. "Stats" clearer than "Core." Bio is new (race reference + backstory). Skills fold into Stats. | 31 |
| `race` ownership (system vs player) | System-owned. Race is mechanical (chosen at creation, affects bonuses). Bio tab displays race reference data from compendium (read-only). | 31 |
| `hp` dual ownership (AI writes via mechanics, player needs manual +/-) | AI-owned with player override. Normal: AI writes via `hp:` mechanic. Override: player inline +/- calls `aiSet()` with `player_override` flag, logged for audit trail. | 31 |
| Missing character fields (background, alignment, languages, exhaustion, hp_temp, inspiration, attacks, color) | Added to campaign data shape. Real gameplay fields from v1. | 31 |
| Customizable header shortcuts (✅ in player-requests, not in v2) | Evaluate in Phase 3. v2 mode-based nav may make this unnecessary. Added as Quick Actions open question. | 31 |

## Open Questions (not yet decided)

- **Child-friendly view target age** — 7-16 is wide. What's the actual simplification scope?
- **Episode/module tracking system** — How does the AI know where the party is in the story? What triggers chapter progression? Workboard spec needed.
- **Quick Actions redesign** — Kept from v1 but needs improvement. What actions? How presented? Consider whether customizable header shortcuts (v1 feature) belong here.
- **Plugin system application** — Game-system swappable rules? Custom mechanic handlers? Icebox until core is solid.
