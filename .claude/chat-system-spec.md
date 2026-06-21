# V2 Chat System Spec

## Architecture: Two Tabs

| Tab | State Key | AI Involvement | Purpose |
|-----|-----------|----------------|---------|
| **Narrative** | `narrative[]` | Full pipeline (buildPrompt → 9 gates → parseMechanics) | The game. Player actions in, DM narration + mechanics out. |
| **OOC** | `ooc[]` | Selective via Ask DM (advisory prompt, no mechanics) | Table talk, strategy, rules questions, session coordination. |

No echo between tabs. Nav badge (gold dot) on inactive tab when new messages arrive. Badge clears on tab view.

---

## Message Data Structures

### Base Message
```ts
interface BaseMessage {
  id: string;           // unique: 'nar_' | 'ooc_' + timestamp + random
  type: MessageType;
  content: string;
  ts: string;           // wall clock HH:MM
  gameTs?: string;      // in-game time from worldData
  playerName?: string;  // who sent it (multi-player)
}
```

### Narrative Message Types
```ts
type NarrativeType =
  | 'player'       // player action input
  | 'dm'           // AI narrative response (has mechanics)
  | 'system'       // gate flags, XP receipts, audit trail
  | 'roll_result'  // player-submitted roll via dice UI
  | 'checkpoint';  // auto-checkpoint marker

interface NarrativeMessage extends BaseMessage {
  type: NarrativeType;
  // dm-specific fields:
  mechanics?: ParsedMechanic[];  // extracted mechanic pills
  raw?: string;                  // pre-strip content (before _MECH_KEYS removal)
  partial?: boolean;             // true while streaming, removed on complete
  // system-specific fields:
  systemKind?: 'gate_flag' | 'xp_receipt' | 'audit' | 'scene_hold_resolved' | 'combat_event';
  // roll_result-specific:
  roll?: { skill: string; pc: string; result: number; dc?: number; outcome?: string };
}
```

### OOC Message Types
```ts
type OOCType =
  | 'player'       // player text
  | 'dm_advisory'  // Ask DM response (no mechanics, no state changes)
  | 'system';      // notifications (e.g., "Firebase synced", "player joined")

interface OOCMessage extends BaseMessage {
  type: OOCType;
  partial?: boolean;  // Ask DM responses stream too
}
```

### Parsed Mechanic (for pills)
```ts
interface ParsedMechanic {
  key: string;      // 'hp' | 'gold' | 'xp' | 'location' | etc.
  value: string;    // raw value string
  target?: string;  // PC name if applicable
  applied: boolean; // whether state was updated
}
```

---

## Rendering Pipeline

### Narrative Tab
1. Player sends action → push `{ type: 'player' }` → render immediately
2. AI stream begins → push `{ type: 'dm', partial: true, content: '' }` → show typing indicator
3. Tokens arrive → append to `content` → re-render last message progressively
4. Stream complete → remove `partial` flag → `parseMechanics(content)` → attach `mechanics[]` → render mechanic pills
5. Gate pipeline runs post-parse → may insert `{ type: 'system', systemKind: 'gate_flag' }` messages
6. State changes applied → save → Firebase sync

### OOC Tab
1. Player sends text → push `{ type: 'player' }` → render immediately
2. If Ask DM tapped → push `{ type: 'dm_advisory', partial: true }` → stream AI response
3. Stream complete → remove `partial` → render final (no mechanics parse, no state changes)

### Rendering Rules
- **Markdown**: bold, italic, line breaks (same as v1)
- **Mechanic pills**: tappable, navigate to relevant UI (inventory, quest, location)
- **System messages**: muted styling, smaller font, no action buttons
- **Player messages**: show playerName, timestamp, action buttons (copy, export, delete)
- **DM messages**: show "Dungeon Master", timestamp, action buttons
- **Partial messages**: show content so far + pulsing cursor indicator, no action buttons until complete

---

## Streaming

```
Player sends → API call begins → streaming response
  ├── Each token → append to message.content → re-render
  ├── Stop button → truncate stream → mark complete → skip mechanics parse
  └── Stream ends → mark complete → parse mechanics → run gates → apply state
```

- **Stop generation**: treats partial content as final. Sets `partial: false`. Does NOT parse mechanics (partial blocks are unreliable — could have half a `hp:` line). Toast: "Response stopped — mechanics skipped."
- **Error during stream**: push `{ type: 'system', systemKind: 'audit', content: 'AI error: ...' }`. Keep whatever partial content was received.
- **Retry**: user taps retry → delete the failed dm message → resend with same context.

