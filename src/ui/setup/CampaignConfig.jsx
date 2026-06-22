import { createSignal, Show, For } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { callProvider } from '../../ai/providers.js';
import { CAMPAIGN_BRAINSTORM_SYSTEM, CONTENT_STRUCTURING_SYSTEM } from '../../ai/setupPrompts.js';
import { parseAdventure } from '../../content/adventureParser.js';
import { parseMarkdownAdventure } from '../../content/markdownAdventureParser.js';

const SETTING_CHIPS = ['Classic Fantasy', 'Dark & Gritty', 'Lighthearted', 'Urban Intrigue', 'Wilderness'];
const STYLE_CHIPS = ['Tolkien', 'Pratchett', 'Critical Role', 'Grim & Short', 'Fairy Tale'];

export default function CampaignConfig() {
  const [path, setPath] = createSignal(null);

  return (
    <div class="campaign-config">
      <h2 class="config-title">Your Campaign</h2>

      <Show when={!path()}>
        <div class="config-paths">
          <button class="path-card" onClick={() => setPath('fresh')}>
            <span class="path-icon">✨</span>
            <span class="path-label">Fresh Campaign</span>
            <span class="path-desc">Name, setting, and style</span>
          </button>
          <button class="path-card" onClick={() => setPath('adventure')}>
            <span class="path-icon">📖</span>
            <span class="path-label">Load Adventure</span>
            <span class="path-desc">Import from 5e.tools JSON</span>
          </button>
          <button class="path-card" onClick={() => setPath('upload')}>
            <span class="path-icon">📚</span>
            <span class="path-label">Upload Book</span>
            <span class="path-desc">PDF or epub of a purchased module</span>
          </button>
        </div>
      </Show>

      <Show when={path() === 'fresh'}>
        <FreshCampaign onBack={() => setPath(null)} />
      </Show>
      <Show when={path() === 'adventure'}>
        <AdventureImport onBack={() => setPath(null)} />
      </Show>
      <Show when={path() === 'upload'}>
        <BookUpload onBack={() => setPath(null)} />
      </Show>
    </div>
  );
}

function FreshCampaign(props) {
  const defaultName = () => {
    const first = store.campaign.characters[0];
    return first ? `${first.name}'s Adventure` : 'New Adventure';
  };

  const [name, setName] = createSignal(store.campaign.name || '');
  const [setting, setSetting] = createSignal(store.campaign.setting || '');
  const [customSetting, setCustomSetting] = createSignal('');
  const [style, setStyle] = createSignal(store.campaign.narrationStyle || '');
  const [customStyle, setCustomStyle] = createSignal('');
  const [premise, setPremise] = createSignal(store.campaign.premise || '');
  const [brainstorming, setBrainstorming] = createSignal(false);

  function save() {
    const finalSetting = setting() === 'custom' ? customSetting() : setting();
    const finalStyle = style() === 'custom' ? customStyle() : style();
    setStore('campaign', 'name', name() || defaultName());
    setStore('campaign', 'setting', finalSetting);
    setStore('campaign', 'narrationStyle', finalStyle);
    if (premise()) setStore('campaign', 'premise', premise());
  }

  async function brainstorm() {
    setBrainstorming(true);
    try {
      const chars = store.campaign.characters.map(c => `${c.name} (${c.race} ${c.class} Lv${c.level})`).join(', ');
      const msg = `Characters: ${chars}. Setting preference: ${setting() || 'any'}. Style: ${style() || 'any'}.`;
      const stream = callProvider(
        [{ role: 'user', content: msg }],
        CAMPAIGN_BRAINSTORM_SYSTEM,
      );
      let full = '';
      for await (const chunk of stream) { full += chunk; }
      const match = full.match(/```PREMISE\s*([\s\S]*?)```/);
      if (match) setPremise(match[1].trim());
      else setPremise(full.trim());
    } catch (_) {}
    finally { setBrainstorming(false); }
  }

  // Auto-save on changes
  const commit = () => { save(); };

  return (
    <div class="fresh-campaign">
      <button class="builder-back" onClick={props.onBack}>&larr; Back</button>

      <input
        class="config-name-input"
        placeholder={defaultName()}
        value={name()}
        onInput={(e) => { setName(e.target.value); commit(); }}
      />

      <div class="config-section">
        <label class="config-label">Setting</label>
        <div class="config-chips">
          <For each={SETTING_CHIPS}>
            {(s) => (
              <button
                class={`config-chip ${setting() === s ? 'active' : ''}`}
                onClick={() => { setSetting(s); commit(); }}
              >{s}</button>
            )}
          </For>
          <button
            class={`config-chip ${setting() === 'custom' ? 'active' : ''}`}
            onClick={() => setSetting('custom')}
          >Other...</button>
        </div>
        <Show when={setting() === 'custom'}>
          <input
            class="config-custom-input"
            placeholder="Describe your setting"
            value={customSetting()}
            onInput={(e) => { setCustomSetting(e.target.value); commit(); }}
          />
        </Show>
      </div>

      <div class="config-section">
        <label class="config-label">Narration Style</label>
        <div class="config-chips">
          <For each={STYLE_CHIPS}>
            {(s) => (
              <button
                class={`config-chip ${style() === s ? 'active' : ''}`}
                onClick={() => { setStyle(s); commit(); }}
              >{s}</button>
            )}
          </For>
          <button
            class={`config-chip ${style() === 'custom' ? 'active' : ''}`}
            onClick={() => setStyle('custom')}
          >Other...</button>
        </div>
        <Show when={style() === 'custom'}>
          <input
            class="config-custom-input"
            placeholder="Describe the narration style"
            value={customStyle()}
            onInput={(e) => { setCustomStyle(e.target.value); commit(); }}
          />
        </Show>
      </div>

      <div class="config-section">
        <label class="config-label">Premise</label>
        <Show when={premise()}>
          <div class="config-premise">{premise()}</div>
        </Show>
        <button class="config-brainstorm-btn" onClick={brainstorm} disabled={brainstorming()}>
          {brainstorming() ? 'Thinking...' : premise() ? 'Regenerate' : 'Help me brainstorm'}
        </button>
      </div>
    </div>
  );
}

