# Ruleset Coupling Analysis — 2026-07-02

Question: how deep does 5e go, and should rules become data? Analysis only — no code
changed. Companion to `audit-2026-07-02.md`, same branch. Includes the bundle-AI-builder
update merged from main today.

---

## Plain-language summary

The app is not "5e content on a generic engine," and it is also not "5e welded into
everything." It's three layers, and they need different answers:

1. **Content that is already data.** More than the workboard gives V2 credit for:
   spells, feats, XP thresholds, maneuvers, rules text, and — importantly — the entire
   per-level class progression (features, subclass choices, ASI levels, spell slots per
   level) live in `data/*.json`, get seeded into IndexedDB, and the level-up wizard
   *reads* them. LevelUp.jsx is ~1,240 lines, but most of it is a generic wizard that
   derives its steps from that JSON. The prime directive's "system data survives
   campaign swap" is genuinely half-built.

2. **Content that is trapped in code — the real V1 repeat.** `quickBuild.js` (~880
   lines) hardcodes races, backgrounds, starting equipment, skill lists, personality
   tables, point-buy costs, and a `CLASS_DATA` table (hit dice, saves, starting AC,
   attacks, spell-slot tables). None of it is logic — it's tables that happen to be in
   a .js file. Worse: the spell-slot and hit-die tables are **duplicated** — once in
   `CLASS_DATA`, once per-level in the `level-up-*.json` files. Two sources of truth
   for the same rule is exactly the "data lived in multiple places" V1 lesson.

3. **The engine, which has 5e in its bones.** The character schema itself
   (`abilityScores` with six named stats, `spellSlots`, `hitDice`, `deathSaves`,
   `exhaustion`, `ac`), the field-ownership map, every mechanics handler
   (concentration DC = half damage capped at 30, death saves 3-and-3, massive damage,
   resistance halving, cover +2/+5, long rest restoring half hit dice), the roll bar's
   entire d20 model (advantage, nat 20/1, proficiency formula, condition effects),
   the gates' regexes (5e skill names, action economy), the classifier's 18 patterns,
   and the AI contract vocabulary. This is not a module — it's the domain model, and
   the app's most live-tested code.

**The pipeline shape (extract → validate → apply → gates) is system-agnostic; the
pipeline contents are not, and there is no seam where a "ruleset object" could be
plugged in.** Every layer imports 5e specifics directly.

---

## 1. The coupling map, concretely

### Already data (engine reads it — no change needed)
| What | Where |
|---|---|
| Spells, feats, maneuvers, XP thresholds, rules text, glossary | `data/*.json` → `seed.js` → IndexedDB |
| Per-level class progression: features, subclass options, ASI/spell/expertise choices, slots per level | `data/level-up-*.json` (12 files) → IndexedDB `classData` |
| Level-up flow | `LevelUp.jsx` derives steps from `classData` JSON; `getClassFeatures()` in quickBuild reads it too |
| Campaign content packs | S80 bundles: schema, validator, IndexedDB, AI injection, import UI |

### Content trapped in code (could become data with no engine redesign)
| What | Where | Size |
|---|---|---|
| `CLASS_DATA` (hit die, saves, proficiencies, starting AC/attacks, slot tables, spells/cantrips known) | `quickBuild.js:27-235` | ~200 lines — **partly duplicates level-up JSONs** |
| `STARTING_EQUIPMENT` | `quickBuild.js:236-592` | ~350 lines |
| Races (bonuses, speed, languages), backgrounds, class skill choices, skill lists/descriptions, personality tables, point-buy, standard array | `quickBuild.js` remainder | ~300 lines |
| Skill→ability maps (duplicated twice more) | `RollBar.jsx:5`, `gates.js:297`, `classifier.js` patterns | small but triplicated |

### Engine — 5e baked into resolution logic (would need real redesign to generalize)
| What | Where | 5e-ness |
|---|---|---|
| Character schema + ownership map | `state/campaign.js` (`DEFAULT_CHARACTER`), `state/store.js` (`OWNERSHIP`) | field names ARE 5e concepts; every UI file reads them |
| Mechanics vocabulary + handlers | `mechanics.js` (~60 `KNOWN_KEYS`, dispatch table) | concentration DC math, death-save rules, massive damage, resist/vuln/immune multipliers, cover bonuses, rest rules, attunement cap |
| Roll resolution | `RollBar.jsx` | d20 core: adv/dis, crit rules, proficiency formula, per-condition roll effects, exhaustion penalty |
| Gates | `gates.js` | Gate 2 action economy, Gate 6 spells/slots, Gate 7 skill regexes |
| Pre-send classifier | `classifier.js` | 18 patterns → 5e skills, DC tiers |
| AI contract | `contracts.js` `MECHANICS_FORMAT` | teaches the AI the 5e mechanic vocabulary |
| Play UI | `CharSheet.jsx` (6 tabs), `CharDrawer`, `TurnPrompt`, `QuickActions`, `Combat.jsx` | render/act on the 5e schema directly |

