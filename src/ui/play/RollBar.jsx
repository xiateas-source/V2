import { createSignal, createMemo, Show, For } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { sendMsg, isSending, resumeAfterRolls, getPreSendRolls, clearPreSendRolls } from '../../ai/engine.js';

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

  // Initiative — d20 + DEX modifier
  if (lower === 'initiative') {
    return getModifier(pc.abilityScores.dex);
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

// Resolves the ability score a skill/save check is keyed on.
function getRollAbility(skillName) {
  const lower = (skillName || '').toLowerCase().replace(/\s+/g, '');
  if (ABILITY_ABBREV[lower]) return ABILITY_ABBREV[lower];
  return SKILL_ABILITY[lower] || SKILL_ABILITY[(skillName || '').toLowerCase()] || null;
}

function isAttackRoll(skill) {
  const lower = (skill || '').toLowerCase().replace(/\s+/g, '');
  return lower === 'attackroll' || lower === 'attack';
}

// roll_request only ever carries a skill/ability name, never an explicit
// check-vs-save flag. By convention (how the AI is prompted and how the
// classifier emits checks), a bare ability name (e.g. "Dexterity") is a
// saving throw, while a named skill (e.g. "Acrobatics") or "Initiative" is
// an ability check. Used to keep condition effects from applying to the
// wrong roll type per SRD wording (e.g. Poisoned excludes saves).
function isSavingThrow(skill) {
  const lower = (skill || '').toLowerCase().replace(/\s+/g, '');
  if (isAttackRoll(skill) || lower === 'initiative') return false;
  return !!ABILITY_ABBREV[lower];
}

// Exhaustion (SRD 2024): every D20 Test takes a flat penalty of -2 per
// Exhaustion level — not disadvantage, and not tiered like the 2014 rules.
function exhaustionPenalty(pc) {
  const lvl = pc?.exhaustion || 0;
  return lvl > 0 ? -2 * lvl : 0;
}

const INCAPACITATING_CONDITIONS = ['paralyzed', 'stunned', 'unconscious', 'petrified'];

// Paralyzed/Stunned/Unconscious/Petrified force automatic failure on
// Strength and Dexterity saving throws (SRD). These conditions also impose
// Incapacitated, so the PC rarely gets to roll at all — but a forced save
// (e.g. against an AoE while paralyzed) still needs to fail outright rather
// than roll.
function autoFailInfo(foundPC, skill) {
  if (!foundPC?.conditions?.length || !isSavingThrow(skill)) return null;
  const ability = getRollAbility(skill);
  if (!['str', 'dex'].includes(ability)) return null;
  const names = new Set(foundPC.conditions.map(c => (typeof c === 'string' ? c : c.name || '').toLowerCase()));
  const cond = INCAPACITATING_CONDITIONS.find(c => names.has(c));
  return cond ? cond.charAt(0).toUpperCase() + cond.slice(1) : null;
}

// SRD condition effects that touch a PC's own d20 roll. Carrying capacity
// has no disadvantage tiers in the 2024 rules — just a hard cap (see Cargo)
// — so it isn't a roll modifier here.
function applyConditions(advState, foundPC, skill) {
  if (!foundPC?.conditions?.length) return advState;
  const names = new Set(foundPC.conditions.map(c => (typeof c === 'string' ? c : c.name || '').toLowerCase()));

  const isAttack = isAttackRoll(skill);
  const ability = getRollAbility(skill);
  const isSave = isSavingThrow(skill);

  // Poisoned/Frightened: disadvantage on ability checks and attack rolls — not saves.
  let disadvantaged = (names.has('poisoned') || names.has('frightened')) && !isSave;
  // Restrained: disadvantage on attack rolls; disadvantage on Dexterity saving throws.
  if (names.has('restrained') && (isAttack || (ability === 'dex' && isSave))) disadvantaged = true;
  // Prone/Blinded: disadvantage on the PC's own attack rolls.
  if ((names.has('prone') || names.has('blinded')) && isAttack) disadvantaged = true;
  // Incapacitated (or any condition that imposes it): disadvantage on Initiative.
  const incapacitated = ['incapacitated', ...INCAPACITATING_CONDITIONS].some(c => names.has(c));
  if (incapacitated && skill?.toLowerCase() === 'initiative') disadvantaged = true;

  // Invisible: advantage on the PC's own attack rolls.
  const advantaged = names.has('invisible') && isAttack;

  if (disadvantaged === advantaged) return advState;
  if (disadvantaged) return advState === 'advantage' ? 'normal' : 'disadvantage';
  return advState === 'disadvantage' ? 'normal' : 'advantage';
}

export default function RollBar() {
  const [rollResults, setRollResults] = createSignal({});
  const [submitted, setSubmitted] = createSignal(new Set());

  // Initiative rolls are derived straight from combatState (the PCs still
  // flagged rollPending), not from the message/mechanics path — combat_start
  // generates them as a side effect that never lands in a message's applied
  // mechanics. Sourcing them here is what actually starts the fight.
  const initiativeRolls = createMemo(() => {
    const cs = store.campaign.combatState;
    if (!cs.active) return [];
    return cs.initiative
      .filter(c => c.type === 'pc' && c.rollPending)
      .map(c => {
        const foundPC = findPC(c.name);
        const advState = applyConditions('normal', foundPC, 'Initiative');
        return {
          id: `init-${c.name}`, skill: 'Initiative', dc: null, pcName: c.name, isPC: true, advState,
          excPenalty: exhaustionPenalty(foundPC),
        };
      });
  });

  const allPendingRolls = createMemo(() => {
    const init = initiativeRolls();
    if (init.length) return init;

    // Pre-send rolls from the action classifier (Phase 1 of three-phase flow)
    const preSend = getPreSendRolls();
    if (preSend && preSend.rolls.length > 0) {
      return preSend.rolls.map((r, idx) => {
        const foundPC = findPC(r.pcName);
        const advState = applyConditions('normal', foundPC, r.skill);
        const autoFailReason = autoFailInfo(foundPC, r.skill);
        return {
          id: `pre-${idx}`,
          skill: r.skill,
          dc: r.dc,
          pcName: r.pcName,
          isPC: true,
          advState,
          excPenalty: exhaustionPenalty(foundPC),
          autoFail: !!autoFailReason,
          autoFailReason,
          preSend: true,
        };
      });
    }

    const msgs = store.campaign.narrative;
    if (!msgs.length) return [];

    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg.type === 'player' || msg.role === 'user') break;
      if ((msg.type === 'dm' || msg.role === 'assistant') && msg.mechanics) {
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
            const foundPC = findPC(pcName);
            advState = applyConditions(advState, foundPC, skill);
            const autoFailReason = autoFailInfo(foundPC, skill);
            return {
              id: `${i}-${idx}`,
              skill,
              dc: dcStr === 'none' ? null : (parseInt(dcStr, 10) || null),
              pcName,
              isPC: isPlayerChar(pcName),
              advState,
              excPenalty: exhaustionPenalty(foundPC),
              autoFail: !!autoFailReason,
              autoFailReason,
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
    return getSkillBonus(p, roll.skill) + (roll.excPenalty || 0);
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
    const roll = currentRoll();
    if (roll?.autoFail) return -1;
    const d = effectiveD20();
    return d !== null ? d + bonus() : null;
  };

  const modStr = () => { const m = bonus(); return m >= 0 ? `+${m}` : `${m}`; };

  function doRoll() {
    const roll = currentRoll();
    if (!roll) return;
    if (roll.autoFail) {
      setRollResults(prev => ({ ...prev, [roll.id]: { d1: 0, d2: 0 } }));
      return;
    }
    const d1 = Math.floor(Math.random() * 20) + 1;
    const d2 = Math.floor(Math.random() * 20) + 1;
    setRollResults(prev => ({ ...prev, [roll.id]: { d1, d2 } }));
  }

  function submitInitiative(rolls, results) {
    const combat = store.campaign.combatState;
    let initiative = combat.initiative.map(c => ({ ...c }));
    const order = [];

    for (const roll of rolls) {
      const res = results[roll.id];
      if (!res) continue;
      const p = findPC(roll.pcName);
      const mod = (p ? getSkillBonus(p, roll.skill) : 0) + (roll.excPenalty || 0);
      let d20;
      if (roll.advState === 'advantage') d20 = Math.max(res.d1, res.d2);
      else if (roll.advState === 'disadvantage') d20 = Math.min(res.d1, res.d2);
      else d20 = res.d1;
      const total = d20 + mod;
      const idx = initiative.findIndex(c => c.name.toLowerCase() === roll.pcName.toLowerCase());
      if (idx >= 0) initiative[idx] = { ...initiative[idx], roll: total, rollPending: false };
    }

    // Clear any leftover pending flags and sort the order (highest first).
    initiative = initiative.map(c => (c.rollPending ? { ...c, rollPending: false } : c));
    initiative.sort((a, b) => b.roll - a.roll);
    for (const c of initiative) order.push(`${c.name} ${c.roll}`);

    setStore('campaign', 'combatState', 'initiative', initiative);
    setStore('campaign', 'combatState', 'currentTurn', 0);

    setRollResults({});
    setSubmitted(new Set());

    // Kickoff: the AI sets the scene / resolves any enemies ahead of the first
    // PC, then the turn engine lands the pointer on that PC.
    sendMsg(`Initiative rolled — turn order: ${order.join(', ')}. Begin combat.`, {
      tab: 'narrative',
      combatKickoff: true,
    });
  }

  function submitAll() {
    const rolls = allPendingRolls();
    const results = rollResults();

    if (store.campaign.combatState.active && rolls.some(r => r.skill.toLowerCase() === 'initiative')) {
      submitInitiative(rolls, results);
      return;
    }

    const isPreSend = rolls.some(r => r.preSend);

    const rollData = [];
    const lines = [];

    for (const roll of rolls) {
      const res = results[roll.id];
      if (!res) continue;

      if (roll.autoFail) {
        lines.push(`${roll.pcName} automatically fails ${roll.skill} (${roll.autoFailReason} — no roll possible)`);
        rollData.push({ pcName: roll.pcName, skill: roll.skill, dc: roll.dc || 13, d20: 0, mod: 0, total: -1, autoFailReason: roll.autoFailReason });
        continue;
      }

      const p = findPC(roll.pcName);
      const mod = (p ? getSkillBonus(p, roll.skill) : 0) + (roll.excPenalty || 0);
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

      rollData.push({
        pcName: roll.pcName,
        skill: roll.skill,
        dc: roll.dc || 13,
        d20,
        mod,
        total: t,
      });
    }

    if (lines.length === 0) return;

    setRollResults({});
    setSubmitted(new Set());

    if (isPreSend) {
      resumeAfterRolls(rollData);
    } else {
      const msg = lines.join('\n');
      sendMsg(msg, { tab: 'narrative' });
    }
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

  const isPreSendRoll = () => allPendingRolls().some(r => r.preSend);

  function skipPreSendRoll() {
    const pending = getPreSendRolls();
    if (!pending) return;
    const originalMessage = pending.originalMessage;
    clearPreSendRolls();
    setRollResults({});
    setSubmitted(new Set());
    sendMsg(originalMessage, { tab: 'narrative', skipClassifier: true });
  }

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
            <Show when={currentRoll()?.autoFail}>
              <span class="roll-dis" title={currentRoll()?.autoFailReason}>AUTO-FAIL</span>
            </Show>
            <Show when={!currentRoll()?.autoFail && currentRoll()?.advState === 'advantage'}>
              <span class="roll-adv">ADV</span>
            </Show>
            <Show when={!currentRoll()?.autoFail && currentRoll()?.advState === 'disadvantage'}>
              <span class="roll-dis">DIS</span>
            </Show>
            <Show when={allPendingRolls().length > 1}>
              <span class="roll-progress">{progress()}</span>
            </Show>
          </div>
          <Show when={!hasRolled()}>
            <div class="roll-actions">
              <button class="btn-roll" onClick={doRoll}>
                {currentRoll()?.autoFail ? 'Acknowledge' : currentRoll()?.advState !== 'normal' ? 'Roll 2d20' : 'Roll d20'}
              </button>
              <Show when={isPreSendRoll()}>
                <button class="btn-roll btn-roll-skip" onClick={skipPreSendRoll}>Skip</button>
              </Show>
            </div>
          </Show>
          <Show when={hasRolled()}>
            <div class="roll-result-display">
              <Show when={currentRoll()?.autoFail} fallback={
                <>
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
                </>
              }>
                <span class="roll-total roll-fail">Automatic failure — {currentRoll()?.autoFailReason}</span>
              </Show>
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
                const mod = () => (p() ? getSkillBonus(p(), roll.skill) : 0) + (roll.excPenalty || 0);
                const d20 = () => {
                  const r = res();
                  if (!r) return 0;
                  if (roll.advState === 'advantage') return Math.max(r.d1, r.d2);
                  if (roll.advState === 'disadvantage') return Math.min(r.d1, r.d2);
                  return r.d1;
                };
                const t = () => roll.autoFail ? -1 : d20() + mod();
                return (
                  <div class="roll-summary-line">
                    <span class="roll-summary-name">{roll.pcName}</span>
                    <span class="roll-summary-skill">{roll.skill}</span>
                    <Show when={roll.autoFail}>
                      <span class="roll-dis-sm" title={roll.autoFailReason}>AUTO-FAIL</span>
                    </Show>
                    <Show when={!roll.autoFail && roll.advState !== 'normal'}>
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
