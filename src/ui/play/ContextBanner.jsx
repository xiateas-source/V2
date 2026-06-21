import { Show } from 'solid-js';
import { store } from '../../state/index.js';
import { confirmLocation, rejectLocation } from '../../ai/mechanics.js';

export default function ContextBanner() {
  const loc = () => store.campaign.location;
  const time = () => store.campaign.time;
  const weather = () => store.campaign.weather;
  const pending = () => store.campaign.pendingLocation;

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
        </div>
      </Show>
    </>
  );
}
