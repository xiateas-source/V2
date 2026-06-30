# Session Log — Handoff

## Session 57 · 2026-06-30

Branch `claude/latest-test-analysis-v64a6i` · committed, pushed.

### What Shipped

User said "do two and three while i test," authorizing autonomous work on workboard Priorities #2 (unguarded nested-field audit) and #3 (classifier coverage expansion) while live-testing the S56 invite-link fixes in parallel.

**Priority #2 — audit, completed.** Broad grep for unguarded `.field.(map|filter|find|some|every|forEach|reduce|length)(` across `src/ui/**/*.jsx`, triaged candidate by candidate against each field's default shape and ingestion path. Found and fixed one real gap: `restoreQuickActions()` (`data/keys.js`) wrote a restored `localStorage` config straight into `store.system.settings.quickActions` with only a truthy check — no shape healing, unlike every `campaign`-store ingestion point (which all go through `healArrays()`). A config missing `active`/`custom` would crash `QuickActions.jsx`. Fixed by merging the restored config over `DEFAULT_SYSTEM.settings.quickActions` and coercing `active`/`custom` back to arrays. All other candidates (Rewind.jsx, Chat.jsx, TurnPrompt.jsx, SituationBar.jsx, Combat.jsx, QuickActions.jsx, Journal.jsx, Cargo.jsx, CharCreate.jsx, CampaignConfig.jsx, DevTools.jsx, LevelUp.jsx) traced safe — see decisions.md "Priority #2 audit (S57)" for the full list and reasoning.

**Priority #3 — scoped small win.** Investigated "expand classifier coverage" in depth: confirmed the documented "classifier skips combat" decision is deliberate (decisions.md, Game Loop S48) and left it alone. Saving throws already resolve through the existing `roll_request`/`RollBar.jsx` path — not a gap. The one real gap (PC attack rolls / critical-hit doubling) needs a new structured attack-roll mechanic and an NPC-stats data model expansion (NPCs currently have no ability scores or attack/save bonuses in `combatState.initiative`) — architecturally significant, so per CLAUDE.md Standing Permissions it was **not** built without checking in first; it's the same unbuilt item as Priority #1's Critical Hits. Instead shipped the safe, prompt-only piece: a "CONTESTED CHECKS" section in `contracts.js` instructing the AI to narrate the NPC's side of an opposed check itself and feed that roll as the `dc` of a normal PC `roll_request` — gets code-resolved contested checks (grapple, opposed Stealth, etc.) with zero new code.

**Live test results arrived mid-session** — user sent two campaign exports (host + guest) from a real two-device invite-link test. Compared them directly: `campaign.id`, full character state, and all 24 narrative messages were byte-identical except the expected per-device `updatedAt` timestamp. **The S56 `shareInvite()` fix is confirmed working live** — the "Campaign not found" investigation is closed.

The same test transcript surfaced a new, real bug: a player typed "I'm not at all distinct in chat from [the other player]" mid-game. Traced it — `messages.js` has always set `playerName` on every player message, but `Chat.jsx`'s renderer never displayed it (`grep playerName Chat.jsx` was empty). Fixed: added a name label above a player message's bubble, gated on `msg.type === 'player' && msg.playerName && store.campaign.characters.length > 1`. Gated on party size rather than `multiplay.role` because the host's own `role` field stays `'solo'` forever even with guests connected — only the joining device ever flips to `'guest'`, so it's not a reliable "multiple humans" signal. Party-size gating also covers the legitimate single-device multi-PC mode (`playerIdentity.mode: 'multi'`) and shows nothing for the common solo single-PC case.

### Decisions

See `decisions.md` → "Priority #2 audit (S57)", "Player name not shown in multiplayer chat (found via live S57 test transcript)", "Priority #3 small win (S57) — contested-check contract guidance", and the live-retest-result note appended under "Invite-link 'Campaign not found' investigation".

### Verification

- `npm test` — 57/57 passing.
- `npm run build` — succeeds, no new warnings.
- The invite-link fix specifically got real live two-device verification this session (see above) — the first S55-onward fix to get that. Everything else shipped this session (`restoreQuickActions()` healing, chat name label, contested-check contract text) is verified via `npm test`/`npm run build` only, not live play yet.

### Known Issues

- Critical Hits / PC attack-roll enforcement still unbuilt — needs explicit user scoping-and-confirmation before starting (new mechanic + NPC data model expansion, not a small patch). Same item as Priority #1.
- Cover, Action Economy enforcement, Charmed/Deafened/Grappled roll-time enforcement — feature-sized SRD gaps, tracked in workboard.md, not started.
- S56's partial-message healing fixes, S56's mechanics-pipeline routing fixes (DC cap, CharSheet HP override), and this session's `restoreQuickActions()`/chat-name-label fixes still don't have their own live re-test — only the invite-link fix got one this session.

### Next Up

1. Live-test the still-unverified S56/S57 fixes: reload/background mid-stream (partial-message healing), CharSheet manual HP buttons with temp HP/concentration active, a concentration save near DC 30, multi-PC chat to confirm the new name labels render correctly, and the Quick Actions panel after a localStorage restore.
2. If the user wants to scope it, Critical Hits / PC attack rolls is the next big architectural item — needs a confirmation conversation per CLAUDE.md before any code starts (new mechanic, NPC stats data model).
3. Carried-over priorities — deadline July 11 (see Priorities in workboard.md): AI DC determination, Scene transition gate, Rest buttons on CharSheet, CI database-rules deploy.

