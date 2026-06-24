import { createSignal, For, Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';

const COINS = [
  { key: 'pp', abbr: 'PP', toGp: 10 },
  { key: 'gp', abbr: 'GP', toGp: 1 },
  { key: 'ep', abbr: 'EP', toGp: 0.5 },
  { key: 'sp', abbr: 'SP', toGp: 0.1 },
  { key: 'cp', abbr: 'CP', toGp: 0.01 },
];

// PHB lifestyle expenses — pure reference (Law 5: free math/lookup).
const LIFESTYLE = [
  { name: 'Squalid', cost: '1 sp/day' },
  { name: 'Poor', cost: '2 sp/day' },
  { name: 'Modest', cost: '1 gp/day' },
  { name: 'Comfortable', cost: '2 gp/day' },
  { name: 'Wealthy', cost: '4 gp/day' },
  { name: 'Aristocratic', cost: '10+ gp/day' },
];

export default function Treasury(props) {
  const gold = () => store.campaign.gold || {};
  const income = () => store.campaign.incomeLog || [];
  const expense = () => store.campaign.expenseLog || [];
  const [showLifestyle, setShowLifestyle] = createSignal(false);

  const totalGp = () => COINS.reduce((sum, c) => sum + (gold()[c.key] || 0) * c.toGp, 0);

  function setCoin(key, value) {
    const n = Math.max(0, parseInt(value, 10) || 0);
    setStore('campaign', 'gold', key, n);
  }
  function bump(key, delta) {
    setCoin(key, (gold()[key] || 0) + delta);
  }

  return (
    <div class="treasury-page">
      <div class="treasury-head">
        <Show when={props.onBack}>
          <button class="comp-back" onClick={props.onBack}>‹ Back</button>
        </Show>
        <h2 class="page-heading">Treasury</h2>
      </div>

      <div class="treasury-total">
        <span class="treasury-total-val">
          {totalGp().toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span class="treasury-total-label">gp total value</span>
      </div>

      <div class="coin-grid">
        <For each={COINS}>
          {(c) => (
            <div class={`coin-row coin-${c.key}`}>
              <span class="coin-abbr">{c.abbr}</span>
              <button class="coin-btn" onClick={() => bump(c.key, -1)}
                disabled={(gold()[c.key] || 0) <= 0}>−</button>
              <input class="coin-input" type="number" inputmode="numeric" min="0"
                value={gold()[c.key] || 0} onInput={(e) => setCoin(c.key, e.target.value)} />
              <button class="coin-btn" onClick={() => bump(c.key, 1)}>+</button>
            </div>
          )}
        </For>
      </div>
      <p class="treasury-hint">The DM updates coin during play — tap a number to correct it.</p>

      <section class="treasury-log-section">
        <h3 class="section-label">Income</h3>
        <Show when={income().length > 0} fallback={<p class="empty-state">No income logged yet.</p>}>
          <For each={[...income()].reverse().slice(0, 30)}>
            {(e) => (
              <div class="ledger-row income">
                <span class="ledger-amt">+{e.amount}</span>
                <span class="ledger-desc">{e.desc || e.category || 'Income'}</span>
                <Show when={e.gameTs}><span class="ledger-ts">{e.gameTs}</span></Show>
              </div>
            )}
          </For>
        </Show>
      </section>

      <section class="treasury-log-section">
        <h3 class="section-label">Expenses</h3>
        <Show when={expense().length > 0} fallback={<p class="empty-state">No expenses logged yet.</p>}>
          <For each={[...expense()].reverse().slice(0, 30)}>
            {(e) => (
              <div class="ledger-row expense">
                <span class="ledger-amt">−{e.amount}</span>
                <span class="ledger-desc">{e.desc || 'Expense'}</span>
                <Show when={e.gameTs}><span class="ledger-ts">{e.gameTs}</span></Show>
              </div>
            )}
          </For>
        </Show>
      </section>

      <section class="treasury-log-section">
        <button class="lifestyle-toggle" onClick={() => setShowLifestyle(!showLifestyle())}>
          {showLifestyle() ? '▾' : '▸'} Lifestyle costs (reference)
        </button>
        <Show when={showLifestyle()}>
          <div class="lifestyle-table">
            <For each={LIFESTYLE}>
              {(l) => (
                <div class="lifestyle-row">
                  <span class="lifestyle-name">{l.name}</span>
                  <span class="lifestyle-cost">{l.cost}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </section>
    </div>
  );
}
