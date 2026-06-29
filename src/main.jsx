import { render } from 'solid-js/web';
import App from './ui/App.jsx';
import { initData } from './data/index.js';
import { restoreKeys, restoreQuickActions, restoreFromIDB } from './data/keys.js';
import { initSync, startLiveSync, restoreGuestSession } from './data/sync.js';
import { restoreSession, initLocalPersistence } from './data/persist.js';

const root = document.getElementById('app');

initData().then(async () => {
  restoreKeys();
  restoreQuickActions();
  await restoreFromIDB();
  // Restore guest multiplay state before hydrating the campaign, so
  // getCampaignPath() uses the correct host uid when reconciling cloud data.
  await restoreGuestSession();
  await restoreSession();      // hydrate saved campaign before first render
  render(() => <App />, root);
  initSync();                  // debounced cloud writes
  initLocalPersistence();      // local-first save on change
  startLiveSync();             // realtime listener — both host and guest
});
