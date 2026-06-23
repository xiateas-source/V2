import { Show, For, createMemo } from 'solid-js';
import { store } from '../../state/index.js';
import { isSending } from '../../ai/engine.js';

// Combat turn handoff. Derived entirely from synced combatState, so it shows on
// every connected device at once — any player can tap it (the app enforces turn
// ORDER, not which person acts). Hidden while the AI is streaming and during the
// initiative-roll phase (the RollBar owns that window).
export default function TurnPrompt() {
  const combat = () => store.campaign.combatState;

  const awaiting = () => combat().initiative.some(c => c.rollPending);

  const actor = () => {
    const cs = combat();
    return cs.initiative[cs.currentTurn] || null;
  };

  const show = () => {
    if (!combat().active || awaiting() || isSending()) return false;
    const a = actor();
    return !!a && a.type === 'pc' && a.hp > 0;
  };

  const pc = createMemo(() => {
    const a = actor();
    if (!a) return null;
    return store.campaign.characters.find(c => c.name === a.name) || null;
  });

  const quickActions = createMemo(() => {
    const p = pc();
    if (!p) return [];
    const out = [];
    for (const atk of (p.attacks || []).slice(0, 3)) {
      const name = typeof atk === 'string' ? atk : atk.name;
      if (name) out.push({ label: name, text: `${p.name} attacks with ${name} — targeting ` });
    }
    const spells = [...(p.cantrips || []), ...(p.knownSpells || [])].slice(0, 3);
    for (const s of spells) {
      out.push({ label: s, text: `${p.name} casts ${s} — targeting ` });
    }
    return out;
  });

  function prefill(text) {
    window.dispatchEvent(new CustomEvent('prefill-input', { detail: { text } }));
  }

  return (
    <Show when={show()}>
      <div class="turn-prompt">
        <div class="turn-prompt-head">
          <span class="turn-prompt-icon">⚔</span>
          <span class="turn-prompt-name" style={pc()?.color ? { color: pc().color } : undefined}>
            {actor()?.name}'s turn
          </span>
          <span class="turn-prompt-round">Round {combat().round}</span>
        </div>
        <Show when={quickActions().length > 0}>
          <div class="turn-prompt-actions">
            <For each={quickActions()}>
              {(qa) => (
                <button class="turn-action-btn" onClick={() => prefill(qa.text)}>
                  {qa.label}
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}
