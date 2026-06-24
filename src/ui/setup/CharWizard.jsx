import { createSignal, createEffect, onMount, batch, Show, For } from 'solid-js';
import {
  AVAILABLE_CLASSES, AVAILABLE_RACES, CLASS_DATA, RACE_BONUSES, RACE_SPEED,
  BACKGROUNDS, CLASS_SKILL_CHOICES, ALL_SKILLS, ALIGNMENTS,
  STANDARD_ARRAY, STARTING_EQUIPMENT, getStartingGold, POINT_BUY_COSTS,
  getDefaultEquipment, getSelectedEquipment, rollPersonality,
  SKILL_DESC, SKILL_ABILITIES, AVATAR_EMOJI
} from '../../data/quickBuild.js';
import { forgeCharacter } from '../../data/forge.js';

const DRAFT_KEY = 'tp_wizard_draft';
const TIBF = [
  { key: 'trait', label: 'Personality Trait', rows: 2, placeholder: 'A distinctive habit, quirk, or attitude…' },
  { key: 'ideal', label: 'Ideal', rows: 2, placeholder: 'A principle they strive toward…' },
  { key: 'bond', label: 'Bond', rows: 2, placeholder: 'A person, place, or cause they hold dear…' },
  { key: 'flaw', label: 'Flaw', rows: 2, placeholder: 'A weakness, vice, or fear…' },
];
import { getByIndex, getSpellsForClass } from '../../data/local.js';
import { callProvider } from '../../ai/providers.js';
import { GENERATE_BIO_SYSTEM } from '../../ai/setupPrompts.js';

const STEP_IDS = ['class', 'background', 'abilities', 'skills', 'spells', 'equipment', 'bio'];
const STEP_LABELS = {
  class: 'Class & Race', background: 'Background', abilities: 'Abilities',
  skills: 'Skills', spells: 'Spells', equipment: 'Equipment', bio: 'Name & Bio'
};
const ABILITY_NAMES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_FULL = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

const CLASS_BLURBS = {
  Fighter: 'Tough, versatile martial warrior',
  Rogue: 'Stealthy, skillful striker',
  Bard: 'Charismatic magic and inspiration',
};
const RACE_BLURBS = {
  Human: '+1 all stats, versatile',
  Elf: '+2 DEX, +1 INT, darkvision',
  'Half-Elf': '+2 CHA, +1 DEX/CON, versatile',
  Dwarf: '+2 CON, +1 WIS, resilient',
  Halfling: '+2 DEX, +1 CHA, lucky',
  Tiefling: '+2 CHA, +1 INT, fire resist',
};

const FALLBACK_CANTRIPS = [
  'Vicious Mockery', 'Minor Illusion', 'Light', 'Mage Hand', 'Prestidigitation',
  'Mending', 'Dancing Lights', 'Friends', 'Message', 'Thunderclap', 'True Strike', 'Blade Ward'
];
const FALLBACK_SPELLS = {
  1: ['Healing Word', 'Thunderwave', 'Faerie Fire', 'Dissonant Whispers', 'Charm Person',
      'Sleep', 'Cure Wounds', 'Detect Magic', 'Heroism', 'Identify', "Tasha's Hideous Laughter",
      'Bane', 'Feather Fall', 'Speak with Animals'],
  2: ['Hold Person', 'Invisibility', 'Shatter', 'Suggestion', 'Heat Metal',
      'Lesser Restoration', 'Silence', 'Calm Emotions', 'Enhance Ability', 'Knock'],
  3: ['Hypnotic Pattern', 'Dispel Magic', 'Fear', 'Bestow Curse', 'Major Image', 'Sending'],
};

