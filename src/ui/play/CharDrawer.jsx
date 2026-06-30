import { createSignal, For, Show, createMemo } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { validateMechanics, applyMechanics } from '../../ai/mechanics.js';

export default function CharDrawer({ onClose }) {
  const characters = () => store.campaign.characters;
  const selectedPCs = () => store.system.playerIdentity?.selectedPCs || [];

  const defaultIdx = () => {
    if (selectedPCs().length > 0) {
      const idx = characters().findIndex(c => selectedPCs().includes(c.name));
      return idx >= 0 ? idx : 0;
    }
    return 0;
  };

  const [pcIdx, setPcIdx] = createSignal(defaultIdx());
  const pc = () => characters()[pcIdx()] || null;

  const hpPct = () => {
    const p = pc();
    return p?.hpMax ? Math.max(0, Math.min(100, Math.round((p.hp / p.hpMax) * 100))) : 0;
  };

  const mod = (score) => Math.floor(((score || 10) - 10) / 2);
  const fmt = (v) => v >= 0 ? `+${v}` : `${v}`;
  const initMod = () => fmt(mod(pc()?.abilityScores?.dex || 10));
  const hdAvail = () => (pc()?.hitDice?.total || 0) - (pc()?.hitDice?.used || 0);

  function adjustHP(delta) {
    const p = pc();
    if (!p) return;
    const target = Math.max(0, Math.min(p.hp + delta, p.hpMax));
    const { valid } = validateMechanics([{ key: 'hp', value: `${p.name}=${target}`, target: '', applied: false }]);
    applyMechanics(valid);
  }

  function removeCondition(idx) {
    const i = pcIdx();
    setStore('campaign', 'characters', i, 'conditions',
      store.campaign.characters[i].conditions.filter((_, j) => j !== idx));
  }

  function rollAttack(attackName) {
    const p = pc();
    if (!p) return;
    window.dispatchEvent(new CustomEvent('roll-request', {
      detail: { type: 'attack', attack: attackName, pc: p.name }
    }));
    onClose();
  }

  // Only show tabs for PCs the player controls (guests see only their chars, host sees all).
  const visibleChars = createMemo(() => {
    if (selectedPCs().length > 0) {
      return characters().map((c, i) => ({ c, i })).filter(({ c }) => selectedPCs().includes(c.name));
    }
    return characters().map((c, i) => ({ c, i }));
  });

  return (
    <div class="side-drawer left-drawer">
      <div class="drawer-header">
        <Show when={visibleChars().length > 1}>
          <div class="drawer-pc-tabs">
            <For each={visibleChars()}>
              {({ c, i }) => (
                <button
                  class={`drawer-pc-tab ${pcIdx() === i ? 'active' : ''}`}
                  style={{ '--tab-color': c.color || 'var(--color-accent)' }}
                  onClick={() => setPcIdx(i)}
                >
                  {c.avatar || c.name[0]}
                </button>
              )}
            </For>
          </div>
        </Show>
        <button class="drawer-close" onClick={onClose}><i class="ph ph-x" /></button>
      </div>

      <Show when={pc()}>
        <div class="drawer-body">
          <div class="drawer-pc-name" style={{ color: pc().color || 'var(--color-accent)' }}>
            {pc().name}
            <span class="drawer-pc-sub">{pc().class} {pc().level}</span>
          </div>

          {/* HP */}
          <div class="drawer-hp-block">
            <div class="drawer-hp-top">
              <span class={`drawer-hp-cur ${hpPct() < 30 ? 'low' : ''}`}>{pc().hp}</span>
              <span class="drawer-hp-sep"> / </span>
              <span class="drawer-hp-max">{pc().hpMax}</span>
              <Show when={pc().hpTemp > 0}>
                <span class="drawer-hp-temp">+{pc().hpTemp}</span>
              </Show>
            </div>
            <div class="drawer-hp-bar">
              <div
                class="drawer-hp-fill"
                style={{
                  width: `${hpPct()}%`,
                  background: hpPct() < 30 ? 'var(--color-danger)' : (pc().color || 'var(--color-accent)'),
                }}
              />
            </div>
            <div class="drawer-hp-btns">
              <button class="drawer-hp-btn minus" onClick={() => adjustHP(-5)}>−5</button>
              <button class="drawer-hp-btn minus" onClick={() => adjustHP(-1)}>−1</button>
              <button class="drawer-hp-btn plus" onClick={() => adjustHP(1)}>+1</button>
              <button class="drawer-hp-btn plus" onClick={() => adjustHP(5)}>+5</button>
            </div>
          </div>

          {/* Quick stats */}
          <div class="drawer-stats-row">
            <div class="drawer-stat">
              <div class="drawer-stat-val">{pc().ac}</div>
              <div class="drawer-stat-label">AC</div>
            </div>
            <div class="drawer-stat">
              <div class="drawer-stat-val">{pc().speed || 30}</div>
              <div class="drawer-stat-label">Speed</div>
            </div>
            <div class="drawer-stat">
              <div class="drawer-stat-val">{initMod()}</div>
              <div class="drawer-stat-label">Init</div>
            </div>
            <div class="drawer-stat">
              <div class="drawer-stat-val">{hdAvail()}<span class="drawer-stat-sub">/{pc().hitDice?.total || 0}</span></div>
              <div class="drawer-stat-label">HD {pc().hitDice?.die || 'd8'}</div>
            </div>
          </div>

          {/* Status */}
          <Show when={pc().concentration || pc().conditions?.length > 0 || pc().inspiration}>
            <div class="drawer-section-label">Status</div>
            <div class="drawer-conditions">
              <Show when={pc().inspiration}>
                <div class="drawer-condition inspiration">★ Inspiration</div>
              </Show>
              <Show when={pc().concentration}>
                <div class="drawer-condition conc">
                  <span>◉ {pc().concentration?.spell || pc().concentration}</span>
                  <button class="drawer-cond-x" onClick={() => setStore('campaign', 'characters', pcIdx(), 'concentration', null)}>×</button>
                </div>
              </Show>
              <For each={pc().conditions}>
                {(c, i) => (
                  <div class="drawer-condition">
                    <span>{c.name || c}</span>
                    <button class="drawer-cond-x" onClick={() => removeCondition(i())}>×</button>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Attacks */}
          <Show when={pc().attacks?.length > 0}>
            <div class="drawer-section-label">Attacks <span class="drawer-hint">tap to roll</span></div>
            <For each={pc().attacks}>
              {(a) => (
                <button class="drawer-attack" onClick={() => rollAttack(a.name)}>
                  <span class="drawer-attack-name">{a.name}</span>
                  <span class="drawer-attack-stats">+{a.bonus} · {a.damage}</span>
                </button>
              )}
            </For>
          </Show>

          {/* Death saves — only relevant when downed */}
          <Show when={pc().hp === 0}>
            <div class="drawer-section-label">Death Saves</div>
            <div class="drawer-death-saves">
              <div class="drawer-ds-row">
                <span class="drawer-ds-label success">✓</span>
                <For each={[0, 1, 2]}>
                  {(i) => <div class={`drawer-ds-pip success ${(pc().deathSaves?.successes || 0) > i ? 'filled' : ''}`} />}
                </For>
              </div>
              <div class="drawer-ds-row">
                <span class="drawer-ds-label fail">✗</span>
                <For each={[0, 1, 2]}>
                  {(i) => <div class={`drawer-ds-pip fail ${(pc().deathSaves?.failures || 0) > i ? 'filled' : ''}`} />}
                </For>
              </div>
            </div>
          </Show>

          {/* Full sheet link */}
          <button class="drawer-full-link" onClick={() => {
            window.dispatchEvent(new CustomEvent('tp-charsheet', { detail: { pcName: pc().name } }));
            onClose();
          }}>
            Full Character Sheet <i class="ph ph-arrow-up-right" />
          </button>
        </div>
      </Show>
    </div>
  );
}
