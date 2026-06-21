import { createSignal, For, Show } from 'solid-js';
import { store } from '../../state/index.js';

export default function Journal() {
  const [tab, setTab] = createSignal('quests');

  return (
    <div class="journal-page">
      <div class="journal-tabs">
        <button class={tab() === 'quests' ? 'jtab active' : 'jtab'} onClick={() => setTab('quests')}>Quests</button>
        <button class={tab() === 'npcs' ? 'jtab active' : 'jtab'} onClick={() => setTab('npcs')}>NPCs</button>
        <button class={tab() === 'places' ? 'jtab active' : 'jtab'} onClick={() => setTab('places')}>Places</button>
        <button class={tab() === 'log' ? 'jtab active' : 'jtab'} onClick={() => setTab('log')}>Log</button>
      </div>

      <div class="journal-content">
        <Show when={tab() === 'quests'}><Quests /></Show>
        <Show when={tab() === 'npcs'}><NPCs /></Show>
        <Show when={tab() === 'places'}><Places /></Show>
        <Show when={tab() === 'log'}><Log /></Show>
      </div>
    </div>
  );
}

function Quests() {
  const active = () => store.campaign.quests.filter(q => q.status === 'active');
  const done = () => store.campaign.quests.filter(q => q.status !== 'active');
  const mission = () => store.campaign.primaryMission;

  return (
    <div class="journal-section">
      <Show when={mission()}>
        <div class="mission-banner">{mission()}</div>
      </Show>
      <Show when={active().length > 0} fallback={<p class="empty-state">No active quests.</p>}>
        <For each={active()}>
          {(q) => (
            <div class="quest-card">
              <div class="quest-text">{q.text}</div>
              <Show when={q.notes}><div class="quest-notes">{q.notes}</div></Show>
              <Show when={q.location}><span class="quest-location">{q.location}</span></Show>
            </div>
          )}
        </For>
      </Show>
      <Show when={done().length > 0}>
        <h4 class="sub-label">Completed / Failed</h4>
        <For each={done()}>
          {(q) => (
            <div class="quest-card quest-done">
              <span class="quest-status">{q.status}</span> {q.text}
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}

function NPCs() {
  const active = () => store.campaign.npcs.filter(n => n.status === 'active');
  return (
    <div class="journal-section">
      <Show when={active().length > 0} fallback={<p class="empty-state">No NPCs met yet.</p>}>
        <For each={active()}>
          {(n) => (
            <div class="npc-card">
              <div class="npc-name">{n.name}</div>
              <div class="npc-mood">{n.disposition}</div>
              <Show when={n.details}><div class="npc-details">{n.details}</div></Show>
              <Show when={n.lastSeen}><span class="npc-location">Last seen: {n.lastSeen}</span></Show>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}

function Places() {
  const locations = () => store.campaign.locations;
  const repLog = () => store.campaign.townReputation;

  return (
    <div class="journal-section">
      <Show when={locations().length > 0} fallback={<p class="empty-state">No places discovered.</p>}>
        <For each={locations()}>
          {(loc) => (
            <div class="place-card">
              <div class="place-name">{loc.name}</div>
              <div class="place-meta">{loc.type} — {loc.status}</div>
              <Show when={loc.history.length > 0}>
                <For each={loc.history.slice(-3)}>
                  {(h) => <div class="place-history">{h.text}</div>}
                </For>
              </Show>
            </div>
          )}
        </For>
      </Show>
      <Show when={repLog().length > 0}>
        <h4 class="sub-label">Reputation</h4>
        <For each={repLog()}>
          {(r) => (
            <div class="rep-row">
              <span class="rep-town">{r.town}</span>
              <span class="rep-status">{r.status}</span>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}

function Log() {
  const chapters = () => store.campaign.chapters;
  const consequences = () => store.campaign.consequences.filter(c => !c.resolved);

  return (
    <div class="journal-section">
      <Show when={consequences().length > 0}>
        <h4 class="sub-label">Active Consequences</h4>
        <For each={consequences()}>
          {(c) => (
            <div class="consequence-card">
              <span class="consequence-type">{c.type}</span>
              <span class="consequence-text">{c.text}</span>
              <Show when={c.deadline}><span class="consequence-deadline">Deadline: {c.deadline}</span></Show>
            </div>
          )}
        </For>
      </Show>
      <Show when={chapters().length > 0}>
        <h4 class="sub-label">Chapters</h4>
        <For each={[...chapters()].reverse()}>
          {(ch) => (
            <div class="chapter-card">
              <div class="chapter-title">{ch.title}</div>
              <Show when={ch.content}><div class="chapter-content">{ch.content}</div></Show>
            </div>
          )}
        </For>
      </Show>
      <Show when={consequences().length === 0 && chapters().length === 0}>
        <p class="empty-state">No log entries yet.</p>
      </Show>
    </div>
  );
}
