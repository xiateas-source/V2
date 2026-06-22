import { createSignal, Show, For } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { callProvider } from '../../ai/providers.js';
import { CHAR_BUILDER_SYSTEM } from '../../ai/setupPrompts.js';
import { normalizeCharacter, validateCharacter } from '../../content/normalizer.js';
import { buildCharacter, AVAILABLE_CLASSES, AVAILABLE_RACES } from '../../data/quickBuild.js';

export default function CharCreate(props) {
  const [mode, setMode] = createSignal(null);
  const [draft, setDraft] = createSignal(null);
  const [draftErrors, setDraftErrors] = createSignal([]);

  function commitCharacter() {
    const char = draft();
    if (!char) return;
    const idx = store.campaign.characters.length;
    setStore('campaign', 'characters', idx, char);
    setDraft(null);
    setMode(null);
  }

  function removeCharacter(idx) {
    const updated = store.campaign.characters.filter((_, i) => i !== idx);
    setStore('campaign', 'characters', updated);
  }

  function onCharParsed(charObj) {
    const normalized = normalizeCharacter(charObj);
    if (!normalized) return;
    normalized.color = ['#4ae0a0', '#a070e0', '#e08040', '#4a9eff', '#e06080'][store.campaign.characters.length % 5];
    const { valid, errors } = validateCharacter(normalized);
    setDraftErrors(errors);
    setDraft(normalized);
  }

  return (
    <div class="charcreate">
      <h2 class="charcreate-title">Create Character</h2>

      <Show when={!mode()}>
        <div class="charcreate-paths">
          <button class="path-card" onClick={() => setMode('ai')}>
            <span class="path-icon">💬</span>
            <span class="path-label">Talk to AI</span>
            <span class="path-desc">Describe your character idea</span>
          </button>
          <button class="path-card" onClick={() => setMode('paste')}>
            <span class="path-icon">📋</span>
            <span class="path-label">Paste JSON</span>
            <span class="path-desc">From Gemini, ChatGPT, etc.</span>
          </button>
          <button class="path-card" onClick={() => setMode('quick')}>
            <span class="path-icon">⚡</span>
            <span class="path-label">Quick Pick</span>
            <span class="path-desc">Class + Race + Level → done</span>
          </button>
        </div>
      </Show>

      <Show when={mode() === 'ai'}>
        <AIBuilder onParsed={onCharParsed} onBack={() => setMode(null)} />
      </Show>
      <Show when={mode() === 'paste'}>
        <PasteImport onParsed={onCharParsed} onBack={() => setMode(null)} />
      </Show>
      <Show when={mode() === 'quick'}>
        <QuickBuild onParsed={onCharParsed} onBack={() => setMode(null)} />
      </Show>

      <Show when={draft()}>
        <div class="char-preview">
          <div class="preview-header" style={{ 'border-color': draft().color }}>
            <span class="preview-name">{draft().name || 'Unnamed'}</span>
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

      <Show when={store.campaign.characters.length > 0}>
        <div class="charcreate-existing">
          <For each={store.campaign.characters}>
            {(pc, i) => (
              <span class="existing-chip" style={{ background: pc.color }}>
                {pc.name}
                <button class="existing-chip-remove" onClick={() => removeCharacter(i())}>×</button>
              </span>
            )}
          </For>
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

function QuickBuild(props) {
  const [name, setName] = createSignal('');
  const [cls, setCls] = createSignal('Fighter');
  const [race, setRace] = createSignal('Human');
  const [level, setLevel] = createSignal(1);
  const [building, setBuilding] = createSignal(false);

  async function build() {
    setBuilding(true);
    try {
      const char = await buildCharacter(
        { name: name(), race: race(), className: cls(), level: level() },
        store.campaign.characters.length,
      );
      if (char) props.onParsed(char);
    } finally {
      setBuilding(false);
    }
  }

  return (
    <div class="quick-build">
      <button class="builder-back" onClick={props.onBack}>&larr; Back</button>

      <input
        class="qb-name"
        placeholder="Character name"
        value={name()}
        onInput={(e) => setName(e.target.value)}
      />

      <div class="qb-section">
        <label class="qb-label">Class</label>
        <div class="qb-options">
          <For each={AVAILABLE_CLASSES}>
            {(c) => <button class={`qb-chip ${cls() === c ? 'active' : ''}`} onClick={() => setCls(c)}>{c}</button>}
          </For>
        </div>
      </div>

      <div class="qb-section">
        <label class="qb-label">Race</label>
        <div class="qb-options">
          <For each={AVAILABLE_RACES}>
            {(r) => <button class={`qb-chip ${race() === r ? 'active' : ''}`} onClick={() => setRace(r)}>{r}</button>}
          </For>
        </div>
      </div>

      <div class="qb-section">
        <label class="qb-label">Level {level()}</label>
        <div class="qb-level">
          <button class="qb-level-btn" onClick={() => setLevel(Math.max(1, level() - 1))}>-</button>
          <span class="qb-level-val">{level()}</span>
          <button class="qb-level-btn" onClick={() => setLevel(Math.min(10, level() + 1))}>+</button>
        </div>
      </div>

      <button class="qb-build" onClick={build} disabled={building()}>
        {building() ? 'Building...' : 'Build Character'}
      </button>
    </div>
  );
}
