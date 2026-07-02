# Workboard

*What to build next. Updated S81 · 2026-07-02.*

*Format note (S81 cleanup): the old per-session "Latest (Sxx)" paragraphs duplicated
decisions.md entry-for-entry and were compressed into the Session History table below.
Full detail for any session lives in decisions.md under the same heading. The old
"Known Issues" ✅-ledger of fixed items also lives on in decisions.md; this file now
tracks only what's open.*

---

## Current State

The app deploys, renders, navigates. Engine pipeline (sendMsg → extract → validate →
apply) is tested: 125/125 unit tests, build clean. Combat has turn enforcement, action
economy, hit-dice healing, code-enforced PC attack rolls with cover (cover confirmed
live S73). Character creation works (3 paths + guided wizard); level-up handles all 12
classes from data. Multiplayer (invite links, live sync, presence) confirmed live
through S62. Three-phase skill resolution (classify → roll → narrate) live since S49.
Contextual AI DCs (S78), scene-transition gate (S75), and the bundles MVP + AI bundle
builder (S80) are shipped but **not yet live-verified** — see the checklist below.

**All eight scheduled priorities from the July-11 sprint are done (S80 closed the list).**
S81 was a full code + planning audit; the priorities below are the foundation plan that
came out of it (see `audit-2026-07-02.md`, `ruleset-coupling-analysis.md`,
`verb-chasing-assessment.md`).

---

## Priorities (foundation plan, adopted S81)

Goal: a base worth building years of features on, with the app playable the whole time.
Order matters — each step de-risks the next.

1. **Fix the audit's high findings** (~2-3 sessions) — sync correctness and provider
   failover sit under everything else. From `audit-2026-07-02.md`:
   - #3 provider health tracking is a silent no-op (`providers.js` — tiny fix, immediate
     latency win on flaky networks)
   - #7 roll-result messages can be re-classified into a second roll
     (`RollBar.jsx` — one-word fix: `skipClassifier: true`)
   - #1 echo detection still broken vs RTDB empty-collection pruning (`firebase.js`)
   - #2 implement the character union-by-id merge in `mergeCampaign()` — **the S62
     doc entry describes this as shipped; it never landed in source** (verified via
     git history). Local-only characters can still be dropped by a cloud merge.
2. **Unify the duplicated class tables** (1 session) — spell-slot/hit-die tables exist
   in BOTH `quickBuild.js`'s `CLASS_DATA` and `data/level-up-*.json`. One source of
   truth (the JSONs) before they drift. This is the live data-integrity hazard from
   `ruleset-coupling-analysis.md` step 2.
3. **Live-verify the S74–S80 backlog through play** (play sessions, not dev sessions) —
   see checklist below. Especially S74 (combat turn loop) before any inversion work
   touches how turns resolve.
4. **Inversion stage 1: classifier → merged AI classify+DC call** (1-2 sessions) —
   replace `classifier.js`'s 18 regex patterns with one structured AI call merged into
   the existing S78 DC call. Permanently retires the S77 bug class ("set a trap"
   wasn't in the list). See `verb-chasing-assessment.md`.
5. **Inversion stage 2: structured JSON mechanics channel** (2-3 sessions) — mechanics
   arrive as schema-validated JSON instead of a regex-parsed text block.
   `extractMechanics`' five fallback patterns and format drift go away; `contracts.js`
   shrinks (Law 5 win). Gates stay on as a safety net throughout.
6. **Reassess.** Inversion stages 3-4 (two-phase resolve-then-narrate for combat, then
   exploration) are **planned, not scheduled** — let playtest pressure after stages 1-2
   decide when/whether.

**Parallel / anytime (independent of the sequence above):**
- quickBuild content → `data/*.json` (races, backgrounds, equipment, skills; ~2
  sessions) and bundle system-content types (races/subclasses/spells via the S80
  import path; 1-2 sessions) — `ruleset-coupling-analysis.md` steps 3-4.
- Audit medium findings #5 (mid-stream failover duplication), #6 (mid-combat initiative
  re-sort breaks turn pointer), #8 (combat_end can revert mid-combat rest healing).
- **Firebase rules hardening (audit #4) — direction chosen S81: Google login.** The
  user confirmed a pre-existing (previously undocumented) plan to add Google sign-in.
  Recommended shape: keep anonymous auth for frictionless first-run, offer "link your
  Google account" via Firebase account-linking (preserves the same uid — no campaign
  migration), require linked identity for multiplayer share/join, then scope campaign
  rules to a member list written at share/join time. Minimum fix (`players/$uid` writes
  restricted to own uid) is safe to do immediately regardless. Still open: whether
  anyone-with-link auto-joins as a member vs. host approval, and whether membership is
  revocable. ~1-2 sessions.

---

## Audit Findings — open items (2026-07-02)

Full detail with file:line and fixes in `audit-2026-07-02.md`. Status here.