## Session 56 · 2026-06-30

Branch `claude/latest-test-analysis-v64a6i` · committed, pushed.

### What Shipped

User uploaded a fresh gameplay test transcript (`princesoftheapocalypsech1riseofelementalevil20260630_2.json`) and asked for analysis against a standard 4-question incident rubric (what went wrong / root cause category / did an existing fix already cover this and why didn't it / what change prevents recurrence). Found 3 incidents:

1. **An early crash matching the exact S55 bug** — timing-confirmed (via commit timestamps vs. event timestamps) to have occurred *before* the S55 fix landed in the same continuous test session. User confirmed they never reloaded the browser between the fix deploying and continuing to test, so the session spans both pre- and post-fix states. No action needed — already fixed.
2. **A stuck `partial:true` empty DM message recurring ~40 minutes *after* the S55 follow-up's `finalizeStuckPartial()` fix landed.** Root cause: `finalizeStuckPartial()` only runs inside a JS `catch` block during live execution (`sendMsg()`/`resumeAfterRolls()` in `engine.js`) — a reload or backgrounded tab that interrupts a stream mid-flight throws no JS exception at all, so neither the success path nor the catch path ever fires, leaving the placeholder `partial:true` in the saved snapshot permanently. **Fixed** — user explicitly authorized this one. Added `healPartialMessages()` to `persist.js`, wired into the existing `healArrays()` choke point already shared by `restoreSession()`, `mergeCampaign()`, and `joinCampaign()` (`sync.js`), so it heals on solo restore, cloud merge, and multiplayer join alike — directly relevant to the user's stated main concern (multiplayer experience) without a separate investigation. Only the trailing array entry is ever checked, since exactly one stream runs at a time. 4 new tests pin the contract (57 total, up from 53).
3. **XP not awarded after combat + player got generic textbook answers when asking why** — Gate 8 (`missing_xp`) correctly flags the omission, but the flag is purely informational (`Chat.jsx` renders it as static text with no action), and `interceptAskDm()` doesn't consult open gate flags when answering an OOC question about it. `enforcement-spec.md`'s "Gate 7: XP Audit" design specced a player-facing "Request XP calculation?" prompt that was never built — only the detection half shipped. **Not implemented** — user did not explicitly confirm this one; logged to workboard Known Issues for a future session.

After fixing #2, ran a quick scoped audit (user-approved) on the standing hypothesis that this bug shape — state healed at one restore boundary but not another — might have a fourth, undiscovered instance, since it had already recurred 3 times across S55 and this session. It did: **`Settings.jsx`'s "Load save" file import (`handleImportFile()`) wrote an uploaded JSON export's `data.campaign` straight into the store with zero healing** — no `healArrays()` call at all, unlike `restoreSession()`, `mergeCampaign()`, and `joinCampaign()`. Since this is the same export file format users upload for bug-report analysis (this very session started with one), loading an old or hand-edited export was exposed to the same missing-array crash and stuck-partial-message bug fixed earlier. Fixed with the same one-line `healArrays()` wrap `joinCampaign()` uses. No dedicated test added — no UI-component test infra exists in this repo, and the fix routes through the already-pinned `healArrays()` contract, so the existing 57 tests cover the underlying behavior.

**Both this session's commits were merged to `main` and pushed (`c891cc2`, `6a6c7e0`)** per the user's confirmed "merge to main every session end" workflow — verified `npm test`/`npm run build` clean on `main` before each push.

### Known Issues triage (same session, continued)

User asked to "eliminate known issues to clear space on our context files" — confirmed scope via two questions: fix what's quickly fixable in code and document the rest, and compress workboard.md's Current State section. Triaged all 9 Known Issues items; shipped 3 quick fixes, left the rest tracked (feature-sized or already-flagged-unconfirmed):

1. **Concentration save DC capped at 30** — `applyDamage()` in `mechanics.js` computed `Math.max(10, Math.floor(rawDamage/2))` with no upper bound in two branches (temp-HP and no-temp-HP); 2024 SRD caps it at 30. Wrapped both in `Math.min(30, ...)`.
2. **`joinCampaign()` writes the `players/{uid}/joined` pointer synchronously** — previously only written via the 3s-debounced `scheduleSync()`, so a guest reloading within that window had no cloud pointer to recover their guest role from (relied solely on the S55 local-snapshot fallback). Added a synchronous `dbWrite()` call right after the store is set, alongside the existing debounced write.
3. **CharSheet's manual HP override now routes through the mechanics pipeline** — `adjustHP()` (the +/-1/+/-5/custom buttons) and `ManualOverride()`'s hp field both used to write `setStore(...'hp'...)` directly, bypassing `applyDamage()`'s temp-HP absorption, concentration-save trigger, and Death Saves/massive-damage enforcement entirely. Both now build an `hp: Name=value` mechanic and dispatch it through `validateMechanics`/`applyMechanics` — same pattern `castSpell()` already uses for `slot_use`. This isn't "trusting AI math" (a point the user pushed back on and which is now documented in decisions.md): `applyDamage()` is pure code, not AI-computed; the player still types the target HP, it just now flows through the same rules engine the AI's `damage:`/`hp:` mechanics already use.

Left tracked, not implemented (feature-sized or needs further confirmation): Action Economy enforcement, classifier DC context-awareness, classifier combat/save coverage, Critical Hits (needs a new attack-roll mechanic), Cover (missing entirely), Charmed/Deafened/Grappled (blocked on missing data model), Gate 8/XP player-facing prompt (still not user-confirmed).

Also compressed workboard.md's "Current State" section from ~10 paragraph-long per-session writeups (S48-S56) down to a short summary + this session's highlights, and trimmed/reworded the Known Issues list to drop the 3 now-fixed items and consolidate the "verified via tests only, not live" caveat into one line covering all unverified rounds (S55 onward).

### Invite-link "Campaign not found" bug (same session, continued)

User uploaded a fresh test campaign export ("Vesper's Adventure") and reported: invited a second player, guest got "Campaign not found." Traced `joinCampaign()` → `dbRead()` → `scheduleSync()`/`startLiveSync()`/`flushPending()` end to end; user checked the Firebase Console RTDB Rules tab directly and confirmed the deployed rules match `database.rules.json` exactly (`auth != null` on `campaigns`/`players`) — ruled out rules drift, which had been the leading suspect given workboard Priority #7 already flagged rules as manually-managed/never-auto-deployed.

With rules ruled out, found and fixed two real silent-failure gaps in `shareInvite()` (`Settings.jsx`):
1. It used to `return` with zero feedback if `buildShareId()` came back null (no uid yet, e.g. anonymous auth still racing its 5s timeout) — the host could tap "Invite Players" and get nothing, no error, easy to miss and then send a stale link from earlier testing instead. Now shows an `alert()`.
2. It built the link from whatever the last 3s-debounced background sync happened to push, with no guarantee the host's current state had reached Firebase yet. Now calls `forceSyncNow()` immediately before building the link.

Root cause not reproducible in this sandboxed environment (no live Firebase/two-device access) — both fixes close verified gaps that match the reported symptom, but need a live two-device retest to confirm full resolution.

### Decisions

See `decisions.md` → "Restore-time partial-message healing (post-S55, found via test transcript analysis)", "Known Issues triage (S56, same session as restore-time healing)", and "Invite-link 'Campaign not found' investigation (post-S56)".

### Verification

- `npm test` — 57/57 passing (no new tests added for this round — all three fixes reuse the already-tested `applyDamage()`/`healArrays()`/mechanics-dispatch contracts rather than adding new surface area).
- `npm run build` — succeeds, no new warnings beyond the pre-existing large-chunk warning.
- No live verification yet — same sandbox limitation as the rest of this session (no Firebase reachability, and CharSheet's HP buttons need a live UI to click). Code-traced to the exact mechanism in each case, not live-confirmed.

### Known Issues

- Gate 8/XP player-facing prompt (Incident 3 from earlier this session) still not implemented — needs explicit user confirmation before starting, see workboard.md Known Issues.
- Action Economy, classifier DC/coverage expansion, Critical Hits, Cover, and Charmed/Deafened/Grappled — feature-sized SRD gaps, tracked in workboard.md Priorities #1 and Known Issues, not started.
- No live two-device or live-UI re-test yet of any S55-onward fix (multiplayer join, partial-message healing, save-import healing, or this round's DC cap/join-pointer/CharSheet-override fixes) — same standing sandbox limitation, consolidated into one workboard.md line this session.

### Next Up

1. Live-test this session's fixes on a real device/two devices: reload/background mid-stream (partial-message healing), join via invite link and reload within 3s (join-pointer fix), take damage with temp HP/concentration active via CharSheet's manual HP buttons (mechanics-pipeline routing), a hit that would exceed DC 30 on a concentration save, and a fresh invite-link share/join end to end (silent-failure + force-sync fixes).
2. If the user confirms, build the Gate 8/XP player-facing prompt — the missing half of `enforcement-spec.md`'s "Gate 7: XP Audit" design.
3. Carried-over priorities from S50-S56 — still open, deadline July 11 (see Priorities in workboard.md).

## Session 55 · 2026-06-30

Branch `claude/workboard-priorities-1ykzmb` · committed, pushed.

### What Shipped

User reported a live multiplayer bug after a real two-device play session, with an exported campaign JSON as evidence (guest device, "Kir" controlling "Melody"): joining via invite link hung on "Joining…" indefinitely and needed a refresh; after the refresh, Quick Pick character creation was usable but "cut off at the bottom" so the player couldn't reach the AI builder; once in the campaign, sending "Hi" crashed with `Cannot read properties of undefined (reading 'length')`; and the host ("Finch") never saw "Melody" populate into his game at all.

Root-caused all four to the same family of bug — state-restore code paths that skip the healing/persistence machinery other paths already use:

1. **The send-message crash** — `joinCampaign()` in `sync.js` wrote Firebase's campaign data straight into the store with `setStore('campaign', { ...DEFAULT_CAMPAIGN, ...data, id: campaignId })`, with no array-healing step. `restoreSession()` and `mergeCampaign()` (used by the live-sync listener) both already call `healArrays()` before committing Firebase data — `joinCampaign()` was the one path that didn't. Firebase RTDB drops empty arrays on write, so the host's character (which had `conditions: []`) came back from `dbRead()` with `conditions` missing entirely. The guest's very first message ran `genLedger()` in `prompt.js`, which does `pc.conditions.length` unconditionally for every PC — crash, exact message match. Fixed by exporting `healArrays` from `persist.js` (was module-private) and wrapping `joinCampaign()`'s store write in it.
2. **Host never sees guest join** — `system.multiplay` (`{role, hostUid}`) was never part of `persist.js`'s local snapshot/restore cycle at all. Every page reload silently reset a guest's role back to the default `{role:'solo', hostUid:''}` regardless of whether they'd successfully joined, unless the Firebase-pointer fallback (`restoreGuestSession()`, which depends on a 3s-debounced write) happened to win the race. Once reset to `solo`, `getCampaignPath()` in `sync.js` routes all of that device's writes to its own orphaned uid path instead of the host's — explaining why Finch's export never gained Melody. Fixed: `multiplay` added to `snapshot()`/`restoreSession()`, restored only when `restoreGuestSession()` (which runs first at boot) hasn't already established guest mode, so the more-authoritative cloud pointer wins when both are available.
3. **The "Joining…" hang** — `dbRead()` had no timeout; `get()` can hang indefinitely with no network/unreachable RTDB, and `joinCampaign()`'s `await dbRead(...)` had nothing to make it ever resolve or reject. Added a 10s `Promise.race` timeout, mirroring the existing 5s pattern already used in `initFirebase()`'s auth race.
4. **Character creation cut off at the bottom** — `html`/`body`/`#app` used a fixed `height: 100%` (effectively `100vh`), which doesn't shrink when the on-screen keyboard opens on mobile, leaving content below the fold (e.g. CharCreate's "Talk to AI" submit button) unreachable. Switched to `100dvh` with `100%` as a fallback for unsupported browsers.
5. **4 new unit tests** (49 total, up from 45) pin `healArrays()`'s contract directly: missing `conditions` array restored, missing `deathSaves` object restored, fully-populated characters left untouched, top-level campaign arrays (quests/npcs) healed — so `joinCampaign()` can't regress to skipping the heal step again.

### Follow-up (same session): live test found the first fix incomplete

The user immediately live-tested the fix above on two real devices and reported back: Finch's (the *host's*) game was now also crashing with the identical `Cannot read properties of undefined (reading 'length')` error, and "half the last messages from the DM have been cut off." Both needed real fixes, not just retesting:

6. **Host-side crash, second instance of the same bug class** — `healArrays()` itself had a structural gap: its top-level healing loop only checked `Array.isArray(defVal)` on direct `DEFAULT_CAMPAIGN` keys, with one hand-coded special case for `combatState`. `inventory` (`{carried:{}, wagon:[], hoard:[]}`) and `wagonState` (`{animals:[], maxWeight:0}`) are *objects*, not arrays, at the top level — so the loop skipped them entirely, in all three call sites (`restoreSession()`, `mergeCampaign()`, `joinCampaign()`). `genLedger()` in `prompt.js` reads `c.inventory.wagon.length` unconditionally on every message from any player, host included. Once Finch's own Firebase record lost that field (via his own normal live-sync round-trip, independent of Melody's join bug), every message he sent crashed too — same error string, different field, same root cause. Fixed by replacing `healArrays()`'s flat/special-cased implementation with a recursive `healStructure(value, defaults)` helper that walks the *entire* `DEFAULT_CAMPAIGN`/`DEFAULT_CHARACTER` shape and heals any array/object field at any nesting depth, not just the ones someone remembered to hand-code. This also generalizes the old `combatState.actionsUsed` wholesale-replace into a more precise per-key heal.
7. **"DM messages cut off"** — traced to a separate gap in `engine.js`: `sendNarrative()`/`sendOOC()` stream into a message created with `partial: true`, finalizing it (`partial: false`) only after the stream completes successfully. The `AbortError` catch branch in `sendMsg()` already cleared this flag on a user-initiated stop, but no other catch path did — so any *other* stream failure (network drop, provider error, or the crash above happening to interrupt an in-flight stream) left that placeholder permanently stuck at `partial: true` with only the text that had streamed in so far, rendering as a message cut off mid-sentence with no way to recover. Added a `finalizeStuckPartial()` helper, called from every non-abort catch block in `sendMsg()`/`resumeAfterRolls()`, covering both the narrative and OOC logs.
8. **5 more unit tests** (53 total, up from 49): nested `inventory.wagon`/`hoard`/`carried` healed when missing, nested `wagonState.animals` healed when missing, populated `inventory`/`wagonState` left untouched, `combatState.actionsUsed` healed key-by-key instead of wholesale-replaced.

