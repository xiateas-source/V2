import { render } from 'solid-js/web';
import App from './ui/App.jsx';
import { initData } from './data/index.js';
import { restoreKeys } from './data/keys.js';
import { initSync } from './data/sync.js';

const root = document.getElementById('app');

initData().then(() => {
  restoreKeys();
  render(() => <App />, root);
  initSync();
});
