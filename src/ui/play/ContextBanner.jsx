import { Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { confirmLocation, rejectLocation } from '../../ai/mechanics.js';

export default function ContextBanner() {
  const loc = () => store.campaign.location;
  const time = () => store.campaign.time;
  const weather = () => store.campaign.weather;
  const pending = () => store.campaign.pendingLocation;
  const isMulti = () => store.system.playerIdentity.mode === 'multi';

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
      <Show when={loc() || time()}>
        <div class="context-banner">
          <Show when={loc()}><span class="ctx-location">{loc()}</span></Show>
          <Show when={time()}><span class="ctx-time">{time()}</span></Show>
          <Show when={weather()}><span class="ctx-weather">{weather()}</span></Show>
          <button
            class={`ctx-mode-toggle ${isMulti() ? 'multi' : 'solo'}`}
            onClick={toggleMultiPlayer}
            title={isMulti() ? 'Multi-player' : 'Solo'}
          >
            {isMulti() ? '\u{1F46B}' : '\u{1F9D1}'}
          </button>
        </div>
      </Show>
    </>
  );
}
