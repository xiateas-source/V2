import { createSignal, lazy, For, Show } from 'solid-js';
import { store } from '../../state/index.js';

const Treasury = lazy(() => import('./Treasury.jsx'));

export default function Cargo() {
  const [showTreasury, setShowTreasury] = createSignal(false);
  const gold = () => store.campaign.gold;
  const wagon = () => store.campaign.inventory.wagon;
  const hoard = () => store.campaign.inventory.hoard;
  const carried = () => store.campaign.inventory.carried;
  const characters = () => store.campaign.characters;

  const treasury = () => {
    const g = gold();
    return [
      g.pp && `${g.pp} PP`,
      g.gp && `${g.gp} GP`,
      g.ep && `${g.ep} EP`,
      g.sp && `${g.sp} SP`,
      g.cp && `${g.cp} CP`,
    ].filter(Boolean).join(' / ');
  };

  return (
    <Show when={!showTreasury()} fallback={<Treasury onBack={() => setShowTreasury(false)} />}>
    <div class="cargo-page">
      <h2 class="page-heading">Cargo</h2>

      <button class="cargo-treasury-link" onClick={() => setShowTreasury(true)}>
        <div class="cargo-treasury-info">
          <h3 class="section-label">Treasury</h3>
          <div class="treasury-display">{treasury() || 'Empty'}</div>
        </div>
        <span class="roster-chip-go">›</span>
      </button>

      <Show when={wagon().length > 0}>
        <section class="cargo-section">
          <h3 class="section-label">Wagon</h3>
          <div class="item-list">
            <For each={wagon()}>
              {(item) => (
                <div class="item-row">
                  <span class="item-name">{item.name}</span>
                  <span class="item-meta">
                    {item.qty > 1 ? `x${item.qty}` : ''}
                    {item.weight ? ` ${item.weight}lb` : ''}
                  </span>
                </div>
              )}
            </For>
          </div>
        </section>
      </Show>

      <Show when={hoard().length > 0}>
        <section class="cargo-section">
          <h3 class="section-label">Hoard</h3>
          <div class="item-list">
            <For each={hoard()}>
              {(item) => (
                <div class="item-row">
                  <span class="item-name">{item.name}</span>
                  <span class="item-meta">
                    {item.qty > 1 ? `x${item.qty}` : ''}
                  </span>
                </div>
              )}
            </For>
          </div>
        </section>
      </Show>

      <For each={characters()}>
        {(pc) => {
          const items = () => carried()[pc.id] || [];
          return (
            <Show when={items().length > 0}>
              <section class="cargo-section">
                <h3 class="section-label">{pc.name}</h3>
                <div class="item-list">
                  <For each={items()}>
                    {(item) => (
                      <div class="item-row">
                        <span class="item-name">{item.name}</span>
                        <span class="item-meta">
                          {item.qty > 1 ? `x${item.qty}` : ''}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            </Show>
          );
        }}
      </For>

      <Show when={wagon().length === 0 && hoard().length === 0 && Object.keys(carried()).length === 0}>
        <p class="empty-state">No items yet.</p>
      </Show>
    </div>
    </Show>
  );
}
