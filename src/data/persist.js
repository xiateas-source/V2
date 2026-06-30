// Local-first persistence spine (Law 1: play continues locally, reconciles on
// reconnect). The campaign is snapshotted to IndexedDB on change and restored on
// boot, so a reload no longer wipes the session back to onboarding. Firebase
// (sync.js) remains the cross-device backup; here we read it only to reconcile a
// newer cloud copy at boot.

import { createEffect, on } from 'solid-js';
import { unwrap } from 'solid-js/store';
import { store, setStore } from '../state/index.js';
import { DEFAULT_CAMPAIGN, DEFAULT_CHARACTER, DEFAULT_CONTRACTS } from '../state/campaign.js';

// Superseded DEFAULT_CONTRACTS text from before the three-phase roll system (S48).
// Used only to detect un-customized fields during the one-time migration below.
const STALE_CONTRACTS = {
  never: 'Never auto-resolve a roll — when an action is uncertain, emit a roll_request and wait for the player\'s submitted result. Never resolve actions for a PC the player did not mention. Never kill a PC without death saves. Never reveal DM secrets or undiscovered content. Never change HP, gold, items, quests, NPCs, or location in prose without emitting the matching mechanic.',
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

// Full campaign + system snapshot for export/review.
export function exportSnapshot() {
  return {
    exportedAt: new Date().toISOString(),
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
    setStore('campaign', healArrays({ ...structuredClone(DEFAULT_CAMPAIGN), ...snap.campaign }));
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
      // One-time migration: a contract field still holding an old DEFAULT_CONTRACTS
      // string verbatim (never customized by the player) gets refreshed to the
      // current default, so engine updates (e.g. the three-phase roll flow) reach
      // existing campaigns. Anything the player edited is left untouched.
      for (const [key, staleText] of Object.entries(STALE_CONTRACTS)) {
        if (con[key] === staleText) {
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
  merged.presence = mergePresence(localC.presence, cloudC.presence);
  merged.characters = mergeCharacters(localC.characters, cloudC.characters);
  return merged;
}

// Characters are union-merged by id so a local-only addition (e.g. a new guest
// character whose 3s Firebase sync hadn't fired before the tab was killed) isn't
// silently wiped out when the live-sync listener fires on reload with stale cloud
// data. Cloud wins per-character (latest HP/stats), but local-only chars survive.
function mergeCharacters(local = [], cloud = []) {
  const byId = new Map();
  for (const c of local) { if (c?.id) byId.set(c.id, c); }
  for (const c of cloud) { if (c?.id) byId.set(c.id, c); }
  const withId = Array.from(byId.values());
  const noId = (cloud.length ? cloud : local).filter(c => !c?.id);
  // Heal each character: Firebase omits empty arrays on write, so fields like
  // conditions/resistances/resources may come back undefined from the cloud copy.
  return [...withId, ...noId].map(c => healStructure(c, DEFAULT_CHARACTER));
}

// presence is the fastest-changing, most racy field in the campaign payload —
// a device can flip its own entry locally and have a *different* device's
// in-flight full-snapshot write (built before it learned of that change) land
// moments later and wholesale-overwrite it back to stale, causing the toggle to
// visibly flicker. Merge per-uid by ts so a locally newer entry always wins over
// an older cloud one, while still picking up genuinely newer entries from others.
function mergePresence(local = {}, cloud = {}) {
  const merged = {};
  for (const uid of new Set([...Object.keys(local || {}), ...Object.keys(cloud || {})])) {
    const a = local?.[uid];
    const b = cloud?.[uid];
    merged[uid] = (a?.ts || 0) >= (b?.ts || 0) ? (a || b) : (b || a);
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
