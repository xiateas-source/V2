import { createSignal, createMemo, Show, For } from 'solid-js';
import { store } from '../../state/index.js';
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

const ABILITY_ABBREV = {
  strength: 'str', dexterity: 'dex', constitution: 'con',
  intelligence: 'int', wisdom: 'wis', charisma: 'cha',
  str: 'str', dex: 'dex', con: 'con', int: 'int', wis: 'wis', cha: 'cha',
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

  // Check if it's an ability/saving throw name
  const abilityKey = ABILITY_ABBREV[lower] || ABILITY_ABBREV[skillName.toLowerCase()];
  if (abilityKey && pc.abilityScores[abilityKey] !== undefined) {
    const mod = getModifier(pc.abilityScores[abilityKey]);
    const profBonus = Math.floor((pc.level - 1) / 4) + 2;
    const isProficient = pc.savingThrows?.includes(abilityKey);
    return mod + (isProficient ? profBonus : 0);
  }

  // Check if it's "Attack Roll" — use the relevant attack bonus
  if (lower === 'attackroll' || lower === 'attack') {
    if (pc.attacks?.length > 0) return pc.attacks[0].bonus || 0;
    return 0;
  }

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
        if (msg.content?.startsWith('[TEST]')) continue;
        const rolls = msg.mechanics.applied
          ?.filter(m => m.key === 'roll_request' && m.applied)
          .map((m, idx) => {
            const parts = m.value.split('|').map(s => s.trim());
            const skill = parts[0];
            const dcStr = parts[1];
            const rawName = parts[2];
            const mod = (parts[3] || '').toLowerCase();
            const pcName = (rawName || 'Unknown').replace(/\s*\(.*\)$/, '');
            let advState = 'normal';
            if (mod === 'advantage') advState = 'advantage';
            else if (mod === 'disadvantage') advState = 'disadvantage';
            return {
              id: `${i}-${idx}`,
              skill,
              dc: dcStr === 'none' ? null : (parseInt(dcStr, 10) || null),
              pcName,
              isPC: isPlayerChar(pcName),
              advState,
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

  const effectiveD20 = () => {
    const res = currentResult();
    if (!res) return null;
    const roll = currentRoll();
    if (!roll) return null;
    if (roll.advState === 'normal') return res.d1;
    if (roll.advState === 'advantage') return Math.max(res.d1, res.d2);
    return Math.min(res.d1, res.d2);
  };

  const total = () => {
    const d = effectiveD20();
    return d !== null ? d + bonus() : null;
  };

  const modStr = () => { const m = bonus(); return m >= 0 ? `+${m}` : `${m}`; };

  function doRoll() {
    const roll = currentRoll();
    if (!roll) return;
    const d1 = Math.floor(Math.random() * 20) + 1;
    const d2 = Math.floor(Math.random() * 20) + 1;
    setRollResults(prev => ({ ...prev, [roll.id]: { d1, d2 } }));
  }

  function submitAll() {
    const rolls = allPendingRolls();
    const results = rollResults();
    const lines = [];

    for (const roll of rolls) {
      const res = results[roll.id];
      if (!res) continue;
      const p = findPC(roll.pcName);
      const mod = p ? getSkillBonus(p, roll.skill) : 0;
      let d20;
      if (roll.advState === 'advantage') d20 = Math.max(res.d1, res.d2);
      else if (roll.advState === 'disadvantage') d20 = Math.min(res.d1, res.d2);
      else d20 = res.d1;
      const t = d20 + mod;
      const ms = mod >= 0 ? `+${mod}` : `${mod}`;
      const dcPart = roll.dc ? ` — DC ${roll.dc}` : '';
      let advNote = '';
      if (roll.advState === 'advantage') advNote = ` [ADV: ${res.d1}, ${res.d2}]`;
      else if (roll.advState === 'disadvantage') advNote = ` [DIS: ${res.d1}, ${res.d2}]`;
      lines.push(`${roll.pcName} rolled ${t} for ${roll.skill} (d20: ${d20} ${ms})${dcPart}${advNote}`);
    }

    if (lines.length === 0) return;
    const msg = lines.join('\n');

    setRollResults({});
    setSubmitted(new Set());
    sendMsg(msg, { tab: 'narrative' });
  }

  function markSubmitted(rollId) {
    setSubmitted(prev => new Set([...prev, rollId]));
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
            <Show when={currentRoll()?.advState === 'advantage'}>
              <span class="roll-adv">ADV</span>
            </Show>
            <Show when={currentRoll()?.advState === 'disadvantage'}>
              <span class="roll-dis">DIS</span>
            </Show>
            <Show when={allPendingRolls().length > 1}>
              <span class="roll-progress">{progress()}</span>
            </Show>
          </div>
          <Show when={!hasRolled()}>
            <button class="btn-roll" onClick={doRoll}>
              {currentRoll()?.advState !== 'normal' ? 'Roll 2d20' : 'Roll d20'}
            </button>
          </Show>
          <Show when={hasRolled()}>
            <div class="roll-result-display">
              <Show when={currentRoll()?.advState !== 'normal'}>
                <span class="roll-both-dice">
                  <span class={effectiveD20() === currentResult()?.d1 ? 'die-used' : 'die-dropped'}>{currentResult()?.d1}</span>
                  <span class={effectiveD20() === currentResult()?.d2 ? 'die-used' : 'die-dropped'}>{currentResult()?.d2}</span>
                </span>
                <span class="roll-eq">&rarr;</span>
              </Show>
              <span class={`roll-d20 ${effectiveD20() === 20 ? 'nat-20' : ''} ${effectiveD20() === 1 ? 'nat-1' : ''}`}>
                {effectiveD20()}
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
                const res = () => rollResults()[roll.id];
                const p = () => findPC(roll.pcName);
                const mod = () => p() ? getSkillBonus(p(), roll.skill) : 0;
                const d20 = () => {
                  const r = res();
                  if (!r) return 0;
                  if (roll.advState === 'advantage') return Math.max(r.d1, r.d2);
                  if (roll.advState === 'disadvantage') return Math.min(r.d1, r.d2);
                  return r.d1;
                };
                const t = () => d20() + mod();
                return (
                  <div class="roll-summary-line">
                    <span class="roll-summary-name">{roll.pcName}</span>
                    <span class="roll-summary-skill">{roll.skill}</span>
                    <Show when={roll.advState !== 'normal'}>
                      <span class={roll.advState === 'advantage' ? 'roll-adv-sm' : 'roll-dis-sm'}>
                        {roll.advState === 'advantage' ? 'A' : 'D'}
                      </span>
                    </Show>
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
