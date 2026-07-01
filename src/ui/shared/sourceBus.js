// Tiny event bus for tap-to-source navigation (Law 4: any displayed info is
// tappable and routes to its home). Components dispatch; App / CharTiles listen.
import { createSignal } from 'solid-js';

export function navigateTo(mode) {
  window.dispatchEvent(new CustomEvent('tp-navigate', { detail: { mode } }));
}

export function openCharSheet(pcName) {
  window.dispatchEvent(new CustomEvent('tp-charsheet', { detail: { pcName } }));
}

// NPC deep-link: set this before calling navigateTo('journal') so that
// the NPCCard matching the name auto-opens and scrolls into view.
export const [pendingNpcFocus, setPendingNpcFocus] = createSignal(null);

export function navigateToNPC(name) {
  setPendingNpcFocus(name);
  navigateTo('journal');
}