| # | Sev | Finding | Status |
|---|-----|---------|--------|
| 1 | High | Echo detection broken vs RTDB empty-collection pruning (`firebase.js`) | Open — Priority 1 |
| 2 | High | S62 character union-merge never landed; cloud merge can drop local chars (`persist.js`) | Open — Priority 1 |
| 3 | High | Provider health tracking silent no-op (`providers.js`) | Open — Priority 1 |
| 4 | High | DB rules: any anonymous user can read/write all campaigns + player pointers | Open — needs user decision |
| 5 | Med | Mid-stream provider failover duplicates narration (`providers.js`) | Open |
| 6 | Med | `zone_add_enemy` mid-combat re-sort invalidates `currentTurn` (`mechanics.js`) | Open |
| 7 | Med | Roll-result submissions re-classified out of combat (`RollBar.jsx`) | Open — Priority 1 |
| 8 | Med | `combat_end` HP write-back can revert mid-combat rest healing (`mechanics.js`) | Open |
| — | Low | 5 cleanup items (tautology, dead `roll-request` event, localStorage cache growth, `findPC` enemy/PC cross-match, save-effect gaps) | Open |

---

## Live-Verification Checklist

This sandbox can't reach Firebase, so code fixes verify via tests/build only; anything
touching live AI behavior or a real device needs a play check. Confirmed-working items
drop off this list (with a note in decisions.md).

**Confirmed live:** S60/S61 sync fixes (S62 retest) · S69 Cover AC math (S73 transcript)
· S70 scroll + XP format (S73 usage, reasonably confirmed).

