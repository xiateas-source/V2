import { setStore } from '../state/index.js';

const KEYS_STORAGE = 'tp2_provider_keys';

export function saveKeys(geminiKey, openrouterKey) {
  try {
    localStorage.setItem(KEYS_STORAGE, JSON.stringify({ geminiKey, openrouterKey }));
  } catch {}
}

export function restoreKeys() {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE);
    if (!raw) return;
    const { geminiKey, openrouterKey } = JSON.parse(raw);
    if (geminiKey) setStore('system', 'providers', 'geminiKey', geminiKey);
    if (openrouterKey) setStore('system', 'providers', 'openrouterKey', openrouterKey);
  } catch {}
}
