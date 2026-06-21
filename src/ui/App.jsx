import { createSignal, Show } from 'solid-js';
import { store } from '../state/index.js';
import { loadDemoCampaign } from '../data/demo.js';
import Chat from './play/Chat.jsx';

export default function App() {
  const [mode, setMode] = createSignal('play');

  const hasCampaign = () => store.campaign.id !== '';

  return (
    <div class="app-shell">
      <main class="app-content">
        <Show when={hasCampaign()} fallback={
          <div class="no-campaign">
            <p>No campaign found.</p>
            <button class="btn-demo" onClick={loadDemoCampaign}>Load Demo Campaign</button>
            <p style={{ color: 'var(--color-text-muted)', 'font-size': 'var(--font-size-sm)' }}>
              Setup mode coming soon.
            </p>
          </div>
        }>
          <Show when={mode() === 'play'}>
            <Chat />
          </Show>
          <Show when={mode() !== 'play'}>
            <div class="mode-placeholder">
              <p>{mode()} mode</p>
            </div>
          </Show>
        </Show>
      </main>
      <nav class="bottom-nav">
        <button class="nav-item" classList={{ active: mode() === 'play' }} onClick={() => setMode('play')}>
          Play
        </button>
        <button class="nav-item" classList={{ active: mode() === 'reference' }} onClick={() => setMode('reference')}>
          Cargo
        </button>
        <button class="nav-item" classList={{ active: mode() === 'manage' }} onClick={() => setMode('manage')}>
          Settings
        </button>
      </nav>
    </div>
  );
}
