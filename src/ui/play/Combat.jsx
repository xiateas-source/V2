import { For, Show, createMemo } from 'solid-js';
import { store, setStore } from '../../state/index.js';

export default function Combat() {
  const combat = () => store.campaign.combatState;
  const active = () => combat().active;

  const sortedInit = createMemo(() => {
    if (!active()) return [];
    return [...combat().initiative].sort((a, b) => b.roll - a.roll);
  });

  const zones = createMemo(() => {
    if (!active()) return {};
    const grouped = {};
    for (const c of combat().initiative) {
      const z = c.zone || 'front';
      if (!grouped[z]) grouped[z] = [];
      grouped[z].push(c);
    }
    return grouped;
  });

  const currentName = () => {
    const init = sortedInit();
    const turn = combat().currentTurn;
    return init[turn]?.name || '';
  };

  function advanceTurn() {
    const init = sortedInit();
    if (!init.length) return;
    const next = (combat().currentTurn + 1) % init.length;
    setStore('campaign', 'combatState', 'currentTurn', next);
    if (next === 0) {
      setStore('campaign', 'combatState', 'round', combat().round + 1);
    }
  }

  return (
    <Show when={active()}>
      <div class="combat-overlay">
        <div class="combat-header">
          <span class="combat-round">Round {combat().round}</span>
          <span class="combat-turn">{currentName()}'s turn</span>
          <button class="btn-advance" onClick={advanceTurn}>Next</button>
        </div>

        <div class="combat-initiative">
          <For each={sortedInit()}>
            {(c, idx) => {
              const isCurrent = () => idx() === combat().currentTurn;
              const hpPct = () => c.hpMax ? Math.round((c.hp / c.hpMax) * 100) : 100;
              const isDead = () => c.hp <= 0;
              return (
                <div class={`init-row ${isCurrent() ? 'init-current' : ''} ${isDead() ? 'init-dead' : ''} ${c.type === 'pc' ? 'init-pc' : 'init-npc'}`}>
                  <span class="init-roll">{c.roll}</span>
                  <span class="init-name">{c.name}</span>
                  <span class="init-zone">{c.zone}</span>
                  <div class="init-hp-wrap">
                    <div class="init-hp-bar">
                      <div class="init-hp-fill" style={{ width: `${hpPct()}%`, background: c.type === 'pc' ? 'var(--color-success)' : 'var(--color-danger)' }} />
                    </div>
                    <span class="init-hp-text">{c.hp}/{c.hpMax}</span>
                  </div>
                  <span class="init-ac">AC {c.ac}</span>
                </div>
              );
            }}
          </For>
        </div>

        <Show when={Object.keys(zones()).length > 1}>
          <div class="combat-zones">
            <For each={Object.entries(zones())}>
              {([zoneName, combatants]) => {
                const label = () => combat().zones[zoneName]?.label || zoneName;
                const terrain = () => combat().zones[zoneName]?.terrain;
                return (
                  <div class="zone-card">
                    <div class="zone-header">
                      <span class="zone-name">{label()}</span>
                      <Show when={terrain()}>
                        <span class="zone-terrain">{terrain()}</span>
                      </Show>
                    </div>
                    <div class="zone-combatants">
                      <For each={combatants}>
                        {(c) => (
                          <span class={`zone-token ${c.type} ${c.hp <= 0 ? 'token-dead' : ''}`}>
                            {c.name.slice(0, 3)}
                          </span>
                        )}
                      </For>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}
