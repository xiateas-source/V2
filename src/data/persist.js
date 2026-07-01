// Local-first persistence spine (Law 1: play continues locally, reconciles on
// reconnect). The campaign is snapshotted to IndexedDB on change and restored on
// boot, so a reload no longer wipes the session back to onboarding. Firebase
// (sync.js) remains the cross-device backup; here we read it only to reconcile a
// newer cloud copy at boot.

import { createEffect, on, createSignal } from 'solid-js';

export const [lastSavedAt, setLastSavedAt] = createSignal(0);
import { unwrap, reconcile } from 'solid-js/store';
import { store, setStore } from '../state/index.js';
import { DEFAULT_CAMPAIGN, DEFAULT_CHARACTER, DEFAULT_CONTRACTS } from '../state/campaign.js';

// Every superseded DEFAULT_CONTRACTS string a field has ever held, oldest first.
// Used only to detect un-customized fields during the one-time migration below —
// each entry is a full history, not just the immediately-previous version, so a
// campaign that's been through several of these migrations still gets caught.
const STALE_CONTRACTS = {
  never: [
    // Pre-S48 (before the three-phase roll system existed).
    'Never auto-resolve a roll — when an action is uncertain, emit a roll_request and wait for the player\'s submitted result. Never resolve actions for a PC the player did not mention. Never kill a PC without death saves. Never reveal DM secrets or undiscovered content. Never change HP, gold, items, quests, NPCs, or location in prose without emitting the matching mechanic.',
    // Pre-S76 (before the classified-roll-scope clarification — a classified roll
    // was ambiguously worded as covering the whole message, letting an unrelated
    // matched skill silently govern a second, unmatched action in the same message).
    'Never auto-resolve a combat attack or saving throw — when one of those is uncertain, emit a roll_request and wait for the player\'s submitted result. Skill checks (Investigation, Persuasion, Stealth, etc.) are classified and rolled before you see the message — they arrive as a [ROLLS: ...] block with the outcome already decided; never contradict it, never request another roll for it, and never emit a redundant roll_request for an action that already has a result. Never resolve actions for a PC the player did not mention. Never kill a PC without death saves. Never reveal DM secrets or undiscovered content. Never change HP, gold, items, quests, NPCs, or location in prose without emitting the matching mechanic.',
  ],
};

// Firebase RTDB omits/nullifies empty arrays and empty objects on write, and can
// return a non-array/non-object for a field whose default is one. Recursively walk
// a restored object against its known-good default shape and patch any field back
// to an empty array/object (or its default) wherever Firebase dropped it — at any
// nesting depth, not just the top level (e.g. inventory.wagon, wagonState.animals).
function healStructure(value, defaults) {
  const out = { ...(value && typeof value === 'object' ? value : {}) };
  for (const [key, defVal] of Object.entries(defaults)) {
    const current = out[key];
    if (Array.isArray(defVal)) {
      if (!Array.isArray(current)) out[key] = [];
    } else if (defVal && typeof defVal === 'object') {
      out[key] = healStructure(current, defVal);
    } else if (current === undefined) {
      out[key] = defVal;
    }
  }
  return out;
}

// A message still marked partial:true in restored data means its stream was cut
// short by a reload/backgrounded tab before it could finish or error — the in-memory
// catch path that normally finalizes a stuck stream (finalizeStuckPartial in
// engine.js) only runs while that JS execution is still alive, so it never gets a
// chance to run in this case. Restore time is the only place left to heal it. Only
// the trailing entry can ever be partial (one stream runs at a time).
function healPartialMessages(list) {
  if (!Array.isArray(list) || list.length === 0) return list;
  const idx = list.length - 1;
  if (!list[idx]?.partial) return list;
  const healed = [...list];
  healed[idx] = { ...healed[idx], partial: false };
  return healed;
}

// This heals any array/object-typed field (at any depth) back to its default shape
// after merge/restore, and heals every character against DEFAULT_CHARACTER.
export function healArrays(obj) {
  const out = healStructure(obj, DEFAULT_CAMPAIGN);
  if (Array.isArray(out.characters)) {
    out.characters = out.characters.map(pc => healStructure(pc, DEFAULT_CHARACTER));
  }
  out.narrative = healPartialMessages(out.narrative);
  out.ooc = healPartialMessages(out.ooc);
  return out;
}
import { putAll, getByKey } from './local.js';
import { getUid, dbRead } from './firebase.js';

