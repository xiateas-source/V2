import { setStore } from '../state/index.js';

const KEYS_STORAGE = 'tp2_provider_keys';
const SETTINGS_STORAGE = 'tp2_provider_settings';
const QA_STORAGE = 'tp2_quick_actions';

export function saveKeys(geminiKey, openrouterKey) {
  try {
    localStorage.setItem(KEYS_STORAGE, JSON.stringify({ geminiKey, openrouterKey }));
  } catch {}
}

export function saveProviderSettings(geminiModel) {
  try {
    localStorage.setItem(SETTINGS_STORAGE, JSON.stringify({ geminiModel }));
  } catch {}
}

export function saveQuickActions(config) {
  try { localStorage.setItem(QA_STORAGE, JSON.stringify(config)); } catch {}
}

export function restoreQuickActions() {
  try {
    const raw = localStorage.getItem(QA_STORAGE);
    if (raw) {
      const config = JSON.parse(raw);
      if (config) setStore('system', 'settings', 'quickActions', config);
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
