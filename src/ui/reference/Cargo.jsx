import { createSignal, createMemo, lazy, For, Show } from 'solid-js';
import { store } from '../../state/index.js';
import { validateMechanics, applyMechanics } from '../../ai/mechanics.js';

const Treasury = lazy(() => import('./Treasury.jsx'));

const TYPE_LABEL = {
  weapon: 'Weapons', armor: 'Armor', shield: 'Shields', ammo: 'Ammunition',
  potion: 'Potions', scroll: 'Scrolls', wand: 'Wands', ring: 'Rings',
  tool: 'Tools', instrument: 'Instruments', gear: 'Gear', clothing: 'Clothing',
  container: 'Containers', food: 'Provisions', material: 'Materials',
  supply: 'Supplies', trade: 'Trade Goods', loot: 'Loot', hoard: 'Valuables',
  key: 'Key Items', document: 'Documents', component: 'Components',
  consumable: 'Consumables', currency: 'Currency', herb: 'Herbs', misc: 'Misc',
};
function typeLabel(t) { return TYPE_LABEL[(t || 'misc').toLowerCase()] || (t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Misc'); }
function itemWeight(i) { return (Number(i.weight) || 0) * (Number(i.qty) || 1); }

export default function Cargo() {
  const [showTreasury, setShowTreasury] = createSignal(false);
  const [owner, setOwner] = createSignal('all');   // 'all' | 'wagon' | 'hoard' | pcId
  const [typeFilter, setTypeFilter] = createSignal('all');
  const [q, setQ] = createSignal('');
  const [adding, setAdding] = createSignal(false);

  const gold = () => store.campaign.gold;
  const characters = () => store.campaign.characters;
  const carried = () => store.campaign.inventory.carried || {};
  const wagon = () => store.campaign.inventory.wagon || [];
  const hoard = () => store.campaign.inventory.hoard || [];

  const treasury = () => {
    const g = gold();
    return [g.pp && `${g.pp} PP`, g.gp && `${g.gp} GP`, g.ep && `${g.ep} EP`, g.sp && `${g.sp} SP`, g.cp && `${g.cp} CP`]
      .filter(Boolean).join(' · ');
  };

  // Every item tagged with its owner, so "All" reads as one list.
  const allItems = createMemo(() => {
    const out = [];
    for (const it of wagon()) out.push({ ...it, _owner: 'wagon', _ownerLabel: 'Wagon' });
    for (const it of hoard()) out.push({ ...it, _owner: 'hoard', _ownerLabel: 'Hoard' });
    for (const pc of characters()) {
      for (const it of (carried()[pc.id] || [])) out.push({ ...it, _owner: pc.id, _ownerLabel: pc.name });
    }
    return out;
  });

  const ownerTabs = createMemo(() => {
    const tabs = [{ id: 'all', label: 'All', count: allItems().length }];
    if (wagon().length) tabs.push({ id: 'wagon', label: 'Wagon', count: wagon().length });
    if (hoard().length) tabs.push({ id: 'hoard', label: 'Hoard', count: hoard().length });
    for (const pc of characters()) {
      tabs.push({ id: pc.id, label: pc.name, count: (carried()[pc.id] || []).length });
    }
    return tabs;
  });

  // Items in the chosen owner view (before type/search filtering).
  const ownerItems = createMemo(() => {
    const o = owner();
    if (o === 'all') return allItems();
    return allItems().filter(i => i._owner === o);
  });

  const typeChips = createMemo(() => {
    const counts = {};
    for (const i of ownerItems()) {
      const t = (i.type || 'misc').toLowerCase();
      counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t, n]) => ({ t, n }));
  });

  const visible = createMemo(() => {
    const term = q().trim().toLowerCase();
    let list = ownerItems();
    if (typeFilter() !== 'all') list = list.filter(i => (i.type || 'misc').toLowerCase() === typeFilter());
    if (term) list = list.filter(i => (i.name || '').toLowerCase().includes(term));
    return list;
  });

  // Group the visible list by type → labelled sections.
  const grouped = createMemo(() => {
    const groups = {};
    for (const i of visible()) {
      const t = (i.type || 'misc').toLowerCase();
      (groups[t] = groups[t] || []).push(i);
    }
    return Object.entries(groups).sort((a, b) => typeLabel(a[0]).localeCompare(typeLabel(b[0])));
  });

  const totalWeight = createMemo(() => visible().reduce((s, i) => s + itemWeight(i), 0));

  // For a PC owner view: carry capacity = STR × 15 (Encumbered at ×5, Heavily
  // Encumbered at ×10 — matches the thresholds enforced on rolls in RollBar).
  const capacity = createMemo(() => {
    const pc = characters().find(p => p.id === owner());
    if (!pc) return null;
    const str = pc.abilityScores?.str || 10;
    const carried = totalWeight();
    const cap = str * 15;
    let level = 'ok';
    let warning = '';
    if (carried > cap) { level = 'over'; warning = 'Over capacity! Cannot move.'; }
    else if (carried > str * 10) { level = 'heavy'; warning = 'Heavily encumbered: -20ft speed, disadvantage on STR/DEX/CON rolls.'; }
    else if (carried > str * 5) { level = 'encumbered'; warning = 'Encumbered: -10ft speed.'; }
    return { carried, cap, str, level, warning };
  });

  function selectOwner(id) { setOwner(id); setTypeFilter('all'); }

  return (
    <Show when={!showTreasury()} fallback={<Treasury onBack={() => setShowTreasury(false)} />}>
      <div class="cargo-page">
        <div class="cargo-head">
          <span class="page-heading cargo-title">Cargo</span>
          <button class="cargo-add-btn" onClick={() => setAdding(!adding())}>
            <i class="ph ph-plus" /> Add
          </button>
        </div>

        <button class="cargo-treasury-link" onClick={() => setShowTreasury(true)}>
          <i class="ph ph-coins cargo-treasury-icon" />
          <div class="cargo-treasury-info">
            <span class="section-label">Treasury</span>
            <div class="treasury-display">{treasury() || 'Empty'}</div>
          </div>
          <span class="roster-chip-go">›</span>
        </button>

        <Show when={adding()}><AddItemForm characters={characters()} owner={owner()} onDone={() => setAdding(false)} /></Show>

        {/* owner / container tabs with counts */}
        <div class="cargo-owners">
          <For each={ownerTabs()}>
            {(t) => (
              <button class={`cargo-owner ${owner() === t.id ? 'active' : ''}`} onClick={() => selectOwner(t.id)}>
                {t.label}<span class="cargo-owner-count">{t.count}</span>
              </button>
            )}
          </For>
        </div>

        {/* weight rollup */}
        <Show when={capacity()} fallback={
          <Show when={totalWeight() > 0}><div class="cargo-weight">{totalWeight()} lb total</div></Show>
        }>
          <div class={`cargo-weight ${capacity().level}`}>
            <div class="cargo-weight-bar">
              <div class="cargo-weight-fill" style={{ width: `${Math.min(100, (capacity().carried / capacity().cap) * 100)}%` }} />
            </div>
            <span class="cargo-weight-text">{capacity().carried} / {capacity().cap} lb · STR {capacity().str}</span>
            <Show when={capacity().warning}><span class="cargo-weight-warning">{capacity().warning}</span></Show>
          </div>
        </Show>

        {/* search */}
        <Show when={ownerItems().length > 6}>
          <input class="cargo-search" placeholder="Search items…" value={q()} onInput={(e) => setQ(e.target.value)} />
        </Show>

        {/* type filter chips */}
        <Show when={typeChips().length > 1}>
          <div class="cargo-types">
            <button class={`cargo-type ${typeFilter() === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>
              All {ownerItems().length}
            </button>
            <For each={typeChips()}>
              {(c) => (
                <button class={`cargo-type ${typeFilter() === c.t ? 'active' : ''}`} onClick={() => setTypeFilter(c.t)}>
                  {typeLabel(c.t)} {c.n}
                </button>
              )}
            </For>
          </div>
        </Show>

        {/* grouped item list */}
        <Show when={visible().length > 0} fallback={<p class="empty-state">{ownerItems().length === 0 ? 'Nothing stored here yet.' : 'No items match.'}</p>}>
          <div class="cargo-groups">
            <For each={grouped()}>
              {([type, items]) => (
                <section class="cargo-group">
                  <div class="cargo-group-label">{typeLabel(type)}</div>
                  <For each={items}>
                    {(i) => (
                      <div class="cargo-item">
                        <span class="cargo-item-name">{i.name}</span>
                        <Show when={owner() === 'all' && i._ownerLabel}>
                          <span class="cargo-item-owner">{i._ownerLabel}</span>
                        </Show>
                        <span class="cargo-item-meta">
                          {i.qty > 1 ? <span class="cargo-qty">×{i.qty}</span> : ''}
                          {itemWeight(i) ? <span class="cargo-wt">{itemWeight(i)}lb</span> : ''}
                        </span>
                      </div>
                    )}
                  </For>
                </section>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}

// Player add — routed through the item_add mechanic (inventory is AI-owned, so
// we go through the pipeline rather than writing the store directly).
function AddItemForm(props) {
  const [name, setName] = createSignal('');
  const [type, setType] = createSignal('gear');
  const [dest, setDest] = createSignal(props.owner === 'all' ? 'wagon' : props.owner);

  const TYPES = ['gear', 'weapon', 'armor', 'potion', 'scroll', 'tool', 'supply', 'trade', 'key', 'document', 'consumable', 'misc'];

  function destLabel(id) {
    if (id === 'wagon') return 'Wagon';
    if (id === 'hoard') return 'Hoard';
    const pc = props.characters.find(p => p.id === id);
    return pc ? pc.name : 'Wagon';
  }
  function destToken(id) {
    if (id === 'wagon' || id === 'hoard') return id;
    const pc = props.characters.find(p => p.id === id);
    return pc ? pc.name : 'wagon';
  }

  function add() {
    const n = name().trim();
    if (!n) return;
    const value = `${destToken(dest())}, ${n}, ${type()}`;
    const { valid } = validateMechanics([{ key: 'item_add', value, target: '', applied: false }]);
    applyMechanics(valid);
    setName('');
    props.onDone?.();
  }

  return (
    <div class="cargo-addform">
      <input class="cargo-addinput" placeholder="Item name" value={name()} onInput={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()} />
      <div class="cargo-addrow">
        <select class="cargo-addsel" value={type()} onInput={(e) => setType(e.target.value)}>
          <For each={TYPES}>{(t) => <option value={t}>{typeLabel(t)}</option>}</For>
        </select>
        <select class="cargo-addsel" value={dest()} onInput={(e) => setDest(e.target.value)}>
          <option value="wagon">Wagon</option>
          <option value="hoard">Hoard</option>
          <For each={props.characters}>{(pc) => <option value={pc.id}>{pc.name}</option>}</For>
        </select>
        <button class="cargo-addgo" onClick={add} disabled={!name().trim()}>Add</button>
      </div>
    </div>
  );
}
