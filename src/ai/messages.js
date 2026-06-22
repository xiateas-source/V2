import { store } from '../state/index.js';

function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createNarrativeMsg(type, content, extras = {}) {
  return {
    id: genId('nar'),
    type,
    content,
    ts: Date.now(),
    gameTs: store.campaign.time || null,
    playerName: type === 'player' ? (store.system.playerIdentity?.name || null) : null,
    partial: false,
    ...extras,
  };
}

export function createOOCMsg(type, content, extras = {}) {
  return {
    id: genId('ooc'),
    type,
    content,
    ts: Date.now(),
    gameTs: store.campaign.time || null,
    playerName: type === 'player' ? (store.system.playerIdentity?.name || null) : null,
    partial: false,
    ...extras,
  };
}

export function msgToRole(msg) {
  if (msg.type === 'player') return 'user';
  if (msg.type === 'dm' || msg.type === 'dm_advisory') return 'assistant';
  if (msg.role === 'user') return 'user';
  if (msg.role === 'assistant') return 'assistant';
  return 'system';
}

export function isPlayMsg(msg) {
  const t = msg.type || '';
  if (t === 'player' || t === 'dm' || t === 'dm_advisory') return true;
  if (!t && msg.role) return msg.role === 'user' || msg.role === 'assistant';
  return false;
}

export function migrateMsg(msg) {
  if (msg.id && msg.type) return msg;
  const type = msg.role === 'user' ? 'player'
    : msg.role === 'assistant' ? 'dm'
    : 'system';
  return { id: genId('nar'), type, content: msg.content, ts: msg.ts || Date.now(), gameTs: null, playerName: null, partial: false, ...msg };
}
