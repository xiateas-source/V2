import { createSignal, createResource, onMount, For, Show } from 'solid-js';
import { getAll } from '../../data/local.js';
import { compendiumFilter, setCompendiumFilter } from '../shared/sourceBus.js';

const SPELL_CLASSES = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
const LEVEL_CHIPS = ['Cantrips', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
const LEVEL_HEADING = ['Cantrips', '1st Level', '2nd Level', '3rd Level', '4th Level',
  '5th Level', '6th Level', '7th Level', '8th Level', '9th Level'];

export default function Compendium() {
  const [tab, setTab] = createSignal('spells');
  const [search, setSearch] = createSignal('');
  const [selected, setSelected] = createSignal(null);
  const [selClass, setSelClass] = createSignal(null);
  const [selLevel, setSelLevel] = createSignal(null);
  const [expanded, setExpanded] = createSignal(new Set());

  const [spells] = createResource(() => getAll('spells'));
  const [glossary] = createResource(() => getAll('glossary'));
  const [rules] = createResource(() => getAll('compendium'));
  const [feats] = createResource(() => getAll('feats'));

  onMount(() => {
    const f = compendiumFilter();
    if (f?.class) {
      setSelClass(f.class);
      setCompendiumFilter(null);
    }
  });

  function toggleExpand(name) {
    setExpanded(prev => {
      const s = new Set(prev);
      if (s.has(name)) s.delete(name); else s.add(name);
      return s;
    });
  }

  const filteredSpells = () => {
    const q = search().toLowerCase().trim();
    const cls = selClass();
    const lvl = selLevel();
    let list = spells() || [];
    if (cls) list = list.filter(s => (s.classes || []).some(c => c.toLowerCase() === cls.toLowerCase()));
    if (lvl !== null) list = list.filter(s => (s.level ?? 0) === lvl);
    if (q) list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    );
    return list;
  };

  const spellsByLevel = () => {
    const groups = new Map();
    for (const spell of filteredSpells()) {
      const lvl = spell.level ?? 0;
      if (!groups.has(lvl)) groups.set(lvl, []);
      groups.get(lvl).push(spell);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, list]) => ({ level, list: list.sort((a, b) => a.name.localeCompare(b.name)) }));
  };

  const filteredOther = () => {
    const q = search().toLowerCase().trim();
    const source = tab() === 'glossary' ? (glossary() || [])
      : tab() === 'feats' ? (feats() || [])
      : (rules() || []);
    if (!q) return source.slice(0, 50);
    return source.filter(item => {
      const name = (item.name || item.term || '').toLowerCase();
      const body = (item.content || item.description || item.effect || '').toLowerCase();
      return name.includes(q) || body.includes(q);
    }).slice(0, 30);
  };

  function getTitle(item) { return item.name || item.term || 'Unknown'; }
  function getSubtitle(item) {
    if (tab() === 'glossary') return item.category || '';
    if (tab() === 'feats') return item.prerequisite || 'No prerequisite';
    return item.type || item.source || '';
  }
  function getContent(item) { return item.content || item.description || item.effect || ''; }

  return (
    <div class="compendium-page">
      <div class="comp-tabs">
        <button class={`jtab ${tab() === 'spells' ? 'active' : ''}`} onClick={() => { setTab('spells'); setSelected(null); }}>Spells</button>
        <button class={`jtab ${tab() === 'rules' ? 'active' : ''}`} onClick={() => { setTab('rules'); setSelected(null); }}>Rules</button>
        <button class={`jtab ${tab() === 'glossary' ? 'active' : ''}`} onClick={() => { setTab('glossary'); setSelected(null); }}>Glossary</button>
        <button class={`jtab ${tab() === 'feats' ? 'active' : ''}`} onClick={() => { setTab('feats'); setSelected(null); }}>Feats</button>
      </div>

      <div class="comp-search">
        <input
          type="text"
          class="field-input"
          placeholder={tab() === 'spells' ? 'Search spells…' : 'Search…'}
          value={search()}
          onInput={(e) => setSearch(e.target.value)}
        />
      </div>

      <Show when={tab() === 'spells'}>
        <div class="comp-filter-row">
          <button class={`comp-chip ${!selClass() ? 'active' : ''}`} onClick={() => setSelClass(null)}>All</button>
          <For each={SPELL_CLASSES}>{(cls) => (
            <button
              class={`comp-chip ${selClass() === cls ? 'active' : ''}`}
              onClick={() => setSelClass(selClass() === cls ? null : cls)}
            >{cls}</button>
          )}</For>
        </div>

        <div class="comp-filter-row">
          <button class={`comp-chip ${selLevel() === null ? 'active' : ''}`} onClick={() => setSelLevel(null)}>All Levels</button>
          <For each={LEVEL_CHIPS}>{(label, i) => (
            <button
              class={`comp-chip ${selLevel() === i() ? 'active' : ''}`}
              onClick={() => setSelLevel(selLevel() === i() ? null : i())}
            >{label}</button>
          )}</For>
        </div>

        <div class="comp-spell-list">
          <Show when={!spells.loading} fallback={<div class="empty-state">Loading spells…</div>}>
            <Show when={spellsByLevel().length > 0} fallback={<div class="empty-state">No spells match</div>}>
              <For each={spellsByLevel()}>{({ level, list }) => (
                <div class="comp-spell-section">
                  <div class="comp-section-header">
                    {LEVEL_HEADING[level] || `Level ${level}`}
                    <span class="comp-section-count">{list.length}</span>
                  </div>
                  <For each={list}>{(spell) => {
                    const isOpen = () => expanded().has(spell.name);
                    return (
                      <button class={`comp-spell-card ${isOpen() ? 'open' : ''}`} onClick={() => toggleExpand(spell.name)}>
                        <div class="comp-spell-row">
                          <span class="comp-spell-name">{spell.name}</span>
                          <div class="comp-spell-meta">
                            <Show when={spell.ritual}><span class="comp-spell-badge ritual">R</span></Show>
                            <Show when={spell.concentration}><span class="comp-spell-badge conc">C</span></Show>
                            <span class="comp-spell-school">{spell.school}</span>
                          </div>
                          <i class={`ph ph-caret-${isOpen() ? 'up' : 'down'} comp-spell-caret`} />
                        </div>
                        <Show when={isOpen()}>
                          <div class="comp-spell-body">
                            <div class="comp-spell-stats">
                              <span><b>Cast</b> {spell.castingTime}</span>
                              <span><b>Range</b> {spell.range}</span>
                              <span><b>Duration</b> {spell.duration}</span>
                              <span><b>Comp</b> {spell.components}</span>
                            </div>
                            <div class="comp-spell-classes">
                              {(spell.classes || []).map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' · ')}
                            </div>
                            <p class="comp-spell-desc">{spell.description}</p>
                          </div>
                        </Show>
                      </button>
                    );
                  }}</For>
                </div>
              )}</For>
            </Show>
          </Show>
        </div>
      </Show>

      <Show when={tab() !== 'spells'}>
        <Show when={selected()} fallback={
          <div class="comp-list">
            <For each={filteredOther()}>{(item) => (
              <button class="comp-item" onClick={() => setSelected(item)}>
                <span class="comp-item-name">{getTitle(item)}</span>
                <span class="comp-item-sub">{getSubtitle(item)}</span>
              </button>
            )}</For>
            <Show when={filteredOther().length === 0}>
              <div class="empty-state">No results</div>
            </Show>
          </div>
        }>
          <div class="comp-detail">
            <button class="comp-back" onClick={() => setSelected(null)}>← Back</button>
            <h3 class="comp-detail-title">{getTitle(selected())}</h3>
            <p class="comp-detail-sub">{getSubtitle(selected())}</p>
            <div class="comp-detail-content">{getContent(selected())}</div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
