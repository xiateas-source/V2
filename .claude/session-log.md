# Session Log — Handoff Note

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

---

## Session 38 · 2026-06-23 — Reality reconciliation
- Audit/cleanup session. First audit pass over-claimed ("deployed app, Phases 0–7 done") by reading file sizes as features — **corrected**. Verified reality lives in `.claude/audit-2026-06-23.md`.
- **Verified tiering:** REAL = AI mechanics engine + backstory (active dev). LOST = fuller onboarding (manual stat-rolling, import mapping, guided wizard — uncommitted, buried by a deploy). MOCKUP = UI/container on pebble-v2. UNBUILT = everything else (`Treasury.jsx` is 1 line; most reference/manage screens are unwired shells).
- **Open decision:** recover lost onboarding from Firebase Hosting → Release history (owner-only) vs. redo it. Then build the real UI/container on top of the working engine.
- Branch: `claude/repo-audit-plan-optimization-9uixwi`.

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
