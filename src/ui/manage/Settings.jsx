import { createSignal, Show } from 'solid-js';
import { store, setStore, resetCampaign } from '../../state/index.js';
import { saveKeys as persistKeys, saveProviderSettings } from '../../data/keys.js';
import { clearActiveCampaign } from '../../data/persist.js';

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
