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

// Compendium deep-link: set this before navigating to 'journal' so that
// the Journal switches to its lookup/compendium view.
export const [pendingCompendium, setPendingCompendium] = createSignal(null);

// Class/level pre-filter for Compendium (Journal doesn't clear this, Compendium does).
export const [compendiumFilter, setCompendiumFilter] = createSignal(null);

export function navigateToCompendium(tab = 'spells', classFilter = null) {
  if (classFilter) {
    const cls = classFilter.charAt(0).toUpperCase() + classFilter.slice(1).toLowerCase();
    setCompendiumFilter({ class: cls });
  } else {
    setCompendiumFilter(null);
  }
  setPendingCompendium(tab);
  navigateTo('journal');
}
