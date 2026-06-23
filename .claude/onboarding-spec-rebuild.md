# Onboarding Spec — Rebuild Target

*Reconstructed 2026-06-23 from surviving sources (decisions.md, session-log S37, committed `CharCreate.jsx` / `PlayerOnboard.jsx` / `quickBuild.js`). The fuller onboarding flow was lost in an uncommitted build a deploy overwrote; recovery isn't feasible (mobile-only, no Firebase access). This is the target to rebuild against the working engine — not from memory.*

---

## What survives in git (build ON this, don't rebuild it)
- `PlayerOnboard.jsx` → routes to `KeyGate`, `CharCreate`, `CampaignConfig`. Device-local identity (player name, character selection, single/multi mode).
- `CharCreate.jsx` — race, class, level, **editable name**, **editable backstory / personality / appearance** (restored S37), character chips with **remove** button.
- `quickBuild.js` — `buildCharacter()`, `CLASS_DATA`, `RACE_BONUSES`, `STARTING_EQUIPMENT`, `getStartingGold()`, `AVAILABLE_CLASSES`, `AVAILABLE_RACES`.
- **Hybrid equipment picker** (committed): default pack / customize / take gold.

## What was lost (rebuild these)
1. **Manual stat-rolling** — roll 4d6-drop-lowest (or standard array / point-buy) instead of only auto-generated scores. Player assigns rolls to abilities.
2. **D&D Beyond–style import mapping** — paste/import a character (JSON or D&D Beyond export) and map its fields onto the V2 character shape (system-owned fields via the wizard path). Preserves HP/XP/conditions per the existing per-character JSON-import convention.
3. **Guided multi-step wizard** — the full step sequence, not the single-screen quick build. Steps cross-referenced in the lost build:
   - Identity (name, player name)
   - Race → Class → Subclass
   - Ability scores (choice of: manual roll / standard array / point-buy / quick)
   - Background, alignment, languages
   - Equipment (hybrid picker — already built)
   - Spells (for casters — reads seed/IndexedDB)
   - Bio (backstory/personality/appearance — already built)
   - Review & commit

## Constraints (from the Laws + decisions)
- **System-owned fields** (level, class, abilityScores, spells, slots, etc.) are wizard-only — onboarding is the wizard, so it writes them via `systemSet`. Player fields via `playerSet`. (store.js enforces this.)
- **Mobile only, one-handed, portrait.** Big touch targets. Steps, not a dense form.
- **Zero cost** — ability rolls, point-buy math, equipment, gold are all local/free. No AI call needed to create a character.
- **Multiple creation paths kept:** quick build (exists), guided wizard (rebuild), import (rebuild). One entry, three routes.

## Verification when rebuilt
- A player can create a character three ways (quick / guided / import) on a phone.
- Manual rolling assigns 6 scores to 6 abilities; derived bonuses compute at render (not stored).
- An imported character lands with system fields populated and HP/XP/conditions preserved.
- All writes pass store ownership (no OwnershipError); backstory/personality/appearance persist and sync.
