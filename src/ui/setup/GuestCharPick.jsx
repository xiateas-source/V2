import { createSignal, For, Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';

export default function GuestCharPick({ onDone }) {
  // 'mode-pick' | 'pick-pc' | 'pick-npc'
  const [screen, setScreen] = createSignal('mode-pick');

  // PC path state
  const [selected, setSelected] = createSignal(
    store.system.playerIdentity?.selectedPCs?.length
      ? store.system.playerIdentity.selectedPCs
      : []
  );

  // NPC ally path state
  const [npcName, setNpcName] = createSignal('');
  const [customName, setCustomName] = createSignal('');

  function togglePC(name) {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

  function confirmPC() {
    setStore('system', 'playerIdentity', 'mode', 'single');
    setStore('system', 'playerIdentity', 'selectedPCs', selected());
    setStore('system', 'playerIdentity', 'npcName', '');
    onDone('done');
  }

  function confirmNPC() {
    const name = (npcName() || customName()).trim();
    if (!name) return;
    setStore('system', 'playerIdentity', 'mode', 'npc');
    setStore('system', 'playerIdentity', 'npcName', name);
    setStore('system', 'playerIdentity', 'selectedPCs', []);
    onDone('done');
  }

  const pcLabel = () => {
    const s = selected();
    if (s.length === 0) return 'Select a character';
    if (s.length === 1) return `Play as ${s[0]}`;
    return `Play as ${s.slice(0, -1).join(', ')} & ${s[s.length - 1]}`;
  };

  const npcLabel = () => {
    const name = (npcName() || customName()).trim();
    return name ? `Join as ${name}` : 'Choose an NPC';
  };

  const npcs = () => (store.campaign.npcs || []).filter(n => n.name && n.name.length > 1);

  return (
    <div class="guest-pick-shell">

      {/* ── Screen 1: Mode picker ── */}
      <Show when={screen() === 'mode-pick'}>
        <div class="guest-pick-header">
          <h2 class="guest-pick-title">Who are you joining as?</h2>
          <p class="guest-pick-hint">You can change this any time in Settings.</p>
        </div>
        <div class="guest-mode-cards">
          <button class="guest-mode-card" onClick={() => setScreen('pick-pc')}>
            <i class="ph ph-user guest-mode-icon" />
            <span class="guest-mode-label">Play a character</span>
            <span class="guest-mode-sub">Pick one of the party's existing PCs</span>
            <i class="ph ph-caret-right guest-mode-arrow" />
          </button>
          <button class="guest-mode-card" onClick={() => setScreen('pick-npc')}>
            <i class="ph ph-mask-happy guest-mode-icon" />
            <span class="guest-mode-label">Join as NPC ally</span>
            <span class="guest-mode-sub">Play a named NPC or companion in the world</span>
            <i class="ph ph-caret-right guest-mode-arrow" />
          </button>
          <button class="guest-mode-card" onClick={() => onDone('add')}>
            <i class="ph ph-user-plus guest-mode-icon" />
            <span class="guest-mode-label">Create new character</span>
            <span class="guest-mode-sub">Build a fresh PC to join the party</span>
            <i class="ph ph-caret-right guest-mode-arrow" />
          </button>
        </div>
        <button class="guest-pick-skip" onClick={() => onDone('skip')}>
          Skip for now
        </button>
      </Show>

      {/* ── Screen 2a: Pick existing PC ── */}
      <Show when={screen() === 'pick-pc'}>
        <div class="guest-pick-header">
          <button class="guest-back-btn" onClick={() => setScreen('mode-pick')}>
            <i class="ph ph-arrow-left" /> Back
          </button>
          <h2 class="guest-pick-title">Which character?</h2>
          <p class="guest-pick-hint">Tap to select. You can pick more than one if you play multiple PCs.</p>
        </div>
        <div class="guest-pick-chars">
          <For each={store.campaign.characters}>
            {(pc) => {
              const isSelected = () => selected().includes(pc.name);
              return (
                <button
                  class={`guest-pick-char ${isSelected() ? 'selected' : ''}`}
                  onClick={() => togglePC(pc.name)}
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
            onClick={confirmPC}
            disabled={selected().length === 0}
          >
            {pcLabel()}
          </button>
        </div>
      </Show>

      {/* ── Screen 2b: Pick NPC ally ── */}
      <Show when={screen() === 'pick-npc'}>
        <div class="guest-pick-header">
          <button class="guest-back-btn" onClick={() => setScreen('mode-pick')}>
            <i class="ph ph-arrow-left" /> Back
          </button>
          <h2 class="guest-pick-title">Which NPC?</h2>
          <p class="guest-pick-hint">Pick a character in the world, or enter a custom name.</p>
        </div>

        <Show when={npcs().length > 0}>
          <div class="guest-pick-chars">
            <For each={npcs()}>
              {(npc) => (
                <button
                  class={`guest-pick-char ${npcName() === npc.name ? 'selected' : ''}`}
                  onClick={() => { setNpcName(npc.name); setCustomName(''); }}
                >
                  <span class="guest-pick-avatar">{npc.name[0]}</span>
                  <div class="guest-pick-info">
                    <span class="guest-pick-name">{npc.name}</span>
                    <span class="guest-pick-sub">{npc.disposition || 'NPC'}</span>
                  </div>
                  {npcName() === npc.name && <i class="ph ph-check-circle guest-pick-check" />}
                </button>
              )}
            </For>
          </div>
        </Show>

        <div class="guest-npc-custom">
          <label class="guest-npc-custom-label">
            {npcs().length > 0 ? 'Or enter a custom name:' : 'Enter character name:'}
          </label>
          <input
            type="text"
            class="guest-npc-custom-input"
            placeholder="e.g. Fenwick the Innkeeper"
            value={customName()}
            onInput={(e) => { setCustomName(e.target.value); setNpcName(''); }}
          />
        </div>

        <div class="guest-pick-actions">
          <button
            class="guest-pick-confirm"
            onClick={confirmNPC}
            disabled={!(npcName() || customName()).trim()}
          >
            {npcLabel()}
          </button>
        </div>
      </Show>

    </div>
  );
}
