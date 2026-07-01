# Tinklepebble V2 — Claude Code Instructions

## The Five Laws

**1. The core loop is sacred.**
Player acts → AI narrates → mechanics parse → validate → state updates → devices sync. If sync fails, play continues locally and reconciles on reconnect.

**2. The container is the contract.**
If it can be enforced in code, it must be. Validation layers, structured output, state guards — the AI *can't* break rules, not just *shouldn't*. What code can't enforce, contracts handle — but the contract list should shrink, not grow. When enforcement fails, the player can rewind. See `.claude/ai-failures.md` for the full audit.

State field owners — enforced on every write:
- **AI-owned** (via mechanics): hp, conditions, gold, quests, NPCs, location, weather, time
- **Player-owned** (via editors): name, backstory, appearance, personality, notes
- **System-owned** (via wizards): level, hp_max, class, features, spells, slots, resources

**3. Mobile only. Eyes-free when needed.**
Portrait mode, one-handed, mid-session. No desktop fallback. TTS is a play feature. The app accommodates partial attention.

**4. One experience, not many features.**
Four modes: setup, play, reference, manage. Every feature belongs to one. Every piece of data has one home. Surface changes where the player is. Tap-to-source: any displayed information is tappable and navigates to its source.

**5. Zero cost to play.**
Free APIs, free hosting, free sync. Never depend on a single provider. The system prompt is a budget — keep it lean. Three data tiers: Firebase (game state, synced), IndexedDB (reference content, local), Shared Bundles (content packs, imported per player).

---

## Standing Permissions
- Routine UI, CSS, copy, and dead code changes: proceed without asking
- Ask for confirmation before: Firebase config changes, state schema changes, data model changes, refactors >50 lines

---

## Session Protocol

**Start:**
1. Read `.claude/session-log.md` — handoff from last session
2. Read `.claude/workboard.md` — active work and priorities
3. `git branch` + `git log --oneline -5` — confirm branch and recent commits
4. Greet user with one-line summary from session log

On-demand reference (read when relevant, not every session):
- `.claude/decisions.md` — design choices already made
- `.claude/ui-specs-v2.md` — UI requirements and field inventory
- `.claude/chat-system-spec-v2.md` — chat system architecture
- `.claude/enforcement-spec.md` — mechanics pipeline gates
- `.claude/ai-failures.md` — Law 2 audit trail
- `.claude/prime-directive.md` — vision and cross-law alignment
- `.claude/player-requests-v2.md` — unbuilt player requests

**End:**
1. Commit all changes, push the feature branch
2. Update `.claude/workboard.md` — mark completed items, add new items
3. Update `.claude/decisions.md` — if design choices were made
4. If the session touched a gate, mechanic, or enforcement behavior: check `.claude/ai-failures.md` for a matching line to mark ✅ or a new failure mode to add — this doc only stays true if every session that touches Law 2 loops back to it, not just `decisions.md`
5. Write `.claude/session-log.md` — overwrite with fresh handoff (what shipped, decisions, known issues, next up, branch state)
6. Commit and push doc updates
7. If user says "go live": merge to main and push

---

## Token Management
- New chat every work session — `.claude/` files ARE the memory
- session-log.md is the bridge between chats
- Never cut mid-feature: finish, commit, push, write session log, THEN end

---

## Key Constraints
- Do NOT push to main without explicit user instruction
- Field ownership is enforced — AI/player/system owners cannot cross-write
- Mechanics pipeline: extract → validate → apply. No shortcuts, no direct state writes from AI response
- Drift detectors catch AI narrating state changes without emitting mechanics
- Campaign data resets on swap. System data survives.
- Mobile only — no desktop layouts, no hover interactions, portrait mode, one-handed
- 20 color themes (10 dark + 10 light)
- Bottom nav: Cargo / Play (d20) / Journal / Settings. Combat and level-up are event-driven overlays.

---

## Who We Are
A family building a phone-native AI virtual tabletop. Two players now, expandable to 6-7. No human DM. No books on the table. No subscription. Open a browser and play. The developer is a player, not a software engineer — the AI fills the experience gap.

## Working With The Developer
- Develops through gameplay — play, find what breaks, fix, play again
- Wants to see things, not read about them. Mockups and live UI over descriptions.
- Expects the AI to go beyond the task — connect features, catch edge cases, add small wins. But flag additions so they can be reviewed.
- The other players use the app without reading docs — it has to just work. The child player needs things to be accessible.
