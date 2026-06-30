import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get, set, update, onValue, off, onDisconnect, serverTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC8h3URJ11rtYdCAvzpj_Jb2EeQlHqeI0s",
  authDomain: "pebble-v2.firebaseapp.com",
  databaseURL: "https://pebble-v2-default-rtdb.firebaseio.com",
  projectId: "pebble-v2",
  storageBucket: "pebble-v2.firebasestorage.app",
  messagingSenderId: "72431049145",
  appId: "1:72431049145:web:abc5fe13a006f24b07be68",
};

let app = null;
let auth = null;
let db = null;
let uid = null;
let connected = false;

// Tracks the last value this device wrote to each path, so dbListen can ignore
// the echo of its own write without also dropping a *different* device's write
// that happens to land in the same window. A blind time-based suppression window
// (the previous approach) silently swallowed real remote updates whenever this
// device's own debounced sync fired within ~3s of another device's write to the
// same path — e.g. a routine auto-sync racing a guest's presence toggle — leaving
// the listener showing stale data until some unrelated change fired onValue again.
const lastWritten = new Map();

function markWritten(path, value) {
  lastWritten.set(path, JSON.stringify(value));
}

function isEcho(path, incoming) {
  const expected = lastWritten.get(path);
  if (expected === undefined) return false;
  const matches = JSON.stringify(incoming) === expected;
  if (matches) lastWritten.delete(path);
  return matches;
}

export function isConnected() {
  return connected;
}

export function getUid() {
  return uid;
}

export async function initFirebase() {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);

  onValue(ref(db, '.info/connected'), (snap) => {
    const wasConnected = connected;
    connected = snap.val() === true;
    // dbWrite() never throws to its caller on failure — it just queues to
    // fb_pending and resolves normally, so a caller awaiting it (e.g.
    // shareInvite's forceSyncNow) has no way to know the write never landed.
    // Without this, a queued write only ever retries on the next full app
    // boot (initData's flushPending call), not on reconnect — so a campaign
    // shared mid-blip can look synced locally while staying invisible to
    // anyone joining until the host happens to reload.
    if (connected && !wasConnected) flushPending();
  });

  await Promise.race([
    new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          uid = user.uid;
          unsub();
          resolve();
        }
      });
      signInAnonymously(auth).catch(() => { console.warn('Firebase auth failed — continuing offline'); resolve(); });
    }),
    new Promise(resolve => setTimeout(() => { console.warn('Firebase auth timeout — continuing offline'); resolve(); }, 5000)),
  ]);

  return { app, auth, db, uid };
}

export async function dbRead(path) {
  try {
    // get() can hang indefinitely if the device never establishes a connection
    // (no network, RTDB unreachable) — cap it so callers (e.g. joinCampaign's
    // "Joining…" state) can't be stuck forever waiting on a promise that never settles.
    const snap = await Promise.race([
      get(ref(db, path)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('dbRead timeout')), 10000)),
    ]);
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    const cached = localStorage.getItem(`fb_cache:${path}`);
    return cached ? JSON.parse(cached) : null;
  }
}

export async function dbWrite(path, value) {
  markWritten(path, value);
  try {
    await set(ref(db, path), value);
    localStorage.setItem(`fb_cache:${path}`, JSON.stringify(value));
  } catch (e) {
    localStorage.setItem(`fb_cache:${path}`, JSON.stringify(value));
    localStorage.setItem(`fb_pending:${path}`, JSON.stringify({ value, ts: Date.now() }));
  }
}

export async function dbUpdate(path, updates) {
  for (const [key, value] of Object.entries(updates)) {
    markWritten(`${path}/${key}`, value);
  }
  try {
    await update(ref(db, path), updates);
  } catch (e) {
    for (const [key, value] of Object.entries(updates)) {
      const full = `${path}/${key}`;
      localStorage.setItem(`fb_cache:${full}`, JSON.stringify(value));
      localStorage.setItem(`fb_pending:${full}`, JSON.stringify({ value, ts: Date.now() }));
    }
  }
}

export function dbListen(path, callback) {
  const r = ref(db, path);
  onValue(r, (snap) => {
    const value = snap.exists() ? snap.val() : null;
    if (isEcho(path, value)) return;
    callback(value);
  });
  return () => off(r);
}

export async function flushPending() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('fb_pending:'));
  for (const key of keys) {
    const path = key.replace('fb_pending:', '');
    const { value } = JSON.parse(localStorage.getItem(key));
    try {
      await set(ref(db, path), value);
      localStorage.removeItem(key);
    } catch (e) {
      break;
    }
  }
}

export { ref, db, auth, serverTimestamp };
