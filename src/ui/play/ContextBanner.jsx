import { Show } from 'solid-js';
import { store } from '../../state/index.js';

export default function ContextBanner() {
  const loc = () => store.campaign.location;
  const time = () => store.campaign.time;
  const weather = () => store.campaign.weather;

  return (
    <Show when={loc() || time()}>
      <div class="context-banner">
        <Show when={loc()}><span class="ctx-location">{loc()}</span></Show>
        <Show when={time()}><span class="ctx-time">{time()}</span></Show>
        <Show when={weather()}><span class="ctx-weather">{weather()}</span></Show>
      </div>
    </Show>
  );
}
