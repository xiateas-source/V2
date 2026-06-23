import { For, Show, createMemo, createSignal } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { validateMechanics, applyMechanics } from '../../ai/mechanics.js';

export default function Combat() {
  const combat = () => store.campaign.combatState;
  const active = () => combat().active;
  const [minimized, setMinimized] = createSignal(false);

  // Initiative is stored sorted (highest first); currentTurn indexes it directly.
  const order = createMemo(() => (active() ? combat().initiative : []));

  // Allies (PCs) read HP live from the character store so the tracker never
  // drifts from heals/overrides/level-ups. Enemies live only in the initiative
  // entry, so their HP comes from there (updated by the hp mechanic on damage).
  function liveHp(c) {
    if (c.type === 'pc') {
      const pc = store.campaign.characters.find(p => p.name === c.name);
      if (pc) return { hp: pc.hp, hpMax: pc.hpMax };
    }
    return { hp: c.hp, hpMax: c.hpMax };
  }

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

  const currentName = () => order()[combat().currentTurn]?.name || '';

  function advanceTurn() {
    const init = order();
    if (!init.length) return;
    const next = (combat().currentTurn + 1) % init.length;
    setStore('campaign', 'combatState', 'currentTurn', next);
    if (next === 0) {
      setStore('campaign', 'combatState', 'round', combat().round + 1);
    }
  }

  function endCombat() {
    const mechanics = [{ key: 'combat_end', value: 'Manual end', target: '', applied: false }];
    const { valid } = validateMechanics(mechanics);
    applyMechanics(valid);
  }

  return (
    <Show when={active()}>
      <div class={`combat-overlay ${minimized() ? 'combat-min' : ''}`}>
        <div class="combat-header">
          <span class="combat-round">Round {combat().round}</span>
          <span class="combat-turn">{currentName()}'s turn</span>
          <button class="btn-min" onClick={() => setMinimized(!minimized())} title={minimized() ? 'Expand' : 'Minimize'}>
            {minimized() ? '▢' : '—'}
          </button>
          <Show when={!minimized()}>
            <button class="btn-advance" onClick={advanceTurn}>Next</button>
            <button class="btn-end-combat" onClick={endCombat}>End</button>
          </Show>
        </div>

        <Show when={!minimized()}>
          <div class="combat-initiative">
            <For each={order()}>
              {(c, idx) => {
                const isCurrent = () => idx() === combat().currentTurn;
                const vit = () => liveHp(c);
                const hpPct = () => { const v = vit(); return v.hpMax ? Math.round((v.hp / v.hpMax) * 100) : 100; };
                const isDead = () => vit().hp <= 0;
                return (
                  <div class={`init-row ${isCurrent() ? 'init-current' : ''} ${isDead() ? 'init-dead' : ''} ${c.type === 'pc' ? 'init-pc' : 'init-npc'}`}>
                    <span class="init-roll">{c.rollPending ? '··' : c.roll}</span>
                    <span class="init-name">{c.name}</span>
                    <span class="init-zone">{c.zone}</span>
                    <div class="init-hp-wrap">
                      <div class="init-hp-bar">
                        <div class="init-hp-fill" style={{ width: `${hpPct()}%`, background: c.type === 'pc' ? 'var(--color-success)' : 'var(--color-danger)' }} />
                      </div>
                      <span class="init-hp-text">{vit().hp}/{vit().hpMax}</span>
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
                            <span class={`zone-token ${c.type} ${liveHp(c).hp <= 0 ? 'token-dead' : ''}`}>
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
        </Show>
      </div>
    </Show>
  );
}
