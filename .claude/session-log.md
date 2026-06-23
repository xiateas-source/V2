# Session Log — Handoff Note

## Session 39 · 2026-06-23 — Doc reconciliation (build-forward baseline)

**Decision:** Restart from the committed state. NOT recovering the lost uncommitted onboarding — building forward from what's in git.

**Verified baseline (clean ground to build on):**
- `npm install` clean · **33/33 tests pass** · `npm run build` succeeds (~143kB gzip main chunk).

**Shipped this session:**
- Reconciled `workboard.md` — added a **Reality Snapshot** at the top that supersedes the drifted Phase-0–8 checkboxes. Every `src/` file classified by tier (✅ tested / 🟢 real / 🟡 partial / ⛔ stub / ◻️ absent) with line counts + verification basis. The old Phase plan is kept below as design reference, explicitly marked superseded.

**Key correction — THE app is a face (developer review, mid-session):**
- My first reconciliation pass repeated S37's mistake: I read code presence + store-wiring (`InputBar.handleSend → engine.sendMsg`, Chat rendering pills/drift) as "functional UI." Developer corrected: **it is just a face — not functionally built for a player to interact with. You cannot actually sit down and play it.**
- Resolved framing (now in workboard): two axes. **Engine = real logic, partly unit-tested (the asset).** **Playable experience = does not exist yet.** UI files reclassified 🟢→🟠 **face** (renders + wired, NOT playable). Verify playability by playing, never by reading code.
- S37 vs S38 conflict resolved toward **S38**: it was a face all along; S37 confused "deployed a build" with "playable."
- True ⛔ stubs (1-line, genuinely empty): Treasury, Glossary, SessionReview, Contracts, ContentImport, SessionZero, AppSimple, shared/* (MechPill/Modal/Nav/Toast/LevelUp), RollRequest, jsonParser/mdParser/webParser, bundles, migrate, elevenlabs.

**Staleness spot-check (CLAUDE.md step 6):** architecture.md nav (Cargo/Journal/Settings) matches `App.jsx`. ✅ No fix needed.

**Developer's sharper truth (the real "where we are"):** Only **two** things are built FOR THE PLAYER — (1) **onboarding, half-done** and (2) the **combat system**. Everything else is loose components, not a built interface. That's *why every session gets confused*: the components look like an app, so each fresh Claude assumes the interface exists. The engine is a brain with no body.

**Diagnosis confirming it (code trace):**
- *No persistence:* `sync.js` writes campaign state to Firebase only — no local save; boot (`main.jsx`) never reloads a campaign (`loadCampaignFromCloud` unused). Reload wipes `campaign.id` → dumps back to onboarding. Law 1 offline-fallback NOT implemented.
- *Feels inert:* play UI only renders when `campaign.id !== ''` (set only at end of onboarding), and nothing you do endures, so it reads as fake even though some handlers (e.g. CharTiles→CharSheet) are wired.

**DECISION (S39): build the interface FIRST.** The connective play surface + local-first persistence spine. Engine, combat, and onboarding plug into it. Don't fill stubs or harden the engine first.

**Next up:** Build the real play interface. Open scoping question for next turn: evolve the working Chat/CharTiles/combat into a coherent shell vs. design fresh from mockups/specs; and what the player's main screen centers on. Developer leans "see it, don't read about it" — show live UI, not descriptions.

**Branch state:** `claude/new-session-mr3qge`. (was at 90d96a4 at session start)

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
