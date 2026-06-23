# Session Log — Handoff Note

## Session 37 · 2026-06-23

### Shipped (all merged to main + deployed live to pebble-v2.web.app)
- **Combat tracker + turn system rebuild**
  - Engine owns the turn pointer (Law 2). `advanceCombatToNextPC()` in gates.js lands on the next living PC, skips downed, wraps the round. AI resolves NPCs/enemies up to the next PC and stops.
  - PC initiative now records: RollBar derives Initiative prompts from `combatState` (PCs flagged `rollPending`), rolls d20+DEX, writes back, fires `combatKickoff`. (Was completely broken — combat hung on turn 1; side-effect roll_requests were heard by nobody.)
  - `zone_add_enemy` seeds combat before appending (no more vanished first enemy). `initiative` stored pre-sorted; `currentTurn` indexed consistently.
  - `TurnPrompt.jsx` — derived from synced state, shows on all devices, any player taps, quick-action buttons (attacks/spells) prefill input via `prefill-input` event.
  - `⚔ Round N` markers in narrative on wrap.
  - **Minimize toggle** on the overlay. **Live ally HP** (from char store) vs enemy HP (initiative entry).
  - `roll_request` code-enforced PC-only (validation rejects enemy targets). Contract requires `hp` mechanic on any damage/heal so enemy HP tracks.
- **Onboarding: backstory restored**
  - Editable Appearance/Personality/Backstory in the character-creation preview (all 3 paths), saved on commit.
  - Editable Bio tab on the character sheet (playerSet → synced) for editing/recovery after creation.
- **Deploy pipeline**
  - `.github/workflows/deploy.yml` — auto-deploy on push to main.
  - Deployed manually several times via service-account key (network here can't reach Firebase normally; firebase-tools installed in node_modules).

### Tests / build
- 33 foundations tests pass; build clean. 6 turn-engine paths verified via scratch test (not committed).

### ✅ DONE — Deploy pipeline self-serve (developer completed)
1. **Firebase key rotated** — the chat-exposed key (`26aa7b753c…`) is revoked/dead. Do NOT attempt manual deploys with the old uploaded key; it no longer works.
2. **GitHub secret `FIREBASE_SERVICE_ACCOUNT_PEBBLE_V2` added** — auto-deploy on push to main is now live. No more manual deploys needed; pushing to main deploys within ~2 min. Verify via Actions tab (green ✔ on "Deploy to Firebase Hosting").

### Known issues / watch in play-test
- AI stopping at each PC is prompt-enforced (contract + combat block), not code. Gate 2 flags over-runs. If it runs ahead often → add a code gate that truncates past a PC.
- Enemy HP only moves if the AI emits an `hp` mechanic; Gate 3 flags damage narrated without one. If common → engine auto-apply damage from narration as fallback.
- Narrative-tab message during your turn = your action (non-blocking by design). Use OOC for mid-combat questions.
- Gate 1 may false-flag the kickoff if the AI echoes initiative numbers. Non-blocking.

### DOC DEBT (important)
- `.claude/` files drifted: only decisions.md, session-log.md, workboard.md (combat items) updated this session. **workboard.md is broadly stale** — it's a Phase-3 build plan still showing built features as `[ ]`. The app is far past that plan (deployed, playable). Needs a full reconciliation pass: walk the module map, mark what's actually built. architecture.md / ui-specs-v2.md not swept for this session's changes.

### Next Up
1. Play-test live combat — confirm turn order holds and AI stops on PCs.
2. Rest of D&D-Beyond-style onboarding: **manual stat-rolling** + the other import/onboarding options we'd cross-referenced (spec was lost with an uncommitted build — re-decide).
3. Reconcile workboard.md with reality (big cleanup).
4. Optional combat: engine auto-roll enemies, manual skip/pass, push wired to TurnPrompt.
5. Delete stale branches (session-start-protocol, transfer-v2-planning-docs); decide PR vs straight-to-main workflow.

### Branch State
- main @ 81d1f9c (+ this doc commit). Feature branch `claude/combat-tracker-turn-system-uazlr9` fast-forwarded to match main (0 ahead / 0 behind).
- Other remote branches are stale: `claude/session-start-protocol-o8jf7j`, `claude/transfer-v2-planning-docs-hlibvu` (repo's original root — source of GitHub's "96 commits ahead" cosmetic note), `gh-pages`.
