# Session Log — S81 (2026-07-02)

## Branch / Build
Branch: `claude/app-code-audit-e2e7hj` (includes a merge of main's S80 bundle-AI-builder
follow-ups) · mostly analysis/docs, plus one shipped feature at session end: **SRD rules
ingestion** (`scripts/build-rules.js`, `data/rules.json` 34→186 entries, seed v5,
`.claude/rules-coverage.md`, `data/ATTRIBUTION.md`, 8 new tests) · 133/133 tests
passing, build clean · not merged to main — no "go live" given.

---

## What Happened This Session

**Full code audit + two architecture assessments + planning-doc restructure.** No code
was written or fixed — findings and plans only, at the user's direction.

1. **Code audit** (`audit-2026-07-02.md`) — 4 high, 4 medium, 5 low findings, all
   verified against source (one tested live in Node). Highs: echo detection still broken
   vs RTDB empty-collection pruning; **the S62 character union-merge never existed in
   source** (docs claimed it shipped — git history proves otherwise); provider health
   tracking is a silent no-op (direct Solid store mutation); database rules give every
   anonymous user read/write to everything.
2. **Ruleset-coupling analysis** (`ruleset-coupling-analysis.md`) — is 5e extractable?
   Answer: content is half-data already (level-up JSONs, spells, feats); the engine has
   5e in its bones by design. Recommended option (b): finish content-as-data, keep the
   5e engine, say so in prime-directive. Rejected a rules-interpreter rewrite (25-40
   sessions, re-earns everything playtests already earned).
3. **Verb-chasing assessment** (`verb-chasing-assessment.md`) — user asked "is there a
   better way / should I do a V3?" Answer: the diagnosis is right (~40 regex families
   police prose because the loop is narrate-first), the fix is NOT a V3 — it's
   generalizing the S48 resolve-then-narrate pattern incrementally (inversion arc).
4. **Foundation plan adopted by the user** → now the workboard Priorities: audit high
   fixes → class-table unification → live-verify S74-S80 in play → inversion stages 1-2
   (AI classifier call; structured JSON mechanics) → reassess stages 3-4.
5. **Planning docs restructured**: workboard rewritten (session-paragraph stack →
   one-line history table; verification mega-bullet → checklist table; audit findings
   table; stale Stubs/Not-Yet-Built entries corrected); decisions.md got the S81 entry
   + a correction note under the S62 entry; prime-directive amended (engine is 5e by
   design / content is portable data); ai-failures.md gained the re-classification gap.
6. **Google-login direction recorded** (previously undocumented plan the user
   confirmed) and two future arcs proposed: **Rules Depth** (bestiary, NPC attacks
   through the roll path, spell resolution table, pacing) and **World Integrity**
   (time as currency, memory ledger + missing secrets write path, procedures as data).
7. **SRD rules ingestion SHIPPED** (user asked to do it now): user-supplied SRD 5.2
   markdown → `scripts/build-rules.js` → 186-entry `data/rules.json` + generated
   `.claude/rules-coverage.md` (24 enforced / 5 partial / 14 gap / 117 inject / 26
   reference). Found and fixed **edition drift**: 16 superseded curated entries were
   teaching the AI 2014 rules the code doesn't enforce (Exhaustion, Surprise,
   Grappling, Hide). Seed v4→v5 reseeds the compendium store. **Needs live check**:
   scene-relevant rules appear in AI rulings, budget behavior with fuller entries,
   Compendium Rules tab rendering on a phone.

---

## Decisions Made
See decisions.md → "Foundation plan adopted — audits, no V3, inversion arc (S81)".

---

## Known Issues / Next Up

- **Next dev session: workboard Priority 1** — the four high/quick audit fixes
  (provider health one-liner, `skipClassifier` one-worder, echo normalization,
  character union-merge). `audit-2026-07-02.md` has file:line + suggested fixes for
  each. The character merge is the data-loss one.
- **Firebase rules (audit #4) needs a user decision** on the sharing model before
  hardening beyond the safe minimum.
- The full live-verification backlog (S56-S80) is now a checklist table in the
  workboard — S74's combat-turn fix remains the highest-stakes unverified item, and it
  should be verified in play **before** inversion work starts.
- The S62 tab-kill character test in that checklist is expected to FAIL until audit #2
  is fixed — don't burn a play session confirming a known-missing fix.
- All three analysis docs live in `.claude/` and are indexed in the workboard's
  Reference Docs table.

---

## Branch State
`claude/app-code-audit-e2e7hj` has: the three analysis docs (committed earlier this
session) + this planning-doc restructure. Pushed. Merge to main whenever the user says
go — docs-only, so it can't break the app.
