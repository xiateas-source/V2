import { createSignal } from 'solid-js';
import { sendMsg, isSending, stopGeneration } from '../../ai/engine.js';

export default function InputBar(props) {
  const [text, setText] = createSignal('');
  let inputRef;

  async function handleSend() {
    const msg = text().trim();
    if (!msg || isSending()) return;
    setText('');
    inputRef?.focus();
    await sendMsg(msg, { tab: props.tab });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div class="input-bar">
      <textarea
        ref={inputRef}
        class="input-field"
        placeholder={props.tab === 'ooc' ? 'Ask a rules question...' : 'What do you do?'}
        value={text()}
        onInput={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows="1"
      />
      {isSending() ? (
        <button class="btn-stop" onClick={stopGeneration}>Stop</button>
      ) : (
        <button class="btn-send" onClick={handleSend} disabled={!text().trim()}>Send</button>
      )}
    </div>
  );
}
