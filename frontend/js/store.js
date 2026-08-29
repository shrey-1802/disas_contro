/* CENTRALIZED REACTIVE STATE STORE (Interconnected Cross-Page Intelligence) */
import {
  normalizeRoad,
  normalizeBridge,
  normalizeShelter,
  normalizeMission,
  normalizeReport,
  normalizeAlert,
  normalizeSupplySwap,
  normalizeInventory
} from './adapters.js';

const STORAGE_KEYS = {
  ROADS: 'disissta_roads',
  BRIDGES: 'disissta_bridges',
  SHELTERS: 'disissta_shelters',
  MISSIONS: 'disissta_missions',
  REPORTS: 'disissta_reports',
  ALERTS: 'disissta_alerts',
  SWAPS: 'disissta_swaps',
  INVENTORY: 'disissta_inventory'
};

// Initial Seed Data
const DEFAULT_SEEDS = {
  ROADS: [
    { id: 'ROAD-01', name: 'Highway 1 (Arterial Bypass)', status: 'normal', floodDepthMeters: 0 },
    { id: 'ROAD-02', name: 'Feeder Road C', status: 'degraded', floodDepthMeters: 0.2 },
    { id: 'ROAD-03', name: 'River Basin Corridor 6', status: 'hazardous', floodDepthMeters: 1.4 }
  ],
  BRIDGES: [
    { id: 'B-14', name: 'Bridge B-14 (Sector 6)', status: 'hazardous', structuralDamage: 'Severe Submersion', coordinates: [27.7210, 85.3500] },
    { id: 'B-02', name: 'East Valley Bridge', status: 'degraded', structuralDamage: 'Minor Scour', coordinates: [27.7320, 85.3420] }
  ],
  SHELTERS: [
    { id: 'SHELTER-06', name: 'Shelter 06 (East Valley Sector 4)', region: 'East Valley Sector 4', population: 640, daysOfSupply: 0.5, isolationRisk: true, contactRadio: 'Ch. 4 (462.5625 MHz)', coordinates: [27.7250, 85.3300] },
    { id: 'SHELTER-02', name: 'Shelter 02 (Gymnasium)', region: 'Central Sector 1', population: 420, daysOfSupply: 1.2, isolationRisk: false, contactRadio: 'Ch. 2 (462.5875 MHz)', coordinates: [27.7180, 85.3200] },
    { id: 'SHELTER-09', name: 'Shelter 09 (River Basin Complex)', region: 'River Basin Sector 6', population: 890, daysOfSupply: 0.3, isolationRisk: true, contactRadio: 'Ch. 9 (462.6375 MHz)', coordinates: [27.7120, 85.3400] },
    { id: 'SHELTER-04', name: 'Shelter 04 (Community Center)', region: 'Central District', population: 310, daysOfSupply: 4.5, isolationRisk: false, contactRadio: 'Ch. 1 (462.5625 MHz)', coordinates: [27.7300, 85.3100] }
  ],
  MISSIONS: [
    { id: 'CV-014', cargoType: 'Refrigerated Insulin & Blood', priority: 'Critical', originHub: 'Regional Warehouse Alpha', destinationShelter: 'Shelter 06 (East Valley Sector 4)', status: 'Rerouted', oldPathName: 'Highway 1 (Submerged)', newPathName: 'Feeder Road C', eta: '+38 min delay', driverName: 'Driver Marcus V.', coordinates: [27.7220, 85.3350] },
    { id: 'CV-022', cargoType: 'Infant Nutrition Formula', priority: 'High', originHub: 'Depot Bravo', destinationShelter: 'Shelter 02 (Gymnasium)', status: 'On Route', newPathName: 'Arterial Link 2', eta: '25 mins', driverName: 'Driver Elena R.', coordinates: [27.7150, 85.3220] },
    { id: 'CV-008', cargoType: 'Potable Water Drums', priority: 'Medium', originHub: 'Regional Warehouse Alpha', destinationShelter: 'Shelter 09 (River Basin Complex)', status: 'Stranded', oldPathName: 'Bridge B-14', newPathName: 'Awaiting Reroute Approval', eta: 'UNKNOWN', driverName: 'Driver Jacob T.', coordinates: [27.7200, 85.3480] }
  ],
  REPORTS: [
    { id: 'REP-101', hazardType: 'Flood', sourceType: 'Sensor', reportedAt: new Date(Date.now() - 15 * 60000).toISOString(), region: 'Sector 6', status: 'Hazardous', description: 'Water level reached 1.4m over roadway.', confidencePercent: 95, verificationState: 'Verified' },
    { id: 'REP-102', hazardType: 'Debris', sourceType: 'Field Report', reportedAt: new Date(Date.now() - 45 * 60000).toISOString(), region: 'East Valley', status: 'Caution', description: 'Hillside debris partially blocking lane 2.', confidencePercent: 88, verificationState: 'Unverified' }
  ],
  ALERTS: [
    { id: 'ALT-101', severity: 'CRITICAL', message: 'Convoy CV-014 stranded due to Landslide & Submerged Bridge B-14 in Sector 6.', region: 'Sector 6', convoyId: 'CV-014', timestamp: new Date().toISOString(), acknowledged: false, escalated: false }
  ],
  SWAPS: [
    { id: 'SW-101', sourceWarehouse: 'Regional Warehouse Alpha', targetDestination: 'Shelter 06 (East Valley Sector 4)', supplyItem: 'Refrigerated Insulin', quantity: 40, unit: 'vials', urgencyHoursRemaining: 4, routeFeasibility: 'CAUTION', status: 'PENDING_APPROVAL', requester: 'Shelter 06 Operations' },
    { id: 'SW-102', sourceWarehouse: 'Regional Warehouse Alpha', targetDestination: 'Shelter 02 (Gymnasium)', supplyItem: 'Whole Blood Bags (O-)', quantity: 15, unit: 'units', urgencyHoursRemaining: 8, routeFeasibility: 'SAFE', status: 'APPROVED', requester: 'Central District Authority' }
  ]
};

