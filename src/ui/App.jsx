import { createSignal, createMemo, Show } from 'solid-js';
import { store } from '../state/index.js';
import { loadDemoCampaign } from '../data/demo.js';
import PlayerOnboard from './setup/PlayerOnboard.jsx';
import Chat from './play/Chat.jsx';
import Cargo from './reference/Cargo.jsx';
import Journal from './reference/Journal.jsx';
import Settings from './manage/Settings.jsx';

export default function App() {
  const [mode, setMode] = createSignal('play');
  const [lastSeen, setLastSeen] = createSignal({
    cargo: { gold: 0, itemCount: 0 },
    journal: { questCount: 0, npcCount: 0 },
  });

  const hasCampaign = () => store.campaign.id !== '';

  const cargoBadge = createMemo(() => {
    const seen = lastSeen().cargo;
    const gold = store.campaign.gold;
    const totalGold = (gold.pp || 0) * 10 + (gold.gp || 0) + (gold.ep || 0) * 0.5 + (gold.sp || 0) * 0.1 + (gold.cp || 0) * 0.01;
    const inv = store.campaign.inventory?.carried || {};
    const itemCount = Object.values(inv).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    return totalGold !== seen.gold || itemCount !== seen.itemCount;
  });

  const journalBadge = createMemo(() => {
    const seen = lastSeen().journal;
    const questCount = store.campaign.quests?.length || 0;
    const npcCount = store.campaign.npcs?.length || 0;
    return questCount !== seen.questCount || npcCount !== seen.npcCount;
  });

  function switchMode(newMode) {
    if (mode() === 'cargo') {
      const gold = store.campaign.gold;
      const totalGold = (gold.pp || 0) * 10 + (gold.gp || 0) + (gold.ep || 0) * 0.5 + (gold.sp || 0) * 0.1 + (gold.cp || 0) * 0.01;
      const inv = store.campaign.inventory?.carried || {};
      const itemCount = Object.values(inv).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
      setLastSeen(prev => ({ ...prev, cargo: { gold: totalGold, itemCount } }));
    } else if (mode() === 'journal') {
      const questCount = store.campaign.quests?.length || 0;
      const npcCount = store.campaign.npcs?.length || 0;
      setLastSeen(prev => ({ ...prev, journal: { questCount, npcCount } }));
    }
    setMode(newMode);
  }

  return (
    <div class="app-shell">
      <main class="app-content">
        <Show when={hasCampaign()} fallback={<PlayerOnboard />}>
          <Show when={mode() === 'play'}><Chat /></Show>
          <Show when={mode() === 'cargo'}><Cargo /></Show>
          <Show when={mode() === 'journal'}><Journal /></Show>
          <Show when={mode() === 'manage'}><Settings /></Show>
        </Show>
      </main>
      <nav class="bottom-nav">
        <button class="nav-item" classList={{ active: mode() === 'play' }} onClick={() => switchMode('play')}>
          Play
        </button>
        <button class="nav-item" classList={{ active: mode() === 'cargo' }} onClick={() => switchMode('cargo')}>
          Cargo
          <Show when={mode() !== 'cargo' && cargoBadge()}><span class="nav-badge" /></Show>
        </button>
        <button class="nav-item" classList={{ active: mode() === 'journal' }} onClick={() => switchMode('journal')}>
          Journal
          <Show when={mode() !== 'journal' && journalBadge()}><span class="nav-badge" /></Show>
        </button>
        <button class="nav-item" classList={{ active: mode() === 'manage' }} onClick={() => switchMode('manage')}>
          Settings
        </button>
      </nav>
    </div>
  );
}
