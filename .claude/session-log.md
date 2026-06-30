# Session Log — Handoff

## Session 57 · 2026-06-30

Branch `claude/latest-test-analysis-v64a6i` · committed, pushed.

### What Shipped

User said "do two and three while i test," authorizing autonomous work on workboard Priorities #2 (unguarded nested-field audit) and #3 (classifier coverage expansion) while live-testing the S56 invite-link fixes in parallel.

**Priority #2 — audit, completed.** Broad grep for unguarded `.field.(map|filter|find|some|every|forEach|reduce|length)(` across `src/ui/**/*.jsx`, triaged candidate by candidate against each field's default shape and ingestion path. Found and fixed one real gap: `restoreQuickActions()` (`data/keys.js`) wrote a restored `localStorage` config straight into `store.system.settings.quickActions` with only a truthy check — no shape healing, unlike every `campaign`-store ingestion point (which all go through `healArrays()`). A config missing `active`/`custom` would crash `QuickActions.jsx`. Fixed by merging the restored config over `DEFAULT_SYSTEM.settings.quickActions` and coercing `active`/`custom` back to arrays. All other candidates (Rewind.jsx, Chat.jsx, TurnPrompt.jsx, SituationBar.jsx, Combat.jsx, QuickActions.jsx, Journal.jsx, Cargo.jsx, CharCreate.jsx, CampaignConfig.jsx, DevTools.jsx, LevelUp.jsx) traced safe — see decisions.md "Priority #2 audit (S57)" for the full list and reasoning.

**Priority #3 — scoped small win.** Investigated "expand classifier coverage" in depth: confirmed the documented "classifier skips combat" decision is deliberate (decisions.md, Game Loop S48) and left it alone. Saving throws already resolve through the existing `roll_request`/`RollBar.jsx` path — not a gap. The one real gap (PC attack rolls / critical-hit doubling) needs a new structured attack-roll mechanic and an NPC-stats data model expansion (NPCs currently have no ability scores or attack/save bonuses in `combatState.initiative`) — architecturally significant, so per CLAUDE.md Standing Permissions it was **not** built without checking in first; it's the same unbuilt item as Priority #1's Critical Hits. Instead shipped the safe, prompt-only piece: a "CONTESTED CHECKS" section in `contracts.js` instructing the AI to narrate the NPC's side of an opposed check itself and feed that roll as the `dc` of a normal PC `roll_request` — gets code-resolved contested checks (grapple, opposed Stealth, etc.) with zero new code.

**Live test results arrived mid-session** — user sent two campaign exports (host + guest) from a real two-device invite-link test. Compared them directly: `campaign.id`, full character state, and all 24 narrative messages were byte-identical except the expected per-device `updatedAt` timestamp. **The S56 `shareInvite()` fix is confirmed working live** — the "Campaign not found" investigation is closed.

The same test transcript surfaced a new, real bug: a player typed "I'm not at all distinct in chat from [the other player]" mid-game. Traced it — `messages.js` has always set `playerName` on every player message, but `Chat.jsx`'s renderer never displayed it (`grep playerName Chat.jsx` was empty). Fixed: added a name label above a player message's bubble, gated on `msg.type === 'player' && msg.playerName && store.campaign.characters.length > 1`. Gated on party size rather than `multiplay.role` because the host's own `role` field stays `'solo'` forever even with guests connected — only the joining device ever flips to `'guest'`, so it's not a reliable "multiple humans" signal. Party-size gating also covers the legitimate single-device multi-PC mode (`playerIdentity.mode: 'multi'`) and shows nothing for the common solo single-PC case.

