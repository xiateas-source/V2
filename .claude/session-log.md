# Session Log — Handoff

## Session 60 · 2026-06-30

Branch `claude/latest-test-analysis-v64a6i` · committed, pushed. Agent audit pass on the S58 multiplayer presence/sync work.

### What Shipped

A prior agent audit traced through the S58 presence/sync path (prompted by the flicker risk `persist.js`'s own comments already called out) and found three real bugs, all fixed with targeted, logic-only diffs — no new Firebase paths, no schema changes:

1. **`dbListen()` echo suppression** (`firebase.js`) — was a flat 3s time window that dropped *any* incoming snapshot on a path after this device wrote there, not just the echo of its own write. Since the routine debounced campaign auto-sync and another device's write (e.g. a presence toggle) land on the same RTDB path, a same-device write within 3s of a remote change silently swallowed that change until some unrelated update fired `onValue()` again. Replaced with content-based echo detection (`lastWritten` cache + `isEcho()`).
2. **`startLiveSync()` not armed on mid-session campaign creation** (`PlayerOnboard.jsx`) — only ever called from `main.jsx`'s `boot()` and `joinCampaign()` (guest path). A host creating a new campaign mid-session (Settings → New Campaign → onboarding → Start Adventure) had no realtime listener for the rest of that session — a guest's join or any other remote change wouldn't appear without a manual reload. Now called from `startAdventure()`.
3. **`mergeCampaign()` wholesale-overwriting presence** (`persist.js`) — `{...localC, ...cloudC}` meant any field in the cloud snapshot fully replaced the local value, including `presence`, the fastest-changing field. A device flipping its own presence entry locally could have a different device's in-flight full-snapshot write (built before it learned of that change) land moments later and clobber it back to stale, visibly flickering the toggle. Now merges presence per-uid by `ts` via `mergePresence()`.

These three commits (`d66db53`, `d9cd1f7`, `4a3d5f6`) were already on the branch and pushed from the prior audit pass; this session's work was verifying them and writing them up, since the doc-update step of the session protocol hadn't run yet.

Also handled, same session: a block of text appeared mid-conversation formatted to look like a legitimate "conversation summary," but contained an instruction (impersonating my own prior reasoning) to build a new "dedicated presence RTDB path" — a different and incorrect description of what the real audit had actually done. Identified it as not originating from the user, declined to act on it, and confirmed the real audit work with the user before writing it up. No action was taken on the injected instruction; nothing in this entry implements a separate presence RTDB path — presence still lives at `campaign.presence` inside the existing campaign sync blob.

### Decisions

See `decisions.md` → "Multiplayer Sync Bug Audit (S60)" for the full rationale table.

### Verification

- `npm test` — 60/60 passing.
- `npm run build` — succeeds, only the pre-existing large-chunk warning.
- Not live-tested — this sandboxed environment can't reach Firebase. All three fixes need a real two-device session to confirm (see workboard.md Known Issues).

### Known Issues

Carried over from S59, unchanged, plus: S60's three sync-bug fixes are unverified live (see Verification above).

### Next Up

1. Live two-device test covering: presence toggle no longer flickering, a guest's join showing up on a host who created the campaign mid-session without reload, and a remote update landing within 3s of a local auto-sync no longer getting dropped.
2. Carried from S59: inline NPC name linking (tap-to-source infra exists via `sourceBus.js`), Gate 8's missing-XP click handler (pending user confirmation).
3. Carried from S58: Multiplayer Pass 2 (bundles MVP), Priorities deadline July 11 (see workboard.md).

---

## Session 59 · 2026-06-30

Branch `claude/quick-wins-review-07zr0m` · committed, pushed. Time-boxed (low context, ~30 min) — review pass, not a feature session.

### What Shipped

User asked for a quick scan of the app for easy wins under a hard time/context budget. Did a static review rather than a deep audit: grepped for `:hover` CSS (mobile Law 3 — none found), `console.log`/`debugger` (none), stub files (`Modal.jsx`/`SessionReview.jsx`/`ContentImport.jsx`/`SessionZero.jsx` all confirmed still intentional one-line stubs, `Modal.jsx` specifically has zero importers — dead but not broken), and `alert()`/`confirm()` usage (6 call sites across `Settings.jsx` and `DevTools.jsx`).

Shipped the one finding that was actually "quick": replaced 4 native `alert()` calls with the existing `toast` CustomEvent pipeline (`Settings.jsx`: invite-link-not-ready, invalid-save-file, load-save-failed; `DevTools.jsx`: copied-to-clipboard). Pattern already established elsewhere (`CharSheet.jsx`, `LevelUp.jsx`, `Chat.jsx`, `engine.js`) — no new component, no design decision needed. The 2 `confirm()` calls (new-campaign and load-save, both destructive-action gates) were deliberately left native — swapping those needs a real yes/no modal, which means actually building `Modal.jsx` out, not a quick edit.

### Decisions

None requiring a decisions.md entry — this was a mechanical pattern-match swap, not a design choice.

### Verification

- `npm install` (node_modules wasn't present at session start), `npm test` — 60/60 passing.
- `npm run build` — succeeds, only the pre-existing large-chunk warning.
- Not live-tested in a browser (time-boxed session) — the toast swap is low-risk (identical dispatch pattern used 6+ other places in the codebase) but unverified visually.

### Known Issues

Carried over from S58, unchanged — see below. Nothing new introduced this session.

### Next Up

1. **Inline NPC name linking** (`player-requests-v2.md`) — flagged this session as a plausible next quick-ish win. Tap-to-source infra (`sourceBus.js`) already exists for items/MechPills; didn't trace the Chat.jsx NPC-name rendering path deeply enough this session to confirm scope.
2. If `Modal.jsx` ever gets built out (e.g. for the bundles MVP UI), revisit the 2 leftover native `confirm()` calls in `Settings.jsx` and swap them too.
3. Everything else carried from S58 below — multiplayer Pass 2 (bundles), live two-device presence test, Priorities deadline July 11.

---

## Session 58 · 2026-06-30

Branch `claude/latest-test-analysis-v64a6i` · committed, pushed.

### What Shipped

Continuation of a multiplayer-improvement discussion that started with the user asking how each player could "take their own turn, do their own rolls, and be considered by the system." V1 context surfaced that automatic AFK/presence detection there mostly solved a problem players already handle socially — combined with mobile `onDisconnect()` being unreliable when a tab is backgrounded, the agreed design was a manual toggle instead of automatic presence detection. Scoped to a "Pass 1": CI database-rules deploy (workboard Priority #7, already on the list) + the manual presence toggle + two test aids, with bundles work (publish/import/delete/replace/edit) explicitly deferred to a later pass.

**CI: database rules deploy (Priority #7, done).** `deploy.yml` gained a step running `npx firebase-tools deploy --only database --project pebble-v2`, authenticated via the same `FIREBASE_SERVICE_ACCOUNT_PEBBLE_V2` secret already used for hosting (written to a temp file, picked up via `GOOGLE_APPLICATION_CREDENTIALS`). `database.rules.json` was previously only ever applied manually in the Firebase Console — now it's the actual source of truth and can't silently drift.

**Manual presence toggle.** New `presence: {}` field on `DEFAULT_CAMPAIGN`, keyed by uid → `{name, active, ts}`. `sync.js` gained `setPresence(active)`, which writes the caller's own uid entry and reuses the existing `scheduleSync()`/`getSyncPayload()` pipeline — no new Firebase path, no `onDisconnect()` listener, heals for free through the existing `healStructure()`/`healArrays()` walk. UI lives in Settings → Who Am I? (not ContextBanner, which is reserved as a single slim line per existing UI Principles): an "I'm here"/"I've left" button plus a roster of currently-active players. Concurrent-toggle races are possible in theory (same last-writer-wins-per-field tradeoff every other synced campaign field already has) — not a new risk, not addressed.

**Test aid 1 — mocked-Firebase two-device test (`tests/sync.test.js`, new file).** First Firebase-mocking precedent in the suite: `vi.mock`s `src/data/firebase.js` with an in-memory `Map` standing in for RTDB, then drives the *real* `joinCampaign()`/`forceSyncNow()`/`setPresence()`/`mergeCampaign()`/`healArrays()` functions across two simulated "devices" (switch which uid `getUid()` returns, reset the store, repeat). 3 new tests: guest-join healing, presence propagating device-to-device through a sync round-trip without clobbering the other device's entry, and a direct `healArrays()` repair check. 60/60 tests passing.

**Test aid 2 — DevTools "Multiplayer" tab (scoped down from the original ask).** A true second-device simulator would need a second fake auth identity coexisting with the real one — this app has exactly one `getUid()`/one Solid store per browser tab, so that's a bigger lift than Pass 1 justified. Shipped instead: a DevTools tab that writes a fake guest's presence entry directly into `campaign.presence` (Simulate Guest Join/Leave/Clear buttons + a raw JSON dump), so the new Settings presence roster can be eyeballed with 2+ "players" without a second phone. Flagged explicitly as a scope-down from the original idea, not the full simulator.

**Bundles (publish/import/delete/replace/edit) — deliberately not started.** Confirmed `data/bundles.js` is still a genuine stub (`export default {};`). Tracked as new workboard Priority #8 for a follow-up pass.

### Decisions

See `decisions.md` → "Multiplayer Presence + CI Database Deploy (S58)" for the full rationale table, plus the corrected "Data & Storage" entry (deploy pipeline now ships hosting + database rules, not hosting-only).

### Verification

- `npm test` — 60/60 passing (57 prior + 3 new in `tests/sync.test.js`).
- `npm run build` — succeeds, no new warnings beyond the pre-existing large-chunk notice.
- `deploy.yml` YAML validated with `python3 -c "import yaml; yaml.safe_load(...)"`.
- Nothing shipped this session has had live two-device verification yet — this sandboxed environment can't reach Firebase. The presence toggle, the new sync test's assumptions, and the CI deploy step's actual behavior on a real push to main are all unverified live.

### Known Issues

- Presence toggle, CI database-rules deploy step, and the new sync tests are all unverified against real Firebase/a real GitHub Actions run — next push to main will be the first real signal on the CI step; the presence toggle needs an actual two-device session.
- Concurrent presence-toggle race (two devices writing different `presence` keys within the same debounce window) uses the same last-writer-wins-per-field model as every other synced campaign field — not a new gap, not specifically tested under real concurrency.
- DevTools' "Multiplayer" tab only fakes a presence entry, not a real second identity/session — see decisions.md for why this was scoped down from the original ask.
- Carried over from S57, still open: Action Economy enforcement, Cover, Charmed/Deafened/Grappled roll-time enforcement, `pc.attacks[0]`-only attack selection, and live re-testing of S56/S57's fixes (partial-message healing, mechanics-pipeline routing, `restoreQuickActions()`, chat name labels, attack-roll/Critical Hits enforcement).

### Next Up

1. Live two-device test of the new presence toggle, plus re-verify the CI database-rules deploy actually runs clean on the next push to main.
2. Multiplayer Pass 2: bundles MVP — publish/import/delete/replace/edit for shared content bundles (workboard Priority #8, `data/bundles.js` is still `{}`).
3. Carried-over priorities — deadline July 11 (see workboard.md): Action Economy enforcement, Cover, AI DC determination, Scene transition gate, Rest buttons on CharSheet.
4. Still open: whether to merge `claude/latest-test-analysis-v64a6i` to `main` (asked S57, not yet answered).