Generic chassis (genuinely system-agnostic today): sync/persistence/Firebase, chat +
streaming + provider failover, message model, bundles, themes/TTS/settings, the gate
*framework* (flags attached to messages), drift-detection *framework*, rewind.

---

## 2. The options

### (a) Full redesign — rules as a "ruleset definition" the engine interprets
Everything in the third table changes: schema becomes ruleset-defined, the dispatch
table/validators/gates/roll bar become interpreters of ruleset data, ownership becomes
data, the AI contract is generated per ruleset, and every UI surface that renders
character fields becomes schema-driven. That's 15+ files including the five biggest in
the app, and it rebuilds precisely the code with the deepest live-testing pedigree.

**Realistic scope: 25-40 sessions**, most of it re-earning correctness the current code
already earned. **The biggest way it goes wrong:** the sprint's entire Law 2 record —
S57 attack rolls, S67 action economy, S68 hit dice, S69 cover, S71/S74 batch rejection
rules, S74 turn holding, each one a fix for a real observed AI failure — has to be
reproduced *inside an interpreter*, and an interpreter bug regresses them silently. You
would spend months in a state where combat sometimes works, with no user-visible payoff
until a second ruleset exists — which no player at this table has asked for. It also
fights Law 5: a generic rules interpreter needs a bigger, generated AI contract.
A cheaper "generic" variant — freeform systems with AI-only adjudication — exists but
sacrifices Law 2 entirely, which is the project's founding lesson. Not recommended.

### (b) Partial — mechanics stay 5e code; *content* becomes fully data
Finish what's half-built. Move quickBuild's tables into `data/*.json` alongside the
level-up files; kill the CLASS_DATA/level-up-JSON duplication (one source of truth for
slots and hit dice); have character creation read IndexedDB the way level-up already
does; then extend the S80 bundle schema so bundles can carry system-content types
(races, backgrounds, equipment packs, subclasses, homebrew spells) — at which point
all four prime-directive input paths (file, web, homebrew, AI-generated JSON) work for
character-facing content through the import pipeline that already exists and validates.

New 5e content — a homebrew race, a subclass, an equipment pack, a spell — stops
requiring code changes. That is the actual promise prime-directive.md made.

**Blast radius:** character creation and level-up only. Combat, mechanics, gates,
sync — untouched. Both areas have recent test coverage (S76's import tests, level-up
tests) and clear live-verification paths.

### (c) Accept 5e-only and say so
Cheapest and partly correct regardless: the *mechanics engine* is 5e-by-design, and
pretending otherwise in the prime directive invites a future session to "fix" it with
option (a). But (c) alone overshoots — it would also write off the content-portability
promise that is already half-delivered and cheap to finish, and it leaves the V1
"hardcoded compendiums" lesson genuinely repeated in quickBuild.js.

---

## 3. Recommendation: (b), plus (c)'s honesty applied to the engine layer

Do (b) for content; amend prime-directive.md to state plainly that the **rules engine
is D&D 5e SRD by design** — Law 2 enforcement works *because* the code knows the rules
it enforces — while **content is portable data**. That makes the doc true, closes the
V1 repeat where it actually repeated (tables in code), and doesn't bet the sprint's
most battle-tested code on an interpreter rewrite nobody's play needs.

**Scope: 5-7 sessions**, each independently shippable:
1. *(15 min, this can happen any time)* Amend prime-directive.md — engine vs content
   distinction, so no future session re-litigates this.
2. *(1 session)* Unify the duplicated class tables: slot tables/hit dice live only in
   `level-up-*.json`; `CLASS_DATA` shrinks to creation-only data. Tests assert the two
   old sources agree before deletion. **Do this first — it's the live data-integrity
   hazard.**
3. *(2 sessions)* Move quickBuild's remaining tables (races, backgrounds, equipment,
   skills, personality) to `data/*.json` + seed entries; creation wizards read
   IndexedDB. Behavior-identical, snapshot-testable.
4. *(1-2 sessions)* Extend the bundle schema with system-content types (race,
   background, equipment pack, subclass, spell) riding the existing S80
   validate/import/store path; creation UIs list bundle-provided entries alongside SRD.
5. *(1 session)* Live verification + docs (workboard, decisions, ai-failures if a gate
   is touched — none should be).

Sequencing note: don't start step 3 while the audit's sync findings (#1/#2 in
`audit-2026-07-02.md`) are unfixed if multiplayer playtests are running — unrelated
code, but you don't want two "why did my character change?" suspects live at once.
