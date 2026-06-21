import { createSignal, For, Show } from 'solid-js';
import { store } from '../../state/index.js';

export default function SituationBar() {
  const [detail, setDetail] = createSignal(null);

  const mission = () => store.campaign.primaryMission;
  const consequences = () => {
    const active = store.campaign.consequences.filter(c => !c.resolved);
    return active.sort((a, b) => {
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      return 0;
    });
  };
  const activeQuests = () => store.campaign.quests.filter(q => q.status === 'active');

  const hasContent = () => mission() || consequences().length > 0 || activeQuests().length > 0;

  return (
    <>
      <Show when={hasContent()}>
        <div class="situation-bar">
          <Show when={mission()}>
            <span class="sit-chip sit-mission" onClick={() => setDetail({ title: 'Primary Mission', text: mission() })}>
              {mission().length > 50 ? mission().slice(0, 50) + '...' : mission()}
            </span>
          </Show>
          <For each={consequences()}>
            {(c) => (
              <span
                class={`sit-chip sit-consequence${c.deadline ? ' sit-urgent' : ''}`}
                onClick={() => setDetail({ title: 'Consequence', text: c.text, type: c.type, deadline: c.deadline, location: c.location })}
              >
                {c.text.length > 40 ? c.text.slice(0, 40) + '...' : c.text}
                <Show when={c.deadline}><span class="sit-deadline">{c.deadline}</span></Show>
              </span>
            )}
          </For>
          <For each={activeQuests()}>
            {(q) => (
              <span
                class="sit-chip sit-quest"
                onClick={() => setDetail({ title: 'Quest', text: q.text, location: q.location, notes: q.notes })}
              >
                {q.text.length > 40 ? q.text.slice(0, 40) + '...' : q.text}
              </span>
            )}
          </For>
        </div>
      </Show>

      <Show when={detail()}>
        <div class="sit-detail-overlay" onClick={() => setDetail(null)}>
          <div class="sit-detail-popup" onClick={(e) => e.stopPropagation()}>
            <div class="sit-detail-title">{detail().title}</div>
            <div class="sit-detail-text">{detail().text}</div>
            <Show when={detail().type}><div class="sit-detail-meta">Type: {detail().type}</div></Show>
            <Show when={detail().deadline}><div class="sit-detail-meta sit-detail-deadline">Deadline: {detail().deadline}</div></Show>
            <Show when={detail().location}><div class="sit-detail-meta">Location: {detail().location}</div></Show>
            <Show when={detail().notes}><div class="sit-detail-meta">{detail().notes}</div></Show>
            <button class="sit-detail-close" onClick={() => setDetail(null)}>Close</button>
          </div>
        </div>
      </Show>
    </>
  );
}
