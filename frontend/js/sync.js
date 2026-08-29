/* IndexedDB Offline Action Queue Manager (Phase 11) */

const DB_NAME = 'DisisstaDB';
const DB_VERSION = 1;
const STORE_NAME = 'actionQueue';

let dbInstance = null;

function initDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function enqueueAction(type, payload) {
  const db = await initDB();
  const action = {
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    type,
    payload,
    createdAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(action);

    request.onsuccess = () => {
      notifyQueueChange();
      resolve(action);
    };

    request.onerror = (e) => {
      console.error('Failed to add action to IndexedDB:', e.target.error);
      reject(e.target.error);
    };
  });
}

export async function getPendingActions() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteAction(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyQueueChange();
      resolve();
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getPendingCount() {
  try {
    const actions = await getPendingActions();
    return actions.length;
  } catch (e) {
    return 0;
  }
}

export async function notifyQueueChange() {
  const pendingCount = await getPendingCount();
  localStorage.setItem('pending-actions-count', pendingCount);
  window.dispatchEvent(new CustomEvent('sync-updated', {
    detail: { pendingCount }
  }));
}

export async function processQueue() {
  const simulatedOffline = localStorage.getItem('simulated-offline') === 'true';
  if (!navigator.onLine || simulatedOffline) {
    return;
  }

  const actions = await getPendingActions();
  if (actions.length === 0) return;

  window.dispatchEvent(new CustomEvent('sync-status-change', { detail: { status: 'syncing' } }));

  for (const action of actions) {
    try {
      await deleteAction(action.id);
    } catch (err) {
      console.error(`Error processing action ${action.id}:`, err);
      break;
    }
  }

  window.dispatchEvent(new CustomEvent('sync-status-change', { detail: { status: 'idle' } }));
  await notifyQueueChange();
}

window.addEventListener('online', () => {
  setTimeout(processQueue, 1000);
});

initDB().then(() => {
  notifyQueueChange();
  setTimeout(processQueue, 500);
}).catch(() => {});

export const SyncManager = {
  enqueue: enqueueAction,
  getPending: getPendingActions,
  getCount: getPendingCount,
  delete: deleteAction,
  process: processQueue,
  notify: notifyQueueChange
};

window.SyncManager = SyncManager;
export default SyncManager;
