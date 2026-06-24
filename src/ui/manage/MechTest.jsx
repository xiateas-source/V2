import { createSignal, For, Show } from 'solid-js';
import { store, aiSet } from '../../state/index.js';
import { extractMechanics, validateMechanics, applyMechanics } from '../../ai/mechanics.js';
import { createNarrativeMsg } from '../../ai/messages.js';

// Mechanics test container — fire mechanics straight through the
// extract → validate → apply pipeline and watch the live state react, with no
// AI/provider needed. This is the harness for "is the loop actually working?"

const SAMPLE = `The kobold lunges from the dark. Ivy twists aside but the blade bites deep.

***
---MECHANICS---
hp: Ivy, -5
xp: 25
consequence_add: Wounded by kobold ambush|threat
---END---`;

export default function MechTest(props) {
  const [text, setText] = createSignal(SAMPLE);
  const [last, setLast] = createSignal(null);

  const firstPC = () => store.campaign.characters[0]?.name || 'the party';

  function run(raw, label) {
    const parsed = extractMechanics(raw);
    const { valid, rejected } = validateMechanics(parsed);
    const applied = applyMechanics(valid);
    // Drop a DM message into the feed so the result is visible in context, the
    // same shape the engine produces — so mech pills render too.
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

  function fire(line, label) {
    run(`---MECHANICS---\n${line}\n---END---`, label);
  }

  function seedScene() {
    aiSet('location', 'Hunting Lodge Ruins');
    aiSet('time', 'Day 26, 01:15 AM');
    aiSet('weather', 'Clear night');
    if (!store.campaign.primaryMission) aiSet('primaryMission', 'Stop the cult before the ritual');
    setLast({ label: 'Seeded scene', applied: ['location', 'time', 'weather'], failed: [], rejected: [], parsedCount: 3 });
  }

  const pc = firstPC;

  const QUICK = [
    { label: 'Damage 5', line: () => `hp: ${pc()}, -5` },
    { label: 'Heal 8', line: () => `hp: ${pc()}, +8` },
    { label: '+50 gp', line: () => `gp: +50` },
    { label: '+100 XP', line: () => `xp: 100` },
    { label: 'Poisoned', line: () => `conditions: ${pc()}, poisoned` },
    { label: 'New quest', line: () => `quest_add: Recover the stolen relic` },
    { label: 'Add item', line: () => `item_add: ${pc()}, Healing Potion, 1` },
    { label: 'Meet NPC', line: () => `npc_add: Leosin, Friendly, captive monk` },
    { label: 'Consequence', line: () => `consequence_add: Pursuers on your trail|threat` },
    { label: 'Start combat', line: () => `combat_start: Kobold|6|13|10` },
    { label: 'End combat', line: () => `combat_end: Victory` },
  ];

  return (
    <div class="mechtest">
      <div class="mechtest-head">
        <span class="mechtest-title"><i class="ph ph-flask" /> Test container</span>
        <button class="mechtest-close" onClick={() => props.onClose?.()}>&times;</button>
      </div>

      <div class="mechtest-hint">
        Fire mechanics through extract → validate → apply. Watch the party HUD,
        situation bar, and combat react. Target: <b>{pc()}</b>.
      </div>

      <div class="mechtest-row">
        <button class="mechtest-seed" onClick={seedScene}>Seed scene</button>
      </div>

      <div class="mechtest-quick">
        <For each={QUICK}>
          {(q) => <button class="mechtest-chip" onClick={() => fire(q.line(), q.label)}>{q.label}</button>}
        </For>
      </div>

      <textarea
        class="mechtest-input"
        value={text()}
        onInput={(e) => setText(e.target.value)}
        rows="6"
        spellcheck={false}
      />
      <div class="mechtest-actions">
        <button class="mechtest-run" onClick={() => run(text(), 'Injected block')}>Inject</button>
        <button class="mechtest-reset" onClick={() => setText(SAMPLE)}>Reset</button>
      </div>

      <Show when={last()}>
        <div class="mechtest-result">
          <div class="mr-label">{last().label} — parsed {last().parsedCount}</div>
          <Show when={last().applied.length}>
            <div class="mr-group mr-ok">
              <For each={last().applied}>{(t) => <span class="mr-pill">✓ {t}</span>}</For>
            </div>
          </Show>
          <Show when={last().rejected.length}>
            <div class="mr-group mr-rejected">
              <For each={last().rejected}>{(t) => <span class="mr-pill">✕ {t}</span>}</For>
            </div>
          </Show>
          <Show when={last().failed.length}>
            <div class="mr-group mr-failed">
              <For each={last().failed}>{(t) => <span class="mr-pill">! {t}</span>}</For>
            </div>
          </Show>
          <Show when={!last().applied.length && !last().rejected.length && !last().failed.length}>
            <div class="mr-empty">No known mechanics found in that text.</div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

function stripMech(raw) {
  return raw
    .replace(/---MECHANICS---[\s\S]*?---END---/g, '')
    .replace(/\*\*\*/g, '')
    .trim() || '[mechanics test]';
}
