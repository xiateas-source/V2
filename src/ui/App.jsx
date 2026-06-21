import { createSignal } from 'solid-js';
import { store } from '../state/index.js';

export default function App() {
  const [mode, setMode] = createSignal('play');

  const hasCampaign = () => store.campaign.id !== '';

  return (
    <div class="app-shell">
      <main class="app-content">
        {!hasCampaign() ? (
          <div class="no-campaign">
            <p>No campaign found.</p>
            <p style={{ color: 'var(--color-text-muted)', 'font-size': 'var(--font-size-sm)' }}>
              Setup mode coming soon.
            </p>
          </div>
        ) : (
          <div class="mode-placeholder">
            <p>{mode()} mode</p>
          </div>
        )}
      </main>
      <nav class="bottom-nav">
        <button class="nav-item" classList={{ active: mode() === 'reference' }} onClick={() => setMode('reference')}>
          Cargo
        </button>
        <button class="nav-item" classList={{ active: mode() === 'journal' }} onClick={() => setMode('journal')}>
          Journal
        </button>
        <button class="nav-item" classList={{ active: mode() === 'manage' }} onClick={() => setMode('manage')}>
          Settings
        </button>
      </nav>
    </div>
  );
}
