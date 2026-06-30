import { createSignal, For } from 'solid-js';
import { store, setStore } from '../../state/index.js';

export default function GuestCharPick({ onDone }) {
  const [selected, setSelected] = createSignal(
    store.system.playerIdentity?.selectedPCs?.length
      ? store.system.playerIdentity.selectedPCs
      : []
  );

  function toggle(name) {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

  function confirm() {
    setStore('system', 'playerIdentity', 'selectedPCs', selected());
    onDone('done');
  }

  const label = () => {
    const s = selected();
    if (s.length === 0) return 'Select a character';
    if (s.length === 1) return `Play as ${s[0]}`;
    return `Play as ${s.slice(0, -1).join(', ')} & ${s[s.length - 1]}`;
  };

  return (
    <div class="guest-pick-shell">
      <div class="guest-pick-header">
        <h2 class="guest-pick-title">Who are you playing?</h2>
        <p class="guest-pick-hint">Tap your character. You can change this any time in Settings.</p>
      </div>
      <div class="guest-pick-chars">
        <For each={store.campaign.characters}>
          {(pc) => {
            const isSelected = () => selected().includes(pc.name);
            return (
              <button
                class={`guest-pick-char ${isSelected() ? 'selected' : ''}`}
                onClick={() => toggle(pc.name)}
              >
                <span class="guest-pick-avatar">{pc.avatar || pc.name[0]}</span>
                <div class="guest-pick-info">
                  <span class="guest-pick-name">{pc.name}</span>
                  <span class="guest-pick-sub">{pc.race} {pc.class} · Lv {pc.level}</span>
                </div>
                {isSelected() && <i class="ph ph-check-circle guest-pick-check" />}
              </button>
            );
          }}
        </For>
      </div>
      <div class="guest-pick-actions">
        <button
          class="guest-pick-confirm"
          onClick={confirm}
          disabled={selected().length === 0}
        >
          {label()}
        </button>
        <button class="guest-pick-new" onClick={() => onDone('add')}>
          <i class="ph ph-user-plus" /> Add a new character
        </button>
        <button class="guest-pick-skip" onClick={() => onDone('skip')}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
