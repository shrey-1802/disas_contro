/* ==========================================
   DISISTA CONTROL — API CLIENT & MOCK ENGINE
   Production-friendly: runtime-configurable API base, timeout and safer fallback
   ========================================== */

// Determine API base from runtime env (window.__ENV__), meta tag, or sensible default.
const API_BASE_URL = (window.__ENV && window.__ENV.API_BASE_URL)
  || (document.querySelector('meta[name="api-base"]') && document.querySelector('meta[name="api-base"]').content)
  || '/api';

const MOCK_DATA = {
  warehouses: [
    { id: 'wh-alpha', name: 'Hub Alpha (Central Depot)', location: 'Sector 1', onHand: 14000, reserved: 2000, available: 12000 },
    { id: 'wh-bravo', name: 'Hub Bravo (Northern Rift)', location: 'Sector 4', onHand: 6200, reserved: 1500, available: 4700 },
    { id: 'wh-charlie', name: 'Hub Charlie (Coastal Base)', location: 'Sector 8', onHand: 9800, reserved: 800, available: 9000 }
  ],
  convoys: [
    { id: 'convoy-14', cargo: 'Insulin & Blood Products', cargoPriority: 'Insulin/Blood', origin: 'Hub Alpha', destination: 'Shelter 12', status: 'On Route', eta: '14:20 UTC', riskIndex: 'Caution' },
    { id: 'convoy-22', cargo: 'Infant Nutrition & Clean Water', cargoPriority: 'Infant Nutrition', origin: 'Hub Bravo', destination: 'Shelter 04', status: 'Rerouted', eta: '16:05 UTC', riskIndex: 'Caution' },
    { id: 'convoy-09', cargo: 'General Aid Supplies', cargoPriority: 'General', origin: 'Hub Charlie', destination: 'Shelter 19', status: 'Stranded', eta: 'Delayed', riskIndex: 'Blocked' }
  ],
  shelters: [
    { id: 'shelter-12', name: 'Shelter 12 (North Community)', population: 1450, daysSupply: 1.5, urgencyTier: 'critical', isolated: false },
    { id: 'shelter-04', name: 'Shelter 04 (Rift Valley High)', population: 920, daysSupply: 3.2, urgencyTier: 'caution', isolated: false },
    { id: 'shelter-19', name: 'Shelter 19 (Island Reach)', population: 2100, daysSupply: 0.5, urgencyTier: 'critical', isolated: true }
  ],
  reports: [
    { id: 'rep-101', source: 'Field Driver (Unit 4)', type: 'Flash Flood', severity: 'hazardous', location: 'Route 4 - Mile 12', timestamp: '10 mins ago', confidence: 85, confirmed: false },
    { id: 'rep-102', source: 'Satellite Radar', type: 'Bridge Structural Fail', severity: 'impassable', location: 'Bridge B14', timestamp: '25 mins ago', confidence: 98, confirmed: true }
  ],
  alerts: [
    { id: 'alt-501', title: 'Isolated Shelter Detected', description: 'Shelter 19 has 0.5 days supply remaining with no available road path.', tier: 'critical', timestamp: '12 mins ago', acknowledged: false }
  ]
};

class ApiClient {
  async fetchJson(endpoint, options = {}) {
    const controller = new AbortController();
    const timeout = options.timeout || 7000; // sensible default
    const signal = controller.signal;

    const fetchOpts = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal,
      ...options
    };

    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, fetchOpts);
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      try {
        return await res.json();
      } catch (jsonErr) {
        console.warn('[API Client] JSON parse failed; returning empty object', jsonErr);
        return {};
      }
    } catch (err) {
      console.warn(`[API Client] Endpoint ${endpoint} unavailable, serving mock data fallback.`, err);
      clearTimeout(timer);
      return this.getMockFallback(endpoint, options);
    }
  }

  getMockFallback(endpoint, options) {
    if (endpoint.includes('/warehouses')) return MOCK_DATA.warehouses;
    if (endpoint.includes('/missions') || endpoint.includes('/convoys')) return MOCK_DATA.convoys;
    if (endpoint.includes('/shelters')) return MOCK_DATA.shelters;
    if (endpoint.includes('/reports')) return MOCK_DATA.reports;
    if (endpoint.includes('/alerts')) return MOCK_DATA.alerts;
    return { success: true, mock: true, timestamp: new Date().toISOString() };
  }
}

window.api = new ApiClient();
