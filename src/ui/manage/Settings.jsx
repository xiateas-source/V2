import { createSignal, Show } from 'solid-js';
import { store, setStore, resetCampaign } from '../../state/index.js';
import { saveKeys as persistKeys, saveProviderSettings } from '../../data/keys.js';
import { clearActiveCampaign, exportSnapshot, saveLocalNow } from '../../data/persist.js';

const GEMINI_MODELS = [
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (free, newest)' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite (free, fast)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (free)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (free)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (paid)' },
];

export default function Settings() {
  const [gemKey, setGemKey] = createSignal(store.system.providers.geminiKey);
  const [orKey, setOrKey] = createSignal(store.system.providers.openrouterKey);
  const [model, setModel] = createSignal(store.system.providers.geminiModel || 'gemini-3.5-flash');
  const [saved, setSaved] = createSignal(false);

  function saveKeys() {
    const gk = gemKey().trim();
    const ok = orKey().trim();
    setStore('system', 'providers', 'geminiKey', gk);
    setStore('system', 'providers', 'openrouterKey', ok);
    setStore('system', 'providers', 'geminiModel', model());
    persistKeys(gk, ok);
    saveProviderSettings(model());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function newCampaign() {
    if (store.campaign.id && !confirm('Start a new campaign? This clears the current game on this device.')) return;
    await clearActiveCampaign();
    resetCampaign(setStore);
  }

  function exportGame() {
    const snap = exportSnapshot();
    const json = JSON.stringify(snap, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = (store.campaign.name || 'campaign').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  let fileInput;

  function importGame() {
    fileInput?.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.campaign?.id || !data.campaign?.characters) {
        alert('Invalid save file: missing campaign data.');
        return;
      }
      if (!confirm(`Load save "${data.campaign.name || 'Untitled'}"? This replaces the current game.`)) return;
      setStore('campaign', data.campaign);
      await saveLocalNow();
      window.dispatchEvent(new CustomEvent('toast', { detail: { text: `Game loaded: ${data.campaign.name || 'Untitled'}` } }));
    } catch (err) {
      alert('Failed to load save file: ' + (err.message || 'Unknown error'));
    }
    e.target.value = '';
  }

  function cycleTheme() {
    const current = store.system.settings.theme;
    const [mode, numStr] = current.split('-');
    const num = parseInt(numStr, 10);
    const next = num >= 9 ? `${mode}-0` : `${mode}-${num + 1}`;
    setStore('system', 'settings', 'theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  function toggleMode() {
    const current = store.system.settings.theme;
    const [mode, num] = current.split('-');
    const next = mode === 'dark' ? `light-${num}` : `dark-${num}`;
    setStore('system', 'settings', 'theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <div class="settings-page">
      <h2 class="settings-heading">Settings</h2>

      <section class="settings-section">
        <h3 class="settings-label">AI Provider</h3>
        <div class="field-group">
          <label class="field-label">Gemini Model</label>
          <select
            class="field-input"
            value={model()}
            onChange={(e) => setModel(e.target.value)}
          >
            <For each={GEMINI_MODELS}>
              {(m) => <option value={m.id}>{m.label}</option>}
            </For>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Gemini API Key</label>
          <input
            type="password"
            class="field-input"
            placeholder="AIza..."
            value={gemKey()}
            onInput={(e) => setGemKey(e.target.value)}
          />
        </div>
        <div class="field-group">
          <label class="field-label">OpenRouter Key (optional fallback)</label>
          <input
            type="password"
            class="field-input"
            placeholder="sk-or-..."
            value={orKey()}
            onInput={(e) => setOrKey(e.target.value)}
          />
        </div>
        <button class="btn-save" onClick={saveKeys}>
          {saved() ? 'Saved' : 'Save'}
        </button>
      </section>

      <section class="settings-section">
        <h3 class="settings-label">Campaign</h3>
        <Show when={store.campaign.id}>
          <div class="settings-campaign-name">{store.campaign.name || 'Untitled campaign'}</div>
        </Show>
        <button class="btn-new-campaign" onClick={newCampaign}>
          {store.campaign.id ? 'New Campaign (save & start fresh)' : 'Start a Campaign'}
        </button>
        <p class="settings-hint">Your game saves automatically and survives reloads. Starting a new campaign clears the current one on this device.</p>
      </section>

      <section class="settings-section">
        <h3 class="settings-label">Save / Load</h3>
        <div class="settings-save-section">
          <Show when={store.campaign.id}>
            <button class="btn-export" onClick={exportGame}>Export Save (JSON)</button>
          </Show>
          <button class="btn-import" onClick={importGame}>Import Save File</button>
          <input
            ref={fileInput}
            type="file"
            accept=".json"
            class="import-file-input"
            onChange={handleImportFile}
          />
        </div>
        <p class="settings-hint">Export downloads your game as a JSON file. Import loads a previously saved game, replacing the current one.</p>
      </section>

      <section class="settings-section">
        <h3 class="settings-label">Theme</h3>
        <div class="theme-controls">
          <button class="btn-theme" onClick={toggleMode}>
            {store.system.settings.theme.startsWith('dark') ? 'Light' : 'Dark'}
          </button>
          <button class="btn-theme" onClick={cycleTheme}>
            Next Palette
          </button>
          <span class="theme-current">{store.system.settings.theme}</span>
        </div>
      </section>
    </div>
  );
}

function For(props) {
  return props.each.map(props.children);
}
