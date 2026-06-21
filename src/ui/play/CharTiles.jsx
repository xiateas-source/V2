import { createSignal, For, Show } from 'solid-js';
import { store } from '../../state/index.js';
import CharSheet from '../reference/CharSheet.jsx';

const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

export default function CharTiles() {
  const [sheetOpen, setSheetOpen] = createSignal(false);
  const [sheetPC, setSheetPC] = createSignal(0);
  const chars = () => store.campaign.characters;

  function openSheet(idx) {
    setSheetPC(idx);
    setSheetOpen(true);
  }

  return (
    <>
      <Show when={chars().length > 0}>
        <div class="char-tiles">
          <For each={chars()}>
            {(pc, idx) => {
              const hpPct = () => pc.hpMax ? Math.round((pc.hp / pc.hpMax) * 100) : 100;
              const hpColor = () => hpPct() > 50 ? 'var(--color-success)' : hpPct() > 25 ? 'var(--color-warning)' : 'var(--color-danger)';
              const canLevelUp = () => {
                const nextLevel = pc.level;
                if (nextLevel >= 20) return false;
                return pc.xp >= XP_THRESHOLDS[nextLevel];
              };

              const slotDisplay = () => {
                const entries = Object.entries(pc.spellSlots || {});
                if (!entries.length) return null;
                return entries.map(([lvl, max]) => {
                  const current = pc.currentSlots?.[lvl] ?? max;
                  return { lvl, current, max };
                });
              };

              const hasDeathSaves = () => pc.hp === 0 && (pc.deathSaves.successes > 0 || pc.deathSaves.failures > 0);

              return (
                <div class={`char-tile${canLevelUp() ? ' tile-levelup' : ''}`} style={{ 'border-left': `3px solid ${pc.color || 'var(--color-accent)'}` }} onClick={() => openSheet(idx())}>
                  <div class="tile-top">
                    <span class="tile-name">{pc.name}</span>
                    <span class="tile-class">{pc.class} {pc.level}</span>
                  </div>
                  <div class="tile-hp-bar">
                    <div class="tile-hp-fill" style={{ width: `${hpPct()}%`, background: hpColor() }} />
                  </div>
                  <div class="tile-stats">
                    <span class="tile-hp">{pc.hp}/{pc.hpMax}{pc.hpTemp > 0 ? <span class="tile-temp">+{pc.hpTemp}</span> : ''}</span>
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
                  <Show when={pc.exhaustion > 0}>
                    <div class="tile-exhaustion">Exhaustion {pc.exhaustion}</div>
                  </Show>
                  <Show when={hasDeathSaves()}>
                    <div class="tile-death-saves">
                      <span class="ds-success">{'O'.repeat(pc.deathSaves.successes)}{'·'.repeat(3 - pc.deathSaves.successes)}</span>
                      <span class="ds-failure">{'X'.repeat(pc.deathSaves.failures)}{'·'.repeat(3 - pc.deathSaves.failures)}</span>
                    </div>
                  </Show>
                  <Show when={slotDisplay()}>
                    <div class="tile-slots">
                      <For each={slotDisplay()}>
                        {(s) => (
                          <span class={`slot-pip ${s.current === 0 ? 'slot-empty' : ''}`} title={`Level ${s.lvl}`}>
                            {s.current}
                          </span>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      <Show when={sheetOpen()}>
        <div class="sheet-overlay" onClick={() => setSheetOpen(false)}>
          <div class="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <button class="sheet-close" onClick={() => setSheetOpen(false)}>Close</button>
            <CharSheet initialPC={sheetPC()} />
          </div>
        </div>
      </Show>
    </>
  );
}
