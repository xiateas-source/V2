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

1. **Fix the audit's high findings** — sync correctness and provider failover sit
   under everything else. From `audit-2026-07-02.md`:
   - ~~#3 provider health no-op~~ — **fixed S81** (write-through-setStore + 5 tests)
   - ~~#7 roll-result re-classification~~ — **fixed S81** (`skipClassifier: true`)
   - #1 echo detection vs RTDB empty-collection pruning and #2 character
     union-by-id merge — **remaining, ~1-2 sessions: implement from
     `impl-spec-sync-fixes.md`** (settled design + test list; don't re-derive).
     The S62 doc entry describes #2 as shipped; it never landed in source.
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

## Proposed arc (discussed S81, not yet scheduled): Rules Depth

User's observation: play "sometimes feels like a pick-your-own-story game" — the rules
don't bite outside the code-enforced moments. Root causes identified (S81): **no
bestiary exists** — every enemy's HP/AC/attacks/initiative are numbers the AI invents
per `zone_add_enemy`; **NPC-attacks-PC is pure narration** (scoped out deliberately in
S57); **spell effects are AI-adjudicated** (only slot spending is enforced — the S77
spell-resolution-table gap is the same gap); no pacing pressure (rest frequency,
encounter budgets, treasure economy are all AI mood). When the opposition's numbers are
improvised, every fight is secretly a story beat.

Principle: **stop implementing rules one bespoke handler at a time** (linear cost per
rule — why rules work "took over" the sprint) — build the few generic mechanisms that
let rule coverage arrive as *data*, per `ruleset-coupling-analysis.md`:
1. **Bestiary as data** (~2 sessions) — SRD stat blocks (AC/HP/attacks/saves/XP) as
   `data/bestiary.json` + a bundle content type; `zone_add_enemy` becomes
   `zone_add_enemy: Goblin` with stats looked up, AI-typed numbers only as fallback.
2. **NPC→PC attacks through the enforced roll path** (~2 sessions) — reopens the S57
   scope deliberately: enemy attacks use the same RollBar math as PC attacks (code rolls
   for the enemy), killing the "the goblin misses because the story wants it" pattern.
   Also finally makes the inert PC-side coverBonus real.
3. **Spell resolution table** (~2-3 sessions, start cantrips–L2 to match SPELL_DB) —
   add resolution fields to spells.json (attack/save/auto, save ability, damage,
   condition); casting resolves through one generic code step. Closes the S77
   Animal Friendship gap as a side effect.
4. **Pacing pressure** (1-2 sessions, optional, playtest-driven) — encounter XP budgets
   from xp-thresholds, rest-frequency guard, treasure guidance.

Play-feel guardrail: mechanics must surface as *pressure, not paperwork* — the cover
pill / disabled-button pattern (ambient, glanceable), never modal interruptions to the
story. Sequencing: after (or interleaved with) inversion stages 1-2, which make the
structured resolution these mechanisms plug into reliable. Order within the arc should
be playtest-driven — fix the moment that most recently felt gamey.

---

## Proposed arc (discussed S81, not yet scheduled): World Integrity — time, memory, procedures

User's observation, second half: time/travel/NPC continuity are "half tracked, but only
if the player feels like noticing — no enforcement, nothing to say no, we hope the AI
doesn't forget." Real examples: a 2-hour breakfast scene costing nothing; a magic item
"identified" with a glance when the DMG requires a short rest in contact; an NPC lie
that should pay off 5 sessions later has nowhere to live.

**Hard facts (verified S81):** chat memory prunes at 12k tokens (`memory.js`) — the
ledger is the ONLY durable memory; **the secrets system is a read-only shell** —
`campaign.secrets` + Journal "Lore & Leads" + the contract clause all exist, but no
mechanic can write a secret (no `secret_add` in KNOWN_KEYS); **`npc_add` on an existing
NPC overwrites `details`** (`mechanics.js` ~line 650) — re-meeting an NPC erases what
was known; the per-turn prompt injects only "NPCs present: Name (disposition)" — never
details/history, so even recorded facts never reach the AI. Time is a freeform caption;
consequence `deadline`s are freeform strings nothing ever compares against.

Principle: **whatever matters must (a) be written to the ledger, (b) be injected when
relevant, (c) be consulted before narration.** Three mechanisms:
1. **Time as a currency** (~2 sessions) — structured clock (day + time-of-day) behind
   the freeform display string; procedures/rests/travel cost time via mechanics; code
   compares deadlines to the clock and flags expiry (today `rules.js` just reminds the
   AI a deadline exists). Visible day clock in ContextBanner → a sprawling breakfast
   scene visibly burns daylight; S75's pendingTime hold already gives the confirm UX.
2. **A real memory ledger** (~2-3 sessions) — build the missing `secret_add` write path
   (dmOnly flag; Journal Lore section already renders playerKnown ones); make NPC
   records append-history instead of overwrite; **scene-scoped injection** of full NPC
   records + their secrets when the NPC is present or named — third instance of the
   existing `rules.js`/`bundleContext.js` budget-disciplined pattern. The 5-session lie
   works because the ledger, not the model, carries it.
3. **Procedures as data** (~2 sessions + ongoing rows) — a table of SRD procedures:
   intent → requirements (time cost, contact, components) → effect. Identify-magic-item
   = short rest + physical contact. Inversion stage 1's classify call tags the intent;
   the app checks the table and says no ("that takes a short rest — spend it?"). Each
   playtest correction ("I had to fix it from the rulebook myself") becomes a data row,
   not a code session. The user owns a rulebook for curating rows; they should never
   need to enumerate mechanics from memory.
   
Cheap add-on: a deterministic pacing nudge — count exchanges since the last applied
mechanic/state change; past a threshold, inject a one-line "consider moving the scene
forward or advancing time" (no NLP, no regex — pure counter).

Related open bugs folded in here: `npc_add` details-overwrite (memory loss);
secrets write path missing.

---

## ✅ DONE (S81): SRD Rules Ingestion + Coverage Matrix

The user's core constraint, stated directly: **"I need the game to know the rules
because I am so ignorant of them — half the time I don't even know to ask."**
Playtest-driven rule addition can't work when nobody at the table knows a rule is
missing. The strategy flipped: **the machine reads the book.** Built same-session:

- **`scripts/build-rules.js`** parses the user-supplied SRD 5.2 sources
  (`scripts/srd/rules-glossary.md` — 154 definitions; `playing-the-game.md` — 13
  procedure sections) + the app-authored entries (`scripts/srd/curated-rules.json`,
  moved from `data/rules.json`) → regenerates **`data/rules.json`: 186 entries**
  (was 34 hand-written summaries) and **`.claude/rules-coverage.md`** (the matrix:
  24 enforced · 5 partial · 14 gap · 117 inject · 26 reference-only). CC-BY-4.0
  attribution added (`data/ATTRIBUTION.md`).
- **16 curated entries dropped as superseded — several carried 2014-edition rules
  contradicting what the code enforces** (old Exhaustion six-tier table vs. the
  enforced 2024 -2/level; 2014 Surprise/Grappling/Shoving/Hide). The AI was being
  taught rules the app doesn't play by; now the injected text matches the code.
- Seed migration v4→v5 (`seed.js`: clear + reseed `compendium`) so existing devices
  pick it up. 8 new tests (`tests/rules-data.test.js`) guard the generated output's
  contract with `rules.js` and the Compendium, including an edition-drift guard.
  133/133 passing, build clean.
- Compendium's Rules tab reads the same store — all 186 entries are player-browsable
  with zero UI changes.
- **Not live-verified**: needs a play check that scene-relevant rules actually
  surface (e.g. inspect a magic item → the Study/identification text appears in the
  AI's ruling; travel → pace rules), that the fuller entries don't crowd the 1500-
  token budget in practice, and that the Compendium Rules tab renders the longer
  entries acceptably on a phone.

The matrix's **14 ⚠ gap rows** are the enforce-candidate punch list feeding the Rules
Depth / World Integrity arcs (Surprise → initiative disadvantage; Travel Pace;
light/vision; Knocking Out; Stable; death-save-from-crit = 2 failures; Bloodied;
jumping; Grappling escape; Charmed/Deafened; Influence attitudes; Carrying Capacity
hard cap). Later chapters (spells past L2, equipment, **monsters → the Rules Depth
bestiary**) ride the same pipeline.

Full detail with file:line and fixes in `audit-2026-07-02.md`. Status here.

| # | Sev | Finding | Status |
|---|-----|---------|--------|
| 1 | High | Echo detection broken vs RTDB empty-collection pruning (`firebase.js`) | Open — Priority 1 |
| 2 | High | S62 character union-merge never landed; cloud merge can drop local chars (`persist.js`) | Open — Priority 1 |
| 3 | High | Provider health tracking silent no-op (`providers.js`) | ✅ Fixed S81 (needs no live check — unit-tested) |
| 4 | High | DB rules: any anonymous user can read/write all campaigns + player pointers | Open — needs user decision |
| 5 | Med | Mid-stream provider failover duplicates narration (`providers.js`) | Open |
| 6 | Med | `zone_add_enemy` mid-combat re-sort invalidates `currentTurn` (`mechanics.js`) | Open |
| 7 | Med | Roll-result submissions re-classified out of combat (`RollBar.jsx`) | ✅ Fixed S81 (`skipClassifier: true`) |
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
| S81 | Code audit (13 findings) + coupling/verb-chasing analyses; foundation plan adopted; planning docs restructured; Google-login direction + Rules Depth / World Integrity arcs recorded; **SRD rules ingestion shipped** (34 → 186 rule entries, coverage matrix, seed v5, 8 tests) |
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
| `impl-spec-sync-fixes.md` | Implementing audit #1/#2 — settled design + test list, execute don't re-derive |
| `rules-coverage.md` | Any rules question — what the game knows and at what enforcement level (generated; edit the STATUS map in `scripts/build-rules.js`) |
| `ruleset-coupling-analysis.md` | Content-as-data work (class tables, quickBuild extraction, bundle content types) |
| `verb-chasing-assessment.md` | Inversion stages (classifier, structured mechanics, two-phase turns) |
| `ui-specs-v2.md` | Building/modifying CharSheet, Cargo, Treasury, Journal, Combat UI |
| `chat-system-spec-v2.md` | Working on chat, streaming, message types, overlays |
| `enforcement-spec.md` | Working on mechanics gates (9 gates) |
| `decisions.md` | Before making a design choice — check if it's already decided |
| `ai-failures.md` | Adding/modifying Law 2 enforcement |
| `prime-directive.md` | Grounding a decision in project vision |
| `player-requests-v2.md` | Checking unbuilt player requests |
