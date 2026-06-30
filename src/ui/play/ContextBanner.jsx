import { Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { confirmLocation, rejectLocation } from '../../ai/mechanics.js';
import { autoRead, toggleAutoRead } from '../../audio/browserTTS.js';
import { getUid } from '../../data/index.js';
import { navigateTo } from '../shared/sourceBus.js';

export default function ContextBanner() {
  const loc = () => store.campaign.location;
  const time = () => store.campaign.time;
  const weather = () => store.campaign.weather;
  const pending = () => store.campaign.pendingLocation;
  const isMulti = () => store.system.playerIdentity.mode === 'multi';
  const inCombat = () => store.campaign.combatState?.active;
  const othersHere = () => {
    const uid = getUid();
    return Object.entries(store.campaign.presence || {})
      .filter(([id, p]) => id !== uid && p.active);
  };

  function toggleMultiPlayer() {
    const newMode = isMulti() ? 'single' : 'multi';
    setStore('system', 'playerIdentity', 'mode', newMode);
    if (newMode === 'multi') {
      window.dispatchEvent(new CustomEvent('player-handoff'));
    }
  }

  return (
    <>
      <Show when={pending()}>
        <div class="scene-confirm">
          <span class="scene-confirm-text">Move to {pending().value}?</span>
          <div class="scene-confirm-actions">
            <button class="scene-confirm-go" onClick={confirmLocation}>Go</button>
            <button class="scene-confirm-stay" onClick={rejectLocation}>Stay</button>
          </div>
        </div>
      </Show>
      <Show when={loc() || time() || (!inCombat() && (isMulti() || othersHere().length > 0))}>
        <div class={`head ${inCombat() ? 'head-compact' : ''}`}>
          <div class="head-left">
            <Show when={loc()}><div class="loc">{loc()}</div></Show>
            <Show when={!inCombat() && (time() || weather())}>
              <div class="loc-meta">
                <Show when={time()}><span>{time()}</span></Show>
                <Show when={time() && weather()}><span class="sep">·</span></Show>
                <Show when={weather()}><span>{weather()}</span></Show>
              </div>
            </Show>
          </div>
          <Show when={!inCombat()}>
            <div class="head-right">
              <Show when={othersHere().length > 0}>
                <button
                  class="btn-icon active"
                  onClick={() => navigateTo('manage')}
                  title={othersHere().map(([, p]) => p.name || 'Player').join(', ') + ' here'}
                >
                  <i class="ph ph-circle" />
                  <span class="presence-badge">{othersHere().length}</span>
                </button>
              </Show>
              <button
                class={`btn-icon ${isMulti() ? 'active' : ''}`}
                onClick={toggleMultiPlayer}
                title={isMulti() ? 'Multi-player' : 'Solo'}
              >
                <i class={isMulti() ? 'ph ph-users-three' : 'ph ph-user'} />
              </button>
              <button
                class={`btn-icon ${autoRead() ? 'active' : ''}`}
                onClick={toggleAutoRead}
                title="Read aloud"
              >
                <i class="ph ph-speaker-high" />
              </button>
            </div>
          </Show>
        </div>
      </Show>
    </>
  );
}
