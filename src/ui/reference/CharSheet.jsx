import { createSignal, createMemo, For, Show, onMount, onCleanup } from 'solid-js';
import { store, setStore, playerSet, systemSet } from '../../state/index.js';
import { composePersonality } from '../../data/quickBuild.js';
import { getByIndex, getAll } from '../../data/local.js';
import { validateMechanics, applyMechanics } from '../../ai/mechanics.js';

const TIBF_FIELDS = [
  { key: 'trait', label: 'Personality Trait', placeholder: 'A distinctive habit, quirk, or attitude…' },
  { key: 'ideal', label: 'Ideal', placeholder: 'A principle they strive toward…' },
  { key: 'bond', label: 'Bond', placeholder: 'A person, place, or cause they hold dear…' },
  { key: 'flaw', label: 'Flaw', placeholder: 'A weakness, vice, or fear…' },
];

const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

const SKILL_ABILITY = {
  acrobatics: 'dex', 'animal handling': 'wis', arcana: 'int',
  athletics: 'str', deception: 'cha', history: 'int',
  insight: 'wis', intimidation: 'cha', investigation: 'int',
  medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int',
  'sleight of hand': 'dex', stealth: 'dex', survival: 'wis',
};

const ABILITY_NAMES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_FULL = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

const CONDITION_EFFECTS = {
  blinded: 'Auto-fail checks that require sight. Your attacks have disadvantage. Attacks against you have advantage.',
  charmed: 'Can\'t attack the charmer or target them with harmful effects. Charmer has advantage on social checks with you.',
  deafened: 'Auto-fail checks that require hearing.',
  frightened: 'Disadvantage on ability checks and attacks while the source of fear is in sight. Can\'t willingly move closer to it.',
  grappled: 'Speed 0. Ends if the grappler is incapacitated or you\'re forced out of its reach.',
  incapacitated: 'Can\'t take actions or reactions. Speaks only falteringly. Loses concentration.',
  invisible: 'Heavily obscured for hiding purposes. Attacks against you have disadvantage. Your attacks have advantage.',
  paralyzed: 'Incapacitated, can\'t move or speak. Auto-fail STR/DEX saves. Attacks against you have advantage; hits from within 5ft are critical.',
  petrified: 'Weight ×10, stops aging. Incapacitated, unaware of surroundings. Auto-fail STR/DEX saves. Attacks against you have advantage. Resistance to all damage. Immune to poison and disease.',
  poisoned: 'Disadvantage on attack rolls and ability checks.',
  prone: 'Disadvantage on your attacks. Attacks against you have advantage from within 5ft, disadvantage otherwise. Standing costs half your movement.',
  restrained: 'Speed 0. Your attacks have disadvantage; attacks against you have advantage. Disadvantage on DEX saves.',
  stunned: 'Incapacitated, can\'t move, speaks only falteringly. Auto-fail STR/DEX saves. Attacks against you have advantage.',
  unconscious: 'Incapacitated, can\'t move or speak, unaware of surroundings. Drops items and falls prone. Auto-fail STR/DEX saves. Attacks against you have advantage; hits from within 5ft are critical.',
  exhaustion: 'Cumulative. Each level: −2 penalty to every d20 Test, −5ft speed. Level 6 = death. A Long Rest removes 1 level.',
};

const TABS = ['Stats', 'Vitals', 'Spells', 'Features', 'Equipment', 'Bio'];

