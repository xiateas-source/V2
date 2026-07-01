import { createSignal, createMemo, For, Show, lazy } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { extractMechanics, validateMechanics, applyMechanics } from '../../ai/mechanics.js';
import { callProvider } from '../../ai/providers.js';
import { DEEP_SEED_SYSTEM } from '../../ai/setupPrompts.js';

const Compendium = lazy(() => import('./Compendium.jsx'));

// Disposition colour map (Chronograph palette tokens).
const DISP_CLASS = { friendly: 'disp-friendly', neutral: 'disp-neutral', hostile: 'disp-hostile', unknown: 'disp-unknown' };
// Normalise the AI's free-form dispositions ("distressed", "business-like", …)
// into the four buckets used for colour + filtering. The raw word still shows
// on the badge — this only drives styling/grouping.
function normDisp(d) {
  const s = (d || '').toLowerCase();
  if (!s) return 'unknown';
  if (/friend|ally|allied|helpful|warm|kind|loyal|grateful|welcom|trust(?!.*no)/.test(s)) return 'friendly';
  if (/hostile|enem|aggress|angry|threat|menac|cruel|murder|antagon|furious|vengef/.test(s)) return 'hostile';
  if (/unknown|myster|unclear|unseen/.test(s)) return 'unknown';
  return 'neutral'; // business-like, distressed, wary, cautious, etc. all read neutral
}
function dispClass(d) { return DISP_CLASS[normDisp(d)]; }

