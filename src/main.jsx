import { render } from 'solid-js/web';
import App from './ui/App.jsx';
import { initData } from './data/index.js';

const root = document.getElementById('app');

initData().then(() => {
  render(() => <App />, root);
});
