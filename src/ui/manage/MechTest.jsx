import { createSignal, For, Show } from 'solid-js';
import { store, setStore, aiSet, resetCampaign } from '../../state/index.js';
import { extractMechanics, validateMechanics, applyMechanics } from '../../ai/mechanics.js';
import { createNarrativeMsg } from '../../ai/messages.js';
import { loadDemoCampaign, loadFullDemo } from '../../data/demo.js';
import { clearActiveCampaign, exportSnapshot } from '../../data/persist.js';
import { navigateTo, openCharSheet } from '../shared/sourceBus.js';
import { countStore } from '../../data/local.js';

// Testing area — load environments, fire mechanics through the real pipeline,
// jump to any tab, and export the whole campaign for review with Claude. No AI
// provider needed.

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

export default function MechTest(props) {
  const [text, setText] = createSignal(SAMPLE);
  const [last, setLast] = createSignal(null);
  const [copied, setCopied] = createSignal('');
  const [audit, setAudit] = createSignal(null);

  const firstPC = () => store.campaign.characters[0]?.name || 'the party';

  function run(raw, label) {
    const parsed = extractMechanics(raw);
    const { valid, rejected } = validateMechanics(parsed);
    const applied = applyMechanics(valid);
    const msg = createNarrativeMsg('dm', stripMech(raw), { mechanics: { applied, rejected } });
    aiSet('narrative', [...store.campaign.narrative, msg]);
    setLast({
      label: label || 'Injected',
      applied: applied.filter(m => m.applied).map(m => `${m.key}: ${m.value}`),
      failed: applied.filter(m => !m.applied).map(m => `${m.key} — ${m.error}`),
      rejected: rejected.map(m => `${m.key} — ${m.reason}`),
      parsedCount: parsed.length,
    });
  }

  function fire(line, label) { run(`---MECHANICS---\n${line}\n---END---`, label); }

  const pc = firstPC;
  const QUICK = [
    { label: 'Damage 5', line: () => `hp: ${pc()}, -5` },
    { label: 'Heal 8', line: () => `hp: ${pc()}, +8` },
    { label: '+50 gp', line: () => `gp: +50` },
    { label: '+100 XP', line: () => `xp: 100` },
    { label: 'Poisoned', line: () => `conditions: ${pc()}, poisoned` },
    { label: 'New quest', line: () => `quest_add: Recover the stolen relic` },
    { label: 'Add item', line: () => `item_add: ${pc()}, Healing Potion, potion` },
    { label: 'Meet NPC', line: () => `npc_add: Leosin, Friendly, captive monk` },
    { label: 'Consequence', line: () => `consequence_add: Pursuers on your trail|threat` },
    { label: 'Town rep', line: () => `town_rep: Greenest, Friendly, saved the town` },
    { label: 'Start combat', line: () => `combat_start: Kobold|6|13|10` },
    { label: 'End combat', line: () => `combat_end: Victory` },
    { label: 'Add familiar', line: () => `familiar_add: ${pc()}|Quill,Owl,Fey,1,1,11` },
  ];

  async function newCampaign() {
    if (!confirm('Start a new campaign? This clears the current game on this device.')) return;
    await clearActiveCampaign();
    resetCampaign(setStore);
    props.onClose?.();
  }

  async function copyExport() {
    const json = JSON.stringify(exportSnapshot(), null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopied('Copied to clipboard');
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
    results.push({ label: 'Characters', detail: `${chars.length} loaded`, status: chars.length > 0 ? 'green' : 'red' });
    const hasFamiliar = chars.some(c => c.familiar);
    results.push({ label: 'Familiar data', detail: hasFamiliar ? 'Present' : 'None', status: hasFamiliar ? 'green' : 'yellow' });
    const quests = store.campaign.quests || [];
    results.push({ label: 'Quests', detail: `${quests.length}`, status: quests.length > 0 ? 'green' : 'yellow' });
    const npcs = store.campaign.npcs || [];
    results.push({ label: 'NPCs', detail: `${npcs.length}`, status: npcs.length > 0 ? 'green' : 'yellow' });
    const cs = store.campaign.combatState;
    results.push({ label: 'Combat state', detail: cs ? 'Initialized' : 'Missing', status: cs ? 'green' : 'red' });
    const contracts = store.campaign.contracts;
    results.push({ label: 'Contracts', detail: contracts?.length ? `${contracts.length}` : 'None', status: contracts?.length ? 'green' : 'yellow' });
    const narrative = store.campaign.narrative || [];
    results.push({ label: 'Narrative', detail: `${narrative.length} messages`, status: narrative.length > 0 ? 'green' : 'yellow' });
    setAudit(results);
  }

  function downloadExport() {
    const json = JSON.stringify(exportSnapshot(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tinklepebble-${store.campaign.id || 'campaign'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div class="mechtest">
      <div class="mechtest-head">
        <span class="mechtest-title"><i class="ph ph-flask" /> Test container</span>
        <button class="mechtest-close" onClick={() => props.onClose?.()}>&times;</button>
      </div>

      {/* Environment */}
      <div class="mt-section">
        <div class="mt-label">Environment</div>
        <div class="mechtest-quick">
          <button class="mechtest-chip" onClick={loadFullDemo}>Load FULL demo (all tabs)</button>
          <button class="mechtest-chip" onClick={loadDemoCampaign}>Load basic demo</button>
          <button class="mechtest-chip mt-danger" onClick={newCampaign}>New / reset</button>
        </div>
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
        </div>
      </div>

      {/* Export — first so it's always visible */}
      <div class="mt-section">
        <div class="mt-label">Export for review</div>
        <div class="mechtest-actions">
          <button class="mechtest-run" onClick={copyExport}><i class="ph ph-copy" /> Copy all data</button>
          <button class="mechtest-reset" onClick={downloadExport}><i class="ph ph-download-simple" /> Download JSON</button>
        </div>
        <Show when={copied()}><div class="mt-copied">{copied()}</div></Show>
      </div>

      {/* Fire mechanics */}
      <div class="mt-section">
        <div class="mt-label">Fire mechanic · target <b>{pc()}</b></div>
        <div class="mechtest-quick">
          <For each={QUICK}>
            {(q) => <button class="mechtest-chip" onClick={() => fire(q.line(), q.label)}>{q.label}</button>}
          </For>
        </div>
      </div>

      {/* Inject */}
      <div class="mt-section">
        <div class="mt-label">Inject a block</div>
        <textarea class="mechtest-input" value={text()} onInput={(e) => setText(e.target.value)} rows="6" spellcheck={false} />
        <div class="mechtest-actions">
          <button class="mechtest-run" onClick={() => run(text(), 'Injected block')}>Inject</button>
          <button class="mechtest-reset" onClick={() => setText(SAMPLE)}>Reset text</button>
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
            <div class="mr-empty">No known mechanics found in that text.</div>
          </Show>
        </div>
      </Show>

      {/* Build Status Audit */}
      <div class="mt-section">
        <div class="mt-label">Build Status</div>
        <div class="mechtest-actions">
          <button class="mechtest-run" onClick={runAudit}><i class="ph ph-list-checks" /> Run Audit</button>
        </div>
        <Show when={audit()}>
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
        </Show>
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
