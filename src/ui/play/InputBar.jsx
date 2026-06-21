import { createSignal } from 'solid-js';
import { sendMsg, isSending, stopGeneration } from '../../ai/engine.js';
import { validateMechanics, applyMechanics } from '../../ai/mechanics.js';
import { store, setStore } from '../../state/index.js';

const TEST_BATCHES = [
  {
    label: 'HP + Conditions',
    mechanics: [
      { key: 'hp', value: 'Ivy=18', target: '', applied: false },
      { key: 'hp', value: 'Thorn=20', target: '', applied: false },
      { key: 'conditions', value: 'Ivy+Poisoned', target: '', applied: false },
      { key: 'concentration', value: 'Thorn=Hypnotic Pattern', target: '', applied: false },
    ]
  },
  {
    label: 'Items + Gold',
    mechanics: [
      { key: 'item_add', value: 'Ivy,Cloak of Elvenkind,wondrous,attuned', target: '', applied: false },
      { key: 'item_add', value: 'Thorn,Lute of Illusions,wondrous,none', target: '', applied: false },
      { key: 'wagon_add', value: '3 Healing Potions,potion,none', target: '', applied: false },
      { key: 'income', value: '150,looted from bandit chest', target: '', applied: false },
    ]
  },
  {
    label: 'Quests + NPCs',
    mechanics: [
      { key: 'quest_add', value: 'Find the missing blacksmith|He disappeared 3 days ago|Thornvale', target: '', applied: false },
      { key: 'npc_add', value: 'Captain Voss,guard captain,stern but fair,Thornvale garrison', target: '', applied: false },
      { key: 'npc_mood', value: 'Captain Voss=friendly', target: '', applied: false },
      { key: 'consequence_add', value: 'Bandits regroup in 3 days|3 days|The bandit camp will be reinforced', target: '', applied: false },
    ]
  },
  {
    label: 'World State',
    mechanics: [
      { key: 'location', value: 'Thornvale Market Square', target: '', applied: false },
      { key: 'time', value: 'Late Afternoon', target: '', applied: false },
      { key: 'weather', value: 'Overcast, light drizzle', target: '', applied: false },
      { key: 'location_add', value: 'Thornvale Market Square|town_square|A bustling marketplace', target: '', applied: false },
      { key: 'chapter_add', value: 'The Road to Thornvale|The party arrived after a day of travel', target: '', applied: false },
    ]
  },
];

function runTestBatch(batch) {
  const { valid, rejected } = validateMechanics([...batch.mechanics]);
  const applied = applyMechanics(valid);

  const msg = {
    role: 'assistant',
    content: `[TEST] ${batch.label} — ${applied.filter(m => m.applied).length} applied, ${rejected.length} rejected`,
    mechanics: { applied, rejected },
    ts: Date.now(),
  };
  setStore('campaign', 'narrative', [...store.campaign.narrative, msg]);
}

function runAllTests() {
  for (const batch of TEST_BATCHES) {
    runTestBatch(batch);
  }
}

function exportResults() {
  const c = store.campaign;
  const out = {
    characters: c.characters.map(pc => ({
      name: pc.name, hp: pc.hp, hpMax: pc.hpMax, ac: pc.ac,
      conditions: pc.conditions, concentration: pc.concentration,
    })),
    gold: c.gold,
    inventory: c.inventory,
    location: c.location, time: c.time, weather: c.weather,
    quests: c.quests,
    npcs: c.npcs,
    consequences: c.consequences,
    locations: c.locations,
    chapters: c.chapters,
    primaryMission: c.primaryMission,
  };
  const text = JSON.stringify(out, null, 2);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('Copied to clipboard');
  }
}

export default function InputBar(props) {
  const [text, setText] = createSignal('');
  const [showTest, setShowTest] = createSignal(false);
  let inputRef;

  async function handleSend() {
    const msg = text().trim();
    if (!msg || isSending()) return;
    setText('');
    inputRef?.focus();
    await sendMsg(msg, { tab: props.tab });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div class="input-bar">
      <div class="input-row">
        <textarea
          ref={inputRef}
          class="input-field"
          placeholder={props.tab === 'ooc' ? 'Ask a rules question...' : 'What do you do?'}
          value={text()}
          onInput={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows="1"
        />
        {isSending() ? (
          <button class="btn-stop" onClick={stopGeneration}>Stop</button>
        ) : (
          <button class="btn-send" onClick={handleSend} disabled={!text().trim()}>Send</button>
        )}
      </div>
      <div class="test-controls">
        <button class="btn-test-toggle" onClick={() => setShowTest(!showTest())}>
          {showTest() ? '▾ Test' : '▸ Test'}
        </button>
        {showTest() && (
          <div class="test-buttons">
            {TEST_BATCHES.map(b => (
              <button class="btn-test" onClick={() => runTestBatch(b)}>{b.label}</button>
            ))}
            <button class="btn-test btn-test-all" onClick={runAllTests}>All</button>
            <button class="btn-test btn-test-export" onClick={exportResults}>Export</button>
          </div>
        )}
      </div>
    </div>
  );
}
