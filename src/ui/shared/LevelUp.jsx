import { createSignal, createMemo, For, Show, onMount, batch } from 'solid-js';
import { store, setStore, systemSet } from '../../state/store.js';
import { abilityMod, proficiencyBonus } from '../../data/forge.js';
import { CLASS_DATA, ALL_SKILLS, SKILL_ABILITIES, SKILL_DESC } from '../../data/quickBuild.js';
import { getByIndex, getAll, getSpellsForClass } from '../../data/local.js';

const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABEL = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
const HIT_DIE_OPTIONS = ['d6', 'd8', 'd10', 'd12'];

export default function LevelUp(props) {
  const pc = () => store.campaign.characters[props.pcIndex];
  const className = () => pc()?.class || '';
  const classInfo = () => CLASS_DATA[className()] || null;

  const [levelQueue, setLevelQueue] = createSignal([]);
  const [currentLevelIdx, setCurrentLevelIdx] = createSignal(0);
  const [stepIdx, setStepIdx] = createSignal(0);
  const [allChoices, setAllChoices] = createSignal([]);
  const [loading, setLoading] = createSignal(true);

  // Per-level draft state
  const [hpMethod, setHpMethod] = createSignal('average');
  const [hpRoll, setHpRoll] = createSignal(null);
  const [subclassPick, setSubclassPick] = createSignal('');
  const [asiMode, setAsiMode] = createSignal('asi');
  const [asiScores, setAsiScores] = createSignal({});
  const [featPick, setFeatPick] = createSignal(null);
  const [featAsiAbility, setFeatAsiAbility] = createSignal('');
  const [spellPicks, setSpellPicks] = createSignal([]);
  const [cantripPicks, setCantripPicks] = createSignal([]);
  const [swapFrom, setSwapFrom] = createSignal('');
  const [swapTo, setSwapTo] = createSignal('');
  const [expertisePicks, setExpertisePicks] = createSignal([]);
  const [manualHitDie, setManualHitDie] = createSignal('d8');

  // Data pools
  const [spellPool, setSpellPool] = createSignal([]);
  const [allSpellPool, setAllSpellPool] = createSignal([]);
  const [cantripPool, setCantripPool] = createSignal([]);
  const [featPool, setFeatPool] = createSignal([]);
  const [featFilter, setFeatFilter] = createSignal('');

  // Info tooltip
  const [infoText, setInfoText] = createSignal('');

  const currentLevel = () => levelQueue()[currentLevelIdx()] || null;

  const steps = createMemo(() => {
    const lvl = currentLevel();
    if (!lvl) return [];
    const s = [];
    s.push({ type: 'hp', label: 'Hit Points' });
    if (lvl.features && lvl.features.length > 0) {
      s.push({ type: 'features', label: 'New Features' });
    }
    const charSubclass = pc()?.subclass || allChoices().find(c => c.subclass)?.subclass || '';
    for (const choice of (lvl.choices || [])) {
      if (choice.subclass && choice.subclass !== charSubclass) continue;
      if (choice.type === 'subclass') {
        s.push({ type: 'subclass', label: 'Subclass', options: choice.options });
      }
      if (choice.type === 'asi') {
        s.push({ type: 'asi', label: 'Ability Score / Feat' });
      }
      if (choice.type === 'spell') {
        s.push({ type: 'spell', label: choice.source === 'any' ? 'Magical Secrets' : 'New Spells', desc: choice.desc, source: choice.source });
      }
    }
    const hasExpertise = (lvl.features || []).some(f =>
      (typeof f === 'string' ? f : f.name) === 'Expertise'
    );
    if (hasExpertise) {
      s.push({ type: 'expertise', label: 'Expertise' });
    }
    // Check cantrip gain outside of spell choices
    const ci = classInfo();
    if (ci?.cantripsKnown) {
      const prevCount = ci.cantripsKnown[(lvl.level - 2)] || 0;
      const newCount = ci.cantripsKnown[(lvl.level - 1)] || 0;
      const spellChoiceHasCantrip = (lvl.choices || []).some(
        c => c.type === 'spell' && c.desc?.toLowerCase().includes('cantrip')
      );
      if (newCount > prevCount && !spellChoiceHasCantrip) {
        s.push({ type: 'cantrip', label: 'New Cantrip', count: newCount - prevCount });
      }
    }
    s.push({ type: 'summary', label: 'Summary' });
    return s;
  });

  const currentStep = () => steps()[stepIdx()] || null;

  // Compute HP values
  const hitDie = () => {
    if (!classInfo()) return manualHitDie();
    return currentLevel()?.hitDie || classInfo()?.hitDie || 'd8';
  };
  const hitDieMax = () => parseInt(hitDie().slice(1)) || 8;
  const hitDieAvg = () => Math.floor(hitDieMax() / 2) + 1;

  const conModForLevel = createMemo(() => {
    const base = pc()?.abilityScores?.con || 10;
    const priorAsi = allChoices().reduce((sum, c) => sum + (c.asiScores?.con || 0), 0);
    return abilityMod(base + priorAsi);
  });

  const hpGain = () => {
    const roll = hpMethod() === 'roll' ? (hpRoll() ?? hitDieAvg()) : hitDieAvg();
    return Math.max(1, roll + conModForLevel());
  };

  // Load data on mount
  onMount(async () => {
    const character = pc();
    if (!character) { props.onClose(); return; }

    let targetLevel = character.level;
    while (targetLevel < 20 && character.xp >= XP_THRESHOLDS[targetLevel]) {
      targetLevel++;
    }
    if (targetLevel <= character.level) { props.onClose(); return; }

    let classDataEntries = [];
    try { classDataEntries = await getByIndex('classData', 'class', character.class); } catch (_) {}

    const ci = CLASS_DATA[character.class];
    const queue = [];
    for (let lvl = character.level + 1; lvl <= targetLevel; lvl++) {
      const entry = classDataEntries.find(e => e.level === lvl);
      queue.push({
        level: lvl,
        hitDie: entry?.hitDie || ci?.hitDie || 'd8',
        features: entry?.features || [],
        choices: entry?.choices || [],
        spellSlots: entry?.spellSlots || ci?.slotTable?.[lvl] || {},
      });
    }
    setLevelQueue(queue);

    // Load spells
    const hasAnyClassChoice = queue.some(lvl => (lvl.choices || []).some(c => c.source === 'any'));
    try {
      const classSpells = await getSpellsForClass(character.class);
      if (classSpells.length > 0) {
        setSpellPool(classSpells.filter(s => s.level > 0).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)));
        setCantripPool(classSpells.filter(s => s.level === 0).sort((a, b) => a.name.localeCompare(b.name)));
      }
      if (hasAnyClassChoice) {
        const every = await getAll('spells');
        if (every.length > 0) {
          setAllSpellPool(every.filter(s => s.level > 0).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)));
        }
      }
    } catch (_) {}

    // Fallback spells if DB empty
    if ((spellPool().length === 0 || (hasAnyClassChoice && allSpellPool().length === 0)) && ci) {
      try {
        const every = await getAll('spells');
        if (spellPool().length === 0) {
          const classSpells = every.filter(s =>
            s.classes && Array.isArray(s.classes) && s.classes.some(c => c.toLowerCase() === character.class.toLowerCase())
          );
          if (classSpells.length > 0) {
            setSpellPool(classSpells.filter(s => s.level > 0).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)));
            setCantripPool(classSpells.filter(s => s.level === 0).sort((a, b) => a.name.localeCompare(b.name)));
          }
        }
        if (hasAnyClassChoice && allSpellPool().length === 0 && every.length > 0) {
          setAllSpellPool(every.filter(s => s.level > 0).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)));
        }
      } catch (_) {}
    }

    // Load feats
    try {
      const feats = await getAll('feats');
      if (feats.length > 0) {
        setFeatPool(feats.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (_) {}

    if (featPool().length === 0) {
      try {
        const resp = await fetch('/data/feats.json');
        const feats = await resp.json();
        setFeatPool(feats.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (_) {}
    }

    setLoading(false);
  });

  function rollHitDie() {
    const max = hitDieMax();
    const result = Math.floor(Math.random() * max) + 1;
    setHpRoll(result);
    setHpMethod('roll');
  }

  function asiPointsUsed() {
    const scores = asiScores();
    return Object.values(scores).reduce((s, v) => s + v, 0);
  }

  function adjustAsi(ability, delta) {
    const current = asiScores()[ability] || 0;
    const newVal = current + delta;
    if (newVal < 0 || newVal > 2) return;
    const totalAfter = asiPointsUsed() - current + newVal;
    if (totalAfter > 2) return;
    const pcScore = (pc()?.abilityScores?.[ability] || 10) +
      allChoices().reduce((s, c) => s + (c.asiScores?.[ability] || 0), 0) + newVal;
    if (pcScore > 20) return;
    setAsiScores({ ...asiScores(), [ability]: newVal });
  }

  function toggleSpell(name) {
    const step = currentStep();
    const maxPicks = parseSpellCount(step?.desc);
    const current = spellPicks();
    if (current.includes(name)) {
      setSpellPicks(current.filter(s => s !== name));
    } else if (current.length < maxPicks) {
      setSpellPicks([...current, name]);
    }
  }

  function toggleCantrip(name) {
    const step = currentStep();
    const maxPicks = step?.count || 1;
    const current = cantripPicks();
    if (current.includes(name)) {
      setCantripPicks(current.filter(s => s !== name));
    } else if (current.length < maxPicks) {
      setCantripPicks([...current, name]);
    }
  }

  function toggleExpertise(skill) {
    const current = expertisePicks();
    if (current.includes(skill)) {
      setExpertisePicks(current.filter(s => s !== skill));
    } else if (current.length < 2) {
      setExpertisePicks([...current, skill]);
    }
  }

  function parseSpellCount(desc) {
    if (!desc) return 1;
    const m = desc.match(/^(\d+)\s/);
    return m ? parseInt(m[1]) : 1;
  }

  function parseMaxSpellLevel(desc) {
    if (!desc) return 9;
    const m = desc.match(/up to (\d+)/i);
    return m ? parseInt(m[1]) : 9;
  }

  // All spells the PC already knows + spells picked in earlier levels of this wizard
  const knownSpellNames = createMemo(() => {
    const base = new Set((pc()?.knownSpells || []).map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase()));
    for (const c of allChoices()) {
      for (const s of (c.newSpells || [])) base.add(s.toLowerCase());
      if (c.swapFrom) base.delete(c.swapFrom.toLowerCase());
    }
    // Also add spells picked in the current level
    for (const s of spellPicks()) base.add(s.toLowerCase());
    return base;
  });

  const knownCantripNames = createMemo(() => {
    const base = new Set((pc()?.cantrips || []).map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase()));
    for (const c of allChoices()) {
      for (const s of (c.newCantrips || [])) base.add(s.toLowerCase());
    }
    for (const s of cantripPicks()) base.add(s.toLowerCase());
    return base;
  });

  const spellStepIncludesCantrips = () => {
    const step = currentStep();
    return step?.type === 'spell' && step?.desc?.toLowerCase().includes('cantrip');
  };

  const filteredSpells = createMemo(() => {
    const step = currentStep();
    const maxLvl = parseMaxSpellLevel(step?.desc);
    const known = knownSpellNames();
    const knownC = knownCantripNames();
    const pool = step?.source === 'any' ? allSpellPool() : spellPool();
    const leveled = pool.filter(s =>
      s.level > 0 && s.level <= maxLvl && !known.has(s.name.toLowerCase())
    );
    if (!spellStepIncludesCantrips()) return leveled;
    const cantrips = cantripPool().filter(s => !knownC.has(s.name.toLowerCase()));
    return [...cantrips, ...leveled];
  });

  const filteredCantrips = createMemo(() => {
    const known = knownCantripNames();
    return cantripPool().filter(s => !known.has(s.name.toLowerCase()));
  });

  const filteredFeats = createMemo(() => {
    const q = featFilter().toLowerCase();
    return featPool().filter(f => {
      if (q && !f.name.toLowerCase().includes(q) && !f.desc.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  // All proficient skills (for expertise step)
  const proficientSkills = createMemo(() => {
    const skills = pc()?.skills || {};
    const priorExpertise = new Set(allChoices().flatMap(c => c.expertise || []));
    return ALL_SKILLS.filter(s => {
      const key = s.toLowerCase().replace(/\s+/g, '');
      return skills[key] && !priorExpertise.has(s);
    });
  });

  function canProceed() {
    const step = currentStep();
    if (!step) return false;
    switch (step.type) {
      case 'hp': return true;
      case 'features': return true;
      case 'subclass': return !!subclassPick();
      case 'asi': {
        if (asiMode() === 'asi') return asiPointsUsed() === 2;
        return !!featPick();
      }
      case 'spell': return spellPicks().length >= parseSpellCount(step.desc);
      case 'cantrip': return cantripPicks().length >= (step.count || 1);
      case 'expertise': return expertisePicks().length === 2;
      case 'summary': return true;
      default: return true;
    }
  }

  function resetDraft() {
    setHpMethod('average');
    setHpRoll(null);
    setSubclassPick('');
    setAsiMode('asi');
    setAsiScores({});
    setFeatPick(null);
    setFeatAsiAbility('');
    setSpellPicks([]);
    setCantripPicks([]);
    setSwapFrom('');
    setSwapTo('');
    setExpertisePicks([]);
  }

  function collectChoices() {
    const lvl = currentLevel();
    // Separate cantrips from leveled spells if the spell step included cantrips
    const cantripNames = new Set(cantripPool().map(s => s.name.toLowerCase()));
    const spellStepCantrips = spellPicks().filter(n => cantripNames.has(n.toLowerCase()));
    const spellStepLeveled = spellPicks().filter(n => !cantripNames.has(n.toLowerCase()));
    const choices = {
      level: lvl.level,
      hpGain: hpGain(),
      features: (lvl.features || []).map(f => typeof f === 'string' ? f : f.name),
      newSpells: [...spellStepLeveled],
      newCantrips: [...cantripPicks(), ...spellStepCantrips],
      spellSlots: lvl.spellSlots,
      asiScores: { ...asiScores() },
      feat: featPick(),
      featAsiAbility: featAsiAbility(),
      subclass: subclassPick() || null,
      expertise: [...expertisePicks()],
      swapFrom: swapFrom() || null,
      swapTo: swapTo() || null,
    };
    if (asiMode() === 'feat' && featPick()?.halfAsi && featAsiAbility()) {
      const ab = featAsiAbility().toLowerCase();
      choices.asiScores = { ...choices.asiScores, [ab]: (choices.asiScores[ab] || 0) + 1 };
    }
    return choices;
  }

  function nextStep() {
    if (!canProceed()) return;
    const step = currentStep();

    if (step.type === 'summary') {
      const choices = collectChoices();
      const newAll = [...allChoices(), choices];
      setAllChoices(newAll);

      if (currentLevelIdx() < levelQueue().length - 1) {
        setCurrentLevelIdx(currentLevelIdx() + 1);
        setStepIdx(0);
        resetDraft();
      } else {
        applyLevelUp(newAll);
      }
      return;
    }
    setStepIdx(stepIdx() + 1);
  }

  function prevStep() {
    if (stepIdx() > 0) {
      setStepIdx(stepIdx() - 1);
    } else if (currentLevelIdx() > 0) {
      const prev = allChoices().slice(0, -1);
      setAllChoices(prev);
      setCurrentLevelIdx(currentLevelIdx() - 1);
      resetDraft();
      // Go to last step of previous level
      // Steps will recompute; jump to summary
      setTimeout(() => {
        const s = steps();
        setStepIdx(Math.max(0, s.length - 1));
      }, 0);
    }
  }

  function applyLevelUp(choices) {
    const idx = props.pcIndex;
    const character = pc();
    const finalLevel = levelQueue()[levelQueue().length - 1].level;

    // Accumulate ASI
    const asiTotal = {};
    for (const ab of ABILITIES) asiTotal[ab] = 0;
    for (const c of choices) {
      for (const [k, v] of Object.entries(c.asiScores || {})) {
        asiTotal[k] = (asiTotal[k] || 0) + v;
      }
    }

    // CON retroactive HP: if CON increased, extra HP for ALL levels (not just new)
    const oldConMod = abilityMod(character.abilityScores?.con || 10);
    const newConMod = abilityMod((character.abilityScores?.con || 10) + (asiTotal.con || 0));
    const conRetroactive = (newConMod - oldConMod) * finalLevel;

    // Tough feat check
    let toughBonus = 0;
    for (const c of choices) {
      if (c.feat?.name === 'Tough') {
        toughBonus = finalLevel * 2;
      }
    }

    const totalHpGain = choices.reduce((sum, c) => sum + c.hpGain, 0) + conRetroactive + toughBonus;

    // Collect features
    const newFeatures = choices.flatMap(c => c.features || []);
    // Also add feat names
    const featNames = choices.filter(c => c.feat).map(c => c.feat.name);
    const allFeatures = [...(character.features || []), ...newFeatures, ...featNames];

    // Spells
    const newSpells = choices.flatMap(c => c.newSpells || []);
    const removedSpells = new Set(choices.filter(c => c.swapFrom).map(c => c.swapFrom));
    // Add swap replacements
    const swapAdds = choices.filter(c => c.swapTo).map(c => c.swapTo);
    const updatedSpells = [
      ...(character.knownSpells || []).filter(s => !removedSpells.has(s)),
      ...newSpells,
      ...swapAdds,
    ];

    // Cantrips
    const newCantrips = choices.flatMap(c => c.newCantrips || []);
    const updatedCantrips = [...(character.cantrips || []), ...newCantrips];

    // Spell slots from final level
    const finalSlots = levelQueue()[levelQueue().length - 1].spellSlots;

    // Skills + expertise
    const updatedSkills = { ...(character.skills || {}) };
    for (const c of choices) {
      for (const skill of (c.expertise || [])) {
        const key = skill.toLowerCase().replace(/\s+/g, '');
        updatedSkills[key + '_expertise'] = true;
      }
    }

    // Ability scores
    const newScores = { ...(character.abilityScores || {}) };
    for (const [k, v] of Object.entries(asiTotal)) {
      if (v > 0) newScores[k] = Math.min(20, (newScores[k] || 10) + v);
    }

    // Recompute resources
    const resources = computeResources(className(), finalLevel, newScores);

    // Recompute attacks
    const attacks = computeAttacks(className(), finalLevel, newScores);

    // AC (if DEX changed — applies DEX mod delta regardless of armor type)
    const newDexMod = abilityMod(newScores.dex);
    const oldDexMod = abilityMod(character.abilityScores?.dex || 10);
    const acDelta = newDexMod - oldDexMod;
    const newAc = character.ac + acDelta;

    // Subclass
    const subclass = choices.find(c => c.subclass)?.subclass || character.subclass;

    batch(() => {
      systemSet(`characters.${idx}.level`, finalLevel);
      systemSet(`characters.${idx}.hpMax`, character.hpMax + totalHpGain);
      systemSet(`characters.${idx}.abilityScores`, newScores);
      systemSet(`characters.${idx}.features`, allFeatures);
      systemSet(`characters.${idx}.knownSpells`, updatedSpells);
      systemSet(`characters.${idx}.cantrips`, updatedCantrips);
      systemSet(`characters.${idx}.skills`, updatedSkills);
      systemSet(`characters.${idx}.attacks`, attacks);
      systemSet(`characters.${idx}.ac`, newAc);
      systemSet(`characters.${idx}.resources`, resources);

      if (Object.keys(finalSlots).length > 0) {
        systemSet(`characters.${idx}.spellSlots`, finalSlots);
      }
      if (subclass && subclass !== character.subclass) {
        systemSet(`characters.${idx}.subclass`, subclass);
      }
    });

    // Bump HP (AI-owned, bypasses ownership like CharSheet manual override)
    const newHpMax = character.hpMax + totalHpGain;
    setStore('campaign', 'characters', idx, 'hp', Math.min(character.hp + totalHpGain, newHpMax));
    // Update hitDice total
    setStore('campaign', 'characters', idx, 'hitDice', { ...character.hitDice, total: finalLevel });
    // Initialize currentSlots for any NEW spell levels gained (AI-owned, same bypass)
    if (Object.keys(finalSlots).length > 0) {
      const currentSlots = { ...(character.currentSlots || {}) };
      for (const [lvl, max] of Object.entries(finalSlots)) {
        if (!(lvl in currentSlots)) currentSlots[lvl] = max;
      }
      setStore('campaign', 'characters', idx, 'currentSlots', currentSlots);
    }

    window.dispatchEvent(new CustomEvent('toast', {
      detail: { text: `${character.name} is now level ${finalLevel}!` }
    }));

    props.onClose();
  }

  // --- Render ---

  return (
    <div class="lu-wizard">
      <Show when={loading()}>
        <div class="lu-loading">Loading level-up data...</div>
      </Show>

      <Show when={!loading() && levelQueue().length > 0}>
        {/* Header */}
        <div class="lu-header">
          <button class="lu-close" onClick={props.onClose}>&times;</button>
          <div class="lu-title">Level Up: {pc()?.name}</div>
          <div class="lu-subtitle">
            Level {pc()?.level} &rarr; {levelQueue()[levelQueue().length - 1]?.level}
          </div>
        </div>

        {/* Level progress */}
        <Show when={levelQueue().length > 1}>
          <div class="lu-level-progress">
            <For each={levelQueue()}>
              {(lvl, i) => (
                <div class={`lu-level-dot ${i() < currentLevelIdx() ? 'done' : ''} ${i() === currentLevelIdx() ? 'active' : ''}`}>
                  {lvl.level}
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Step progress */}
        <div class="lu-step-bar">
          <For each={steps()}>
            {(s, i) => (
              <div class={`lu-step-dot ${i() < stepIdx() ? 'done' : ''} ${i() === stepIdx() ? 'active' : ''}`}>
                <span class="lu-step-label">{s.label}</span>
              </div>
            )}
          </For>
        </div>

        {/* Step content */}
        <div class="lu-body">
          <Show when={currentStep()?.type === 'hp'}>
            <StepHP
              hitDie={hitDie()} hitDieMax={hitDieMax()} hitDieAvg={hitDieAvg()}
              conMod={conModForLevel()} hpMethod={hpMethod} setHpMethod={setHpMethod}
              hpRoll={hpRoll} rollHitDie={rollHitDie} hpGain={hpGain}
              currentHpMax={() => pc()?.hpMax || 0}
              level={() => currentLevel()?.level}
              isManual={() => !classInfo()}
              manualHitDie={manualHitDie} setManualHitDie={setManualHitDie}
            />
          </Show>

          <Show when={currentStep()?.type === 'features'}>
            <StepFeatures
              features={() => currentLevel()?.features || []}
              level={() => currentLevel()?.level}
              className={className}
              setInfoText={setInfoText}
            />
          </Show>

          <Show when={currentStep()?.type === 'subclass'}>
            <StepSubclass
              options={() => currentStep()?.options || []}
              pick={subclassPick} setPick={setSubclassPick}
              className={className}
            />
          </Show>

          <Show when={currentStep()?.type === 'asi'}>
            <StepASI
              pc={pc} asiMode={asiMode} setAsiMode={setAsiMode}
              asiScores={asiScores} adjustAsi={adjustAsi}
              asiPointsUsed={asiPointsUsed}
              featPick={featPick} setFeatPick={setFeatPick}
              featAsiAbility={featAsiAbility} setFeatAsiAbility={setFeatAsiAbility}
              featPool={filteredFeats} featFilter={featFilter} setFeatFilter={setFeatFilter}
              allChoices={allChoices}
              setInfoText={setInfoText}
            />
          </Show>

          <Show when={currentStep()?.type === 'spell'}>
            <StepSpell
              desc={() => currentStep()?.desc || ''}
              spells={filteredSpells}
              picks={spellPicks} toggle={toggleSpell}
              maxPicks={() => parseSpellCount(currentStep()?.desc)}
              swapFrom={swapFrom} setSwapFrom={setSwapFrom}
              swapTo={swapTo} setSwapTo={setSwapTo}
              knownSpells={() => pc()?.knownSpells || []}
              allSwaps={() => allChoices().filter(c => c.swapFrom).map(c => c.swapFrom)}
              spellPool={() => currentStep()?.source === 'any' ? allSpellPool() : spellPool()}
              maxLevel={() => parseMaxSpellLevel(currentStep()?.desc)}
              setInfoText={setInfoText}
            />
          </Show>

          <Show when={currentStep()?.type === 'cantrip'}>
            <StepCantrip
              cantrips={filteredCantrips}
              picks={cantripPicks} toggle={toggleCantrip}
              maxPicks={() => currentStep()?.count || 1}
            />
          </Show>

          <Show when={currentStep()?.type === 'expertise'}>
            <StepExpertise
              skills={proficientSkills}
              picks={expertisePicks} toggle={toggleExpertise}
            />
          </Show>

          <Show when={currentStep()?.type === 'summary'}>
            <StepSummary
              choices={collectChoices}
              currentLevel={currentLevel}
              isLast={() => currentLevelIdx() === levelQueue().length - 1}
              hpGain={hpGain} conMod={conModForLevel}
              pc={pc}
            />
          </Show>
        </div>

        {/* Info overlay */}
        <Show when={infoText()}>
          <div class="lu-info-overlay" onClick={() => setInfoText('')}>
            <div class="lu-info-card" onClick={(e) => e.stopPropagation()}>
              <div class="lu-info-text">{infoText()}</div>
              <button class="lu-info-close" onClick={() => setInfoText('')}>Close</button>
            </div>
          </div>
        </Show>

        {/* Navigation */}
        <div class="lu-nav">
          <button
            class="lu-btn lu-btn-back"
            onClick={prevStep}
            disabled={stepIdx() === 0 && currentLevelIdx() === 0}
          >Back</button>
          <button
            class="lu-btn lu-btn-next"
            onClick={nextStep}
            disabled={!canProceed()}
          >
            {currentStep()?.type === 'summary'
              ? (currentLevelIdx() === levelQueue().length - 1
                  ? 'Apply Level Up'
                  : `Next: Level ${levelQueue()[currentLevelIdx() + 1]?.level}`)
              : 'Next'}
          </button>
        </div>
      </Show>
    </div>
  );
}

// --- Sub-components ---

function StepHP(props) {
  return (
    <div class="lu-step-content">
      <h3 class="lu-step-title">Hit Points — Level {props.level()}</h3>

      <Show when={props.isManual()}>
        <div class="lu-manual-hd">
          <span class="lu-label">Hit Die:</span>
          <div class="lu-hd-options">
            <For each={HIT_DIE_OPTIONS}>
              {(die) => (
                <button
                  class={`lu-hd-btn ${props.manualHitDie() === die ? 'active' : ''}`}
                  onClick={() => props.setManualHitDie(die)}
                >{die}</button>
              )}
            </For>
          </div>
        </div>
      </Show>

      <div class="lu-hp-methods">
        <button
          class={`lu-hp-btn ${props.hpMethod() === 'average' ? 'active' : ''}`}
          onClick={() => props.setHpMethod('average')}
        >
          <span class="lu-hp-btn-val">{props.hitDieAvg}</span>
          <span class="lu-hp-btn-label">Average ({props.hitDie})</span>
        </button>
        <button
          class={`lu-hp-btn ${props.hpMethod() === 'roll' ? 'active' : ''}`}
          onClick={props.rollHitDie}
        >
          <span class="lu-hp-btn-val">{props.hpRoll() ?? '?'}</span>
          <span class="lu-hp-btn-label">Roll {props.hitDie}</span>
        </button>
      </div>

      <div class="lu-hp-summary">
        <div class="lu-hp-math">
          <span class="lu-hp-num">{props.hpMethod() === 'roll' ? (props.hpRoll() ?? props.hitDieAvg) : props.hitDieAvg}</span>
          <span class="lu-hp-op">+</span>
          <span class="lu-hp-num">{props.conMod}</span>
          <span class="lu-hp-label-small">CON</span>
          <span class="lu-hp-op">=</span>
          <span class="lu-hp-num lu-hp-total">+{props.hpGain()}</span>
        </div>
        <div class="lu-hp-result">
          Max HP: {props.currentHpMax()} &rarr; {props.currentHpMax() + props.hpGain()}
        </div>
      </div>
    </div>
  );
}

function StepFeatures(props) {
  return (
    <div class="lu-step-content">
      <h3 class="lu-step-title">New Features — Level {props.level()}</h3>
      <div class="lu-feature-list">
        <For each={props.features()}>
          {(f) => {
            const name = typeof f === 'string' ? f : f.name;
            const desc = typeof f === 'string' ? '' : f.desc;
            return (
              <div class="lu-feature-card" onClick={() => desc && props.setInfoText(desc)}>
                <div class="lu-feature-name">{name}</div>
                <Show when={desc}>
                  <div class="lu-feature-desc">{desc}</div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}

function StepSubclass(props) {
  return (
    <div class="lu-step-content">
      <h3 class="lu-step-title">{props.className()} Subclass</h3>
      <p class="lu-hint">Choose your specialization.</p>
      <div class="lu-subclass-grid">
        <For each={props.options()}>
          {(opt) => (
            <button
              class={`lu-subclass-card ${props.pick() === opt ? 'active' : ''}`}
              onClick={() => props.setPick(opt)}
            >
              <span class="lu-subclass-name">{opt}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

function StepASI(props) {
  const currentScores = createMemo(() => {
    const base = props.pc()?.abilityScores || {};
    const prior = {};
    for (const ab of ABILITIES) {
      prior[ab] = props.allChoices().reduce((s, c) => s + (c.asiScores?.[ab] || 0), 0);
    }
    return ABILITIES.map(ab => ({
      key: ab,
      base: (base[ab] || 10) + (prior[ab] || 0),
      delta: props.asiScores()[ab] || 0,
    }));
  });

  const halfAsiOptions = createMemo(() => {
    const feat = props.featPick();
    if (!feat?.halfAsi) return [];
    const raw = feat.halfAsi;
    if (raw === 'Any one') return ABILITIES;
    return raw.split('/').map(s => s.trim().toLowerCase()).filter(s => ABILITIES.includes(s));
  });

  return (
    <div class="lu-step-content">
      <h3 class="lu-step-title">Ability Score Improvement</h3>
      <div class="lu-asi-toggle">
        <button class={`lu-toggle-btn ${props.asiMode() === 'asi' ? 'active' : ''}`} onClick={() => props.setAsiMode('asi')}>
          +2 Ability Score
        </button>
        <button class={`lu-toggle-btn ${props.asiMode() === 'feat' ? 'active' : ''}`} onClick={() => props.setAsiMode('feat')}>
          Feat
        </button>
      </div>

      <Show when={props.asiMode() === 'asi'}>
        <p class="lu-hint">Distribute 2 points. ({2 - props.asiPointsUsed()} remaining)</p>
        <div class="lu-asi-grid">
          <For each={currentScores()}>
            {(s) => (
              <div class="lu-asi-row">
                <span class="lu-asi-label">{ABILITY_LABEL[s.key]}</span>
                <span class="lu-asi-score">{s.base + s.delta}</span>
                <span class="lu-asi-mod">({abilityMod(s.base + s.delta) >= 0 ? '+' : ''}{abilityMod(s.base + s.delta)})</span>
                <button class="lu-asi-btn" onClick={() => props.adjustAsi(s.key, -1)} disabled={s.delta <= 0}>−</button>
                <span class="lu-asi-delta">{s.delta > 0 ? `+${s.delta}` : ''}</span>
                <button class="lu-asi-btn" onClick={() => props.adjustAsi(s.key, 1)} disabled={s.base + s.delta >= 20 || props.asiPointsUsed() >= 2}>+</button>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={props.asiMode() === 'feat'}>
        <div class="lu-feat-search">
          <input
            type="text"
            class="lu-search-input"
            placeholder="Search feats..."
            value={props.featFilter()}
            onInput={(e) => props.setFeatFilter(e.target.value)}
          />
        </div>
        <div class="lu-feat-list">
          <For each={props.featPool()}>
            {(feat) => {
              const selected = () => props.featPick()?.name === feat.name;
              return (
                <div
                  class={`lu-feat-card ${selected() ? 'active' : ''}`}
                  onClick={() => {
                    props.setFeatPick(selected() ? null : feat);
                    props.setFeatAsiAbility('');
                  }}
                >
                  <div class="lu-feat-header">
                    <span class="lu-feat-name">{feat.name}</span>
                    <Show when={feat.halfAsi}>
                      <span class="lu-feat-asi-badge">+1 {feat.halfAsi}</span>
                    </Show>
                  </div>
                  <div class="lu-feat-desc">{feat.desc}</div>
                  <Show when={feat.prerequisite && feat.prerequisite !== 'None'}>
                    <div class="lu-feat-prereq">Requires: {feat.prerequisite}</div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        <Show when={props.featPick()?.halfAsi && halfAsiOptions().length > 1}>
          <div class="lu-feat-asi-pick">
            <span class="lu-label">+1 to which ability?</span>
            <div class="lu-feat-asi-options">
              <For each={halfAsiOptions()}>
                {(ab) => (
                  <button
                    class={`lu-asi-opt ${props.featAsiAbility() === ab ? 'active' : ''}`}
                    onClick={() => props.setFeatAsiAbility(ab)}
                  >{ABILITY_LABEL[ab]}</button>
                )}
              </For>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}

function StepSpell(props) {
  const [showSwap, setShowSwap] = createSignal(false);
  const swappableSpells = createMemo(() => {
    const alreadySwapped = new Set(props.allSwaps());
    return (props.knownSpells() || []).filter(s => !alreadySwapped.has(s));
  });
  const swapPool = createMemo(() => {
    const maxLvl = props.maxLevel();
    const known = new Set([...(props.knownSpells() || []).map(s => s.toLowerCase()), ...props.picks().map(s => s.toLowerCase())]);
    if (props.swapFrom()) known.delete(props.swapFrom().toLowerCase());
    return props.spellPool().filter(s => s.level > 0 && s.level <= maxLvl && !known.has(s.name.toLowerCase()));
  });

  return (
    <div class="lu-step-content">
      <h3 class="lu-step-title">Learn Spells</h3>
      <p class="lu-hint">{props.desc()} ({props.picks().length}/{props.maxPicks()})</p>
      <div class="lu-spell-grid">
        <For each={props.spells()}>
          {(spell) => (
            <button
              class={`lu-spell-chip ${props.picks().includes(spell.name) ? 'active' : ''}`}
              onClick={() => props.toggle(spell.name)}
            >
              <span class="lu-spell-name">{spell.name}</span>
              <span class="lu-spell-lvl">{spell.level === 0 ? 'Cantrip' : `Lv${spell.level}`}</span>
            </button>
          )}
        </For>
        <Show when={props.spells().length === 0}>
          <p class="lu-empty">No matching spells in database. You can add spells manually on the character sheet after leveling up.</p>
        </Show>
      </div>

      {/* Spell swap section */}
      <div class="lu-swap-section">
        <button class="lu-swap-toggle" onClick={() => setShowSwap(!showSwap())}>
          {showSwap() ? 'Cancel swap' : 'Swap a known spell?'}
        </button>
        <Show when={showSwap()}>
          <div class="lu-swap-body">
            <p class="lu-hint">Remove one known spell and learn a replacement.</p>
            <div class="lu-swap-row">
              <span class="lu-label">Remove:</span>
              <div class="lu-spell-grid">
                <For each={swappableSpells()}>
                  {(s) => (
                    <button
                      class={`lu-spell-chip ${props.swapFrom() === s ? 'active remove' : ''}`}
                      onClick={() => { props.setSwapFrom(props.swapFrom() === s ? '' : s); props.setSwapTo(''); }}
                    >{s}</button>
                  )}
                </For>
              </div>
            </div>
            <Show when={props.swapFrom()}>
              <div class="lu-swap-row">
                <span class="lu-label">Replace with:</span>
                <div class="lu-spell-grid">
                  <For each={swapPool()}>
                    {(spell) => (
                      <button
                        class={`lu-spell-chip ${props.swapTo() === spell.name ? 'active' : ''}`}
                        onClick={() => props.setSwapTo(props.swapTo() === spell.name ? '' : spell.name)}
                      >
                        <span class="lu-spell-name">{spell.name}</span>
                        <span class="lu-spell-lvl">Lv{spell.level}</span>
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}

function StepCantrip(props) {
  return (
    <div class="lu-step-content">
      <h3 class="lu-step-title">New Cantrip</h3>
      <p class="lu-hint">Choose {props.maxPicks()} cantrip{props.maxPicks() > 1 ? 's' : ''}. ({props.picks().length}/{props.maxPicks()})</p>
      <div class="lu-spell-grid">
        <For each={props.cantrips()}>
          {(spell) => (
            <button
              class={`lu-spell-chip ${props.picks().includes(spell.name) ? 'active' : ''}`}
              onClick={() => props.toggle(spell.name)}
            >
              <span class="lu-spell-name">{spell.name}</span>
            </button>
          )}
        </For>
        <Show when={props.cantrips().length === 0}>
          <p class="lu-empty">No cantrips in database. You can add them manually on the character sheet.</p>
        </Show>
      </div>
    </div>
  );
}

function StepExpertise(props) {
  return (
    <div class="lu-step-content">
      <h3 class="lu-step-title">Expertise</h3>
      <p class="lu-hint">Choose 2 proficient skills for double proficiency bonus. ({props.picks().length}/2)</p>
      <div class="lu-skill-grid">
        <For each={props.skills()}>
          {(skill) => (
            <button
              class={`lu-skill-chip ${props.picks().includes(skill) ? 'active' : ''}`}
              onClick={() => props.toggle(skill)}
            >
              <span class="lu-skill-name">{skill}</span>
              <span class="lu-skill-ability">{SKILL_ABILITIES[skill] || ''}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

function StepSummary(props) {
  const c = createMemo(() => props.choices());

  const profBonusChange = createMemo(() => {
    const prevLevel = props.currentLevel()?.level - 1;
    const newLevel = props.currentLevel()?.level;
    if (!prevLevel || !newLevel) return null;
    const oldProf = proficiencyBonus(prevLevel);
    const newProf = proficiencyBonus(newLevel);
    return oldProf !== newProf ? { from: oldProf, to: newProf } : null;
  });

  return (
    <div class="lu-step-content">
      <h3 class="lu-step-title">Level {props.currentLevel()?.level} Summary</h3>
      <div class="lu-summary-card">
        <div class="lu-summary-row">
          <span class="lu-summary-label">HP</span>
          <span class="lu-summary-value">+{c().hpGain} ({props.pc()?.hpMax + c().hpGain} total)</span>
        </div>

        <Show when={profBonusChange()}>
          <div class="lu-summary-row lu-summary-highlight">
            <span class="lu-summary-label">Proficiency</span>
            <span class="lu-summary-value">+{profBonusChange().from} &rarr; +{profBonusChange().to}</span>
          </div>
        </Show>

        <Show when={c().subclass}>
          <div class="lu-summary-row">
            <span class="lu-summary-label">Subclass</span>
            <span class="lu-summary-value">{c().subclass}</span>
          </div>
        </Show>

        <Show when={c().features?.length > 0}>
          <div class="lu-summary-row">
            <span class="lu-summary-label">Features</span>
            <span class="lu-summary-value">{c().features.join(', ')}</span>
          </div>
        </Show>

        <Show when={Object.values(c().asiScores || {}).some(v => v > 0)}>
          <div class="lu-summary-row">
            <span class="lu-summary-label">ASI</span>
            <span class="lu-summary-value">
              {ABILITIES.filter(a => (c().asiScores?.[a] || 0) > 0)
                .map(a => `+${c().asiScores[a]} ${ABILITY_LABEL[a]}`).join(', ')}
            </span>
          </div>
        </Show>

        <Show when={c().feat}>
          <div class="lu-summary-row">
            <span class="lu-summary-label">Feat</span>
            <span class="lu-summary-value">{c().feat.name}</span>
          </div>
        </Show>

        <Show when={c().newSpells?.length > 0}>
          <div class="lu-summary-row">
            <span class="lu-summary-label">New Spells</span>
            <span class="lu-summary-value">{c().newSpells.join(', ')}</span>
          </div>
        </Show>

        <Show when={c().newCantrips?.length > 0}>
          <div class="lu-summary-row">
            <span class="lu-summary-label">New Cantrips</span>
            <span class="lu-summary-value">{c().newCantrips.join(', ')}</span>
          </div>
        </Show>

        <Show when={c().swapFrom && c().swapTo}>
          <div class="lu-summary-row">
            <span class="lu-summary-label">Spell Swap</span>
            <span class="lu-summary-value">{c().swapFrom} &rarr; {c().swapTo}</span>
          </div>
        </Show>

        <Show when={c().expertise?.length > 0}>
          <div class="lu-summary-row">
            <span class="lu-summary-label">Expertise</span>
            <span class="lu-summary-value">{c().expertise.join(', ')}</span>
          </div>
        </Show>

        <Show when={Object.keys(c().spellSlots || {}).length > 0}>
          <div class="lu-summary-row">
            <span class="lu-summary-label">Spell Slots</span>
            <span class="lu-summary-value">
              {Object.entries(c().spellSlots).map(([lvl, n]) => `${ordinal(lvl)}: ${n}`).join(', ')}
            </span>
          </div>
        </Show>
      </div>

      <Show when={!props.isLast()}>
        <p class="lu-hint lu-continue-hint">Choices saved. Continue to next level.</p>
      </Show>
    </div>
  );
}

function ordinal(n) {
  const num = parseInt(n);
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
}

function computeResources(className, level, scores) {
  const resources = [];
  if (className === 'Bard') {
    const chaMod = abilityMod(scores.cha || 10);
    resources.push({
      name: 'Bardic Inspiration', max: Math.max(1, chaMod), current: Math.max(1, chaMod),
      die: level >= 15 ? 'd12' : level >= 10 ? 'd10' : level >= 5 ? 'd8' : 'd6',
      restoresOn: level >= 5 ? 'short rest' : 'long rest',
    });
    if (level >= 2) {
      resources.push({
        name: 'Song of Rest',
        die: level >= 17 ? 'd12' : level >= 13 ? 'd10' : level >= 9 ? 'd8' : 'd6',
        restoresOn: 'short rest',
      });
    }
  } else if (className === 'Fighter') {
    resources.push({ name: 'Second Wind', max: 1, current: 1, restoresOn: 'short rest' });
    if (level >= 2) {
      const surgMax = level >= 17 ? 2 : 1;
      resources.push({ name: 'Action Surge', max: surgMax, current: surgMax, restoresOn: 'short rest' });
    }
    if (level >= 9) {
      const indMax = level >= 17 ? 3 : level >= 13 ? 2 : 1;
      resources.push({ name: 'Indomitable', max: indMax, current: indMax, restoresOn: 'long rest' });
    }
  } else if (className === 'Rogue') {
    resources.push({ name: 'Sneak Attack', max: 1, current: 1, die: `${Math.ceil(level / 2)}d6`, restoresOn: 'turn' });
    if (level >= 20) {
      resources.push({ name: 'Stroke of Luck', max: 1, current: 1, restoresOn: 'short rest' });
    }
  } else if (className === 'Barbarian') {
    const rages = level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2;
    const rageDmg = level >= 16 ? 4 : level >= 9 ? 3 : 2;
    resources.push({ name: 'Rage', max: rages, current: rages, restoresOn: 'long rest', note: `+${rageDmg} damage` });
  } else if (className === 'Monk') {
    if (level >= 2) {
      resources.push({ name: 'Ki Points', max: level, current: level, restoresOn: 'short rest' });
    }
  } else if (className === 'Cleric') {
    const cdUses = level >= 18 ? 4 : level >= 6 ? 3 : level >= 2 ? 2 : 0;
    if (cdUses > 0) {
      resources.push({ name: 'Channel Divinity', max: cdUses, current: cdUses, restoresOn: 'short rest' });
    }
  } else if (className === 'Druid') {
    if (level >= 2) {
      const wsUses = level >= 17 ? 4 : level >= 6 ? 3 : 2;
      resources.push({ name: 'Wild Shape', max: wsUses, current: wsUses, restoresOn: 'short rest' });
    }
  } else if (className === 'Paladin') {
    const lohPool = level * 5;
    resources.push({ name: 'Lay on Hands', max: lohPool, current: lohPool, restoresOn: 'long rest' });
    if (level >= 3) {
      resources.push({ name: 'Channel Divinity', max: 2, current: 2, restoresOn: 'short rest' });
    }
  } else if (className === 'Sorcerer') {
    if (level >= 2) {
      resources.push({ name: 'Sorcery Points', max: level, current: level, restoresOn: 'long rest' });
    }
  } else if (className === 'Warlock') {
    if (level >= 2) {
      resources.push({ name: 'Magical Cunning', max: 1, current: 1, restoresOn: 'long rest' });
    }
  }
  return resources;
}

function computeAttacks(className, level, scores) {
  const ci = CLASS_DATA[className];
  if (!ci?.attacks) return [];
  const strMod = abilityMod(scores.str || 10);
  const dexMod = abilityMod(scores.dex || 10);
  const profBonus = proficiencyBonus(level);
  const atkMod = className === 'Fighter' ? strMod : dexMod;
  return ci.attacks.map(a => ({
    ...a,
    bonus: atkMod + profBonus,
    damage: a.damage.replace(/[+-]\d+/, `${atkMod >= 0 ? '+' : ''}${atkMod}`),
  }));
}