**Critical Hits / PC attack-roll enforcement — shipped same session.** User asked to scope it before building (per earlier scoping pass); re-investigation found the gap smaller than previously thought — `RollBar.jsx` already had unused attack-roll infrastructure (`isAttackRoll()`, attack-bonus resolution, condition-aware advantage/disadvantage). The real gap was a missing `contracts.js` instruction telling the AI to route PC attacks through `roll_request` instead of self-narrating. User then asked directly whether Law 2 was relevant — yes: attack resolution (d20+bonus vs AC, known damage dice) is fully deterministic, same category as skill checks, so the original "AI-reported damage + confirmed crit flag" plan was a partial cop-out that still trusted the AI to double dice correctly. Revised to full code-computed damage where a formula is known. Shipped: new "ATTACK ROLLS" `contracts.js` section (PC attacks → `roll_request: Attack|AC|PCName`); `RollBar.jsx` `submitAll()` now code-determines HIT/MISS/CRITICAL HIT/CRITICAL MISS (nat 20 always hits+crits, nat 1 always misses, regardless of total) and rolls+doubles weapon damage via new `parseDamageFormula()`/`rollDamage()` reading `pc.attacks[0].damage`; `engine.js`'s `resumeAfterRolls()` and `contracts.js`'s PREDETERMINED ROLLS/CRITICAL HITS sections updated to match; RollBar UI shows "AC" instead of "DC" for attacks and the pass/fail color now respects the nat-20/nat-1 override. Falls back to AI-reported damage only when no stored formula exists (spells, improvised weapons). NPC attacks against PCs unchanged — still AI-rolled/narrated. Known follow-up, not addressed: `pc.attacks[0]` is always used, no weapon/attack selection for PCs with multiple distinct attacks. See decisions.md "PC Attack Rolls / Critical Hits — code-enforced (S57)".

**Doc maintenance (same session)** — session-log.md had grown to 294 lines / 7 full session writeups (S51–S57), violating the Session Protocol's "overwrite with fresh handoff" instruction. Trimmed back down to this single entry; every prior session's substantive decisions already live permanently in `decisions.md`, which is the system of record for "why," not this file. `workboard.md`'s Known Issues section also had its lint cleared of fully-resolved struck-through bullets for the same reason.

### Decisions

See `decisions.md` → "Priority #2 audit (S57)", "Player name not shown in multiplayer chat (found via live S57 test transcript)", "Priority #3 small win (S57) — contested-check contract guidance", "PC Attack Rolls / Critical Hits — code-enforced (S57)", and the live-retest-result note appended under "Invite-link 'Campaign not found' investigation".

### Verification

- `npm test` — 57/57 passing (re-verified after the attack-roll work too).
- `npm run build` — succeeds, no new warnings.
- The invite-link fix specifically got real live two-device verification this session (see above) — the first S55-onward fix to get that. Everything else shipped this session (`restoreQuickActions()` healing, chat name label, contested-check contract text, attack-roll/Critical Hits enforcement) is verified via `npm test`/`npm run build` only, not live play yet.

### Known Issues

- Cover, Action Economy enforcement, Charmed/Deafened/Grappled roll-time enforcement — feature-sized SRD gaps, tracked in workboard.md, not started.
- S56's partial-message healing fixes, S56's mechanics-pipeline routing fixes (DC cap, CharSheet HP override), this session's `restoreQuickActions()`/chat-name-label fixes, and this session's attack-roll/Critical Hits enforcement still don't have their own live re-test — only the invite-link fix got one this session. The attack-roll work especially needs a live combat session to confirm the AI reliably emits `roll_request: Attack|...` instead of self-narrating.
- `pc.attacks[0]`-only attack/weapon selection (no UI or AI signal for which attack a PC is using) — pre-existing limitation, surfaced again during the attack-roll work, not fixed.

### Next Up

1. Live-test the still-unverified S56/S57 fixes, especially the new attack-roll/Critical Hits enforcement in a real combat: reload/background mid-stream (partial-message healing), CharSheet manual HP buttons with temp HP/concentration active, a concentration save near DC 30, multi-PC chat to confirm the new name labels render correctly, the Quick Actions panel after a localStorage restore, and a PC attack to confirm the AI emits `roll_request: Attack|...` and the HIT/MISS/damage text narrates well.
2. Carried-over priorities — deadline July 11 (see Priorities in workboard.md): Action Economy enforcement, Cover, AI DC determination, Scene transition gate, Rest buttons on CharSheet, CI database-rules deploy.
3. Still open: whether to merge `claude/latest-test-analysis-v64a6i` to `main` (asked, not yet answered as of end of S57).
