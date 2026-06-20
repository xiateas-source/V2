# Session Log — Handoff Note

## Session 30 · 2026-06-20

### Shipped
- **prime-directive-v2.md** — Five Laws, content portability, v1 lessons, cross-law alignment, open questions
- **ai-failures.md** — Extracted from directive. Mechanical (20), information (5), narrative (6) failures categorized. Includes consequence timer enforcement, combat turn enforcement, OOC/Rules channel failures, system operation gaps
- **architecture-v2.md** — Five pieces (UI/Engine/State/Data/Content), engine pipeline, module map, data tiers, mode transitions, information gating, tap-to-source principle. Treasury.jsx added as dedicated reference screen
- **decisions-v2.md** — Every design choice from planning sessions in table format with rationale. Features carried forward (11) and cut (6) from v1. System operations section added from OOC review
- **CLAUDE-v2.md** — Auto-loaded instructions: Five Laws inline, architecture summary, session protocol, key constraints, developer working style
- **gameplay-reference-v2.md** — Patterns from actual v1 play logs: AI response structure, choice presentation, roll request flow, XP delivery issues, full contract compliance analysis (15 followed / 12 ignored)
- **v1-contract-reference.md** — Complete v1 AI contract preserved for reference
- **enforcement-spec-v2.md** — 9-gate mechanics pipeline spec: roll confirmation, combat turns, drift detectors, scene transitions, unmentioned PCs, spell validation, skill checks, XP audit, income reconciliation. Priority-ordered for implementation
- **v1-engine-reference.md** — buildPrompt() assembly order (13 sections), genLedger() compact + full formats, parseMechanics() all 65 keys with format reference, detection strategy, built-in validation, post-parse actions
- **v1-seed-data.md** — XP thresholds (L1–20), level-up data (Fighter/Rogue/Bard L2–10), Bard spell list, spell compendium (94 spells), 16 Battle Master maneuvers, 44 feats (PHB + TCoE), 97-term D&D glossary
- **v2-mockup.html** — Interactive play screen mockup with Soft Autumn palette (palette will change in v2)

### Decisions Made
- Four modes: setup, play, reference, manage
- Three data tiers: Firebase (synced game state), IndexedDB (local reference), Shared Bundles (on import)
- Field ownership: AI / Player / System — no cross-writes
- Situation bar replaces quest bar — main quest pinned, consequences priority placement, player quests scrollable
- Tap-to-source — all displayed info is tappable, navigates to source. No dead text
- Bottom nav: Cargo / Treasury / Journal / Settings. Combat and level-up are event-driven overlays
- Child-friendly view as separate URL entry point (AppSimple.jsx), same state/engine
- Combat evolution: phase 1 zone grid → phase 2 visual tile map (mobile VTT inspired)
- Consequence timer enforcement via buildPrompt injection
- New color palette TBD — Soft Autumn not carrying forward
- Shared bundles reusable (not one-time) — supports mid-game player joins
- Town reputation carried forward (Journal, AI-owned, needs proper v2 implementation)
- Secrets consolidated to one home (v1 had multiple places — Law 4 fix)
- Three color modes (default/light/night) — new palette TBD
- Scenes/snippets cut (replaced by content pipeline)
- Plugin system noted as icebox (accidental v1 feature, could support game-system plugins)
- AI-generated items → Firebase, compendium items → IndexedDB
- Campaign map images → IndexedDB
- Device-local "which PC am I" — no formal identity system
- Relationships array dropped (redundant with NPC tracker)
- No suggestion chips, no // command system in v2
- Mechanic pills, glossary, Previously On, Quick Actions, checkpoint/rewind all carried forward
- v1 stays live while v2 is built
- Session start protocol reads 4 files — will tune after a few sessions
- All rolls must be player-confirmed — engine rejects AI-generated rolls
- Scene transitions require player confirmation — no auto-advancing
- AI cannot act for PCs the player didn't mention — no autopiloting
- 9-gate enforcement pipeline spec written — replaces 12 contract clauses AI ignored
- System operations (HP reset, stat corrections) need dedicated UI, not AI chat
- Level-up wizard needs re-entry / edit mode for missed choices
- OOC/Rules channels serve different purposes — app issues shouldn't go through AI
- Treasury is its own reference screen, not part of Cargo

