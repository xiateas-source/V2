import { createSignal, For, Show, onMount } from 'solid-js';
import { store, setStore, aiSet, resetCampaign } from '../../state/index.js';
import { extractMechanics, validateMechanics, applyMechanics } from '../../ai/mechanics.js';
import { createNarrativeMsg } from '../../ai/messages.js';
import { loadDemoCampaign, loadFullDemo } from '../../data/demo.js';
import { clearActiveCampaign, exportSnapshot } from '../../data/persist.js';
import { navigateTo, openCharSheet, navigateToCompendium } from '../shared/sourceBus.js';
import { countStore } from '../../data/local.js';

const SAMPLE = `The kobold lunges from the dark. Ivy twists aside but the blade bites deep.

***
---MECHANICS---
hp: Ivy, -5
xp: 25
consequence_add: Wounded by kobold ambush|threat
---END---`;

const DATA_STORES = [
  { store: 'spells', label: 'Spells', expect: 339 },
  { store: 'classData', label: 'Class progressions', expect: 12 },
  { store: 'feats', label: 'Feats', expect: 56 },
  { store: 'glossary', label: 'Glossary', expect: 84 },
  { store: 'compendium', label: 'Rules / Compendium', expect: 34 },
  { store: 'maneuvers', label: 'Maneuvers', expect: 16 },
];

// Full ordered sequence for mass testing — each item fires one mechanic block
function getMassTestSequence(pc) {
  return [
    { label: 'Damage 5',      line: `hp: ${pc}, -5` },
    { label: 'Heal 8',        line: `hp: ${pc}, +8` },
    { label: 'Temp HP 6',     line: `temp_hp: ${pc}=6` },
    { label: '+50 gp',        line: `gp: +50` },
    { label: '+75 XP',        line: `xp: ${pc}+75` },
    { label: 'Poisoned',      line: `conditions: ${pc}, poisoned` },
    { label: 'Cond Clear',    line: `conditions: ${pc}, -poisoned` },
    { label: 'Concentration', line: `concentration: ${pc}=Bless` },
    { label: 'Inspiration',   line: `inspiration: ${pc}=grant` },
    { label: 'Hit Die',       line: `hit_dice_use: ${pc}=1` },
    { label: 'Add item',      line: `item_add: ${pc}, Healing Potion, potion` },
    { label: '+100 gp',       line: `income: 100, loot, bandit chest` },
    { label: 'New quest',     line: `quest_add: Recover the stolen relic` },
    { label: 'Meet NPC',      line: `npc_add: Leosin, friendly, captive monk` },
    { label: 'Consequence',   line: `consequence_add: Pursuers on your trail|threat` },
    { label: 'Location',      line: `location: Thornvale Market Square` },
    { label: 'Weather',       line: `weather: Light drizzle` },
    { label: 'Start combat',  line: `combat_start: Kobold ambush` },
    { label: 'Add enemy',     line: `zone_add_enemy: Kobold|6|13|front|10` },
    { label: 'Death save S',  line: `death_save: ${pc}=success` },
    { label: 'Round +1',      line: `round_advance:` },
    { label: 'End combat',    line: `combat_end: Victory` },
    { label: 'Short rest',    line: `short_rest: party` },
    { label: 'Long rest',     line: `long_rest: party` },
  ];
}

