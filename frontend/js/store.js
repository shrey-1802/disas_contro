/* ==========================================
   DISISTA CONTROL — CENTRALIZED REACTIVE STATE STORE
   Shared localStorage-backed Single Source of Truth
   ========================================== */

const INITIAL_STATE = {
  warehouses: [
    { id: 'wh-alpha', name: 'Hub Alpha (Central Depot)', location: 'Sector 1', onHand: 14000, reserved: 2000, available: 12000, safety: 3000, daysCover: 4.5 },
    { id: 'wh-bravo', name: 'Hub Bravo (Northern Rift)', location: 'Sector 4', onHand: 6200, reserved: 1500, available: 4700, safety: 1500, daysCover: 3.1 },
    { id: 'wh-charlie', name: 'Hub Charlie (Coastal Base)', location: 'Sector 8', onHand: 9800, reserved: 800, available: 9000, safety: 2000, daysCover: 5.2 }
  ],

  convoys: [
    {
      id: 'convoy-14',
      name: 'Convoy 14',
      cargo: 'Insulin & Blood Products',
      priority: 'Insulin/Blood',
      origin: 'Hub Alpha',
      dest: 'Shelter 12',
      status: 'On Route',
      driver: 'Unit-4 (Driver Mark)',
      ackStatus: 'Acknowledged',
      eta: '14:20 UTC',
      lat: 14.615,
      lng: 120.970,
      riskLevel: 'medium',
      coldChain: true,
      oldPath: null,
      newPath: 'Route 4 Direct',
      rationale: 'Nominal route active. Safe clearance verified.',
      route: [[14.6095, 120.9742], [14.625, 120.980], [14.6495, 120.9642]],
      lastCheckin: '4 mins ago',
      afterAction: null
    },
    {
      id: 'convoy-22',
      name: 'Convoy 22',
      cargo: 'Infant Nutrition & Clean Water',
      priority: 'Infant Nutrition',
      origin: 'Hub Bravo',
      dest: 'Shelter 04',
      status: 'Rerouted',
      driver: 'Unit-9 (Driver Elena)',
      ackStatus: 'Acknowledged',
      eta: '16:05 UTC',
      lat: 14.630,
      lng: 121.005,
      riskLevel: 'low',
      coldChain: false,
      oldPath: 'Route 4 Corridor → Bridge B14',
      newPath: 'Bypass 2 via Rift Highway → Shelter 04',
      rationale: 'Bridge B14 submerged -> Rerouted via Bypass 2 (+14m)',
      route: [[14.6395, 120.9942], [14.630, 121.005], [14.6295, 121.0242]],
      lastCheckin: '12 mins ago',
      afterAction: null
    },
    {
      id: 'convoy-09',
      name: 'Convoy 09',
      cargo: 'General Relief Supplies',
      priority: 'General',
      origin: 'Hub Charlie',
      dest: 'Shelter 19',
      status: 'Stranded',
      driver: 'Unit-2 (Driver David)',
      ackStatus: 'Ack Pending',
      eta: 'Delayed (Blocked)',
      lat: 14.570,
      lng: 120.980,
      riskLevel: 'high',
      coldChain: false,
      oldPath: 'Coastal Highway 8',
      newPath: 'Pending Safe Corridor Assignment',
      rationale: 'Bridge B14 Impassable & Route 4 Flash Flood. Relay handoff required at Sector 8.',
      relayPoint: 'Sector 8 Relay Depot (Vehicle Transfer Required)',
      route: [[14.5795, 121.0142], [14.570, 120.980], [14.5595, 120.9442]],
      lastCheckin: '35 mins ago',
      afterAction: null
    }
  ],

  shelters: [
    {
      id: 'shelter-19',
      name: 'Shelter 19 (Island Reach)',
      district: 'District 4 (Northern Rift)',
      population: 2100,
      daysSupply: 0.5,
      urgency: 'critical',
      isolated: true,
      lat: 14.5595,
      lng: 120.9442,
      incomingConvoy: null,
      shortageType: 'medical',
      inventory: { water: '400 Liters (Critically Low)', insulin: '12 Vials (0.2 Days Cover)', nutrition: '80 Ration Packs' }
    },
    {
      id: 'shelter-12',
      name: 'Shelter 12 (North Community)',
      district: 'District 4 (Northern Rift)',
      population: 1450,
      daysSupply: 1.5,
      urgency: 'critical',
      isolated: false,
      lat: 14.6495,
      lng: 120.9642,
      incomingConvoy: 'Convoy 14 (ETA 45m)',
      shortageType: 'medical',
      inventory: { water: '1,200 Liters', insulin: '45 Vials (1.2 Days Cover)', nutrition: '300 Ration Packs' }
    },
    {
      id: 'shelter-04',
      name: 'Shelter 04 (Rift Valley High)',
      district: 'District 4 (Northern Rift)',
      population: 920,
      daysSupply: 3.2,
      urgency: 'safe',
      isolated: false,
      lat: 14.6295,
      lng: 121.0242,
      incomingConvoy: 'Convoy 22 (ETA 1h 20m)',
      shortageType: 'food',
      inventory: { water: '3,500 Liters', insulin: '120 Vials (3.5 Days Cover)', nutrition: '850 Ration Packs' }
    }
  ],

  hazards: [
    { id: 'haz-101', name: 'Route 4 Flash Flood', lat: 14.625, lng: 120.980, type: 'Flash Flood', severity: 'hazardous', confidence: 85, confirmed: false, notes: 'Water depth 1.2m across 400m stretch.', timestamp: '10 mins ago' },
    { id: 'haz-102', name: 'Bridge B14 Submerged', lat: 14.640, lng: 120.970, type: 'Bridge Impassable', severity: 'impassable', confidence: 98, confirmed: true, notes: 'Bridge deck submerged. Structural failure risk.', timestamp: '25 mins ago' }
  ],

  reports: [
    { id: 'rep-101', source: 'Field Driver (Unit 4)', type: 'Flash Flood', severity: 'hazardous', loc: 'Route 4 — Mile 12', timestamp: '10 mins ago', confidence: 85, confirmed: false },
    { id: 'rep-102', source: 'Satellite Radar', type: 'Bridge Structural Fail', severity: 'impassable', loc: 'Bridge B14', timestamp: '25 mins ago', confidence: 98, confirmed: true }
  ],

  alerts: [
    { id: 'alt-501', title: 'Isolated Shelter Detected — Shelter 19 (Island Reach)', description: 'Shelter 19 has 0.5 days supply remaining with NO viable road path from any warehouse depot due to Bridge B14 closure.', tier: 'critical', timestamp: '12 mins ago', acknowledged: false, escalated: false },
    { id: 'alt-502', title: 'Convoy 09 Ack Timeout', description: 'Driver Unit-2 has not acknowledged reroute order after 30 minutes in hazard zone Sector 8.', tier: 'warning', timestamp: '5 mins ago', acknowledged: false, escalated: false }
  ],

  transfers: [
    {
      id: 'txfr-88',
      from: 'Hub Bravo (Northern Rift)',
      to: 'Hub Alpha (Central Depot)',
      cargo: 'Insulin & Blood Products',
      cargoType: 'Insulin/Blood',
      qty: 600,
      coldChain: true,
      currentStage: 3, // 0=Requested,1=Matched,2=Approved,3=Picking,4=Loading,5=Dispatched,6=InTransit,7=Received,8=Completed
      convoy: 'Convoy 14',
      started: '08:30 UTC',
      eta: '14:20 UTC',
      status: 'Active'
    },
    {
      id: 'txfr-91',
      from: 'Hub Charlie (Coastal Base)',
      to: 'Hub Bravo (Northern Rift)',
      cargo: 'Clean Water Containers',
      cargoType: 'Clean Water',
      qty: 2400,
      coldChain: false,
      currentStage: 6,
      convoy: 'Convoy 22',
      started: '07:00 UTC',
      eta: '16:05 UTC',
      status: 'Active'
    }
  ]
};

