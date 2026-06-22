import { createSignal, For, Show } from 'solid-js';
import { sendMsg, isSending } from '../../ai/engine.js';
import { validateMechanics, applyMechanics } from '../../ai/mechanics.js';
import { store, setStore } from '../../state/index.js';
import { loadDemoCampaign } from '../../data/demo.js';

const SCENARIOS = [
  {
    label: '1. Town Arrival',
    desc: 'Tests: location, time, weather, npc_add, location_add',
    prompts: [
      'We arrive at Ashford as the sun sets. We head to the first tavern we see.',
      'Ivy approaches the barkeep and asks about the disappearances near the old mine.',
    ],
  },
  {
    label: '2. Social / Rolls',
    desc: 'Tests: roll_request (Persuasion/Deception/Insight), npc_mood',
    prompts: [
      'Thorn tries to charm the barkeep into giving us free rooms for the night.',
      'Ivy tries to pickpocket the drunk nobleman at the corner table.',
    ],
  },
  {
    label: '3. Shopping',
    desc: 'Tests: expense, item_add, item_remove',
    prompts: [
      'We visit the general store. Ivy buys a grappling hook and 50ft of silk rope. Thorn buys a healing potion.',
      'Ivy sells the horseshoe nails we found on the road.',
    ],
  },
  {
    label: '4. Combat',
    desc: 'Tests: combat_start, zone_add_enemy, hp, conditions, roll_request, combat_end, xp',
    prompts: [
      'We head toward the old mine. Bandits ambush us on the path.',
      'Ivy hides behind a rock and fires her crossbow at the closest bandit. Thorn casts Hypnotic Pattern.',
    ],
  },
  {
    label: '5. Exploration',
    desc: 'Tests: roll_request (Perception/Investigation/Survival), item_add, quest_add, consequence_add',
    prompts: [
      'We explore the mine entrance. Ivy checks for traps. Thorn looks for tracks.',
      'We go deeper into the mine. What do we find?',
    ],
  },
  {
    label: '6. Rest + Recovery',
    desc: 'Tests: short_rest, hp, conditions removal, slot_restore',
    prompts: [
      'We take a short rest in a safe alcove. Ivy uses a healing potion. Thorn uses hit dice.',
    ],
  },
  {
    label: '7. Quest Resolution',
    desc: 'Tests: quest_done, quest_update, xp, income, chapter_add, town_rep',
    prompts: [
      'We deliver the sealed crate to the Ashford trading post and collect our payment.',
    ],
  },
  {
    label: '8. Stress Test',
    desc: 'Tests: multiple mechanics in one response, edge cases',
    prompts: [
      'Ivy opens the sealed crate without permission.',
      'We flee town with the contents of the crate. Thorn bribes the gate guard. Ivy steals a horse.',
    ],
  },
];

const DIRECT_TESTS = [
  {
    label: 'HP + Cond',
    mechanics: [
      { key: 'hp', value: 'Ivy=18', target: '', applied: false },
      { key: 'hp', value: 'Thorn=20', target: '', applied: false },
      { key: 'conditions', value: 'Ivy+Poisoned', target: '', applied: false },
      { key: 'concentration', value: 'Thorn=Hypnotic Pattern', target: '', applied: false },
    ]
  },
  {
    label: 'Items+Gold',
    mechanics: [
      { key: 'item_add', value: 'Ivy,Cloak of Elvenkind,wondrous,attuned', target: '', applied: false },
      { key: 'item_add', value: 'Thorn,Lute of Illusions,wondrous,none', target: '', applied: false },
      { key: 'wagon_add', value: '3 Healing Potions,potion,none', target: '', applied: false },
      { key: 'income', value: '150,loot,bandit chest', target: '', applied: false },
    ]
  },
  {
    label: 'Quest+NPC',
    mechanics: [
      { key: 'quest_add', value: 'Find the missing blacksmith|He disappeared 3 days ago|Thornvale', target: '', applied: false },
      { key: 'npc_add', value: 'Captain Voss,guard captain,stern but fair,Thornvale garrison', target: '', applied: false },
      { key: 'npc_mood', value: 'Captain Voss=friendly', target: '', applied: false },
      { key: 'consequence_add', value: 'Bandits regroup in 3 days|3 days|The bandit camp will be reinforced', target: '', applied: false },
    ]
  },
  {
    label: 'World',
    mechanics: [
      { key: 'location', value: 'Thornvale Market Square', target: '', applied: false },
      { key: 'time', value: 'Late Afternoon', target: '', applied: false },
      { key: 'weather', value: 'Overcast, light drizzle', target: '', applied: false },
      { key: 'location_add', value: 'Thornvale Market Square|town_square|A bustling marketplace', target: '', applied: false },
      { key: 'chapter_add', value: 'The Road to Thornvale|The party arrived after a day of travel', target: '', applied: false },
    ]
  },
  {
    label: 'Roll',
    mechanics: [
      { key: 'roll_request', value: 'Persuasion|14|Ivy', target: '', applied: false },
    ]
  },
  {
    label: 'Combat',
    mechanics: [
      { key: 'combat_start', value: 'Bandits ambush on the road', target: '', applied: false },
      { key: 'zone_add_enemy', value: 'Bandit Leader|22|14|front|16', target: '', applied: false },
      { key: 'zone_add_enemy', value: 'Bandit Archer|11|12|back|12', target: '', applied: false },
    ]
  },
  {
    label: 'Rest',
    mechanics: [
      { key: 'short_rest', value: 'party', target: '', applied: false },
    ]
  },
  {
    label: 'LongRest',
    mechanics: [
      { key: 'long_rest', value: 'party', target: '', applied: false },
    ]
  },
  {
    label: 'ConSave',
    mechanics: [
      { key: 'concentration', value: 'Thorn=Faerie Fire', target: '', applied: false },
      { key: 'hp', value: 'Thorn=20', target: '', applied: false },
    ]
  },
  {
    label: 'TempHP',
    mechanics: [
      { key: 'temp_hp', value: 'Ivy=8', target: '', applied: false },
      { key: 'temp_hp', value: 'Thorn=5', target: '', applied: false },
    ]
  },
  {
    label: 'HitDice',
    mechanics: [
      { key: 'hit_dice_use', value: 'Ivy=1', target: '', applied: false },
      { key: 'hit_dice_use', value: 'Thorn=2', target: '', applied: false },
    ]
  },
  {
    label: 'Inspire',
    mechanics: [
      { key: 'inspiration', value: 'Ivy=grant', target: '', applied: false },
      { key: 'inspiration', value: 'Thorn=remove', target: '', applied: false },
    ]
  },
  {
    label: 'DeathSave',
    mechanics: [
      { key: 'death_save', value: 'Ivy=success', target: '', applied: false },
      { key: 'death_save', value: 'Ivy=failure', target: '', applied: false },
    ]
  },
  {
    label: 'RoundAdv',
    mechanics: [
      { key: 'round_advance', value: '', target: '', applied: false },
    ]
  },
];

