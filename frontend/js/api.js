/**
 * Centralized REST API Service Module
 * Relief Supply Chain Resilience & Rerouting System
 */

import { auth } from './auth.js';
import { toast } from './toast.js';

const API_BASE_URL = window.location.origin;

class ApiService {
  constructor() {
    this.isOnline = navigator.onLine;
    window.addEventListener('online', () => this.handleOnlineState(true));
    window.addEventListener('offline', () => this.handleOnlineState(false));
  }

  handleOnlineState(online) {
    this.isOnline = online;
    const event = new CustomEvent('connectivityChange', { detail: { online } });
    window.dispatchEvent(event);
    if (online) {
      toast.show('Network connectivity restored', 'safe');
    } else {
      toast.show('Operating in Offline Field Mode', 'warning');
    }
  }

  async request(endpoint, options = {}) {
    if (!this.isOnline && options.method !== 'GET') {
      toast.show('Offline: Action queued for background sync', 'warning');
      throw new Error('OFFLINE_QUEUED');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (response.status === 401) {
        auth.logout();
        throw new Error('UNAUTHORIZED');
      }

      if (response.status === 403) {
        toast.show('Permission denied for this action', 'critical');
        throw new Error('PERMISSION_DENIED');
      }

      if (response.status === 501) {
        toast.show('Feature endpoint not implemented on backend', 'warning');
        throw new Error('NOT_IMPLEMENTED');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API_ERROR_${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`[API] ${endpoint} request failed:`, err.message);
      throw err;
    }
  }

  // API Route Abstractions
  getRoads() { return this.request('/api/roads'); }
  getBridges() { return this.request('/api/bridges'); }
  getShelters() { return this.request('/api/shelters'); }
  getMissions() { return this.request('/api/missions'); }
  getVehicles() { return this.request('/api/vehicles'); }
  getReports() { return this.request('/api/reports'); }
  getAlerts() { return this.request('/api/alerts'); }
  getPriority() { return this.request('/api/priority'); }

  createMission(missionData) {
    return this.request('/api/missions', {
      method: 'POST',
      body: JSON.stringify(missionData)
    });
  }

  createReport(reportData) {
    return this.request('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  verifyReport(reportId) {
    return this.request(`/api/reports/${reportId}/verify`, {
      method: 'PATCH'
    });
  }

  acknowledgeAlert(alertId) {
    return this.request(`/api/alerts/${alertId}/acknowledge`, {
      method: 'PATCH'
    });
  }

  escalateAlert(alertId) {
    return this.request(`/api/alerts/${alertId}/escalate`, {
      method: 'PATCH'
    });
  }
}

export const api = new ApiService();
window.api = api;
