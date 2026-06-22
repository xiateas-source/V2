import { createSignal, createMemo, For, Show, onMount, onCleanup } from 'solid-js';
import { store, setStore } from '../../state/index.js';

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

const TABS = ['Stats', 'Vitals', 'Spells', 'Features', 'Equipment', 'Bio'];

export default function CharSheet(props) {
  const [activePC, setActivePC] = createSignal(props.initialPC || 0);
  const [activeTab, setActiveTab] = createSignal('Stats');
  const [changedTabs, setChangedTabs] = createSignal(new Set());
  const [expandedSpells, setExpandedSpells] = createSignal(new Set());
  const [expandedFamiliar, setExpandedFamiliar] = createSignal(false);
  const [showOverride, setShowOverride] = createSignal(false);
  const [hpDelta, setHpDelta] = createSignal(null);

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

  // HP adjustment
  function adjustHP(delta) {
    const idx = activePC();
    const p = store.campaign.characters[idx];
    if (!p) return;
    const newHP = Math.max(0, Math.min(p.hp + delta, p.hpMax));
    setStore('campaign', 'characters', idx, 'hp', newHP);
  }

  function promptCustomHP() {
    const val = prompt('Adjust HP (+/-)');
    if (val === null) return;
    const delta = parseInt(val, 10);
    if (!isNaN(delta)) adjustHP(delta);
  }

  function toggleSpell(name) {
    const s = new Set(expandedSpells());
    if (s.has(name)) s.delete(name); else s.add(name);
    setExpandedSpells(s);
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
          if (!isNaN(n)) setStore('campaign', 'characters', idx, 'hp', Math.max(0, Math.min(n, p.hpMax)));
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
              <div class="cs-ability-box" onClick={() => window.dispatchEvent(new CustomEvent('roll-request', { detail: { type: 'ability', ability: key, pc: p.name } }))}>
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
            <div class="cs-skill-row" onClick={() => window.dispatchEvent(new CustomEvent('roll-request', { detail: { type: 'save', ability: key, pc: p.name } }))}>
              <div class={`cs-prof-dot ${p.savingThrows?.includes(key) ? 'proficient' : ''}`} />
              <span class="cs-skill-name">{ABILITY_FULL[key]}</span>
              <span class="cs-skill-bonus">{formatMod(savingThrowBonus(key))}</span>
            </div>
          )}
        </For>

        <div class="cs-section-label">Skills</div>
        <For each={Object.keys(SKILL_ABILITY).sort()}>
          {(skill) => (
            <div class="cs-skill-row" onClick={() => window.dispatchEvent(new CustomEvent('roll-request', { detail: { type: 'skill', skill, pc: p.name } }))}>
              <div class={`cs-prof-dot ${isSkillProficient(skill) ? 'proficient' : ''}`} />
              <span class="cs-skill-name">{skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
              <span class="cs-skill-ability-tag">{SKILL_ABILITY[skill].toUpperCase()}</span>
              <span class="cs-skill-bonus">{formatMod(skillBonus(skill))}</span>
            </div>
          )}
        </For>

        <div class="cs-section-label">Quick Reference</div>
        <div class="cs-stat-row rollable" onClick={() => window.dispatchEvent(new CustomEvent('roll-request', { detail: { type: 'initiative', pc: p.name } }))}>
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
          <div class="cs-section-label">Attacks <span class="cs-hint">tap to roll</span></div>
          <For each={p.attacks}>
            {(a) => (
              <div class="cs-attack-card" onClick={() => window.dispatchEvent(new CustomEvent('roll-request', { detail: { type: 'attack', attack: a.name, pc: p.name } }))}>
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
          <div class="cs-condition-chips">
            <For each={p.conditions}>
              {(c, idx) => (
                <span class="cs-condition-chip" onClick={() => {
                  const i = activePC();
                  const updated = store.campaign.characters[i].conditions.filter((_, j) => j !== idx());
                  setStore('campaign', 'characters', i, 'conditions', updated);
                }}>
                  {c.name || c} ×
                </span>
              )}
            </For>
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

        <Show when={p.familiar}>
          <div class="cs-section-label">Familiar</div>
          <div class="cs-familiar-card">
            <div class="cs-familiar-header" onClick={() => setExpandedFamiliar(!expandedFamiliar())}>
              <div class="cs-familiar-name">{p.familiar.name || 'Familiar'}</div>
              <span class="cs-familiar-type">{p.familiar.form || ''}</span>
              <span class={`cs-familiar-status ${p.familiar.status || 'active'}`}>{(p.familiar.status || 'active').toUpperCase()}</span>
              <span class="cs-familiar-toggle">{expandedFamiliar() ? '▲' : '▼'}</span>
            </div>
            <Show when={expandedFamiliar()}>
              <div class="cs-familiar-detail">
                <div class="cs-familiar-stats">
                  <span>HP {p.familiar.hp || 1}/{p.familiar.hpMax || 1}</span>
                  <span>AC {p.familiar.ac || 10}</span>
                </div>
                <Show when={p.familiar.abilities}>
                  <div class="cs-familiar-abilities">{p.familiar.abilities}</div>
                </Show>
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

    return (
      <div class="cs-tab-body">
        <div class="cs-section-label">Spellcasting</div>
        <div class="cs-spellcasting-stats">
          <div class="cs-sc-stat">
            <div class="cs-sc-label">Spell DC</div>
            <div class="cs-sc-value">{spellSaveDC()}</div>
          </div>
          <div class="cs-sc-stat rollable" onClick={() => window.dispatchEvent(new CustomEvent('roll-request', { detail: { type: 'spellAttack', pc: p.name } }))}>
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
                </div>
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
                </div>
              </div>
            )}
          </For>
        </Show>
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

    return (
      <div class="cs-tab-body">
        <Show when={items.length > 0} fallback={<div class="cs-muted">No items carried</div>}>
          <div class="cs-section-label">Carried Items</div>
          <For each={items}>
            {(item) => (
              <div class="cs-equip-card">
                <div class="cs-equip-info">
                  <div class="cs-equip-name">{item.name}</div>
                  <Show when={item.detail}><div class="cs-equip-detail">{item.detail}</div></Show>
                </div>
                <Show when={item.qty > 1}><span class="cs-equip-qty">x{item.qty}</span></Show>
                <Show when={item.type}><span class={`cs-item-type-tag ${item.type}`}>{item.type}</span></Show>
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

        <div class="cs-section-label">Appearance <span class="cs-own-tag player">player</span></div>
        <div class="cs-bio-section">
          <div class="cs-bio-text">{p.appearance || 'No appearance set.'}</div>
        </div>

        <div class="cs-section-label">Personality <span class="cs-own-tag player">player</span></div>
        <div class="cs-bio-section">
          <div class="cs-bio-text">{p.personality || 'No personality set.'}</div>
        </div>

        <div class="cs-section-label">Backstory <span class="cs-own-tag player">player</span></div>
        <div class="cs-bio-section">
          <div class="cs-bio-text">{p.backstory || 'No backstory yet.'}</div>
        </div>

        <Show when={p.notes}>
          <div class="cs-section-label">Notes <span class="cs-own-tag player">player</span></div>
          <div class="cs-bio-section">
            <div class="cs-bio-text">{p.notes}</div>
          </div>
        </Show>
      </div>
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
