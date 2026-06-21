import { initFirebase, isConnected, flushPending } from './firebase.js';
import { initLocal } from './local.js';
import { runSeed } from './seed.js';

export async function initData() {
  await Promise.all([
    initFirebase(),
    initLocal(),
  ]);

  await runSeed();

  if (isConnected()) {
    await flushPending();
  }
}

export { isConnected } from './firebase.js';
export { dbRead, dbWrite, dbUpdate, dbListen, getUid } from './firebase.js';
export { getAll, getByIndex, getByKey, countStore } from './local.js';
