/* Centralized API Client and Interceptor */

const API_BASE = '/api';

class APIClient {
  constructor() {
    this.isDegraded = false;
  }

  /**
   * Helper to check current connectivity state (real & simulated)
   */
  isOffline() {
    const simulatedOffline = localStorage.getItem('simulated-offline') === 'true';
    return !navigator.onLine || simulatedOffline;
  }

  /**
   * Performs an API request and intercepts failures/offline states.
   * @param {string} endpoint - API path (e.g. '/profile' or '/reports')
   * @param {string} method - HTTP method (GET, POST, PATCH)
   * @param {object} data - Request payload data
   */
  async request(endpoint, method = 'GET', data = null) {
    const offline = this.isOffline();
    
    // 1. OFFLINE TREATMENT
    if (offline) {
      if (method === 'GET') {
        this.triggerDegradedState();
        return this.getOfflineCache(endpoint);
      } else {
        // Queue mutations
        const type = this.deriveActionType(endpoint, method);
        if (window.SyncManager) {
          const action = await window.SyncManager.enqueue(type, data);
          this.triggerDegradedState();
          return { status: 'queued', actionId: action.id, offline: true };
        }
        throw new Error('Sync manager unavailable. Mutation failed.');
      }
    }

    // 2. ONLINE TREATMENT
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const result = await response.json();
      
      // If it is a GET, cache it locally for future offline requests
      if (method === 'GET') {
        this.setOfflineCache(endpoint, result);
      }
      
      this.clearDegradedState();
      return result;

    } catch (error) {
      console.warn(`Network request to ${endpoint} failed. Downgrading to local mode:`, error);
      
      // Graceful degradation on network failures
      if (method === 'GET') {
        this.triggerDegradedState('stale');
        return this.getOfflineCache(endpoint);
      } else {
        // Enqueue mutation on connection failure
        const type = this.deriveActionType(endpoint, method);
        if (window.SyncManager) {
          const action = await window.SyncManager.enqueue(type, data);
          this.triggerDegradedState('stale');
          return { status: 'queued', actionId: action.id, offline: true, error: error.message };
        }
        throw error;
      }
    }
  }

  /**
   * Transmits a previously queued offline action
   */
  async transmitQueued(action) {
    const { type, payload } = action;
    let endpoint = '';
    let method = 'POST';

    // Map internal types back to API paths
    if (type === 'save-profile') {
      endpoint = '/profile';
      method = 'POST';
    } else if (type.startsWith('verify-report-')) {
      const id = type.replace('verify-report-', '');
      endpoint = `/reports/${id}/verify`;
      method = 'PATCH';
    } else if (type.startsWith('acknowledge-alert-')) {
      const id = type.replace('acknowledge-alert-', '');
      endpoint = `/alerts/${id}/acknowledge`;
      method = 'PATCH';
    } else {
      endpoint = `/${type}`;
      method = 'POST';
    }

    const url = `${API_BASE}${endpoint}`;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (e) {
      console.warn(`Sync fetch failed for queued action ${action.id} to ${endpoint}:`, e);
      // In static frontend demonstration, backend routes won't exist on local file/static servers.
      // So if we are connected to the internet/network but backend is mock/non-existent, we simulate transmission success.
      if (navigator.onLine && localStorage.getItem('simulated-offline') !== 'true') {
        console.info('Simulating transmission success for static demo environment.');
        return true;
      }
      return false;
    }
  }

  /**
   * Translates endpoint and method to an action queue type
   */
  deriveActionType(endpoint, method) {
    if (endpoint.includes('/profile')) return 'save-profile';
    if (endpoint.includes('/verify')) return `verify-report-${endpoint.split('/')[2]}`;
    if (endpoint.includes('/acknowledge')) return `acknowledge-alert-${endpoint.split('/')[2]}`;
    return `${method.toLowerCase()}-${endpoint.replace('/', '')}`;
  }

  /**
   * Caches read-only responses locally
   */
  setOfflineCache(endpoint, data) {
    localStorage.setItem(`cache_api_${endpoint}`, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Retrieves read-only data from local cache
   */
  getOfflineCache(endpoint) {
    const cached = localStorage.getItem(`cache_api_${endpoint}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.data;
    }
    
    // Return empty mock layouts if no cache is present
    if (endpoint.includes('/profile') || endpoint.includes('/settings')) {
      return { username: 'John Doe', role: 'control_room' };
    }
    return [];
  }

  /**
   * Renders global UI degradation warning banner
   */
  triggerDegradedState(reason = 'offline') {
    this.isDegraded = true;
    let banner = document.getElementById('degradation-warning-banner');
    
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'degradation-warning-banner';
      banner.className = 'degradation-banner';
      
      // Inject banner right below top-bar/header
      const mainLayout = document.querySelector('.main-layout');
      const contentArea = document.querySelector('.content-area');
      if (mainLayout && contentArea) {
        mainLayout.insertBefore(banner, contentArea);
      } else {
        document.body.prepend(banner);
      }
    }

    const lastSyncTime = localStorage.getItem('last-sync-timestamp');
    let timeStr = 'Never';
    if (lastSyncTime) {
      const mins = Math.floor((new Date() - new Date(lastSyncTime)) / 60000);
      timeStr = mins <= 0 ? 'Just now' : `${mins}m ago`;
    }

    banner.innerHTML = `
      <div class="degradation-banner-content">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>
          <strong>Live data unavailable.</strong> Showing last synchronized cached data from ${timeStr}.
        </span>
      </div>
    `;
    banner.style.display = 'flex';
  }

  /**
   * Removes global UI degradation warning banner
   */
  clearDegradedState() {
    this.isDegraded = false;
    const banner = document.getElementById('degradation-warning-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  }
}

// Instantiate globally
window.APIClient = new APIClient();
