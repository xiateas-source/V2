import { createSignal, createMemo, For, Show, lazy } from 'solid-js';
import { store } from '../../state/index.js';
import { validateMechanics, applyMechanics } from '../../ai/mechanics.js';

const Compendium = lazy(() => import('./Compendium.jsx'));

// Disposition colour map (Chronograph palette tokens).
const DISP_CLASS = { friendly: 'disp-friendly', neutral: 'disp-neutral', hostile: 'disp-hostile', unknown: 'disp-unknown' };
function dispClass(d) { return DISP_CLASS[(d || 'unknown').toLowerCase()] || 'disp-unknown'; }

// Urgency ranking for pressures — anything with a deadline floats up.
function urgencyRank(c) {
  if (!c.deadline) return 3;
  const d = String(c.deadline).toLowerCase();
  if (/now|tonight|immediate|imminent/.test(d)) return 0;
  if (/1\s*d|today|hour/.test(d)) return 1;
  return 2;
}

export default function Journal() {
  const [lookup, setLookup] = createSignal(false);

  const c = createMemo(() => ({
    objectives: store.campaign.quests.filter(q => q.status === 'active').length,
    objectivesDone: store.campaign.quests.filter(q => q.status !== 'active').length,
    pressures: store.campaign.consequences.filter(x => !x.resolved).length,
    people: store.campaign.npcs.filter(n => n.status !== 'dead').length,
    places: store.campaign.locations.length,
    rep: store.campaign.townReputation.length,
    secrets: (store.campaign.secrets || []).filter(s => s.playerKnown).length,
    chapters: store.campaign.chapters.length,
  }));

  const urgent = createMemo(() => {
    const active = store.campaign.consequences.filter(x => !x.resolved);
    return active.some(x => urgencyRank(x) <= 1);
  });

  return (
    <div class="journal-page">
      <Show when={!lookup()} fallback={<div class="journal-lookup"><Compendium /></div>}>
        <div class="journal-scroll">
          <JournalNow counts={c()} />

          {/* Need-ordered: most-asked first. Empty sections hide entirely. */}
          <Show when={c().objectives + c().objectivesDone > 0}>
            <Section icon="ph-scroll" label="Objectives" count={c().objectives} open><Objectives /></Section>
          </Show>
          <Show when={c().pressures > 0}>
            <Section icon="ph-warning" label="Pressures" count={c().pressures} open={urgent()} tone="danger"><Pressures /></Section>
          </Show>
          <Show when={c().people > 0}>
            <Section icon="ph-users" label="People" count={c().people}><People /></Section>
          </Show>
          <Show when={c().places + c().rep > 0}>
            <Section icon="ph-compass" label="World" count={c().places}><World /></Section>
          </Show>
          <Show when={c().secrets > 0}>
            <Section icon="ph-eye" label="Lore &amp; Leads" count={c().secrets}><Lore /></Section>
          </Show>
          <Show when={c().chapters > 0}>
            <Section icon="ph-book-bookmark" label="Chronicle" count={c().chapters}><Chronicle /></Section>
          </Show>

          <Show when={c().objectives + c().objectivesDone + c().pressures + c().people + c().places + c().secrets + c().chapters === 0}>
            <p class="empty-state journal-empty">Your journal fills as you play — objectives, people you meet, places you find, and what hangs over you all land here.</p>
          </Show>
        </div>
      </Show>

      <div class="journal-footer">
        <button class={`journal-foot-btn ${lookup() ? 'active' : ''}`} onClick={() => setLookup(!lookup())}>
          <i class="ph ph-magnifying-glass" /> {lookup() ? 'Back to Journal' : 'Rules & Lookup'}
        </button>
      </div>
    </div>
  );
}

