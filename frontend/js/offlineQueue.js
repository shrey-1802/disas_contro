/* ==========================================
   DISISTA CONTROL — OFFLINE SYNC QUEUE (PHASE 10)
   Stores pending mutations when offline, flushes on reconnect
   ========================================== */

class OfflineSyncQueue {
  #STORAGE_KEY = 'disista_offline_queue';
  #flushInterval = null;

  constructor() {
    this.queue = this.#load();
    this.isFlushing = false;
  }

  /* ── Enqueue a pending action ── */
  enqueue(action) {
    const entry = {
      id: `osq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      action,   // { type, payload }
      retries: 0,
      status: 'pending'
    };
    this.queue.push(entry);
    this.#save();
    this.#updateUI();
    return entry.id;
  }

  /* ── Attempt to flush all pending actions ── */
  async flush(sendFn) {
    if (this.isFlushing || !navigator.onLine) return;
    if (this.queue.filter(e => e.status === 'pending').length === 0) return;

    this.isFlushing = true;
    const pending = this.queue.filter(e => e.status === 'pending');

    for (const entry of pending) {
      try {
        entry.status = 'sending';
        this.#save();
        await sendFn(entry.action);
        entry.status = 'done';
      } catch (err) {
        entry.retries++;
        entry.status = entry.retries >= 3 ? 'failed' : 'pending';
        entry.lastError = err.message || 'Unknown error';
      }
      this.#save();
    }

    // Prune completed
    this.queue = this.queue.filter(e => e.status !== 'done');
    this.#save();
    this.isFlushing = false;
    this.#updateUI();

    const failed = this.queue.filter(e => e.status === 'failed').length;
    const synced = pending.length - failed;
    if (window.toast) {
      if (failed > 0)  window.toast.error(`${failed} offline action${failed === 1 ? '' : 's'} failed after 3 retries.`);
      if (synced > 0)  window.toast.success(`${synced} offline action${synced === 1 ? '' : 's'} synchronised.`);
    }
    if (window.A11yUtil) window.A11yUtil.announce(`${synced} pending action${synced === 1 ? '' : 's'} synchronised.`);
  }

  /* ── Wipe queue (clear all) ── */
  clear() { this.queue = []; this.#save(); this.#updateUI(); }

  /* ── Count pending ── */
  pendingCount() { return this.queue.filter(e => e.status === 'pending').length; }

  /* ── Update Settings page sync badge ── */
  #updateUI() {
    const badge = document.getElementById('offline-queue-badge');
    const count = this.pendingCount();
    if (badge) badge.textContent = count === 0 ? 'Queue Empty' : `${count} Pending`;

    const clearBtn = document.getElementById('offline-queue-clear');
    if (clearBtn) clearBtn.disabled = count === 0;

    // Update navbar offline pill if it exists
    const navOfflinePill = document.getElementById('nav-offline-pill');
    if (navOfflinePill) {
      navOfflinePill.textContent = count > 0 ? `${count} queued` : 'Synced';
      navOfflinePill.style.background = count > 0 ? 'var(--forest-700)' : 'var(--forest-600)';
      navOfflinePill.style.display = !navigator.onLine || count > 0 ? 'inline-flex' : 'none';
    }
  }

  /* ── Render queue table in settings ── */
  renderQueueTable(container) {
    if (!container) return;
    if (this.queue.length === 0) {
      container.innerHTML = `<p style="font-size:13px;color:var(--slate-500);text-align:center;padding:20px 0;">
        No pending offline actions. All operations are synchronised.
      </p>`;
      return;
    }
    container.innerHTML = `
      <div class="table-container">
        <table class="data-table" role="table" aria-label="Offline sync queue">
          <thead>
            <tr>
              <th scope="col">Action Type</th>
              <th scope="col">Queued At</th>
              <th scope="col">Status</th>
              <th scope="col">Retries</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.queue.map(e => `
              <tr>
                <td><code style="font-size:12px;">${e.action?.type || 'unknown'}</code></td>
                <td>${new Date(e.timestamp).toLocaleTimeString()}</td>
                <td>
                  <span class="badge badge-${e.status === 'failed' ? 'critical' : e.status === 'sending' ? 'degraded' : 'safe'}">
                    ${e.status}
                  </span>
                </td>
                <td>${e.retries}</td>
                <td>
                  <button class="btn btn-ghost" style="min-height:32px;font-size:12px;" onclick="window.offlineQueue.removeEntry('${e.id}')">Remove</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  removeEntry(id) {
    this.queue = this.queue.filter(e => e.id !== id);
    this.#save();
    const container = document.getElementById('offline-queue-table');
    if (container) this.renderQueueTable(container);
    this.#updateUI();
  }

  #load() {
    try { return JSON.parse(localStorage.getItem(this.#STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  #save() {
    try { localStorage.setItem(this.#STORAGE_KEY, JSON.stringify(this.queue)); }
    catch { /* quota exceeded — ignore */ }
  }

  /* ── Auto-flush on reconnect ── */
  init(sendFn) {
    this.#sendFn = sendFn || ((a) => console.log('[OfflineQueue] Simulated send:', a));
    window.addEventListener('online', () => this.flush(this.#sendFn));
    window.addEventListener('storage', (e) => {
      if (e.key === this.#STORAGE_KEY) {
        this.queue = this.#load();
        this.#updateUI();
      }
    });
    this.#updateUI();
  }
}

window.offlineQueue = new OfflineSyncQueue();
document.addEventListener('DOMContentLoaded', () => window.offlineQueue.init());
