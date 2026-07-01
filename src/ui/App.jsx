import { createSignal, createMemo, createEffect, Show, onMount, onCleanup } from 'solid-js';
import { store, setStore } from '../state/index.js';
import PlayerOnboard from './setup/PlayerOnboard.jsx';
import GuestCharPick from './setup/GuestCharPick.jsx';
import Chat from './play/Chat.jsx';
import Cargo from './reference/Cargo.jsx';
import Journal from './reference/Journal.jsx';
import Settings from './manage/Settings.jsx';
import Toast from './shared/Toast.jsx';
import { D20 } from './shared/icons.jsx';

export default function App() {
  const [mode, setMode] = createSignal('play');
  const [lastSeen, setLastSeen] = createSignal({
    cargo: { gold: 0, itemCount: 0 },
    journal: { questCount: 0, npcCount: 0 },
  });

  const hasCampaign = () => store.campaign.id !== '';

  // Show character picker to guests who haven't claimed a character yet.
  // Session-only dismiss (signal, not store) — showing the picker again on
  // reload is fine; it disappears the moment they pick or selectedPCs is set.
  const [guestPickDismissed, setGuestPickDismissed] = createSignal(false);
  const needsGuestPick = () =>
    !guestPickDismissed() &&
    hasCampaign() &&
    store.system.multiplay?.role === 'guest' &&
    store.campaign.characters.length > 0 &&
    !(store.system.playerIdentity?.selectedPCs?.length);

  function handleGuestPickDone(action) {
    if (action === 'add') {
      setGuestPickDismissed(true);
      setMode('manage');
      setTimeout(() => window.dispatchEvent(new CustomEvent('toast', {
        detail: { text: 'Tap "Add Character to Party" to create your character.' }
      })), 100);
    } else {
      setGuestPickDismissed(true);
    }
  }

  // Tap-to-source: pills/links elsewhere can request a mode switch.
  function onNavigate(e) {
    const m = e.detail?.mode;
    if (m === 'charsheet') { setMode('play'); return; } // sheet opens over Play
    if (['cargo', 'journal', 'manage', 'play'].includes(m)) setMode(m);
  }
  onMount(() => window.addEventListener('tp-navigate', onNavigate));
  onCleanup(() => window.removeEventListener('tp-navigate', onNavigate));

  createEffect(() => {
    document.documentElement.style.fontSize = store.system.settings.largeText ? '20px' : '';
  });

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
    if (mode() === newMode) {
      setMode('play');
      return;
    }
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
          <Show when={needsGuestPick()} fallback={
            <>
              <Show when={mode() === 'play'}><Chat /></Show>
              <Show when={mode() === 'cargo'}><Cargo /></Show>
              <Show when={mode() === 'journal'}><Journal /></Show>
              <Show when={mode() === 'manage'}><Settings /></Show>
            </>
          }>
            <GuestCharPick onDone={handleGuestPickDone} />
          </Show>
        </Show>
      </main>
      <Show when={hasCampaign()}>
        <nav class="bottom-nav">
          <button class="nav-item" classList={{ active: mode() === 'cargo' }} onClick={() => switchMode('cargo')}>
            <span class="nav-icon"><i class="ph ph-package" /></span>
            <span class="nav-label">Cargo</span>
            <Show when={mode() !== 'cargo' && cargoBadge()}><span class="nav-badge" /></Show>
          </button>
          <button class="nav-item" classList={{ active: mode() === 'play' }} onClick={() => setMode('play')}>
            <span class="nav-icon"><D20 /></span>
            <span class="nav-label">Play</span>
          </button>
          <button class="nav-item" classList={{ active: mode() === 'journal' }} onClick={() => switchMode('journal')}>
            <span class="nav-icon"><i class="ph ph-book-open" /></span>
            <span class="nav-label">Journal</span>
            <Show when={mode() !== 'journal' && journalBadge()}><span class="nav-badge" /></Show>
          </button>
          <button class="nav-item" classList={{ active: mode() === 'manage' }} onClick={() => switchMode('manage')}>
            <span class="nav-icon"><i class="ph ph-gear-six" /></span>
            <span class="nav-label">Settings</span>
          </button>
        </nav>
      </Show>
      <Toast />
    </div>
  );
}
