import { initFirebase, isConnected, flushPending } from './firebase.js';

export async function initData() {
  await initFirebase();

  if (isConnected()) {
    await flushPending();
  }
}

export { isConnected } from './firebase.js';
export { dbRead, dbWrite, dbUpdate, dbListen, getUid } from './firebase.js';
