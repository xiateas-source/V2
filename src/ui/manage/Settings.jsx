import { createSignal } from 'solid-js';
import { store, setStore } from '../../state/index.js';

export default function Settings() {
  const [gemKey, setGemKey] = createSignal(store.system.providers.geminiKey);
  const [orKey, setOrKey] = createSignal(store.system.providers.openrouterKey);
  const [saved, setSaved] = createSignal(false);

  function saveKeys() {
    setStore('system', 'providers', 'geminiKey', gemKey().trim());
    setStore('system', 'providers', 'openrouterKey', orKey().trim());
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
        <h3 class="settings-label">AI Provider Keys</h3>
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
          {saved() ? 'Saved' : 'Save Keys'}
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