function getLocalData(key, seedData, normalizer) {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizer);
      }
    } catch (e) {}
  }
  const normalizedSeeds = seedData.map(normalizer);
  localStorage.setItem(key, JSON.stringify(normalizedSeeds));
  return normalizedSeeds;
}

function setLocalData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('store-updated', { detail: { key, data } }));
}

export const Store = {
  getShelters() {
    return getLocalData(STORAGE_KEYS.SHELTERS, DEFAULT_SEEDS.SHELTERS, normalizeShelter);
  },

  getMissions() {
    return getLocalData(STORAGE_KEYS.MISSIONS, DEFAULT_SEEDS.MISSIONS, normalizeMission);
  },

  getReports() {
    return getLocalData(STORAGE_KEYS.REPORTS, DEFAULT_SEEDS.REPORTS, normalizeReport);
  },

  getAlerts() {
    return getLocalData(STORAGE_KEYS.ALERTS, DEFAULT_SEEDS.ALERTS, normalizeAlert);
  },

  getSwaps() {
    return getLocalData(STORAGE_KEYS.SWAPS, DEFAULT_SEEDS.SWAPS, normalizeSupplySwap);
  },

  getRoads() {
    return getLocalData(STORAGE_KEYS.ROADS, DEFAULT_SEEDS.ROADS, normalizeRoad);
  },

  getBridges() {
    return getLocalData(STORAGE_KEYS.BRIDGES, DEFAULT_SEEDS.BRIDGES, normalizeBridge);
  },

  /**
   * Approves a Supply Swap, creates a Convoy Mission, and updates Shelter Days of Supply!
   */
  approveSwap(swapId) {
    const swaps = this.getSwaps();
    const swap = swaps.find(s => s.id === swapId);
    if (!swap) return null;

    swap.status = 'APPROVED';
    this.saveSwaps(swaps);

    // Automatically create interconnected Convoy Mission
    const missions = this.getMissions();
    const convoyId = `CV-SWAP-${Math.floor(100 + Math.random() * 900)}`;
    const newMission = normalizeMission({
      id: convoyId,
      cargoType: `${swap.quantity} ${swap.unit} ${swap.supplyItem}`,
      priority: swap.supplyItem.toLowerCase().includes('insulin') || swap.supplyItem.toLowerCase().includes('blood') ? 'Critical' : 'High',
      originHub: swap.sourceWarehouse,
      destinationShelter: swap.targetDestination,
      status: 'On Route',
      oldPathName: null,
      newPathName: swap.routeFeasibility === 'CAUTION' ? 'Bypass Corridor 1' : 'Primary Arterial Link',
      eta: '30 mins',
      driverName: 'Driver Dispatch Fleet',
      coordinates: [27.7200, 85.3280]
    });

    missions.unshift(newMission);
    this.saveMissions(missions);

    // Update Shelter Days of Supply
    const shelters = this.getShelters();
    const targetShelter = shelters.find(s => s.name.toLowerCase().includes(swap.targetDestination.toLowerCase()) || swap.targetDestination.toLowerCase().includes(s.name.toLowerCase()));
    if (targetShelter) {
      targetShelter.daysOfSupply = Math.max(1.5, targetShelter.daysOfSupply + 2.0);
      targetShelter.incomingConvoyEta = '30 mins (Convoy ' + convoyId + ')';
      this.saveShelters(shelters);
    }

    // Set active alert banner
    localStorage.setItem('unacknowledged_critical_alert', JSON.stringify({
      id: `ALT-SWAP-${swapId}`,
      title: `Supply Transfer Dispatched: ${convoyId}`,
      message: `${swap.quantity} ${swap.unit} ${swap.supplyItem} en route to ${swap.targetDestination}.`,
      acknowledged: false
    }));

    return { swap, convoyId };
  },

  /**
   * Submits a Ground Hazard Report and recalculates connected route risks & convoy statuses!
   */
  addReport(reportData) {
    const reports = this.getReports();
    const newReport = normalizeReport({
      id: `REP-${Math.floor(200 + Math.random() * 800)}`,
      reportedAt: new Date().toISOString(),
      confidencePercent: 90,
      verificationState: 'Unverified',
      ...reportData
    });

    reports.unshift(newReport);
    this.saveReports(reports);

    // If report is critical/hazardous, affect convoys operating in that region
    if (newReport.tier === 'BLOCKED' || newReport.status === 'Critical' || newReport.status === 'Hazardous') {
      const missions = this.getMissions();
      missions.forEach(m => {
        if (m.destinationShelter.includes(newReport.region) || m.originHub.includes(newReport.region)) {
          m.status = 'Rerouted';
          m.oldPathName = m.newPathName || 'Arterial Link';
          m.newPathName = 'Feeder Bypass Corridor';
          m.eta = '+45 min delay';
        }
      });
      this.saveMissions(missions);
    }

    return newReport;
  },

  /**
   * Acknowledges an Alert and clears global critical banner across ALL screens in real time!
   */
  acknowledgeAlert(alertId) {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.saveAlerts(alerts);
    }
    localStorage.removeItem('unacknowledged_critical_alert');
    window.dispatchEvent(new CustomEvent('alert-acknowledged', { detail: { alertId } }));
  },

  saveShelters(data) { setLocalData(STORAGE_KEYS.SHELTERS, data); },
  saveMissions(data) { setLocalData(STORAGE_KEYS.MISSIONS, data); },
  saveReports(data) { setLocalData(STORAGE_KEYS.REPORTS, data); },
  saveAlerts(data) { setLocalData(STORAGE_KEYS.ALERTS, data); },
  saveSwaps(data) { setLocalData(STORAGE_KEYS.SWAPS, data); }
};

window.Store = Store;
export default Store;
