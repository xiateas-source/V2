# Session Log — Handoff Note

## Session 37 · 2026-06-23

### Shipped
- **Combat tracker + turn system rebuild** (merged to main)
  - **Engine owns the turn pointer** (Law 2). The AI only narrates the turn it's handed and resolves NPCs/enemies up to the next PC; `advanceCombatToNextPC()` deterministically lands on the next living PC, skips downed combatants, wraps the round.
  - **PC initiative now actually records.** Was the root bug — PCs sat at roll 0 forever. RollBar derives Initiative prompts straight from `combatState` (rollPending PCs), rolls d20+DEX, writes back, fires the kickoff.
  - **`zone_add_enemy` no longer wipes the first enemy** (seeds combat before appending).
  - **`initiative` stored pre-sorted**; `currentTurn` indexed consistently across UI/prompt/engine.
  - **Enemy turns auto-stream; engine stops on each PC.** Mode-agnostic (single/multi only affects push + labels).
  - **TurnPrompt.jsx** — derived from synced state, shows on all devices, any player taps; quick-action buttons (PC attacks/spells) prefill the input.
  - **Round markers** (`⚔ Round N`) drop into narrative on each wrap.
  - **roll_request is code-enforced PC-only** — the DM can no longer make the player roll for an enemy (rejected mechanic).

### Critical bugs caught pre-launch (fixed)
- Initiative rolls never surfaced (combat_start side-effect roll_requests heard by nobody; `applyMechanics` only returns top-level mechanics). Combat would have hung on turn 1. Fixed by sourcing initiative prompts from combatState.
- Enemy roll_request reached the roll bar (prompt-only rule, no code enforcement). Now rejected in validation.

### Known issues / watch during play-test
- AI stopping at each PC is **prompt-enforced** (contract + combat block), not code-enforced. Gate 2 flags it after the fact if the AI over-runs. Watch whether the AI reliably stops on PC turns.
- Any narrative-tab message during your turn counts as your action (non-blocking by design). Use OOC for questions mid-combat or you may advance your own turn.
- Gate 1 may false-positive-flag the kickoff if the AI echoes initiative numbers ("Ivy rolls 18"). Non-blocking flag only.
- Enemy roll the AI tees up is currently *dropped* (rejected), not auto-resolved. Future option: engine auto-rolls enemies and feeds result back.
- Container can't reach live AI or run firebase deploy — engine logic verified via tests, not a live AI combat exchange.

### Deploy state
- **Merged to main + pushed** (main @ 1d7b543). Build verified (`npm run build` clean, dist/ ready).
- **NOT deployed** — Firebase CLI unavailable in this environment. Deploy must run on a machine with firebase auth:
  `git pull && npm install && npm run build && firebase deploy --only hosting`

### Next Up
1. Play-test combat live; confirm turn order holds and the AI stops on PCs.
2. If AI over-runs turns: tighten contract or add a code gate that truncates narration past a PC.
3. Optional: engine auto-roll for enemies (no DM stall).
4. Optional: wire TurnPrompt → push notifications (multi-player).
5. Manual "skip/pass turn" control.

### Branch State
- Branch: `claude/combat-tracker-turn-system-uazlr9` (merged to main)
- main last commit: 1d7b543
- 33 foundations tests pass; 6 turn-engine paths verified via scratch test (not committed)
