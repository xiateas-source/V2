import { createEffect, on } from 'solid-js';
import { store, setStore } from '../state/index.js';
import { dbWrite, dbRead, dbListen, getUid } from './firebase.js';
import { mergeCampaign } from './persist.js';
import { DEFAULT_CAMPAIGN } from '../state/campaign.js';
import { saveLocalNow } from './persist.js';

let syncTimer = null;
let liveUnsub = null;
const SYNC_DEBOUNCE = 3000;

// The campaign always lives at the HOST's uid path. Guests write to the same
// path they read from — the host's namespace — so both devices share one record.
function getCampaignPath() {
  const mp = store.system.multiplay;
  const uid = (mp?.role === 'guest' && mp?.hostUid) ? mp.hostUid : getUid();
  const id = store.campaign.id;
  if (!uid || !id) return null;
  return `campaigns/${uid}/${id}`;
}

function getSyncPayload() {
  const c = store.campaign;
  return {
    characters: c.characters,
    location: c.location,
    locDesc: c.locDesc,
    time: c.time,
    weather: c.weather,
    gold: c.gold,
    inventory: c.inventory,
    quests: c.quests,
    primaryMission: c.primaryMission,
    npcs: c.npcs,
    consequences: c.consequences,
    combatState: c.combatState,
    chapters: c.chapters,
    locations: c.locations,
    townReputation: c.townReputation,
    travelLog: c.travelLog,
    wagonState: c.wagonState,
    narrative: c.narrative.slice(-50),
    ooc: c.ooc.slice(-20),
    contracts: c.contracts,
    name: c.name,
    setting: c.setting,
    premise: c.premise,
    narrationStyle: c.narrationStyle,
    updatedAt: Date.now(),
  };
}

function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    const path = getCampaignPath();
    if (!path) return;
    const payload = getSyncPayload();
    dbWrite(path, payload);
    // Keep the active-campaign pointer so a fresh device knows what to restore.
    // For guests, point to the host path so they can re-join on reload.
    const uid = getUid();
    if (uid) dbWrite(`players/${uid}/active`, { id: store.campaign.id, ts: Date.now() });
    const mp = store.system.multiplay;
    if (mp?.role === 'guest' && mp?.hostUid) {
      dbWrite(`players/${uid}/joined`, { hostUid: mp.hostUid, campaignId: store.campaign.id, ts: Date.now() });
    }
  }, SYNC_DEBOUNCE);
}

export function initSync() {
  createEffect(on(
    () => [
      store.campaign.characters.map(pc => pc.hp),
      store.campaign.gold.gp,
      store.campaign.quests.length,
      store.campaign.narrative.length,
      store.campaign.combatState.active,
      store.campaign.location,
    ],
    () => {
      if (store.campaign.id) scheduleSync();
    },
    { defer: true }
  ));
}

// Wire a realtime listener so this device sees changes other players write.
// Both host and guest call this — the host listens so they see guest actions.
export function startLiveSync() {
  stopLiveSync();
  const path = getCampaignPath();
  if (!path) return;
  liveUnsub = dbListen(path, (data) => {
    if (!data || !store.campaign.id) return;
    const merged = mergeCampaign(store.campaign, data);
    setStore('campaign', merged);
  });
}

export function stopLiveSync() {
  if (liveUnsub) { liveUnsub(); liveUnsub = null; }
}

export async function loadCampaignFromCloud(campaignId) {
  const uid = getUid();
  if (!uid || !campaignId) return null;
  return dbRead(`campaigns/${uid}/${campaignId}`);
}

export async function forceSyncNow() {
  if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
  const path = getCampaignPath();
  if (!path) return;
  await dbWrite(path, getSyncPayload());
}

// Build the shareable invite string for this campaign.
export function buildShareId() {
  const uid = getUid();
  const id = store.campaign.id;
  if (!uid || !id) return null;
  return `${uid}~${id}`;
}

// Parse a share ID string. Returns { hostUid, campaignId } or null.
export function parseShareId(raw) {
  const str = (raw || '').trim();
  const tilde = str.indexOf('~');
  if (tilde < 1) return null;
  const hostUid = str.slice(0, tilde);
  const campaignId = str.slice(tilde + 1);
  if (!hostUid || !campaignId) return null;
  return { hostUid, campaignId };
}

// Load a campaign by share ID and switch this device into guest mode.
export async function joinCampaign(shareIdRaw) {
  const parsed = parseShareId(shareIdRaw);
  if (!parsed) throw new Error('Invalid invite code — check and try again.');

  const { hostUid, campaignId } = parsed;
  const data = await dbRead(`campaigns/${hostUid}/${campaignId}`);
  if (!data) throw new Error('Campaign not found. Make sure the host is online and the code is correct.');

  setStore('campaign', { ...DEFAULT_CAMPAIGN, ...data, id: campaignId });
  setStore('system', 'activeCampaignId', campaignId);
  setStore('system', 'multiplay', { role: 'guest', hostUid });

  await saveLocalNow();
  startLiveSync();
}

// On boot: check if this device previously joined a campaign and reconnect.
export async function restoreGuestSession() {
  const uid = getUid();
  if (!uid) return false;
  try {
    const joined = await dbRead(`players/${uid}/joined`);
    if (!joined?.hostUid || !joined?.campaignId) return false;
    setStore('system', 'multiplay', { role: 'guest', hostUid: joined.hostUid });
    return true;
  } catch {
    return false;
  }
}
