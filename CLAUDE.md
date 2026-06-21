# Tinklepebble V2 — Claude Code Instructions

## The Five Laws

**1. The core loop is sacred.**
Player acts → AI narrates → mechanics parse → validate → state updates → devices sync. If sync fails, play continues locally and reconciles on reconnect. Never break the loop.

**2. The container is the contract.**
If it can be enforced in code, it must be. Validation layers, structured output, state guards — the AI *can't* break rules, not just *shouldn't*. What code can't enforce, contracts handle — but the contract list should shrink, not grow. When enforcement fails, the player can rewind.

Examples of code enforcement (see `.claude/ai-failures.md` for full audit):
- AI adjusts HP in narration → reject unless `hp:` mechanic emitted
- AI writes to system-owned field (level, hp_max, class) → reject, wizard-only
- AI narrates gold/items/NPCs without mechanics → drift detector flags it
- AI skips concentration save after damage → auto-trigger check
- Consequence timer expires → engine flags for resolution before AI moves on
- AI resolves a roll in prose → reject; every roll must come from the player via roll UI
- AI switches scene/location/time → require player confirmation before applying
- AI acts for a PC the player didn't mention → flag; never resolve unspoken PC actions

State fields have owners:
- **AI-owned** (via mechanics): hp, conditions, gold, quests, NPCs, location, weather, time
- **Player-owned** (via editors): name, backstory, appearance, personality, notes
- **System-owned** (via wizards): level, hp_max, class, features, spells, slots, resources

**3. Mobile only. Eyes-free when needed.**
Portrait mode, one-handed, mid-session. No desktop fallback. TTS is a play feature — the session can be listened to, not just read. The app accommodates partial attention.

**4. One experience, not many features.**
Four modes: setup, play, reference, manage. Every feature belongs to one. Every piece of data has one home. Features appear when they have content, not before. Surface changes where the player is — don't notify *about* changes somewhere else. Tap-to-source: any displayed information is tappable and navigates to its source. No dead text.

**5. Zero cost to play.**
Free APIs, free hosting, free sync. Never depend on a single provider. The system prompt is a budget — keep it lean as the world expands. Memory is a feature. Three data tiers: Firebase (game state, synced), IndexedDB (reference content, local), Shared Bundles (content packs, imported per player).

---

## Standing Permissions
- Routine UI, CSS, copy, and dead code changes: proceed without asking
- Ask for confirmation before: Firebase config changes, state schema changes, data model changes, refactors >50 lines

---

