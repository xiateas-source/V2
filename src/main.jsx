import { render } from 'solid-js/web';
import App from './ui/App.jsx';
import { initData } from './data/index.js';
import { restoreKeys, restoreQuickActions, restoreFromIDB } from './data/keys.js';
import { initSync } from './data/sync.js';
import { restoreSession, initLocalPersistence } from './data/persist.js';

const root = document.getElementById('app');

initData().then(async () => {
  restoreKeys();
  restoreQuickActions();
  await restoreFromIDB();
  await restoreSession();      // hydrate saved campaign before first render
  render(() => <App />, root);
  initSync();                  // cross-device cloud backup
  initLocalPersistence();      // local-first save on change
});