export default function MechTest(props) {
  const [text, setText] = createSignal(SAMPLE);
  const [last, setLast] = createSignal(null);
  const [copied, setCopied] = createSignal('');
  const [audit, setAudit] = createSignal(null);
  const [massLog, setMassLog] = createSignal(null);
  const [running, setRunning] = createSignal(false);
  // Backed by store.system (not a local signal) so notes survive closing this
  // tab, reloading the page, and New Campaign resets — see system.js.
  const testerNotes = () => store.system.testerNotes;
  const setTesterNotes = (v) => setStore('system', 'testerNotes', v);

  const firstPC = () => store.campaign.characters[0]?.name || 'the party';

  // Auto-run audit on open
  onMount(runAudit);

  function run(raw, label) {
    const parsed = extractMechanics(raw);
    const { valid, rejected } = validateMechanics(parsed);
    const applied = applyMechanics(valid);
    const msg = createNarrativeMsg('dm', stripMech(raw), { mechanics: { applied, rejected } });
    aiSet('narrative', [...store.campaign.narrative, msg]);
    return {
      label: label || 'Injected',
      applied: applied.filter(m => m.applied).map(m => `${m.key}: ${m.value}`),
      failed: applied.filter(m => !m.applied).map(m => `${m.key} — ${m.error}`),
      rejected: rejected.map(m => `${m.key} — ${m.reason}`),
      parsedCount: parsed.length,
    };
  }

  function fire(line, label) {
    const result = run(`---MECHANICS---\n${line}\n---END---`, label);
    setLast(result);
  }

  function scenarioToast(text) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { text } }));
  }

  // Scenarios below are curated per-session, not auto-generated: each one
  // drops you straight into a live situation built to test one specific
  // recently-shipped mechanic (real combat/dice/UI, not just a data injection).
  // Add one when something new ships that needs a live check; remove it once
  // it's been confirmed working, so this list always reflects what's actually
  // worth testing right now.

  function scenarioCoveredEnemy() {
    fire(`combat_start: Scenario test — Covered Enemy\nzone_add_enemy: Kobold|6|13|front|10\ncover: Kobold=half`, 'Scenario: Covered Enemy');
    scenarioToast('Kobold has half cover (+2 AC). Roll initiative, then attack it to test Cover.');
  }

  function scenarioLowHP() {
    const char = store.campaign.characters[0];
    if (!char) return;
    const target = Math.max(1, Math.floor(char.hpMax / 2));
    fire(`hp: ${char.name}=${target}`, 'Scenario: Low HP');
    scenarioToast(`${char.name} set to ${target}/${char.hpMax} HP — open their sheet's Vitals tab and try Spend Hit Die.`);
  }

  function scenarioActionEconomy() {
    const chars = store.campaign.characters;
    if (!chars.length) return;
    const initiative = chars.map((c, i) => ({
      name: c.name, roll: 15 - i, type: 'pc', rollPending: false,
      hp: c.hp, hpMax: c.hpMax, ac: c.ac, zone: 'front',
    }));
    aiSet('combatState', {
      active: true, round: 1, initiative, currentTurn: 0,
      actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
      zones: { front: { label: 'Frontline' }, back: { label: 'Backline' }, left: { label: 'Left Flank' }, right: { label: 'Right Flank' }, air: { label: 'Air' }, rear: { label: 'Rear Guard' } },
    });
    scenarioToast(`${chars[0].name}'s turn is active — tap two Action-type quick actions in the turn card; the second should be disabled.`);
  }

  async function runMassTest() {
    if (running()) return;
    setRunning(true);
    setMassLog(null);
    const pc = firstPC();
    const seq = getMassTestSequence(pc);
    const log = [];
    for (const item of seq) {
      const result = run(`---MECHANICS---\n${item.line}\n---END---`, item.label);
      const ok = result.applied.length > 0 && result.failed.length === 0 && result.rejected.length === 0;
      log.push({ label: item.label, ok, applied: result.applied.length, failed: result.failed.length, rejected: result.rejected.length });
      await new Promise(r => setTimeout(r, 30));
    }
    const passed = log.filter(l => l.ok).length;
    setMassLog({ log, passed, total: log.length });
    setRunning(false);
    // Re-run audit after mass test
    runAudit();
  }

  function clearNarrative() {
    aiSet('narrative', []);
    aiSet('ooc', []);
    setLast(null);
    setMassLog(null);
    window.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Chat cleared' } }));
  }

  async function newCampaign() {
    if (!confirm('Start a new campaign? This clears the current game on this device.')) return;
    await clearActiveCampaign();
    resetCampaign(setStore);
    props.onClose?.();
  }

  async function copyExport() {
    const json = JSON.stringify(exportSnapshot(testerNotes()), null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopied('Copied!');
    } catch (_) {
      setCopied('Clipboard blocked — use Download');
    }
    setTimeout(() => setCopied(''), 2500);
  }

  async function runAudit() {
    const results = [];
    for (const ds of DATA_STORES) {
      try {
        const count = await countStore(ds.store);
        const status = count >= ds.expect ? 'green' : count > 0 ? 'yellow' : 'red';
        results.push({ label: ds.label, detail: `${count} / ${ds.expect}`, status });
      } catch (_) {
        results.push({ label: ds.label, detail: 'Error', status: 'red' });
      }
    }
    const chars = store.campaign.characters || [];
    results.push({ label: 'Characters', detail: `${chars.length} loaded`, status: chars.length > 0 ? 'green' : 'yellow' });
    const cs = store.campaign.combatState;
    results.push({ label: 'Combat state', detail: cs ? 'OK' : 'Missing', status: cs ? 'green' : 'red' });
    const narrative = store.campaign.narrative || [];
    results.push({ label: 'Narrative', detail: `${narrative.length} messages`, status: narrative.length > 0 ? 'green' : 'yellow' });
    setAudit(results);
  }

  function downloadExport() {
    const json = JSON.stringify(exportSnapshot(testerNotes()), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tinklepebble-${store.campaign.id || 'campaign'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const pc = firstPC;
  const SCENARIOS = [
    { label: 'Covered Enemy', hint: 'Tests Cover (S69)', run: scenarioCoveredEnemy },
    { label: 'Low HP + Rest', hint: 'Tests Hit Dice healing (S68)', run: scenarioLowHP },
    { label: 'Mid-Combat Turn', hint: 'Tests Action Economy (S67)', run: scenarioActionEconomy },
  ];
  const QUICK = [
    { label: 'Damage 5',     line: () => `hp: ${pc()}, -5` },
    { label: 'Heal 8',       line: () => `hp: ${pc()}, +8` },
    { label: 'Temp HP 6',    line: () => `temp_hp: ${pc()}=6` },
    { label: '+50 gp',       line: () => `gp: +50` },
    { label: '+100 XP',      line: () => `xp: ${pc()}+100` },
    { label: 'Poisoned',     line: () => `conditions: ${pc()}, poisoned` },
    { label: 'Clear conds',  line: () => `conditions: ${pc()}, -poisoned` },
    { label: 'Inspiration',  line: () => `inspiration: ${pc()}=grant` },
    { label: 'Hit Die',      line: () => `hit_dice_use: ${pc()}=1` },
    { label: 'New quest',    line: () => `quest_add: Recover the stolen relic` },
    { label: 'Add item',     line: () => `item_add: ${pc()}, Healing Potion, potion` },
    { label: 'Meet NPC',     line: () => `npc_add: Leosin, friendly, captive monk` },
    { label: 'Consequence',  line: () => `consequence_add: Pursuers on your trail|threat` },
    { label: 'Start combat', line: () => `combat_start: Kobold ambush` },
    { label: 'End combat',   line: () => `combat_end: Victory` },
    { label: 'Short rest',   line: () => `short_rest: party` },
    { label: 'Long rest',    line: () => `long_rest: party` },
    { label: 'Add familiar', line: () => `familiar_add: ${pc()}|Quill,Owl,Fey,1,1,11` },
  ];

  return (
    <div class="mechtest">
      <div class="mechtest-head">
        <span class="mechtest-title"><i class="ph ph-flask" /> Test container</span>
        <button class="mechtest-close" onClick={() => props.onClose?.()}>&times;</button>
      </div>

      {/* Mass Test */}
      <div class="mt-section mt-mass">
        <div class="mt-label">Mass Test <span class="mt-label-hint">— runs all 24 mechanics in sequence</span></div>
        <div class="mechtest-actions">
          <button class="mechtest-run mt-run-all" onClick={runMassTest} disabled={running()}>
            <i class={`ph ph-${running() ? 'circle-notch' : 'play'}`} /> {running() ? 'Running…' : 'Run All'}
          </button>
          <button class="mechtest-reset" onClick={clearNarrative}>
            <i class="ph ph-broom" /> Clear chat
          </button>
        </div>
        <Show when={massLog()}>
          <div class="mass-log">
            <div class={`mass-summary ${massLog().passed === massLog().total ? 'mass-pass' : 'mass-fail'}`}>
              {massLog().passed}/{massLog().total} passed
            </div>
            <div class="mass-rows">
              <For each={massLog().log}>{(row) => (
                <div class={`mass-row ${row.ok ? 'mass-row-ok' : 'mass-row-fail'}`}>
                  <span class="mass-dot">{row.ok ? '✓' : '✕'}</span>
                  <span class="mass-row-label">{row.label}</span>
                  <Show when={!row.ok}>
                    <span class="mass-row-detail">{row.rejected > 0 ? `${row.rejected} rejected` : `${row.failed} failed`}</span>
                  </Show>
                </div>
              )}</For>
            </div>
          </div>
        </Show>
      </div>

      {/* Jump to */}
      <div class="mt-section">
        <div class="mt-label">Jump to</div>
        <div class="mechtest-quick">
          <button class="mechtest-chip" onClick={() => navigateTo('journal')}>Journal</button>
          <button class="mechtest-chip" onClick={() => navigateTo('cargo')}>Cargo</button>
          <button class="mechtest-chip" onClick={() => navigateTo('play')}>Play</button>
          <button class="mechtest-chip" onClick={() => openCharSheet(pc())}>{pc()}'s sheet</button>
          <button class="mechtest-chip" onClick={() => navigateTo('manage')}>Settings</button>
          <button class="mechtest-chip" onClick={() => navigateToCompendium('spells')}>Compendium</button>
        </div>
      </div>

      {/* Scenarios — curated per session, see comment above scenario functions */}
      <div class="mt-section">
        <div class="mt-label">Scenarios <span class="mt-label-hint">— jump straight into a live situation to test one thing</span></div>
        <div class="mechtest-quick">
          <For each={SCENARIOS}>
            {(s) => <button class="mechtest-chip" title={s.hint} onClick={s.run}>{s.label}</button>}
          </For>
        </div>
      </div>

      {/* Quick fire */}
      <div class="mt-section">
        <div class="mt-label">Quick fire · target <b>{pc()}</b></div>
        <div class="mechtest-quick">
          <For each={QUICK}>
            {(q) => <button class="mechtest-chip" onClick={() => fire(q.line(), q.label)}>{q.label}</button>}
          </For>
        </div>
      </div>

      <Show when={last()}>
        <div class="mechtest-result">
          <div class="mr-label">{last().label} — parsed {last().parsedCount}</div>
          <Show when={last().applied.length}>
            <div class="mr-group mr-ok"><For each={last().applied}>{(t) => <span class="mr-pill">✓ {t}</span>}</For></div>
          </Show>
          <Show when={last().rejected.length}>
            <div class="mr-group mr-rejected"><For each={last().rejected}>{(t) => <span class="mr-pill">✕ {t}</span>}</For></div>
          </Show>
          <Show when={last().failed.length}>
            <div class="mr-group mr-failed"><For each={last().failed}>{(t) => <span class="mr-pill">! {t}</span>}</For></div>
          </Show>
          <Show when={!last().applied.length && !last().rejected.length && !last().failed.length}>
            <div class="mr-empty">No known mechanics found.</div>
          </Show>
        </div>
      </Show>

      {/* Export */}
      <div class="mt-section">
        <div class="mt-label">Export <span class="mt-label-hint">— Testing Notes travel with Copy/Download</span></div>
        <textarea
          class="mechtest-input"
          value={testerNotes()}
          onInput={(e) => setTesterNotes(e.target.value)}
          rows="3"
          placeholder="Testing notes — what did you try, what happened?"
        />
        <div class="mechtest-actions">
          <button class="mechtest-run" onClick={copyExport}><i class="ph ph-copy" /> Copy</button>
          <button class="mechtest-reset" onClick={downloadExport}><i class="ph ph-download-simple" /> Download</button>
        </div>
        <Show when={copied()}><div class="mt-copied">{copied()}</div></Show>
      </div>

      {/* Build Status — auto-runs on open */}
      <div class="mt-section">
        <div class="mt-label">Build Status</div>
        <Show when={audit()} fallback={<div class="mt-loading">Checking…</div>}>
          <div class="audit-results">
            <For each={audit()}>
              {(row) => (
                <div class={`audit-row audit-${row.status}`}>
                  <span class="audit-dot" />
                  <span class="audit-label">{row.label}</span>
                  <span class="audit-detail">{row.detail}</span>
                </div>
              )}
            </For>
          </div>
          <button class="mechtest-reset mt-reaudit" onClick={runAudit}><i class="ph ph-arrows-clockwise" /> Re-check</button>
        </Show>
      </div>

      {/* Environment */}
      <div class="mt-section">
        <div class="mt-label">Environment</div>
        <div class="mechtest-quick">
          <button class="mechtest-chip" onClick={loadFullDemo}>Load FULL demo</button>
          <button class="mechtest-chip" onClick={loadDemoCampaign}>Load basic demo</button>
          <button class="mechtest-chip mt-danger" onClick={newCampaign}>New / reset</button>
        </div>
      </div>

      {/* Inject */}
      <div class="mt-section">
        <div class="mt-label">Inject a block</div>
        <textarea class="mechtest-input" value={text()} onInput={(e) => setText(e.target.value)} rows="5" spellcheck={false} />
        <div class="mechtest-actions">
          <button class="mechtest-run" onClick={() => { const r = run(text(), 'Injected block'); setLast(r); }}>Inject</button>
          <button class="mechtest-reset" onClick={() => setText(SAMPLE)}>Reset</button>
        </div>
      </div>
    </div>
  );
}

function stripMech(raw) {
  return raw
    .replace(/---MECHANICS---[\s\S]*?---END---/g, '')
    .replace(/\*\*\*/g, '')
    .trim() || '[mechanics test]';
}