export default function CharSheet(props) {
  const [activePC, setActivePC] = createSignal(props.initialPC || 0);
  const [activeTab, setActiveTab] = createSignal('Stats');
  const [changedTabs, setChangedTabs] = createSignal(new Set());
  const [expandedSpells, setExpandedSpells] = createSignal(new Set());
  const [expandedFamiliar, setExpandedFamiliar] = createSignal(false);
  const [showFamiliarForm, setShowFamiliarForm] = createSignal(false);
  const [showOverride, setShowOverride] = createSignal(false);
  const [hpDelta, setHpDelta] = createSignal(null);
  const [showAddSpell, setShowAddSpell] = createSignal(false);
  const [spellSearch, setSpellSearch] = createSignal('');
  const [spellSearchResults, setSpellSearchResults] = createSignal([]);
  const [spellDbLoaded, setSpellDbLoaded] = createSignal(false);

  let allSpellsCache = null;

  async function loadSpellDb() {
    if (spellDbLoaded()) return;
    try {
      allSpellsCache = await getAll('spells');
    } catch (_) { allSpellsCache = []; }
    if (!allSpellsCache || allSpellsCache.length === 0) {
      try {
        const resp = await fetch('/data/spells.json');
        allSpellsCache = await resp.json();
      } catch (_) { allSpellsCache = []; }
    }
    setSpellDbLoaded(true);
  }

  function searchSpells(query) {
    if (!allSpellsCache || !query.trim()) { setSpellSearchResults([]); return; }
    const q = query.toLowerCase();
    const known = new Set((pc()?.knownSpells || []).map(s => s.toLowerCase()));
    const knownCantrips = new Set((pc()?.cantrips || []).map(s => s.toLowerCase()));
    const results = allSpellsCache
      .filter(s => s.name.toLowerCase().includes(q) && !known.has(s.name.toLowerCase()) && !knownCantrips.has(s.name.toLowerCase()))
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
      .slice(0, 20);
    setSpellSearchResults(results);
  }

  function addSpellToCharacter(spell) {
    const idx = activePC();
    const p = store.campaign.characters[idx];
    if (!p) return;
    if (spell.level === 0) {
      const updated = [...(p.cantrips || []), spell.name];
      systemSet(`characters.${idx}.cantrips`, updated);
    } else {
      const updated = [...(p.knownSpells || []), spell.name];
      systemSet(`characters.${idx}.knownSpells`, updated);
    }
    setSpellSearch('');
    setSpellSearchResults([]);
    window.dispatchEvent(new CustomEvent('toast', { detail: { text: `Added ${spell.name}` } }));
  }

  function removeSpellFromCharacter(spellName, isCantrip) {
    const idx = activePC();
    const p = store.campaign.characters[idx];
    if (!p) return;
    if (isCantrip) {
      systemSet(`characters.${idx}.cantrips`, (p.cantrips || []).filter(s => s !== spellName));
    } else {
      systemSet(`characters.${idx}.knownSpells`, (p.knownSpells || []).filter(s => s !== spellName));
    }
    window.dispatchEvent(new CustomEvent('toast', { detail: { text: `Removed ${spellName}` } }));
  }

  const pc = () => store.campaign.characters[activePC()] || null;
  const pcCount = () => store.campaign.characters.length;

  // Derived bonuses
  const mod = (score) => Math.floor((score - 10) / 2);
  const profBonus = () => pc() ? Math.floor((pc().level - 1) / 4) + 2 : 2;

  const abilityMod = (key) => {
    const p = pc();
    if (!p || !p.abilityScores) return 0;
    return mod(p.abilityScores[key] || 10);
  };

  const savingThrowBonus = (key) => {
    const base = abilityMod(key);
    const prof = pc()?.savingThrows?.includes(key) ? profBonus() : 0;
    return base + prof;
  };

  const skillBonus = (skillName) => {
    const p = pc();
    if (!p) return 0;
    const abilityKey = SKILL_ABILITY[skillName.toLowerCase()];
    const base = mod(p.abilityScores?.[abilityKey] || 10);
    const skills = p.skills || {};
    const normalizedName = skillName.toLowerCase().replace(/\s+/g, '');
    const isProf = skills[normalizedName] !== undefined || skills[skillName] !== undefined;
    if (isProf) return skills[normalizedName] ?? skills[skillName] ?? base;
    return base;
  };

  const isSkillProficient = (skillName) => {
    const p = pc();
    if (!p || !p.skills) return false;
    const normalized = skillName.toLowerCase().replace(/\s+/g, '');
    return p.skills[normalized] !== undefined || p.skills[skillName] !== undefined;
  };

  const spellSaveDC = () => {
    const p = pc();
    if (!p) return 10;
    const castingAbility = getCastingAbility(p);
    return 8 + profBonus() + mod(p.abilityScores?.[castingAbility] || 10);
  };

  const spellAttackBonus = () => {
    const p = pc();
    if (!p) return 0;
    const castingAbility = getCastingAbility(p);
    return profBonus() + mod(p.abilityScores?.[castingAbility] || 10);
  };

  function getCastingAbility(p) {
    const cls = (p.class || '').toLowerCase();
    if (cls.includes('wizard') || cls.includes('artificer')) return 'int';
    if (cls.includes('cleric') || cls.includes('druid') || cls.includes('ranger')) return 'wis';
    return 'cha';
  }

  const xpProgress = () => {
    const p = pc();
    if (!p) return { pct: 0, current: 0, next: 0, ready: false };
    const lvl = p.level;
    if (lvl >= 20) return { pct: 100, current: p.xp, next: 0, ready: false };
    const current = XP_THRESHOLDS[lvl - 1] || 0;
    const next = XP_THRESHOLDS[lvl] || 999999;
    const pct = Math.min(100, Math.max(0, ((p.xp - current) / (next - current)) * 100));
    return { pct, current: p.xp, next, ready: p.xp >= next };
  };

  const passivePerception = () => {
    const p = pc();
    if (!p) return 10;
    return 10 + skillBonus('perception');
  };

  const hdAvail = () => {
    const p = pc();
    if (!p || !p.hitDice) return 0;
    return p.hitDice.total - p.hitDice.used;
  };

  const slotEntries = () => {
    const p = pc();
    if (!p) return [];
    return Object.entries(p.spellSlots || {}).map(([lvl, max]) => ({
      lvl, max, current: p.currentSlots?.[lvl] ?? max,
    }));
  };

  const carried = () => {
    const p = pc();
    if (!p) return [];
    return store.campaign.inventory.carried[p.id] || [];
  };

  // Swipe handling
  let touchStartX = 0;
  function handleTouchStart(e) { touchStartX = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 50) return;
    const total = pcCount();
    if (total <= 1) return;
    if (dx > 0) setActivePC((activePC() - 1 + total) % total);
    else setActivePC((activePC() + 1) % total);
  }

  // HP adjustment — routed through the hp mechanic so manual edits get the
  // same temp-HP absorption, concentration-save trigger, and death/massive-
  // damage enforcement as AI-driven damage (mechanics.js applyDamage).
  function adjustHP(delta) {
    const idx = activePC();
    const p = store.campaign.characters[idx];
    if (!p) return;
    const newHP = Math.max(0, Math.min(p.hp + delta, p.hpMax));
    const { valid } = validateMechanics([{ key: 'hp', value: `${p.name}=${newHP}`, target: '', applied: false }]);
    applyMechanics(valid);
  }

  function promptCustomHP() {
    const val = prompt('Adjust HP (+/-)');
    if (val === null) return;
    const delta = parseInt(val, 10);
    if (!isNaN(delta)) adjustHP(delta);
  }

  const [spellCache, setSpellCache] = createSignal({});
  async function fetchSpell(name) {
    if (spellCache()[name] !== undefined) return;
    let data = null;
    try { const rows = await getByIndex('spells', 'name', name); data = rows?.[0] || null; } catch (_) {}
    setSpellCache({ ...spellCache(), [name]: data });
  }

  function toggleSpell(name) {
    const s = new Set(expandedSpells());
    if (s.has(name)) s.delete(name); else { s.add(name); fetchSpell(name); }
    setExpandedSpells(s);
  }

  // Cast a leveled spell — spends a slot via the mechanics pipeline (slot_use).
  function castSpell(level) {
    const p = pc();
    if (!p) return;
    const { valid } = validateMechanics([{ key: 'slot_use', value: `${p.name}=${level}`, target: '', applied: false }]);
    applyMechanics(valid);
  }

  const formatMod = (v) => v >= 0 ? `+${v}` : `${v}`;

  // Manual Override: simple form editor for HP, conditions, slots
  function ManualOverride() {
    const [field, setField] = createSignal('hp');
    const [val, setVal] = createSignal('');

    function apply() {
      const idx = activePC();
      const p = store.campaign.characters[idx];
      if (!p) return;
      const v = val().trim();
      if (!v) return;

      switch (field()) {
        case 'hp': {
          const n = parseInt(v, 10);
          if (!isNaN(n)) {
            const target = Math.max(0, Math.min(n, p.hpMax));
            const { valid } = validateMechanics([{ key: 'hp', value: `${p.name}=${target}`, target: '', applied: false }]);
            applyMechanics(valid);
          }
          break;
        }
        case 'tempHp': {
          const n = parseInt(v, 10);
          if (!isNaN(n)) setStore('campaign', 'characters', idx, 'hpTemp', Math.max(0, n));
          break;
        }
        case 'xp': {
          const n = parseInt(v, 10);
          if (!isNaN(n)) setStore('campaign', 'characters', idx, 'xp', Math.max(0, n));
          break;
        }
        case 'exhaustion': {
          const n = parseInt(v, 10);
          if (!isNaN(n)) setStore('campaign', 'characters', idx, 'exhaustion', Math.max(0, Math.min(6, n)));
          break;
        }
        case 'addCondition': {
          const updated = [...p.conditions, { name: v }];
          setStore('campaign', 'characters', idx, 'conditions', updated);
          break;
        }
        case 'addResistance': {
          const existing = p.resistances || [];
          if (!existing.includes(v)) setStore('campaign', 'characters', idx, 'resistances', [...existing, v]);
          break;
        }
        case 'addVulnerability': {
          const existing = p.vulnerabilities || [];
          if (!existing.includes(v)) setStore('campaign', 'characters', idx, 'vulnerabilities', [...existing, v]);
          break;
        }
        case 'addImmunity': {
          const existing = p.immunities || [];
          if (!existing.includes(v)) setStore('campaign', 'characters', idx, 'immunities', [...existing, v]);
          break;
        }
        case 'inspiration': {
          setStore('campaign', 'characters', idx, 'inspiration', v === '1' || v.toLowerCase() === 'true');
          break;
        }
      }
      setVal('');
      window.dispatchEvent(new CustomEvent('toast', { detail: { text: `${field()} updated` } }));
    }

    return (
      <div class="cs-override">
        <div class="cs-override-header">Manual Override</div>
        <div class="cs-override-row">
          <select class="cs-override-select" value={field()} onChange={(e) => setField(e.target.value)}>
            <option value="hp">HP</option>
            <option value="tempHp">Temp HP</option>
            <option value="xp">XP</option>
            <option value="exhaustion">Exhaustion (0-6)</option>
            <option value="addCondition">Add Condition</option>
            <option value="addResistance">Add Resistance</option>
            <option value="addVulnerability">Add Vulnerability</option>
            <option value="addImmunity">Add Immunity</option>
            <option value="inspiration">Inspiration (true/false)</option>
          </select>
          <input
            class="cs-override-input"
            placeholder="Value"
            value={val()}
            onInput={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
          <button class="cs-override-btn" onClick={apply}>Set</button>
        </div>
      </div>
    );
  }

  // ── Tab content renderers ──

  function StatsTab() {
    const p = pc();
    if (!p) return null;
    const scores = p.abilityScores || {};

    return (
      <div class="cs-tab-body">
        <div class="cs-section-label">Ability Scores <span class="cs-own-tag system">system</span></div>
        <div class="cs-ability-grid">
          <For each={ABILITY_NAMES}>
            {(key) => (
              <div class="cs-ability-box" onClick={() => window.dispatchEvent(new CustomEvent('prefill-input', { detail: { text: `${p.name} makes a ${ABILITY_FULL[key]} ability check.` } }))}>
                <div class="cs-ab-abbr">{key.toUpperCase()}</div>
                <div class="cs-ab-score">{scores[key] || 10}</div>
                <div class="cs-ab-mod">{formatMod(mod(scores[key] || 10))}</div>
              </div>
            )}
          </For>
        </div>

        <div class="cs-section-label">Saving Throws</div>
        <For each={ABILITY_NAMES}>
          {(key) => (
            <div class="cs-skill-row" onClick={() => window.dispatchEvent(new CustomEvent('prefill-input', { detail: { text: `${p.name} makes a ${ABILITY_FULL[key]} saving throw.` } }))}>
              <div class={`cs-prof-dot ${p.savingThrows?.includes(key) ? 'proficient' : ''}`} />
              <span class="cs-skill-name">{ABILITY_FULL[key]}</span>
              <span class="cs-skill-bonus">{formatMod(savingThrowBonus(key))}</span>
            </div>
          )}
        </For>

        <div class="cs-section-label">Skills</div>
        <For each={Object.keys(SKILL_ABILITY).sort()}>
          {(skill) => (
            <div class="cs-skill-row" onClick={() => window.dispatchEvent(new CustomEvent('prefill-input', { detail: { text: `${p.name} makes a ${skill.charAt(0).toUpperCase() + skill.slice(1)} check.` } }))}>
              <div class={`cs-prof-dot ${isSkillProficient(skill) ? 'proficient' : ''}`} />
              <span class="cs-skill-name">{skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
              <span class="cs-skill-ability-tag">{SKILL_ABILITY[skill].toUpperCase()}</span>
              <span class="cs-skill-bonus">{formatMod(skillBonus(skill))}</span>
            </div>
          )}
        </For>

        <div class="cs-section-label">Quick Reference</div>
        <div class="cs-stat-row rollable" onClick={() => window.dispatchEvent(new CustomEvent('prefill-input', { detail: { text: `Roll initiative for ${p.name}.` } }))}>
          <span class="cs-stat-label">Initiative</span>
          <span class="cs-stat-value accent">{formatMod(abilityMod('dex'))}</span>
        </div>
        <div class="cs-stat-row">
          <span class="cs-stat-label">Speed</span>
          <span class="cs-stat-value">{p.speed || '30 ft'}</span>
        </div>
        <div class="cs-stat-row">
          <span class="cs-stat-label">Passive Perception</span>
          <span class="cs-stat-value">{passivePerception()}</span>
        </div>
      </div>
    );
  }

  function VitalsTab() {
    const p = pc();
    if (!p) return null;
    const hpPct = () => Math.round((p.hp / (p.hpMax || 1)) * 100);

    return (
      <div class="cs-tab-body">
        <div class="cs-section-label">Hit Points</div>
        <div class="cs-hp-section">
          <div class="cs-hp-bar-row">
            <div class="cs-hp-numbers">
              <span class={hpPct() < 30 ? 'low' : 'ok'}>{p.hp}</span>
              <span class="cs-hp-slash">/</span>
              <span class="cs-hp-max">{p.hpMax}</span>
            </div>
            <div class="cs-hp-bar">
              <div class="cs-hp-fill" style={{ width: `${hpPct()}%` }} />
            </div>
          </div>
          <div class="cs-hp-buttons">
            <button class="cs-hp-btn minus" onClick={() => adjustHP(-5)}>-5</button>
            <button class="cs-hp-btn minus" onClick={() => adjustHP(-1)}>-1</button>
            <button class="cs-hp-btn custom" onClick={promptCustomHP}>+/-</button>
            <button class="cs-hp-btn plus" onClick={() => adjustHP(1)}>+1</button>
            <button class="cs-hp-btn plus" onClick={() => adjustHP(5)}>+5</button>
          </div>
          <Show when={p.hpTemp > 0}>
            <div class="cs-hp-temp">Temp HP: <span>{p.hpTemp}</span></div>
          </Show>
        </div>

        <div class="cs-section-label">Armor Class</div>
        <div class="cs-ac-block">
          <div class="cs-ac-shield">
            <div class="cs-ac-num">{p.ac}</div>
            <div class="cs-ac-label">AC</div>
          </div>
        </div>

        <Show when={p.attacks?.length > 0}>
          <div class="cs-section-label">Attacks <span class="cs-hint">tap to attack</span></div>
          <For each={p.attacks}>
            {(a) => (
              <div class="cs-attack-card" onClick={() => {
                window.dispatchEvent(new CustomEvent('prefill-input', { detail: { text: `${p.name} attacks with ${a.name}.` } }));
                window.dispatchEvent(new CustomEvent('tp-navigate', { detail: { mode: 'play' } }));
              }}>
                <div class="cs-attack-info">
                  <div class="cs-attack-name">{a.name}</div>
                  <div class="cs-attack-stats"><span class="accent">+{a.bonus}</span> to hit | <span class="accent">{a.damage}</span></div>
                </div>
              </div>
            )}
          </For>
        </Show>

        <div class="cs-section-label">Conditions</div>
        <Show when={p.concentration}>
          <div class="cs-conc-pinned">
            <span class="cs-conc-icon">●</span>
            <div class="cs-conc-info">
              <div class="cs-conc-label">Concentrating</div>
              <div class="cs-conc-spell">{p.concentration?.spell || p.concentration}</div>
            </div>
          </div>
        </Show>
        <Show when={p.conditions.length > 0} fallback={<div class="cs-muted">No conditions</div>}>
          <div class="cs-condition-list">
            <For each={p.conditions}>
              {(c, idx) => {
                const name = () => c.name || c;
                const effect = () => CONDITION_EFFECTS[name().toLowerCase()] || null;
                return (
                  <div class="cs-condition-card">
                    <div class="cs-condition-header">
                      <span class="cs-condition-name">{name()}</span>
                      <button class="cs-condition-remove" onClick={() => {
                        const i = activePC();
                        const updated = store.campaign.characters[i].conditions.filter((_, j) => j !== idx());
                        setStore('campaign', 'characters', i, 'conditions', updated);
                      }}>×</button>
                    </div>
                    <Show when={effect()}>
                      <div class="cs-condition-effect">{effect()}</div>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>

        <Show when={p.resistances?.length || p.vulnerabilities?.length || p.immunities?.length}>
          <div class="cs-section-label">Damage Modifiers</div>
          <div class="cs-dmg-modifiers">
            <Show when={p.resistances?.length}>
              <div class="cs-dmg-row resist">
                <span class="cs-dmg-label">Resist</span>
                <div class="cs-dmg-tags">
                  <For each={p.resistances}>{(r) => <span class="cs-dmg-tag resist">{r}</span>}</For>
                </div>
              </div>
            </Show>
            <Show when={p.vulnerabilities?.length}>
              <div class="cs-dmg-row vuln">
                <span class="cs-dmg-label">Vulnerable</span>
                <div class="cs-dmg-tags">
                  <For each={p.vulnerabilities}>{(r) => <span class="cs-dmg-tag vuln">{r}</span>}</For>
                </div>
              </div>
            </Show>
            <Show when={p.immunities?.length}>
              <div class="cs-dmg-row immune">
                <span class="cs-dmg-label">Immune</span>
                <div class="cs-dmg-tags">
                  <For each={p.immunities}>{(r) => <span class="cs-dmg-tag immune">{r}</span>}</For>
                </div>
              </div>
            </Show>
          </div>
        </Show>

        <div class="cs-section-label">Hit Dice</div>
        <div class="cs-hit-dice-row">
          <span class="cs-hd-die">{p.hitDice?.die || 'd8'}</span>
          <div class="cs-dice-pips">
            <For each={Array.from({ length: p.hitDice?.total || 1 })}>
              {(_, idx) => (
                <div class={`cs-dice-pip ${idx() < hdAvail() ? 'available' : 'used'}`} />
              )}
            </For>
          </div>
          <span class="cs-hd-count">{hdAvail()}/{p.hitDice?.total || 0}</span>
        </div>

        <div class="cs-section-label">Death Saves</div>
        <div class="cs-death-saves">
          <div class="cs-ds-group">
            <span class="cs-ds-label">✓</span>
            <For each={[0, 1, 2]}>
              {(i) => <div class={`cs-ds-pip success ${(p.deathSaves?.successes || 0) > i ? 'filled' : ''}`} />}
            </For>
          </div>
          <div class="cs-ds-group">
            <span class="cs-ds-label">✗</span>
            <For each={[0, 1, 2]}>
              {(i) => <div class={`cs-ds-pip fail ${(p.deathSaves?.failures || 0) > i ? 'filled' : ''}`} />}
            </For>
          </div>
        </div>

        <div class="cs-section-label">Exhaustion</div>
        <div class="cs-exhaustion-pips">
          <For each={[1, 2, 3, 4, 5, 6]}>
            {(lvl) => <div class={`cs-exh-pip ${(p.exhaustion || 0) >= lvl ? 'filled' : ''}`}>{lvl}</div>}
          </For>
          <span class="cs-exh-label">{p.exhaustion || 0 > 0 ? `Level ${p.exhaustion}` : 'None'}</span>
        </div>

        <Show when={!p.familiar}>
          <Show when={showFamiliarForm()} fallback={
            <button class="cs-link-familiar-btn" onClick={() => setShowFamiliarForm(true)}>
              <i class="ph ph-paw-print" /> Link Familiar
            </button>
          }>
            <LinkFamiliarForm pcIdx={activePC()} onDone={() => setShowFamiliarForm(false)} />
          </Show>
        </Show>

        <Show when={p.familiar}>
          <div class="cs-section-label">Familiar</div>
          <div class="cs-familiar-card">
            <div class="cs-familiar-header" onClick={() => setExpandedFamiliar(!expandedFamiliar())}>
              <div class="cs-familiar-icon">{p.familiar.species === 'Owl' ? '🦉' : p.familiar.species === 'Cat' ? '🐱' : p.familiar.species === 'Hawk' ? '🦅' : p.familiar.species === 'Snake' ? '🐍' : p.familiar.species === 'Raven' ? '🐦‍⬛' : p.familiar.species === 'Rat' ? '🐀' : p.familiar.species === 'Frog' ? '🐸' : p.familiar.species === 'Spider' ? '🕷️' : '🐾'}</div>
              <div class="cs-familiar-info">
                <div class="cs-familiar-name">{p.familiar.name || 'Familiar'}</div>
                <div class="cs-familiar-type">{[p.familiar.species || p.familiar.form, p.familiar.type && `${p.familiar.type} Spirit`, p.familiar.source].filter(Boolean).join(' · ')}</div>
              </div>
              <span class={`cs-familiar-status ${p.familiar.status || 'active'}`}>{(p.familiar.status || 'active').toUpperCase()}</span>
              <div class="cs-familiar-summary">
                <span class="cs-fam-stat">HP <b>{p.familiar.hp ?? 1}/{p.familiar.hpMax ?? 1}</b></span>
                <span class="cs-fam-stat">AC <b>{p.familiar.ac ?? 10}</b></span>
              </div>
              <span class="cs-familiar-toggle">{expandedFamiliar() ? '▲' : '▼'}</span>
            </div>
            <Show when={expandedFamiliar()}>
              <div class="cs-familiar-detail">
                <div class="cs-familiar-vitals">
                  <div class="cs-fam-vital"><div class="cs-fam-vital-label">HP</div><div class="cs-fam-vital-val">{p.familiar.hp ?? 1}/{p.familiar.hpMax ?? 1}</div></div>
                  <div class="cs-fam-vital"><div class="cs-fam-vital-label">AC</div><div class="cs-fam-vital-val">{p.familiar.ac ?? 10}</div></div>
                  <Show when={p.familiar.speeds?.walk}><div class="cs-fam-vital"><div class="cs-fam-vital-label">Walk</div><div class="cs-fam-vital-val">{p.familiar.speeds.walk} ft</div></div></Show>
                  <Show when={p.familiar.speeds?.fly}><div class="cs-fam-vital"><div class="cs-fam-vital-label">Fly</div><div class="cs-fam-vital-val">{p.familiar.speeds.fly} ft</div></div></Show>
                  <Show when={p.familiar.speeds?.swim}><div class="cs-fam-vital"><div class="cs-fam-vital-label">Swim</div><div class="cs-fam-vital-val">{p.familiar.speeds.swim} ft</div></div></Show>
                  <Show when={p.familiar.size}><div class="cs-fam-vital"><div class="cs-fam-vital-label">Size</div><div class="cs-fam-vital-val">{p.familiar.size}</div></div></Show>
                </div>

                <Show when={p.familiar.abilities && typeof p.familiar.abilities === 'object' && p.familiar.abilities.str !== undefined}>
                  <div class="cs-familiar-ab-grid">
                    <For each={['str', 'dex', 'con', 'int', 'wis', 'cha']}>
                      {(ab) => {
                        const score = () => p.familiar.abilities[ab] ?? 10;
                        const modifier = () => Math.floor((score() - 10) / 2);
                        return (
                          <div class="cs-fam-ab">
                            <div class="cs-fam-ab-label">{ab.toUpperCase()}</div>
                            <div class="cs-fam-ab-score">{score()}</div>
                            <div class="cs-fam-ab-mod">{modifier() >= 0 ? `+${modifier()}` : modifier()}</div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>

                <Show when={typeof p.familiar.abilities === 'string'}>
                  <div class="cs-familiar-text">{p.familiar.abilities}</div>
                </Show>

                <Show when={p.familiar.senses || p.familiar.passivePerception}>
                  <div class="cs-familiar-senses">
                    <span class="cs-fam-sense-label">Senses</span>
                    {[p.familiar.senses, p.familiar.passivePerception && `Passive Perception ${p.familiar.passivePerception}`].filter(Boolean).join(' · ')}
                  </div>
                </Show>

                <Show when={p.familiar.skills}>
                  <div class="cs-familiar-senses">
                    <span class="cs-fam-sense-label">Skills</span>
                    {p.familiar.skills}
                  </div>
                </Show>

                <Show when={p.familiar.specialAbilities?.length}>
                  <div class="cs-familiar-specials">
                    <div class="cs-fam-spec-label">Special Abilities</div>
                    <For each={p.familiar.specialAbilities}>
                      {(sa) => <div class="cs-fam-spec"><b>{typeof sa === 'string' ? sa : sa.name}</b>{typeof sa === 'object' && sa.desc ? ` — ${sa.desc}` : ''}</div>}
                    </For>
                  </div>
                </Show>

                <div class="cs-familiar-specials">
                  <div class="cs-fam-spec-label">Familiar Actions</div>
                  <div class="cs-fam-spec">Can take the <b>Help</b> action (gives ally advantage). Can deliver <b>touch spells</b> cast by master. Cannot attack.</div>
                </div>

                <div class="cs-familiar-actions-row">
                  <button class="cs-fam-action-btn" onClick={() => window.dispatchEvent(new CustomEvent('prefill-input', { detail: { text: `${p.name} looks through ${p.familiar.name}'s eyes.` } }))}>
                    <i class="ph ph-eye" /> See Through Eyes
                  </button>
                  <button class="cs-fam-action-btn" onClick={() => window.dispatchEvent(new CustomEvent('prefill-input', { detail: { text: `${p.name} dismisses ${p.familiar.name} into a pocket dimension.` } }))}>
                    <i class="ph ph-moon" /> Dismiss
                  </button>
                  <button class="cs-fam-action-btn" onClick={() => window.dispatchEvent(new CustomEvent('prefill-input', { detail: { text: `${p.name} resummons ${p.familiar.name} (10gp worth of incense).` } }))}>
                    <i class="ph ph-arrows-clockwise" /> Resummon
                  </button>
                </div>
              </div>
            </Show>
          </div>
        </Show>

        <div class="cs-section-label">Rest</div>
        <div class="cs-rest-buttons">
          <button class="cs-rest-btn" onClick={() => window.dispatchEvent(new CustomEvent('rest-request', { detail: { type: 'short', pc: p.name } }))}>
            <span class="cs-rest-icon">☀</span> Short Rest
          </button>
          <button class="cs-rest-btn" onClick={() => window.dispatchEvent(new CustomEvent('rest-request', { detail: { type: 'long', pc: p.name } }))}>
            <span class="cs-rest-icon">☾</span> Long Rest
          </button>
        </div>
      </div>
    );
  }

  function SpellsTab() {
    const p = pc();
    if (!p) return null;
    const castingAbility = getCastingAbility(p);

    // Inline spell detail (fetched from the compendium) + cast-at-level chips.
    function SpellDetail(dp) {
      const sp = () => spellCache()[dp.name];
      const lvl = () => sp()?.level || (dp.cantrip ? 0 : 1);
      const castable = () => slotEntries().filter(s => Number(s.lvl) >= lvl() && s.current > 0);
      return (
        <div class="cs-spell-detail" onClick={(e) => e.stopPropagation()}>
          <Show when={sp() === undefined}><div class="cs-spell-meta">Loading…</div></Show>
          <Show when={sp() === null}><div class="cs-spell-meta cs-muted">No reference entry — narrative-only spell.</div></Show>
          <Show when={sp()}>
            <div class="cs-spell-meta">{[sp().level ? `Level ${sp().level}` : 'Cantrip', sp().school].filter(Boolean).join(' · ')}</div>
            <Show when={sp().castingTime || sp().range || sp().duration || sp().components}>
              <div class="cs-spell-stats">
                <Show when={sp().castingTime}><span><i class="ph ph-clock" />{sp().castingTime}</span></Show>
                <Show when={sp().range}><span><i class="ph ph-target" />{sp().range}</span></Show>
                <Show when={sp().duration}><span><i class="ph ph-hourglass" />{sp().duration}</span></Show>
                <Show when={sp().components}>
                  <span class={sp().components?.match(/\d+\s*gp/) ? 'cs-comp-costly' : ''}>
                    {sp().components}
                  </span>
                </Show>
              </div>
            </Show>
            <div class="cs-spell-desc">{sp().description || sp().content || 'No description recorded.'}</div>
          </Show>
          <Show when={!dp.cantrip && castable().length > 0}>
            <div class="cs-spell-cast">
              <span class="cs-cast-label">Cast at</span>
              <For each={castable()}>
                {(s) => <button class="cs-cast-chip" onClick={() => castSpell(s.lvl)}>{ordinal(s.lvl)}</button>}
              </For>
            </div>
          </Show>
        </div>
      );
    }

    return (
      <div class="cs-tab-body">
        <div class="cs-section-label">Spellcasting</div>
        <div class="cs-spellcasting-stats">
          <div class="cs-sc-stat">
            <div class="cs-sc-label">Spell DC</div>
            <div class="cs-sc-value">{spellSaveDC()}</div>
          </div>
          <div class="cs-sc-stat rollable" onClick={() => window.dispatchEvent(new CustomEvent('prefill-input', { detail: { text: `${p.name} makes a spell attack.` } }))}>
            <div class="cs-sc-label">Spell Atk</div>
            <div class="cs-sc-value accent">{formatMod(spellAttackBonus())}</div>
          </div>
          <div class="cs-sc-stat">
            <div class="cs-sc-label">Ability</div>
            <div class="cs-sc-value">{castingAbility.toUpperCase()}</div>
          </div>
        </div>

        <Show when={p.concentration}>
          <div class="cs-conc-pinned">
            <span class="cs-conc-icon">●</span>
            <div class="cs-conc-info">
              <div class="cs-conc-label">Concentrating</div>
              <div class="cs-conc-spell">{p.concentration?.spell || p.concentration}</div>
            </div>
            <button class="cs-conc-end" onClick={() => setStore('campaign', 'characters', activePC(), 'concentration', null)}>End</button>
          </div>
        </Show>

        <Show when={slotEntries().length > 0}>
          <div class="cs-section-label">Spell Slots</div>
          <For each={slotEntries()}>
            {(s) => (
              <div class="cs-slot-bar">
                <span class="cs-slot-level">{ordinal(s.lvl)}</span>
                <div class="cs-slot-pips">
                  <For each={Array.from({ length: s.max })}>
                    {(_, i) => <div class={`cs-slot-pip ${i() < s.current ? 'available' : ''}`} />}
                  </For>
                </div>
                <span class="cs-slot-count">{s.current}/{s.max}</span>
              </div>
            )}
          </For>
        </Show>

        <Show when={p.cantrips?.length > 0}>
          <div class="cs-section-label">Cantrips</div>
          <For each={p.cantrips}>
            {(spell) => (
              <div class="cs-spell-card" onClick={() => toggleSpell(spell)}>
                <div class="cs-spell-header">
                  <div class="cs-spell-badge cantrip">C</div>
                  <span class="cs-spell-name">{spell}</span>
                  <span class="cs-spell-tag cantrip">Cantrip</span>
                  <i class={`ph ph-caret-${expandedSpells().has(spell) ? 'down' : 'right'} cs-spell-caret`} />
                </div>
                <Show when={expandedSpells().has(spell)}>
                  {SpellDetail({ name: spell, cantrip: true })}
                  <button class="cs-spell-remove" onClick={(e) => { e.stopPropagation(); removeSpellFromCharacter(spell, true); }}>Remove</button>
                </Show>
              </div>
            )}
          </For>
        </Show>

        <Show when={p.knownSpells?.length > 0}>
          <div class="cs-section-label">Known Spells</div>
          <For each={p.knownSpells}>
            {(spell) => (
              <div class="cs-spell-card" onClick={() => toggleSpell(spell)}>
                <div class="cs-spell-header">
                  <div class="cs-spell-badge">S</div>
                  <span class="cs-spell-name">{spell}</span>
                  <i class={`ph ph-caret-${expandedSpells().has(spell) ? 'down' : 'right'} cs-spell-caret`} />
                </div>
                <Show when={expandedSpells().has(spell)}>
                  {SpellDetail({ name: spell })}
                  <button class="cs-spell-remove" onClick={(e) => { e.stopPropagation(); removeSpellFromCharacter(spell, false); }}>Remove</button>
                </Show>
              </div>
            )}
          </For>
        </Show>

        <div class="cs-spell-add-section">
          <Show when={!showAddSpell()}>
            <button class="cs-spell-add-btn" onClick={() => { setShowAddSpell(true); loadSpellDb(); }}>+ Add Spell</button>
          </Show>
          <Show when={showAddSpell()}>
            <div class="cs-spell-search-box">
              <input
                type="text"
                class="cs-spell-search-input"
                placeholder="Search all spells..."
                value={spellSearch()}
                onInput={(e) => { setSpellSearch(e.target.value); searchSpells(e.target.value); }}
                autofocus
              />
              <button class="cs-spell-search-close" onClick={() => { setShowAddSpell(false); setSpellSearch(''); setSpellSearchResults([]); }}>&times;</button>
            </div>
            <Show when={spellSearchResults().length > 0}>
              <div class="cs-spell-search-results">
                <For each={spellSearchResults()}>
                  {(spell) => (
                    <button class="cs-spell-result" onClick={() => addSpellToCharacter(spell)}>
                      <span class="cs-spell-result-name">{spell.name}</span>
                      <span class="cs-spell-result-lvl">{spell.level === 0 ? 'Cantrip' : `Lv${spell.level}`}</span>
                      <Show when={spell.classes?.length > 0}>
                        <span class="cs-spell-result-classes">{spell.classes.join(', ')}</span>
                      </Show>
                    </button>
                  )}
                </For>
              </div>
            </Show>
            <Show when={spellSearch().length > 0 && spellSearchResults().length === 0 && spellDbLoaded()}>
              <div class="cs-spell-no-results">
                No matching spells found.
                <button class="cs-spell-manual-add" onClick={() => {
                  addSpellToCharacter({ name: spellSearch().trim(), level: 1 });
                  setShowAddSpell(false);
                }}>Add "{spellSearch().trim()}" manually</button>
              </div>
            </Show>
          </Show>
        </div>
      </div>
    );
  }

  function FeaturesTab() {
    const p = pc();
    if (!p) return null;

    return (
      <div class="cs-tab-body">
        <div class="cs-section-label">Class Features & Feats <span class="cs-own-tag system">system</span></div>
        <Show when={p.features?.length > 0} fallback={<div class="cs-muted">No features recorded</div>}>
          <div class="cs-features-list">
            <For each={p.features}>
              {(f) => (
                <div class="cs-feature-item">
                  <span class="cs-feature-name">{typeof f === 'string' ? f : (f.name || f)}</span>
                  <Show when={typeof f === 'object' && f.desc}>
                    <div class="cs-feature-desc">{f.desc}</div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={p.resources?.length > 0}>
          <div class="cs-section-label">Resources</div>
          <For each={p.resources}>
            {(r) => (
              <div class="cs-resource-row">
                <span class="cs-resource-name">{r.name}</span>
                <div class="cs-resource-pips">
                  <For each={Array.from({ length: r.max })}>
                    {(_, i) => <div class={`cs-resource-pip ${i() < r.current ? 'available' : ''}`} />}
                  </For>
                </div>
                <span class="cs-resource-rest-tag">{r.restoresOn || ''}</span>
              </div>
            )}
          </For>
        </Show>

        <Show when={p.languages?.length > 0}>
          <div class="cs-section-label">Languages</div>
          <div class="cs-tag-wrap">
            <For each={p.languages}>{(l) => <span class="cs-bio-tag">{l}</span>}</For>
          </div>
        </Show>

        <Show when={p.proficiencies?.length > 0}>
          <div class="cs-section-label">Proficiencies</div>
          <div class="cs-tag-wrap">
            <For each={p.proficiencies}>{(pr) => <span class="cs-bio-tag">{pr}</span>}</For>
          </div>
        </Show>
      </div>
    );
  }

  function EquipmentTab() {
    const p = pc();
    if (!p) return null;
    const items = carried();
    const gold = store.campaign.gold;

    const totalWeight = () => items.reduce((s, i) => s + (Number(i.weight) || 0) * (Number(i.qty) || 1), 0);
    const str = () => p.abilityScores?.str || 10;
    const capacity = () => str() * 15;
    const encumbranceLevel = () => (totalWeight() > capacity() ? 'over' : 'ok');
    const encumbranceText = () => (encumbranceLevel() === 'over' ? 'Over capacity! Cannot pick up or carry more.' : '');

    return (
      <div class="cs-tab-body">
        <div class="cs-section-label">Carrying Capacity <span class="cs-hint">STR {str()} × 15 = {capacity()} lb</span></div>
        <Show when={totalWeight() > 0 || items.length > 0}>
          <div class={`cs-encumbrance ${encumbranceLevel()}`}>
            <div class="cs-enc-bar">
              <div class="cs-enc-fill" style={{ width: `${Math.min(100, (totalWeight() / capacity()) * 100)}%` }} />
            </div>
            <div class="cs-enc-text">
              <span>{totalWeight()} / {capacity()} lb</span>
              <Show when={encumbranceText()}>
                <span class="cs-enc-warning">{encumbranceText()}</span>
              </Show>
            </div>
          </div>
        </Show>

        <Show when={items.length > 0} fallback={<div class="cs-muted">No items carried</div>}>
          <div class="cs-section-label">Carried Items</div>
          <For each={items}>
            {(item) => (
              <div class="cs-equip-card">
                <div class="cs-equip-info">
                  <div class="cs-equip-name">{item.name}</div>
                  <Show when={item.detail}><div class="cs-equip-detail">{item.detail}</div></Show>
                </div>
                <div class="cs-equip-meta">
                  <Show when={item.qty > 1}><span class="cs-equip-qty">x{item.qty}</span></Show>
                  <Show when={Number(item.weight) > 0}><span class="cs-equip-wt">{(Number(item.weight) * (Number(item.qty) || 1))} lb</span></Show>
                  <Show when={item.attunement === 'attuned'}><span class="cs-equip-attuned">A</span></Show>
                  <Show when={item.type}><span class={`cs-item-type-tag ${item.type}`}>{item.type}</span></Show>
                </div>
              </div>
            )}
          </For>
        </Show>

        <div class="cs-section-label">Party Currency</div>
        <div class="cs-currency-bar">
          <div class="cs-currency-item"><div class="cs-coin-label">CP</div><div class="cs-coin-val">{gold.cp}</div></div>
          <div class="cs-currency-item"><div class="cs-coin-label">SP</div><div class="cs-coin-val">{gold.sp}</div></div>
          <div class="cs-currency-item"><div class="cs-coin-label">GP</div><div class="cs-coin-val gold">{gold.gp}</div></div>
          <div class="cs-currency-item"><div class="cs-coin-label">EP</div><div class="cs-coin-val">{gold.ep}</div></div>
          <div class="cs-currency-item"><div class="cs-coin-label">PP</div><div class="cs-coin-val">{gold.pp}</div></div>
        </div>
      </div>
    );
  }

  function BioTab() {
    const p = pc();
    if (!p) return null;

    return (
      <div class="cs-tab-body">
        <div class="cs-section-label">Identity <span class="cs-own-tag system">system</span></div>
        <div class="cs-bio-section">
          <div class="cs-bio-field"><span class="cs-bio-label">Race</span><span class="cs-bio-value">{p.race}</span></div>
          <div class="cs-bio-field"><span class="cs-bio-label">Class</span><span class="cs-bio-value">{p.class}{p.subclass ? ` (${p.subclass})` : ''}</span></div>
          <div class="cs-bio-field"><span class="cs-bio-label">Background</span><span class="cs-bio-value">{p.background || '—'}</span></div>
          <div class="cs-bio-field"><span class="cs-bio-label">Alignment</span><span class="cs-bio-value">{p.alignment || '—'}</span></div>
        </div>

        <EditableBio label="Appearance" field="appearance" value={p.appearance} placeholder="No appearance set. Tap edit to describe how they look." />

        <div class="cs-section-label">Personality <span class="cs-own-tag player">player</span></div>
        <For each={TIBF_FIELDS}>
          {(f) => <TraitField fieldKey={f.key} label={f.label} placeholder={f.placeholder} />}
        </For>
        <Show when={!hasTraits(p) && p.personality}>
          <div class="cs-bio-section"><div class="cs-bio-text">{p.personality}</div></div>
        </Show>

        <EditableBio label="Backstory" field="backstory" value={p.backstory} placeholder="No backstory yet. Origin, motivation, secrets…" rows={8} />
        <EditableBio label="Notes" field="notes" value={p.notes} placeholder="Player notes — anything you want to remember." rows={4} />
      </div>
    );
  }

  function hasTraits(p) {
    const t = p.traits;
    return !!(t && (t.trait || t.ideal || t.bond || t.flaw));
  }

  // Save one Trait/Ideal/Bond/Flaw field. Writes the whole traits object (avoids
  // nested-path issues on legacy characters) and recomposes the personality
  // string so the game engine still sees the roleplay text.
  function saveTrait(key, value) {
    const i = activePC();
    const cur = store.campaign.characters[i]?.traits || { trait: '', ideal: '', bond: '', flaw: '' };
    const updated = { ...cur, [key]: value };
    playerSet(`characters.${i}.traits`, updated);
    playerSet(`characters.${i}.personality`, composePersonality(updated));
  }

  // Inline editor for a single TIBF field.
  function TraitField(props) {
    const [editing, setEditing] = createSignal(false);
    const [draft, setDraft] = createSignal('');
    const value = () => pc()?.traits?.[props.fieldKey] || '';

    function startEdit() { setDraft(value()); setEditing(true); }
    function save() { saveTrait(props.fieldKey, draft()); setEditing(false); }

    return (
      <div class="cs-trait-field">
        <div class="cs-trait-head">
          <span class="cs-trait-label">{props.label}</span>
          <Show when={!editing()}>
            <button class="cs-bio-edit" onClick={startEdit}>{value() ? 'Edit' : '+ Add'}</button>
          </Show>
        </div>
        <Show
          when={editing()}
          fallback={<div class={`cs-trait-text ${value() ? '' : 'empty'}`}>{value() || props.placeholder}</div>}
        >
          <textarea
            class="cs-bio-input"
            rows="2"
            value={draft()}
            placeholder={props.placeholder}
            onInput={(e) => setDraft(e.target.value)}
          />
          <div class="cs-bio-actions">
            <button class="cs-bio-cancel" onClick={() => setEditing(false)}>Cancel</button>
            <button class="cs-bio-save" onClick={save}>Save</button>
          </div>
        </Show>
      </div>
    );
  }

  // Inline editor for player-owned Bio fields. Writes through playerSet so the
  // ownership guard and Firebase sync both fire — this is what persists the text.
  function EditableBio(props) {
    const [editing, setEditing] = createSignal(false);
    const [draft, setDraft] = createSignal('');

    function startEdit() {
      setDraft(props.value || '');
      setEditing(true);
    }
    function save() {
      playerSet(`characters.${activePC()}.${props.field}`, draft());
      setEditing(false);
    }

    return (
      <>
        <div class="cs-section-label">
          {props.label} <span class="cs-own-tag player">player</span>
          <Show when={!editing()}>
            <button class="cs-bio-edit" onClick={startEdit}>{props.value ? 'Edit' : '+ Add'}</button>
          </Show>
        </div>
        <div class="cs-bio-section">
          <Show
            when={editing()}
            fallback={<div class="cs-bio-text">{props.value || props.placeholder}</div>}
          >
            <textarea
              class="cs-bio-input"
              rows={props.rows || 3}
              value={draft()}
              placeholder={props.placeholder}
              onInput={(e) => setDraft(e.target.value)}
            />
            <div class="cs-bio-actions">
              <button class="cs-bio-cancel" onClick={() => setEditing(false)}>Cancel</button>
              <button class="cs-bio-save" onClick={save}>Save</button>
            </div>
          </Show>
        </div>
      </>
    );
  }

  function ordinal(n) {
    const num = parseInt(n, 10);
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  return (
    <div class="cs-overlay" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header */}
      <div class="cs-header-bar">
        <div class="cs-header-main">
          <div class="cs-avatar" style={{ 'border-color': pc()?.color || 'var(--color-accent)' }}>
            {pc()?.name?.charAt(0) || '?'}
          </div>
          <div class="cs-header-info">
            <div class="cs-pc-name">
              {pc()?.name}
              <Show when={pc()?.inspiration}><span class="cs-inspiration">★</span></Show>
            </div>
            <div class="cs-pc-subtitle">
              {pc()?.class}{pc()?.subclass ? ` (${pc()?.subclass})` : ''} Lv.{pc()?.level} — {pc()?.race}
            </div>
          </div>
          <button class="cs-close-btn" onClick={props.onClose}>✕</button>
        </div>
      </div>

      {/* Quick stats */}
      <div class="cs-quick-stats">
        <span class={`cs-qs-hp ${pc()?.hp < (pc()?.hpMax || 1) * 0.3 ? 'low' : ''}`}>{pc()?.hp}/{pc()?.hpMax} HP</span>
        <span class="cs-qs-sep">|</span>
        <span>AC {pc()?.ac}</span>
        <span class="cs-qs-sep">|</span>
        <span>Prof +{profBonus()}</span>
        <span class="cs-qs-sep">|</span>
        <span>HD {hdAvail()}/{pc()?.hitDice?.total || 0}</span>
      </div>

      {/* XP Bar */}
      <div class="cs-xp-bar-row">
        <div class="cs-xp-track">
          <div class={`cs-xp-fill ${xpProgress().ready ? 'ready' : ''}`} style={{ width: `${xpProgress().pct}%` }} />
        </div>
        <span class="cs-xp-nums">
          {xpProgress().current} XP{xpProgress().next > 0 ? ` / ${xpProgress().next}` : ''}
        </span>
        <Show when={xpProgress().ready}>
          <button class="cs-levelup-btn" onClick={() => {
            if (props.onClose) props.onClose();
            window.dispatchEvent(new CustomEvent('tp-levelup', { detail: { pcIndex: activePC() } }));
          }}>
            <i class="ph ph-star" /> Level Up
          </button>
        </Show>
      </div>

      {/* Swipe indicator */}
      <Show when={pcCount() > 1}>
        <div class="cs-swipe-indicator">
          <span>◀</span>
          <For each={store.campaign.characters}>
            {(_, idx) => <div class={`cs-swipe-dot ${idx() === activePC() ? 'active' : ''}`} />}
          </For>
          <span>▶</span>
        </div>
      </Show>

      {/* Tab bar */}
      <div class="cs-tab-bar">
        <For each={TABS}>
          {(tab) => (
            <div
              class={`cs-tab ${activeTab() === tab ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab); setChangedTabs(prev => { const s = new Set(prev); s.delete(tab); return s; }); }}
            >
              {tab}
              <Show when={changedTabs().has(tab)}>
                <div class="cs-changed-dot" />
              </Show>
            </div>
          )}
        </For>
      </div>

      {/* Tab content */}
      <div class="cs-tab-content">
        <Show when={activeTab() === 'Stats'}><StatsTab /></Show>
        <Show when={activeTab() === 'Vitals'}><VitalsTab /></Show>
        <Show when={activeTab() === 'Spells'}><SpellsTab /></Show>
        <Show when={activeTab() === 'Features'}><FeaturesTab /></Show>
        <Show when={activeTab() === 'Equipment'}><EquipmentTab /></Show>
        <Show when={activeTab() === 'Bio'}><BioTab /></Show>
      </div>

      {/* Edit bar */}
      <div class="cs-edit-bar">
        <button class="cs-edit-btn" onClick={() => setShowOverride(!showOverride())}>
          {showOverride() ? '▾ Manual Override' : '▸ Manual Override'}
        </button>
      </div>
      <Show when={showOverride()}>
        <ManualOverride />
      </Show>
    </div>
  );
}

function LinkFamiliarForm({ pcIdx, onDone }) {
  const RAVEN_DEFAULTS = { name: '', species: 'Raven', hpMax: 1, ac: 12, walk: 10, fly: 50 };
  const [form, setForm] = createSignal({ ...RAVEN_DEFAULTS });
  const patch = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const SPECIES = ['Raven', 'Owl', 'Hawk', 'Cat', 'Snake', 'Rat', 'Frog', 'Spider', 'Other'];

  function save() {
    const f = form();
    if (!f.name.trim()) return;
    const familiar = {
      name: f.name.trim(),
      species: f.species,
      type: 'Fey',
      size: 'Tiny',
      hp: parseInt(f.hpMax) || 1,
      hpMax: parseInt(f.hpMax) || 1,
      ac: parseInt(f.ac) || 10,
      speeds: { walk: parseInt(f.walk) || 10, ...(f.fly ? { fly: parseInt(f.fly) } : {}) },
      abilities: { str: 2, dex: 14, con: 8, int: 2, wis: 12, cha: 6 },
      senses: 'Darkvision 30 ft.',
      passivePerception: 11,
      skills: 'Perception +3',
      specialAbilities: [],
      status: 'active',
      source: 'Find Familiar',
    };
    setStore('campaign', 'characters', pcIdx, 'familiar', familiar);
    onDone();
  }

  return (
    <div class="cs-familiar-form">
      <div class="cs-familiar-form-title">Link Familiar</div>
      <input class="cs-fam-input" placeholder="Name (e.g. Kael)" value={form().name} onInput={e => patch('name', e.target.value)} />
      <select class="cs-fam-input" value={form().species} onInput={e => patch('species', e.target.value)}>
        <For each={SPECIES}>{s => <option value={s}>{s}</option>}</For>
      </select>
      <div class="cs-fam-form-row">
        <label class="cs-fam-form-label">HP Max<input class="cs-fam-num" type="number" min="1" value={form().hpMax} onInput={e => patch('hpMax', e.target.value)} /></label>
        <label class="cs-fam-form-label">AC<input class="cs-fam-num" type="number" min="1" value={form().ac} onInput={e => patch('ac', e.target.value)} /></label>
        <label class="cs-fam-form-label">Walk<input class="cs-fam-num" type="number" min="0" value={form().walk} onInput={e => patch('walk', e.target.value)} /></label>
        <label class="cs-fam-form-label">Fly<input class="cs-fam-num" type="number" min="0" value={form().fly} onInput={e => patch('fly', e.target.value)} /></label>
      </div>
      <div class="cs-fam-form-btns">
        <button class="cs-fam-save-btn" onClick={save} disabled={!form().name.trim()}>Save</button>
        <button class="cs-fam-cancel-btn" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}
