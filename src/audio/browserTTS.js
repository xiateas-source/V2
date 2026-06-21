import { createSignal } from 'solid-js';

const [speaking, setSpeaking] = createSignal(false);
const [autoRead, setAutoRead] = createSignal(false);

let currentUtterance = null;

function cleanForSpeech(text) {
  let clean = text
    .replace(/---MECHANICS---[\s\S]*?---END---/g, '')
    .replace(/MECHANICS BLOCK:[\s\S]*?---END---/g, '')
    .replace(/\*\*\*[\s\S]*$/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();
  return clean;
}

export function speak(text) {
  if (!window.speechSynthesis) return;
  stop();

  const clean = cleanForSpeech(text);
  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.0;
  utterance.pitch = 0.95;

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) ||
    voices.find(v => v.lang.startsWith('en') && !v.name.includes('Google')) ||
    voices.find(v => v.lang.startsWith('en'));
  if (preferred) utterance.voice = preferred;

  utterance.onstart = () => setSpeaking(true);
  utterance.onend = () => { setSpeaking(false); currentUtterance = null; };
  utterance.onerror = () => { setSpeaking(false); currentUtterance = null; };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stop() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  setSpeaking(false);
  currentUtterance = null;
}

export function toggleAutoRead() {
  setAutoRead(!autoRead());
}

export { speaking, autoRead };
