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
    connected = snap.val() === true;
  });

  await new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        uid = user.uid;
        unsub();
        resolve();
      }
    });
    signInAnonymously(auth).catch(reject);
  });

  return { app, auth, db, uid };
}

export async function dbRead(path) {
  try {
    const snap = await get(ref(db, path));
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    const cached = localStorage.getItem(`fb_cache:${path}`);
    return cached ? JSON.parse(cached) : null;
  }
}

export async function dbWrite(path, value) {
  try {
    await set(ref(db, path), value);
    localStorage.setItem(`fb_cache:${path}`, JSON.stringify(value));
  } catch (e) {
    localStorage.setItem(`fb_cache:${path}`, JSON.stringify(value));
    localStorage.setItem(`fb_pending:${path}`, JSON.stringify({ value, ts: Date.now() }));
  }
}

export async function dbUpdate(path, updates) {
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
    callback(snap.exists() ? snap.val() : null);
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