export default function CharWizard(props) {
  const [stepIdx, setStepIdx] = createSignal(0);

  // Step 1: Class & Race
  const [cls, setCls] = createSignal('');
  const [race, setRace] = createSignal('');
  const [level, setLevel] = createSignal(1);

  // Step 2: Background & Alignment
  const [bg, setBg] = createSignal('');
  const [align, setAlign] = createSignal('');

  // Step 3: Abilities
  const [abilityMethod, setAbilityMethod] = createSignal('standard');
  const [stdAssign, setStdAssign] = createSignal({});
  const [selectedVal, setSelectedVal] = createSignal(null);
  const [rolledScores, setRolledScores] = createSignal([]);
  const [rollAssign, setRollAssign] = createSignal({});
  const [selectedRollIdx, setSelectedRollIdx] = createSignal(null);
  const [pbScores, setPbScores] = createSignal({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
  // Manual entry (base, pre-racial). Primarily for edit re-entry round-tripping,
  // but also a genuine direct-entry method (D&D Beyond parity).
  const [manualScores, setManualScores] = createSignal({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });

  // Step 4: Skills
  const [skillPicks, setSkillPicks] = createSignal([]);

  // Step 5: Spells
  const [pickedCantrips, setPickedCantrips] = createSignal([]);
  const [pickedSpells, setPickedSpells] = createSignal([]);
  const [spellPool, setSpellPool] = createSignal({ cantrips: [], leveled: [] });
  const [spellsLoaded, setSpellsLoaded] = createSignal(false);

  // Step 6: Equipment
  const [equipMode, setEquipMode] = createSignal('default');
  const [equipChoices, setEquipChoices] = createSignal({});

  // Step 7: Name & Bio
  const [charName, setCharName] = createSignal('');
  const [appearance, setAppearance] = createSignal('');
  const [pTrait, setPTrait] = createSignal('');
  const [pIdeal, setPIdeal] = createSignal('');
  const [pBond, setPBond] = createSignal('');
  const [pFlaw, setPFlaw] = createSignal('');
  const [backstory, setBackstory] = createSignal('');
  const [avatar, setAvatar] = createSignal('');
  const [genField, setGenField] = createSignal('');
  const [building, setBuilding] = createSignal(false);

  // Tap-to-source: { title, sub, body } for the info sheet, or null.
  const [info, setInfo] = createSignal(null);

  const editing = () => !!props.editChar;

  const tibfSig = {
    trait: [pTrait, setPTrait], ideal: [pIdeal, setPIdeal],
    bond: [pBond, setPBond], flaw: [pFlaw, setPFlaw],
  };
  const traitsObj = () => ({ trait: pTrait(), ideal: pIdeal(), bond: pBond(), flaw: pFlaw() });
  function rollTibf(key) { tibfSig[key][1](rollPersonality(key)); }
  function rollAllTibf() { for (const k of Object.keys(tibfSig)) tibfSig[k][1](rollPersonality(k)); }

  // Reset downstream when class *changes* to a different class. Tracking the
  // previous value (rather than firing on every cls() read) keeps draft restore
  // from wiping skills/spells/equipment when it rehydrates the class.
  let prevCls = '';
  createEffect(() => {
    const c = cls();
    if (prevCls && prevCls !== c) {
      setSkillPicks([]);
      setPickedCantrips([]);
      setPickedSpells([]);
      setSpellsLoaded(false);
      setEquipMode('default');
      setEquipChoices({});
    }
    prevCls = c;
  });

  // --- Draft persistence (Law 3: partial attention, interruptible) ---
  function snapshot() {
    return {
      stepIdx: stepIdx(), cls: cls(), race: race(), level: level(),
      bg: bg(), align: align(), abilityMethod: abilityMethod(),
      stdAssign: stdAssign(), rolledScores: rolledScores(), rollAssign: rollAssign(),
      pbScores: pbScores(), manualScores: manualScores(), skillPicks: skillPicks(),
      pickedCantrips: pickedCantrips(), pickedSpells: pickedSpells(),
      equipMode: equipMode(), equipChoices: equipChoices(),
      charName: charName(), appearance: appearance(), avatar: avatar(),
      pTrait: pTrait(), pIdeal: pIdeal(), pBond: pBond(), pFlaw: pFlaw(),
      backstory: backstory(),
    };
  }

  function restore(d) {
    if (!d) return;
    setCls(d.cls || ''); setRace(d.race || ''); setLevel(d.level || 1);
    setBg(d.bg || ''); setAlign(d.align || '');
    setAbilityMethod(d.abilityMethod || 'standard');
    setStdAssign(d.stdAssign || {}); setRolledScores(d.rolledScores || []);
    setRollAssign(d.rollAssign || {});
    setPbScores(d.pbScores || { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
    setManualScores(d.manualScores || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    setSkillPicks(d.skillPicks || []);
    setPickedCantrips(d.pickedCantrips || []); setPickedSpells(d.pickedSpells || []);
    setSpellsLoaded(false);
    setEquipMode(d.equipMode || 'default'); setEquipChoices(d.equipChoices || {});
    setCharName(d.charName || ''); setAppearance(d.appearance || ''); setAvatar(d.avatar || '');
    setPTrait(d.pTrait || ''); setPIdeal(d.pIdeal || '');
    setPBond(d.pBond || ''); setPFlaw(d.pFlaw || '');
    setBackstory(d.backstory || '');
    setStepIdx(d.stepIdx || 0);
  }

  const [resumed, setResumed] = createSignal(false);
  // Unfinished draft awaiting a Resume / Start-fresh choice (null once resolved).
  const [pendingDraft, setPendingDraft] = createSignal(null);

  onMount(() => {
    if (editing()) { hydrateFromChar(props.editChar); return; }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && (d.cls || d.race || d.charName)) setPendingDraft(d);
      }
    } catch {}
  });

  function resumeDraft() {
    const d = pendingDraft();
    if (d) { restore(d); setResumed(true); }
    setPendingDraft(null);
  }
  function freshStart() {
    clearDraft();
    setPendingDraft(null);
  }

  // Hydrate every signal from an existing committed character (edit re-entry).
  // Abilities round-trip losslessly via the manual method (base = final − racial).
  function hydrateFromChar(char) {
    batch(() => {
      setCls(char.class || ''); setRace(char.race || ''); setLevel(char.level || 1);
      setBg(char.background || ''); setAlign(char.alignment || '');

      const racial = RACE_BONUSES[char.race] || {};
      const base = {};
      for (const ab of ABILITY_NAMES) base[ab] = (char.abilityScores?.[ab] ?? 10) - (racial[ab] || 0);
      setManualScores(base);
      setAbilityMethod('manual');

      const bgEntry = BACKGROUNDS.find(b => b.name === char.background);
      const bgKeys = new Set((bgEntry?.skillProfs || []).map(s => s.toLowerCase().replace(/\s+/g, '')));
      const picks = [];
      for (const [key, on] of Object.entries(char.skills || {})) {
        if (!on || bgKeys.has(key)) continue;
        const display = ALL_SKILLS.find(s => s.toLowerCase().replace(/\s+/g, '') === key);
        if (display) picks.push(display);
      }
      setSkillPicks(picks);

      setPickedCantrips([...(char.cantrips || [])]);
      setPickedSpells([...(char.knownSpells || [])]);
      setSpellsLoaded(false);

      setCharName(char.name || ''); setAppearance(char.appearance || ''); setAvatar(char.avatar || '');
      const t = char.traits || {};
      setPTrait(t.trait || ''); setPIdeal(t.ideal || '');
      setPBond(t.bond || ''); setPFlaw(t.flaw || '');
      setBackstory(char.backstory || '');
      setStepIdx(0);
    });
  }

  // Persist on any change. Never while editing an existing character (would
  // clobber an in-progress new-character draft) or before a pending draft is
  // resolved. snapshot() is read first so the effect still tracks every field.
  createEffect(() => {
    const data = snapshot();
    if (editing() || pendingDraft()) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch {}
  });

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }

  function startOver() {
    clearDraft();
    setStepIdx(0); setCls(''); setRace(''); setLevel(1);
    setBg(''); setAlign(''); setAbilityMethod('standard');
    setStdAssign({}); setRolledScores([]); setRollAssign({});
    setPbScores({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
    setManualScores({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    setSkillPicks([]); setPickedCantrips([]); setPickedSpells([]); setSpellsLoaded(false);
    setEquipMode('default'); setEquipChoices({});
    setCharName(''); setAppearance(''); setAvatar(''); setBackstory('');
    setPTrait(''); setPIdeal(''); setPBond(''); setPFlaw('');
    setResumed(false);
  }

  // Derived
  const classData = () => CLASS_DATA[cls()] || null;
  const isCaster = () => !!(classData()?.cantrips);
  const activeSteps = () => {
    let steps = isCaster() ? STEP_IDS : STEP_IDS.filter(s => s !== 'spells');
    // Editing an existing PC skips equipment — starting gear is already in the
    // pack and is managed in Cargo, so we never re-issue it (no duplicates).
    if (editing()) steps = steps.filter(s => s !== 'equipment');
    return steps;
  };
  const currentStep = () => activeSteps()[stepIdx()] || 'class';
  const totalSteps = () => activeSteps().length;

  // Clamp step index if steps change (e.g. caster → non-caster)
  createEffect(() => {
    if (stepIdx() >= totalSteps()) setStepIdx(Math.max(0, totalSteps() - 1));
  });

  const mod = (score) => Math.floor((score - 10) / 2);
  const fmtMod = (m) => m >= 0 ? `+${m}` : `${m}`;

  const baseAbilities = () => {
    const m = abilityMethod();
    if (m === 'standard') {
      const a = stdAssign();
      const r = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      for (const [k, v] of Object.entries(a)) r[k] = v;
      return r;
    }
    if (m === 'roll') {
      const a = rollAssign();
      const r = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      for (const [k, v] of Object.entries(a)) r[k] = v;
      return r;
    }
    if (m === 'manual') return { ...manualScores() };
    return { ...pbScores() };
  };

  function manualAdjust(ability, delta) {
    const cur = manualScores()[ability];
    const nv = Math.max(1, Math.min(30, cur + delta));
    setManualScores({ ...manualScores(), [ability]: nv });
  }

  const finalAbilities = () => {
    const base = baseAbilities();
    const bonuses = RACE_BONUSES[race()] || {};
    const result = { ...base };
    for (const [k, v] of Object.entries(bonuses)) {
      if (k in result) result[k] += v;
    }
    return result;
  };

  const conMod = () => mod(finalAbilities().con);
  const dexMod = () => mod(finalAbilities().dex);
  const profBonus = () => Math.floor((level() - 1) / 4) + 2;

  const hpMax = () => {
    const cd = classData();
    if (!cd) return 0;
    const max = parseInt(cd.hitDie.slice(1));
    const avg = Math.floor(max / 2) + 1;
    return max + conMod() + (avg + conMod()) * (level() - 1);
  };

  const calcAC = () => {
    if (!cls()) return 10;
    if (cls() === 'Fighter') return 16;
    return 11 + dexMod();
  };

  const bgData = () => BACKGROUNDS.find(b => b.name === bg());
  const bgSkills = () => bgData()?.skillProfs || [];

  // --- Standard Array ---
  // PHB Quick Build: assign the standard array in the class's recommended
  // ability priority order.
  function recommendStandard() {
    const priority = classData()?.primaryAbilities || ['str', 'con', 'dex', 'wis', 'int', 'cha'];
    const pool = [...STANDARD_ARRAY];
    const assign = {};
    priority.forEach((ab, i) => { if (i < pool.length) assign[ab] = pool[i]; });
    setStdAssign(assign);
    setSelectedVal(null);
  }

  const unassignedStd = () => {
    const assigned = Object.values(stdAssign());
    const pool = [...STANDARD_ARRAY];
    for (const v of assigned) {
      const idx = pool.indexOf(v);
      if (idx !== -1) pool.splice(idx, 1);
    }
    return pool;
  };

  function tapStdValue(val) {
    setSelectedVal(selectedVal() === val ? null : val);
  }

  function tapStdAbility(ability) {
    const current = { ...stdAssign() };
    if (selectedVal() !== null) {
      if (current[ability] !== undefined) {
        // Return old value to pool (will happen automatically via unassignedStd)
      }
      current[ability] = selectedVal();
      setStdAssign(current);
      setSelectedVal(null);
    } else if (current[ability] !== undefined) {
      delete current[ability];
      setStdAssign(current);
    }
  }

  // --- 4d6 Roll ---
  function roll4d6() {
    const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    dice.sort((a, b) => b - a);
    return dice.slice(0, 3).reduce((a, b) => a + b, 0);
  }

  function rollAll() {
    setRolledScores(Array.from({ length: 6 }, roll4d6));
    setRollAssign({});
    setSelectedRollIdx(null);
  }

  const unassignedRollIndices = () => {
    const used = new Set(Object.values(rollAssign()));
    return rolledScores().map((_, i) => i).filter(i => !used.has(i));
  };

  function tapRollIdx(idx) {
    setSelectedRollIdx(selectedRollIdx() === idx ? null : idx);
  }

  function tapRollAbility(ability) {
    const current = { ...rollAssign() };
    if (selectedRollIdx() !== null) {
      current[ability] = selectedRollIdx();
      setRollAssign(current);
      setSelectedRollIdx(null);
    } else if (current[ability] !== undefined) {
      delete current[ability];
      setRollAssign(current);
    }
  }

  const rollAbilityValue = (ability) => {
    const idx = rollAssign()[ability];
    return idx !== undefined ? rolledScores()[idx] : null;
  };

  // --- Point Buy ---
  const pbSpent = () => {
    let t = 0;
    for (const v of Object.values(pbScores())) t += POINT_BUY_COSTS[v] || 0;
    return t;
  };
  const pbRemaining = () => 27 - pbSpent();

  function pbAdjust(ability, delta) {
    const cur = pbScores()[ability];
    const nv = cur + delta;
    if (nv < 8 || nv > 15) return;
    const test = { ...pbScores(), [ability]: nv };
    let t = 0;
    for (const v of Object.values(test)) t += POINT_BUY_COSTS[v] || 0;
    if (t > 27) return;
    setPbScores(test);
  }

  // --- Skills ---
  function toggleSkill(skill) {
    const current = skillPicks();
    const choices = CLASS_SKILL_CHOICES[cls()];
    if (!choices) return;
    if (current.includes(skill)) {
      setSkillPicks(current.filter(s => s !== skill));
    } else if (current.length < choices.count) {
      setSkillPicks([...current, skill]);
    }
  }

  const skillChoiceData = () => CLASS_SKILL_CHOICES[cls()] || { count: 0, from: [] };
  const availableSkills = () => {
    const sc = skillChoiceData();
    const locked = new Set(bgSkills());
    const pool = sc.from || ALL_SKILLS;
    return pool.filter(s => !locked.has(s));
  };

  // --- Spells ---
  async function loadSpells() {
    if (spellsLoaded()) return;
    const cd = classData();
    if (!cd) return;
    const slots = cd.slotTable?.[level()] || {};
    const maxLv = Math.max(0, ...Object.keys(slots).map(Number));
    try {
      const all = await getSpellsForClass(cls());
      const cantrips = all.filter(s => s.level === 0).map(s => ({ name: s.name, desc: s.description || '' }));
      const leveled = all.filter(s => s.level > 0 && s.level <= maxLv)
        .map(s => ({ name: s.name, level: s.level, desc: s.description || '' }));
      setSpellPool({
        cantrips: cantrips.length > 0 ? cantrips : FALLBACK_CANTRIPS.map(n => ({ name: n, desc: '' })),
        leveled: leveled.length > 0 ? leveled : getFallbackLeveled(maxLv),
      });
    } catch {
      setSpellPool({ cantrips: FALLBACK_CANTRIPS.map(n => ({ name: n, desc: '' })), leveled: getFallbackLeveled(maxLv) });
    }
    setSpellsLoaded(true);
  }

  function getFallbackLeveled(maxLv) {
    const result = [];
    for (let lv = 1; lv <= maxLv; lv++) {
      for (const name of (FALLBACK_SPELLS[lv] || [])) result.push({ name, level: lv, desc: '' });
    }
    return result;
  }

  // Tap-to-source helpers.
  function showSpellInfo(s) {
    setInfo({
      title: s.name,
      sub: s.level ? `Level ${s.level} spell` : 'Cantrip',
      body: s.desc || s.description || 'No description available — this spell is a placeholder until the compendium is loaded.',
    });
  }
  function showSkillInfo(skill) {
    const ab = SKILL_ABILITIES[skill];
    setInfo({
      title: skill,
      sub: ab ? `${ABILITY_FULL[ab]} (${ab.toUpperCase()})` : '',
      body: SKILL_DESC[skill] || '',
    });
  }

  function toggleCantrip(name) {
    const cur = pickedCantrips();
    const max = classData()?.cantripsKnown?.[level() - 1] || 2;
    if (cur.includes(name)) setPickedCantrips(cur.filter(s => s !== name));
    else if (cur.length < max) setPickedCantrips([...cur, name]);
  }

  function toggleSpell(name) {
    const cur = pickedSpells();
    const max = classData()?.spellsKnown?.[level() - 1] || 4;
    if (cur.includes(name)) setPickedSpells(cur.filter(s => s !== name));
    else if (cur.length < max) setPickedSpells([...cur, name]);
  }

  // --- Generate Bio ---
  async function generateBioField(field) {
    setGenField(field);
    try {
      const prompt = `Race: ${race()}, Class: ${cls()}, Background: ${bg()}, Alignment: ${align()}. Generate ${field}.`;
      let result = '';
      for await (const chunk of callProvider([{ role: 'user', content: prompt }], GENERATE_BIO_SYSTEM)) {
        result += chunk;
      }
      const text = result.trim();
      if (field === 'appearance') setAppearance(text);
      else if (field === 'backstory') setBackstory(text);
    } catch {}
    setGenField('');
  }

  // --- Navigation ---
  function next() {
    if (currentStep() === 'skills' && isCaster() && !spellsLoaded()) loadSpells();
    if (stepIdx() < totalSteps() - 1) setStepIdx(stepIdx() + 1);
  }
  function back() {
    if (stepIdx() > 0) setStepIdx(stepIdx() - 1);
  }

  const canAdvance = () => {
    const s = currentStep();
    if (s === 'class') return !!(cls() && race());
    if (s === 'background') return !!(bg() && align());
    if (s === 'abilities') {
      const m = abilityMethod();
      if (m === 'standard') return Object.keys(stdAssign()).length === 6;
      if (m === 'roll') return rolledScores().length === 6 && Object.keys(rollAssign()).length === 6;
      return true; // point buy + manual always have a full set of scores
    }
    if (s === 'skills') {
      const c = CLASS_SKILL_CHOICES[cls()];
      return !c || skillPicks().length === c.count;
    }
    if (s === 'spells') {
      if (!isCaster()) return true;
      const cd = classData();
      return pickedCantrips().length === (cd?.cantripsKnown?.[level() - 1] || 2) &&
             pickedSpells().length === (cd?.spellsKnown?.[level() - 1] || 4);
    }
    if (s === 'equipment') return true;
    if (s === 'bio') return charName().trim().length > 0;
    return true;
  };

  // --- Build Final Character ---
  // The wizard collects intent; the Forge derives all mechanical fields.
  async function buildAndCommit() {
    const cd = classData();
    if (!cd || building()) return;
    setBuilding(true);

    try {
      const skills = {};
      for (const s of bgSkills()) skills[s.toLowerCase().replace(/\s+/g, '')] = true;
      for (const s of skillPicks()) skills[s.toLowerCase().replace(/\s+/g, '')] = true;

      const character = await forgeCharacter({
        name: charName().trim(),
        race: race(), className: cls(), level: level(),
        abilityScores: finalAbilities(),
        background: bg(), alignment: align(),
        skills,
        cantrips: isCaster() ? pickedCantrips() : [],
        knownSpells: isCaster() ? pickedSpells() : [],
        appearance: appearance(), traits: traitsObj(), backstory: backstory(),
        avatar: avatar(),
        id: props.editChar?.id,
        color: props.editChar?.color,
        existingCount: props.existingCount || 0,
      });

      // Edit re-entry: update in place, preserving play-state the Forge resets
      // (current HP/conditions/XP/slots/familiar). Equipment is untouched.
      if (editing()) {
        const prev = props.editChar;
        const currentSlots = {};
        for (const [lv, max] of Object.entries(character.spellSlots || {})) {
          const prevCur = prev.currentSlots?.[lv];
          currentSlots[lv] = prevCur === undefined ? max : Math.min(prevCur, max);
        }
        props.onSaveEdit({
          ...character,
          hp: Math.min(prev.hp ?? character.hpMax, character.hpMax),
          hpTemp: prev.hpTemp || 0,
          xp: prev.xp || character.xp,
          conditions: prev.conditions || [],
          concentration: prev.concentration ?? null,
          exhaustion: prev.exhaustion || 0,
          inspiration: prev.inspiration || false,
          deathSaves: prev.deathSaves || character.deathSaves,
          familiar: prev.familiar ?? null,
          notes: prev.notes || character.notes,
          currentSlots,
        });
        return;
      }

      const eqMode = equipMode();
      const eqData = STARTING_EQUIPMENT[cls()];
      const goldAmount = eqMode === 'gold'
        ? (eqData?.goldOption || getStartingGold(level()))
        : getStartingGold(level());
      const items = eqMode === 'gold' ? [] :
        eqMode === 'customize' ? getSelectedEquipment(cls(), equipChoices()) :
        getDefaultEquipment(cls());

      clearDraft();
      props.onComplete(character, goldAmount, items, eqMode === 'gold');
    } finally {
      setBuilding(false);
    }
  }

  // ===================== RENDER =====================

  return (
    <div class="char-wizard">
      {/* Top bar: back + progress */}
      <div class="wiz-top">
        <button class="builder-back" onClick={props.onBack}>&larr;</button>
        <div class="wiz-progress">
          <For each={activeSteps()}>
            {(id, i) => (
              <div class={`wiz-dot ${i() < stepIdx() ? 'done' : ''} ${i() === stepIdx() ? 'current' : ''}`} />
            )}
          </For>
        </div>
        <span class="wiz-step-label">{editing() ? 'Editing' : STEP_LABELS[currentStep()]}</span>
        <Show when={editing()} fallback={<button class="wiz-startover" onClick={startOver}>Start over</button>}>
          <button class="wiz-startover" onClick={props.onBack}>Cancel</button>
        </Show>
      </div>
      <Show when={resumed() && !editing()}>
        <div class="wiz-resumed">↩ Resumed your in-progress character</div>
      </Show>
      <Show when={editing()}>
        <div class="wiz-resumed">✏ Editing {charName() || 'this character'} — changes save in place, gear &amp; HP kept</div>
      </Show>

      {/* Draft safety: resume the unfinished build or start fresh */}
      <Show when={pendingDraft()}>
        <div class="wiz-draft-gate">
          <div class="wiz-draft-title">Unfinished character found</div>
          <div class="wiz-draft-sub">
            {[pendingDraft()?.race, pendingDraft()?.cls].filter(Boolean).join(' ') || 'A draft'}
            {pendingDraft()?.charName ? ` — ${pendingDraft().charName}` : ''}
          </div>
          <div class="wiz-draft-actions">
            <button class="wiz-draft-resume" onClick={resumeDraft}>Resume</button>
            <button class="wiz-draft-fresh" onClick={freshStart}>Start fresh</button>
          </div>
        </div>
      </Show>

      <Show when={!pendingDraft()}>
      {/* Live stat preview */}
      <Show when={cls() && race()}>
        <div class="wiz-stats">
          <span class="wiz-stat">HP {hpMax()}</span>
          <span class="wiz-stat">AC {calcAC()}</span>
          <span class="wiz-stat">+{profBonus()} prof</span>
          <span class="wiz-stat">{RACE_SPEED[race()] || 30} ft</span>
        </div>
      </Show>

      {/* Step content */}
      <div class="wiz-content">

        {/* STEP: Class & Race */}
        <Show when={currentStep() === 'class'}>
          <div class="wiz-section">
            <label class="wiz-label">Class</label>
            <div class="wiz-cards">
              <For each={AVAILABLE_CLASSES}>
                {(c) => (
                  <button class={`wiz-card ${cls() === c ? 'active' : ''}`} onClick={() => setCls(c)}>
                    <span class="wiz-card-name">{c}</span>
                    <span class="wiz-card-desc">{CLASS_BLURBS[c] || CLASS_DATA[c]?.hitDie}</span>
                  </button>
                )}
              </For>
            </div>
          </div>
          <div class="wiz-section">
            <label class="wiz-label">Race</label>
            <div class="wiz-cards">
              <For each={AVAILABLE_RACES}>
                {(r) => (
                  <button class={`wiz-card ${race() === r ? 'active' : ''}`} onClick={() => setRace(r)}>
                    <span class="wiz-card-name">{r}</span>
                    <span class="wiz-card-desc">{RACE_BLURBS[r] || ''}</span>
                  </button>
                )}
              </For>
            </div>
          </div>
          <div class="wiz-section">
            <label class="wiz-label">Level {level()}</label>
            <div class="wiz-level-row">
              <button class="wiz-level-btn" onClick={() => setLevel(Math.max(1, level() - 1))}>-</button>
              <span class="wiz-level-val">{level()}</span>
              <button class="wiz-level-btn" onClick={() => setLevel(Math.min(10, level() + 1))}>+</button>
            </div>
          </div>
        </Show>

        {/* STEP: Background & Alignment */}
        <Show when={currentStep() === 'background'}>
          <div class="wiz-section">
            <label class="wiz-label">Background</label>
            <div class="wiz-bg-list">
              <For each={BACKGROUNDS}>
                {(b) => (
                  <button class={`wiz-bg-card ${bg() === b.name ? 'active' : ''}`} onClick={() => setBg(b.name)}>
                    <span class="wiz-bg-name">{b.name}</span>
                    <span class="wiz-bg-desc">{b.desc}</span>
                    <span class="wiz-bg-profs">Skills: {b.skillProfs.join(', ')}</span>
                    <Show when={b.toolProfs}>
                      <span class="wiz-bg-profs">Tools: {b.toolProfs.join(', ')}</span>
                    </Show>
                    <span class="wiz-bg-feature">{b.feature}</span>
                  </button>
                )}
              </For>
            </div>
          </div>
          <div class="wiz-section">
            <label class="wiz-label">Alignment</label>
            <div class="wiz-align-grid">
              <For each={ALIGNMENTS}>
                {(a) => (
                  <button class={`wiz-align-chip ${align() === a ? 'active' : ''}`} onClick={() => setAlign(a)}>
                    {a}
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* STEP: Abilities */}
        <Show when={currentStep() === 'abilities'}>
          <div class="wiz-section">
            <label class="wiz-label">Method</label>
            <div class="wiz-method-bar">
              <button class={`wiz-method ${abilityMethod() === 'standard' ? 'active' : ''}`}
                onClick={() => setAbilityMethod('standard')}>Standard Array</button>
              <button class={`wiz-method ${abilityMethod() === 'roll' ? 'active' : ''}`}
                onClick={() => setAbilityMethod('roll')}>Roll 4d6</button>
              <button class={`wiz-method ${abilityMethod() === 'pointbuy' ? 'active' : ''}`}
                onClick={() => setAbilityMethod('pointbuy')}>Point Buy</button>
              <button class={`wiz-method ${abilityMethod() === 'manual' ? 'active' : ''}`}
                onClick={() => setAbilityMethod('manual')}>Manual</button>
            </div>
          </div>

          {/* Standard Array */}
          <Show when={abilityMethod() === 'standard'}>
            <div class="wiz-section">
              <div class="wiz-bio-header">
                <label class="wiz-label">Tap a score, then tap an ability to assign</label>
                <button class="wiz-gen-btn" onClick={recommendStandard}>Recommended</button>
              </div>
              <div class="wiz-score-pool">
                <For each={unassignedStd()}>
                  {(val) => (
                    <button class={`wiz-score-chip ${selectedVal() === val ? 'selected' : ''}`}
                      onClick={() => tapStdValue(val)}>{val}</button>
                  )}
                </For>
              </div>
              <div class="wiz-ability-grid">
                <For each={ABILITY_NAMES}>
                  {(ab) => {
                    const assigned = () => stdAssign()[ab];
                    const bonus = () => (RACE_BONUSES[race()] || {})[ab] || 0;
                    const total = () => (assigned() || 10) + bonus();
                    return (
                      <button class={`wiz-ability-slot ${assigned() !== undefined ? 'filled' : ''}`}
                        onClick={() => tapStdAbility(ab)}>
                        <span class="wiz-ab-label">{ab.toUpperCase()}</span>
                        <span class="wiz-ab-score">{assigned() !== undefined ? assigned() : '—'}</span>
                        <Show when={bonus()}>
                          <span class="wiz-ab-bonus">+{bonus()}</span>
                        </Show>
                        <span class="wiz-ab-total">{assigned() !== undefined ? `${total()} (${fmtMod(mod(total()))})` : ''}</span>
                      </button>
                    );
                  }}
                </For>
              </div>
            </div>
          </Show>

          {/* Roll 4d6 */}
          <Show when={abilityMethod() === 'roll'}>
            <div class="wiz-section">
              <button class="wiz-roll-btn" onClick={rollAll}>
                {rolledScores().length ? 'Re-Roll All' : 'Roll 4d6 Drop Lowest'}
              </button>
              <Show when={rolledScores().length > 0}>
                <label class="wiz-label">Tap a roll, then tap an ability to assign</label>
                <div class="wiz-score-pool">
                  <For each={unassignedRollIndices()}>
                    {(idx) => (
                      <button class={`wiz-score-chip ${selectedRollIdx() === idx ? 'selected' : ''}`}
                        onClick={() => tapRollIdx(idx)}>{rolledScores()[idx]}</button>
                    )}
                  </For>
                </div>
                <div class="wiz-ability-grid">
                  <For each={ABILITY_NAMES}>
                    {(ab) => {
                      const val = () => rollAbilityValue(ab);
                      const bonus = () => (RACE_BONUSES[race()] || {})[ab] || 0;
                      const total = () => (val() || 10) + bonus();
                      return (
                        <button class={`wiz-ability-slot ${val() !== null ? 'filled' : ''}`}
                          onClick={() => tapRollAbility(ab)}>
                          <span class="wiz-ab-label">{ab.toUpperCase()}</span>
                          <span class="wiz-ab-score">{val() !== null ? val() : '—'}</span>
                          <Show when={bonus()}>
                            <span class="wiz-ab-bonus">+{bonus()}</span>
                          </Show>
                          <span class="wiz-ab-total">{val() !== null ? `${total()} (${fmtMod(mod(total()))})` : ''}</span>
                        </button>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </div>
          </Show>

          {/* Point Buy */}
          <Show when={abilityMethod() === 'pointbuy'}>
            <div class="wiz-section">
              <div class="wiz-pb-budget">
                Points: <b>{pbRemaining()}</b> / 27
              </div>
              <div class="wiz-pb-grid">
                <For each={ABILITY_NAMES}>
                  {(ab) => {
                    const score = () => pbScores()[ab];
                    const bonus = () => (RACE_BONUSES[race()] || {})[ab] || 0;
                    const total = () => score() + bonus();
                    const cost = () => POINT_BUY_COSTS[score()] || 0;
                    return (
                      <div class="wiz-pb-row">
                        <span class="wiz-pb-label">{ab.toUpperCase()}</span>
                        <button class="wiz-pb-btn" onClick={() => pbAdjust(ab, -1)}
                          disabled={score() <= 8}>-</button>
                        <span class="wiz-pb-score">{score()}</span>
                        <button class="wiz-pb-btn" onClick={() => pbAdjust(ab, 1)}
                          disabled={score() >= 15 || pbRemaining() <= 0}>+</button>
                        <Show when={bonus()}>
                          <span class="wiz-ab-bonus">+{bonus()}</span>
                        </Show>
                        <span class="wiz-pb-total">{total()} ({fmtMod(mod(total()))})</span>
                        <span class="wiz-pb-cost">{cost()}pt</span>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          </Show>

          {/* Manual entry (direct base scores; used for edit round-trip) */}
          <Show when={abilityMethod() === 'manual'}>
            <div class="wiz-section">
              <label class="wiz-label">Set each score directly (base, before racial bonus)</label>
              <div class="wiz-pb-grid">
                <For each={ABILITY_NAMES}>
                  {(ab) => {
                    const score = () => manualScores()[ab];
                    const bonus = () => (RACE_BONUSES[race()] || {})[ab] || 0;
                    const total = () => score() + bonus();
                    return (
                      <div class="wiz-pb-row">
                        <span class="wiz-pb-label">{ab.toUpperCase()}</span>
                        <button class="wiz-pb-btn" onClick={() => manualAdjust(ab, -1)}
                          disabled={score() <= 1}>-</button>
                        <span class="wiz-pb-score">{score()}</span>
                        <button class="wiz-pb-btn" onClick={() => manualAdjust(ab, 1)}
                          disabled={score() >= 30}>+</button>
                        <Show when={bonus()}>
                          <span class="wiz-ab-bonus">+{bonus()}</span>
                        </Show>
                        <span class="wiz-pb-total">{total()} ({fmtMod(mod(total()))})</span>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          </Show>

          {/* Race bonuses summary */}
          <Show when={race()}>
            <div class="wiz-race-bonus-note">
              {race()} bonuses: {Object.entries(RACE_BONUSES[race()] || {}).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(', ')}
            </div>
          </Show>
        </Show>

        {/* STEP: Skills */}
        <Show when={currentStep() === 'skills'}>
          <div class="wiz-section">
            <Show when={bgSkills().length > 0}>
              <label class="wiz-label">Background Skills (locked)</label>
              <div class="wiz-skill-chips">
                <For each={bgSkills()}>
                  {(s) => (
                    <span class="wiz-skill-chip locked">
                      <span class="wiz-chip-text">{s}</span>
                      <span class="wiz-chip-info" onClick={() => showSkillInfo(s)}>ⓘ</span>
                    </span>
                  )}
                </For>
              </div>
            </Show>
            <label class="wiz-label">
              Choose {skillChoiceData().count} class skill{skillChoiceData().count > 1 ? 's' : ''}
              <span class="wiz-pick-count"> ({skillPicks().length}/{skillChoiceData().count})</span>
            </label>
            <div class="wiz-skill-chips">
              <For each={availableSkills()}>
                {(s) => (
                  <button class={`wiz-skill-chip ${skillPicks().includes(s) ? 'active' : ''}`}
                    onClick={() => toggleSkill(s)}>
                    <span class="wiz-chip-text">{s}</span>
                    <span class="wiz-chip-info" onClick={(e) => { e.stopPropagation(); showSkillInfo(s); }}>ⓘ</span>
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* STEP: Spells */}
        <Show when={currentStep() === 'spells'}>
          <div class="wiz-section">
            <label class="wiz-label">
              Cantrips ({pickedCantrips().length}/{classData()?.cantripsKnown?.[level() - 1] || 2})
            </label>
            <div class="wiz-spell-chips">
              <For each={spellPool().cantrips}>
                {(s) => (
                  <button class={`wiz-spell-chip ${pickedCantrips().includes(s.name) ? 'active' : ''}`}
                    onClick={() => toggleCantrip(s.name)}>
                    <span class="wiz-chip-text">{s.name}</span>
                    <span class="wiz-chip-info" onClick={(e) => { e.stopPropagation(); showSpellInfo(s); }}>ⓘ</span>
                  </button>
                )}
              </For>
            </div>
          </div>
          <div class="wiz-section">
            <label class="wiz-label">
              Spells Known ({pickedSpells().length}/{classData()?.spellsKnown?.[level() - 1] || 4})
            </label>
            <div class="wiz-spell-chips">
              <For each={spellPool().leveled}>
                {(s) => (
                  <button class={`wiz-spell-chip ${pickedSpells().includes(s.name) ? 'active' : ''}`}
                    onClick={() => toggleSpell(s.name)}>
                    <span class="wiz-chip-text">{s.name}</span>
                    <span class="wiz-spell-lv">Lv{s.level}</span>
                    <span class="wiz-chip-info" onClick={(e) => { e.stopPropagation(); showSpellInfo(s); }}>ⓘ</span>
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* STEP: Equipment */}
        <Show when={currentStep() === 'equipment'}>
          <Show when={STARTING_EQUIPMENT[cls()]} fallback={
            <div class="wiz-section"><p class="wiz-muted">No equipment data for {cls()}</p></div>
          }>
            {(eqData) => {
              const goldOpt = () => eqData().goldOption || getStartingGold(level());
              const defaultItems = () => getDefaultEquipment(cls());
              const customItems = () => getSelectedEquipment(cls(), equipChoices());
              return (
                <div class="wiz-section">
                  <label class="wiz-label">Starting Equipment</label>
                  <div class="equip-mode-bar">
                    <button class={`equip-mode-chip ${equipMode() === 'default' ? 'active' : ''}`}
                      onClick={() => setEquipMode('default')}>Default Pack</button>
                    <button class={`equip-mode-chip ${equipMode() === 'customize' ? 'active' : ''}`}
                      onClick={() => setEquipMode('customize')}>Customize</button>
                    <button class={`equip-mode-chip ${equipMode() === 'gold' ? 'active' : ''}`}
                      onClick={() => setEquipMode('gold')}>Take {goldOpt()} GP</button>
                  </div>

                  <Show when={equipMode() === 'default'}>
                    <div class="equip-default-list">
                      <For each={defaultItems()}>
                        {(item) => <span class="equip-item-tag">{item.qty > 1 ? `${item.qty}x ` : ''}{item.name}</span>}
                      </For>
                    </div>
                  </Show>

                  <Show when={equipMode() === 'customize'}>
                    <Show when={eqData().always?.length > 0}>
                      <div class="equip-always">
                        <For each={eqData().always}>
                          {(item) => <span class="equip-item-tag">{item.qty > 1 ? `${item.qty}x ` : ''}{item.name}</span>}
                        </For>
                      </div>
                    </Show>
                    <For each={eqData().choices || []}>
                      {(group, gi) => (
                        <div class="equip-choice-group">
                          <span class="equip-choice-label">{group.label}</span>
                          <div class="equip-choice-options">
                            <For each={group.options}>
                              {(opt, oi) => (
                                <button class={`equip-chip ${(equipChoices()[gi()] ?? 0) === oi() ? 'active' : ''}`}
                                  onClick={() => setEquipChoices(p => ({ ...p, [gi()]: oi() }))}>
                                  {opt.label}
                                </button>
                              )}
                            </For>
                          </div>
                        </div>
                      )}
                    </For>
                  </Show>

                  <Show when={equipMode() === 'gold'}>
                    <div class="equip-gold-msg">Start with {goldOpt()} GP — buy equipment during play</div>
                  </Show>

                  <div class="equip-summary">
                    <span class="equip-gold">{getStartingGold(level())} GP</span>
                    <Show when={equipMode() !== 'gold'}>
                      <span class="equip-item-count">
                        {(equipMode() === 'customize' ? customItems() : defaultItems()).length} items
                      </span>
                    </Show>
                  </div>
                </div>
              );
            }}
          </Show>
        </Show>

        {/* STEP: Name & Bio */}
        <Show when={currentStep() === 'bio'}>
          <div class="wiz-section">
            <input class="wiz-name-input" placeholder="Character name"
              value={charName()} onInput={(e) => setCharName(e.target.value)} />
          </div>

          <div class="wiz-section">
            <label class="wiz-label">Avatar</label>
            <div class="wiz-avatar-row">
              <button class={`wiz-avatar-chip ${avatar() === '' ? 'active' : ''}`}
                onClick={() => setAvatar('')} title="Use name initial">
                {charName().trim().charAt(0).toUpperCase() || 'A'}
              </button>
              <For each={AVATAR_EMOJI}>
                {(e) => (
                  <button class={`wiz-avatar-chip ${avatar() === e ? 'active' : ''}`}
                    onClick={() => setAvatar(e)}>{e}</button>
                )}
              </For>
            </div>
          </div>

          <div class="wiz-section">
            <div class="wiz-bio-header">
              <label class="wiz-label">Appearance</label>
              <button class="wiz-gen-btn" onClick={() => generateBioField('appearance')}
                disabled={genField() !== ''}>
                {genField() === 'appearance' ? '...' : 'Generate'}
              </button>
            </div>
            <textarea class="wiz-bio-input" rows="2" placeholder="How do they look?"
              value={appearance()} onInput={(e) => setAppearance(e.target.value)} />
          </div>

          <div class="wiz-section">
            <div class="wiz-bio-header">
              <label class="wiz-label">Personality</label>
              <button class="wiz-gen-btn" onClick={rollAllTibf}>🎲 Roll all</button>
            </div>
            <For each={TIBF}>
              {(f) => (
                <div class="wiz-tibf">
                  <div class="wiz-tibf-head">
                    <span class="wiz-tibf-label">{f.label}</span>
                    <button class="wiz-tibf-roll" onClick={() => rollTibf(f.key)}>🎲</button>
                  </div>
                  <textarea class="wiz-bio-input" rows={f.rows} placeholder={f.placeholder}
                    value={tibfSig[f.key][0]()} onInput={(e) => tibfSig[f.key][1](e.target.value)} />
                </div>
              )}
            </For>
          </div>

          <div class="wiz-section">
            <div class="wiz-bio-header">
              <label class="wiz-label">Backstory</label>
              <button class="wiz-gen-btn" onClick={() => generateBioField('backstory')}
                disabled={genField() !== ''}>
                {genField() === 'backstory' ? '...' : 'Generate'}
              </button>
            </div>
            <textarea class="wiz-bio-input" rows="4" placeholder="Origin, motivation, secrets..."
              value={backstory()} onInput={(e) => setBackstory(e.target.value)} />
          </div>

          {/* Review summary */}
          <div class="wiz-review">
            <div class="wiz-review-line">
              <b>{race()} {cls()}</b> Lv{level()} &middot; {bg()} &middot; {align()}
            </div>
            <div class="wiz-review-stats">
              <For each={ABILITY_NAMES}>
                {(ab) => <span class="wiz-review-ab">{ab.toUpperCase()} {finalAbilities()[ab]}</span>}
              </For>
            </div>
            <div class="wiz-review-line">
              HP {hpMax()} &middot; AC {calcAC()} &middot; Speed {RACE_SPEED[race()] || 30}
            </div>
            <Show when={skillPicks().length > 0 || bgSkills().length > 0}>
              <div class="wiz-review-line">
                Skills: {[...bgSkills(), ...skillPicks()].join(', ')}
              </div>
            </Show>
            <Show when={isCaster() && pickedSpells().length > 0}>
              <div class="wiz-review-line">
                Spells: {[...pickedCantrips(), ...pickedSpells()].join(', ')}
              </div>
            </Show>
            <Show when={pTrait() || pIdeal() || pBond() || pFlaw()}>
              <div class="wiz-review-line wiz-review-tibf">
                <Show when={pTrait()}><span>{pTrait()}</span></Show>
                <Show when={pIdeal()}><span><b>Ideal:</b> {pIdeal()}</span></Show>
                <Show when={pBond()}><span><b>Bond:</b> {pBond()}</span></Show>
                <Show when={pFlaw()}><span><b>Flaw:</b> {pFlaw()}</span></Show>
              </div>
            </Show>
          </div>
        </Show>
      </div>

      {/* Bottom navigation */}
      <div class="wiz-nav">
        <Show when={stepIdx() > 0}>
          <button class="wiz-back-btn" onClick={back}>Back</button>
        </Show>
        <div class="wiz-nav-spacer" />
        <Show when={stepIdx() < totalSteps() - 1} fallback={
          <button class="wiz-commit-btn" onClick={buildAndCommit}
            disabled={!canAdvance() || building()}>
            {building() ? 'Saving...' : editing() ? 'Save Changes' : 'Use This Character'}
          </button>
        }>
          <button class="wiz-next-btn" onClick={next} disabled={!canAdvance()}>Next</button>
        </Show>
      </div>
      </Show>

      {/* Tap-to-source info sheet */}
      <Show when={info()}>
        <div class="wiz-info-backdrop" onClick={() => setInfo(null)}>
          <div class="wiz-info-sheet" onClick={(e) => e.stopPropagation()}>
            <div class="wiz-info-head">
              <span class="wiz-info-title">{info().title}</span>
              <button class="wiz-info-close" onClick={() => setInfo(null)}>✕</button>
            </div>
            <Show when={info().sub}><div class="wiz-info-sub">{info().sub}</div></Show>
            <div class="wiz-info-body">{info().body}</div>
          </div>
        </div>
      </Show>
    </div>
  );
}
