# Tinklepebble V2 — Prime Directive

**Two players sit down with their phones, open a browser, and run a full tabletop RPG session without any other tools, books, or setup.**

The AI runs the game. The app constrains the AI.

---

## Content Is Portable — The Engine Is 5e

*(Amended S81 to match reality and intent — see `ruleset-coupling-analysis.md`.)*

**The rules engine is D&D 5e SRD by design, not by accident.** Law 2 enforcement works
*because* the code knows the rules it enforces — death saves, concentration DCs, action
economy, cover math are code, and they stay code. A generic rules interpreter would trade
away the enforcement guarantees this project exists to provide. "Hardcoded compendiums
didn't scale" (V1) was about *content* in code, not rules in code.

**Content, by contrast, is data — all of it.** The system ingests game content —
uploaded files, web references, homebrew, or AI-generated imports. Four input paths:
1. **Files** — parse → structured data → game engine
2. **Web reference** — import from open reference sites
3. **Homebrew** — author directly in-app or markdown
4. **AI-generated** — design on any LLM, export JSON, import

The bar: adding a race, background, subclass, spell, item, or adventure never requires a
code change. (Partially met as of S81 — spells/feats/class progressions/bundles are data;
races/backgrounds/equipment still live in `quickBuild.js`. Closing that gap is on the
workboard.)

System data (spells, classes, feats, settings) survives campaign swap. Campaign data (PCs, world, NPCs, quests, chat, combat) resets cleanly.

---

## Built With Intention

V1 was 29 sessions of discovery — every feature earned its place. V2 is the intentional rebuild: modular, tested, optimized. It's done when a full session runs without the developer needing to fix anything.

The app is the development environment. The developer plays, spots failures, flags issues, fixes state live. Dev tools are first-class play tools, not debug afterthoughts.

---

## Cross-Law Alignment

The five laws reinforce each other:
- **Laws 2 + 5**: Code enforcement is both more reliable AND free. Contract enforcement costs prompt tokens.
- **Laws 1 + 2**: Validation is a step in the core loop, not an afterthought.
- **Laws 4 + 5**: Reference panels are free, AI reference costs tokens.
- **Laws 4 + 3**: All four modes must work on a phone. TTS bridges partial attention.
- **Laws 4 + 2**: Mode determines access. Play/reference show discovered content. Setup/manage show everything.

---

## V1 Lessons

### What broke
- 6,000+ lines in one file — monolith couldn't scale
- Features existed in isolation until bridges were retrofitted
- Play and management UI mixed — everything visible, nothing with clear purpose
- Data lived in multiple places — same field editable from two panels
- Hardcoded compendiums didn't scale
- No field ownership — AI, player, and wizard could all write to same fields
- Lock/unlock editing was cosmetic damage control

### The pattern
The AI follows rules about WHAT to output (format, identity, tracking mechanics). It ignores rules about WHEN to stop (wait, ask first, don't skip). Format compliance is high. Behavioral compliance is low. This is why Law 2 exists — behavioral rules must become code gates, not contract clauses.
