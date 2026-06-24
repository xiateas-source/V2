// Tiny event bus for tap-to-source navigation (Law 4: any displayed info is
// tappable and routes to its home). Components dispatch; App / CharTiles listen.

export function navigateTo(mode) {
  window.dispatchEvent(new CustomEvent('tp-navigate', { detail: { mode } }));
}

export function openCharSheet(pcName) {
  window.dispatchEvent(new CustomEvent('tp-charsheet', { detail: { pcName } }));
}
