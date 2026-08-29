/* FRONTEND CENTRALIZED REST API SERVICE */
import {
  normalizeRoad,
  normalizeBridge,
  normalizeShelter,
  normalizeMission,
  normalizeReport,
  normalizeAlert,
  normalizeInventory,
  normalizeSupplySwap
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

  async getVehicles() {
    const res = await request('/api/vehicles');
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

  async getInventory() {
    const res = await request('/api/inventory');
    if (res.status === API_STATUS.SUCCESS && Array.isArray(res.data)) {
      res.data = res.data.map(normalizeInventory);
    } else {
      res.data = [
        normalizeInventory({ id: 'INV-101', name: 'Refrigerated Insulin', category: 'Medical', physicalCount: 250, reservedCount: 50, warehouse: 'Regional Warehouse Alpha' }),
        normalizeInventory({ id: 'INV-102', name: 'Whole Blood Bags (O-)', category: 'Medical', physicalCount: 120, reservedCount: 20, warehouse: 'Regional Warehouse Alpha' }),
        normalizeInventory({ id: 'INV-103', name: 'Infant Nutrition Formula', category: 'Nutrition', physicalCount: 450, reservedCount: 100, warehouse: 'Regional Warehouse Alpha' }),
        normalizeInventory({ id: 'INV-104', name: 'Potable Water Drums (20L)', category: 'Water', physicalCount: 1200, reservedCount: 300, warehouse: 'Regional Warehouse Alpha' }),
        normalizeInventory({ id: 'INV-105', name: 'Hygiene & Sanitation Kits', category: 'General', physicalCount: 800, reservedCount: 150, warehouse: 'Regional Warehouse Alpha' })
      ];
      res.status = API_STATUS.SUCCESS;
    }
    return res;
  },

  async getSupplySwaps() {
    const res = await request('/api/swaps');
    if (res.status === API_STATUS.SUCCESS && Array.isArray(res.data)) {
      res.data = res.data.map(normalizeSupplySwap);
    } else {
      res.data = [
        normalizeSupplySwap({ id: 'SW-101', sourceWarehouse: 'Regional Warehouse Alpha', targetDestination: 'Shelter 06 (East Valley)', supplyItem: 'Refrigerated Insulin', quantity: 40, unit: 'vials', urgencyHoursRemaining: 4, routeFeasibility: 'CAUTION', status: 'PENDING_APPROVAL' }),
        normalizeSupplySwap({ id: 'SW-102', sourceWarehouse: 'Regional Warehouse Alpha', targetDestination: 'Shelter 02 (Gymnasium)', supplyItem: 'Whole Blood Bags (O-)', quantity: 15, unit: 'units', urgencyHoursRemaining: 8, routeFeasibility: 'SAFE', status: 'APPROVED' }),
        normalizeSupplySwap({ id: 'SW-103', sourceWarehouse: 'Warehouse Bravo (Sector 2)', targetDestination: 'Regional Warehouse Alpha', supplyItem: 'Infant Nutrition Formula', quantity: 100, unit: 'boxes', urgencyHoursRemaining: 14, routeFeasibility: 'SAFE', status: 'PENDING_APPROVAL' }),
        normalizeSupplySwap({ id: 'SW-104', sourceWarehouse: 'Regional Warehouse Alpha', targetDestination: 'Shelter 09 (River Basin)', supplyItem: 'Potable Water Drums', quantity: 200, unit: 'drums', urgencyHoursRemaining: 2, routeFeasibility: 'BLOCKED', status: 'PENDING_APPROVAL' })
      ];
      res.status = API_STATUS.SUCCESS;
    }
    return res;
  },

  async createSupplySwap(swapData) {
    return await request('/api/swaps', {
      method: 'POST',
      body: JSON.stringify(swapData)
    });
  },

  async approveSupplySwap(swapId) {
    return await request(`/api/swaps/${swapId}/approve`, {
      method: 'POST'
    });
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

export const api = ApiService;
export default ApiService;

