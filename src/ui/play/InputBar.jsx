import { createSignal, Show, lazy, Suspense } from 'solid-js';
import { isSending, stopGeneration } from '../../ai/engine.js';
import { sendMsg, sendTableTalk } from '../../ai/engine.js';
import DiceRoller from './DiceRoller.jsx';
import QuickActions from './QuickActions.jsx';

const DevTools = lazy(() => import('../manage/DevTools.jsx'));

export default function InputBar(props) {
  const [text, setText] = createSignal('');
  const [showTest, setShowTest] = createSignal(false);
  const [showDice, setShowDice] = createSignal(false);
  let inputRef;

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
      <QuickActions tab={props.tab} onPrefill={(t) => { setText(t); inputRef?.focus(); }} />
      <div class="input-row">
        <textarea
          ref={inputRef}
          class="input-field"
          placeholder={props.tab === 'ooc' ? 'Talk to the party...' : 'What do you do?'}
          value={text()}
          onInput={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows="1"
        />
        {isSending() ? (
          <button class="btn-stop" onClick={stopGeneration}>Stop</button>
        ) : props.tab === 'ooc' ? (
          <div class="ooc-buttons">
            <button class="btn-send" onClick={handleSend} disabled={!text().trim()}>Send</button>
            <button class="btn-ask-dm" onClick={handleAskDm} disabled={!text().trim()}>Ask DM</button>
          </div>
        ) : (
          <button class="btn-send" onClick={handleSend} disabled={!text().trim()}>Send</button>
        )}
      </div>
      <Show when={showDice()}>
        <DiceRoller />
      </Show>
      <div class="test-controls">
        <button class="btn-test-toggle" onClick={() => setShowDice(!showDice())}>
          {showDice() ? '▾ Dice' : '▸ Dice'}
        </button>
        <button class="btn-test-toggle" onClick={() => setShowTest(!showTest())}>
          {showTest() ? '▾ Test' : '▸ Test'}
        </button>
      </div>
      <Show when={showTest()}>
        <Suspense fallback={<div class="test-loading">Loading...</div>}>
          <DevTools />
        </Suspense>
      </Show>
    </div>
  );
}
