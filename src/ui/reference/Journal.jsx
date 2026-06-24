import { createSignal, For, Show, lazy } from 'solid-js';
import { store } from '../../state/index.js';

const Compendium = lazy(() => import('./Compendium.jsx'));

export default function Journal() {
  const [tab, setTab] = createSignal('quests');

  return (
    <div class="journal-page">
      <div class="journal-tabs">
        <button class={tab() === 'quests' ? 'jtab active' : 'jtab'} onClick={() => setTab('quests')}>Quests</button>
        <button class={tab() === 'npcs' ? 'jtab active' : 'jtab'} onClick={() => setTab('npcs')}>NPCs</button>
        <button class={tab() === 'places' ? 'jtab active' : 'jtab'} onClick={() => setTab('places')}>Places</button>
        <button class={tab() === 'log' ? 'jtab active' : 'jtab'} onClick={() => setTab('log')}>Log</button>
        <button class={tab() === 'lookup' ? 'jtab active' : 'jtab'} onClick={() => setTab('lookup')}>Lookup</button>
      </div>

      <div class="journal-content">
        <Show when={tab() === 'quests'}><Quests /></Show>
        <Show when={tab() === 'npcs'}><NPCs /></Show>
        <Show when={tab() === 'places'}><Places /></Show>
        <Show when={tab() === 'log'}><Log /></Show>
        <Show when={tab() === 'lookup'}><Compendium /></Show>
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
      <TravelCalc />
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
  const secrets = () => (store.campaign.secrets || []).filter(s => s.playerKnown);

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
      <Show when={secrets().length > 0}>
        <h4 class="sub-label">Secrets</h4>
        <For each={secrets()}>
          {(s) => (
            <div class="secret-card">
              <Show when={s.category}><span class="secret-cat">{s.category}</span></Show>
              <span class="secret-text">{s.text}</span>
              <Show when={s.source}><span class="secret-source">{s.source}</span></Show>
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
      <Show when={consequences().length === 0 && chapters().length === 0 && secrets().length === 0}>
        <p class="empty-state">No log entries yet.</p>
      </Show>
    </div>
  );
}

// Self-contained travel-time estimator. Distance × pace → time (Law 5: free
// math). Input-based for now — when locations carry distance data, this can
// read it directly.
function TravelCalc() {
  const PACE = {
    slow: { mph: 2, perDay: 18, note: 'can use Stealth' },
    normal: { mph: 3, perDay: 24, note: '' },
    fast: { mph: 4, perDay: 30, note: '−5 passive Perception' },
  };
  const [open, setOpen] = createSignal(false);
  const [miles, setMiles] = createSignal('');
  const [pace, setPace] = createSignal('normal');

  const result = () => {
    const m = parseFloat(miles());
    if (!m || m <= 0) return null;
    const p = PACE[pace()];
    return { hours: m / p.mph, days: m / p.perDay, note: p.note };
  };

  const fmtTime = (r) => {
    if (r.days >= 1) {
      const whole = Math.floor(r.days);
      const remHours = Math.round((r.days - whole) * 8); // 8 travel hours/day
      return `${whole} day${whole !== 1 ? 's' : ''}${remHours >= 1 ? ` + ${remHours}h` : ''}`;
    }
    return `${r.hours.toFixed(1)} hours`;
  };

  return (
    <div class="travel-calc">
      <button class="travel-toggle" onClick={() => setOpen(!open())}>
        {open() ? '▾' : '▸'} Travel calculator
      </button>
      <Show when={open()}>
        <div class="travel-body">
          <input class="field-input" type="number" inputmode="decimal" min="0"
            placeholder="Distance in miles" value={miles()} onInput={(e) => setMiles(e.target.value)} />
          <div class="travel-pace">
            <For each={Object.keys(PACE)}>
              {(p) => (
                <button class={`travel-pace-chip ${pace() === p ? 'active' : ''}`} onClick={() => setPace(p)}>
                  {p} · {PACE[p].perDay}mi/day
                </button>
              )}
            </For>
          </div>
          <Show when={result()} fallback={<p class="travel-hint">Enter a distance to estimate travel time.</p>}>
            <div class="travel-result">
              <span class="travel-result-time">{fmtTime(result())}</span>
              <span class="travel-result-sub">
                at {pace()} pace ({PACE[pace()].mph} mph · 8h/day){result().note ? ` — ${result().note}` : ''}
              </span>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
