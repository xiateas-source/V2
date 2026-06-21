import { createSignal, For, Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';

export default function CharSheet(props) {
  const [activePC, setActivePC] = createSignal(props.initialPC || 0);
  const [editingHP, setEditingHP] = createSignal(false);
  const [hpInput, setHpInput] = createSignal('');
  const [addingCondition, setAddingCondition] = createSignal(false);
  const [condInput, setCondInput] = createSignal('');

  const pc = () => store.campaign.characters[activePC()] || null;

  function startHPEdit() {
    setHpInput(String(pc()?.hp || 0));
    setEditingHP(true);
  }

  function commitHP() {
    const val = parseInt(hpInput(), 10);
    if (!isNaN(val)) {
      const idx = activePC();
      const clamped = Math.max(0, Math.min(val, store.campaign.characters[idx].hpMax));
      setStore('campaign', 'characters', idx, 'hp', clamped);
    }
    setEditingHP(false);
  }

  function removeCondition(condIdx) {
    const idx = activePC();
    const updated = store.campaign.characters[idx].conditions.filter((_, i) => i !== condIdx);
    setStore('campaign', 'characters', idx, 'conditions', updated);
  }

  function addCondition() {
    const name = condInput().trim();
    if (!name) return;
    const idx = activePC();
    const updated = [...store.campaign.characters[idx].conditions, { name }];
    setStore('campaign', 'characters', idx, 'conditions', updated);
    setCondInput('');
    setAddingCondition(false);
  }

  const abilityMod = (score) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const profBonus = () => pc() ? Math.floor((pc().level - 1) / 4) + 2 : 2;

  const slotEntries = () => {
    const p = pc();
    if (!p) return [];
    return Object.entries(p.spellSlots || {}).map(([lvl, max]) => ({
      lvl, max, current: p.currentSlots?.[lvl] ?? max,
    }));
  };

  const hdAvail = () => {
    const p = pc();
    if (!p) return 0;
    return p.hitDice.total - p.hitDice.used;
  };

  const carried = () => {
    const p = pc();
    if (!p) return [];
    return store.campaign.inventory.carried[p.id] || [];
  };

  return (
    <div class="charsheet-page">
      <div class="cs-pc-tabs">
        <For each={store.campaign.characters}>
          {(c, idx) => (
            <button
              class={`cs-pc-tab ${activePC() === idx() ? 'active' : ''}`}
              style={{ 'border-color': c.color || 'var(--color-accent)' }}
              onClick={() => setActivePC(idx())}
            >
              {c.name}
            </button>
          )}
        </For>
      </div>

      <Show when={pc()}>
        <div class="cs-content">
          <div class="cs-header">
            <span class="cs-name">{pc().name}</span>
            <span class="cs-desc">{pc().race} {pc().class}{pc().subclass ? ` (${pc().subclass})` : ''} Lv{pc().level}</span>
          </div>

          <div class="cs-vitals">
            <div class="cs-vital-box cs-vital-editable" onClick={() => !editingHP() && startHPEdit()}>
              <span class="cs-vital-label">HP</span>
              <Show when={editingHP()} fallback={
                <span class="cs-vital-value">{pc().hp}/{pc().hpMax}</span>
              }>
                <input
                  class="cs-hp-input"
                  type="number"
                  value={hpInput()}
                  onInput={(e) => setHpInput(e.target.value)}
                  onBlur={commitHP}
                  onKeyDown={(e) => e.key === 'Enter' && commitHP()}
                  ref={(el) => setTimeout(() => el.select(), 0)}
                />
              </Show>
            </div>
            <div class="cs-vital-box">
              <span class="cs-vital-label">AC</span>
              <span class="cs-vital-value">{pc().ac}</span>
            </div>
            <div class="cs-vital-box">
              <span class="cs-vital-label">Speed</span>
              <span class="cs-vital-value">{pc().speed}</span>
            </div>
            <div class="cs-vital-box">
              <span class="cs-vital-label">Prof</span>
              <span class="cs-vital-value">+{profBonus()}</span>
            </div>
            <div class="cs-vital-box">
              <span class="cs-vital-label">HD</span>
              <span class="cs-vital-value">{hdAvail()}/{pc().hitDice.total}{pc().hitDice.die}</span>
            </div>
            <div class="cs-vital-box">
              <span class="cs-vital-label">XP</span>
              <span class="cs-vital-value">{pc().xp}</span>
            </div>
          </div>

          <div class="cs-section">
            <div class="cs-section-title">Abilities</div>
            <div class="cs-abilities">
              <For each={Object.entries(pc().abilityScores || {})}>
                {([key, score]) => (
                  <div class="cs-ability">
                    <span class="cs-ability-name">{key.toUpperCase()}</span>
                    <span class="cs-ability-mod">{abilityMod(score)}</span>
                    <span class="cs-ability-score">{score}</span>
                  </div>
                )}
              </For>
            </div>
          </div>

          <div class="cs-section">
            <div class="cs-section-title">
              Conditions
              <button class="cs-add-btn" onClick={() => setAddingCondition(true)}>+</button>
            </div>
            <Show when={pc().conditions.length > 0}>
              <div class="cs-tag-list">
                <For each={pc().conditions}>
                  {(c, idx) => (
                    <span class="cs-tag cs-tag-condition cs-tag-removable" onClick={() => removeCondition(idx())}>
                      {c.name || c} &times;
                    </span>
                  )}
                </For>
              </div>
            </Show>
            <Show when={addingCondition()}>
              <div class="cs-cond-add">
                <input
                  class="cs-cond-input"
                  placeholder="Condition name"
                  value={condInput()}
                  onInput={(e) => setCondInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCondition()}
                  ref={(el) => setTimeout(() => el.focus(), 0)}
                />
                <button class="cs-cond-save" onClick={addCondition}>Add</button>
              </div>
            </Show>
          </div>

          <Show when={pc().attacks?.length > 0}>
            <div class="cs-section">
              <div class="cs-section-title">Attacks</div>
              <For each={pc().attacks}>
                {(a) => (
                  <div class="cs-attack-row">
                    <span class="cs-attack-name">{a.name}</span>
                    <span class="cs-attack-bonus">+{a.bonus}</span>
                    <span class="cs-attack-dmg">{a.damage}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>

          <Show when={slotEntries().length > 0}>
            <div class="cs-section">
              <div class="cs-section-title">Spell Slots</div>
              <div class="cs-slots">
                <For each={slotEntries()}>
                  {(s) => (
                    <div class="cs-slot-row">
                      <span class="cs-slot-level">Lv{s.lvl}</span>
                      <span class="cs-slot-pips">
                        {'●'.repeat(s.current)}{'○'.repeat(s.max - s.current)}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          <Show when={pc().knownSpells?.length > 0 || pc().cantrips?.length > 0}>
            <div class="cs-section">
              <div class="cs-section-title">Spells</div>
              <Show when={pc().cantrips?.length > 0}>
                <div class="cs-spell-group">
                  <span class="cs-spell-level">Cantrips</span>
                  <span class="cs-spell-list">{pc().cantrips.join(', ')}</span>
                </div>
              </Show>
              <Show when={pc().knownSpells?.length > 0}>
                <div class="cs-spell-group">
                  <span class="cs-spell-level">Known</span>
                  <span class="cs-spell-list">{pc().knownSpells.join(', ')}</span>
                </div>
              </Show>
            </div>
          </Show>

          <Show when={pc().features?.length > 0}>
            <div class="cs-section">
              <div class="cs-section-title">Features</div>
              <div class="cs-tag-list">
                <For each={pc().features}>
                  {(f) => <span class="cs-tag">{f}</span>}
                </For>
              </div>
            </div>
          </Show>

          <Show when={pc().resources?.length > 0}>
            <div class="cs-section">
              <div class="cs-section-title">Resources</div>
              <For each={pc().resources}>
                {(r) => (
                  <div class="cs-resource-row">
                    <span class="cs-resource-name">{r.name}</span>
                    <span class="cs-resource-count">{r.current}/{r.max}</span>
                    <span class="cs-resource-rest">{r.restoresOn}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>

          <Show when={carried().length > 0}>
            <div class="cs-section">
              <div class="cs-section-title">Carrying</div>
              <For each={carried()}>
                {(item) => (
                  <div class="cs-item-row">
                    <span class="cs-item-name">{item.name}</span>
                    <Show when={item.qty > 1}><span class="cs-item-qty">x{item.qty}</span></Show>
                    <span class="cs-item-type">{item.type}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>

          <Show when={pc().proficiencies?.length > 0}>
            <div class="cs-section">
              <div class="cs-section-title">Proficiencies</div>
              <div class="cs-prof-text">{pc().proficiencies.join(', ')}</div>
            </div>
          </Show>

          <Show when={pc().languages?.length > 0}>
            <div class="cs-section">
              <div class="cs-section-title">Languages</div>
              <div class="cs-prof-text">{pc().languages.join(', ')}</div>
            </div>
          </Show>

          <Show when={pc().backstory}>
            <div class="cs-section">
              <div class="cs-section-title">Backstory</div>
              <div class="cs-prose">{pc().backstory}</div>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
