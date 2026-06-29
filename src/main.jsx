import { render } from 'solid-js/web';
import App from './ui/App.jsx';
import { initData } from './data/index.js';
import { restoreKeys, restoreQuickActions, restoreFromIDB } from './data/keys.js';
import { initSync, startLiveSync, restoreGuestSession } from './data/sync.js';
import { restoreSession, initLocalPersistence } from './data/persist.js';

const root = document.getElementById('app');

async function boot() {
  restoreKeys();
  restoreQuickActions();
  await restoreFromIDB();
  await restoreGuestSession();
  await restoreSession();
  render(() => <App />, root);
  initSync();
  initLocalPersistence();
  startLiveSync();
}

initData().then(boot).catch((err) => {
  console.error('Boot failed:', err);
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:24px;gap:16px;font-family:sans-serif;text-align:center">
      <div style="font-size:32px">⚠️</div>
      <div style="font-size:18px;font-weight:600">Something went wrong</div>
      <div style="font-size:13px;opacity:.7;max-width:280px">${err?.message || 'The app failed to start. Your game data is safe.'}</div>
      <button onclick="location.reload()" style="margin-top:8px;padding:12px 24px;border-radius:10px;border:none;background:#6c63ff;color:#fff;font-size:15px;cursor:pointer">Reload</button>
      <button onclick="localStorage.clear();location.reload()" style="padding:8px 16px;border-radius:8px;border:1px solid #888;background:none;color:inherit;font-size:13px;cursor:pointer">Clear cache &amp; reload</button>
    </div>
  `;
});