// The orient digest — answers "where am I / what's the throughline / what's
// pressing / how deep is this journal" before any scrolling.
function JournalNow(props) {
  const loc = () => store.campaign.location;
  const time = () => store.campaign.time;
  const weather = () => store.campaign.weather;
  const mission = () => store.campaign.primaryMission;

  // The single most-urgent thing, or fall back to the freshest active objective.
  const focus = createMemo(() => {
    const pressures = store.campaign.consequences.filter(x => !x.resolved).sort((a, b) => urgencyRank(a) - urgencyRank(b));
    if (pressures.length && urgencyRank(pressures[0]) <= 2) {
      return { kind: 'pressure', text: pressures[0].text, tag: pressures[0].deadline || pressures[0].type };
    }
    const active = store.campaign.quests.filter(q => q.status === 'active');
    if (active.length) return { kind: 'objective', text: active[active.length - 1].text, tag: active[active.length - 1].location };
    return null;
  });

  return (
    <div class="jnow">
      <div class="jnow-loc">
        <i class="ph ph-map-pin" />
        <span class="jnow-loc-name">{loc() || 'Whereabouts unknown'}</span>
        <Show when={time()}><span class="jnow-time">{time()}</span></Show>
        <Show when={weather()}><span class="jnow-weather">{weather()}</span></Show>
      </div>

      <Show when={mission()}>
        <div class="jnow-mission"><span class="jnow-tag">Mission</span>{mission()}</div>
      </Show>

      <Show when={focus()}>
        <div class={`jnow-focus jnow-focus-${focus().kind}`}>
          <i class={`ph ${focus().kind === 'pressure' ? 'ph-warning' : 'ph-arrow-right'}`} />
          <span class="jnow-focus-text">{focus().text}</span>
          <Show when={focus().tag}><span class="jnow-focus-tag">{focus().tag}</span></Show>
        </div>
      </Show>

      <div class="jnow-stats">
        <Show when={props.counts.objectives > 0}><span><b>{props.counts.objectives}</b> open</span></Show>
        <Show when={props.counts.people > 0}><span><b>{props.counts.people}</b> people</span></Show>
        <Show when={props.counts.places > 0}><span><b>{props.counts.places}</b> places</span></Show>
        <Show when={props.counts.pressures > 0}><span class="stat-danger"><b>{props.counts.pressures}</b> pressing</span></Show>
      </div>
    </div>
  );
}

// Collapsible accordion section with a live count badge.
function Section(props) {
  const [open, setOpen] = createSignal(!!props.open);
  return (
    <div class={`jsection ${open() ? 'jsection-open' : ''} ${props.tone ? `jsection-${props.tone}` : ''}`}>
      <button class="jsection-head" onClick={() => setOpen(!open())}>
        <i class={`ph ${props.icon} jsection-icon`} />
        <span class="jsection-label" innerHTML={props.label} />
        <Show when={props.count > 0}><span class="jsection-count">{props.count}</span></Show>
        <i class={`ph ph-caret-${open() ? 'down' : 'right'} jsection-caret`} />
      </button>
      <Show when={open()}>
        <div class="jsection-body">{props.children}</div>
      </Show>
    </div>
  );
}

function Objectives() {
  const byStatus = (s) => store.campaign.quests.filter(q => q.status === s);
  const active = () => byStatus('active');
  const done = () => byStatus('done');
  const failed = () => byStatus('failed');
  const [showDone, setShowDone] = createSignal(false);

  return (
    <div class="quest-list">
      <Show when={active().length > 0} fallback={<p class="empty-state">No open objectives.</p>}>
        <For each={active()}>{(q) => <QuestCard q={q} />}</For>
      </Show>
      <Show when={done().length + failed().length > 0}>
        <button class="quest-done-toggle" onClick={() => setShowDone(!showDone())}>
          <i class={`ph ph-caret-${showDone() ? 'down' : 'right'}`} /> Resolved — {done().length} done · {failed().length} failed
        </button>
        <Show when={showDone()}>
          <For each={[...done(), ...failed()]}>{(q) => <QuestCard q={q} />}</For>
        </Show>
      </Show>
    </div>
  );
}

