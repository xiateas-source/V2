import { createSignal, onMount, onCleanup, For } from 'solid-js';

// Global toast host. Listens for `toast` CustomEvents dispatched anywhere in the
// app (engine stop, manual override, rest, etc.) and shows a transient stack.
// Dispatch with: window.dispatchEvent(new CustomEvent('toast',
//   { detail: { text: 'Saved', type: 'success' } }))
// type: 'info' (default) | 'success' | 'error'. Tap a toast to dismiss early.

let nextId = 1;

export default function Toast() {
  const [toasts, setToasts] = createSignal([]);

  function dismiss(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  function add(detail) {
    const id = nextId++;
    setToasts(prev => [...prev, {
      id,
      text: detail.text || '',
      type: detail.type || 'info',
    }]);
    const ms = detail.duration || 2800;
    setTimeout(() => dismiss(id), ms);
  }

  function handler(e) {
    if (e?.detail?.text) add(e.detail);
  }

  onMount(() => window.addEventListener('toast', handler));
  onCleanup(() => window.removeEventListener('toast', handler));

  return (
    <div class="toast-stack">
      <For each={toasts()}>
        {(t) => (
          <div class={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
            {t.text}
          </div>
        )}
      </For>
    </div>
  );
}