---

## Overlays (not chat messages)

These are ephemeral UI elements that appear over the chat, need player action, and disappear when resolved. They are NOT stored in the message arrays.

| Overlay | Trigger | Player Action | On Resolve |
|---------|---------|--------------|------------|
| **Roll Request** | `roll_request:` mechanic parsed | Player submits roll via dice UI | Insert `roll_result` message into Narrative, dismiss overlay |
| **Scene Transition Hold** | Gate 4 detects scene/location/time change | Player confirms or rejects | If confirmed: apply changes. If rejected: inject correction into next prompt |
| **Combat Turn Prompt** | Gate 2: it's this player's turn | Player submits action | Action becomes next `player` message |
| **Unmentioned PC Alert** | Gate 5: AI skipped a PC | DM acknowledges or dismisses | If acknowledged: inject reminder into next prompt |

Overlay state lives in component state (React), not in persisted `state`. If the app reloads mid-overlay, the overlay is gone — the underlying mechanic/gate will re-trigger on next response if still relevant.

---

## Tab Switching & Input Bar

### Layout
```
┌─────────────────────────────┐
│ [Narrative] [OOC •]         │  ← tab bar (• = unread badge)
├─────────────────────────────┤
│                             │
│  chat messages scroll area  │
│                             │
├─────────────────────────────┤
│ [input bar]          [send] │  ← changes per tab
└─────────────────────────────┘
```

### Input Bar Behavior

**Narrative tab:**
- Placeholder: "What do you do?"
- Send button: ⚡ (sends to full AI pipeline)
- Input is always AI-directed (every message goes through buildPrompt)
- Suggestion chips above input (contextual: combat actions, exploration, rest, etc.)

**OOC tab:**
- Placeholder: "Talk to the party..."
- Send button: 💬 (sends as player text, no AI)
- "Ask DM" button: 🧙 (sends last player message to advisory AI)
- Suggestion chips: strategy prompts, "Ask DM" shortcut, common questions

### Tab State
- Each tab remembers its scroll position independently
- Switching tabs does NOT clear input — draft text persists per tab
- Badge appears on inactive tab for any new message (player, dm, system)
- Badge clears when tab becomes active (not on message render — on tab tap)

---

## Chat Export

Both tabs support per-message moment export (⚠️ button).

### Export Format
```
=== TINKLE'S TINCTURES — [NARRATIVE|OOC] MOMENT EXPORT ===
Exported: ISO timestamp
Target message: #N of total
Context window: messages X–Y (Z total)
Location: current location
PCs: name (class level, hp/max HP), ...

--- CONTEXT ---

[timestamp] ROLE:
content
>>> TARGET MESSAGE <<<
***

--- PROMPT FOR DEV ---
Analysis questions...
```

Context window: 5 messages before + 5 after target (11 total). Same pattern as v1.

---

## Firebase Persistence & Multi-Device Merge

### What Syncs
Both `narrative[]` and `ooc[]` sync via Firebase Realtime Database.

### Merge Strategy (clock-independent)
Same algorithm as v1's `_mergeChatHistories()`:
1. Each message has a unique `id` (timestamp + random suffix)
2. On Firebase update: build ID sets from local and remote
3. Messages only in remote → append to local (new from other device)
4. Messages only in local → keep (not yet synced, or deleted remotely — keep wins)
5. Messages in both → keep local version (local edits take precedence)
6. Sort merged array by `id` (timestamp-based, so chronological)
7. Deduplicate by `id`

### Sync Triggers
- After every `save()` call → push to Firebase
- On Firebase `value` event → merge and re-render if changed
- Dirty-edit guard: 3-second window after local edit, ignore remote updates (prevents clobber during rapid input)

### What Does NOT Sync
- Overlay state (roll requests, scene holds)
- Streaming state (partial messages)
- Tab scroll position
- Input draft text
- Active tab selection

---

## Open Questions (need user input)

1. **Message deletion** — Soft delete (mark hidden, keep in array for sync) or hard delete (splice, risk sync conflicts)?
2. **OOC history limit** — Narrative has summarize-and-prune at 75 messages. Does OOC need the same, or is it lightweight enough to keep everything?
3. **Ask DM context** — How much Narrative context does the OOC advisory prompt get? V1 gives it last 8 narrative messages + session summary + ledger. Keep the same?