function AdventureImport(props) {
  const [file, setFile] = createSignal(null);
  const [error, setError] = createSignal('');
  const [result, setResult] = createSignal(null);
  const [parsing, setParsing] = createSignal(false);

  function onFileSelect(e) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function importFile() {
    const f = file();
    if (!f) return;
    setError('');
    setParsing(true);

    try {
      const text = await f.text();
      let parsed = null;

      if (f.name.endsWith('.json')) {
        const json = JSON.parse(text);
        parsed = parseAdventure(json);
      } else {
        parsed = parseMarkdownAdventure(text, f.name);
      }

      if (!parsed) { setError('Could not parse adventure — check the file format'); setParsing(false); return; }
      setResult(parsed);
      applyAdventure(parsed);
    } catch (e) {
      setError(`Import failed: ${e.message}`);
    } finally {
      setParsing(false);
    }
  }

  function applyAdventure(adv) {
    setStore('campaign', 'name', adv.name);
    setStore('campaign', 'setting', adv.setting || '');
    setStore('campaign', 'premise', adv.premise || '');
    if (adv.moduleProgress) setStore('campaign', 'moduleProgress', adv.moduleProgress);
    if (adv.npcs) setStore('campaign', 'npcs', adv.npcs);
    if (adv.locations) setStore('campaign', 'locations', adv.locations);
    if (adv.contract) setStore('campaign', 'contracts', 'module', adv.contract);
  }

  return (
    <div class="adventure-import">
      <button class="builder-back" onClick={props.onBack}>&larr; Back</button>
      <a class="config-link" href="https://5e.tools/adventures.html" target="_blank" rel="noopener">Browse 5e.tools Adventures ↗</a>
      <p class="config-hint">Upload an adventure file (.md or .json) from 5e.tools</p>

      <label class="file-upload-btn">
        {file() ? file().name : 'Choose Adventure File'}
        <input type="file" accept=".md,.json,.txt" onChange={onFileSelect} hidden />
      </label>

      {error() && <div class="paste-error">{error()}</div>}

      <Show when={result()}>
        <div class="adventure-preview">
          <div class="adventure-name">{result().name}</div>
          <div class="adventure-meta">
            {result().moduleProgress?.length || 0} chapters &middot; {result().npcs?.length || 0} NPCs &middot; {result().locations?.length || 0} locations
          </div>
          <Show when={result().premise}>
            <div class="adventure-premise">{result().premise}</div>
          </Show>
        </div>
      </Show>
      <Show when={file() && !result()}>
        <button class="paste-btn" onClick={importFile} disabled={parsing()}>
          {parsing() ? 'Importing...' : 'Import Adventure'}
        </button>
      </Show>
    </div>
  );
}

