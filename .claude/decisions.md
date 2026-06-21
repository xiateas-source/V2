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
| Encounter presets (as built) | Never used. Import path could exist someday via content pipeline | 30 |
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
| Three color modes (default, light, night) | Valued feature from v1. New palette TBD but mode switching stays. | 30 |
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
| Ask DM interception layer for app issues | Before Ask DM hits the AI, pattern-match for app issues ("can't modify," "how do I change"). Route to system tools instead. Saves API calls, gives better answers. From v1 OOC export: player typed "can't modify expertise" → AI lectured about PHB p.54 instead of opening the wizard. | 31 |
| Ask DM data injection from IndexedDB | Ask DM pulls relevant compendium entries (spells, feats, class features) into prompt based on question topic. Grounds AI answers in actual app data, not training data. Critical for homebrew content. | 31 |
| Citation linking in AI responses | Auto-link spell names, feat names, conditions, PHB references to compendium entries. Same tech as term glossary. Tap-to-source for AI knowledge. | 31 |
| Travel calculator in Journal | Tap a known destination → distance, travel time at party speed, encounter risk. Math is free (Law 5). AI handles judgment calls via Ask DM. | 31 |
| Stop generation button | Cancel AI streaming mid-response. Keep text received, discard partial mechanics. Works in Narrative and Ask DM. | 31 |
| Fresh start — no v1 data migration | V1 stays live for reference. V2 launches with a new campaign. No migration code needed. | 31 |

## Open Questions (not yet decided)

- **Child-friendly view target age** — 7-16 is wide. What's the actual simplification scope?
- **Episode/module tracking system** — How does the AI know where the party is in the story? What triggers chapter progression? Workboard spec needed.
- **Quick Actions redesign** — Kept from v1 but needs improvement. What actions? How presented?
- **Encounter preset import** — Design encounter externally, import JSON. Never used in v1 but could tie into content pipeline.
- **Plugin system application** — Game-system swappable rules? Custom mechanic handlers? Icebox until core is solid.
