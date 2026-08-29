/* FRONTEND OFFLINE-FIRST ARCHITECTURE & QUEUE MANAGER (Phase 11) */
import { ApiService, API_STATUS } from './api.js';
import { Toast } from './toast.js';

class OfflineManager {
  constructor() {
    this.queueKey = 'disissta_offline_reports_queue';
    this.initListeners();
  }

  initListeners() {
    window.addEventListener('online', () => {
      Toast.show('Network reconnected. Synchronizing queued reports...', 'info');
      this.syncQueuedReports();
    });

    window.addEventListener('offline', () => {
      Toast.show('Network lost. Working in Offline Mode.', 'warning');
    });
  }

  isOnline() {
    return navigator.onLine;
  }

  getQueuedReports() {
    const raw = localStorage.getItem(this.queueKey);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async queueReport(reportData) {
    const queue = this.getQueuedReports();
    const queuedItem = {
      ...reportData,
      _queuedAt: new Date().toISOString(),
      _tempId: `offline-${Date.now()}`
    };
    queue.push(queuedItem);
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
    Toast.show('Report saved locally. Pending synchronization.', 'info');
    return queuedItem;
  }

  async syncQueuedReports() {
    const queue = this.getQueuedReports();
    if (queue.length === 0) return;

    const remaining = [];
    for (const report of queue) {
      const res = await ApiService.createReport(report);
      if (res.status !== API_STATUS.SUCCESS) {
        remaining.push(report);
      }
    }

    localStorage.setItem(this.queueKey, JSON.stringify(remaining));
    if (remaining.length === 0) {
      Toast.show('All offline field reports successfully uploaded.', 'success');
    }
  }
}

export const Offline = new OfflineManager();
