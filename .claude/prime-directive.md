# TINKLEPEBBLE V2 — PRIME DIRECTIVE
## Mobile AI Virtual Tabletop — Development Mandate
*Established 2026-06-20*

---

## WHO WE ARE

A family building a phone-native AI virtual tabletop. Two players now, expandable to 6-7. No human DM. No books on the table. No subscription. Open a browser and play.

V1 was 29 sessions of discovery — 50+ features, 25 sessions of gameplay, every AI failure mode documented and patched. V2 is the intentional rebuild: same vision, better engineering. Every feature earned its place in v1 before it gets rebuilt in v2.

---

## THE PRIME DIRECTIVE

**Two players sit down with their phones, open a browser, and run a full tabletop RPG session without any other tools, books, or setup.**

The AI runs the game. The app constrains the AI.

---

## THE FIVE LAWS

**1. The core loop is sacred.**
Player acts → AI narrates → mechanics parse → validate → state updates → devices sync. Play never stops — if sync fails, the session continues locally and reconciles when connection returns.

**2. The container is the contract.**
V2 encodes AI failure modes as architecture — validation layers, structured output, state guards — so the AI *can't* break rules, not just *shouldn't*. If it can be enforced in code, it must be. What code can't enforce, contracts handle — but the contract list should shrink, not grow. If a contract keeps getting violated, that's a signal to find a code constraint. Prevent first, recover second — when enforcement fails, the player can rewind.

The container gates information, not just mechanics. Imported module content is available to the AI but hidden from players until discovered through play. Setup and manage modes show everything; play and reference modes show only what's been earned.

State fields have owners — AI (via mechanics), player (via editors), or system (via wizards). No field is writable by more than one owner. The container enforces ownership, not just AI behavior.

**3. Mobile only. Eyes-free when needed.**
Portrait mode, one-handed, mid-session. No desktop fallback. TTS is a play feature — the session can be listened to, not just read. The player checks in and out of active play while managing real life. The app accommodates partial attention, not just full focus.

**4. One experience, not many features.**
Four modes: **setup**, **play**, **reference**, and **manage**. Setup is the onramp — Session Zero, character creation, content import, campaign launch. Done once, mostly locked after. Play is the session — chat, combat, dice, state surfacing where you already are. Reference is mid-session orientation — "where are we, who's here, what do I know, what can I cast" — fast, read-only, one tap away. Manage is between sessions — contract tuning, session review, data fixes. Every feature belongs to one. Every piece of data has one home — no field, tracker, or setting lives in two places.

Adding a player is a setup action, not a rebuild — share a link, sync content, create a character, play. A child-friendly view simplifies the interface for young players (ages 7-16): bigger targets, less text, guided choices. Features appear when they have content, not before. If the AI mentions a location, the journal updates *and the player sees it happen*. If a quest is given, it surfaces in the chat, not buried in a tab. Players should never need to know where to look — the app guides them to the right tool at the right moment. Features that exist but aren't discovered are dead weight. Surface changes where the player is — don't notify *about* changes somewhere else. Mode transitions should have appropriate friction — reference is a glance, manage is intentional.

**5. Zero cost to play.**
Free APIs, free hosting, free sync — no paid tiers, no exceptions. Never depend on a single provider. The system prompt is a budget — game state grows every session, the architecture must keep the prompt lean as the world expands. Memory is a feature: session summaries, pruned chat, and context injection ensure the AI remembers what matters without exceeding free-tier limits.

Three tiers of data:
- **Firebase** — game state that changes during play: HP, quests, inventory, chat, combat positions
- **Local (IndexedDB)** — reference content that doesn't change during play: spell compendiums, class data, feat databases, imported module text, parsed books
- **Shared bundles** — one player imports content, app generates a shareable pack, other player imports it. Firebase carries "player 2 has content pack X," not the content itself

The AI narrates and runs the game, nothing else. If the app can do it without an API call, it must. Free paths first, AI when you're already talking.

---

## CONTENT IS PORTABLE

The system ingests any game content — uploaded files (PDF, epub, mobi), web references, homebrew, or AI-generated imports. Compendiums, spell lists, class data, and adventure modules are populated by the user's content, not hardcoded. D&D 5e is the primary system, not the only one.

### Four input paths:
1. **Files you own** — PDF, epub, mobi → parse → structured data → game engine
2. **Web reference** — import from open reference sites into local compendium
3. **Homebrew** — author directly in-app or in markdown
4. **AI-generated** — design on any LLM, export structured JSON, import into app

### Campaign portability
Campaigns are self-contained. System-level reference (spells, classes, feats, rules) persists across campaigns. Campaign data (characters, world, history) resets cleanly. Starting a new campaign means importing new content, not rebuilding the app.

