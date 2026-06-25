import { createSignal, createResource, For, Show } from 'solid-js';
import { getAll, getByIndex } from '../../data/local.js';

export default function Compendium() {
  const [tab, setTab] = createSignal('spells');
  const [search, setSearch] = createSignal('');
  const [selected, setSelected] = createSignal(null);

  const [spells] = createResource(() => getAll('spells'));
  const [glossary] = createResource(() => getAll('glossary'));
  const [rules] = createResource(() => getAll('compendium'));
  const [feats] = createResource(() => getAll('feats'));

  const filtered = () => {
    const q = search().toLowerCase();
    const source = tab() === 'spells' ? (spells() || [])
      : tab() === 'glossary' ? (glossary() || [])
      : tab() === 'feats' ? (feats() || [])
      : (rules() || []);

    if (!q) return source.slice(0, 50);
    return source.filter(item => {
      const name = (item.name || item.term || '').toLowerCase();
      const content = (item.content || item.description || item.effect || '').toLowerCase();
      return name.includes(q) || content.includes(q);
    }).slice(0, 30);
  };

  function getTitle(item) {
    return item.name || item.term || 'Unknown';
  }

  function getSubtitle(item) {
    if (tab() === 'spells') {
      return `Level ${item.level || 0} ${item.school || ''} — ${(item.classes || []).join(', ')}`;
    }
    if (tab() === 'glossary') return item.category || '';
    if (tab() === 'feats') return item.prerequisite || 'No prerequisite';
    return item.type || item.source || '';
  }

  function getContent(item) {
    return item.content || item.description || item.effect || '';
  }

  return (
    <div class="compendium-page">
      <div class="comp-tabs">
        <button class={`jtab ${tab() === 'spells' ? 'active' : ''}`} onClick={() => setTab('spells')}>Spells</button>
        <button class={`jtab ${tab() === 'rules' ? 'active' : ''}`} onClick={() => setTab('rules')}>Rules</button>
        <button class={`jtab ${tab() === 'glossary' ? 'active' : ''}`} onClick={() => setTab('glossary')}>Glossary</button>
        <button class={`jtab ${tab() === 'feats' ? 'active' : ''}`} onClick={() => setTab('feats')}>Feats</button>
      </div>

      <div class="comp-search">
        <input
          type="text"
          class="field-input"
          placeholder="Search..."
          value={search()}
          onInput={(e) => setSearch(e.target.value)}
        />
      </div>

      <Show when={selected()} fallback={
        <div class="comp-list">
          <For each={filtered()}>
            {(item) => (
              <button class="comp-item" onClick={() => setSelected(item)}>
                <span class="comp-item-name">{getTitle(item)}</span>
                <span class="comp-item-sub">{getSubtitle(item)}</span>
              </button>
            )}
          </For>
          <Show when={filtered().length === 0}>
            <div class="empty-state">No results</div>
          </Show>
        </div>
      }>
        <div class="comp-detail">
          <button class="comp-back" onClick={() => setSelected(null)}>Back</button>
          <h3 class="comp-detail-title">{getTitle(selected())}</h3>
          <p class="comp-detail-sub">{getSubtitle(selected())}</p>
          <div class="comp-detail-content">{getContent(selected())}</div>
          <Show when={selected().castingTime}>
            <div class="comp-detail-meta">
              <span>Cast: {selected().castingTime}</span>
              <span>Range: {selected().range}</span>
              <span>Duration: {selected().duration}</span>
              <span>Components: {selected().components}</span>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
