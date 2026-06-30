import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simulates two devices sharing one campaign without touching real Firebase.
// The app has exactly one Solid store per browser tab/profile, so "device" here
// means "whatever uid getUid() currently returns" — switching it and resetting
// `store.campaign` between blocks mirrors handing the test off to a second phone.
// `dbWrite`/`dbRead` back onto an in-memory Map standing in for Firebase RTDB.
const fakeDb = new Map();
let currentUid = null;

vi.mock('../src/data/firebase.js', () => ({
  getUid: () => currentUid,
  dbRead: async (path) => (fakeDb.has(path) ? structuredClone(fakeDb.get(path)) : null),
  dbWrite: async (path, value) => { fakeDb.set(path, structuredClone(value)); },
  dbListen: () => () => {},
}));

const { store, setStore } = await import('../src/state/store.js');
const { DEFAULT_CAMPAIGN } = await import('../src/state/campaign.js');
const { joinCampaign, buildShareId, forceSyncNow, setPresence } = await import('../src/data/sync.js');
const { healArrays, mergeCampaign } = await import('../src/data/persist.js');

function resetDevice(uid, campaignPatch = {}) {
  currentUid = uid;
  setStore('campaign', structuredClone({ ...DEFAULT_CAMPAIGN, ...campaignPatch }));
  setStore('system', 'multiplay', { role: 'solo', hostUid: '' });
  setStore('system', 'playerIdentity', { name: '', selectedPCs: [], mode: 'single' });
}

describe('Two-device sync simulation (mocked Firebase)', () => {
  beforeEach(() => {
    fakeDb.clear();
    currentUid = null;
  });

  it('guest join reads the host record and heals it the same way a real RTDB read would need to', async () => {
    resetDevice('host_uid', { id: 'camp1', name: 'Test Campaign', characters: [{ id: 'pc1', name: 'Ivy' }] });
    await forceSyncNow();

    const shareId = buildShareId();
    expect(shareId).toBe('host_uid~camp1');

    resetDevice('guest_uid');
    await joinCampaign(shareId);

    expect(store.system.multiplay).toEqual({ role: 'guest', hostUid: 'host_uid' });
    expect(store.campaign.name).toBe('Test Campaign');
    expect(store.campaign.characters[0].name).toBe('Ivy');
    // Fields RTDB silently drops on write (empty arrays/objects) must come back healed.
    expect(store.campaign.quests).toEqual([]);
    expect(store.campaign.presence).toEqual({});
    expect(store.campaign.characters[0].conditions).toEqual([]);

    // joinCampaign() writes a reconnect pointer synchronously, not on the debounce.
    expect(fakeDb.get('players/guest_uid/joined')).toMatchObject({ hostUid: 'host_uid', campaignId: 'camp1' });
  });

  it('a presence toggle on one device is visible on the other after a sync round-trip', async () => {
    resetDevice('host_uid', { id: 'camp1', characters: [] });
    await forceSyncNow();
    const shareId = buildShareId();

    resetDevice('guest_uid');
    await joinCampaign(shareId);
    setStore('system', 'playerIdentity', 'name', 'Riley');

    setPresence(true);
    expect(store.campaign.presence.guest_uid).toMatchObject({ name: 'Riley', active: true });
    await forceSyncNow();

    // Host pulls the cloud copy and merges it in, mirroring startLiveSync()'s listener.
    resetDevice('host_uid', { id: 'camp1', characters: [] });
    const cloud = fakeDb.get('campaigns/host_uid/camp1');
    setStore('campaign', mergeCampaign(store.campaign, cloud));

    expect(store.campaign.presence.guest_uid).toMatchObject({ name: 'Riley', active: true });

    // Host now leaves; this must not erase the guest's still-active entry, since
    // setPresence only ever writes its own uid's key into the existing map.
    setPresence(false);
    expect(store.campaign.presence.host_uid.active).toBe(false);
    expect(store.campaign.presence.guest_uid.active).toBe(true);
  });

  it('healArrays repairs a campaign object reflecting RTDB-dropped fields, including presence', () => {
    const rtdbShape = { id: 'camp1', characters: [{ id: 'pc1', name: 'Ivy' }] }; // no quests/npcs/presence keys at all
    const healed = healArrays({ ...DEFAULT_CAMPAIGN, ...rtdbShape });
    expect(healed.quests).toEqual([]);
    expect(healed.npcs).toEqual([]);
    expect(healed.presence).toEqual({});
    expect(healed.characters[0].conditions).toEqual([]);
  });
});