function runTestBatch(batch) {
  const { valid, rejected } = validateMechanics([...batch.mechanics]);
  const applied = applyMechanics(valid);
  const msg = {
    id: `nar_test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'dm',
    content: `[TEST] ${batch.label} — ${applied.filter(m => m.applied).length} applied, ${rejected.length} rejected`,
    mechanics: { applied, rejected },
    ts: Date.now(),
    gameTs: store.campaign.time || null,
    playerName: null,
    partial: false,
  };
  setStore('campaign', 'narrative', [...store.campaign.narrative, msg]);
}

function runAllDirect() {
  for (const batch of DIRECT_TESTS) runTestBatch(batch);
}

async function runScenarioPrompt(promptText) {
  if (isSending()) return;
  await sendMsg(promptText, { tab: 'narrative' });
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
    narrative: c.narrative.map(m => ({ type: m.type || m.role, content: m.content, hasMechanics: !!m.mechanics })),
  };
  const text = JSON.stringify(out, null, 2);
  const done = () => {
    alert('Copied to clipboard — chat cleared');
    setStore('campaign', 'narrative', []);
    setStore('campaign', 'ooc', []);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(done);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    done();
  }
}

export default function DevTools(props) {
  const [testMode, setTestMode] = createSignal('scenarios');
  const [sentPrompts, setSentPrompts] = createSignal(new Set());

  async function handleScenarioPrompt(scenarioIdx, promptIdx, promptText) {
    if (isSending()) return;
    const key = `${scenarioIdx}-${promptIdx}`;
    setSentPrompts(prev => new Set([...prev, key]));
    await runScenarioPrompt(promptText);
  }

  function isPromptSent(scenarioIdx, promptIdx) {
    return sentPrompts().has(`${scenarioIdx}-${promptIdx}`);
  }

  function isNextPrompt(scenarioIdx, promptIdx) {
    if (promptIdx === 0) return !isPromptSent(scenarioIdx, 0);
    return isPromptSent(scenarioIdx, promptIdx - 1) && !isPromptSent(scenarioIdx, promptIdx);
  }

  return (
    <div class="test-panel">
      <div class="test-panel-header">
        <div class="test-mode-tabs">
          <button
            class={`test-mode-tab ${testMode() === 'scenarios' ? 'active' : ''}`}
            onClick={() => setTestMode('scenarios')}
          >Scenarios</button>
          <button
            class={`test-mode-tab ${testMode() === 'direct' ? 'active' : ''}`}
            onClick={() => setTestMode('direct')}
          >Direct</button>
        </div>
        <button class="test-panel-close" onClick={() => props.onClose?.()}>✕</button>
      </div>

      {testMode() === 'scenarios' && (
        <div class="test-scenarios">
          {SCENARIOS.map((s, si) => (
            <div class={`scenario-card ${SCENARIOS[si].prompts.every((_, pi) => isPromptSent(si, pi)) ? 'scenario-done' : ''}`}>
              <div class="scenario-header">
                <span class="scenario-label">{s.label}</span>
                <span class="scenario-desc">{s.desc}</span>
              </div>
              <div class="scenario-prompts">
                {s.prompts.map((p, pi) => (
                  <button
                    class={`btn-scenario-prompt ${isPromptSent(si, pi) ? 'prompt-sent' : ''} ${isNextPrompt(si, pi) ? 'prompt-next' : ''}`}
                    onClick={() => handleScenarioPrompt(si, pi, p)}
                    disabled={isSending() || isPromptSent(si, pi)}
                  >
                    <span class="prompt-status">{isPromptSent(si, pi) ? '✓' : isNextPrompt(si, pi) ? '▸' : ' '}</span>
                    {p.length > 55 ? p.slice(0, 55) + '...' : p}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {testMode() === 'direct' && (
        <div class="test-buttons">
          {DIRECT_TESTS.map(b => (
            <button class="btn-test" onClick={() => runTestBatch(b)}>{b.label}</button>
          ))}
          <button class="btn-test btn-test-all" onClick={runAllDirect}>All</button>
        </div>
      )}

      <div class="test-export-row">
        <button class="btn-test-export" onClick={exportResults} disabled={isSending()}>Export</button>
        <button class="btn-test" onClick={loadDemoCampaign}>Load Demo</button>
      </div>
    </div>
  );
}
