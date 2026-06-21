import { createSignal, createMemo, Show, For } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { sendMsg, isSending } from '../../ai/engine.js';

const SKILL_ABILITY = {
  acrobatics: 'dex', 'animal handling': 'wis', arcana: 'int',
  athletics: 'str', deception: 'cha', history: 'int',
  insight: 'wis', intimidation: 'cha', investigation: 'int',
  medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int',
  'sleight of hand': 'dex', stealth: 'dex', survival: 'wis',
  slightofhand: 'dex', sleightofhand: 'dex',
};

function getModifier(score) {
  return Math.floor((score - 10) / 2);
}

function getSkillBonus(pc, skillName) {
  const lower = skillName.toLowerCase().replace(/\s+/g, '');
  const camel = lower.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase())
    .replace(/^./, c => c.toLowerCase());

  if (pc.skills[camel] !== undefined) return pc.skills[camel];
  if (pc.skills[lower] !== undefined) return pc.skills[lower];

  const ability = SKILL_ABILITY[lower] || SKILL_ABILITY[skillName.toLowerCase()];
  if (ability && pc.abilityScores[ability] !== undefined) {
    return getModifier(pc.abilityScores[ability]);
  }
  return 0;
}

function findPC(name) {
  const lower = name.toLowerCase();
  return store.campaign.characters.find(c =>
    c.name.toLowerCase() === lower ||
    c.name.toLowerCase().startsWith(lower.split(' ')[0])
  ) || null;
}

function isPlayerChar(name) {
  return findPC(name) !== null;
}

export default function RollBar() {
  const [rollResults, setRollResults] = createSignal({});
  const [submitted, setSubmitted] = createSignal(new Set());

  const allPendingRolls = createMemo(() => {
    const msgs = store.campaign.narrative;
    if (!msgs.length) return [];

    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg.role === 'user') break;
      if (msg.role === 'assistant' && msg.mechanics) {
        const rolls = msg.mechanics.applied
          ?.filter(m => m.key === 'roll_request' && m.applied)
          .map((m, idx) => {
            const [skill, dcStr, pcName] = m.value.split('|').map(s => s.trim());
            return {
              id: `${i}-${idx}`,
              skill,
              dc: dcStr === 'none' ? null : (parseInt(dcStr, 10) || null),
              pcName: pcName || 'Unknown',
              isPC: isPlayerChar(pcName || ''),
            };
          }) || [];
        if (rolls.length > 0) return rolls;
      }
    }
    return [];
  });

  const pendingRolls = createMemo(() => {
    const sub = submitted();
    return allPendingRolls().filter(r => !sub.has(r.id));
  });

  const currentRoll = () => pendingRolls().length > 0 ? pendingRolls()[0] : null;

  const pc = () => {
    const roll = currentRoll();
    if (!roll) return null;
    return findPC(roll.pcName);
  };

  const bonus = () => {
    const p = pc();
    const roll = currentRoll();
    if (!p || !roll) return 0;
    return getSkillBonus(p, roll.skill);
  };

  const currentResult = () => {
    const roll = currentRoll();
    if (!roll) return null;
    return rollResults()[roll.id] ?? null;
  };

  const hasRolled = () => currentResult() !== null;
  const total = () => hasRolled() ? currentResult() + bonus() : null;
  const modStr = () => { const m = bonus(); return m >= 0 ? `+${m}` : `${m}`; };

  function doRoll() {
    const roll = currentRoll();
    if (!roll) return;
    const d20 = Math.floor(Math.random() * 20) + 1;
    setRollResults(prev => ({ ...prev, [roll.id]: d20 }));
  }

  function submitAll() {
    const rolls = allPendingRolls();
    const results = rollResults();
    const lines = [];

    for (const roll of rolls) {
      const d20 = results[roll.id];
      if (d20 == null) continue;
      const p = findPC(roll.pcName);
      const mod = p ? getSkillBonus(p, roll.skill) : 0;
      const t = d20 + mod;
      const ms = mod >= 0 ? `+${mod}` : `${mod}`;
      const dcPart = roll.dc ? ` — DC ${roll.dc}` : '';
      lines.push(`${roll.pcName} rolled ${t} for ${roll.skill} (d20: ${d20} ${ms})${dcPart}`);
    }

    if (lines.length === 0) return;
    const msg = lines.join('\n');

    setStore('campaign', 'narrative', [...store.campaign.narrative, {
      role: 'user', content: msg, ts: Date.now(),
    }]);
    setRollResults({});
    setSubmitted(new Set());
  }

  function markSubmitted(rollId) {
    const roll = allPendingRolls().find(r => r.id === rollId);
    if (!roll) return;
    setSubmitted(prev => new Set([...prev, rollId]));
  }

  function handleRollAndAdvance() {
    doRoll();
  }

  const allRolled = () => {
    const rolls = allPendingRolls();
    const results = rollResults();
    return rolls.length > 0 && rolls.every(r => results[r.id] != null);
  };

  const progress = () => {
    const rolls = allPendingRolls();
    const results = rollResults();
    const done = rolls.filter(r => results[r.id] != null).length;
    return `${done}/${rolls.length}`;
  };

  return (
    <Show when={pendingRolls().length > 0 || allRolled()}>
      <div class="roll-bar">
        <Show when={!allRolled()}>
          <div class="roll-info">
            <span class="roll-skill">{currentRoll()?.skill}</span>
            <span class="roll-pc">{currentRoll()?.pcName}</span>
            <Show when={currentRoll()?.dc}>
              <span class="roll-dc">DC {currentRoll()?.dc}</span>
            </Show>
            <Show when={allPendingRolls().length > 1}>
              <span class="roll-progress">{progress()}</span>
            </Show>
          </div>
          <Show when={!hasRolled()}>
            <button class="btn-roll" onClick={handleRollAndAdvance}>Roll d20</button>
          </Show>
          <Show when={hasRolled()}>
            <div class="roll-result-display">
              <span class={`roll-d20 ${currentResult() === 20 ? 'nat-20' : ''} ${currentResult() === 1 ? 'nat-1' : ''}`}>
                {currentResult()}
              </span>
              <span class="roll-mod">{modStr()}</span>
              <span class="roll-eq">=</span>
              <span class={`roll-total ${currentRoll()?.dc && total() >= currentRoll()?.dc ? 'roll-pass' : ''} ${currentRoll()?.dc && total() < currentRoll()?.dc ? 'roll-fail' : ''}`}>
                {total()}
              </span>
            </div>
            <button class="btn-roll" onClick={() => markSubmitted(currentRoll()?.id)}>Next</button>
          </Show>
        </Show>

        <Show when={allRolled()}>
          <div class="roll-summary">
            <For each={allPendingRolls()}>
              {(roll) => {
                const d20 = () => rollResults()[roll.id];
                const p = () => findPC(roll.pcName);
                const mod = () => p() ? getSkillBonus(p(), roll.skill) : 0;
                const t = () => d20() + mod();
                return (
                  <div class="roll-summary-line">
                    <span class="roll-summary-name">{roll.pcName}</span>
                    <span class="roll-summary-skill">{roll.skill}</span>
                    <span class={`roll-summary-total ${roll.dc && t() >= roll.dc ? 'roll-pass' : ''} ${roll.dc && t() < roll.dc ? 'roll-fail' : ''}`}>
                      {t()}
                    </span>
                    <Show when={roll.dc}>
                      <span class="roll-summary-dc">DC {roll.dc}</span>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
          <button class="btn-roll btn-roll-submit" onClick={submitAll} disabled={isSending()}>
            Send All
          </button>
        </Show>
      </div>
    </Show>
  );
}
