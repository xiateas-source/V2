# Session Log — Handoff Note

## Session 35 · 2026-06-21

### Shipped
- **Setup Mode wizard** — Full 3-step onboarding (API key → character → campaign)
  - `KeyGate.jsx` — API key validation with Gemini test call
  - `CharCreate.jsx` — Three equal paths: AI chat builder, JSON paste import, Quick Pick (class/race/level)
  - `CampaignConfig.jsx` — Three paths: Fresh Campaign (name/setting/style + AI brainstorm), Load Adventure (5e.tools JSON), Upload Book (PDF/epub with AI structuring)
  - `PlayerOnboard.jsx` — Wizard shell with step dots, navigation, "Start Adventure" button
  - `adventureParser.js` — 5e.tools adventure JSON parser (extracts chapters, NPCs, locations, sets module contract)
  - `fileParser.js` — PDF/epub text extraction (pdf.js CDN + fflate for epub zip)
  - `chunkSplitter.js` — Chapter boundary detection for book parsing
  - `quickBuild.js` — Auto-populate character from class/race/level (standard array, class-optimal abilities)
  - `normalizer.js` — Rewritten with format detection (native/generic-ai/dndbeyond/minimal/fuzzy), field aliasing, merge with defaults
  - `setupPrompts.js` — AI system prompts for char builder, campaign brainstorm, content structuring
  - App.jsx now shows `<PlayerOnboard />` when no campaign ID exists
  - Discovery gating: imported chapters have `discovered: false`, only first chapter active
- **Gate 1: Roll confirmation** — Flags AI resolving PC rolls in prose without roll_request
- **Gate 2: Combat turn enforcement** — Flags wrong-turn actions and multi-action violations, auto-advances turn
- **Gate 6: Spell validation** — Flags unknown spells and missing slot levels
- **Gate 7: Skill check requirement** — Flags action resolutions without player rolls (10 action-to-skill mappings)
- **Gate 8: XP audit** — Flags missing XP after quest_done/combat_end/chapter_add
- **Gate 9: Income/loot reconciliation** — Flags treasure items without gold value mechanic
- **Multi-player toggle** — ContextBanner mode switch (solo/multi), triggers Previously On handoff recap
- **Player-aware Gate 5** — In multi-player, only flags PCs belonging to current player
- **Conditional auto-scroll** — Chat no longer yanks scrolled-up readers; "N new messages" floating pill indicator

### Decisions Made (Session 35)
- Setup wizard uses three equal path cards (no assumed preference) for both character creation and campaign config
- PDF/epub parsing uses CDN-loaded libraries (pdf.js, fflate) with `@vite-ignore` dynamic imports
- Adventure import sets module contract automatically: "Follow the published adventure structure"
- Discovery gating is code-enforced: only `discovered: true` content enters prompts
- Multi-player toggle lives in ContextBanner (always visible, one tap)
- Gate flags render as colored pills on DM messages (red for gates 1/6/7, orange for gate 2/8/9)
- All gates are advisory (flags, not blocks) — player sees the flag and can accept or dismiss

### Known Issues
- No push notifications
- ElevenLabs TTS not integrated
- Citation linking (PHB page references) not built
- `saveKeys()` in KeyGate now passes explicit args (fixed from session 34)
- file-upload-btn CSS may need fine-tuning for different themes
- Gate 7 only catches first matching skill action (breaks after first flag to avoid noise)

### In Progress
- Nothing mid-task — clean stopping point

### Next Up
1. **Play-test the setup wizard** — fresh app load end-to-end
2. **Citation linking** — auto-link PHB references in AI responses
3. **Push notifications** — Web Push for multi-player awareness
4. **Checkpoint/rewind** — state snapshots at key moments
5. **Rest buttons on CharSheet** — short/long rest as system operations
6. **Level-up wizard** — triggered from XP threshold glow

### Branch State
- Branch: `claude/session-start-protocol-o8jf7j`
- Last commit: 7367038
- All code committed and pushed
- Not merged to main
- 6 commits this session
