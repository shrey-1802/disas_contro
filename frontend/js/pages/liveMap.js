/**
 * Live Situational Map Controller — Real-Time Patch Stream Engine (Phase 5)
 * Relief Supply Chain Resilience & Rerouting System
 */

import { renderGlobalShell } from '../navbar.js';
import { api } from '../api.js';
import { socketService } from '../socket.js';
import { renderStatusBadge } from '../statusBadge.js';
import { toast } from '../toast.js';

let map = null;
let floodLayerGroup = null;
let debrisLayerGroup = null;
let bridgeLayerGroup = null;
let convoyLayerGroup = null;
let shelterLayerGroup = null;

const entityPatchRegistry = new Map();
let currentlyInspectedEntityId = null;

const MAP_CENTER = [27.7172, 85.3240];
const DEFAULT_ZOOM = 13;

document.addEventListener('DOMContentLoaded', async () => {
  renderGlobalShell('live-map.html');

  initLeafletMap();

  // Phase 5 Requirement: GET /api/roads, /api/bridges, /api/shelters, /api/missions, /api/vehicles
  let roads = [], bridges = [], shelters = [], missions = [], vehicles = [];
  try {
    [roads, bridges, shelters, missions, vehicles] = await Promise.all([
      api.getRoads().catch(() => getMockRoads()),
      api.getBridges().catch(() => getMockBridges()),
      api.getShelters().catch(() => getMockShelters()),
      api.getMissions().catch(() => getMockMissions()),
      api.getVehicles().catch(() => getMockVehicles())
    ]);
  } catch (e) {
    console.warn('[LiveMap] API telemetry fetch warning:', e.message);
  }

  // Render Map Overlays from fetched API data (or mock fallbacks)
  renderFloodOverlays();
  renderDebrisCorridors(roads);
  renderBridgeMarkers(bridges);
  renderShelterMarkers(shelters);
  renderConvoyMarkers(missions, vehicles);

  // Bind Left Layer Controls
  bindLayerControls();

  // Check URL query parameters (e.g., ?convoy=CV-014)
  const urlParams = new URLSearchParams(window.location.search);
  const targetConvoyId = urlParams.get('convoy');
  if (targetConvoyId) {
    selectEntityById(targetConvoyId);
  }

  // Hook global search input
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toUpperCase();
      if (q.length >= 2) {
        selectEntityById(q);
      }
    });
  }

  // Phase 5 Requirement: Subscribe to Socket.io events with zero-flicker patch updates
  socketService.subscribe('mission_update', (data) => patchConvoyObject(data));
  socketService.subscribe('vehicle_update', (data) => patchVehicleObject(data));
  socketService.subscribe('bridge_update', (data) => patchBridgeObject(data));
  socketService.subscribe('shelter_update', (data) => patchShelterObject(data));
  socketService.subscribe('road_update', (data) => patchRoadObject(data));
});

/* --------------------------------------------------------------------------
   1. MAP INITIALIZATION
   -------------------------------------------------------------------------- */
function initLeafletMap() {
  map = L.map('map', {
    center: MAP_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© Government Emergency Operations | OpenStreetMap'
  }).addTo(map);

  floodLayerGroup = L.layerGroup().addTo(map);
  debrisLayerGroup = L.layerGroup().addTo(map);
  bridgeLayerGroup = L.layerGroup().addTo(map);
  convoyLayerGroup = L.layerGroup().addTo(map);
  shelterLayerGroup = L.layerGroup().addTo(map);
}

/* --------------------------------------------------------------------------
   2. INITIAL MARKER & OVERLAY RENDERING
   -------------------------------------------------------------------------- */