### Decisions

See `decisions.md` → "Multiplayer Join Bug Fix (S55)" and "Follow-up (S55, same session)".

### Verification

- `npm test` — 53/53 passing.
- `npm run build` — succeeds, no new warnings beyond the pre-existing large-chunk warning.
- No live two-device verification of *this* follow-up round yet — the sandboxed environment can't reach Firebase (same gap noted in S53/S54 session logs). The first S55 round was confirmed incomplete by exactly this kind of live test, so treat this round the same way: confident in the code-level root cause (traced directly to the exact error string and the exact line `prompt.js:83`), but not claiming full closure without another live two-device pass. If the user can check, a host party that currently has any wagon/cargo items would correlate with this root cause.

### Known Issues

- `players/{uid}/joined` (the pointer `restoreGuestSession()` reads on boot) is still only written via the 3s-debounced `scheduleSync()`, not synchronously inside `joinCampaign()`. A guest reloading within ~3s of joining still depends on the new local-snapshot fallback (item 2 above) rather than the cloud pointer — not a confirmed live bug, but the race isn't fully closed, just covered by a second layer.
- The S53 boot-timeout gap (`initData()`/`flushPending()` can hang boot if Firebase is unreachable) is still unaddressed — different code path than this session's fixes, out of scope.
- Carried over from S52/S54: Critical Hits told-not-enforced (scoped, needs a new attack-roll mechanic), Action Economy heuristic-only, Cover missing, Short Rest Hit Dice surfacing, Concentration's 30 DC cap. CharSheet's manual HP override still bypasses the mechanics pipeline.

