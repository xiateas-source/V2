import { createSignal, Show, lazy, Suspense, onMount, onCleanup } from 'solid-js';
import { isSending, stopGeneration } from '../../ai/engine.js';
import { sendMsg, sendTableTalk } from '../../ai/engine.js';
import { store } from '../../state/index.js';
import QuickActions from './QuickActions.jsx';
import Rewind from './Rewind.jsx';
import { D20 } from '../shared/icons.jsx';

const MechTest = lazy(() => import('../manage/MechTest.jsx'));

export default function InputBar(props) {
  const [text, setText] = createSignal('');
  // One drawer slot above the input row: 'actions' (quick actions / dice),
  // 'test' (mechanics test container), or null.
  const [drawer, setDrawer] = createSignal(null);
  let inputRef;

  // Combat turn prompt quick-actions prefill the input so the player can finish
  // the action (add a target) before sending.
  function onPrefill(e) {
    setText(e.detail?.text || '');
    inputRef?.focus();
  }
  onMount(() => window.addEventListener('prefill-input', onPrefill));
  onCleanup(() => window.removeEventListener('prefill-input', onPrefill));

  function toggle(name) {
    setDrawer(drawer() === name ? null : name);
  }

  function prefillFromAction(t) {
    setText(t);
    inputRef?.focus();
  }

  async function handleSend() {
    const msg = text().trim();
    if (!msg || isSending()) return;
    setText('');
    inputRef?.focus();
    if (props.tab === 'ooc') {
      sendTableTalk(msg);
    } else {
      await sendMsg(msg, { tab: props.tab });
    }
  }

  async function handleAskDm() {
    const msg = text().trim();
    if (!msg || isSending()) return;
    setText('');
    inputRef?.focus();
    await sendMsg(msg, { tab: 'ooc' });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div class="input-bar">
      <Show when={drawer() === 'actions'}>
        <QuickActions controlled open tab={props.tab} onPrefill={prefillFromAction} onClose={() => setDrawer(null)} />
      </Show>
      <Show when={drawer() === 'test'}>
        <Suspense fallback={<div class="test-loading">Loading test container…</div>}>
          <MechTest onClose={() => setDrawer(null)} />
        </Suspense>
      </Show>

      <div class="input">
        <Rewind />
        <textarea
          ref={inputRef}
          class="field"
          placeholder={props.tab === 'ooc' ? 'Talk to the party…' : 'What do you do?'}
          value={text()}
          onInput={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows="1"
        />
        <Show when={props.tab !== 'ooc'}>
          <button
            class={`dice ${drawer() === 'actions' ? 'active' : ''}`}
            onClick={() => toggle('actions')}
            title="Quick actions & dice"
          >
            <D20 />
          </button>
        </Show>
        {isSending() ? (
          <button class="btn-stop" onClick={stopGeneration}>Stop</button>
        ) : props.tab === 'ooc' ? (
          <div class="ooc-buttons">
            <button class="btn-send-pill" onClick={handleSend} disabled={!text().trim()}>Send</button>
            <button class="btn-ask-dm" onClick={handleAskDm} disabled={!text().trim()}>Ask DM</button>
          </div>
        ) : (
          <button class="send" onClick={handleSend} disabled={!text().trim()} title="Send">
            <i class="ph ph-paper-plane-right" />
          </button>
        )}
      </div>

      <div class="input-dev">
        <button
          class={`btn-mechtest ${drawer() === 'test' ? 'active' : ''}`}
          onClick={() => toggle('test')}
          title="Test container — fire mechanics and watch state update"
        >
          <i class="ph ph-flask" /> Test
        </button>
      </div>
    </div>
  );
}
