import { setStore, store, DEFAULT_SYSTEM } from '../state/index.js';
import { getByKey } from './local.js';
import { dbWrite, dbRead } from './firebase.js';

const KEYS_STORAGE = 'tp2_provider_keys';
const SETTINGS_STORAGE = 'tp2_provider_settings';
const QA_STORAGE = 'tp2_quick_actions';
const SHARED_KEYS_PATH = 'shared/providerKeys';

function idbPut(key, value) {
  try {
    const req = indexedDB.open('tinklepebble-v2', 1);
    req.onsuccess = () => {
      try {
        const tx = req.result.transaction('meta', 'readwrite');
        tx.objectStore('meta').put({ key, value, ts: Date.now() });
      } catch {}
    };
  } catch {}
}

export function saveKeys(geminiKey, openrouterKey) {
  try {
    localStorage.setItem(KEYS_STORAGE, JSON.stringify({ geminiKey, openrouterKey }));
  } catch {}
  idbPut('_providerKeys', { geminiKey, openrouterKey });
  dbWrite(SHARED_KEYS_PATH, { geminiKey, openrouterKey, ts: Date.now() }).catch(() => {});
}

export function saveProviderSettings(geminiModel) {
  try {
    localStorage.setItem(SETTINGS_STORAGE, JSON.stringify({ geminiModel }));
  } catch {}
  idbPut('_providerSettings', { geminiModel });
}

export function saveQuickActions(config) {
  try { localStorage.setItem(QA_STORAGE, JSON.stringify(config)); } catch {}
  idbPut('_quickActions', config);
}

export function restoreQuickActions() {
  try {
    const raw = localStorage.getItem(QA_STORAGE);
    if (raw) {
      const config = JSON.parse(raw);
      const defaults = DEFAULT_SYSTEM.settings.quickActions;
      if (config && typeof config === 'object') {
        setStore('system', 'settings', 'quickActions', {
          ...defaults,
          ...config,
          active: Array.isArray(config.active) ? config.active : defaults.active,
          custom: Array.isArray(config.custom) ? config.custom : defaults.custom,
        });
      }
    }
  } catch {}
}

export function restoreKeys() {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE);
    if (raw) {
      const { geminiKey, openrouterKey } = JSON.parse(raw);
      if (geminiKey) setStore('system', 'providers', 'geminiKey', geminiKey);
      if (openrouterKey) setStore('system', 'providers', 'openrouterKey', openrouterKey);
    }
  } catch {}
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE);
    if (raw) {
      const { geminiModel } = JSON.parse(raw);
      if (geminiModel) setStore('system', 'providers', 'geminiModel', geminiModel);
    }
  } catch {}
}

export async function restoreFromIDB() {
  const hasKey = store.system.providers.geminiKey || store.system.providers.openrouterKey;
  if (hasKey) return;

  // Try IndexedDB first (survives localStorage clear)
  try {
    const keysRecord = await getByKey('meta', '_providerKeys');
    if (keysRecord?.value) {
      const { geminiKey, openrouterKey } = keysRecord.value;
      if (geminiKey) {
        setStore('system', 'providers', 'geminiKey', geminiKey);
        try { localStorage.setItem(KEYS_STORAGE, JSON.stringify({ geminiKey, openrouterKey: openrouterKey || '' })); } catch {}
      }
      if (openrouterKey) setStore('system', 'providers', 'openrouterKey', openrouterKey);
    }
  } catch {}

  // If still no key, try Firebase (synced from other device)
  if (!store.system.providers.geminiKey) {
    try {
      const shared = await dbRead(SHARED_KEYS_PATH);
      if (shared?.geminiKey) {
        setStore('system', 'providers', 'geminiKey', shared.geminiKey);
        if (shared.openrouterKey) setStore('system', 'providers', 'openrouterKey', shared.openrouterKey);
        try { localStorage.setItem(KEYS_STORAGE, JSON.stringify({ geminiKey: shared.geminiKey, openrouterKey: shared.openrouterKey || '' })); } catch {}
        idbPut('_providerKeys', { geminiKey: shared.geminiKey, openrouterKey: shared.openrouterKey || '' });
      }
    } catch {}
  }

  try {
    const settingsRecord = await getByKey('meta', '_providerSettings');
    if (settingsRecord?.value?.geminiModel) {
      setStore('system', 'providers', 'geminiModel', settingsRecord.value.geminiModel);
    }
  } catch {}

  try {
    const qaRecord = await getByKey('meta', '_quickActions');
    if (qaRecord?.value) {
      setStore('system', 'settings', 'quickActions', qaRecord.value);
    }
  } catch {}
}