function BookUpload(props) {
  const [file, setFile] = createSignal(null);
  const [parsing, setParsing] = createSignal(false);
  const [progress, setProgress] = createSignal('');
  const [chapters, setChapters] = createSignal([]);
  const [error, setError] = createSignal('');

  function onFileSelect(e) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function processBook() {
    const f = file();
    if (!f) return;
    setParsing(true);
    setError('');
    setProgress('Extracting text...');

    try {
      const { extractText } = await import('../../content/fileParser.js');
      const text = await extractText(f);
      if (!text) { setError('No text found in file. If this is a scanned PDF, try an epub or markdown version instead.'); setParsing(false); return; }

      const { splitIntoChunks } = await import('../../content/chunkSplitter.js');
      const chunks = splitIntoChunks(text);
      setProgress(`Found ${chunks.length} sections. Parsing with AI...`);

      const parsed = [];
      for (let i = 0; i < chunks.length; i++) {
        setProgress(`Parsing section ${i + 1} of ${chunks.length}...`);
        try {
          const stream = callProvider(
            [{ role: 'user', content: chunks[i].text }],
            CONTENT_STRUCTURING_SYSTEM,
          );
          let full = '';
          for await (const chunk of stream) { full += chunk; }
          const match = full.match(/```CHAPTER_DATA\s*([\s\S]*?)```/);
          if (match) {
            const data = JSON.parse(match[1].trim());
            parsed.push({ ...data, id: `ch_${i}`, discovered: i === 0, status: i === 0 ? 'active' : 'pending' });
          }
        } catch (_) {
          parsed.push({ title: chunks[i].title || `Section ${i + 1}`, id: `ch_${i}`, discovered: i === 0, status: i === 0 ? 'active' : 'pending', summary: '', npcs: [], locations: [], encounters: [], keyEvents: [], treasures: [] });
        }
      }

      setChapters(parsed);
      setProgress('Done!');
      applyBookData(parsed);
    } catch (e) {
      setError(e.message || 'Failed to process file');
    } finally {
      setParsing(false);
    }
  }

  function applyBookData(parsed) {
    if (!parsed.length) return;
    const name = parsed[0].title || file()?.name?.replace(/\.[^.]+$/, '') || 'Imported Adventure';
    setStore('campaign', 'name', name);

    const moduleProgress = parsed.map(ch => ({
      id: ch.id,
      title: ch.title,
      status: ch.status,
      discovered: ch.discovered,
      summary: ch.summary || '',
    }));
    setStore('campaign', 'moduleProgress', moduleProgress);

    const allNpcs = parsed.flatMap(ch => (ch.npcs || []).map(n => ({ ...n, status: 'active', chapter: ch.id })));
    const allLocs = parsed.flatMap(ch => (ch.locations || []).map(l => ({ ...l, chapter: ch.id })));
    setStore('campaign', 'npcs', allNpcs);
    setStore('campaign', 'locations', allLocs);

    if (parsed[0].summary) setStore('campaign', 'premise', parsed[0].summary);
    setStore('campaign', 'contracts', 'module', 'Follow the published adventure structure. Use only established content from the provided material. Do not invent major plot points not in the source.');
  }

  return (
    <div class="book-upload">
      <button class="builder-back" onClick={props.onBack}>&larr; Back</button>
      <p class="config-hint">Upload a PDF or epub of a purchased D&D module. The AI will structure it into playable chapters.</p>

      <label class="file-upload-btn">
        {file() ? file().name : 'Choose File'}
        <input type="file" accept=".pdf,.epub" onChange={onFileSelect} hidden />
      </label>

      {error() && <div class="paste-error">{error()}</div>}

      <Show when={file() && !chapters().length}>
        <button class="paste-btn" onClick={processBook} disabled={parsing()}>
          {parsing() ? progress() : 'Process Book'}
        </button>
      </Show>

      <Show when={chapters().length > 0}>
        <div class="adventure-preview">
          <div class="adventure-name">{store.campaign.name}</div>
          <div class="adventure-meta">
            {chapters().length} chapters parsed &middot; {store.campaign.npcs?.length || 0} NPCs found
          </div>
          <div class="chapter-list">
            <For each={chapters()}>
              {(ch) => (
                <div class={`chapter-item ${ch.discovered ? 'discovered' : ''}`}>
                  <span class="chapter-title">{ch.title || ch.id}</span>
                  <span class="chapter-status">{ch.discovered ? '🔓' : '🔒'}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