const ACTIVE_KEY = '_activeCampaignId';
const SNAP_PREFIX = '_campaign:';
const SAVE_DEBOUNCE = 800;

let saveTimer = null;
let hydrating = true;

function plain(obj) {
  return JSON.parse(JSON.stringify(unwrap(obj)));
}

function snapshot() {
  return {
    campaign: plain(store.campaign),
    playerIdentity: plain(store.system.playerIdentity),
    multiplay: plain(store.system.multiplay),
    theme: store.system.settings.theme,
    largeText: store.system.settings.largeText,
    testerNotes: store.system.testerNotes || '',
    ts: Date.now(),
  };
}

async function writeLocal() {
  const id = store.campaign.id;
  if (!id) return;
  const snap = snapshot();
  try {
    await putAll('meta', [
      { key: SNAP_PREFIX + id, value: snap, ts: snap.ts },
      { key: ACTIVE_KEY, value: id, ts: snap.ts },
    ]);
    setLastSavedAt(snap.ts);
  } catch (_) {}
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveTimer = null; writeLocal(); }, SAVE_DEBOUNCE);
}

export async function saveLocalNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  await writeLocal();
}

// Clear the active-campaign pointer locally (and best-effort in the cloud) so a
// reload/boot starts fresh at onboarding instead of restoring the old game.
export async function clearActiveCampaign() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  try { await putAll('meta', [{ key: ACTIVE_KEY, value: '', ts: Date.now() }]); } catch (_) {}
  try {
    const uid = getUid();
    if (uid) {
      const { dbWrite } = await import('./firebase.js');
      dbWrite(`players/${uid}/active`, { id: '', ts: Date.now() });
    }
  } catch (_) {}
}

// Full campaign + system snapshot for export/review. `notes` is optional
// freeform tester commentary (from MechTest's Testing Notes field) bundled
// alongside the state so a single export carries both.
export function exportSnapshot(notes = '') {
  return {
    exportedAt: new Date().toISOString(),
    ...(notes ? { testerNotes: notes } : {}),
    campaign: plain(store.campaign),
    system: { ...plain(store.system), providers: { ...plain(store.system.providers), geminiKey: '«redacted»', openrouterKey: '«redacted»' } },
  };
}

// Start watching the campaign for changes → debounced local save. Called after
// boot hydration so we never persist the empty default over a good save.
export function initLocalPersistence() {
  hydrating = false;
  createEffect(on(
    () => [
      store.campaign.id,
      store.campaign.narrative.length,
      store.campaign.ooc.length,
      store.campaign.characters.map(p => `${p.hp}/${p.hpMax}/${p.xp}`).join(','),
      JSON.stringify(store.campaign.gold),
      store.campaign.quests.length,
      store.campaign.consequences.map(c => c.resolved).join(','),
      store.campaign.npcs.length,
      store.campaign.locations.length,
      store.campaign.location,
      store.campaign.time,
      store.campaign.weather,
      store.campaign.combatState.active,
      store.campaign.combatState.currentTurn,
      JSON.stringify(store.campaign.inventory),
      store.campaign.chapters.length,
      Object.keys(store.campaign.activeBundles).length,
    ],
    () => { if (!hydrating && store.campaign.id) scheduleSave(); },
    { defer: true }
  ));

  // Safety net: flush immediately when the tab is backgrounded or closed.
  const flush = () => { if (store.campaign.id) writeLocal(); };
  window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);
}

async function loadLocalSnapshot() {
  try {
    const active = await getByKey('meta', ACTIVE_KEY);
    if (!active?.value) return null;
    const rec = await getByKey('meta', SNAP_PREFIX + active.value);
    return rec?.value || null;
  } catch (_) { return null; }
}

