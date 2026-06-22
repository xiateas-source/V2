import { render } from 'solid-js/web';
import App from './ui/App.jsx';
import { initData } from './data/index.js';
import { restoreKeys, restoreQuickActions, restoreFromIDB } from './data/keys.js';
import { initSync } from './data/sync.js';

const root = document.getElementById('app');

initData().then(async () => {
  restoreKeys();
  restoreQuickActions();
  await restoreFromIDB();
  render(() => <App />, root);
  initSync();
});
