const DB_NAME = 'tinklepebble-v2';
const DB_VERSION = 2;

let dbInstance = null;

const STORES = {
  spells:        { keyPath: 'id', autoIncrement: true, indexes: ['name', 'level', 'school', 'class'] },
  feats:         { keyPath: 'id', autoIncrement: true, indexes: ['name', 'prerequisite'] },
  glossary:      { keyPath: 'id', autoIncrement: true, indexes: ['term'] },
  classData:     { keyPath: 'id', autoIncrement: true, indexes: ['class', 'level'] },
  maneuvers:     { keyPath: 'id', autoIncrement: true, indexes: ['name'] },
  xpThresholds:  { keyPath: 'level', autoIncrement: false, indexes: [] },
  compendium:    { keyPath: 'id', autoIncrement: true, indexes: ['name', 'type', 'source'] },
  meta:          { keyPath: 'key', autoIncrement: false, indexes: [] },
  bundles:       { keyPath: 'id', autoIncrement: false, indexes: ['name'] },
};

function isConnectionAlive(db) {
  try {
    db.transaction('meta', 'readonly');
    return true;
  } catch {
    return false;
  }
}

function openDB() {
  if (dbInstance && isConnectionAlive(dbInstance)) return Promise.resolve(dbInstance);
  dbInstance = null;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      for (const [name, config] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, {
            keyPath: config.keyPath,
            autoIncrement: config.autoIncrement,
          });
          for (const idx of config.indexes) {
            store.createIndex(idx, idx, { unique: false });
          }
        }
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onclose = () => { dbInstance = null; };
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function initLocal() {
  await openDB();
}

export async function isSeeded() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('meta', 'readonly');
    const req = tx.objectStore('meta').get('_seeded');
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => resolve(false);
  });
}

export async function markSeeded() {
  const db = await openDB();
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ key: '_seeded', value: true, ts: Date.now() });
}

export async function getSeedVersion() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('meta', 'readonly');
    const req = tx.objectStore('meta').get('_seedVersion');
    req.onsuccess = () => resolve(req.result?.value || 0);
    req.onerror = () => resolve(0);
  });
}

export async function setSeedVersion(version) {
  const db = await openDB();
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ key: '_seedVersion', value: version, ts: Date.now() });
}

export async function putAll(storeName, records) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const record of records) {
    store.put(record);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getByIndex(storeName, indexName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const idx = tx.objectStore(storeName).index(indexName);
    const req = idx.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getByKey(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteByKey(storeName, key) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(key);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearStore(storeName) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSpellsForClass(className) {
  const all = await getAll('spells');
  const lc = className.toLowerCase();
  return all.filter(s => (s.classes || []).some(c => c.toLowerCase() === lc));
}

export async function countStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
