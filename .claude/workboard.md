# Workboard

*What to build next. Updated S67 · 2026-07-01.*

---

## Current State

The app deploys, renders, navigates. Engine pipeline (sendMsg → extract → validate → apply) is tested. Persistence works. Combat has turn enforcement, and Action Economy is now enforced at the quick-action UI level (S67). Character creation works (3 paths + guided wizard, plus mid-campaign via Settings). Level-up wizard handles all 12 classes. Multiplayer (invite links, live Firebase sync, shared identity) shipped S50, **live two-device retested and confirmed working S57**, plus a manual presence toggle shipped S58, three sync-bug fixes shipped S60, a root-caused live join-failure fix shipped S61 — **S60/S61 merged to main and confirmed live in production S62** — and a Play-screen presence indicator shipped S62. Three-phase skill-check resolution (classify → roll bar → narrate) shipped S48, live-verified S49. 68 unit tests passing.

**Latest (S67)** — Action Economy code-level enforcement (Priority #1 remainder, workboard-flagged gap). `combatState.actionsUsed` flags existed but nothing checked them. Root cause: the combat engine advances the turn pointer (and resets `actionsUsed`) after every single AI response, so a post-hoc cross-check inside Gate 2 would only ever see "the tap that produced this very message" — false-positive-prone, not a real reuse check. Fixed at the source instead: `TurnPrompt.jsx`'s quick-action buttons (Attack/Dash/Dodge/etc. for Action, Cunning Action/Second Wind/Inspire for Bonus) now get the native `disabled` attribute once that econ slot is already spent this turn — a player can no longer tap both an Attack and a Dash in the same turn. `take()` also now calls the existing (previously unused/dead) `markActionUsed()` helper instead of duplicating the store write. Separately, Gate 2's prose-scan (`multi_action`/`multi_bonus`/`multi_reaction`) was scoped to sentences mentioning the current actor (`actorSentences()` helper) instead of counting matches across the whole AI response — fixes a real false-positive risk where NPC/enemy turns narrated in the same response (legitimate, since enemies act before the next PC) were inflating the count and could misfire the hard re-prompt in `engine.js`. Added an Extra Attack allowance alongside the existing Action Surge bypass. 8 new tests added (68/68 passing), build clean. Free-typed narrative actions are unaffected — that path still relies on Gate 2's prose heuristic, same as before. **Not live-verified in the browser** — this sandbox can't reach Firebase so `main.jsx`'s boot sequence (`restoreGuestSession`/Firebase init) hangs before first render; confirmed via `npm test`/`npm run build` only, consistent with prior sessions' documented sandbox limitation. Needs a live combat session to confirm the button-disable feels right in practice.

**Latest (S63)** — Three player-reported issues fixed plus combat side drawers shipped. (1) Pack contents (Burglar's Pack etc.) were invisible — `CharCreate.jsx` now preserves `note` field on items, `Cargo.jsx` shows it expandably on tap. (2) Bag of Holding now actually reduces carry weight — per-item `inContainer` toggle, weight excluded from total, name-based regex for AI-typed containers. (3) Side drawers: a left handle (shield icon) slides out character vitals + attacks, a right handle (sparkle icon) slides out spells/resources — always reachable even during combat. HP adjust, slot expend, and resource use all route through the mechanics pipeline. All changes committed, pushed to `claude/latest-test-analysis-v64a6i`. Build clean.

**Latest (S62)** — Two bugs surfaced in real play, both fixed and pushed. (1) "Campaign not found" returned again after S61 — fixed with an auth guard (`getUid()` null → clearer error) and a 3s auto-retry in `joinCampaign()`, plus an offline-toast on `shareInvite()`'s `forceSyncNow()`. (2) Guest character Nyx disappeared on iOS tab-kill — fixed with `mergeCharacters()` union-merge by id in `persist.js`'s `mergeCampaign()` (local-only chars preserved; cloud wins per-id for HP/stats) and immediate `forceSyncNow()` after all `CharCreate.jsx` commit/remove paths to bypass the 3s debounce. Also shipped: Play-screen presence indicator in `ContextBanner` — compact circle badge in the icon row, counts other active players, taps to Settings roster. All changes committed + pushed (`75c693f`). 60/60 tests passing, build clean. Not yet deployed to main or live-verified — needs user sign-off to deploy, then a two-device session to verify badge + join retry + character survival on tab-kill.

**Latest (S61)** — User hit a real "Campaign not found" join failure in play and shared a full RTDB export. Traced the actual mechanism through the code rather than guessing: `dbWrite()` silently swallows its own failures (queues to `fb_pending`, never rethrows), so `shareInvite()`'s `await forceSyncNow()` can resolve "successfully" even when the write never reached RTDB — the host shares a link believing state is pushed, the guest's `dbRead()` hits the real (empty) path and the join throws before ever recording the guest's `joined` pointer. The queued write's only retry path, `flushPending()`, was only ever called once at app boot — not on a mid-session reconnect — so a write queued after a connectivity blip sat inert until the device happened to reload. Fixed by wiring the existing `.info/connected` listener to call `flushPending()` on every reconnect, not just boot (`firebase.js`). Logic-only, no new Firebase path or schema change. 60/60 tests passing, build clean. See decisions.md "Live join failure root-caused (S61)".

**Latest (S60)** — Agent audit of the S58 presence/sync path found and fixed three real bugs, all logic-only inside the existing sync model (no new Firebase paths): `dbListen()` was dropping *any* remote update within 3s of this device's own write (not just its own echo) — switched to content-based echo detection. `startLiveSync()` wasn't armed when a host creates a new campaign mid-session (only at boot/guest-join) — now armed in `PlayerOnboard.jsx`. `mergeCampaign()` let a cloud snapshot wholesale-overwrite local `presence`, causing the toggle-flicker bug already flagged in `persist.js`'s comments — now merges presence per-uid by timestamp. 60/60 tests passing, build clean. Still unverified live (no Firebase access in this sandboxed environment) — needs a real two-device session. See decisions.md "Multiplayer Sync Bug Audit (S60)".

**Latest (S59)** — Time-boxed quick-wins review (no new features). Static review of `src/` for low-risk cleanup: no hover-only CSS (mobile Law 3 intact), no stray `console.log`/`debugger`, `Modal.jsx` confirmed a genuinely dead stub (zero imports). Found and fixed one real quick win: the 4 native `alert()` calls in `Settings.jsx`/`DevTools.jsx` (invite-link-not-ready, invalid-save, load-failed, devtools-copy) now dispatch the existing `toast` CustomEvent instead, matching the pattern already used elsewhere (CharSheet, LevelUp, Chat, engine.js). The 2 `confirm()` calls (new campaign, load save — both destructive) were deliberately left native, since a real yes/no modal needs `Modal.jsx` actually built out, which is a bigger lift than this pass's scope. 60/60 tests passing, build clean. Flagged but not started: inline NPC name linking (player-requests-v2.md — tap-to-source infra already exists via `sourceBus.js`, worth a real look next pass) and Gate 8's missing-XP click handler (already noted below as pending user confirmation).

**Latest (S58)** — Pass 1 of a multiplayer-improvement push: CI now deploys `database.rules.json` automatically (Priority #7, closed — `deploy.yml` gained a `firebase deploy --only database` step, so rules can't drift from the Console silently again). Added a manual presence toggle ("I'm here"/"I've left" in Settings → Who Am I?) instead of automatic `onDisconnect()` detection — deliberately, per a V1 lesson (automatic AFK handling solved a problem players already solve socially) and because mobile backgrounding makes connection-based presence unreliable. New `campaign.presence` field, synced like any other campaign field. Also added the first Firebase-mocking test precedent (`tests/sync.test.js`, simulates two devices against an in-memory fake RTDB through the real `joinCampaign()`/`setPresence()`/`mergeCampaign()` code paths) and a DevTools "Multiplayer" tab for eyeballing the presence roster with a fake guest entry, without needing a second phone. Bundles (publish/import/delete/replace/edit) intentionally deferred to a later pass — not started this session. See decisions.md "Multiplayer Presence + CI Database Deploy (S58)".

**Latest (S57)** — live two-device multiplayer retest confirmed the S56 `shareInvite()` fixes work: host/guest exports compared byte-for-byte identical (campaign state, all 24 narrative messages) except per-device `updatedAt`. The same test transcript surfaced a real bug (player messages weren't visually distinguishable in multiplayer chat — `playerName` was stored but never rendered), now fixed with a name label gated on party size > 1. Priority #2's audit continued: found and fixed one more instance of the recurring "healed at one ingestion point, not another" bug class, this time in the `system` store (`restoreQuickActions()` now heals against `DEFAULT_SYSTEM` instead of replacing wholesale); all other audit candidates traced safe. Priority #3 got a small, decision-compliant win: a contract-only "contested checks" instruction (NPC rolls itself, feeds result into a normal PC `roll_request` as the DC) — zero new code. Critical Hits / PC-attack-roll enforcement (Priority #1) then shipped same-session: `RollBar.jsx` already had unused attack-roll infrastructure, so the fix was a missing `contracts.js` instruction (route PC attacks through `roll_request: Attack|AC|PCName`) plus code-enforced HIT/MISS/CRITICAL HIT/CRITICAL MISS determination and damage rolling (doubled on crit) in `RollBar.jsx`/`engine.js` — closes the "told-not-enforced" gap per Law 2. NPC attacks against PCs remain AI-rolled/narrated, unchanged. See `decisions.md` and `session-log.md` for full session-by-session history (S48–S57).

---

## Priorities (user-set, deadline July 11)

1. **Continue SRD gap-analysis punch list (S52/S54/S56 follow-up)** — encumbrance/exhaustion, conditions+resistance, Death Saves, Concentration's 30 DC cap, CharSheet's manual HP override, **Critical Hits / PC attack rolls (done S57)**, and **Action Economy (done S67 — see decisions.md "Action Economy enforcement (S67)": quick-action buttons now disable once spent, Gate 2 prose scan scoped to the current actor)** are done. Remaining items from the same gap analysis, not yet started: Cover missing entirely, Short Rest missing Hit Dice healing surfacing. Known follow-up from the S57 attack-roll work: PCs with multiple distinct attacks always use `pc.attacks[0]` (no weapon/attack selection mechanism).
2. **Audit for more unguarded nested-field accesses** — done (S57): broad sweep across `src/ui/**/*.jsx`, one real gap found and fixed (`restoreQuickActions()` missing healing), all other candidates traced safe. See decisions.md "Priority #2 audit (S57)".
3. **Expand classifier coverage** — contested checks got a contract-only win (S57, see decisions.md). Combat attacks and saving throws are already covered by the existing `roll_request`/`RollBar.jsx` path (saving throws) or remain the same unbuilt gap as Critical Hits above (combat attacks — needs the new attack-roll mechanic, not classifier work).
4. **AI DC determination** — Phase 1 AI call for context-aware DCs (currently uses standard tiers)
5. **Scene transition gate** — hold scene changes for player confirmation (Gate 2 in enforcement spec)
6. ~~Rest buttons on CharSheet Vitals tab~~ — **already built**, not a gap. Verified S67 (user flagged this was mislisted): `CharSheet.jsx`'s `VitalsTab()` has working Short Rest / Long Rest buttons wired through a `rest-request` event (`Chat.jsx`) into the real `short_rest`/`long_rest` mechanics. What's still actually missing (folded into Priority #1's "Short Rest missing Hit Dice healing" line above): the Vitals tab shows a Hit Dice pip display but has no button to spend one — `short_rest` doesn't touch hit dice at all, and the `hit_dice_use` mechanic (which correctly fires a heal roll request) has no player-facing trigger, only AI/MechTest access.
7. **CI: deploy database rules** — done (S58). `deploy.yml` now runs `firebase deploy --only database` alongside the hosting deploy.
8. **Multiplayer Pass 2: bundles MVP** — publish/import/delete/replace/edit for shared content bundles (`data/bundles.js` is still a stub returning `{}`). Deferred from S58's Pass 1 (CI deploy + presence toggle + test aids, all done) — not yet started.

---

## Three-Phase Architecture (S48)

```
Player declares action
       ↓
  classifier.js detects skill check
       ↓
  RollBar shows (skill + DC) — player rolls
       ↓
  Code determines SUCCESS/FAILURE
       ↓
  AI narrates the predetermined outcome
```

Key files: `src/ai/classifier.js`, `src/ai/engine.js` (sendNarrative, resumeAfterRolls), `src/ui/play/RollBar.jsx`

---

## Stubs to Fill

| Stub | File | Purpose |
|------|------|---------|
| SessionReview | `manage/SessionReview.jsx` | Session archive/review UI |
| ContentImport | `setup/ContentImport.jsx` | Content import UI |
| SessionZero | `setup/SessionZero.jsx` | Campaign setup wizard |
| Modal | `shared/Modal.jsx` | Shared modal component |
| AppSimple | `AppSimple.jsx` | Child-friendly view |
| bundles.js | `data/bundles.js` | Shared content packs |
| migrate.js | `data/migrate.js` | State version migration |
| elevenlabs.js | `audio/elevenlabs.js` | ElevenLabs TTS |

---

## Not Yet Built

- Multiplayer identity system
- Push notifications (Web Push + FCM)
- Multi-device real-time sync verification
- Shared content bundles
- Visual tile map (combat phase 2)
- Web/markdown/JSON content parsers
- Episode/module tracking system
- Pre-built class progression downloads

---

## Known Issues

- Classifier DCs are standard tiers (10/13/15) — not context-aware yet
- Classifier doesn't handle combat attacks or saving throws (those go through existing flow)
- Charmed, Deafened, and part of Grappled have no roll-time enforcement (cosmetic only) — no data exists to determine which checks "require hearing/sight" or who a PC's grappler is; see decisions.md "Rules Enforcement (S52)"
- This sandboxed environment can't reach Firebase, so code fixes are normally verified via `npm test`/`npm run build` only. Still unverified live: S56's partial-message healing fixes, S56's mechanics-pipeline fixes, S57's `restoreQuickActions()`/chat-name-label fixes, S57's PC attack-roll/Critical Hits enforcement (needs a live combat session to confirm the AI reliably emits `roll_request: Attack|...` and the HIT/MISS/damage text reads well), S62's presence badge (two-device session — confirm count updates off the other player's toggle), S62's join auto-retry (confirm 3s retry fires when host write is still propagating), S62's character union merge (tab-kill test — add a character, tab out immediately, reload, confirm it survived), and S67's action-economy button-disable (needs a live combat turn to confirm disabled quick-action buttons look/feel right, not just that the logic is correct). S60's three sync-bug fixes and S61's reconnect-triggered `flushPending()` fix are confirmed live-working as of S62's production retest.
- `dbWrite()` still never surfaces a write failure to its caller — `shareInvite()` and any other `await dbWrite(...)` site can't distinguish "synced" from "queued, will retry on reconnect." S61 fixed the retry timing gap but didn't add a failure signal; a host who shares a link while genuinely offline (not just a transient blip) still sees a normal-looking "Link copied!" with no indication the guest will hit "Campaign not found" until reconnect. Not pursued — flagged as a possible follow-up, not yet asked about.
- NPC ally presence: no indicator in ContextBanner/presence roster to distinguish "Fenwick (NPC)" from "Nyx (PC)" — the `npcName` is stored but not yet surfaced in the play UI presence display
- ✅ Gate 8 (`missing_xp`) click handler — now tappable (S65)
- ✅ `roll-request` CustomEvent orphaned in CharDrawer/CharSheet — now routes to `prefill-input` (S65)
- ✅ Combat tracker auto-closing — removed auto-minimize entirely (S66)
- ✅ Undo button overlap — moved into input row as icon button (S66)
- ✅ Dice tab unreachable in combat — d20 always opens QuickActions now (S66)
- ✅ Combat card no dismiss button — `−` added to TurnPrompt header (S66)
- ✅ GuestCharPick NPC ally path — three-path flow shipped (S66)
- ✅ Action economy code-level enforcement — `TurnPrompt` quick-action buttons now disable once their econ slot is spent; Gate 2 prose scan scoped to the current actor (S67)

---

## Reference Docs

| File | When to Read |
|------|-------------|
| `ui-specs-v2.md` | Building/modifying CharSheet, Cargo, Treasury, Journal, Combat UI |
| `chat-system-spec-v2.md` | Working on chat, streaming, message types, overlays |
| `enforcement-spec.md` | Working on mechanics gates (9 gates) |
| `decisions.md` | Before making a design choice — check if it's already decided |
| `ai-failures.md` | Adding/modifying Law 2 enforcement |
| `prime-directive.md` | Grounding a decision in project vision |
| `player-requests-v2.md` | Checking unbuilt player requests |
