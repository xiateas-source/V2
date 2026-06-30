import { createSignal, createMemo, For, Show } from 'solid-js';
import { store } from '../../state/index.js';
import { validateMechanics, applyMechanics } from '../../ai/mechanics.js';

function ordinal(n) {
  const num = parseInt(n, 10);
  const v = num % 100;
  return num + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th');
}

export default function ActionsDrawer({ onClose }) {
  const characters = () => store.campaign.characters;
  const selectedPCs = () => store.system.playerIdentity?.selectedPCs || [];

  const defaultIdx = () => {
    if (selectedPCs().length > 0) {
      const idx = characters().findIndex(c => selectedPCs().includes(c.name));
      return idx >= 0 ? idx : 0;
    }
    return 0;
  };

  const [pcIdx, setPcIdx] = createSignal(defaultIdx());
  const pc = () => characters()[pcIdx()] || null;

  const visibleChars = createMemo(() => {
    if (selectedPCs().length > 0) {
      return characters().map((c, i) => ({ c, i })).filter(({ c }) => selectedPCs().includes(c.name));
    }
    return characters().map((c, i) => ({ c, i }));
  });

  const profBonus = () => Math.floor(((pc()?.level || 1) - 1) / 4) + 2;

  const mod = (score) => Math.floor(((score || 10) - 10) / 2);

  const castingAbility = () => {
    const cls = (pc()?.class || '').toLowerCase();
    if (cls.includes('wizard') || cls.includes('artificer')) return 'int';
    if (cls.includes('cleric') || cls.includes('druid') || cls.includes('ranger')) return 'wis';
    return 'cha';
  };

  const spellStats = () => {
    const p = pc();
    if (!p) return null;
    const abilMod = mod(p.abilityScores?.[castingAbility()] || 10);
    return { dc: 8 + profBonus() + abilMod, atk: profBonus() + abilMod };
  };

  const slotEntries = createMemo(() => {
    const p = pc();
    if (!p) return [];
    return Object.entries(p.spellSlots || {})
      .filter(([, max]) => max)
      .map(([lvl, max]) => ({ lvl, max, current: p.currentSlots?.[lvl] ?? max }))
      .sort((a, b) => Number(a.lvl) - Number(b.lvl));
  });

  function useSlot(lvl) {
    const p = pc();
    if (!p) return;
    const { valid } = validateMechanics([{ key: 'slot_use', value: `${p.name}=${lvl}`, target: '', applied: false }]);
    applyMechanics(valid);
  }

  function useResource(r) {
    const p = pc();
    if (!p) return;
    const { valid } = validateMechanics([{ key: 'resource_use', value: `${p.name},${r.name},1`, target: '', applied: false }]);
    applyMechanics(valid);
  }

  function castSpell(spellName) {
    const p = pc();
    if (!p) return;
    window.dispatchEvent(new CustomEvent('prefill-input', {
      detail: { text: `${p.name} casts ${spellName}.` }
    }));
    onClose();
  }

  const hasCasting = () => {
    const p = pc();
    return p && (slotEntries().length > 0 || p.cantrips?.length > 0 || p.knownSpells?.length > 0);
  };

  return (
    <div class="side-drawer right-drawer">
      <div class="drawer-header">
        <button class="drawer-close" onClick={onClose}><i class="ph ph-x" /></button>
        <Show when={visibleChars().length > 1}>
          <div class="drawer-pc-tabs">
            <For each={visibleChars()}>
              {({ c, i }) => (
                <button
                  class={`drawer-pc-tab ${pcIdx() === i ? 'active' : ''}`}
                  style={{ '--tab-color': c.color || 'var(--color-accent)' }}
                  onClick={() => setPcIdx(i)}
                >
                  {c.avatar || c.name[0]}
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>

      <Show when={pc()}>
        <div class="drawer-body">
          <div class="drawer-pc-name" style={{ color: pc().color || 'var(--color-accent)' }}>
            {pc().name}
            <span class="drawer-pc-sub">{pc().class} {pc().level}</span>
          </div>

          {/* Resources (Rage, Ki, Bardic Inspiration, etc.) */}
          <Show when={pc().resources?.length > 0}>
            <div class="drawer-section-label">Resources</div>
            <For each={pc().resources}>
              {(r) => (
                <div class="drawer-resource-row">
                  <span class="drawer-resource-name">{r.name}</span>
                  <Show when={r.max > 0} fallback={<span class="drawer-resource-passive">passive</span>}>
                    <div class="drawer-resource-pips">
                      <For each={Array.from({ length: r.max })}>
                        {(_, i) => (
                          <button
                            class={`drawer-res-pip ${i() < r.current ? 'available' : 'used'}`}
                            onClick={() => i() < r.current && useResource(r)}
                            title={i() < r.current ? `Use 1 ${r.name}` : 'Expended'}
                          />
                        )}
                      </For>
                    </div>
                    <span class="drawer-resource-count">{r.current}/{r.max}</span>
                  </Show>
                </div>
              )}
            </For>
          </Show>

          {/* Spell slots */}
          <Show when={slotEntries().length > 0}>
            <div class="drawer-section-label">
              Spell Slots
              <Show when={spellStats()}>
                <span class="drawer-spell-meta">DC {spellStats().dc} · +{spellStats().atk} atk</span>
              </Show>
            </div>
            <For each={slotEntries()}>
              {(s) => (
                <div class="drawer-slot-row">
                  <span class="drawer-slot-lvl">{ordinal(s.lvl)}</span>
                  <div class="drawer-slot-pips">
                    <For each={Array.from({ length: s.max })}>
                      {(_, i) => (
                        <button
                          class={`drawer-slot-pip ${i() < s.current ? 'available' : 'used'}`}
                          onClick={() => i() < s.current && useSlot(s.lvl)}
                          title={i() < s.current ? `Expend ${ordinal(s.lvl)}-level slot` : 'Expended'}
                        />
                      )}
                    </For>
                  </div>
                  <span class="drawer-slot-count">{s.current}/{s.max}</span>
                </div>
              )}
            </For>
          </Show>

          {/* Concentration reminder */}
          <Show when={pc().concentration}>
            <div class="drawer-conc-badge">
              ◉ {pc().concentration?.spell || pc().concentration}
            </div>
          </Show>

          {/* Cantrips */}
          <Show when={pc().cantrips?.length > 0}>
            <div class="drawer-section-label">Cantrips</div>
            <div class="drawer-spell-chips">
              <For each={pc().cantrips}>
                {(s) => (
                  <button class="drawer-spell-chip" onClick={() => castSpell(s)}>{s}</button>
                )}
              </For>
            </div>
          </Show>

          {/* Known spells */}
          <Show when={pc().knownSpells?.length > 0}>
            <div class="drawer-section-label">Spells <span class="drawer-hint">tap to cast</span></div>
            <div class="drawer-spell-chips">
              <For each={pc().knownSpells}>
                {(s) => (
                  <button class="drawer-spell-chip" onClick={() => castSpell(s)}>{s}</button>
                )}
              </For>
            </div>
          </Show>

          <Show when={!hasCasting() && !pc().resources?.length}>
            <div class="drawer-empty">No spells or special abilities tracked for {pc().name}.</div>
          </Show>

          <button class="drawer-full-link" onClick={() => {
            window.dispatchEvent(new CustomEvent('tp-charsheet', { detail: { pcName: pc().name } }));
            onClose();
          }}>
            Full Character Sheet <i class="ph ph-arrow-up-right" />
          </button>
        </div>
      </Show>
    </div>
  );
}