- **System data** (survives campaign swap): spell compendiums, class progressions, feat databases, app settings, player preferences, AI contract rules (D&D mechanics enforcement)
- **Campaign data** (reset on swap): PCs, world state, NPCs, quests, chat history, combat, treasury, module episodes, session archive, campaign-specific contracts (persona, tone)

---

## BUILT WITH INTENTION

V1 was 29 sessions of discovery. V2 is the intentional rebuild — modular, tested, optimized. The architecture supports portability: any game content in, structured data out. Every feature earned its place in v1 before it gets rebuilt in v2.

V2 is built to last. If it needs a V3, the architecture supports evolution — but the goal is a finished product, not a perpetual prototype. It's done when a full session runs without the developer needing to fix anything. The developer is a player, the session is the test environment, and the app improves every time it's played. Dev tools are play tools. V1 stays live for the other player while V2 is built and tested. No migration pressure — V2 launches when it can run a full session.

The app is the development environment. The developer plays alongside the other player, spotting failures, flagging issues, and fixing state live. Dev tools aren't hidden behind mode friction — they live inside play. The `//` command line, the flag system, the rewind stack, the contract verifier are first-class play tools, not debug afterthoughts. The app gets better every session because the developer is in every session.

The Five Laws live in `CLAUDE.md` where they auto-load every session — the development AI can't drift from rules it reads every time. The full directive, V1 lessons, and design history stay in `prime-directive.md` as deep reference, read when decisions need grounding, not every session. Session handoff and active work load at startup; everything else loads on demand. The development AI has the same memory problem as the game AI — the docs are the fix for both.

The developer is not a software engineer — they're a player who learned to build by building. The AI fills the experience gap: anticipating pitfalls, catching architectural problems before they ship, surfacing solutions the developer wouldn't know to look for. The workboard defines what to build, but the AI is expected to go beyond it — connecting features, hardening edge cases, and adding small wins that serve the Five Laws. Unplanned additions are welcome when they clearly serve the product; they're flagged so the developer can review. The laws are the boundary for improvisation, not the workboard.

---

## V1 LESSONS — WHAT WE KNOW

### What held up
- The core loop (type → respond → parse → update → sync)
- AI contracts as enforcement, not documentation — every rule earned through failure
- Mobile-first as a hard constraint
- Tappable mechanic pills, quest tracker bar, contextual links — connecting features to the play loop works

### What broke
- 6,000+ lines in one file — monolith couldn't scale
- Features existed in isolation until bridges were retrofitted
- Play and management UI mixed together — everything always visible, nothing with clear purpose
- Data lived in multiple places — same field editable from two panels, stale copies
- Hardcoded compendiums (SPELL_DB, FEATS_DB) — didn't scale, couldn't ingest user content
- PDF parsing was fragile — web content import didn't exist
- 5 dense contract textareas because the architecture couldn't enforce rules the contracts described
- No field ownership — AI, player, and level-up wizard could all write to the same fields, causing corruption (SHEET_FIELDS rule was a band-aid)
- Lock/unlock editing was damage control, not design — accidental mid-session edits broke game state

### The AI failure record
See `.claude/ai-failures.md` — full audit trail of every documented AI failure from v1, categorized by enforcement type (code-enforceable vs contract-only). That file is the development reference for Law 2.

---

## CROSS-LAW ALIGNMENT

The five laws reinforce each other:
- **Laws 2 + 5**: Code enforcement is both more reliable AND free. Contract enforcement costs prompt tokens. Enforce in code first.
- **Laws 1 + 2**: Validation is a step in the core loop, not an afterthought. Parse → validate → update.
- **Laws 4 + 5**: Reference panels are free, AI reference costs tokens. Free paths first.
- **Laws 4 + 3**: All four modes must work on a phone. TTS bridges partial attention — play doesn't require constant screen focus.
- **Laws 4 + 2**: Mode determines access. Play/reference show discovered content only. Setup/manage show everything. Field ownership enforced per mode.

---

## OPEN QUESTIONS
- **Child-friendly view scope** — Ages 7-16 is a wide range. A 7-year-old needs icons and guided choices; a 16-year-old uses the full interface. What's the target? Simplified action picker? Read-aloud mode with TTS? Reduced UI that hides management complexity? Needs design based on actual play with the child.

---

## THE GOAL

A session terminal so complete that opening a browser is all that's needed. The architecture constrains the AI. The content pipeline feeds it. The UI guides players through the session without asking them to manage the game. Play feels like play. Management feels intentional, not like homework. A full session runs without the developer needing to intervene — that's when it's done.
