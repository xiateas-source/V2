import { Show, For, createSignal, createMemo } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { isSending } from '../../ai/engine.js';

const GENERIC = [
  { label: 'Dash', econ: 'action', text: ' takes the Dash action (move up to double speed).' },
  { label: 'Dodge', econ: 'action', text: ' takes the Dodge action (attacks against them have disadvantage).' },
  { label: 'Disengage', econ: 'action', text: ' takes the Disengage action (no opportunity attacks).' },
  { label: 'Hide', econ: 'action', text: ' tries to Hide.' },
  { label: 'Help', econ: 'action', text: ' uses the Help action to aid ' },
];

export const [turnPromptMinimized, setTurnPromptMinimized] = createSignal(true);

export default function TurnPrompt() {
  const combat = () => store.campaign.combatState;
  const awaiting = () => combat().initiative.some(c => c.rollPending);
  const actor = () => combat().initiative[combat().currentTurn] || null;

  const shouldShow = () => {
    if (!combat().active || awaiting() || isSending()) return false;
    const a = actor();
    return !!a && a.type === 'pc' && a.hp > 0;
  };

  const pc = createMemo(() => {
    const a = actor();
    if (!a) return null;
    return store.campaign.characters.find(c => c.name === a.name) || null;
  });

  const used = () => combat().actionsUsed || {};

  const attacks = createMemo(() => {
    const p = pc();
    if (!p) return [];
    return (p.attacks || []).slice(0, 3).map(atk => {
      const name = typeof atk === 'string' ? atk : atk.name;
      return { label: name, econ: 'action', text: `${p.name} attacks with ${name} — targeting ` };
    }).filter(a => a.label);
  });

  const spells = createMemo(() => {
    const p = pc();
    if (!p) return [];
    return [...(p.cantrips || []), ...(p.knownSpells || [])].slice(0, 4)
      .map(s => ({ label: s, econ: 'action', text: `${p.name} casts ${s} — targeting ` }));
  });

  const bonus = createMemo(() => {
    const p = pc();
    if (!p) return [];
    const feats = (p.features || []).map(f => (f.name || f).toLowerCase());
    const out = [];
    if (feats.some(f => /cunning action/.test(f))) {
      out.push({ label: 'Cunning: Dash', econ: 'bonus', text: `${p.name} uses Cunning Action to Dash.` });
      out.push({ label: 'Cunning: Hide', econ: 'bonus', text: `${p.name} uses Cunning Action to Hide.` });
    }
    if (feats.some(f => /second wind/.test(f))) out.push({ label: 'Second Wind', econ: 'bonus', text: `${p.name} uses Second Wind to recover hit points.` });
    if (feats.some(f => /bardic inspiration/.test(f))) out.push({ label: 'Inspire', econ: 'bonus', text: `${p.name} grants Bardic Inspiration to ` });
    return out;
  });

  function take(qa) {
    const u = { ...(combat().actionsUsed || {}) };
    u[qa.econ] = true;
    setStore('campaign', 'combatState', 'actionsUsed', u);
    window.dispatchEvent(new CustomEvent('prefill-input', { detail: { text: qa.text } }));
  }

  return (
    <Show when={shouldShow()}>
      <Show when={turnPromptMinimized()} fallback={
        <div class="turn-prompt">
          <div class="turn-prompt-head">
            <span class="turn-prompt-icon">⚔</span>
            <span class="turn-prompt-name" style={pc()?.color ? { color: pc().color } : undefined}>
              {actor()?.name}'s turn
            </span>
            <span class="turn-prompt-round">Round {combat().round}</span>
          </div>

          <div class="econ-slots">
            <span class={`econ-slot ${used().action ? 'spent' : ''}`}>Action</span>
            <span class={`econ-slot ${used().bonus ? 'spent' : ''}`}>Bonus</span>
            <span class={`econ-slot ${used().movement ? 'spent' : ''}`}>Move</span>
          </div>

          <div class="turn-prompt-actions">
            <For each={attacks()}>
              {(qa) => <button class="turn-action-btn ta-atk" onClick={() => take(qa)}><i class="ph ph-sword" />{qa.label}</button>}
            </For>
            <For each={spells()}>
              {(qa) => <button class="turn-action-btn ta-spell" onClick={() => take(qa)}>
                <i class="ph ph-sparkle" />{qa.label}
                <span class="ta-spell-info" onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('spell-tooltip', { detail: { name: qa.label } })); }}>ⓘ</span>
              </button>}
            </For>
            <For each={bonus()}>
              {(qa) => <button class="turn-action-btn ta-bonus" onClick={() => take(qa)}><i class="ph ph-lightning" />{qa.label}</button>}
            </For>
            <For each={GENERIC}>
              {(g) => <button class="turn-action-btn ta-gen" onClick={() => take({ ...g, text: `${pc()?.name || ''}${g.text}` })}>{g.label}</button>}
            </For>
          </div>
        </div>
      }>
        <div class="turn-prompt-minimized" onClick={() => setTurnPromptMinimized(false)}>
          <span class="turn-prompt-icon">⚔</span>
          <span class="turn-prompt-name" style={pc()?.color ? { color: pc().color } : undefined}>
            {actor()?.name}'s turn
          </span>
          <span class="turn-prompt-round">Round {combat().round}</span>
          <span class="turn-prompt-expand">tap to expand</span>
        </div>
      </Show>
    </Show>
  );
}
