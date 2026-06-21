import { createEffect, on } from 'solid-js';
import { store } from '../state/index.js';
import { dbWrite, getUid, isConnected } from './firebase.js';

let syncTimer = null;
const SYNC_DEBOUNCE = 3000;

function getCampaignPath() {
  const uid = getUid();
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

export async function loadCampaignFromCloud(campaignId) {
  const uid = getUid();
  if (!uid || !campaignId) return null;
  const { dbRead } = await import('./firebase.js');
  return dbRead(`campaigns/${uid}/${campaignId}`);
}

export async function forceSyncNow() {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  const path = getCampaignPath();
  if (!path) return;
  await dbWrite(path, getSyncPayload());
}