| Session | What to check in play |
|---|---|
| S56-S57 | Partial-message healing; `restoreQuickActions()`; chat name label; attack-roll/crit enforcement (AI reliably emits `roll_request: Attack\|...`, HIT/MISS text reads well) |
| S62 | Presence badge two-device count; join auto-retry. ~~Character survival on tab-kill~~ → **moved to Audit #2: the merge half of that fix doesn't exist; expect this test to FAIL until Priority 1 lands** |
| S67 | Action-economy button disable feels right in live combat |
| S68 | Spend Hit Die button: toast/heal feel, disabled states |
| S71 | AI stops co-emitting damage:/hp:; companion item type gets used (contract-only) |
| S72 | 3 scenario buttons land in the intended live situation ("Mid-Combat Turn" writes combatState directly) |
| S73 | Testing-notes persistence; spell-compendium nav; CharDrawer turn-sync; roll notes |
| **S74** | **Highest stakes:** multi-round combat with attack rolls — turn indicator advances exactly once per turn; missed attack leaves no stale damage |
| S75 | CharSheet swipe across all six tabs; scene-transition banner (Go/Stay bundles location/time/chapter; player-stated move skips) |
| S76 | Re-import the outside-AI character JSON (scores/bio/equipment); equipment picker contents + selection; AI Builder depth |
| S77 | Compound action ("set traps... then look around") produces two rolls; AI respects roll scope |
| S78 | Unusual action gets non-default DC after brief pause; Stop during pause prevents roll bar; network hiccup falls back to tier default |
| S79 | NPC card survives a sync cycle mid-play; presence still correct two-device. *(Audit note: echo detection is still partially broken — reconcile() is what's protecting the UI here, so "looks fine" doesn't prove the echo fix; Audit #1 finishes it)* |
| S80 | Bundles MVP end-to-end: import (counts, no false warnings), toggle, Compendium Bundles tab, scene-scoped aiGuidance appears in narration, export/delete, two-device missing-bundle prompt. Bundle AI Builder: vague opener gets real brainstorming (not one question then JSON), specific opener still finalizes fast, BUNDLE_JSON extraction reliable |

---

## Session History (detail in decisions.md under the same heading)

| S | One-liner |
|---|---|
| S81 | Code audit (13 findings) + ruleset-coupling analysis + verb-chasing assessment; foundation plan adopted; planning docs restructured. Docs-only — no src/ changes |
| S80 | Bundles MVP (Priority #8, closed the sprint list) + AI bundle builder + brainstorming/creative-bar prompt upgrade |
| S79 | Echo-detection stableStringify + reconcile() at all campaign setStore sites (NPC card closing bug) |
| S78 | Contextual AI-determined DCs (Priority #4) |
| S77 | Compound-message roll scope: Survival trap pattern + contract scope clarification + STALE_CONTRACTS migration |
| S76 | Character JSON import fixes (nested wrappers, silent ability-score loss, equipment); equipment picker contents; AI Builder depth prompt |
| S75 | CharSheet swipe keyed remount; Scene Transition gate (Priority #5) |
| S74 | Core loop: combat turn double-advance fix + same-batch roll/hp fabrication rejection |
| S73 | Four playtest fixes (testing notes persist, compendium nav, CharDrawer turn-sync, roll notes); confirmed S69 Cover live |
| S72 | Scenario buttons in testing tab |
| S71 | damage:/hp: co-emission batch rule; companion contract documentation |
| S70 | Testing tab scroll fix; Testing Notes export; XP test-button format bug |
| S69 | Cover code-enforced (PC-attacks-enemy path) — closed Priority #1 punch list |
| S68 | Hit Dice healing fixed at source + Spend button |
| S67 | Action economy enforcement (button disable + actor-scoped Gate 2) |
| S63 | Pack contents visible; Bag of Holding weight; combat side drawers |
| S62 | Presence badge; join auto-retry; char forceSyncNow (union-merge half never landed — see Audit #2) |
| S61 | Reconnect-triggered flushPending (join failure root cause) |
| S60 | Three sync-bug fixes (echo v1, startLiveSync arming, presence merge) |
| S59 | Quick wins: alert()→toast, dead-code sweep |
| S58 | Presence toggle; CI database-rules deploy (Priority #7); first Firebase-mock tests |
| S57 | Live 2-device retest; PC attack rolls/crits code-enforced; contested-check contract; nested-field audit (Priority #2) |
| ≤S56 | See decisions.md (S48 three-phase rolls, S50 multiplayer, S51-S56 rules enforcement + healing) |

---

## Three-Phase Architecture (S48)

```
Player declares action
       ↓
  classifier.js detects skill check   ← inversion stage 1 replaces regexes with AI call
       ↓
  RollBar shows (skill + DC) — player rolls
       ↓
  Code determines SUCCESS/FAILURE
       ↓
  AI narrates the predetermined outcome
```

Key files: `src/ai/classifier.js`, `src/ai/engine.js` (sendNarrative, resumeAfterRolls),
`src/ui/play/RollBar.jsx`. This resolve-then-narrate pattern is the model the inversion
arc generalizes to the rest of the game (`verb-chasing-assessment.md`).

---

## Stubs to Fill

| Stub | File | Purpose |
|------|------|---------|
| SessionReview | `manage/SessionReview.jsx` | Session archive/review UI |
| SessionZero | `setup/SessionZero.jsx` | Campaign setup wizard |
| Modal | `shared/Modal.jsx` | Shared modal component (blocks replacing the 2 native confirm() calls — S59) |
| AppSimple | `ui/AppSimple.jsx` | Child-friendly view |
| migrate.js | `data/migrate.js` | State version migration |
| elevenlabs.js | `audio/elevenlabs.js` | ElevenLabs TTS |

*(Removed S81: `data/bundles.js` and `setup/ContentImport.jsx` — fully built in S80.)*

---

## Not Yet Built

- Push notifications (Web Push + FCM)
- Visual tile map (combat phase 2)
- PDF/epub/web content parsers (JSON import + `adventureParser.js` exist; other formats don't)
- Episode/module tracking system (mechanic + `moduleProgress` exist; no real spec — see decisions.md Open Questions)
- SPELL_DB expansion past Level 2 (player request — pickers empty past ~level 5)
- Inline NPC name linking (player request — `sourceBus.js` infra exists)
- Quest log UX refresh (player request — needs design)

*(Removed S81 as built: multiplayer identity (S50), multi-device sync verification
(S57/S62), shared content bundles (S80). Pre-built class progressions now ship in
`data/level-up-*.json`.)*

---

## Known Issues (open bugs & gaps, non-verification)

- Audit findings #1-#8 — see table above; highs are Priority 1.
- Charmed, Deafened, part of Grappled: no roll-time enforcement (cosmetic) — no data for
  "requires hearing/sight" or grappler identity (decisions.md "Rules Enforcement (S52)").
- Classifier doesn't handle combat attacks or saving throws (by design — existing
  roll_request flow covers them).
- `dbWrite()` never surfaces write failure to callers — "Link copied!" can show while
  genuinely offline (S61 follow-up, never pursued).
- NPC ally presence: `npcName` stored but not surfaced in the presence roster.
- Gate 5 "AI forgot npc_add" detection spec'd but unbuilt; `drift.js` only matches
  self-introduction phrasing (S71 — user deferred; false-positive risk needs its own session).
- Spell-resolution-type validation gap: `roll_request` type isn't checked against how the
  cast spell actually resolves (S77 Animal Friendship; needs a lookup table).
- Multi-attack PCs always use `pc.attacks[0]` (no weapon selection — S57 follow-up).
- PC-side `coverBonus`/badge inert (S69 scoped cover to the enforced attack direction only).

---

## Reference Docs

| File | When to Read |
|------|-------------|
| `audit-2026-07-02.md` | Fixing any Priority-1/audit item — findings with file:line + suggested fixes |
| `ruleset-coupling-analysis.md` | Content-as-data work (class tables, quickBuild extraction, bundle content types) |
| `verb-chasing-assessment.md` | Inversion stages (classifier, structured mechanics, two-phase turns) |
| `ui-specs-v2.md` | Building/modifying CharSheet, Cargo, Treasury, Journal, Combat UI |
| `chat-system-spec-v2.md` | Working on chat, streaming, message types, overlays |
| `enforcement-spec.md` | Working on mechanics gates (9 gates) |
| `decisions.md` | Before making a design choice — check if it's already decided |
| `ai-failures.md` | Adding/modifying Law 2 enforcement |
| `prime-directive.md` | Grounding a decision in project vision |
| `player-requests-v2.md` | Checking unbuilt player requests |
