import { createSignal, Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';

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

export default function RollBar() {
  const [rollResult, setRollResult] = createSignal(null);

  const pendingRoll = () => {
    const msgs = store.campaign.narrative;
    if (!msgs.length) return null;
    const last = msgs[msgs.length - 1];
    if (last.role !== 'assistant' || !last.mechanics) return null;
    const rollMech = last.mechanics.applied?.find(m => m.key === 'roll_request' && m.applied);
    if (!rollMech) return null;
    const [skill, dcStr, pcName] = rollMech.value.split('|').map(s => s.trim());
    return { skill, dc: parseInt(dcStr, 10) || 10, pcName };
  };

  const pc = () => {
    const roll = pendingRoll();
    if (!roll) return null;
    const lower = roll.pcName.toLowerCase();
    return store.campaign.characters.find(c =>
      c.name.toLowerCase() === lower ||
      c.name.toLowerCase().startsWith(lower.split(' ')[0])
    ) || null;
  };

  const bonus = () => {
    const p = pc();
    const roll = pendingRoll();
    if (!p || !roll) return 0;
    return getSkillBonus(p, roll.skill);
  };

  const hasRolled = () => rollResult() !== null;
  const total = () => hasRolled() ? rollResult() + bonus() : null;
  const modStr = () => { const m = bonus(); return m >= 0 ? `+${m}` : `${m}`; };

  function doRoll() {
    const d20 = Math.floor(Math.random() * 20) + 1;
    setRollResult(d20);
  }

  function submitRoll() {
    const roll = pendingRoll();
    const d20 = rollResult();
    if (!roll || d20 === null) return;
    const mod = bonus();
    const t = d20 + mod;
    const ms = mod >= 0 ? `+${mod}` : `${mod}`;
    const msg = `${roll.pcName} rolled ${t} for ${roll.skill} (d20: ${d20} ${ms}) — DC ${roll.dc}`;

    setStore('campaign', 'narrative', [...store.campaign.narrative, {
      role: 'user', content: msg, ts: Date.now(),
    }]);
    setRollResult(null);
  }

  return (
    <Show when={pendingRoll()}>
      <div class="roll-bar">
        <div class="roll-info">
          <span class="roll-skill">{pendingRoll()?.skill}</span>
          <span class="roll-pc">{pendingRoll()?.pcName}</span>
          <span class="roll-dc">DC {pendingRoll()?.dc}</span>
        </div>
        <Show when={!hasRolled()}>
          <button class="btn-roll" onClick={doRoll}>Roll d20</button>
        </Show>
        <Show when={hasRolled()}>
          <div class="roll-result-display">
            <span class={`roll-d20 ${rollResult() === 20 ? 'nat-20' : ''} ${rollResult() === 1 ? 'nat-1' : ''}`}>
              {rollResult()}
            </span>
            <span class="roll-mod">{modStr()}</span>
            <span class="roll-eq">=</span>
            <span class={`roll-total ${total() >= pendingRoll()?.dc ? 'roll-pass' : 'roll-fail'}`}>
              {total()}
            </span>
          </div>
          <button class="btn-roll btn-roll-submit" onClick={submitRoll}>Send</button>
        </Show>
      </div>
    </Show>
  );
}