### Known Issues
- Cannot push to xiateas-source/V2 repo from this session (auth proxy locked to tinklepebble)
- All v2 planning docs live on tinklepebble repo, need to be transferred to V2 repo
- Workboard not yet written — first task in v2 repo

### In Progress
- Nothing code-wise in progress — this was a planning session

### Next Up
1. **Transfer docs to V2 repo** — start new session on xiateas-source/V2, pull docs from tinklepebble via GitHub MCP tools
2. **Write workboard.md** — feature specs detailed enough for autonomous building. This is where episode tracking, Quick Actions redesign, OOC/Rules context, and all workboard-flagged items get specced
3. **Choose new color palette** — design session with UI visible
4. **Resolve open questions** — OOC/Rules channel context, child-friendly view target age
5. **Start building** — scaffold v2 project structure per architecture module map

### Branch State
- Branch: `claude/xiateas-source-v2-0obeyj` on xiateas-source/tinklepebble
- Last commit: 4193245
- All planning docs committed and pushed
- Not merged to main (v1 CLAUDE.md still active on main for v1 sessions)

### Files to Transfer to V2 Repo
When starting a new session on xiateas-source/V2:
- `.claude/CLAUDE-v2.md` → rename to `CLAUDE.md` (root)
- `.claude/prime-directive-v2.md` → `.claude/prime-directive.md`
- `.claude/architecture-v2.md` → `.claude/architecture.md`
- `.claude/decisions-v2.md` → `.claude/decisions.md`
- `.claude/ai-failures.md` → `.claude/ai-failures.md`
- `.claude/gameplay-reference-v2.md` → `.claude/gameplay-reference.md`
- `.claude/v1-contract-reference.md` → `.claude/v1-contract-reference.md`
- `.claude/enforcement-spec-v2.md` → `.claude/enforcement-spec.md`
- `.claude/v1-engine-reference.md` → `.claude/v1-engine-reference.md`
- `.claude/v1-seed-data.md` → `.claude/v1-seed-data.md`
- `.claude/session-log-v2.md` → `.claude/session-log.md`
- `v2-mockup.html` → `mockup.html` (reference)

### Prompt for V2 Session
Paste this in the first message of a new session on xiateas-source/V2:

```
Transfer all v2 planning docs from xiateas-source/tinklepebble to this repo.

Source: branch `claude/xiateas-source-v2-0obeyj` on `xiateas-source/tinklepebble`

File manifest (source → destination):
- .claude/CLAUDE-v2.md → CLAUDE.md (root)
- .claude/prime-directive-v2.md → .claude/prime-directive.md
- .claude/architecture-v2.md → .claude/architecture.md
- .claude/decisions-v2.md → .claude/decisions.md
- .claude/ai-failures.md → .claude/ai-failures.md
- .claude/gameplay-reference-v2.md → .claude/gameplay-reference.md
- .claude/v1-contract-reference.md → .claude/v1-contract-reference.md
- .claude/enforcement-spec-v2.md → .claude/enforcement-spec.md
- .claude/v1-engine-reference.md → .claude/v1-engine-reference.md
- .claude/v1-seed-data.md → .claude/v1-seed-data.md
- .claude/session-log-v2.md → .claude/session-log.md
- v2-mockup.html → mockup.html

Use GitHub MCP tools to read each file from tinklepebble and write it to this repo. Strip the "-v2" suffixes from filenames. CLAUDE-v2.md goes to root as CLAUDE.md, everything else goes to .claude/. Commit all files in one commit.

After transfer, the first real task is writing workboard.md — feature specs detailed enough for autonomous building.
```