function escapeRe(s) { return (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Strip mechanics + Campaign State block + markdown so narrative reads cleanly.
function stripProse(text) {
  if (!text) return '';
  return text
    .replace(/---MECHANICS---[\s\S]*?---END---/g, '')
    .replace(/MECHANICS BLOCK:[\s\S]*?---END---/g, '')
    .replace(/\*\*\*[\s\S]*?(Campaign State[\s\S]*)$/i, '') // drop trailing state block
    .replace(/\*\*\*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim();
}

function matchesName(text, name) {
  if (!text || !name) return false;
  const full = new RegExp(`\\b${escapeRe(name)}\\b`, 'i');
  if (full.test(text)) return true;
  const first = name.split(/\s+/)[0];
  if (first && first.length > 2 && first.toLowerCase() !== name.toLowerCase()) {
    return new RegExp(`\\b${escapeRe(first)}\\b`, 'i').test(text);
  }
  return false;
}

function sentenceWith(text, name) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const hit = sentences.find(s => matchesName(s, name)) || sentences[0] || text;
  return hit.length > 130 ? hit.slice(0, 127) + '…' : hit;
}

// Assemble everything we know about an NPC from the campaign — no player
// tracking required. Answers: who, how/when met, what quests, who they're with,
// what's happened.
function buildDossier(npc) {
  const all = store.campaign;
  const name = npc.name;

  // Interaction timeline — narrative beats that mention this NPC.
  const timeline = [];
  for (const m of all.narrative || []) {
    const prose = stripProse(m.content);
    if (!prose || !matchesName(prose, name)) continue;
    const firstMeet = (m.mechanics?.applied || []).some(x => x.key === 'npc_add' && matchesName(x.value.split(',')[0] || '', name));
    timeline.push({ ts: m.ts, gameTs: m.gameTs, who: m.type, snippet: sentenceWith(prose, name), firstMeet });
  }

  // Connections — other known NPCs who appear in the same beats.
  const conn = new Set();
  for (const m of all.narrative || []) {
    const prose = stripProse(m.content);
    if (!prose || !matchesName(prose, name)) continue;
    for (const other of all.npcs) {
      if (other.id === npc.id) continue;
      if (matchesName(prose, other.name)) conn.add(other.name);
    }
  }
  // Also anyone sharing their location.
  for (const loc of all.locations || []) {
    if ((loc.npcs || []).some(nm => matchesName(nm, name))) {
      for (const nm of loc.npcs) { if (!matchesName(nm, name)) conn.add(nm); }
    }
  }

  // Quests they're tied to (giver or named in the text/notes).
  const quests = (all.quests || []).filter(q =>
    matchesName(q.giverNpc || '', name) || matchesName(`${q.text} ${q.notes || ''}`, name)
  );

  const firstBeat = timeline.find(t => t.firstMeet) || timeline[0];
  return {
    timeline: timeline.reverse(), // newest first
    connections: [...conn],
    quests,
    metWhere: npc.firstSeen || npc.lastSeen || '',
    metWhen: npc.gameTs || (firstBeat?.gameTs) || '',
    metHow: firstBeat?.snippet || '',
  };
}

function parseDay(ts) {
  const m = /day\s+(\d+)/i.exec(ts || '');
  return m ? parseInt(m[1], 10) : null;
}

// Journey = the campaign's timeline, derived from beats that already happened:
// chapters, places reached, travel, and resolved quests/pressures. No tracking.
function buildJourney() {
  const c = store.campaign;
  const ev = [];
  for (const ch of c.chapters || []) ev.push({ gameTs: ch.gameTs, day: parseDay(ch.gameTs), label: ch.title, text: ch.content, kind: 'chapter' });
  for (const l of c.locations || []) if (l.firstVisited) ev.push({ gameTs: l.firstVisited, day: parseDay(l.firstVisited), label: `Reached ${l.name}`, kind: 'travel' });
  for (const t of c.travelLog || []) ev.push({ gameTs: t.gameTs, day: parseDay(t.gameTs), label: `${t.from || '?'} → ${t.to || '?'}`, text: t.note, kind: 'travel' });
  for (const q of c.quests || []) if (q.status !== 'active') ev.push({ gameTs: q.gameTs, day: parseDay(q.gameTs), label: `${q.status === 'done' ? 'Completed' : 'Failed'}: ${q.text}`, kind: q.status === 'done' ? 'done' : 'failed' });
  for (const cq of c.consequences || []) if (cq.resolved) ev.push({ gameTs: cq.resolvedTs || cq.gameTs, day: parseDay(cq.resolvedTs || cq.gameTs), label: `Resolved: ${cq.text}`, kind: 'done' });
  // Chronological — the path so far. Unknown-day events sink to the end stably.
  return ev.map((e, i) => ({ ...e, _i: i })).sort((a, b) => (a.day ?? 1e9) - (b.day ?? 1e9) || a._i - b._i);
}

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
    journey: buildJourney().length,
  }));

  const urgent = createMemo(() => {
    const active = store.campaign.consequences.filter(x => !x.resolved);
    return active.some(x => urgencyRank(x) <= 1);
  });

  const [seeding, setSeeding] = createSignal(false);
  const [seedMsg, setSeedMsg] = createSignal('');

  // Deep Seed — re-read the play log and backfill journal data the DM narrated
  // but never recorded (places visited, NPCs met, quests given, threats).
  async function runDeepSeed() {
    if (seeding()) return;
    setSeeding(true);
    setSeedMsg('Reading the story for anything the journal missed…');
    try {
      const camp = store.campaign;
      const tracked = [
        `NPCs: ${camp.npcs.map(n => n.name).join(', ') || 'none'}`,
        `Locations: ${camp.locations.map(l => l.name).join(', ') || 'none'}`,
        `Quests: ${camp.quests.map(q => q.text).join(' | ') || 'none'}`,
        `Consequences: ${camp.consequences.map(x => x.text).join(' | ') || 'none'}`,
        `Reputation: ${camp.townReputation.map(r => r.town).join(', ') || 'none'}`,
        `Primary mission: ${camp.primaryMission || 'none'}`,
        `Current location: ${camp.location || 'unknown'}`,
      ].join('\n');
      const log = (camp.narrative || []).slice(-24)
        .map(m => `${m.type === 'player' ? 'PLAYER' : 'DM'}: ${stripProse(m.content)}`)
        .filter(l => l.length > 6).join('\n\n');
      const input = `ALREADY TRACKED:\n${tracked}\n\nPLAY LOG:\n${log}`;

      let full = '';
      for await (const ch of callProvider([{ role: 'user', content: input }], DEEP_SEED_SYSTEM)) full += ch;

      const parsed = extractMechanics(full);
      const { valid } = validateMechanics(parsed);
      const applied = applyMechanics(valid).filter(m => m.applied);
      setSeedMsg(applied.length === 0
        ? 'Journal is already up to date — nothing was missing.'
        : `Recovered ${applied.length} entr${applied.length === 1 ? 'y' : 'ies'} from the story.`);
    } catch (_) {
      setSeedMsg('Deep Seed needs an AI key (Settings) and a connection.');
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedMsg(''), 6000);
    }
  }

  return (
    <div class="journal-page">
      <Show when={!lookup()} fallback={<div class="journal-lookup"><Compendium /></div>}>
        <div class="journal-scroll">
          <JournalNow counts={c()} />

          <div class="journal-actions">
            <button class="seed-btn" onClick={runDeepSeed} disabled={seeding()}>
              <i class={`ph ${seeding() ? 'ph-circle-notch seed-spin' : 'ph-magnifying-glass-plus'}`} />
              {seeding() ? 'Seeding…' : 'Deep Seed'}
            </button>
            <span class="seed-hint">Recover anything the story mentioned but the journal missed.</span>
          </div>
          <Show when={seedMsg()}><div class="seed-status">{seedMsg()}</div></Show>

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
          <Show when={c().journey > 0}>
            <Section icon="ph-path" label="Journey" count={c().journey}><Journey /></Section>
          </Show>

          <Show when={c().objectives + c().objectivesDone + c().pressures + c().people + c().places + c().secrets + c().journey === 0}>
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
  const [q, setQ] = createSignal('');
  const filtered = () => {
    const term = q().trim().toLowerCase();
    return term ? active().filter(quest => quest.text.toLowerCase().includes(term)) : active();
  };

  return (
    <div class="quest-list">
      <Show when={active().length > 8}>
        <input class="journal-search" placeholder="Search quests…" value={q()} onInput={e => setQ(e.target.value)} />
      </Show>
      <Show when={filtered().length > 0} fallback={<p class="empty-state">{active().length === 0 ? 'No open objectives.' : 'No quests match.'}</p>}>
        <For each={filtered()}>{(q) => <QuestCard q={q} />}</For>
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

  function markDone() {
    const idx = store.campaign.quests.indexOf(q());
    if (idx === -1) return;
    setStore('campaign', 'quests', idx, 'status', 'done');
  }

  return (
    <div class={`quest-card ${statusClass()}`}>
      <div class="quest-row">
        <span class={`status-dot ${statusClass()}`} />
        <span class={`quest-text ${q().status !== 'active' ? 'quest-struck' : ''}`}>{q().text}</span>
        <Show when={q().status === 'active'}>
          <button class="quest-done-btn" onClick={e => { e.stopPropagation(); markDone(); }} title="Mark as done">✓</button>
        </Show>
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
    if (f !== 'all') list = list.filter(n => normDisp(n.disposition) === f);
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
  const [editing, setEditing] = createSignal(false);
  const [editName, setEditName] = createSignal('');
  const [editDisp, setEditDisp] = createSignal('');
  // "who they are" one-liner for the collapsed row — role, else first clause of details.
  const who = () => n().role || (n().details || '').split(/[.,—]/)[0];
  const dossier = createMemo(() => open() ? buildDossier(n()) : null);

  function startEdit() {
    setEditName(n().name);
    setEditDisp(n().disposition || 'Unknown');
    setEditing(true);
  }

  function saveEdit() {
    const idx = store.campaign.npcs.findIndex(x => x.id === n().id);
    if (idx === -1) return;
    setStore('campaign', 'npcs', idx, 'name', editName().trim() || n().name);
    setStore('campaign', 'npcs', idx, 'disposition', editDisp());
    setEditing(false);
  }

  const DISPS = ['Friendly', 'Neutral', 'Hostile', 'Unknown', 'Ally', 'Enemy'];

  return (
    <div class={`npc-card ${open() ? 'npc-open' : ''}`} onClick={() => !editing() && setOpen(!open())}>
      <div class="npc-top">
        <span class="npc-name">{n().name}</span>
        <span class={`disp-badge ${dispClass(n().disposition)}`}>{n().disposition || 'Unknown'}</span>
      </div>
      <div class="npc-sub">
        <Show when={who()}><span class="npc-who">{who()}</span></Show>
        <Show when={n().lastSeen}><span class="chip chip-loc"><i class="ph ph-map-pin" />{n().lastSeen}</span></Show>
      </div>

      <Show when={open() && dossier()}>
        {(() => {
          const d = dossier();
          return (
            <div class="dossier" onClick={(e) => e.stopPropagation()}>
              <Show when={editing()}>
                <div class="npc-edit-form" onClick={e => e.stopPropagation()}>
                  <input class="npc-edit-input" value={editName()} onInput={e => setEditName(e.target.value)} placeholder="Name" />
                  <select class="npc-edit-input" value={editDisp()} onInput={e => setEditDisp(e.target.value)}>
                    <For each={DISPS}>{d => <option value={d}>{d}</option>}</For>
                  </select>
                  <div class="npc-edit-btns">
                    <button class="npc-edit-save" onClick={saveEdit}>Save</button>
                    <button class="npc-edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </div>
              </Show>
              <Show when={n().details}>
                <div class="dossier-sec">
                  <div class="dossier-label">Who they are</div>
                  <div class="dossier-text">{n().details}</div>
                  <div class="dossier-meta">
                    <Show when={n().race}><span>{n().race}</span></Show>
                    <Show when={n().role}><span>{n().role}</span></Show>
                    <Show when={n().hp !== null && n().hp !== undefined}><span>HP {n().hp}</span></Show>
                  </div>
                </div>
              </Show>

              <Show when={d.metWhere || d.metWhen || d.metHow}>
                <div class="dossier-sec">
                  <div class="dossier-label">How you met</div>
                  <Show when={d.metWhere || d.metWhen}>
                    <div class="dossier-when">
                      <Show when={d.metWhere}><span class="chip chip-loc"><i class="ph ph-map-pin" />{d.metWhere}</span></Show>
                      <Show when={d.metWhen}><span class="dossier-ts">{d.metWhen}</span></Show>
                    </div>
                  </Show>
                  <Show when={d.metHow}><div class="dossier-text">{d.metHow}</div></Show>
                </div>
              </Show>

              <Show when={d.quests.length > 0}>
                <div class="dossier-sec">
                  <div class="dossier-label">Why they matter</div>
                  <For each={d.quests}>
                    {(q) => (
                      <div class="dossier-quest">
                        <span class={`status-dot qstatus-${q.status}`} />
                        <span class={q.status !== 'active' ? 'quest-struck' : ''}>{q.text}</span>
                      </div>
                    )}
                  </For>
                </div>
              </Show>

              <Show when={d.connections.length > 0}>
                <div class="dossier-sec">
                  <div class="dossier-label">Connected to</div>
                  <div class="dossier-conns">
                    <For each={d.connections}>{(c) => <span class="chip chip-npc"><i class="ph ph-user" />{c}</span>}</For>
                  </div>
                </div>
              </Show>

              <Show when={d.timeline.length > 0}>
                <div class="dossier-sec">
                  <div class="dossier-label">What's happened</div>
                  <div class="npc-timeline">
                    <For each={d.timeline.slice(0, 4)}>
                      {(t) => (
                        <div class={`tl-item ${t.firstMeet ? 'tl-first' : ''}`}>
                          <span class="tl-dot" />
                          <div class="tl-body">
                            <Show when={t.gameTs || t.firstMeet}>
                              <div class="tl-ts">{t.firstMeet ? 'First met' : ''}{t.firstMeet && t.gameTs ? ' · ' : ''}{t.gameTs || ''}</div>
                            </Show>
                            <div class="tl-text">{t.snippet}</div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
              <button class="npc-edit-btn" onClick={e => { e.stopPropagation(); startEdit(); }}>
                <i class="ph ph-pencil-simple" /> Edit
              </button>
            </div>
          );
        })()}
      </Show>
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

function Journey() {
  const events = createMemo(() => buildJourney());
  return (
    <div class="journey">
      <For each={events()}>
        {(e) => (
          <div class={`jrny-item jrny-${e.kind}`}>
            <span class="jrny-dot" />
            <div class="jrny-body">
              <div class="jrny-head">
                <span class="jrny-label">{e.label}</span>
                <Show when={e.gameTs}><span class="jrny-ts">{e.gameTs}</span></Show>
              </div>
              <Show when={e.text}><div class="jrny-text">{e.text}</div></Show>
            </div>
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
