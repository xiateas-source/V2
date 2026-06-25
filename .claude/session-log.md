# Session Log — Handoff Note

## Session 47 · 2026-06-25 — Rules audit, Contracts editor, gameplay mechanics elevation

**Theme:** Law 2 compliance audit cross-referencing D&D 5e rules against codebase enforcement. Built the DM Contracts editor. User elevated gameplay mechanics (carrying capacity, resistance/vulnerability, critical hits, spell components, distance/time) from "cosmetic enrichment" to "important — they make it fun."

Branch `claude/character-sheet-familiar-tab-2u3wsw` @ `46b6e36`. Build clean. Tests 33/33. **Merged to main.**

### Shipped

**DM Contracts Editor (`Contracts.jsx`, 101 lines):**
- 7 accordion sections: persona, prohibitions, pacing, continuity, multi-player, module fidelity, DM secrets
- Each section: expand/collapse, textarea editor, modified dot indicator, empty tag for blank sections
- Reset-to-default button for the 5 seeded sections (persona/never/actions/continuity/multi)
- Writes to `store.campaign.contracts` → flows into `buildContracts()` → system prompt
- Accessible from Settings → Campaign section → "DM Contracts" button (scroll icon)
- Settings.jsx uses reactive `<Show>` to swap between settings and contracts views

**Rules-vs-Code Enforcement Audit:**
- Cross-referenced `playingthegame.md` and `rulesglossary.md` against codebase
- Found 16 hard-enforced rules (state ownership, HP/gold/items, roll delegation, turn order, drift detection, spell slots, scene transitions, concentration, temp HP, attunement limit)
- Found 14 soft-enforced rules (action economy, advantage/disadvantage, cover, opportunity attacks, movement, rests, carrying capacity, conditions, massive damage, critical hits, resistance/vulnerability, spell components, proficiency)
- Full audit preserved in plan file

**Workboard Accuracy Corrections:**
- MechPill.jsx (50 lines, built), PreviouslyOn.jsx (86 lines, built), Rewind.jsx (217 lines, built), DiceRoller.jsx (38 lines, built) — all marked as stubs but actually built
- Ask DM interception built in engine.js, term-glossary linking built in Chat.jsx (346-360), spell citation linking built in Chat.jsx (328-344)
- CampaignConfig.jsx (375 lines) has 3 real paths (Fresh/Adventure/BookUpload) — not stubbed

### Decisions made
- Gameplay mechanics (carrying capacity, resistance/vulnerability, critical hits, spell components, distance/time) are NOT low-priority enrichment — user says they "make the game harder for the player, gives them mechanics to think about. they make it fun"
- Contracts editor lives as a sub-view within Settings (not a separate manage mode page)
- `actionsUsed` flags exist in combatState but enforcement not yet wired to Gate 2

### Known issues / watch
- Workboard still has stale entries (items marked stub/absent that are actually built) — needs update
- Still not play-verified with a live AI session
- Action economy enforcement gap: `actionsUsed` flags exist but aren't checked by any gate

### In progress
- Nothing in progress — clean handoff.

### Next up (user-prioritized)
1. **Gameplay mechanics features** (user elevated these):
   - Carrying capacity (STR × 15, tracked against inventory weight)
   - Resistance/vulnerability tracking on characters and enemies
   - Critical hit enforcement (extra dice)
   - Spell component requirements checking
   - Distance/time tracking during travel
2. **Action economy enforcement** — wire `actionsUsed` flags to Gate 2
3. **Rest buttons** on CharSheet Vitals tab
4. **Update workboard** — correct 8+ items listed as stubs that are actually built
5. **Session Review** (`SessionReview.jsx` stub)

### Branch state
`claude/character-sheet-familiar-tab-2u3wsw` @ `46b6e36`; **merged to main.**