function QuestCard(props) {
  const q = () => props.q;
  const statusClass = () => `qstatus-${q().status}`;
  return (
    <div class={`quest-card ${statusClass()}`}>
      <div class="quest-row">
        <span class={`status-dot ${statusClass()}`} />
        <span class={`quest-text ${q().status !== 'active' ? 'quest-struck' : ''}`}>{q().text}</span>
      </div>
      <div class="quest-meta">
        <Show when={q().location}><span class="chip chip-loc"><i class="ph ph-map-pin" />{q().location}</span></Show>
        <Show when={q().giverNpc}><span class="chip chip-npc"><i class="ph ph-user" />{q().giverNpc}</span></Show>
        <Show when={q().status !== 'active'}><span class={`chip chip-status ${statusClass()}`}>{q().status}</span></Show>
      </div>
      <Show when={q().notes}><div class="quest-notes">{q().notes}</div></Show>
    </div>
  );
}

function Pressures() {
  const active = () => store.campaign.consequences.filter(c => !c.resolved).sort((a, b) => urgencyRank(a) - urgencyRank(b));

  function resolve(c) {
    const mechanics = [{ key: 'consequence_resolve', value: c.text, target: '', applied: false }];
    const { valid } = validateMechanics(mechanics);
    applyMechanics(valid);
  }

  return (
    <div class="csq-list">
      <For each={active()}>
        {(c) => (
          <div class={`csq-card ${urgencyRank(c) <= 1 ? 'csq-urgent' : ''}`}>
            <div class="csq-head">
              <Show when={c.type}><span class="csq-type">{c.type}</span></Show>
              <Show when={c.deadline}><span class="csq-deadline"><i class="ph ph-hourglass" />{c.deadline}</span></Show>
            </div>
            <div class="csq-text">{c.text}</div>
            <div class="csq-foot">
              <Show when={c.location}><span class="chip chip-loc"><i class="ph ph-map-pin" />{c.location}</span></Show>
              <button class="csq-resolve" onClick={() => resolve(c)}>Resolve</button>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

function People() {
  const [filter, setFilter] = createSignal('all');
  const [q, setQ] = createSignal('');
  const npcs = () => store.campaign.npcs.filter(n => n.status !== 'dead');
  const shown = createMemo(() => {
    const f = filter();
    const term = q().trim().toLowerCase();
    let list = npcs();
    if (f !== 'all') list = list.filter(n => (n.disposition || 'unknown').toLowerCase() === f);
    if (term) list = list.filter(n => (n.name + ' ' + (n.role || '') + ' ' + (n.lastSeen || '')).toLowerCase().includes(term));
    return list;
  });
  const FILTERS = ['all', 'friendly', 'neutral', 'hostile', 'unknown'];

  return (
    <div class="npc-list">
      <Show when={npcs().length > 6}>
        <input class="journal-search" placeholder="Search people…" value={q()} onInput={(e) => setQ(e.target.value)} />
      </Show>
      <div class="npc-filters">
        <For each={FILTERS}>
          {(f) => (
            <button class={`npc-filter ${filter() === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? `All ${npcs().length}` : f}
            </button>
          )}
        </For>
      </div>
      <Show when={shown().length > 0} fallback={<p class="empty-state">No one matches.</p>}>
        <For each={shown()}>{(n) => <NPCCard n={n} />}</For>
      </Show>
    </div>
  );
}

function NPCCard(props) {
  const n = () => props.n;
  const [open, setOpen] = createSignal(false);
  return (
    <div class="npc-card" onClick={() => setOpen(!open())}>
      <div class="npc-top">
        <span class="npc-name">{n().name}</span>
        <span class={`disp-badge ${dispClass(n().disposition)}`}>{n().disposition || 'Unknown'}</span>
      </div>
      <div class="npc-sub">
        <Show when={n().role}><span class="npc-role">{n().role}</span></Show>
        <Show when={n().lastSeen}><span class="chip chip-loc"><i class="ph ph-map-pin" />{n().lastSeen}</span></Show>
      </div>
      <Show when={open() && n().details}><div class="npc-details">{n().details}</div></Show>
      <Show when={open() && n().hp !== null && n().hp !== undefined}><div class="npc-hp">HP {n().hp}</div></Show>
    </div>
  );
}

// World = places you've been + how you stand there (reputation merged in — one home).
function World() {
  const locations = () => store.campaign.locations;
  const rep = () => store.campaign.townReputation;
  // Town reps that don't correspond to a discovered location, shown as standings.
  const looseRep = createMemo(() => {
    const locNames = new Set(locations().map(l => l.name.toLowerCase()));
    return rep().filter(r => !locNames.has((r.town || '').toLowerCase()));
  });
  const repFor = (name) => rep().find(r => (r.town || '').toLowerCase() === (name || '').toLowerCase());

  return (
    <div class="loc-list">
      <TravelCalc />
      <Show when={locations().length > 0} fallback={<p class="empty-state">No places discovered.</p>}>
        <For each={locations()}>{(loc) => <LocationCard loc={loc} rep={repFor(loc.name)} />}</For>
      </Show>
      <Show when={looseRep().length > 0}>
        <div class="world-standing-label">Standing</div>
        <For each={looseRep()}>
          {(r) => (
            <div class="rep-row">
              <span class="rep-town">{r.town}</span>
              <span class={`rep-status rep-${(r.status || 'neutral').toLowerCase()}`}>{r.status}</span>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}

function LocationCard(props) {
  const loc = () => props.loc;
  const [open, setOpen] = createSignal(false);
  const disposition = () => props.rep?.status || loc().rep?.disposition;
  return (
    <div class="place-card">
      <div class="place-top" onClick={() => setOpen(!open())}>
        <div>
          <div class="place-name">{loc().name}</div>
          <div class="place-meta">{loc().type || 'place'} · {loc().status}</div>
        </div>
        <Show when={disposition()}>
          <span class={`rep-status rep-${String(disposition()).toLowerCase()}`}>{disposition()}</span>
        </Show>
      </div>
      <Show when={loc().npcs?.length > 0}>
        <div class="place-npcs">
          <For each={loc().npcs}>{(nm) => <span class="chip chip-npc"><i class="ph ph-user" />{nm}</span>}</For>
        </div>
      </Show>
      <Show when={props.rep?.notes}><div class="place-notes">{props.rep.notes}</div></Show>
      <Show when={loc().history?.length > 0}>
        <button class="place-hist-toggle" onClick={() => setOpen(!open())}>
          <i class={`ph ph-caret-${open() ? 'down' : 'right'}`} /> History ({loc().history.length})
        </button>
        <Show when={open()}>
          <div class="place-history-list">
            <For each={loc().history.filter(h => !h.dmOnly).slice(-8)}>
              {(h) => <div class="place-history"><span class="hist-ts">{h.gameTs}</span>{h.text}</div>}
            </For>
          </div>
        </Show>
      </Show>
      <Show when={loc().playerNotes}><div class="place-notes">{loc().playerNotes}</div></Show>
    </div>
  );
}

function Lore() {
  const secrets = () => (store.campaign.secrets || []).filter(s => s.playerKnown);
  return (
    <div class="secret-list">
      <For each={secrets()}>
        {(s) => (
          <div class="secret-card">
            <div class="secret-head">
              <i class="ph ph-eye" />
              <Show when={s.category}><span class="secret-cat">{s.category}</span></Show>
              <Show when={s.gameTs}><span class="secret-ts">{s.gameTs}</span></Show>
            </div>
            <div class="secret-text">{s.text}</div>
            <Show when={s.source}><div class="secret-source">{s.source}</div></Show>
          </div>
        )}
      </For>
    </div>
  );
}

function Chronicle() {
  const chapters = () => store.campaign.chapters;
  return (
    <div class="chron-list">
      <For each={[...chapters()].reverse()}>
        {(ch) => (
          <div class="chapter-card">
            <div class="chapter-title">{ch.title}</div>
            <Show when={ch.gameTs}><div class="chapter-ts">{ch.gameTs}</div></Show>
            <Show when={ch.content}><div class="chapter-content">{ch.content}</div></Show>
          </div>
        )}
      </For>
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