// Boot restore. Local first (fast, complete, offline-safe); if a newer cloud
// copy exists, prefer its world state but union chat so a trimmed cloud snapshot
// can't truncate local history. Returns true if a campaign was restored.
export async function restoreSession() {
  let snap = await loadLocalSnapshot();

  try {
    const uid = getUid();
    if (uid && snap?.campaign?.id) {
      const cloud = await loadCloud(snap.campaign.id);
      if (cloud && (cloud.updatedAt || 0) > (snap.ts || 0)) {
        snap = { ...snap, campaign: mergeCampaign(snap.campaign, cloud), ts: cloud.updatedAt };
      }
    } else if (uid && !snap) {
      // Fresh device: discover the active campaign from the cloud pointer.
      const ptr = await dbRead(`players/${uid}/active`);
      if (ptr?.id) {
        const cloud = await loadCloud(ptr.id);
        if (cloud) snap = { campaign: { ...cloud, id: ptr.id }, ts: cloud.updatedAt || Date.now() };
      }
    }
  } catch (_) {}

  if (snap?.campaign?.id) {
    setStore('campaign', reconcile(healArrays({ ...structuredClone(DEFAULT_CAMPAIGN), ...snap.campaign })));
    setStore('system', 'activeCampaignId', snap.campaign.id);
    // Heal older saves that predate default contracts (empty persona ⇒ no DM spine).
    const con = store.campaign.contracts || {};
    if (!con.persona) {
      setStore('campaign', 'contracts', {
        ...con,
        persona: DEFAULT_CONTRACTS.persona,
        never: DEFAULT_CONTRACTS.never,
        actions: DEFAULT_CONTRACTS.actions,
        continuity: DEFAULT_CONTRACTS.continuity,
        multi: DEFAULT_CONTRACTS.multi,
      });
    } else {
      // One-time migration: a contract field still holding any past DEFAULT_CONTRACTS
      // string verbatim (never customized by the player) gets refreshed to the
      // current default, so engine updates (e.g. the three-phase roll flow) reach
      // existing campaigns. Anything the player edited is left untouched.
      for (const [key, staleTexts] of Object.entries(STALE_CONTRACTS)) {
        if (staleTexts.includes(con[key])) {
          setStore('campaign', 'contracts', key, DEFAULT_CONTRACTS[key]);
        }
      }
    }
    if (snap.playerIdentity) setStore('system', 'playerIdentity', snap.playerIdentity);
    // Only fall back to the locally-persisted role if restoreGuestSession() (which
    // runs first, at boot, and checks Firebase) didn't already establish guest mode —
    // that cloud pointer is more authoritative when both are available.
    if (snap.multiplay?.role === 'guest' && snap.multiplay?.hostUid && store.system.multiplay?.role === 'solo') {
      setStore('system', 'multiplay', snap.multiplay);
    }
    if (snap.theme) {
      setStore('system', 'settings', 'theme', snap.theme);
      document.documentElement.setAttribute('data-theme', snap.theme);
    }
    if (snap.largeText) {
      setStore('system', 'settings', 'largeText', true);
      document.documentElement.style.fontSize = '20px';
    }
    if (snap.testerNotes) setStore('system', 'testerNotes', snap.testerNotes);
    return true;
  }
  return false;
}

async function loadCloud(id) {
  try {
    const { loadCampaignFromCloud } = await import('./sync.js');
    return await loadCampaignFromCloud(id);
  } catch (_) { return null; }
}

export function mergeCampaign(localC, cloudC) {
  const merged = healArrays({ ...localC, ...cloudC });
  merged.narrative = unionById(localC.narrative, cloudC.narrative);
  merged.ooc = unionById(localC.ooc, cloudC.ooc);
  merged.presence = mergeByTimestamp(localC.presence, cloudC.presence);
  merged.activeBundles = mergeByTimestamp(localC.activeBundles, cloudC.activeBundles);
  return merged;
}

// Generic per-key merge for any object keyed by id where each entry carries
// its own `ts` — a locally newer entry always wins over an older cloud one,
// while genuinely newer entries from another device still come through.
// Originally written for `presence` (a device can flip its own entry locally
// and have a *different* device's in-flight full-snapshot write, built before
// it learned of that change, land moments later and wholesale-overwrite it
// back to stale, causing a visible flicker) — `activeBundles` has the exact
// same shape of problem (two players toggling different bundles near-
// simultaneously) and reuses the same fix rather than a plain array union,
// which could never let a deactivated bundle actually stay deactivated.
function mergeByTimestamp(local = {}, cloud = {}) {
  const merged = {};
  for (const key of new Set([...Object.keys(local || {}), ...Object.keys(cloud || {})])) {
    const a = local?.[key];
    const b = cloud?.[key];
    merged[key] = (a?.ts || 0) >= (b?.ts || 0) ? (a || b) : (b || a);
  }
  return merged;
}

export function unionById(a = [], b = []) {
  const seen = new Map();
  for (const m of [...(a || []), ...(b || [])]) {
    if (!m) continue;
    const key = m.id || `${m.ts}:${(m.content || '').slice(0, 24)}`;
    if (!seen.has(key)) seen.set(key, m);
  }
  return [...seen.values()].sort((x, y) => (x.ts || 0) - (y.ts || 0));
}
