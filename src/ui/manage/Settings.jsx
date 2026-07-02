import { createSignal, createResource, Show, For } from 'solid-js';
import { store, setStore, resetCampaign } from '../../state/index.js';
import { saveKeys as persistKeys, saveProviderSettings } from '../../data/keys.js';
import { clearActiveCampaign, exportSnapshot, saveLocalNow, healArrays, lastSavedAt } from '../../data/persist.js';
import { buildShareId, stopLiveSync, forceSyncNow, setPresence, setActiveBundle } from '../../data/sync.js';
import { getUid } from '../../data/firebase.js';
import { listBundles, deleteBundle, exportBundle } from '../../data/bundles.js';
import Contracts from './Contracts.jsx';
import CharCreate from '../setup/CharCreate.jsx';
import ContentImport from '../setup/ContentImport.jsx';

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
    if (!store.campaign.id) {
      stopLiveSync();
      setStore('system', 'multiplay', { role: 'solo', hostUid: '' });
      await clearActiveCampaign();
      resetCampaign(setStore);
      return;
    }
    const choice = confirm('Start a new campaign?\n\nOK = export a backup first, then clear.\nCancel = go back.');
    if (!choice) return;
    exportGame();
    setTimeout(async () => {
      stopLiveSync();
      setStore('system', 'multiplay', { role: 'solo', hostUid: '' });
      await clearActiveCampaign();
      resetCampaign(setStore);
    }, 600);
  }

  function toggleLargeText() {
    const next = !store.system.settings.largeText;
    setStore('system', 'settings', 'largeText', next);
  }

  function hardRefresh() {
    if (confirm('Reload the app to get the latest version?\n\nYour game data is safe — this only clears the app cache.')) {
      location.reload();
    }
  }

  function lastSavedLabel() {
    const ts = lastSavedAt();
    if (!ts) return 'Not saved yet this session';
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return 'Saved just now';
    if (mins === 1) return 'Saved 1 min ago';
    return `Saved ${mins} min ago`;
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

  const [bundleRefresh, setBundleRefresh] = createSignal(0);
  const [bundles] = createResource(bundleRefresh, listBundles);

  function isBundleActive(id) {
    return !!store.campaign.activeBundles?.[id]?.active;
  }

  function toggleBundleActive(bundle) {
    setActiveBundle(bundle.id, bundle.name, bundle.version, !isBundleActive(bundle.id));
  }

  async function handleDeleteBundle(bundle) {
    if (!confirm(`Delete "${bundle.name}"? This removes it from this device only.`)) return;
    await deleteBundle(bundle.id);
    if (isBundleActive(bundle.id)) setActiveBundle(bundle.id, bundle.name, bundle.version, false);
    setBundleRefresh(n => n + 1);
  }

  function handleExportBundle(bundle) {
    const raw = exportBundle(bundle);
    const json = JSON.stringify(raw, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = (bundle.name || 'bundle').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    a.download = `${name}-${bundle.version || '1.0.0'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // "This campaign uses a bundle you don't have installed" — refs live in
  // synced campaign state (activeBundles), actual content stays local-only.
  // Suppressed while the bundles list is still loading, so a bundle that IS
  // installed doesn't flash as "missing" during the async IndexedDB read.
  function missingBundles() {
    if (bundles.loading) return [];
    const active = Object.values(store.campaign.activeBundles || {}).filter(b => b.active);
    const installedIds = new Set((bundles() || []).map(b => b.id));
    return active.filter(b => !installedIds.has(b.id));
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

  const THEME_NAMES = [
    'Obsidian', 'Abyss', 'Arcane', 'Embers', 'Void',
    'Crimson', 'Grove', 'Dusk', 'Steel', 'Lantern',
    'Night Folio', 'Lamplight',
  ];
  const LIGHT_NAMES = [
    'Parchment', 'Daybreak', 'Fern', 'Terracotta', 'Sky',
    'Rose', 'Honey', 'Lavender', 'Stone', 'Seafoam',
    'Day Folio', 'Lamplight Day',
  ];

  function themeName() {
    const t = store.system.settings.theme;
    const [mode, numStr] = t.split('-');
    const num = parseInt(numStr, 10);
    return mode === 'dark' ? THEME_NAMES[num] : LIGHT_NAMES[num];
  }

  function cycleTheme() {
    const current = store.system.settings.theme;
    const [mode, numStr] = current.split('-');
    const num = parseInt(numStr, 10);
    const next = num >= 11 ? `${mode}-0` : `${mode}-${num + 1}`;
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
    <Show when={subView() === 'contentImport'}>
      <ContentImport onBack={() => { setSubView(null); setBundleRefresh(n => n + 1); }} />
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
          <h3 class="settings-label">Content Bundles</h3>

          <Show when={missingBundles().length > 0}>
            <For each={missingBundles()}>
              {(b) => (
                <div class="settings-hint" style="color: var(--color-warning, #b8860b)">
                  This campaign uses "{b.name}" — you don't have it. <button class="btn-import" onClick={() => setSubView('contentImport')}>Import</button>
                </div>
              )}
            </For>
          </Show>

          <Show when={!bundles.loading} fallback={<p class="settings-hint">Loading bundles…</p>}>
            <Show when={(bundles() || []).length > 0} fallback={<p class="settings-hint">No bundles installed yet.</p>}>
              <ul class="bundle-list">
                <For each={bundles()}>
                  {(b) => (
                    <li class="bundle-row">
                      <div class="bundle-row-info">
                        <span class="bundle-row-name">{b.name}</span>
                        <span class="bundle-row-meta">v{b.version} · {b.author}</span>
                      </div>
                      <div class="bundle-row-actions">
                        <button
                          class={`btn-theme ${isBundleActive(b.id) ? 'active' : ''}`}
                          onClick={() => toggleBundleActive(b)}
                        >
                          {isBundleActive(b.id) ? 'Active' : 'Inactive'}
                        </button>
                        <button class="btn-export" onClick={() => handleExportBundle(b)}>Export</button>
                        <button class="btn-import" onClick={() => handleDeleteBundle(b)}>Delete</button>
                      </div>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>

          <button class="btn-import" onClick={() => setSubView('contentImport')}>+ Import Bundle</button>
          <p class="settings-hint">Bundles add optional campaign content (adventures, encounters, NPCs, locations, AI guidance, DM tools) authored outside the app. Import a bundle file, then mark it Active to use it in this campaign.</p>
        </section>

        <section class="settings-section">
          <h3 class="settings-label">Display</h3>
          <div class="theme-controls">
            <button class="btn-theme" onClick={toggleMode}>
              {store.system.settings.theme.startsWith('dark') ? 'Light' : 'Dark'}
            </button>
            <button class="btn-theme" onClick={cycleTheme}>
              Next Palette
            </button>
            <span class="theme-current">{themeName()}</span>
          </div>
          <div class="settings-large-text-row">
            <span class="settings-large-text-label">Large Text</span>
            <button
              class={`btn-large-text-toggle ${store.system.settings.largeText ? 'active' : ''}`}
              onClick={toggleLargeText}
            >
              {store.system.settings.largeText ? 'On' : 'Off'}
            </button>
          </div>
          <p class="settings-hint">Makes all text ~25% bigger — easier to read without glasses.</p>
        </section>

        <section class="settings-section">
          <h3 class="settings-label">App Updates</h3>
          <div class="settings-save-status">{lastSavedLabel()}</div>
          <button class="btn-refresh-app" onClick={hardRefresh}>
            <i class="ph ph-arrows-clockwise" /> Check for Update
          </button>
          <p class="settings-hint">The app updates automatically. Tap this if something looks broken — your game data is never lost by refreshing.</p>
        </section>
      </div>
    </Show>
    </>
  );
}


