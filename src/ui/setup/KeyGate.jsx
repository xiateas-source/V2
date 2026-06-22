import { createSignal } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { saveKeys } from '../../data/keys.js';

export default function KeyGate(props) {
  const [key, setKey] = createSignal(store.system.providers.geminiKey || '');
  const [testing, setTesting] = createSignal(false);
  const [error, setError] = createSignal('');

  async function validate() {
    const k = key().trim();
    if (!k) { setError('Paste your API key'); return; }

    setTesting(true);
    setError('');

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${k}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say OK' }] }] }),
      });
      if (!res.ok) throw new Error('Invalid key');
      setStore('system', 'providers', 'geminiKey', k);
      saveKeys(k, store.system.providers.openrouterKey || '');
      props.onDone?.();
    } catch (e) {
      setError('Key validation failed. Check the key and try again.');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div class="keygate">
      <h2 class="keygate-title">API Key</h2>
      <p class="keygate-desc">Paste your free Gemini API key to power the AI dungeon master.</p>
      <a class="keygate-link" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Get a free key from Google AI Studio</a>
      <input
        class="keygate-input"
        type="password"
        placeholder="Paste key here"
        value={key()}
        onInput={(e) => setKey(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && validate()}
      />
      {error() && <div class="keygate-error">{error()}</div>}
      <button class="keygate-btn" onClick={validate} disabled={testing()}>
        {testing() ? 'Validating...' : 'Continue'}
      </button>
    </div>
  );
}
