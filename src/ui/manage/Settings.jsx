import { createSignal, Show, For } from 'solid-js';
import { store, setStore, resetCampaign } from '../../state/index.js';
import { saveKeys as persistKeys, saveProviderSettings } from '../../data/keys.js';
import { clearActiveCampaign, exportSnapshot, saveLocalNow, healArrays } from '../../data/persist.js';
import { buildShareId, stopLiveSync, forceSyncNow, setPresence } from '../../data/sync.js';
import { getUid } from '../../data/firebase.js';
import Contracts from './Contracts.jsx';
import CharCreate from '../setup/CharCreate.jsx';

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
  const [subView, setSubView] = createSignal(null);
  const [identityName, setIdentityName] = createSignal(store.system.playerIdentity?.name || '');
  const [identitySaved, setIdentitySaved] = createSignal(false);
  const [shareCopied, setShareCopied] = createSignal(false);

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
    stopLiveSync();
    setStore('system', 'multiplay', { role: 'solo', hostUid: '' });
    await clearActiveCampaign();
    resetCampaign(setStore);
  }

  async function shareInvite() {
    const shareId = buildShareId();
    if (!shareId) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { text: "Can't generate an invite link yet — still connecting to the server. Try again in a moment.", type: 'error' } }));
      return;
    }
    // Push current state immediately so a guest who joins right after sharing
    // doesn't hit a stale or empty record at the host's campaign path.
    try {
      await forceSyncNow();
    } catch {
      window.dispatchEvent(new CustomEvent('toast', { detail: { text: "You appear to be offline — the invite link is copied, but guests may see 'Campaign not found' until you reconnect.", type: 'error' } }));
    }
    const url = `${window.location.origin}${window.location.pathname}?join=${shareId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${store.campaign.name || 'my game'}`, text: 'Tap to join my Tinklepebble game', url });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      prompt('Copy this invite link:', url);
    }
  }

  function saveIdentity() {
    setStore('system', 'playerIdentity', 'name', identityName().trim());
    setIdentitySaved(true);
    setTimeout(() => setIdentitySaved(false), 2000);
  }

  function togglePC(name) {
    const current = store.system.playerIdentity?.selectedPCs || [];
    const next = current.includes(name) ? current.filter(n => n !== name) : [...current, name];
    setStore('system', 'playerIdentity', 'selectedPCs', next);
  }

  function amIHere() {
    const uid = getUid();
    return !!(uid && store.campaign.presence?.[uid]?.active);
  }

  function togglePresence() {
    setPresence(!amIHere());
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
        window.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Invalid save file: missing campaign data.', type: 'error' } }));
        return;
      }
      if (!confirm(`Load save "${data.campaign.name || 'Untitled'}"? This replaces the current game.`)) return;
      setStore('campaign', healArrays(data.campaign));
      await saveLocalNow();
      window.dispatchEvent(new CustomEvent('toast', { detail: { text: `Game loaded: ${data.campaign.name || 'Untitled'}` } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Failed to load save file: ' + (err.message || 'Unknown error'), type: 'error' } }));
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
    <>
    <Show when={subView() === 'contracts'}>
      <Contracts onBack={() => setSubView(null)} />
    </Show>
    <Show when={subView() === 'charCreate'}>
      <CharCreate onBack={() => setSubView(null)} />
    </Show>
    <Show when={!subView()}>
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
            <Show when={store.system.multiplay?.role === 'guest'}>
              <div class="settings-guest-badge">
                <i class="ph ph-users" /> Joined as guest
              </div>
            </Show>
            <button class="btn-contracts" onClick={() => setSubView('contracts')}>
              <i class="ph ph-scroll" />
              <span>DM Contracts</span>
            </button>
            <Show when={store.system.multiplay?.role !== 'guest'}>
              <button class="btn-invite" onClick={shareInvite}>
                <i class="ph ph-link" />
                <span>{shareCopied() ? 'Link copied!' : 'Invite Players — Share Campaign Link'}</span>
              </button>
            </Show>
            <button class="btn-add-character" onClick={() => setSubView('charCreate')}>
              <i class="ph ph-user-plus" />
              <span>Add Character to Party</span>
            </button>
          </Show>
          <button class="btn-new-campaign" onClick={newCampaign}>
            {store.campaign.id ? 'New Campaign (save & start fresh)' : 'Start a Campaign'}
          </button>
          <p class="settings-hint">Your game saves automatically and survives reloads. Starting a new campaign clears the current one on this device.</p>
        </section>

        <Show when={store.campaign.id && store.campaign.characters?.length > 0}>
          <section class="settings-section">
            <h3 class="settings-label">Who Am I?</h3>
            <p class="settings-hint">Your name appears on your messages so the party knows who sent what.</p>
            <div class="field-group">
              <label class="field-label">Your name</label>
              <input
                type="text"
                class="field-input"
                placeholder="e.g. Jessica"
                value={identityName()}
                onInput={(e) => setIdentityName(e.target.value)}
              />
            </div>
            <div class="field-group">
              <label class="field-label">Your character(s)</label>
              <div class="identity-pc-list">
                <For each={store.campaign.characters}>
                  {(pc) => {
                    const selected = () => (store.system.playerIdentity?.selectedPCs || []).includes(pc.name);
                    return (
                      <button
                        class={`identity-pc-chip ${selected() ? 'selected' : ''}`}
                        onClick={() => togglePC(pc.name)}
                      >
                        {pc.avatar || pc.name[0]} {pc.name}
                        <span class="identity-pc-sub">{pc.class} {pc.level}</span>
                      </button>
                    );
                  }}
                </For>
              </div>
            </div>
            <button class="btn-save" onClick={saveIdentity}>
              {identitySaved() ? 'Saved' : 'Save Identity'}
            </button>

            <div class="field-group presence-group">
              <label class="field-label">Presence</label>
              <button class={`btn-presence ${amIHere() ? 'leave' : 'here'}`} onClick={togglePresence}>
                <i class={`ph ${amIHere() ? 'ph-sign-out' : 'ph-sign-in'}`} />
                <span>{amIHere() ? "I've left" : "I'm here"}</span>
              </button>
              <Show when={Object.values(store.campaign.presence || {}).some(p => p.active)}>
                <ul class="presence-list">
                  <For each={Object.values(store.campaign.presence || {}).filter(p => p.active)}>
                    {(p) => (
                      <li class="presence-entry">
                        <span class="presence-dot" /> {p.name || 'Player'}
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </div>
          </section>
        </Show>

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
    </Show>
    </>
  );
}


