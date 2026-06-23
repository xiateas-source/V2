import { createSignal, Show, For } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { callProvider } from '../../ai/providers.js';
import { CHAR_BUILDER_SYSTEM } from '../../ai/setupPrompts.js';
import { normalizeCharacter, validateCharacter } from '../../content/normalizer.js';
import {
  STARTING_EQUIPMENT, getStartingGold, getDefaultEquipment, getSelectedEquipment,
  AVAILABLE_CLASSES, AVAILABLE_RACES, BACKGROUNDS, ALIGNMENTS,
  buildCharacter, rollPersonality, composePersonality
} from '../../data/quickBuild.js';
import { forgeCharacter, proficiencyBonus } from '../../data/forge.js';
import CharWizard from './CharWizard.jsx';
import CharSheet from '../reference/CharSheet.jsx';

const QUICK_PICK_NAMES = {
  Fighter: ['Kael', 'Brynn', 'Tormund', 'Seraphina', 'Draven', 'Isolde', 'Gareth', 'Nyx'],
  Rogue: ['Shade', 'Whisper', 'Dax', 'Lyra', 'Corvus', 'Mira', 'Finch', 'Vex'],
  Bard: ['Melody', 'Cadence', 'Puck', 'Rhyme', 'Seren', 'Dori', 'Vesper', 'Lark'],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function CharCreate(props) {
  const [mode, setMode] = createSignal(null);
  const [draft, setDraft] = createSignal(null);
  const [draftErrors, setDraftErrors] = createSignal([]);
  const [equipChoices, setEquipChoices] = createSignal({});
  const [equipMode, setEquipMode] = createSignal('default');

  // Quick Pick state
  const [quickChar, setQuickChar] = createSignal(null);
  const [quickLoading, setQuickLoading] = createSignal(false);

  // Review/edit existing sheets
  const [sheetPC, setSheetPC] = createSignal(null);

  function commitCharacter() {
    const char = draft();
    if (!char) return;
    const idx = store.campaign.characters.length;
    setStore('campaign', 'characters', idx, char);

    const eMode = equipMode();
    const classData = STARTING_EQUIPMENT[char.class];

    if (eMode === 'gold') {
      const goldAmount = classData?.goldOption || getStartingGold(char.level || 1);
      if (idx === 0) {
        setStore('campaign', 'gold', 'gp', goldAmount);
      } else {
        setStore('campaign', 'gold', 'gp', store.campaign.gold.gp + goldAmount);
      }
    } else {
      const items = eMode === 'customize'
        ? getSelectedEquipment(char.class, equipChoices())
        : getDefaultEquipment(char.class);
      if (items.length > 0) {
        const carried = { ...store.campaign.inventory.carried };
        carried[char.id] = items.map(i => ({ name: i.name, qty: i.qty, type: i.type, attunement: 'none', weight: i.weight || 0 }));
        setStore('campaign', 'inventory', 'carried', carried);
      }
      const gold = getStartingGold(char.level || 1);
      if (idx === 0) {
        setStore('campaign', 'gold', 'gp', gold);
      } else {
        setStore('campaign', 'gold', 'gp', store.campaign.gold.gp + gold);
      }
    }

    setDraft(null);
    setMode(null);
    setEquipChoices({});
    setEquipMode('default');
  }

  function handleWizardComplete(char, goldGP, items, isGoldMode) {
    const idx = store.campaign.characters.length;
    setStore('campaign', 'characters', idx, char);

    if (isGoldMode) {
      if (idx === 0) setStore('campaign', 'gold', 'gp', goldGP);
      else setStore('campaign', 'gold', 'gp', store.campaign.gold.gp + goldGP);
    } else {
      if (items.length > 0) {
        const carried = { ...store.campaign.inventory.carried };
        carried[char.id] = items.map(i => ({ name: i.name, qty: i.qty, type: i.type, attunement: 'none', weight: i.weight || 0 }));
        setStore('campaign', 'inventory', 'carried', carried);
      }
      if (idx === 0) setStore('campaign', 'gold', 'gp', goldGP);
      else setStore('campaign', 'gold', 'gp', store.campaign.gold.gp + goldGP);
    }

    setMode(null);
  }

  function commitQuickChar() {
    const char = quickChar();
    if (!char) return;
    const idx = store.campaign.characters.length;
    setStore('campaign', 'characters', idx, char);

    const items = getDefaultEquipment(char.class);
    if (items.length > 0) {
      const carried = { ...store.campaign.inventory.carried };
      carried[char.id] = items.map(i => ({ name: i.name, qty: i.qty, type: i.type, attunement: 'none', weight: i.weight || 0 }));
      setStore('campaign', 'inventory', 'carried', carried);
    }
    const gold = getStartingGold(char.level || 1);
    if (idx === 0) setStore('campaign', 'gold', 'gp', gold);
    else setStore('campaign', 'gold', 'gp', store.campaign.gold.gp + gold);

    setQuickChar(null);
    setMode(null);
  }

  async function rollQuickPick() {
    setQuickLoading(true);
    try {
      const className = pickRandom(AVAILABLE_CLASSES);
      const race = pickRandom(AVAILABLE_RACES);
      const bg = pickRandom(BACKGROUNDS);
      const alignment = pickRandom(ALIGNMENTS);
      const names = QUICK_PICK_NAMES[className] || QUICK_PICK_NAMES.Fighter;
      const name = pickRandom(names);

      const char = await buildCharacter(
        { name, race, className, level: 1 },
        store.campaign.characters.length
      );
      if (char) {
        char.background = bg.name;
        char.alignment = alignment;
        for (const s of (bg.skillProfs || [])) {
          char.skills[s.toLowerCase().replace(/\s+/g, '')] = true;
        }
        const traits = {
          trait: rollPersonality('trait'), ideal: rollPersonality('ideal'),
          bond: rollPersonality('bond'), flaw: rollPersonality('flaw'),
        };
        char.traits = traits;
        char.personality = composePersonality(traits);
        setQuickChar(char);
      }
    } finally {
      setQuickLoading(false);
    }
  }

  function removeCharacter(idx) {
    const updated = store.campaign.characters.filter((_, i) => i !== idx);
    setStore('campaign', 'characters', updated);
  }

  async function onCharParsed(charObj) {
    const normalized = normalizeCharacter(charObj);
    if (!normalized) return;

    // Apply the chosen background's skill proficiencies too, the way Guided
    // Build does — so AI/imported characters get the full criteria.
    const bgMatch = BACKGROUNDS.find(b => b.name === normalized.background);
    const extraSkills = bgMatch?.skillProfs || [];

    // Funnel through the Forge: keep the AI/import's creative choices (name,
    // race, class, ability scores, background, spells, traits, bio) but
    // re-derive every mechanical field (HP, AC, attacks, resources, features,
    // slots, prof). The AI cannot ship wrong math because its math is never
    // trusted — only its creative intent.
    const char = await forgeCharacter({
      name: normalized.name,
      race: normalized.race,
      className: normalized.class,
      subclass: normalized.subclass,
      level: normalized.level,
      abilityScores: normalized.abilityScores,
      background: normalized.background,
      alignment: normalized.alignment,
      skills: normalized.skills,
      extraSkills,
      cantrips: normalized.cantrips,
      knownSpells: normalized.knownSpells,
      traits: normalized.traits,
      appearance: normalized.appearance,
      personality: normalized.personality,
      backstory: normalized.backstory,
      notes: normalized.notes,
      // pass-throughs the Forge keeps for unsupported classes:
      attacks: normalized.attacks,
      features: normalized.features,
      resources: normalized.resources,
      proficiencies: normalized.proficiencies,
      savingThrows: normalized.savingThrows,
      languages: normalized.languages,
      spellSlots: normalized.spellSlots,
      hitDie: normalized.hitDice?.die,
      ac: normalized.ac,
      speed: normalized.speed,
      existingCount: store.campaign.characters.length,
    });

    const { valid, errors } = validateCharacter(char);
    setDraftErrors(errors);
    setDraft(char);
    setEquipChoices({});
    setEquipMode('default');
  }

  function setChoice(groupIdx, optionIdx) {
    setEquipChoices(prev => ({ ...prev, [groupIdx]: optionIdx }));
  }

  return (
    <div class="charcreate">
      <Show when={store.campaign.characters.length > 0}>
        <div class="charcreate-roster">
          <div class="roster-label">Party — tap to review or edit</div>
          <div class="roster-chips">
            <For each={store.campaign.characters}>
              {(pc, i) => (
                <div class="roster-chip" style={{ 'border-color': pc.color }}>
                  <button class="roster-chip-open" onClick={() => setSheetPC(i())}>
                    <div class="roster-chip-avatar" style={{ background: pc.color }}>{pc.name?.charAt(0) || '?'}</div>
                    <div class="roster-chip-info">
                      <span class="roster-chip-name">{pc.name}</span>
                      <span class="roster-chip-meta">{pc.race} {pc.class} Lv{pc.level} · HP {pc.hpMax} · AC {pc.ac}</span>
                    </div>
                    <span class="roster-chip-go">›</span>
                  </button>
                  <button class="roster-chip-remove" onClick={() => removeCharacter(i())}>×</button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={sheetPC() !== null}>
        <div class="sheet-overlay" onClick={() => setSheetPC(null)}>
          <div class="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <CharSheet initialPC={sheetPC()} onClose={() => setSheetPC(null)} />
          </div>
        </div>
      </Show>

      <Show when={!mode()}>
        <h2 class="charcreate-title">
          {store.campaign.characters.length === 0 ? 'Create Your Character' : 'Add Character'}
        </h2>
        <div class="charcreate-paths">
          <button class="path-card path-card-featured" onClick={() => { setMode('quick'); rollQuickPick(); }}>
            <span class="path-icon">🎲</span>
            <span class="path-label">Quick Pick</span>
            <span class="path-desc">Random character, ready to play</span>
          </button>
          <button class="path-card" onClick={() => setMode('wizard')}>
            <span class="path-icon">🧙</span>
            <span class="path-label">Guided Build</span>
            <span class="path-desc">Step-by-step creation</span>
          </button>
          <button class="path-card" onClick={() => setMode('ai')}>
            <span class="path-icon">💬</span>
            <span class="path-label">Talk to AI</span>
            <span class="path-desc">Describe your idea</span>
          </button>
          <button class="path-card" onClick={() => setMode('paste')}>
            <span class="path-icon">📋</span>
            <span class="path-label">Import JSON</span>
            <span class="path-desc">From other tools</span>
          </button>
        </div>
      </Show>

      <Show when={mode() === 'quick'}>
        <QuickPick
          char={quickChar()}
          loading={quickLoading()}
          onReroll={rollQuickPick}
          onUse={commitQuickChar}
          onBack={() => { setMode(null); setQuickChar(null); }}
        />
      </Show>
      <Show when={mode() === 'ai'}>
        <AIBuilder onParsed={onCharParsed} onBack={() => setMode(null)} />
      </Show>
      <Show when={mode() === 'paste'}>
        <PasteImport onParsed={onCharParsed} onBack={() => setMode(null)} />
      </Show>
      <Show when={mode() === 'wizard'}>
        <CharWizard
          existingCount={store.campaign.characters.length}
          onComplete={handleWizardComplete}
          onBack={() => setMode(null)}
        />
      </Show>

      <Show when={draft()}>
        <div class="char-preview">
          <div class="preview-header" style={{ 'border-color': draft().color }}>
            <input
              class="preview-name-input"
              value={draft().name || ''}
              placeholder="Character name"
              onInput={(e) => setDraft({ ...draft(), name: e.target.value })}
            />
            <span class="preview-desc">{draft().race} {draft().class} Lv{draft().level}</span>
          </div>
          <div class="preview-stats">
            <span>HP: {draft().hpMax}</span>
            <span>AC: {draft().ac}</span>
            <span>Speed: {draft().speed}</span>
          </div>
          <Show when={draft().abilityScores}>
            <div class="preview-abilities">
              <For each={Object.entries(draft().abilityScores)}>
                {([k, v]) => <span class="preview-ability">{k.toUpperCase()} {v}</span>}
              </For>
            </div>
          </Show>

          <div class="preview-bio">
            <label class="preview-bio-label">Appearance</label>
            <textarea
              class="preview-bio-input"
              rows="2"
              value={draft().appearance || ''}
              placeholder="How do they look? Build, features, dress…"
              onInput={(e) => setDraft({ ...draft(), appearance: e.target.value })}
            />
            <label class="preview-bio-label">Personality</label>
            <textarea
              class="preview-bio-input"
              rows="3"
              value={draft().personality || ''}
              placeholder="Traits, ideals, bonds, flaws…"
              onInput={(e) => setDraft({ ...draft(), personality: e.target.value })}
            />
            <label class="preview-bio-label">Backstory</label>
            <textarea
              class="preview-bio-input"
              rows="6"
              value={draft().backstory || ''}
              placeholder="Origin, motivation, secrets — who were they before the adventure?"
              onInput={(e) => setDraft({ ...draft(), backstory: e.target.value })}
            />
          </div>

          <Show when={STARTING_EQUIPMENT[draft()?.class]}>
            <EquipmentPicker
              className={draft().class}
              level={draft().level}
              choices={equipChoices()}
              onChoice={setChoice}
              equipMode={equipMode()}
              onModeChange={setEquipMode}
            />
          </Show>
          <Show when={draftErrors().length > 0}>
            <div class="preview-errors">
              <For each={draftErrors()}>{(e) => <div class="preview-error">{e}</div>}</For>
            </div>
          </Show>
          <button class="preview-commit" onClick={commitCharacter} disabled={draftErrors().length > 0}>
            Use This Character
          </button>
        </div>
      </Show>
    </div>
  );
}

function QuickPick(props) {
  const char = () => props.char;
  const mod = (score) => {
    const m = Math.floor((score - 10) / 2);
    return m >= 0 ? `+${m}` : `${m}`;
  };

  return (
    <div class="quick-pick">
      <div class="qp-header">
        <button class="builder-back" onClick={props.onBack}>&larr;</button>
        <span class="qp-title">Quick Pick</span>
      </div>

      <Show when={props.loading}>
        <div class="qp-loading">
          <div class="qp-dice-spin">🎲</div>
          <span>Rolling a character...</span>
        </div>
      </Show>

      <Show when={char() && !props.loading}>
        <div class="qp-card" style={{ 'border-color': char().color }}>
          <div class="qp-card-header">
            <span class="qp-card-color" style={{ background: char().color }} />
            <div class="qp-card-identity">
              <span class="qp-card-name">{char().name}</span>
              <span class="qp-card-meta">{char().race} {char().class}</span>
            </div>
            <span class="qp-card-level">Lv{char().level}</span>
          </div>

          <div class="qp-card-stats">
            <div class="qp-stat">
              <span class="qp-stat-val">{char().hpMax}</span>
              <span class="qp-stat-label">HP</span>
            </div>
            <div class="qp-stat">
              <span class="qp-stat-val">{char().ac}</span>
              <span class="qp-stat-label">AC</span>
            </div>
            <div class="qp-stat">
              <span class="qp-stat-val">{char().speed}</span>
              <span class="qp-stat-label">Speed</span>
            </div>
            <div class="qp-stat">
              <span class="qp-stat-val">+{proficiencyBonus(char().level)}</span>
              <span class="qp-stat-label">Prof</span>
            </div>
          </div>

          <div class="qp-card-abilities">
            <For each={Object.entries(char().abilityScores)}>
              {([k, v]) => (
                <div class="qp-ability">
                  <span class="qp-ab-label">{k.toUpperCase()}</span>
                  <span class="qp-ab-score">{v}</span>
                  <span class="qp-ab-mod">{mod(v)}</span>
                </div>
              )}
            </For>
          </div>

          <Show when={char().background || char().alignment}>
            <div class="qp-card-detail">
              <Show when={char().background}><span>{char().background}</span></Show>
              <Show when={char().alignment}><span>{char().alignment}</span></Show>
            </div>
          </Show>

          <Show when={char().features?.length > 0}>
            <div class="qp-card-features">
              <For each={char().features}>
                {(f) => <span class="qp-feature-tag">{f}</span>}
              </For>
            </div>
          </Show>

          <Show when={char().attacks?.length > 0}>
            <div class="qp-card-attacks">
              <For each={char().attacks}>
                {(a) => (
                  <span class="qp-attack-tag">
                    {a.name} {a.bonus >= 0 ? '+' : ''}{a.bonus} · {a.damage}
                  </span>
                )}
              </For>
            </div>
          </Show>
        </div>

        <div class="qp-actions">
          <button class="qp-reroll" onClick={props.onReroll} disabled={props.loading}>
            🎲 Re-roll
          </button>
          <button class="qp-use" onClick={props.onUse}>
            Use This Character
          </button>
        </div>
      </Show>
    </div>
  );
}

function AIBuilder(props) {
  const [messages, setMessages] = createSignal([]);
  const [input, setInput] = createSignal('');
  const [streaming, setStreaming] = createSignal(false);
  let controller = null;

  async function send() {
    const text = input().trim();
    if (!text || streaming()) return;
    setInput('');

    const newMsgs = [...messages(), { role: 'user', content: text }];
    setMessages(newMsgs);
    setStreaming(true);

    const aiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
    controller = new AbortController();

    try {
      const stream = callProvider(aiMsgs, CHAR_BUILDER_SYSTEM, controller.signal);
      let full = '';
      setMessages([...newMsgs, { role: 'assistant', content: '' }]);

      for await (const chunk of stream) {
        full += chunk;
        setMessages([...newMsgs, { role: 'assistant', content: full }]);
      }

      const jsonMatch = full.match(/```CHARACTER_JSON\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          props.onParsed(parsed);
        } catch (_) {}
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setMessages([...newMsgs, { role: 'assistant', content: `Error: ${e.message}` }]);
      }
    } finally {
      setStreaming(false);
      controller = null;
    }
  }

  return (
    <div class="ai-builder">
      <button class="builder-back" onClick={props.onBack}>&larr; Back</button>
      <div class="builder-messages">
        <Show when={messages().length === 0}>
          <div class="builder-hint">Tell me about the character you want to play. Anything from "a sneaky elf" to a full build.</div>
        </Show>
        <For each={messages()}>
          {(msg) => (
            <div class={`builder-msg builder-msg-${msg.role}`}>
              {msg.content.replace(/```CHARACTER_JSON[\s\S]*?```/g, '[Character built! See preview below]')}
            </div>
          )}
        </For>
      </div>
      <div class="builder-input-row">
        <input
          class="builder-input"
          placeholder="Describe your character..."
          value={input()}
          onInput={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button class="builder-send" onClick={send} disabled={streaming()}>
          {streaming() ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function PasteImport(props) {
  const [text, setText] = createSignal('');
  const [error, setError] = createSignal('');

  function parse() {
    setError('');
    const raw = text().trim();
    if (!raw) { setError('Paste character JSON'); return; }

    try {
      const json = JSON.parse(raw);
      props.onParsed(json);
    } catch (_) {
      const jsonMatch = raw.match(/```(?:json|CHARACTER_JSON)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const json = JSON.parse(jsonMatch[1].trim());
          props.onParsed(json);
          return;
        } catch (_) {}
      }
      setError('Could not parse JSON. Make sure it\'s valid JSON format.');
    }
  }

  return (
    <div class="paste-import">
      <button class="builder-back" onClick={props.onBack}>&larr; Back</button>
      <textarea
        class="paste-area"
        placeholder="Paste character JSON here (from Gemini, ChatGPT, D&D Beyond, etc.)"
        value={text()}
        onInput={(e) => setText(e.target.value)}
      />
      {error() && <div class="paste-error">{error()}</div>}
      <button class="paste-btn" onClick={parse}>Import</button>
    </div>
  );
}

function EquipmentPicker(props) {
  const data = () => STARTING_EQUIPMENT[props.className];

  const defaultItems = () => {
    if (!data()) return [];
    return getDefaultEquipment(props.className);
  };

  const customItems = () => {
    if (!data()) return [];
    return getSelectedEquipment(props.className, props.choices);
  };

  const goldAmount = () => data()?.goldOption || getStartingGold(props.level || 1);

  return (
    <div class="equip-picker">
      <label class="equip-picker-label">Starting Equipment</label>
      <div class="equip-mode-bar">
        <button
          class={`equip-mode-chip ${props.equipMode === 'default' ? 'active' : ''}`}
          onClick={() => props.onModeChange('default')}
        >Default Pack</button>
        <button
          class={`equip-mode-chip ${props.equipMode === 'customize' ? 'active' : ''}`}
          onClick={() => props.onModeChange('customize')}
        >Customize</button>
        <button
          class={`equip-mode-chip ${props.equipMode === 'gold' ? 'active' : ''}`}
          onClick={() => props.onModeChange('gold')}
        >Take {goldAmount()} GP</button>
      </div>

      <Show when={props.equipMode === 'default'}>
        <div class="equip-default-list">
          <For each={defaultItems()}>
            {(item) => (
              <span class="equip-item-tag">{item.qty > 1 ? `${item.qty}x ` : ''}{item.name}</span>
            )}
          </For>
        </div>
        <div class="equip-summary">
          <span class="equip-gold">{getStartingGold(props.level || 1)} GP</span>
          <span class="equip-item-count">{defaultItems().length} items</span>
        </div>
      </Show>

      <Show when={props.equipMode === 'customize'}>
        <Show when={data()?.always?.length > 0}>
          <div class="equip-always">
            <For each={data().always}>
              {(item) => <span class="equip-item-tag">{item.qty > 1 ? `${item.qty}x ` : ''}{item.name}</span>}
            </For>
          </div>
        </Show>
        <For each={data()?.choices || []}>
          {(group, gi) => (
            <div class="equip-choice-group">
              <span class="equip-choice-label">{group.label}</span>
              <div class="equip-choice-options">
                <For each={group.options}>
                  {(opt, oi) => (
                    <button
                      class={`equip-chip ${(props.choices[gi()] ?? 0) === oi() ? 'active' : ''}`}
                      onClick={() => props.onChoice(gi(), oi())}
                    >
                      {opt.label}
                    </button>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
        <div class="equip-summary">
          <span class="equip-gold">{getStartingGold(props.level || 1)} GP</span>
          <span class="equip-item-count">{customItems().length} items</span>
        </div>
      </Show>

      <Show when={props.equipMode === 'gold'}>
        <div class="equip-gold-msg">
          Start with {goldAmount()} GP — buy equipment during play
        </div>
      </Show>
    </div>
  );
}
