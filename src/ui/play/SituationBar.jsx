import { For, Show } from 'solid-js';
import { store } from '../../state/index.js';

export default function SituationBar() {
  const mission = () => store.campaign.primaryMission;
  const consequences = () => store.campaign.consequences.filter(c => !c.resolved);
  const activeQuests = () => store.campaign.quests.filter(q => q.status === 'active');

  const hasContent = () => mission() || consequences().length > 0 || activeQuests().length > 0;

  return (
    <Show when={hasContent()}>
      <div class="situation-bar">
        <Show when={mission()}>
          <span class="sit-chip sit-mission">{mission().length > 50 ? mission().slice(0, 50) + '...' : mission()}</span>
        </Show>
        <For each={consequences()}>
          {(c) => (
            <span class="sit-chip sit-consequence">
              {c.text.length > 40 ? c.text.slice(0, 40) + '...' : c.text}
              <Show when={c.deadline}><span class="sit-deadline">{c.deadline}</span></Show>
            </span>
          )}
        </For>
        <For each={activeQuests()}>
          {(q) => (
            <span class="sit-chip sit-quest">
              {q.text.length > 40 ? q.text.slice(0, 40) + '...' : q.text}
            </span>
          )}
        </For>
      </div>
    </Show>
  );
}
