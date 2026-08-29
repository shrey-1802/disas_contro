/* FRONTEND CENTRALIZED REST API SERVICE */
import {
  normalizeRoad,
  normalizeBridge,
  normalizeShelter,
  normalizeMission,
  normalizeReport,
  normalizeAlert
} from './adapters.js';

export const API_BASE_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:3000'
  : '';

export const API_STATUS = {
  SUCCESS: 'SUCCESS',
  LOADING: 'LOADING',
  EMPTY: 'EMPTY',
  ERROR: 'ERROR',
  OFFLINE: 'OFFLINE',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED'
};

async function request(endpoint, options = {}) {
  if (!navigator.onLine) {
    return { status: API_STATUS.OFFLINE, data: null, error: 'Network offline' };
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        ...options.headers
      },
      ...options
    });

    if (res.status === 404 || res.status === 501) {
      return { status: API_STATUS.NOT_IMPLEMENTED, data: null, error: 'Endpoint not implemented on server' };
    }
    if (res.status === 401 || res.status === 403) {
      return { status: API_STATUS.PERMISSION_DENIED, data: null, error: 'Unauthorized operation' };
    }
    if (!res.ok) {
      return { status: API_STATUS.ERROR, data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const payload = await res.json();
    if (Array.isArray(payload) && payload.length === 0) {
      return { status: API_STATUS.EMPTY, data: [], raw: payload };
    }

    return { status: API_STATUS.SUCCESS, data: payload };
  } catch (err) {
    return { status: API_STATUS.ERROR, data: null, error: err.message || 'Fetch failed' };
  }
}

export const ApiService = {
  async getRoads() {
    const res = await request('/api/roads');
    if (res.status === API_STATUS.SUCCESS && Array.isArray(res.data)) {
      res.data = res.data.map(normalizeRoad);
    }
    return res;
  },

  async getBridges() {
    const res = await request('/api/bridges');
    if (res.status === API_STATUS.SUCCESS && Array.isArray(res.data)) {
      res.data = res.data.map(normalizeBridge);
    }
    return res;
  },

  async getShelters() {
    const res = await request('/api/shelters');
    if (res.status === API_STATUS.SUCCESS && Array.isArray(res.data)) {
      res.data = res.data.map(normalizeShelter);
    }
    return res;
  },

  async getMissions() {
    const res = await request('/api/missions');
    if (res.status === API_STATUS.SUCCESS && Array.isArray(res.data)) {
      res.data = res.data.map(normalizeMission);
    }
    return res;
  },

  async getReports() {
    const res = await request('/api/reports');
    if (res.status === API_STATUS.SUCCESS && Array.isArray(res.data)) {
      res.data = res.data.map(normalizeReport);
    }
    return res;
  },

  async getAlerts() {
    const res = await request('/api/alerts');
    if (res.status === API_STATUS.SUCCESS && Array.isArray(res.data)) {
      res.data = res.data.map(normalizeAlert);
    }
    return res;
  },

  async createMission(missionData) {
    return await request('/api/missions', {
      method: 'POST',
      body: JSON.stringify(missionData)
    });
  },

  async createReport(reportData) {
    return await request('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  },

  async verifyReport(id) {
    return await request(`/api/reports/${id}/verify`, { method: 'PATCH' });
  },

  async acknowledgeAlert(id) {
    return await request(`/api/alerts/${id}/acknowledge`, { method: 'PATCH' });
  },

  async escalateAlert(id) {
    return await request(`/api/alerts/${id}/escalate`, { method: 'PATCH' });
  }
};
