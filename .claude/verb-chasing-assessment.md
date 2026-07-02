# "Chasing verbs" assessment — is there a better architecture, and does it need a V3?

2026-07-02, follow-up to `ruleset-coupling-analysis.md`. Analysis only, no code changed.

---

## The diagnosis is correct, and it's quantifiable

Roughly 40 regex families across four files exist to police *prose*:

- `drift.js` — 6 pattern families (gold, item-give, NPC-intro, HP narration, defeat
  verbs, roll-in-prose) plus action-verb vicinity scanning around PC names.
- `gates.js` — Gate 1 (fabricated-roll phrasings + all 18 skill names), Gate 2
  (action/bonus/reaction verb lists — including hardcoded spell names "misty step",
  "healing word", "hex" as bonus-action markers), Gate 7 (10 skill-action regexes +
  a "resolution language" regex).
- `classifier.js` — 18 action patterns → skills.

The project's own history is the evidence that this approach is a treadmill:
S77 burned a session because "set a trap" wasn't in the Survival regex. S67 fixed
Gate 2 false-positives by inventing sentence-scoping. S71 found the NPC-intro pattern
only catches "I'm Name" phrasing. The audit found the classifier can re-trigger on
roll-result text. Every one of these is the same failure: **a regex met a sentence it
hadn't seen before.** Natural language has infinite verbs; the lists can only grow.

## Why it happened — one architectural decision, not many small mistakes

The core loop runs **narrate-first**: the AI writes freeform prose (authoritative,
streamed to the player), a mechanics block is regex-extracted from it, and then gates
and drift detection *audit the prose* for anything the AI did but didn't declare.
When the source of truth is freeform text, pattern-matching text is the only
enforcement tool available. The verb-chasing isn't badly built — it's load-bearing
because of where it sits in the flow.

The tell: **V2 already contains the better architecture, and it's the most successful
thing in the app.** The S48 three-phase roll flow (classify → player rolls → AI
narrates the *predetermined* outcome) is resolve-first. So are S57 attack rolls, S68
hit dice, S69 cover. Notice that no gate polices those paths — nobody chases verbs
where code decides the outcome before the AI opens its mouth. The gates exist
exclusively to guard the paths still running in the old direction.

## The better way (had it been built this way / where V2 can still go)

**Invert the remaining paths: resolve-then-narrate, with a structured channel.**

1. **Structured output instead of a parsed text block.** The AI's mechanics should
   arrive as typed JSON (Gemini's free tier supports JSON-schema output and function
   calling; `extractMechanics`' five fallback regexes and the "naked key" scan exist
   only because mechanics ride inside markdown prose today).
2. **Two-phase turn.** Phase 1: a short, non-streamed structured call — "given this
   action and this state, what mechanical events occur?" — validated and applied by
   the existing pipeline, rolls requested where needed. Phase 2: the streamed
   narration, written *from the applied receipt*. This is exactly the roll-bar flow,
   generalized.
3. **AI classification instead of regex classification.** S78 already added an AI
   call for DCs; merging "does this need a roll, which skill, what DC" into that same
   call replaces the 18 patterns with judgment. "Set a trap" can never be missing
   from a list again, because there is no list.

**The key property change:** today, drift = *state corruption risk* (the AI narrates
damage that never lands in state, or lands state that was never narrated). After the
inversion, prose is downstream of committed state — if the AI embellishes, the state
is still correct, and drift becomes a cosmetic problem instead of a rules problem.
Gates shrink from "police English" to "validate typed events," which code is
actually good at. What honestly remains: phase 1 can still *omit* an event (the
npc_add-forgetting class of failure) — but omission degrades to "nothing happened
mechanically," the safe direction, and a structured event checklist in phase 1
catches more than hoping keys appear in a freeform block.

**Honest costs:** a second AI call per turn (latency + free-tier budget — though S78
already normalized paying a small pre-call, and merging classify+DC keeps it at two
total); a short non-streamed pause before narration starts (same feel as the S78 DC
pause); narrating from a fixed receipt can read slightly stiffer (the roll-bar flow
already proved the table tolerates this); and OpenRouter fallback needs a model that
honors JSON mode.

## Should this be a V3? No.

A rewrite is justified when the *foundation* is wrong. V1→V2 was justified: monolith,
no field ownership, no tests, data in multiple places. V2's foundation is fine —
sync, persistence, ownership enforcement, the validate/apply pipeline, bundles, the
UI, 80 sessions of live-tested behavior. The narrate-first decision lives in a thin,
well-localized layer: `engine.js` orchestration, `contracts.js`'s output format, and
the ~800 lines of gates/drift/classifier that exist to compensate for it.

V2 has also already demonstrated, four times (S48/S57/S68/S69), that a path can be
flipped from narrate-first to resolve-first *inside the existing architecture*. A V3
would re-earn the chassis to fix a layer that converts incrementally, and would
resurrect the exact risk named in the ruleset analysis: re-litigating every
playtest-earned behavior at once instead of one path at a time.

**If/when playtest pressure justifies it, the arc looks like (~8-12 sessions, each
stage shippable and reversible):**
1. Classifier → merged AI classify+DC call (1-2 sessions; deletes the 18 patterns,
   fixes the S77 class of bug permanently).
2. Mechanics block → structured JSON channel (2-3 sessions; deletes extraction
   regexes; contracts.js shrinks — a Law 5 win).
3. Combat turns → two-phase resolve-then-narrate (3-4 sessions; the most-policed,
   highest-stakes path; Gates 1/2 become validators of typed events).
4. Exploration/social turns → two-phase; drift.js and Gate 7 shrink to a cosmetic
   consistency check (2-3 sessions).

Gates stay on as a safety net during every stage and only shrink after live
verification — the same discipline the sprint already uses.

Side benefit: stages 1-3 also delete most of the 5e-specific regex surface named in
`ruleset-coupling-analysis.md` (skill lists, spell-name regexes), so this moves
*toward* that document's recommendation, not against it.

**Bottom line:** the verb-chasing is real, it was the predictable cost of making
streamed prose the source of truth, and the escape isn't a rewrite — it's promoting
the resolve-first pattern V2 already invented from "special case for rolls" to "how
every turn works."
