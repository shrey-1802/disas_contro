/* IndexedDB Offline Action Queue Manager */

const DB_NAME = 'DisisstaDB';
const DB_VERSION = 1;
const STORE_NAME = 'actionQueue';

let dbInstance = null;

/**
 * Initializes and returns the IndexedDB instance
 */
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

/**
 * Enqueues a new action to IndexedDB
 */
async function enqueueAction(type, payload) {
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

/**
 * Retrieves all pending actions from IndexedDB
 */
async function getPendingActions() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
}

/**
 * Deletes an action from IndexedDB
 */
async function deleteAction(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyQueueChange();
      resolve();
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
}

/**
 * Updates an action's properties
 */
async function updateAction(action) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(action);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
}

/**
 * Counts the current number of pending actions in the database
 */
async function getPendingCount() {
  try {
    const actions = await getPendingActions();
    return actions.length;
  } catch (e) {
    return 0;
  }
}

/**
 * Dispatches a global event notifying modules about changes in the action queue
 */
async function notifyQueueChange() {
  const pendingCount = await getPendingCount();
  
  // Persist queue size in localStorage for fallback/simple access
  localStorage.setItem('pending-actions-count', pendingCount);
  
  window.dispatchEvent(new CustomEvent('sync-updated', {
    detail: { pendingCount }
  }));
}

/**
 * Processes the queue by executing pending operations sequentially when connection is online.
 */
async function processQueue() {
  const simulatedOffline = localStorage.getItem('simulated-offline') === 'true';
  if (!navigator.onLine || simulatedOffline) {
    console.log('Skipping sync processing - device is currently offline.');
    return;
  }

  const actions = await getPendingActions();
  if (actions.length === 0) {
    return;
  }

  console.log(`Processing offline queue: ${actions.length} actions pending...`);
  
  // Custom event indicating sync is in progress
  window.dispatchEvent(new CustomEvent('sync-status-change', { detail: { status: 'syncing' } }));

  for (const action of actions) {
    try {
      // Attempt to transmit the action to the server
      const success = await transmitAction(action);
      
      if (success) {
        await deleteAction(action.id);
        console.log(`Action ${action.id} synced and cleared.`);
      } else {
        // Increment retry count
        action.retryCount++;
        action.status = 'failed';
        await updateAction(action);
        console.warn(`Action ${action.id} failed transmission. Aborting sync chain to maintain order.`);
        break; // Stop execution of the queue to preserve chronological ordering
      }
    } catch (err) {
      console.error(`Error processing action ${action.id}:`, err);
      break;
    }
  }

  window.dispatchEvent(new CustomEvent('sync-status-change', { detail: { status: 'idle' } }));
  await notifyQueueChange();
}

/**
 * Mock dispatcher: makes the actual API call depending on action type
 */
async function transmitAction(action) {
  // If the unified API client exists, use it to send the real requests
  if (window.APIClient) {
    return await window.APIClient.transmitQueued(action);
  }
  
  // Fallback simulator if API Client is not fully loaded yet
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true); // Return mock success
    }, 500);
  });
}

// Automatically process queue when connection is restored
window.addEventListener('online', () => {
  setTimeout(processQueue, 1000); // Small buffer to allow network routes to establish
});

// Initialize DB on page load
initDB().then(() => {
  notifyQueueChange();
  // Attempt sync on start
  setTimeout(processQueue, 500);
}).catch(err => {
  console.error('IndexedDB initialization failed:', err);
});

// Export globally
window.SyncManager = {
  enqueue: enqueueAction,
  getPending: getPendingActions,
  getCount: getPendingCount,
  delete: deleteAction,
  process: processQueue,
  notify: notifyQueueChange
};
