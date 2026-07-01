import { createSignal, createMemo, lazy, For, Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';
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
function rawWeight(i) { return (Number(i.weight) || 0) * (Number(i.qty) || 1); }
function itemWeight(i) { return i.inContainer ? 0 : rawWeight(i); }
const CONTAINER_NAMES = /bag of holding|handy haversack|portable hole|bag of devouring/i;
function isContainerType(i) {
  return (i.type || '').toLowerCase() === 'container' || CONTAINER_NAMES.test(i.name || '');
}
const USABLE_TYPES = new Set(['consumable', 'potion', 'food', 'herb', 'component', 'scroll']);
function useVerb(type, named) {
  const t = (type || '').toLowerCase();
  if (t === 'food') return named ? 'eats' : 'eat';
  if (t === 'potion') return named ? 'drinks' : 'drink';
  if (t === 'scroll') return named ? 'reads' : 'read';
  return named ? 'uses' : 'use';
}

export default function Cargo() {
  const [showTreasury, setShowTreasury] = createSignal(false);
  const [owner, setOwner] = createSignal('all');
  const [typeFilter, setTypeFilter] = createSignal('all');
  const [q, setQ] = createSignal('');
  const [adding, setAdding] = createSignal(false);
  const [openItem, setOpenItem] = createSignal(null);

  function itemKey(i) { return `${i.name}::${i._owner}::${i._idx}`; }
  function toggleOpen(i) {
    const k = itemKey(i);
    setOpenItem(prev => prev === k ? null : k);
  }

  // Write a patch to an item in place.
  function writeItem(i, patch) {
    if (i._owner === 'wagon') {
      const arr = store.campaign.inventory.wagon.map((it, idx) => idx === i._idx ? { ...it, ...patch } : it);
      setStore('campaign', 'inventory', 'wagon', arr);
    } else if (i._owner === 'hoard') {
      const arr = store.campaign.inventory.hoard.map((it, idx) => idx === i._idx ? { ...it, ...patch } : it);
      setStore('campaign', 'inventory', 'hoard', arr);
    } else {
      const arr = (store.campaign.inventory.carried[i._owner] || [])
        .map((it, idx) => idx === i._idx ? { ...it, ...patch } : it);
      setStore('campaign', 'inventory', 'carried', i._owner, arr);
    }
  }

  function removeItem(i) {
    if (i._owner === 'wagon') {
      setStore('campaign', 'inventory', 'wagon',
        store.campaign.inventory.wagon.filter((_, idx) => idx !== i._idx));
    } else if (i._owner === 'hoard') {
      setStore('campaign', 'inventory', 'hoard',
        store.campaign.inventory.hoard.filter((_, idx) => idx !== i._idx));
    } else {
      setStore('campaign', 'inventory', 'carried', i._owner,
        (store.campaign.inventory.carried[i._owner] || []).filter((_, idx) => idx !== i._idx));
    }
  }

  function adjustQty(i, delta) {
    const newQty = (i.qty || 1) + delta;
    if (newQty <= 0) { removeItem(i); setOpenItem(null); return; }
    writeItem(i, { qty: newQty });
  }

  function saveNote(i, text) {
    writeItem(i, { note: text || '' });
  }

  function useItem(i) {
    const pc = characters().find(c => c.id === i._owner);
    const who = pc?.name;
    const verb = useVerb(i.type, !!who);
    window.dispatchEvent(new CustomEvent('prefill-input', {
      detail: { text: `${who || 'I'} ${verb} the ${i.name}.` }
    }));
    adjustQty(i, -1);
  }

  function toggleInContainer(i, e) {
    e.stopPropagation();
    const pcId = i._owner;
    const arr = [...(store.campaign.inventory.carried[pcId] || [])];
    arr[i._idx] = { ...arr[i._idx], inContainer: !arr[i._idx].inContainer };
    setStore('campaign', 'inventory', 'carried', pcId, arr);
  }

  function mergeDuplicates() {
    function mergeArr(arr) {
      const map = new Map();
      for (const item of arr) {
        const key = item.name.toLowerCase();
        if (map.has(key)) {
          map.get(key).qty = (map.get(key).qty || 1) + (item.qty || 1);
        } else {
          map.set(key, { ...item, qty: item.qty || 1 });
        }
      }
      return [...map.values()];
    }
    setStore('campaign', 'inventory', 'wagon', mergeArr(store.campaign.inventory.wagon || []));
    setStore('campaign', 'inventory', 'hoard', mergeArr(store.campaign.inventory.hoard || []));
    const newCarried = {};
    for (const pc of characters()) {
      newCarried[pc.id] = mergeArr(store.campaign.inventory.carried[pc.id] || []);
    }
    setStore('campaign', 'inventory', 'carried', newCarried);
    setOpenItem(null);
  }

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

  // Companions live in the wagon but get their own display, not the item list.
  const companions = createMemo(() =>
    wagon().map((it, idx) => ({ ...it, _owner: 'wagon', _idx: idx }))
      .filter(i => (i.type || '').toLowerCase() === 'companion')
  );

  // Every item tagged with its owner and original index — companions excluded.
  const allItems = createMemo(() => {
    const out = [];
    for (const [idx, it] of wagon().entries()) {
      if ((it.type || '').toLowerCase() !== 'companion')
        out.push({ ...it, _owner: 'wagon', _ownerLabel: 'Wagon', _idx: idx });
    }
    for (const [idx, it] of hoard().entries()) out.push({ ...it, _owner: 'hoard', _ownerLabel: 'Hoard', _idx: idx });
    for (const pc of characters()) {
      for (const [idx, it] of (carried()[pc.id] || []).entries()) {
        out.push({ ...it, _owner: pc.id, _ownerLabel: pc.name, _idx: idx });
      }
    }
    return out;
  });

  const hasDuplicates = createMemo(() => {
    const seen = new Set();
    for (const i of allItems()) {
      const k = `${i._owner}::${i.name.toLowerCase()}`;
      if (seen.has(k)) return true;
      seen.add(k);
    }
    return false;
  });

  const ownerTabs = createMemo(() => {
    const wagonCount = wagon().filter(i => (i.type || '').toLowerCase() !== 'companion').length;
    const tabs = [{ id: 'all', label: 'All', count: allItems().length }];
    if (wagonCount) tabs.push({ id: 'wagon', label: 'Wagon', count: wagonCount });
    if (hoard().length) tabs.push({ id: 'hoard', label: 'Hoard', count: hoard().length });
    for (const pc of characters()) {
      tabs.push({ id: pc.id, label: pc.name, count: (carried()[pc.id] || []).length });
    }
    return tabs;
  });

  const ownerItems = createMemo(() => {
    const o = owner();
    if (o === 'all') return allItems();
    return allItems().filter(i => i._owner === o);
  });

  const hasContainer = createMemo(() => {
    const o = owner();
    if (o === 'all' || o === 'wagon' || o === 'hoard') return false;
    return (store.campaign.inventory.carried[o] || []).some(isContainerType);
  });

  const bagWeight = createMemo(() => {
    const o = owner();
    if (o === 'all' || o === 'wagon' || o === 'hoard') return 0;
    return (store.campaign.inventory.carried[o] || [])
      .filter(i => i.inContainer)
      .reduce((s, i) => s + rawWeight(i), 0);
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

  const grouped = createMemo(() => {
    const groups = {};
    for (const i of visible()) {
      const t = (i.type || 'misc').toLowerCase();
      (groups[t] = groups[t] || []).push(i);
    }
    return Object.entries(groups).sort((a, b) => typeLabel(a[0]).localeCompare(typeLabel(b[0])));
  });

  const totalWeight = createMemo(() => visible().reduce((s, i) => s + itemWeight(i), 0));

  const capacity = createMemo(() => {
    const pc = characters().find(p => p.id === owner());
    if (!pc) return null;
    const str = pc.abilityScores?.str || 10;
    const carriedW = totalWeight();
    const cap = str * 15;
    const level = carriedW > cap ? 'over' : 'ok';
    const warning = carriedW > cap ? 'Over capacity! Cannot pick up or carry more.' : '';
    return { carried: carriedW, cap, str, level, warning };
  });

  function selectOwner(id) { setOwner(id); setTypeFilter('all'); }

  return (
    <Show when={!showTreasury()} fallback={<Treasury onBack={() => setShowTreasury(false)} />}>
      <div class="cargo-page">
        <div class="cargo-head">
          <span class="page-heading cargo-title">Cargo</span>
          <div class="cargo-head-actions">
            <Show when={hasDuplicates()}>
              <button class="cargo-merge-btn" onClick={mergeDuplicates} title="Stack duplicate items">
                <i class="ph ph-stack" /> Merge
              </button>
            </Show>
            <button class="cargo-add-btn" onClick={() => setAdding(!adding())}>
              <i class="ph ph-plus" /> Add
            </button>
          </div>
        </div>

        {/* Companions row */}
        <Show when={companions().length > 0}>
          <div class="cargo-companions">
            <span class="cargo-companions-label">Traveling with</span>
            <For each={companions()}>
              {(c) => <span class="cargo-companion-chip">{c.name}</span>}
            </For>
          </div>
        </Show>

        <button class="cargo-treasury-link" onClick={() => setShowTreasury(true)}>
          <i class="ph ph-coins cargo-treasury-icon" />
          <div class="cargo-treasury-info">
            <span class="section-label">Treasury</span>
            <div class="treasury-display">{treasury() || 'Empty'}</div>
          </div>
          <span class="roster-chip-go">›</span>
        </button>

        <Show when={adding()}><AddItemForm characters={characters()} owner={owner()} onDone={() => setAdding(false)} /></Show>

        <div class="cargo-owners">
          <For each={ownerTabs()}>
            {(t) => (
              <button class={`cargo-owner ${owner() === t.id ? 'active' : ''}`} onClick={() => selectOwner(t.id)}>
                {t.label}<span class="cargo-owner-count">{t.count}</span>
              </button>
            )}
          </For>
        </div>

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
          <Show when={bagWeight() > 0}>
            <div class="cargo-bag-weight">
              <i class="ph ph-handbag" /> {bagWeight()} lb inside Bag of Holding · not counted
            </div>
          </Show>
        </Show>

        <Show when={ownerItems().length > 6}>
          <input class="cargo-search" placeholder="Search items…" value={q()} onInput={(e) => setQ(e.target.value)} />
        </Show>

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

        <Show when={visible().length > 0} fallback={<p class="empty-state">{ownerItems().length === 0 ? 'Nothing stored here yet.' : 'No items match.'}</p>}>
          <div class="cargo-groups">
            <For each={grouped()}>
              {([type, items]) => (
                <section class="cargo-group">
                  <div class="cargo-group-label">{typeLabel(type)}</div>
                  <For each={items}>
                    {(i) => {
                      const key = itemKey(i);
                      const isOpen = () => openItem() === key;
                      const isContainer = isContainerType(i);
                      const showBagToggle = () => hasContainer() && !isContainer;
                      const isUsable = USABLE_TYPES.has((i.type || '').toLowerCase());
                      return (
                        <div
                          class="cargo-item"
                          classList={{ 'has-note': !!i.note, 'in-bag': !!i.inContainer, 'is-open': isOpen() }}
                          onClick={() => toggleOpen(i)}
                        >
                          <span class="cargo-item-name">{i.name}</span>
                          <Show when={owner() === 'all' && i._ownerLabel}>
                            <span class="cargo-item-owner">{i._ownerLabel}</span>
                          </Show>
                          <span class="cargo-item-meta">
                            <Show when={!isOpen()}>
                              {i.qty > 1 ? <span class="cargo-qty">×{i.qty}</span> : ''}
                              {rawWeight(i) ? <span class="cargo-wt">{i.inContainer ? <s>{rawWeight(i)}lb</s> : `${rawWeight(i)}lb`}</span> : ''}
                            </Show>
                            <Show when={showBagToggle()}>
                              <button
                                class={`cargo-bag-btn ${i.inContainer ? 'active' : ''}`}
                                onClick={(e) => toggleInContainer(i, e)}
                                title={i.inContainer ? 'Remove from Bag of Holding' : 'Put in Bag of Holding'}
                              >
                                <i class="ph ph-handbag" />
                              </button>
                            </Show>
                            <i class={`ph ${isOpen() ? 'ph-caret-up' : 'ph-caret-down'} cargo-note-caret`} />
                          </span>

                          <Show when={isOpen()}>
                            <div class="cargo-item-edit" onClick={e => e.stopPropagation()}>
                              <div class="cargo-item-controls">
                                <div class="cargo-qty-stepper">
                                  <button onClick={() => adjustQty(i, -1)}>−</button>
                                  <span>{i.qty || 1}</span>
                                  <button onClick={() => adjustQty(i, 1)}>+</button>
                                </div>
                                <Show when={isUsable}>
                                  <button class="cargo-use-btn" onClick={() => useItem(i)}>
                                    {useVerb(i.type, !!characters().find(c => c.id === i._owner))}
                                  </button>
                                </Show>
                                <button class="cargo-delete-btn" onClick={() => { removeItem(i); setOpenItem(null); }}>
                                  <i class="ph ph-trash" />
                                </button>
                              </div>
                              <textarea
                                class="cargo-note-input"
                                placeholder="Add a note…"
                                value={i.note || ''}
                                rows={2}
                                onInput={(e) => saveNote(i, e.target.value)}
                              />
                            </div>
                          </Show>
                        </div>
                      );
                    }}
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

function AddItemForm(props) {
  const [name, setName] = createSignal('');
  const [type, setType] = createSignal('gear');
  const [dest, setDest] = createSignal(props.owner === 'all' ? 'wagon' : props.owner);

  const TYPES = ['gear', 'weapon', 'armor', 'potion', 'scroll', 'tool', 'supply', 'trade', 'key', 'document', 'consumable', 'misc'];

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