class DataStore {
  constructor() {
    this.STORAGE_KEY = 'disista_app_state';
    this.listeners = [];
    this.state = this.loadState();

    window.addEventListener('storage', (e) => {
      if (e.key === this.STORAGE_KEY) {
        this.state = this.loadState();
        this.notifyListeners();
      }
    });
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) {
        this.saveState(INITIAL_STATE);
        return JSON.parse(JSON.stringify(INITIAL_STATE));
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Store] Failed to load state from localStorage, resetting.', e);
      return JSON.parse(JSON.stringify(INITIAL_STATE));
    }
  }

  saveState(newState) {
    this.state = newState;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    this.notifyListeners();
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(l => l(this.state));
  }

  /* Entity Specific Helpers */
  getConvoys() { return this.state.convoys || []; }
  getHazards() { return this.state.hazards || []; }
  getShelters() { return this.state.shelters || []; }
  getWarehouses() { return this.state.warehouses || []; }
  getTransfers() { return this.state.transfers || []; }
  getReports() { return this.state.reports || []; }
  getAlerts() { return this.state.alerts || []; }

  addHazard(hazard) {
    const state = this.loadState();
    state.hazards.unshift(hazard);

    // Also add to reports feed
    state.reports.unshift({
      id: `rep-${Date.now()}`,
      source: hazard.source || 'Field Observation',
      type: hazard.type,
      severity: hazard.severity,
      loc: hazard.name,
      timestamp: 'Just now',
      confidence: hazard.confidence || 80,
      confirmed: hazard.confirmed || false
    });

    // Recheck convoys & mark rerouted
    state.convoys.forEach(c => {
      if (c.status === 'On Route') {
        c.status = 'Rerouted';
        c.oldPath = c.newPath || 'Original Direct Corridor';
        c.newPath = `Bypass via Sector 4 -> ${c.dest}`;
        c.rationale = `Hazard (${hazard.name}) registered -> Automatic cost graph recalculation.`;
        c.ackStatus = 'Ack Pending';
      }
    });

    this.saveState(state);
    if (window.socket) {
      window.socket.emit('route:recalculated', { hazard, convoys: state.convoys });
      window.socket.emit('hazard:updated', hazard);
    }
  }

  verifyHazard(hazardId) {
    const state = this.loadState();
    const h = state.hazards.find(item => item.id === hazardId);
    if (h) {
      h.confirmed = true;
      h.confidence = 100;

      const r = state.reports.find(item => item.id === hazardId || item.loc === h.name);
      if (r) {
        r.confirmed = true;
        r.confidence = 100;
      }

      this.saveState(state);
      if (window.socket) {
        window.socket.emit('route:recalculated', { hazardId, status: 'verified' });
      }
    }
  }

  acknowledgeDriverRoute(convoyId) {
    const state = this.loadState();
    const c = state.convoys.find(item => item.id === convoyId);
    if (c) {
      c.ackStatus = 'Acknowledged';
      this.saveState(state);
    }
  }

  addReport(report) {
    const state = this.loadState();
    state.reports.unshift(report);
    this.saveState(state);
    if (window.socket) {
      window.socket.emit('hazard:updated', report);
    }
  }

  addAlert(alert) {
    const state = this.loadState();
    state.alerts.unshift(alert);
    this.saveState(state);
    if (window.socket) {
      window.socket.emit('alert:new', alert);
    }
  }

  acknowledgeAlert(alertId) {
    const state = this.loadState();
    const a = state.alerts.find(item => item.id === alertId);
    if (a) {
      a.acknowledged = true;
      this.saveState(state);
    }
  }

  escalateAlert(alertId) {
    const state = this.loadState();
    const a = state.alerts.find(item => item.id === alertId);
    if (a) {
      a.escalated = true;
      this.saveState(state);
      if (window.socket) {
        window.socket.emit('alert:new', { ...a, title: `ESCALATED: ${a.title}` });
      }
    }
  }

  addTransfer(transfer) {
    const state = this.loadState();
    state.transfers.unshift(transfer);
    this.saveState(state);
    if (window.socket) {
      window.socket.emit('transfer:status_update', transfer);
    }
  }

  advanceTransferStage(transferId) {
    const state = this.loadState();
    const t = state.transfers.find(item => item.id === transferId);
    if (t && t.currentStage < 8) {
      t.currentStage += 1;
      if (t.currentStage === 8) t.status = 'Completed';
      this.saveState(state);
      if (window.socket) {
        window.socket.emit('transfer:status_update', t);
      }
    }
  }

  addConvoy(convoy) {
    const state = this.loadState();
    const newConvoy = {
      id: `convoy-${Date.now()}`,
      ackStatus: 'Acknowledged',
      riskLevel: 'low',
      coldChain: convoy.priority === 'Insulin/Blood',
      oldPath: null,
      newPath: `${convoy.origin} → ${convoy.dest} Direct`,
      rationale: 'Initial dispatch — nominal safe corridor.',
      route: [],
      lastCheckin: 'Just now',
      afterAction: null,
      ackTimestamp: Date.now(),
      ...convoy
    };
    state.convoys.unshift(newConvoy);
    this.saveState(state);
    if (window.socket) window.socket.emit('mission:risk_update', newConvoy);
    return newConvoy.id;
  }

  /* A.6 — Flag convoy ack as timed out (>30min pending) */
  flagAckTimeout(convoyId) {
    const state = this.loadState();
    const c = state.convoys.find(item => item.id === convoyId);
    if (c && c.ackStatus === 'Ack Pending') {
      c.ackStatus = 'Ack Timeout';
      state.alerts.unshift({
        id: `alt-${Date.now()}`,
        title: `Driver Ack Timeout — ${c.name}`,
        description: `${c.driver} has not acknowledged reroute order after the timeout window. Manual contact required.`,
        tier: 'critical',
        timestamp: 'Just now',
        acknowledged: false,
        escalated: false,
        convoyId
      });
      this.saveState(state);
      if (window.socket) window.socket.emit('alert:new', state.alerts[0]);
    }
  }

  /* A.4 — Mark shelter isolated & auto-create alert */
  markShelterIsolated(shelterId) {
    const state = this.loadState();
    const s = state.shelters.find(item => item.id === shelterId);
    if (s && !s.isolated) {
      s.isolated = true;
      s.urgency = 'critical';
      const alertExists = state.alerts.some(a => a.shelterId === shelterId && !a.acknowledged);
      if (!alertExists) {
        state.alerts.unshift({
          id: `alt-${Date.now()}`,
          title: `Isolated Shelter — ${s.name}`,
          description: `No viable road path from any warehouse depot. ${s.daysSupply} days supply remaining. Aerial or relay intervention required.`,
          tier: 'critical',
          timestamp: 'Just now',
          acknowledged: false,
          escalated: false,
          shelterId
        });
      }
      this.saveState(state);
      if (window.socket) window.socket.emit('shelter:demand_update', s);
    }
  }

  /* B.1 — Store a shortage forecast entry */
  addShortcutForecast(forecast) {
    const state = this.loadState();
    if (!state.forecasts) state.forecasts = [];
    state.forecasts.unshift({ id: `fc-${Date.now()}`, ...forecast, timestamp: Date.now() });
    this.saveState(state);
  }

  getForecasts() { return this.state.forecasts || []; }

  /* B.6 — Escalate stalled critical transfer */
  escalateTransfer(transferId) {
    const state = this.loadState();
    const t = state.transfers.find(item => item.id === transferId);
    if (t) {
      t.status = 'Escalated';
      state.alerts.unshift({
        id: `alt-${Date.now()}`,
        title: `Critical Transfer Escalated — ${t.id}`,
        description: `Transfer of ${t.cargo} (${t.qty} units) from ${t.from} to ${t.to} has been unactioned beyond the 15-minute threshold. Escalated to District Command.`,
        tier: 'critical',
        timestamp: 'Just now',
        acknowledged: false,
        escalated: true,
        transferId
      });
      this.saveState(state);
      if (window.socket) window.socket.emit('transfer:status_update', t);
    }
  }

  resetToInitial() {
    this.saveState(JSON.parse(JSON.stringify(INITIAL_STATE)));
  }
}

window.store = new DataStore();