## Session Start Protocol
1. Read `.claude/session-log.md` — handoff from last session
2. Read `.claude/workboard.md` — active work, queued items, specs
3. Read `.claude/architecture.md` — five pieces, module map, data tiers, engine pipeline
4. Read `.claude/decisions.md` — design choices already made (don't re-litigate)
5. **Vision check** — flag any tension with the Five Laws. State it once, briefly.
6. **Staleness spot-check** — while reading architecture.md, verify 3 things still match the workboard: (a) bottom nav items, (b) file map names, (c) chat tab count. If any mismatch, fix architecture.md before proceeding.
7. `git branch` + `git log --oneline -5` — confirm branch and recent commits
8. Greet user with one-line summary from session log

Deep reference (read on demand, not every session):
- `.claude/prime-directive.md` — full vision, V1 lessons, cross-law alignment
- `.claude/ai-failures.md` — Law 2 audit trail, every documented AI failure

**After a few sessions**, ask the developer: "Does reading 4 files at startup feel heavy? Want me to drop architecture and decisions to on-demand?" Tune the protocol based on experience.

---

## Session End Protocol
1. **Commit** all changes with clear message
2. **Push** the feature branch: `git push -u origin <current-branch>`
3. If user says "go live": merge to main and push
4. **Update `.claude/workboard.md`** — mark completed items, add new items
5. **Update `.claude/decisions.md`** — if design choices were made this session
6. **Cross-file consistency sweep** — check if this session's changes invalidate info in other `.claude/` files:
   - `architecture.md` — does it still match the workboard module map, nav items, chat tabs, file names, state ownership?
   - `ui-specs-v2.md` — do field lists still match workboard data shapes?
   - `chat-system-spec-v2.md` — do message types, tab behavior, or overlay rules still match decisions?
   - If anything drifted: fix it now, don't leave it for next session to discover.
7. **Write `.claude/session-log.md`** — overwrite with fresh handoff:
   - Session date and number (increment from last)
   - Shipped — what was built
   - Decisions made — design choices, user preferences
   - Known issues — bugs, regressions, follow-ups
   - In progress — unfinished work (include file + line context)
   - Next up — user's stated priorities or logical next steps
   - Branch state — branch name, last commit hash
8. Commit and push doc updates
9. Merge docs to main: `git checkout main && git merge <branch> && git push origin main && git checkout <branch>`
10. Start a new chat for next session

---

## Token Management
- New chat every work session — `.claude/` files ARE the memory
- session-log.md is the bridge between chats
- Never cut mid-feature: finish, commit, push, write session log, THEN end
- Context running low: finish current task, write session log, tell user to start fresh

---

## Architecture Summary

Five pieces: **UI** (screens by mode) → **Engine** (AI brain) → **State** (SolidJS signals) → **Data** (Firebase/IndexedDB/bundles) ← **Content** (import pipeline)

**Core loop:**
```
sendMsg() → buildPrompt(state, contracts, ledger, consequences)
  → callAI(messages, systemPrompt)  — retry + provider fallback
  → extractMechanics(response)
  → validateMechanics(changes, state)  — Law 2 enforcement
  → applyMechanics(validChanges, state)
  → state updates (SolidJS signals) → UI reacts → Firebase syncs
```

**Module map:**
```
src/
├── ai/          — providers, prompt, mechanics, engine, contracts, memory
├── content/     — parsers (PDF/epub/mobi/web/md/JSON), normalizer
├── data/        — firebase, local (IndexedDB), bundles, migrate
├── state/       — store (signals + ownership), campaign, system
├── ui/
│   ├── play/    — Chat, ContextBanner, QuestBar, CharTiles, Combat, InputBar, etc.
│   ├── reference/ — CharSheet, Journal, Cargo, Compendium, Glossary
│   ├── setup/   — SessionZero, CharCreate, ContentImport, CampaignConfig, PlayerOnboard
│   ├── manage/  — Contracts, SessionReview, DevTools, Settings
│   └── shared/  — MechPill, Toast, Modal, Nav, LevelUp
├── audio/       — browserTTS, elevenlabs
└── main.js
```

**Bottom nav:** Cargo / Journal / Settings. Combat and level-up are event-driven overlays.

**Data tiers:**
- Firebase — game state that changes during play (HP, quests, inventory, chat, combat, contracts)
- IndexedDB — reference content (spell DB, class data, feats, module text, parsed books, map images)
- Shared Bundles — content packs imported per player, Firebase carries "has pack X" flag only

---

## Key Constraints
- Do NOT push to main without explicit user instruction
- Field ownership is enforced — AI/player/system owners cannot cross-write
- Level-dependent fields (hp_max, class, features, spells, slots, resources) are system-owned — only wizards write them
- Mechanics pipeline: extract → validate → apply. No shortcuts, no direct state writes from AI response
- Drift detectors catch AI narrating state changes without emitting mechanics
- Campaign data resets on swap. System data survives.
- Mobile only — no desktop layouts, no hover interactions, portrait mode, one-handed
- 20 color themes (10 dark + 10 light) — Dark/Light toggle + palette cycle button in Settings

---

## Who We Are
A family building a phone-native AI virtual tabletop. Two players now, expandable to 6-7. No human DM. No books on the table. No subscription. Open a browser and play. The developer is a player, not a software engineer — the AI fills the experience gap.

## Working With The Developer
- Communicates in shorthand. "Yes" means "good enough, keep going" — not carved in stone. Will circle back to refine.
- Describes features as experiences, not code. Translate between player-speak and implementation.
- Player first, developer second. "We never used it" outweighs technical elegance. If it works in play, it's good.
- Develops through gameplay — play, find what breaks, fix, play again. The session is the test environment.
- Wants to see things, not read about them. Mockups and live UI over descriptions.
- Fast, dense sessions. Don't slow down with long explanations. Flag concerns once, move on.
- Expects the AI to go beyond the task — connect features, catch edge cases, add small wins. But flag additions so they can be reviewed.
- The other player uses the app without reading docs — it has to just work. The child player needs things to be accessible.
