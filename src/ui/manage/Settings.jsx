import { createSignal } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { saveKeys as persistKeys, saveProviderSettings } from '../../data/keys.js';

const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash-lite', label: '2.0 Flash Lite (free, fast)' },
  { id: 'gemini-2.0-flash', label: '2.0 Flash' },
  { id: 'gemini-1.5-flash', label: '1.5 Flash' },
  { id: 'gemini-2.5-flash', label: '2.5 Flash' },
];

export default function Settings() {
  const [gemKey, setGemKey] = createSignal(store.system.providers.geminiKey);
  const [orKey, setOrKey] = createSignal(store.system.providers.openrouterKey);
  const [model, setModel] = createSignal(store.system.providers.geminiModel || 'gemini-2.0-flash-lite');
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