function renderFloodOverlays() {
  const floodZone = [
    [27.7250, 85.3300],
    [27.7320, 85.3420],
    [27.7210, 85.3500],
    [27.7150, 85.3350]
  ];

  const poly = L.polygon(floodZone, {
    color: '#3A4750',
    fillColor: '#5A7A68',
    fillOpacity: 0.45,
    weight: 2
  }).addTo(floodLayerGroup);

  poly.bindPopup(`
    <div style="font-family:var(--font-sans); padding:4px;">
      <div style="font-weight:700; font-size:14px; color:var(--slate-800);">Submerged River Tributary Zone</div>
      <div style="margin:4px 0;">${renderStatusBadge('blocked', 'FLOOD DEPTH 1.4m')}</div>
      <div class="text-xs" style="color:var(--slate-600);">Source: <strong>River Water Sensor #04</strong></div>
      <div class="text-xs" style="color:var(--slate-600);">Reported: <strong>3 min ago</strong> | Confidence: <strong>94%</strong></div>
      <div class="text-xs" style="color:var(--slate-600);">Region: <strong>Sector 6 River Basin</strong></div>
    </div>
  `);
}

function renderDebrisCorridors(roads) {
  const data = (roads && roads.length > 0) ? roads : getMockRoads();

  data.forEach(r => {
    const roadId = r.id || r.road_id || 'ROAD-C';
    const polylineCoords = r.coordinates || r.polyline || [
      [27.7100, 85.3100],
      [27.7150, 85.3200],
      [27.7180, 85.3250]
    ];

    const line = L.polyline(polylineCoords, {
      color: r.status === 'blocked' || r.status === 'impassable' ? '#8B0000' : '#3A4750',
      weight: 5,
      dashArray: '8, 8',
      opacity: 0.85
    }).addTo(debrisLayerGroup);

    entityPatchRegistry.set(roadId, { layer: line, data: r, type: 'road' });

    line.bindPopup(`
      <div style="font-family:var(--font-sans); padding:4px;">
        <div style="font-weight:700; font-size:14px;">${r.name || 'Feeder Road Segment'}</div>
        <div style="margin:4px 0;" id="popup-road-${roadId}-status">${renderStatusBadge(r.status || 'degraded', r.status_label || 'CAUTION — DEBRIS')}</div>
        <div class="text-xs" style="color:var(--slate-600);">Source: <strong>${r.source || 'Field Incident Telemetry'}</strong></div>
        <div class="text-xs" style="color:var(--slate-600);">Reported: <strong>${r.reported || '14 min ago'}</strong> | Confidence: <strong>${r.confidence || '82%'}</strong></div>
      </div>
    `);
  });
}

