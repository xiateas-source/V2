import { createSignal, createResource, onMount, For, Show } from 'solid-js';
import { getAll } from '../../data/local.js';
import { listBundles } from '../../data/bundles.js';
import { compendiumFilter, setCompendiumFilter } from '../shared/sourceBus.js';

const BUNDLE_CONTENT_TYPES = [
  { key: 'npcs', label: 'NPC', title: (e) => e.name, body: (e) => e.description },
  { key: 'locations', label: 'Location', title: (e) => e.name, body: (e) => e.description },
  { key: 'encounters', label: 'Encounter', title: (e) => e.name, body: (e) => e.description },
  { key: 'adventures', label: 'Adventure', title: (e) => e.title, body: (e) => e.body || e.summary },
  { key: 'dmTools', label: 'DM Tool', title: (e) => e.title, body: (e) => e.body },
  { key: 'aiGuidance', label: 'AI Guidance', title: (e) => e.scope, body: (e) => e.text },
];

const SPELL_CLASSES = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
const LEVEL_CHIPS = ['Cantrips', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
const LEVEL_HEADING = ['Cantrips', '1st Level', '2nd Level', '3rd Level', '4th Level',
  '5th Level', '6th Level', '7th Level', '8th Level', '9th Level'];

export default function Compendium() {
  const [tab, setTab] = createSignal('spells');
  const [search, setSearch] = createSignal('');
  const [selClass, setSelClass] = createSignal(null);
  const [selLevel, setSelLevel] = createSignal(null);
  const [expanded, setExpanded] = createSignal(new Set());

  const [spells] = createResource(() => getAll('spells'));
  const [glossary] = createResource(() => getAll('glossary'));
  const [rules] = createResource(() => getAll('compendium'));
  const [feats] = createResource(() => getAll('feats'));
  const [installedBundles] = createResource(listBundles);

  onMount(() => {
    const f = compendiumFilter();
    if (f?.class) {
      setSelClass(f.class);
      setCompendiumFilter(null);
    }
  });

  function toggleExpand(key) {
    setExpanded(prev => {
      const s = new Set(prev);
      if (s.has(key)) s.delete(key); else s.add(key);
      return s;
    });
  }

  // ── Spells ──────────────────────────────────────────────────────────────

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

  // ── Rules / Glossary / Feats ─────────────────────────────────────────────

  function getOtherItems() {
    const t = tab();
    if (t === 'glossary') return glossary() || [];
    if (t === 'feats') return feats() || [];
    return rules() || [];
  }

  function getItemKey(item) {
    return item.name || item.term || '';
  }

  function getItemTitle(item) {
    return item.name || item.term || 'Unknown';
  }

  function getItemSub(item) {
    const t = tab();
    if (t === 'glossary') return item.category || '';
    if (t === 'feats') return item.prerequisite ? `Prereq: ${item.prerequisite}` : 'No prerequisite';
    return item.type || item.source || '';
  }

  function getItemBody(item) {
    // each data file uses different field names
    return item.content || item.definition || item.desc || item.description || item.effect || '';
  }

  // ── Bundles ───────────────────────────────────────────────────────────────

  function flattenedBundleEntries() {
    const out = [];
    for (const bundle of (installedBundles() || [])) {
      for (const { key, label, title, body } of BUNDLE_CONTENT_TYPES) {
        for (const entry of (bundle.content?.[key] || [])) {
          out.push({ bundleName: bundle.name, type: label, key: `${bundle.id}-${key}-${entry.id}`, title: title(entry) || 'Untitled', body: body(entry) || '' });
        }
      }
    }
    return out;
  }

  const filteredBundleEntries = () => {
    const q = search().toLowerCase().trim();
    const list = flattenedBundleEntries();
    if (!q) return list;
    return list.filter(e => e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q));
  };

  const filteredOther = () => {
    const q = search().toLowerCase().trim();
    const list = getOtherItems();
    if (!q) return list;
    return list.filter(item => {
      const title = getItemTitle(item).toLowerCase();
      const body = getItemBody(item).toLowerCase();
      return title.includes(q) || body.includes(q);
    });
  };

  return (
    <div class="compendium-page">
      <div class="comp-tabs">
        <button class={`jtab ${tab() === 'spells' ? 'active' : ''}`} onClick={() => { setTab('spells'); setExpanded(new Set()); }}>Spells</button>
        <button class={`jtab ${tab() === 'rules' ? 'active' : ''}`} onClick={() => { setTab('rules'); setExpanded(new Set()); }}>Rules</button>
        <button class={`jtab ${tab() === 'glossary' ? 'active' : ''}`} onClick={() => { setTab('glossary'); setExpanded(new Set()); }}>Glossary</button>
        <button class={`jtab ${tab() === 'feats' ? 'active' : ''}`} onClick={() => { setTab('feats'); setExpanded(new Set()); }}>Feats</button>
        <button class={`jtab ${tab() === 'bundles' ? 'active' : ''}`} onClick={() => { setTab('bundles'); setExpanded(new Set()); }}>Bundles</button>
      </div>

      <div class="comp-search">
        <input
          type="text"
          class="field-input"
          placeholder="Search…"
          value={search()}
          onInput={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── SPELLS TAB ── */}
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
                    const key = `spell-${spell.name}`;
                    const isOpen = () => expanded().has(key);
                    return (
                      <button class={`comp-spell-card ${isOpen() ? 'open' : ''}`} onClick={() => toggleExpand(key)}>
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

      {/* ── BUNDLES TAB ── */}
      <Show when={tab() === 'bundles'}>
        <div class="comp-spell-list">
          <Show when={filteredBundleEntries().length > 0} fallback={<div class="empty-state">No bundle content yet — import a bundle in Settings.</div>}>
            <For each={filteredBundleEntries()}>{(item) => {
              const isOpen = () => expanded().has(item.key);
              return (
                <button class={`comp-spell-card ${isOpen() ? 'open' : ''}`} onClick={() => toggleExpand(item.key)}>
                  <div class="comp-spell-row">
                    <span class="comp-spell-name">{item.title}</span>
                    <span class="comp-spell-school">{item.type} · {item.bundleName}</span>
                    <i class={`ph ph-caret-${isOpen() ? 'up' : 'down'} comp-spell-caret`} />
                  </div>
                  <Show when={isOpen()}>
                    <div class="comp-spell-body">
                      <p class="comp-spell-desc">{item.body}</p>
                    </div>
                  </Show>
                </button>
              );
            }}</For>
          </Show>
        </div>
      </Show>

      {/* ── RULES / GLOSSARY / FEATS TABS ── */}
      <Show when={tab() !== 'spells' && tab() !== 'bundles'}>
        <div class="comp-spell-list">
          <Show when={filteredOther().length > 0} fallback={<div class="empty-state">No results</div>}>
            <For each={filteredOther()}>{(item) => {
              const key = `${tab()}-${getItemKey(item)}`;
              const isOpen = () => expanded().has(key);
              return (
                <button class={`comp-spell-card ${isOpen() ? 'open' : ''}`} onClick={() => toggleExpand(key)}>
                  <div class="comp-spell-row">
                    <span class="comp-spell-name">{getItemTitle(item)}</span>
                    <Show when={getItemSub(item)}>
                      <span class="comp-spell-school">{getItemSub(item)}</span>
                    </Show>
                    <i class={`ph ph-caret-${isOpen() ? 'up' : 'down'} comp-spell-caret`} />
                  </div>
                  <Show when={isOpen()}>
                    <div class="comp-spell-body">
                      <p class="comp-spell-desc">{getItemBody(item)}</p>
                    </div>
                  </Show>
                </button>
              );
            }}</For>
          </Show>
        </div>
      </Show>
    </div>
  );
}
