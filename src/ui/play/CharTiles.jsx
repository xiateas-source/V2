import { For, Show } from 'solid-js';
import { store } from '../../state/index.js';

export default function CharTiles() {
  const chars = () => store.campaign.characters;

  return (
    <Show when={chars().length > 0}>
      <div class="char-tiles">
        <For each={chars()}>
          {(pc) => {
            const hpPct = () => pc.hpMax ? Math.round((pc.hp / pc.hpMax) * 100) : 100;
            const hpColor = () => hpPct() > 50 ? 'var(--color-success)' : hpPct() > 25 ? 'var(--color-warning)' : 'var(--color-danger)';

            return (
              <div class="char-tile" style={{ 'border-left': `3px solid ${pc.color || 'var(--color-accent)'}` }}>
                <div class="tile-top">
                  <span class="tile-name">{pc.name}</span>
                  <span class="tile-class">{pc.class} {pc.level}</span>
                </div>
                <div class="tile-hp-bar">
                  <div class="tile-hp-fill" style={{ width: `${hpPct()}%`, background: hpColor() }} />
                </div>
                <div class="tile-stats">
                  <span class="tile-hp">{pc.hp}/{pc.hpMax}</span>
                  <span class="tile-ac">AC {pc.ac}</span>
                  <Show when={pc.conditions.length > 0}>
                    <span class="tile-conditions">
                      {pc.conditions.map(c => c.name || c).join(', ')}
                    </span>
                  </Show>
                </div>
                <Show when={pc.concentration}>
                  <div class="tile-conc">Conc: {pc.concentration.spell || pc.concentration}</div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </Show>
  );
}