### Next Up

1. Live two-device re-test of both rounds of S55 fixes (join via link, send messages from both host and guest, confirm no crash and no cut-off DM text) — this is now the second round of "code-traced but not live-confirmed," so treat live verification as the priority before anything else.
2. Consider writing the `players/{uid}/joined` pointer synchronously inside `joinCampaign()` instead of waiting for the 3s debounce, to close the remaining race noted above.
3. Critical Hits / Action Economy / Cover / Short Rest / Concentration — remaining S52 punch list items.
4. Carried-over priorities from S50/S51/S52/S53/S54 — still open, deadline July 11 (see Priorities in workboard.md).

---

## Session 54 · 2026-06-30

Branch `claude/workboard-priorities-1ykzmb` · committed, pushed.

### What Shipped

User asked what's next on the workboard, then asked to "hit what impacts player experience most." Picked Death Saves from the S52 punch list over Critical Hits: investigated Critical Hits first and found it's not a quick fix — PC attacks are fully AI-narrated (the classifier doesn't intercept combat attacks/saving throws, per existing Known Issues), so enforcing crit-doubling in code would require a new structured attack-roll mechanic before any damage-doubling logic could run, not just a `mechanics.js` change. Death Saves was self-contained and used data structures that already existed.

1. **Death save auto-fail on damage at 0 HP** — previously, a PC already at 0 HP taking more damage relied entirely on the AI remembering to emit a `death_save: Name|failure` mechanic on its own initiative. Now `applyDamage()` in `mechanics.js` checks this on every `damage:`/`hp:` mechanic that reduces a PC's HP: if the PC was already at 0 before this hit, it's an automatic failed death save, no AI cooperation required.
2. **Massive damage instant death** — a single hit's damage >= the PC's hp max is now instant death, computed two ways: (a) hit drops PC from >0 to 0 with leftover >= hp max (overkill case), or (b) PC already at 0 takes a hit >= hp max (nothing to absorb it, so the whole hit counts). Previously narration-only.
3. **Refactored `killPC()` as a shared helper** — both the new automatic path and the existing `death_save` mechanic's 3-failures branch now call it, instead of duplicating the "clear deathSaves, add Dead condition" logic.
4. **AI contract updated** — added a DEATH RULES note telling the AI not to double-emit `death_save` for hits the code already auto-failed, and not to ask for a death save on a hit the code already ruled instant death.
5. **6 new unit tests** (45 total, up from 39): drop-to-exactly-0 doesn't trigger death saves yet, damage at 0 HP = 1 auto-failure, 3rd auto-failure kills, massive damage on the downing hit kills, massive damage while already at 0 kills, healing via `hp:` doesn't trigger death-save logic.

### Decisions

See `decisions.md` → "Rules Enforcement (S54)".

### Verification

- `npm install` (node_modules wasn't present in this environment) then `npm test` — 45/45 passing.
- No live-UI verification — this is a pure game-logic fix with no UI surface (death save pips/conditions already render existing state correctly per S50/S51 work), and the sandboxed environment can't reach Firebase to boot the app live (same gap noted in S53's session log, not re-investigated this session).

### Known Issues

- Carried over from S52, still open: Critical Hits told-not-enforced (now scoped — needs a new attack-roll mechanic before code can double dice, not a quick fix), Action Economy heuristic-only, Cover missing entirely, Short Rest Hit Dice surfacing, Concentration's 30 DC cap. CharSheet's manual HP override still bypasses the mechanics pipeline. Charmed/Deafened/part of Grappled remain cosmetic-only.
- The S53 boot-timeout gap (unreachable Firebase hangs boot forever) is still unaddressed — not touched this session, out of scope.

### Next Up

1. Critical Hits is the next highest-value SRD item but is now scoped as a real feature, not a tweak: needs a way for the app to know an attack roll happened and whether it was a nat 20 before it can enforce dice-doubling. Options to consider next session: extend the classifier to intercept attack declarations, or add a new `attack_roll:`-style mechanic the AI emits before resolving damage.
2. Action Economy, Cover, Short Rest Hit Dice surfacing, Concentration's 30 DC cap — remaining S52 punch list items, smaller scope than Critical Hits.
3. Carried-over priorities from S50/S51/S52/S53 — still open, deadline July 11 (see Priorities in workboard.md).

---

## Session 53 · 2026-06-30

Branch `claude/quick-pick-char-onboarding-l62z6d` · committed, pushed.

### What Shipped

User-reported bug: "quick pick characters get no gear." Asked to review, repair, and optimize onboarding for player experience, taking inspiration from current VTT standards. Mid-session, user also flagged the "Talk to AI" builder as out of date.

1. **Root cause: `STARTING_EQUIPMENT` only covered 3 of 12 classes** — `AVAILABLE_CLASSES`/`CLASS_DATA` in `quickBuild.js` support all 12 PHB classes, but `STARTING_EQUIPMENT` only had entries for Fighter, Rogue, and Bard (the original 3-class slice from early development). Quick Pick and the Guided Build wizard both read this same table, so Barbarian/Cleric/Druid/Monk/Paladin/Ranger/Sorcerer/Warlock/Wizard characters were silently created with empty inventories. Filled in standard 5e PHB starting-gear tables for all 9 missing classes, using the same `{goldOption, always, choices}` schema as the existing entries.
2. **Found a second Law 2 gap while in the same code: AC was wrong for 9 of 12 classes** — `forge.js` computed AC via `className === 'Fighter' ? 16 : 11 + dexMod` for every "supported" class, ignoring the per-class `startingAC` field that already existed in `CLASS_DATA` and was correct (it accounts for each class's actual starting armor — heavy/medium/unarmored-defense, not just light armor). A Quick Pick Paladin was getting AC ~11 instead of 18. Fixed to read `classInfo.startingAC` directly.
3. **Fixed the stale "Talk to AI" builder prompt** (user-flagged: "ai also seems out of date") — `CHAR_BUILDER_SYSTEM` in `setupPrompts.js` still said "Supported classes: Fighter, Rogue, Bard ONLY" and steered players away from the other 9, even though Quick Pick/Guided Build/the Forge fully supported them. Predates the 12-class `CLASS_DATA` expansion. Updated to list all 12 and gently redirect anything else (2014-only subclasses, homebrew) to the closest match.
4. **UX addition: Quick Pick card now shows starting gear + gold before commit** — previously even the 3 originally-supported classes accepted blind (no equipment preview at all in the Quick Pick flow, only in the Guided Build wizard). Added an equipment chip list + gold amount to the `QuickPick` card in `CharCreate.jsx`, matching standard VTT quick-build UX (e.g. D&D Beyond shows starting gear before you accept a quick build). Matching CSS added to `style.css` (`.qp-card-equipment`/`.qp-equip-tag`), reusing the existing `.qp-card-attacks`/`.qp-attack-tag` visual pattern.

### Decisions

See `decisions.md` → "Onboarding Repair (S53)" and the two new rows added to "Character Creation".

### Verification

- `npm install` (node_modules wasn't present in this environment) then `npm test` — 39/39 passing, no existing test depended on the old AC formula or `STARTING_EQUIPMENT` contents.
- `npm run build` — succeeded.
- Standalone Node script exercising `forgeCharacter()` for all 12 classes — confirmed correct `startingAC` and non-empty equipment for every class, including the 9 that were previously broken.
- **Could not visually verify in a live browser in this sandboxed environment.** The outbound proxy blocks the Firebase RTDB connection (`ERR_TUNNEL_CONNECTION_FAILED`), and `main.jsx`'s boot chain (`initData().then(boot)`) has no timeout around `initFirebase()` — when Firebase is unreachable the boot promise never settles, `render()` never runs, and the screen stays blank indefinitely with no error surfaced. This is a pre-existing gap unrelated to this session's changes (not touched, per CLAUDE.md's "ask before Firebase config changes" rule) — flagging it as a Law 5 resilience gap worth a future timeout/fallback fix, not something broken by this work.

### Known Issues

- The live-UI verification gap above: `initData()` has no timeout, so an unreachable Firebase backend hangs boot forever instead of falling through to the offline/error path. Worth a small resilience fix (e.g. `Promise.race` with a timeout) in a future session — Law 5 says zero cost to play, and a silent infinite hang is the worst version of an outage.
- Carried over from S52 (untouched this session): Critical Hits, Action Economy, Cover, Death Saves edge cases, Short Rest Hit Dice surfacing, and Concentration's 30 DC cap are still told-not-enforced. CharSheet's manual HP override still bypasses the mechanics pipeline. Charmed/Deafened/part of Grappled remain cosmetic-only.
- `npm install` surfaced 12 dependency vulnerabilities (10 moderate, 2 high) — not investigated or fixed this session, out of scope for the onboarding task.

### Next Up

1. Consider a boot timeout/fallback around `initFirebase()` in `main.jsx` so an unreachable backend degrades gracefully instead of an infinite blank screen (found during this session's verification, not yet scoped or approved).
2. Resume the S52 gap-analysis punch list (Death Saves and Critical Hits are the highest-value next two).
3. Carried-over priorities from S50/S51/S52 — still open, deadline July 11 (see Priorities in workboard.md).

---

## Session 52 · 2026-06-30

Branch `claude/tabletop-gameplay-ux-czwyfb` · committed, not yet pushed to main.

### What Shipped

A background gap-analysis agent diffed the codebase against the uploaded SRD 2024 `rulesglossary.md`/`playingthegame.md` docs and returned a 10-item punch list. User picked the top two to ship this session: switch encumbrance to 2024 SRD rules, then fix conditions + resistance enforcement.

1. **Encumbrance switched to 2024 SRD (single STR×15 hard cap, no tiers)** — the app had the wrong 2014 two-tier model (Encumbered at ×5, Heavily Encumbered at ×10) duplicated in 4 places: `contracts.js` (AI instructions), `RollBar.jsx` (roll penalties), `Cargo.jsx` (the bottom-nav tab players actually see), and `CharSheet.jsx`'s Equipment tab. All 4 now agree: STR×15 lb is a hard cap, nothing more. Also simplified `prompt.js`'s per-PC carry-weight ledger line to match. Removed the now-dead `isHeavilyEncumbered`/`applyEncumbrance` functions from `RollBar.jsx` and the now-unreachable `.encumbered`/`.heavy`/`.cs-enc-mark` CSS rules.
2. **Exhaustion switched to 2024 SRD (flat −2/level, not disadvantage)** — `RollBar.jsx` had a 2014-rules implementation explicitly marked `// (2014 rules)` in its own code comment. Now every level of Exhaustion applies a flat −2 penalty to every d20 Test (not disadvantage) plus −5ft speed/level (no enforcement needed, no movement system exists); a Long Rest removes 1 level. Added an EXHAUSTION section to `contracts.js` (didn't exist before) and rewrote `CharSheet.jsx`'s exhaustion tooltip, which was fully 2014-rules wrong.
3. **All 15 conditions now have real roll-time effects** — previously only Poisoned/Frightened/Restrained/Prone had any effect on rolls, and Poisoned/Frightened were over-broadly applying disadvantage to saving throws too (RAW excludes saves for those two). Rewrote `RollBar.jsx`'s condition-effects logic from scratch against the exact RAW text (read directly from the glossary for all 15 conditions): Blinded/Prone → disadvantage on own attacks; Invisible → advantage on own attacks; Restrained → disadvantage on attacks + Dex saves specifically; Poisoned/Frightened → disadvantage on checks+attacks only, not saves; any Incapacitating condition → disadvantage on Initiative. Built a new `isSavingThrow(skill)` heuristic (bare ability name = save, named skill or "Initiative" = check) to make the check-vs-save distinction possible without changing the `roll_request` mechanic format — this was a documented gap since S51.
4. **Auto-fail for Paralyzed/Stunned/Unconscious/Petrified** — these now force automatic failure on Str/Dex saves (not just disadvantage), closing the S51-documented gap. Implemented by forcing `total = -1` in the roll data so the existing `total >= dc` success/failure check resolves correctly with no plumbing changes; added `AUTO-FAIL` badges reusing existing CSS, and an "Acknowledge" button state instead of a roll button.
5. **Found and fixed a real three-phase-loop bug while wiring auto-fail through** — the pre-send roll path (`engine.js`'s `resumeAfterRolls`, used when the classifier intercepts a message before sending) built its outcome text from raw `total`/`d20`/`mod` numbers. An auto-fail roll (faked as `total:-1, d20:0, mod:0`) would've shown garbled text like "rolled -1 (d20: 0 +0)" to both the AI and the player's own visible chat bubble, instead of "automatically fails (Paralyzed)". The other roll path already worded this correctly — only the pre-send path was broken. Fixed by threading `autoFailReason` through and special-casing it in both of `engine.js`'s text builders.
6. **Resistance/vulnerability/immunity now enforced in code, not AI-narrated** — the `hp` mechanic only ever carried an absolute new HP total, with no damage-type signal anywhere for code to apply a multiplier to; the AI was fully trusted to do the resistance math itself before reporting the final number (the same "told, not enforced" pattern that caused the original encumbrance bug). Added a new `damage: PCname,amount,DamageType` mechanic — the AI now reports raw, un-modified damage + its type, and `mechanics.js` looks up the PC's resistances/vulnerabilities/immunities and computes the final HP itself (resistance ×0.5, vulnerability ×2, immunity ×0). `hp:` is kept as-is for healing and enemy/NPC damage. Refactored the shared temp-HP-absorption/concentration-check/combat-sync logic out of `DISPATCH.hp` into `applyDamage()` so both mechanics use the same path.
7. **6 new unit tests** covering the new `damage` mechanic (plain damage, resistance halving, vulnerability doubling, immunity zeroing, case-insensitive type matching, temp-HP absorption) — 39/39 passing, plus a clean production build.

### Decisions

See `decisions.md` → "Rules Enforcement (S52)" for the full list, including why Charmed/Deafened/part of Grappled were deliberately left cosmetic-only (no data exists to enforce them correctly — documented rather than guessed at).

### Known Issues

- Remaining items from the same gap-analysis punch list, not yet started: Critical Hits told-not-enforced, Action Economy heuristic-only, Cover missing entirely, Death Saves partial (no auto-fail on damage at 0 HP, no massive-damage instant death), Short Rest missing Hit Dice healing surfacing, Concentration missing the 30 DC cap.
- CharSheet's manual HP override still bypasses the mechanics pipeline entirely (no temp-HP absorption, no concentration check) — flagged by the gap analysis, not addressed this session.
- Charmed, Deafened, and part of Grappled remain cosmetic-only — see decisions.md for why.
- `npm install` had not been run in this environment before this session (no `node_modules`); now installed.

### Next Up

1. Work through the remaining gap-analysis punch list items above, roughly in the order listed (Death Saves and Critical Hits are probably the highest-value next two — both are core combat moments).
2. Consider fixing CharSheet's manual HP override to route through `applyDamage()`/the mechanics pipeline instead of writing HP directly, now that that logic is factored out and reusable.
3. Carried-over priorities from S50/S51 (audit unguarded nested-field accesses, classifier coverage expansion, AI DC determination, scene transition gate, rest buttons, CI database rules deploy) — still open, deadline July 11.

---

## Session 51 · 2026-06-30

Branch `main` @ `1936091` · pushed, auto-deploying.

### What Shipped

1. **Fixed stale DM contract** — `DEFAULT_CONTRACTS.never` in `src/state/campaign.js` still told the AI to "auto-resolve a roll" generically and wait, predating the S48 three-phase classifier system (skill checks now arrive pre-resolved as a `[ROLLS: ...]` block; only combat still uses the old roll-and-wait flow). Rewrote it to describe both flows correctly. Added a one-time migration in `persist.js` (`STALE_CONTRACTS`) that refreshes any existing campaign's `contracts.never` if it still holds the old text verbatim, without touching player-customized text. Confirmed via 3 separate exported saves (including the user's own and Christian Birdsong's) that all had the identical stale text — this was a shared-default bug, not a per-campaign drift.
2. **Drift detector: enemy/PC defeat narrated without an `hp` mechanic** — found via a real bug transcript (Vesper's Adventure test campaign): the AI narrated an enemy's defeat ("collapses," "falls still," etc.) with no matching `hp` mechanic, and the existing `HP_NARRATION` regex only catches numeric damage phrasing ("takes 12 damage"), so it missed it. Added a new check to `src/ai/drift.js` using the same bounded-name-lookup pattern as the existing `unmentioned_pc` check (scan the vicinity of a known PC/enemy name above 0 HP for defeat language) rather than a generic prose regex — verified against the real transcript and two negative cases (matching hp mechanic present; already-dead combatant re-mentioned in flavor text) before committing.
3. **Encumbrance and condition rules are now actually enforced, not just narrated** — user reported "the encumbered status not being enforced" on Christian Birdsong's save. Investigation: `genLedger()` in `prompt.js` already computed and injected per-PC carry weight + encumbrance tier into the AI's prompt every turn, and `contracts.js` already told the AI the thresholds — but nothing besides the AI's own narration ever applied the penalty. Birdsong (STR 8, 46.7 lb carried) crosses the Encumbered threshold (40 lb) with zero in-app effect. Same gap existed for tracked conditions (`pc.conditions` — Poisoned, Frightened, Restrained, Prone, etc.) — written by mechanics, never read back by roll resolution. Fixed both by extending the existing exhaustion-disadvantage path in `RollBar.jsx` (same `advState` mechanism, advantage/disadvantage cancel the same way):
   - Heavily Encumbered → disadvantage on STR/DEX/CON checks, saves, and Initiative
   - Poisoned/Frightened → disadvantage on all the PC's own d20 rolls
   - Restrained → disadvantage on attacks and Dex-keyed rolls
   - Prone → disadvantage on the PC's own attack rolls
   Also brought Cargo's weight bar (the actual bottom-nav tab players see) up to the same 3-tier encumbrance display CharSheet's Equipment tab already had.
4. **Branch hygiene** — merged the S48-era `claude/lore-bard-bonus-spells-q4sa51` branch into main twice this session (it kept accumulating new fixes); identified 6 merged-but-undeleted branches for the user to clean up manually in the GitHub UI (no branch-deletion tool available via the GitHub MCP server or git push — got HTTP 403). Recommended enabling "Automatically delete head branches" in repo settings.

### Decisions

See `decisions.md` → "Rules Enforcement (S51)" for the four decisions made this session (bounded-name drift checks, where rule penalties get enforced, why auto-fail is deferred, why check-vs-save isn't distinguished).

### Known Issues

- Paralyzed/Stunned/Unconscious/Petrified don't auto-fail Str/Dex saves yet — that needs a forced-failure path through roll resolution (`effectiveD20`/`total`/`submitAll`/`submitInitiative`), bigger than the disadvantage-only fixes shipped this session. Those conditions also make the PC Incapacitated (can't act), so they rarely reach a roll in practice, but it's a real gap.
- `roll_request`'s `skill` field doesn't distinguish ability check vs. saving throw — condition effects that RAW differ between the two are applied blanket.
- No full gap-analysis has been done yet against the uploaded SRD Rules Glossary (`rulesglossary.md`, ~150 entries: damage types, rests, death saves, AoE shapes, object AC/HP, etc.) beyond the encumbrance/conditions slice fixed this session.
- 6 merged branches still undeleted on GitHub (`claude/app-styling-tabs-c1khdr`, `claude/character-creation-phase-4-r94wpq`, `claude/character-sheet-familiar-tab-2u3wsw`, `claude/documentation-refactor-n5z5h2`, `claude/multiplayer`, `claude/new-session-yp5z21`) — user needs to delete manually, no tool access to do it from here.
- Carried over from S50: `database.rules.json` can drift from live Firebase Console rules (no automated deploy step yet); classifier DCs still fixed tiers; classifier still skips combat.

### Next Up

User is starting a fresh session specifically to continue implementing rules from the uploaded Rules Glossary. Suggested entry points, in order of how directly they extend this session's work:

1. **Auto-fail Str/Dex saves** for Paralyzed/Stunned/Unconscious/Petrified — the natural next step in `RollBar.jsx`, same file just touched.
2. **Full gap analysis against the glossary** — read `rulesglossary.md` against `mechanics.js`/`gates.js`/`drift.js` to produce a prioritized list of what's missing before picking the next implementation batch, rather than guessing at scope again.
3. Carried-over priorities from S50 (audit unguarded nested-field accesses, classifier coverage expansion, AI DC determination, scene transition gate) — still open, deadline July 11.