function renderBridgeMarkers(bridges) {
  const data = (bridges && bridges.length > 0) ? bridges : getMockBridges();

  data.forEach(b => {
    const bridgeId = b.id || b.bridge_id || 'BRIDGE-B14';
    const bridgeCoords = b.coords || b.coordinates || [27.7220, 85.3380];

    const octagonIcon = L.divIcon({
      className: 'custom-convoy-marker',
      html: `<div class="bridge-octagon-icon" id="bridge-icon-${bridgeId}" title="${b.name || 'Unsafe Bridge'}">🛑</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker(bridgeCoords, { icon: octagonIcon }).addTo(bridgeLayerGroup);
    entityPatchRegistry.set(bridgeId, { marker, coords: bridgeCoords, data: b, type: 'bridge', status: b.status || 'impassable' });

    marker.bindPopup(`
      <div style="font-family:var(--font-sans); padding:4px;">
        <div style="font-weight:700; font-size:14px; color:var(--slate-800);">${b.name || 'Bridge B-14 (Arterial Corridor)'}</div>
        <div style="margin:4px 0;" id="popup-bridge-${bridgeId}-status">${renderStatusBadge(b.status || 'impassable', b.status_label || '🛑 STRUCTURALLY UNSAFE')}</div>
        <div class="text-xs" style="color:var(--slate-600);">Source: <strong>${b.source || 'Control Room Inspection'}</strong></div>
        <div class="text-xs" style="color:var(--slate-600);">Reported: <strong>${b.reported || '8 min ago'}</strong> | Confidence: <strong>${b.confidence || '98%'}</strong></div>
      </div>
    `);
  });
}

function renderShelterMarkers(shelters) {
  const data = (shelters && shelters.length > 0) ? shelters : getMockShelters();

  data.forEach(s => {
    const shelterId = s.id || s.shelter_id || 'SHELTER-06';
    const shelterCoords = s.coords || s.coordinates || [27.7280, 85.3450];
    const days = s.days !== undefined ? s.days : (s.days_remaining !== undefined ? s.days_remaining : 0.5);

    const homeIcon = L.divIcon({
      className: 'custom-convoy-marker',
      html: `<div class="shelter-home-icon" id="shelter-icon-${shelterId}" title="${s.name}">🏠</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker(shelterCoords, { icon: homeIcon }).addTo(shelterLayerGroup);
    const itemData = { ...s, id: shelterId, days, coords: shelterCoords };
    entityPatchRegistry.set(shelterId, { marker, coords: shelterCoords, data: itemData, type: 'shelter' });

    marker.on('click', () => inspectShelter(itemData));
  });
}

function renderConvoyMarkers(missions, vehicles = []) {
  let convoysData = [];
  if (missions && missions.length > 0) {
    convoysData = missions.map(m => ({
      id: m.convoy_id || m.id || 'CV-014',
      cargo: m.cargo || 'Refrigerated Relief Supplies',
      priority: m.priority_label || (m.priority === 1 ? 'CRITICAL' : 'HIGH'),
      origin: m.origin || 'Regional Logistics Hub A',
      destination: m.destination || 'Shelter 06',
      route: m.route || 'Route B → Feeder C',
      status: m.status || 'On Route',
      reroute_reason: m.reroute_reason || 'Corridor telemetry nominal',
      eta: m.eta || '1h 42m',
      eta_delta: m.eta_delta || 'On Time',
      coords: m.coords || m.coordinates || [27.7150, 85.3280],
      heading: m.heading !== undefined ? m.heading : 45
    }));
  } else {
    convoysData = getMockMissions();
  }

  // Incorporate standalone vehicle telemetry if provided
  if (vehicles && vehicles.length > 0) {
    vehicles.forEach(v => {
      const vId = v.id || v.convoy_id;
      if (vId && !convoysData.some(c => c.id === vId)) {
        convoysData.push({
          id: vId,
          cargo: v.cargo || 'General Medical Emergency Kit',
          priority: v.priority || 'HIGH',
          origin: v.origin || 'Fleet Logistics Hub',
          destination: v.destination || 'Field Shelter',
          route: v.route || 'Active Segment',
          status: v.status || 'On Route',
          reroute_reason: v.reroute_reason || 'Vehicle telemetry active',
          eta: v.eta || '25m',
          eta_delta: v.eta_delta || 'On Time',
          coords: v.coords || v.coordinates || [27.7120, 85.3220],
          heading: v.heading || 90
        });
      }
    });
  }

  convoysData.forEach(c => {
    addOrUpdateConvoyMarker(c);
  });
}

function addOrUpdateConvoyMarker(c) {
  const arrowIcon = L.divIcon({
    className: 'custom-convoy-marker',
    html: `<div class="convoy-arrow-icon" id="convoy-icon-${c.id}" style="transform: rotate(${c.heading || 0}deg);" title="Convoy ${c.id}">🧭</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const marker = L.marker(c.coords, { icon: arrowIcon }).addTo(convoyLayerGroup);
  entityPatchRegistry.set(c.id, { marker, coords: c.coords, data: c, type: 'convoy' });

  marker.on('click', () => inspectConvoy(c));
}

/* --------------------------------------------------------------------------
   3. INCREMENTAL PATCH STREAM HANDLERS (ZERO MAP FLICKER)
   -------------------------------------------------------------------------- */

function patchConvoyObject(missionData) {
  const convoyId = missionData.id || missionData.convoy_id || 'CV-014';
  let reg = entityPatchRegistry.get(convoyId);

  if (!reg) {
    // Dynamic entity creation if missing from initial load
    const cData = {
      id: convoyId,
      cargo: missionData.cargo || 'Refrigerated Relief Supplies',
      priority: missionData.priority_label || missionData.priority || 'HIGH',
      origin: missionData.origin || 'Regional Logistics Hub',
      destination: missionData.destination || 'Field Shelter',
      route: missionData.route || 'Dynamic Corridor',
      status: missionData.status || 'On Route',
      reroute_reason: missionData.reroute_reason || 'Real-time telemetry stream attached',
      eta: missionData.eta || '30m',
      eta_delta: missionData.eta_delta || 'On Time',
      coords: missionData.coords || missionData.coordinates || [27.7150, 85.3280],
      heading: missionData.heading || 0
    };
    addOrUpdateConvoyMarker(cData);
    toast.show(`Live Update: New Convoy ${convoyId} telemetry registered`, 'safe', 2500);
    return;
  }

  // Merge patch telemetry into existing state object
  Object.assign(reg.data, missionData);

  // 1. Smoothly update Leaflet marker coordinates without tearing down or rebuilding layer
  if (missionData.coords || missionData.coordinates) {
    const newCoords = missionData.coords || missionData.coordinates;
    reg.marker.setLatLng(newCoords);
    reg.coords = newCoords;
  }

  // 2. Rotate directional arrow marker if heading updated
  if (missionData.heading !== undefined) {
    const iconElem = document.getElementById(`convoy-icon-${convoyId}`);
    if (iconElem) {
      iconElem.style.transform = `rotate(${missionData.heading}deg)`;
    }
  }

  // 3. Update right inspection panel live if currently selected
  if (currentlyInspectedEntityId === convoyId) {
    inspectConvoy(reg.data, false); // false = do not re-trigger flyTo animation on incremental telemetry patch
  }

  toast.show(`Live Update: Convoy ${convoyId} telemetry patched (${reg.data.status})`, 'safe', 2500);
}

function patchVehicleObject(vehicleData) {
  patchConvoyObject(vehicleData);
}

function patchBridgeObject(bridgeData) {
  const bridgeId = bridgeData.id || bridgeData.bridge_id || 'BRIDGE-B14';
  let reg = entityPatchRegistry.get(bridgeId);

  if (!reg) {
    renderBridgeMarkers([bridgeData]);
    toast.show(`Live Update: Bridge ${bridgeId} telemetry registered`, 'warning', 2500);
    return;
  }

  if (bridgeData.coords || bridgeData.coordinates) {
    const newCoords = bridgeData.coords || bridgeData.coordinates;
    reg.marker.setLatLng(newCoords);
    reg.coords = newCoords;
  }

  if (bridgeData.status) {
    reg.status = bridgeData.status;
    if (reg.data) reg.data.status = bridgeData.status;
    const statusContainer = document.getElementById(`popup-bridge-${bridgeId}-status`) || document.getElementById(`popup-bridge-B14-status`);
    if (statusContainer) {
      statusContainer.innerHTML = renderStatusBadge(bridgeData.status);
    }
  }

  toast.show(`Live Update: Bridge ${bridgeId} status patched`, 'warning', 2500);
}

function patchShelterObject(shelterData) {
  const shelterId = shelterData.id || shelterData.shelter_id || 'SHELTER-06';
  let reg = entityPatchRegistry.get(shelterId);

  if (!reg) {
    renderShelterMarkers([shelterData]);
    toast.show(`Live Update: Shelter ${shelterId} telemetry registered`, 'safe', 2500);
    return;
  }

  Object.assign(reg.data, shelterData);
  if (shelterData.days_remaining !== undefined) {
    reg.data.days = shelterData.days_remaining;
  }

  if (shelterData.coords || shelterData.coordinates) {
    const newCoords = shelterData.coords || shelterData.coordinates;
    reg.marker.setLatLng(newCoords);
    reg.coords = newCoords;
  }

  if (currentlyInspectedEntityId === shelterId) {
    inspectShelter(reg.data, false);
  }

  toast.show(`Live Update: Shelter ${shelterId} supply telemetry updated`, 'safe', 2500);
}

function patchRoadObject(roadData) {
  const roadId = roadData.id || roadData.road_id || 'ROAD-C';
  let reg = entityPatchRegistry.get(roadId);

  if (!reg) {
    renderDebrisCorridors([roadData]);
    toast.show(`Live Update: Road segment ${roadId} registered`, 'warning', 2500);
    return;
  }

  if (roadData.status && reg.layer) {
    reg.layer.setStyle({
      color: (roadData.status === 'blocked' || roadData.status === 'impassable') ? '#8B0000' : '#3A4750'
    });
    if (reg.data) reg.data.status = roadData.status;
    const statusElem = document.getElementById(`popup-road-${roadId}-status`);
    if (statusElem) {
      statusElem.innerHTML = renderStatusBadge(roadData.status);
    }
  }

  if ((roadData.coordinates || roadData.polyline) && reg.layer) {
    reg.layer.setLatLngs(roadData.coordinates || roadData.polyline);
  }

  toast.show(`Live Update: Road corridor ${roadId} status patched`, 'warning', 2500);
}

/* --------------------------------------------------------------------------
   4. RIGHT PANEL INSPECTION ENGINES
   -------------------------------------------------------------------------- */
function inspectConvoy(c, animateMap = true) {
  currentlyInspectedEntityId = c.id;
  const panel = document.getElementById('selected-entity-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:var(--space-md);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <span class="priority-badge ${c.priority === 'CRITICAL' ? 'priority-badge--critical' : 'priority-badge--high'}">${c.priority} PRIORITY</span>
          <h2 style="font-size:var(--font-size-xl); margin-top:4px; color:var(--slate-800);">Convoy ${c.id}</h2>
        </div>
        ${renderStatusBadge(c.status)}
      </div>

      <div class="card" style="padding:var(--space-sm) var(--space-md); background:var(--bg-honeydew-light);">
        <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Cargo Inventory</div>
        <div class="font-semibold text-sm" style="color:var(--slate-900);">${c.cargo}</div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-sm);" class="text-xs">
        <div>
          <div class="font-bold uppercase" style="color:var(--slate-600);">Origin Hub</div>
          <div>${c.origin}</div>
        </div>
        <div>
          <div class="font-bold uppercase" style="color:var(--slate-600);">Target Destination</div>
          <div>${c.destination}</div>
        </div>
      </div>

      <div class="card card--warning" style="padding:var(--space-sm) var(--space-md);">
        <div class="text-xs font-bold uppercase" style="color:var(--slate-800);">Why Recalculated</div>
        <div class="text-xs" style="color:var(--slate-900); margin-top:2px;">${c.reroute_reason}</div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center;" class="card">
        <div>
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Current ETA</div>
          <div style="font-size:20px; font-weight:700; color:var(--slate-900);">${c.eta}</div>
        </div>
        <div style="text-align:right;">
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">ETA Delay</div>
          <div style="font-size:16px; font-weight:700; color:var(--forest-800);">${c.eta_delta}</div>
        </div>
      </div>

      <a href="convoy-dispatch.html" class="button button--primary" style="width:100%;">🚛 Open Dispatch Workflow</a>
    </div>
  `;

  if (animateMap && map) {
    map.flyTo(c.coords, 15, { animate: true, duration: 1.0 });
  }
}

function inspectShelter(s, animateMap = true) {
  currentlyInspectedEntityId = s.id;
  const panel = document.getElementById('selected-entity-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:var(--space-md);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <span class="priority-badge priority-badge--high">RELIEF SHELTER</span>
          <h2 style="font-size:var(--font-size-lg); margin-top:4px;">${s.name}</h2>
        </div>
        ${renderStatusBadge(s.status, s.days < 1 ? 'ISOLATED' : 'DEGRADED')}
      </div>

      <div class="card card--critical" style="padding:var(--space-sm) var(--space-md);">
        <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Days of Medical Supply</div>
        <div style="font-size:28px; font-weight:700; color:var(--slate-900);">${s.days} Days</div>
        <div class="text-xs" style="color:var(--slate-900);">Population: ${s.population || 450} evacuees</div>
      </div>

      <a href="shelter-board.html" class="button button--secondary" style="width:100%;">🏠 Open Shelter Board</a>
    </div>
  `;

  if (animateMap && map) {
    map.flyTo(s.coords, 15, { animate: true, duration: 1.0 });
  }
}

/* --------------------------------------------------------------------------
   5. INTERACTIVE SEARCH & LAYER CONTROLS
   -------------------------------------------------------------------------- */
function selectEntityById(idQuery) {
  const key = idQuery.toUpperCase();
  for (const [id, reg] of entityPatchRegistry.entries()) {
    if (id.includes(key) || (reg.data && reg.data.name && reg.data.name.toUpperCase().includes(key))) {
      if (reg.data && reg.data.cargo) {
        inspectConvoy(reg.data);
      } else if (reg.data && reg.data.days !== undefined) {
        inspectShelter(reg.data);
      } else {
        map.flyTo(reg.coords, 15);
        reg.marker.openPopup();
      }
      break;
    }
  }
}

function bindLayerControls() {
  document.getElementById('layer-floods')?.addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(floodLayerGroup) : map.removeLayer(floodLayerGroup);
  });
  document.getElementById('layer-debris')?.addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(debrisLayerGroup) : map.removeLayer(debrisLayerGroup);
  });
  document.getElementById('layer-bridges')?.addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(bridgeLayerGroup) : map.removeLayer(bridgeLayerGroup);
  });
  document.getElementById('layer-convoys')?.addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(convoyLayerGroup) : map.removeLayer(convoyLayerGroup);
  });
  document.getElementById('layer-shelters')?.addEventListener('change', (e) => {
    e.target.checked ? map.addLayer(shelterLayerGroup) : map.removeLayer(shelterLayerGroup);
  });
}

function getMockRoads() {
  return [{
    id: 'ROAD-C',
    name: 'Feeder Road C — Hillside Debris Slide',
    status: 'degraded',
    coordinates: [
      [27.7100, 85.3100],
      [27.7150, 85.3200],
      [27.7180, 85.3250]
    ],
    source: 'Field Driver Incident Report',
    reported: '14 min ago',
    confidence: '82%'
  }];
}

function getMockBridges() {
  return [{
    id: 'BRIDGE-B14',
    name: 'Bridge B-14 (Arterial Corridor)',
    status: 'impassable',
    coords: [27.7220, 85.3380],
    source: 'Control Room Inspection',
    reported: '8 min ago',
    confidence: '98%'
  }];
}

function getMockShelters() {
  return [
    { id: 'SHELTER-06', name: 'Shelter 06 (Community Center)', coords: [27.7280, 85.3450], days: 0.5, status: 'blocked', population: 450 },
    { id: 'SHELTER-02', name: 'Shelter 02 (Gymnasium)', coords: [27.7050, 85.3150], days: 2.1, status: 'caution', population: 820 }
  ];
}

function getMockMissions() {
  return [
    {
      id: 'CV-014',
      cargo: 'Refrigerated Insulin & Blood Bags',
      priority: 'CRITICAL',
      origin: 'Regional Logistics Hub A',
      destination: 'Shelter 06 (Sector 4)',
      route: 'Route B → Feeder C (Rerouted)',
      status: 'Rerouted',
      reroute_reason: 'Bridge B-14 marked hazardous due to 1.4m flood submersion.',
      eta: '1h 42m',
      eta_delta: '+38 min',
      coords: [27.7150, 85.3280],
      heading: 45
    },
    {
      id: 'CV-009',
      cargo: 'Infant Nutrition & Formula',
      priority: 'HIGH',
      origin: 'Logistics Hub B',
      destination: 'Shelter 02 (Sector 1)',
      route: 'Highway 1 Direct',
      status: 'On Route',
      reroute_reason: 'None. Optimal clear corridor.',
      eta: '45m',
      eta_delta: 'On Time',
      coords: [27.7080, 85.3180],
      heading: 120
    }
  ];
}

function getMockVehicles() {
  return [];
}
