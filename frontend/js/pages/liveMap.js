/**
 * Live Situational Map Controller — Real-Time Patch Stream Engine
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

  // Load initial telemetry data from API endpoints
  let roads = [], bridges = [], shelters = [], missions = [];
  try {
    [roads, bridges, shelters, missions] = await Promise.all([
      api.getRoads().catch(() => getMockRoads()),
      api.getBridges().catch(() => getMockBridges()),
      api.getShelters().catch(() => getMockShelters()),
      api.getMissions().catch(() => getMockMissions())
    ]);
  } catch (e) {
    console.warn('[LiveMap] API loading notice:', e.message);
  }

  // Render Map Overlays
  renderFloodOverlays();
  renderDebrisCorridors(roads);
  renderBridgeMarkers(bridges);
  renderShelterMarkers(shelters);
  renderConvoyMarkers(missions);

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

  // Subscribe to Real-Time Socket.io Patch Stream (Flicker-Free Object Updates)
  socketService.subscribe('mission_update', (data) => patchConvoyObject(data));
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
  const debrisPolyline = [
    [27.7100, 85.3100],
    [27.7150, 85.3200],
    [27.7180, 85.3250]
  ];

  const line = L.polyline(debrisPolyline, {
    color: '#3A4750',
    weight: 5,
    dashArray: '8, 8',
    opacity: 0.85
  }).addTo(debrisLayerGroup);

  entityPatchRegistry.set('ROAD-C', { layer: line, type: 'road' });

  line.bindPopup(`
    <div style="font-family:var(--font-sans); padding:4px;">
      <div style="font-weight:700; font-size:14px;">Feeder Road C — Hillside Debris Slide</div>
      <div style="margin:4px 0;">${renderStatusBadge('degraded', 'CAUTION — DEBRIS')}</div>
      <div class="text-xs" style="color:var(--slate-600);">Source: <strong>Field Driver Incident Report</strong></div>
      <div class="text-xs" style="color:var(--slate-600);">Reported: <strong>14 min ago</strong> | Confidence: <strong>82%</strong></div>
    </div>
  `);
}

function renderBridgeMarkers(bridges) {
  const bridgeCoords = [27.7220, 85.3380];

  const octagonIcon = L.divIcon({
    className: 'custom-convoy-marker',
    html: `<div class="bridge-octagon-icon" id="bridge-icon-B14" title="Unsafe Bridge B-14">🛑</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const marker = L.marker(bridgeCoords, { icon: octagonIcon }).addTo(bridgeLayerGroup);
  entityPatchRegistry.set('BRIDGE-B14', { marker, coords: bridgeCoords, type: 'bridge', status: 'impassable' });

  marker.bindPopup(`
    <div style="font-family:var(--font-sans); padding:4px;">
      <div style="font-weight:700; font-size:14px; color:var(--slate-800);">Bridge B-14 (Arterial Corridor)</div>
      <div style="margin:4px 0;" id="popup-bridge-B14-status">${renderStatusBadge('impassable', '🛑 STRUCTURALLY UNSAFE')}</div>
      <div class="text-xs" style="color:var(--slate-600);">Source: <strong>Control Room Inspection</strong></div>
      <div class="text-xs" style="color:var(--slate-600);">Reported: <strong>8 min ago</strong> | Confidence: <strong>98%</strong></div>
    </div>
  `);
}

function renderShelterMarkers(shelters) {
  const sheltersData = [
    { id: 'SHELTER-06', name: 'Shelter 06 (Community Center)', coords: [27.7280, 85.3450], days: 0.5, status: 'blocked', population: 450 },
    { id: 'SHELTER-02', name: 'Shelter 02 (Gymnasium)', coords: [27.7050, 85.3150], days: 2.1, status: 'caution', population: 820 }
  ];

  sheltersData.forEach(s => {
    const homeIcon = L.divIcon({
      className: 'custom-convoy-marker',
      html: `<div class="shelter-home-icon" title="${s.name}">🏠</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker(s.coords, { icon: homeIcon }).addTo(shelterLayerGroup);
    entityPatchRegistry.set(s.id, { marker, coords: s.coords, data: s, type: 'shelter' });

    marker.on('click', () => inspectShelter(s));
  });
}

function renderConvoyMarkers(missions) {
  const convoysData = [
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

  convoysData.forEach(c => {
    const arrowIcon = L.divIcon({
      className: 'custom-convoy-marker',
      html: `<div class="convoy-arrow-icon" id="convoy-icon-${c.id}" style="transform: rotate(${c.heading}deg);" title="Convoy ${c.id}">🧭</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker(c.coords, { icon: arrowIcon }).addTo(convoyLayerGroup);
    entityPatchRegistry.set(c.id, { marker, coords: c.coords, data: c, type: 'convoy' });

    marker.on('click', () => inspectConvoy(c));
  });
}

/* --------------------------------------------------------------------------
   3. INCREMENTAL PATCH STREAM HANDLERS (ZERO MAP FLICKER)
   -------------------------------------------------------------------------- */

function patchConvoyObject(missionData) {
  const convoyId = missionData.id || missionData.convoy_id || 'CV-014';
  const reg = entityPatchRegistry.get(convoyId);

  if (!reg) return;

  // Merge patch data
  Object.assign(reg.data, missionData);

  // 1. Smoothly update marker coordinates without tearing down layer
  if (missionData.coords) {
    reg.marker.setLatLng(missionData.coords);
    reg.coords = missionData.coords;
  }

  // 2. Rotate arrow marker if heading updated
  if (missionData.heading !== undefined) {
    const iconElem = document.getElementById(`convoy-icon-${convoyId}`);
    if (iconElem) {
      iconElem.style.transform = `rotate(${missionData.heading}deg)`;
    }
  }

  // 3. Update right inspection panel live if currently selected
  if (currentlyInspectedEntityId === convoyId) {
    inspectConvoy(reg.data, false); // false = do not re-trigger flyTo animation on patch
  }

  toast.show(`Live Update: Convoy ${convoyId} telemetry patched (${reg.data.status})`, 'safe', 2500);
}

function patchBridgeObject(bridgeData) {
  const bridgeId = bridgeData.id || 'BRIDGE-B14';
  const reg = entityPatchRegistry.get(bridgeId);

  if (!reg) return;

  if (bridgeData.status) {
    reg.status = bridgeData.status;
    const statusContainer = document.getElementById(`popup-bridge-B14-status`);
    if (statusContainer) {
      statusContainer.innerHTML = renderStatusBadge(bridgeData.status);
    }
  }

  toast.show(`Live Update: Bridge ${bridgeId} status patched`, 'warning', 2500);
}

function patchShelterObject(shelterData) {
  const shelterId = shelterData.id || 'SHELTER-06';
  const reg = entityPatchRegistry.get(shelterId);

  if (!reg) return;

  Object.assign(reg.data, shelterData);

  if (currentlyInspectedEntityId === shelterId) {
    inspectShelter(reg.data, false);
  }

  toast.show(`Live Update: Shelter ${shelterId} supply telemetry updated`, 'safe', 2500);
}

function patchRoadObject(roadData) {
  console.log('[LiveMap] Incremental road segment patch:', roadData);
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

  if (animateMap) {
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

  if (animateMap) {
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

function getMockRoads() { return []; }
function getMockBridges() { return []; }
function getMockShelters() { return []; }
function getMockMissions() { return []; }
