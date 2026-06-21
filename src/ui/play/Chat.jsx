import { createSignal, createEffect, For, Show, onMount } from 'solid-js';
import { store } from '../../state/index.js';
import { sendMsg, isSending, stopGeneration } from '../../ai/engine.js';
import InputBar from './InputBar.jsx';

export default function Chat() {
  const [tab, setTab] = createSignal('narrative');
  let chatEnd;

  const messages = () => {
    const key = tab();
    return store.campaign[key] || [];
  };

  createEffect(() => {
    messages();
    setTimeout(() => chatEnd?.scrollIntoView({ behavior: 'smooth' }), 50);
  });

  return (
    <div class="chat-container">
      <div class="chat-tabs">
        <button
          class={tab() === 'narrative' ? 'tab active' : 'tab'}
          onClick={() => setTab('narrative')}
        >
          Narrative
        </button>
        <button
          class={tab() === 'ooc' ? 'tab active' : 'tab'}
          onClick={() => setTab('ooc')}
        >
          Ask DM
        </button>
      </div>

      <div class="chat-messages">
        <For each={messages()}>
          {(msg) => (
            <div class={`msg msg-${msg.role}`}>
              <Show when={msg.isSummary}>
                <div class="msg-summary-badge">Prior context</div>
              </Show>
              <div class="msg-content" innerHTML={formatMsg(msg.content)} />
              <Show when={msg.mechReceipt}>
                <div class="msg-receipt">{msg.mechReceipt}</div>
              </Show>
            </div>
          )}
        </For>
        <div ref={chatEnd} />
      </div>

      <InputBar tab={tab()} />
    </div>
  );
}

function formatMsg(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/\*\*\*\n?/g, '<hr class="campaign-break">');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/\n/g, '<br>');

  return html;
}
