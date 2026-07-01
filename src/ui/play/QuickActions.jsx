import { createSignal, createMemo, For, Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { sendMsg, isSending } from '../../ai/engine.js';
import { validateMechanics, applyMechanics } from '../../ai/mechanics.js';
import { saveQuickActions } from '../../data/keys.js';
import DiceRoller from './DiceRoller.jsx';

const PRESETS = [
  // Rest
  { id: 'short_rest', label: 'Short Rest', icon: '\u{1F4A4}', category: 'rest', type: 'narrative', value: 'We find a safe spot and take a short rest to catch our breath and tend our wounds.', mechArgs: 'short_rest|party', context: 'explore' },
  { id: 'long_rest', label: 'Long Rest', icon: '\u{1F319}', category: 'rest', type: 'narrative', value: 'We set up camp and settle in for a long rest.', mechArgs: 'long_rest|party', context: 'explore' },
  { id: 'hit_dice', label: 'Spend HD', icon: '\u{2764}', category: 'rest', type: 'prompt', value: 'I spend hit dice to heal during this rest.', context: 'any' },

  // Combat
  { id: 'end_combat', label: 'End Combat', icon: '\u{2694}', category: 'combat', type: 'mechanic', value: 'combat_end', mechArgs: 'Victory', context: 'combat' },
  { id: 'dodge', label: 'Dodge', icon: '\u{1F6E1}', category: 'combat', type: 'prompt', value: 'I take the Dodge action this turn.', context: 'combat' },
  { id: 'dash', label: 'Dash', icon: '\u{1F4A8}', category: 'combat', type: 'prompt', value: 'I take the Dash action to move double my speed.', context: 'combat' },
  { id: 'disengage', label: 'Disengage', icon: '\u{21A9}', category: 'combat', type: 'prompt', value: 'I take the Disengage action and move away safely.', context: 'combat' },
  { id: 'help', label: 'Help', icon: '\u{1F91D}', category: 'combat', type: 'prompt', value: 'I use the Help action to assist my ally.', context: 'combat' },
  { id: 'ready', label: 'Ready', icon: '\u{23F3}', category: 'combat', type: 'prompt', value: 'I Ready an action.', context: 'combat' },
  { id: 'hide', label: 'Hide', icon: '\u{1F32B}', category: 'combat', type: 'prompt', value: 'I attempt to Hide.', context: 'combat' },

  // Social
  { id: 'persuade', label: 'Persuade', icon: '\u{1F5E3}', category: 'social', type: 'prompt', value: 'I try to persuade them.', context: 'social' },
  { id: 'intimidate', label: 'Intimidate', icon: '\u{1F4AA}', category: 'social', type: 'prompt', value: 'I try to intimidate them.', context: 'social' },
  { id: 'deceive', label: 'Deceive', icon: '\u{1F3AD}', category: 'social', type: 'prompt', value: 'I try to deceive them.', context: 'social' },
  { id: 'insight', label: 'Insight', icon: '\u{1F441}', category: 'social', type: 'prompt', value: 'I try to read their intentions.', context: 'social' },
  { id: 'performance', label: 'Perform', icon: '\u{1F3B6}', category: 'social', type: 'prompt', value: 'I put on a performance.', context: 'social' },

  // Exploration
  { id: 'search', label: 'Search', icon: '\u{1F50D}', category: 'explore', type: 'prompt', value: 'I search the area thoroughly.', context: 'explore' },
  { id: 'stealth', label: 'Stealth', icon: '\u{1F90B}', category: 'explore', type: 'prompt', value: 'I try to move stealthily.', context: 'explore' },
  { id: 'perception', label: 'Perception', icon: '\u{1F440}', category: 'explore', type: 'prompt', value: 'I look around carefully, what do I notice?', context: 'explore' },
  { id: 'investigate', label: 'Investigate', icon: '\u{1F9D0}', category: 'explore', type: 'prompt', value: 'I investigate more closely.', context: 'explore' },
  { id: 'survival', label: 'Survival', icon: '\u{1F332}', category: 'explore', type: 'prompt', value: 'I use my survival skills to assess the situation.', context: 'explore' },
  { id: 'travel', label: 'Travel', icon: '\u{1F6B6}', category: 'explore', type: 'prompt', value: 'We continue traveling.', context: 'explore' },
];

const CATEGORIES = [
  { id: 'rest', label: 'Rest' },
  { id: 'combat', label: 'Combat' },
  { id: 'social', label: 'Social' },
  { id: 'explore', label: 'Explore' },
  { id: 'character', label: 'Character' },
  { id: 'custom', label: 'Custom' },
];

function getPreset(id) {
  return PRESETS.find(p => p.id === id);
}

function detectContext() {
  if (store.campaign.combatState?.active) return 'combat';
  const narrative = store.campaign.narrative || [];
  const recent = narrative.slice(-3);
  for (const msg of recent) {
    if (msg.mechanics?.applied?.some(m => m.key === 'npc_add' || m.key === 'npc_mood')) return 'social';
  }
  return 'explore';
}

function getCharacterSuggestions() {
  const chars = store.campaign.characters || [];
  const suggestions = [];
  for (const pc of chars) {
    if (!pc.features?.length && !pc.resources?.length) continue;
    for (const feat of (pc.features || [])) {
      const name = feat.name || feat;
      if (/cunning action/i.test(name)) {
        suggestions.push({ id: `char_${pc.name}_cunning`, label: 'Cunning Action', icon: '\u{26A1}', category: 'character', type: 'prompt', value: `${pc.name} uses Cunning Action.`, context: 'combat', charName: pc.name });
      }
      if (/sneak attack/i.test(name)) {
        suggestions.push({ id: `char_${pc.name}_sneak`, label: 'Sneak Attack', icon: '\u{1F5E1}', category: 'character', type: 'prompt', value: `${pc.name} applies Sneak Attack damage.`, context: 'combat', charName: pc.name });
      }
      if (/bardic inspiration/i.test(name)) {
        suggestions.push({ id: `char_${pc.name}_inspire`, label: 'Bardic Inspiration', icon: '\u{1F3B5}', category: 'character', type: 'prompt', value: `${pc.name} grants Bardic Inspiration.`, context: 'any', charName: pc.name });
      }
      if (/wild shape/i.test(name)) {
        suggestions.push({ id: `char_${pc.name}_wildshape`, label: 'Wild Shape', icon: '\u{1F43B}', category: 'character', type: 'prompt', value: `${pc.name} uses Wild Shape.`, context: 'any', charName: pc.name });
      }
      if (/action surge/i.test(name)) {
        suggestions.push({ id: `char_${pc.name}_surge`, label: 'Action Surge', icon: '\u{26A1}', category: 'character', type: 'prompt', value: `${pc.name} uses Action Surge!`, context: 'combat', charName: pc.name });
      }
      if (/^rage$/i.test(name) || /^rage\b/i.test(name)) {
        suggestions.push({ id: `char_${pc.name}_rage`, label: 'Rage', icon: '\u{1F525}', category: 'character', type: 'prompt', value: `${pc.name} enters a Rage!`, context: 'combat', charName: pc.name });
      }
      if (/lay on hands/i.test(name)) {
        suggestions.push({ id: `char_${pc.name}_lay`, label: 'Lay on Hands', icon: '\u{2728}', category: 'character', type: 'prompt', value: `${pc.name} uses Lay on Hands.`, context: 'any', charName: pc.name });
      }
    }
    for (const res of (pc.resources || [])) {
      const rName = res.name || res;
      if (/channel divinity/i.test(rName)) {
        suggestions.push({ id: `char_${pc.name}_channel`, label: 'Channel Divinity', icon: '\u{1F31F}', category: 'character', type: 'prompt', value: `${pc.name} uses Channel Divinity.`, context: 'any', charName: pc.name });
      }
    }
  }
  return suggestions;
}

export default function QuickActions(props) {
  const [open, setOpen] = createSignal(false);
  // Controlled mode: parent (InputBar's dice button) drives open/close and the
  // always-visible pill bar is hidden — the drawer is the whole component.
  const isOpen = () => props.controlled ? props.open : open();
  const close = () => { if (props.controlled) props.onClose?.(); else setOpen(false); };
  const [drawerTab, setDrawerTab] = createSignal('actions');
  const [editing, setEditing] = createSignal(false);
  const [customLabel, setCustomLabel] = createSignal('');
  const [customText, setCustomText] = createSignal('');
  const [editCategory, setEditCategory] = createSignal('rest');
  let touchStartY = 0;

  const qaConfig = () => store.system.settings.quickActions;

  const allActions = createMemo(() => {
    const config = qaConfig();
    const actions = [];
    for (const id of config.active) {
      const preset = getPreset(id);
      if (preset) { actions.push(preset); continue; }
      const custom = config.custom.find(c => c.id === id);
      if (custom) {
        actions.push({ ...custom, icon: '\u{2B50}', category: 'custom', type: 'prompt', context: 'any' });
      }
    }
    return actions;
  });

  const context = createMemo(() => detectContext());

  const contextActions = createMemo(() => {
    const ctx = context();
    const active = allActions();
    const contextual = active.filter(a => a.context === ctx || a.context === 'any');
    if (contextual.length >= 3) return contextual.slice(0, 4);
    return active.slice(0, 4);
  });

  const charSuggestions = createMemo(() => getCharacterSuggestions());

  function persist(updates) {
    const current = { ...store.system.settings.quickActions, ...updates };
    setStore('system', 'settings', 'quickActions', current);
    saveQuickActions(current);
  }

  function fireAction(action) {
    if (isSending()) return;

    if (action.type === 'mechanic') {
      const key = action.value;
      const args = action.mechArgs || 'party';
      const mechanics = [{ key, value: args, target: '', applied: false }];
      const { valid, rejected } = validateMechanics(mechanics);
      const applied = applyMechanics(valid);
      const msg = { role: 'system', content: `[${action.label}]`, mechanics: { applied, rejected }, ts: Date.now() };
      setStore('campaign', 'narrative', [...store.campaign.narrative, msg]);
    } else if (action.type === 'narrative' || action.type === 'prompt') {
      const text = action.value || action.text;
      if (qaConfig().mode === 'prefill' && props.onPrefill) {
        props.onPrefill(text);
      } else {
        sendMsg(text, { tab: props.tab || 'narrative' });
      }
    }

    close();
  }

  function addAction(id) {
    const active = [...qaConfig().active, id];
    persist({ active });
  }

  function removeAction(id) {
    const active = qaConfig().active.filter(a => a !== id);
    const custom = qaConfig().custom.filter(c => c.id !== id);
    persist({ active, custom });
  }

  function addCustom() {
    const label = customLabel().trim();
    const text = customText().trim();
    if (!label || !text) return;
    const id = `custom_${Date.now()}`;
    const custom = [...qaConfig().custom, { id, label, text }];
    const active = [...qaConfig().active, id];
    persist({ active, custom });
    setCustomLabel('');
    setCustomText('');
  }

  function toggleMode() {
    const mode = qaConfig().mode === 'instant' ? 'prefill' : 'instant';
    persist({ mode });
  }

  function onPillBarTouch(e) { touchStartY = e.touches[0].clientY; }
  function onPillBarTouchEnd(e) {
    const delta = touchStartY - e.changedTouches[0].clientY;
    if (delta > 40) setOpen(true);
    else if (delta < -40) setOpen(false);
  }

  function onDrawerTouch(e) { touchStartY = e.touches[0].clientY; }
  function onDrawerTouchEnd(e) {
    const delta = touchStartY - e.changedTouches[0].clientY;
    if (delta < -40) setOpen(false);
  }

  const unusedByCategory = createMemo(() => {
    const activeSet = new Set(qaConfig().active);
    const cat = editCategory();
    if (cat === 'character') return charSuggestions().filter(s => !activeSet.has(s.id));
    if (cat === 'custom') return [];
    return PRESETS.filter(p => p.category === cat && !activeSet.has(p.id));
  });

  return (
    <div class={`qa-container ${props.controlled ? 'qa-controlled' : ''}`}>
      <Show when={!props.controlled}>
        <div
          class="qa-pill-bar"
          onTouchStart={onPillBarTouch}
          onTouchEnd={onPillBarTouchEnd}
        >
          <For each={contextActions()}>
            {(action) => (
              <button
                class={`qa-pill qa-ctx-${action.context}`}
                onClick={() => fireAction(action)}
                disabled={isSending()}
              >
                <span class="qa-pill-icon">{action.icon}</span>
                <span class="qa-pill-label">{action.label}</span>
              </button>
            )}
          </For>
          <button
            class={`qa-pill qa-pill-toggle ${open() ? 'qa-pill-active' : ''}`}
            onClick={() => setOpen(!open())}
          >
            {open() ? '▾' : '▴'}
          </button>
        </div>
      </Show>

      <Show when={isOpen()}>
        <div
          class="qa-drawer"
          onTouchStart={onDrawerTouch}
          onTouchEnd={onDrawerTouchEnd}
        >
          <div class="qa-drawer-header">
            <div class="qa-drawer-tabs">
              <button class={`qa-tab ${drawerTab() === 'actions' ? 'active' : ''}`} onClick={() => setDrawerTab('actions')}>Actions</button>
              <button class={`qa-tab ${drawerTab() === 'dice' ? 'active' : ''}`} onClick={() => setDrawerTab('dice')}>Dice</button>
            </div>
            <div class="qa-drawer-controls">
              <Show when={drawerTab() === 'actions'}>
                <button class="qa-mode-btn" onClick={toggleMode} title={qaConfig().mode === 'instant' ? 'Instant mode' : 'Pre-fill mode'}>
                  {qaConfig().mode === 'instant' ? '⚡' : '✏️'}
                </button>
                <button class={`qa-edit-btn ${editing() ? 'qa-edit-active' : ''}`} onClick={() => setEditing(!editing())}>
                  {editing() ? 'Done' : 'Edit'}
                </button>
              </Show>
              <Show when={props.controlled}>
                <button class="qa-close-btn" onClick={close} title="Close">&times;</button>
              </Show>
            </div>
          </div>

          <Show when={drawerTab() === 'dice'}>
            <DiceRoller />
          </Show>

          <Show when={drawerTab() === 'actions'}>
          <Show when={store.campaign.combatState?.active}>
            <div class="qa-economy-chips">
              <span class="qa-chip">Action</span>
              <span class="qa-chip">Bonus</span>
              <span class="qa-chip">Reaction</span>
            </div>
          </Show>

          <Show when={!editing()}>
            <div class="qa-grid">
              <For each={allActions()}>
                {(action) => (
                  <button
                    class={`qa-btn qa-btn-${action.category}`}
                    onClick={() => fireAction(action)}
                    disabled={isSending()}
                  >
                    <span class="qa-btn-icon">{action.icon}</span>
                    <span class="qa-btn-label">{action.label}</span>
                  </button>
                )}
              </For>
            </div>
          </Show>

          <Show when={editing()}>
            <div class="qa-edit-mode">
              <div class="qa-edit-section">
                <div class="qa-section-label">Active</div>
                <div class="qa-grid">
                  <For each={allActions()}>
                    {(action) => (
                      <div class="qa-btn-wrap">
                        <button class={`qa-btn qa-btn-${action.category}`} disabled>
                          <span class="qa-btn-icon">{action.icon}</span>
                          <span class="qa-btn-label">{action.label}</span>
                        </button>
                        <button class="qa-remove-badge" onClick={() => removeAction(action.id)}>&times;</button>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div class="qa-edit-section">
                <div class="qa-section-label">Add</div>
                <div class="qa-cat-tabs">
                  <For each={CATEGORIES}>
                    {(cat) => (
                      <button
                        class={`qa-cat-tab ${editCategory() === cat.id ? 'active' : ''}`}
                        onClick={() => setEditCategory(cat.id)}
                      >
                        {cat.label}
                      </button>
                    )}
                  </For>
                </div>
                <div class="qa-grid">
                  <For each={unusedByCategory()}>
                    {(action) => (
                      <button
                        class={`qa-btn qa-btn-add qa-btn-${action.category}`}
                        onClick={() => addAction(action.id)}
                      >
                        <span class="qa-btn-icon">{action.icon}</span>
                        <span class="qa-btn-label">{action.label}</span>
                        <span class="qa-add-badge">+</span>
                      </button>
                    )}
                  </For>
                </div>
              </div>

              <Show when={editCategory() === 'custom'}>
                <div class="qa-custom-form">
                  <input
                    class="qa-custom-input"
                    placeholder="Button label"
                    value={customLabel()}
                    onInput={(e) => setCustomLabel(e.target.value)}
                  />
                  <input
                    class="qa-custom-input"
                    placeholder="Action text (what you say)"
                    value={customText()}
                    onInput={(e) => setCustomText(e.target.value)}
                  />
                  <button
                    class="qa-custom-save"
                    onClick={addCustom}
                    disabled={!customLabel().trim() || !customText().trim()}
                  >
                    Add
                  </button>
                </div>
              </Show>
            </div>
          </Show>
          </Show>
        </div>
      </Show>
    </div>
  );
}
