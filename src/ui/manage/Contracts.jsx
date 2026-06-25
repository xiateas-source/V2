import { createSignal, For, Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { DEFAULT_CONTRACTS } from '../../state/campaign.js';

const SECTIONS = [
  { key: 'persona', label: 'DM Persona', hint: 'Tone, personality, and behavior of the AI Dungeon Master.' },
  { key: 'never', label: 'Prohibitions', hint: 'Hard rules the AI must never break. These are your safety rails.' },
  { key: 'actions', label: 'Pacing & Actions', hint: 'How many beats per response, combat pacing, mechanic emission rules.' },
  { key: 'continuity', label: 'Continuity', hint: 'How the AI tracks consequences, NPC memory, and world consistency.' },
  { key: 'multi', label: 'Multi-Player', hint: 'Rules for handling multiple PCs in a single message.' },
  { key: 'module', label: 'Module Fidelity', hint: 'Adventure-specific rules. Auto-filled when importing a module.' },
  { key: 'dmSecrets', label: 'DM Secrets', hint: 'Hidden info the AI uses but never reveals to players.' },
];

export default function Contracts(props) {
  const [expanded, setExpanded] = createSignal(null);

  function toggle(key) {
    setExpanded(prev => prev === key ? null : key);
  }

  function update(key, value) {
    setStore('campaign', 'contracts', key, value);
  }

  function resetSection(key) {
    if (!(key in DEFAULT_CONTRACTS)) return;
    if (!confirm(`Reset "${SECTIONS.find(s => s.key === key).label}" to default?`)) return;
    setStore('campaign', 'contracts', key, DEFAULT_CONTRACTS[key]);
  }

  function hasChanged(key) {
    if (!(key in DEFAULT_CONTRACTS)) return false;
    return store.campaign.contracts[key] !== DEFAULT_CONTRACTS[key];
  }

  return (
    <div class="contracts-page">
      <div class="contracts-header">
        <button class="contracts-back" onClick={props.onBack}>
          <i class="ph ph-arrow-left" />
        </button>
        <h2 class="contracts-title">DM Contracts</h2>
      </div>
      <p class="contracts-desc">
        These rules shape how the AI Dungeon Master behaves. They flow directly into the system prompt — every word matters.
      </p>

      <For each={SECTIONS}>
        {(sec) => {
          const val = () => store.campaign.contracts[sec.key] || '';
          const isOpen = () => expanded() === sec.key;
          const modified = () => hasChanged(sec.key);
          const isEmpty = () => !val().trim();

          return (
            <div class="contract-section" classList={{ open: isOpen() }}>
              <button class="contract-section-header" onClick={() => toggle(sec.key)}>
                <div class="contract-section-left">
                  <span class="contract-section-label">{sec.label}</span>
                  <Show when={modified()}>
                    <span class="contract-modified-dot" />
                  </Show>
                  <Show when={isEmpty() && !isOpen()}>
                    <span class="contract-empty-tag">empty</span>
                  </Show>
                </div>
                <i class={isOpen() ? 'ph ph-caret-up' : 'ph ph-caret-down'} />
              </button>

              <Show when={isOpen()}>
                <div class="contract-section-body">
                  <p class="contract-hint">{sec.hint}</p>
                  <textarea
                    class="contract-textarea"
                    value={val()}
                    onInput={(e) => update(sec.key, e.target.value)}
                    placeholder={sec.hint}
                    rows={Math.max(4, Math.ceil(val().length / 60))}
                  />
                  <Show when={sec.key in DEFAULT_CONTRACTS}>
                    <div class="contract-actions">
                      <button
                        class="contract-reset-btn"
                        onClick={() => resetSection(sec.key)}
                        disabled={!modified()}
                      >
                        Reset to Default
                      </button>
                    </div>
                  </Show>
                </div>
              </Show>
            </div>
          );
        }}
      </For>
    </div>
  );
}
