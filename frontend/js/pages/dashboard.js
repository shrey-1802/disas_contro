/**
 * Dashboard Overview Controller — Dynamic Role-Specific Operational Orientation
 * Relief Supply Chain Resilience & Rerouting System
 */

import { renderGlobalShell } from '../navbar.js';
import { auth, ROLES } from '../auth.js';
import { api } from '../api.js';
import { socketService } from '../socket.js';
import { renderStatusBadge } from '../statusBadge.js';

document.addEventListener('DOMContentLoaded', async () => {
  renderGlobalShell('dashboard.html');
  const role = auth.getRole();
  const user = auth.getUser();

  const titleElem = document.getElementById('dashboard-title');
  const subtitleElem = document.getElementById('dashboard-subtitle');
  const viewportElem = document.getElementById('dashboard-role-viewport');

  if (titleElem) {
    titleElem.textContent = `${role} — Operational Orientation`;
  }

  // Load telemetry data from API endpoints
  let roads = [], shelters = [], missions = [], alerts = [];
  try {
    [roads, shelters, missions, alerts] = await Promise.all([
      api.getRoads().catch(() => getMockRoads()),
      api.getShelters().catch(() => getMockShelters()),
      api.getMissions().catch(() => getMockMissions()),
      api.getAlerts().catch(() => getMockAlerts())
    ]);
  } catch (err) {
    console.warn('[Dashboard] API fetch fallback notice:', err.message);
  }

  // Render role-tailored interface
  switch (role) {
    case ROLES.CONTROL_ROOM:
      renderControlRoomView(viewportElem, { roads, shelters, missions, alerts }, subtitleElem);
      break;

    case ROLES.DISTRICT_ADMIN:
      renderDistrictAdminView(viewportElem, { roads, shelters, missions, alerts }, subtitleElem);
      break;

    case ROLES.FIELD_DRIVER:
      renderFieldDriverView(viewportElem, { roads, shelters, missions, alerts, user }, subtitleElem);
      break;

    default:
      renderControlRoomView(viewportElem, { roads, shelters, missions, alerts }, subtitleElem);
  }

  // Subscribe to real-time updates
  socketService.subscribe('mission_update', (updatedMission) => {
    const idx = missions.findIndex(m => m.id === updatedMission.id);
    if (idx !== -1) missions[idx] = updatedMission;
  });
});

/* --------------------------------------------------------------------------
   1. CONTROL ROOM OPERATOR DASHBOARD
   -------------------------------------------------------------------------- */
function renderControlRoomView(container, data, subtitleElem) {
  if (subtitleElem) {
    subtitleElem.textContent = 'Command Center Surface: Real-time network situational awareness, active convoy reroutes, and hazard corridors.';
  }

  const activeMissions = data.missions.filter(m => m.status !== 'Delivered');
  const reroutedMissions = data.missions.filter(m => m.status === 'Rerouted' || m.status === 'Stranded');
  const blockedRoads = data.roads.filter(r => r.status === 'blocked' || r.status === 'impassable' || r.status === 'hazardous');
  const criticalAlerts = data.alerts.filter(a => a.severity === 'critical');

  container.innerHTML = `
    <!-- Critical Alert Banner -->
    ${criticalAlerts.length > 0 ? `
      <div class="critical-banner">
        <div class="critical-banner__content">
          <span class="critical-banner__badge">CRITICAL</span>
          <span>${criticalAlerts[0].message || 'Bridge B-14 submerged in Sector 6. 2 convoys rerouted.'}</span>
        </div>
        <a href="alerts.html" class="button button--secondary text-xs" style="color:#FFF; border-color:#FFF;">View All (${criticalAlerts.length}) Alerts</a>
      </div>
    ` : ''}

    <!-- Operational Metrics -->
    <section style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-md);">
      <div class="card card--warning">
        <div class="card__header">
          <span class="text-sm font-semibold">Active Relief Convoys</span>
          <span>🚛</span>
        </div>
        <div style="font-size:32px; font-weight:700; color:var(--slate-900);">${activeMissions.length}</div>
        <p class="text-xs" style="margin:0; color:var(--forest-800);">${reroutedMissions.length} convoys currently rerouted</p>
      </div>

      <div class="card">
        <div class="card__header">
          <span class="text-sm font-semibold">Monitored Shelters</span>
          <span>🏠</span>
        </div>
        <div style="font-size:32px; font-weight:700; color:var(--slate-900);">${data.shelters.length}</div>
        <p class="text-xs" style="margin:0; color:var(--slate-600);">Shelter 06 medical reserve &lt; 12h</p>
      </div>

      <div class="card card--critical">
        <div class="card__header">
          <span class="text-sm font-semibold">Blocked Corridors</span>
          <span>🛑</span>
        </div>
        <div style="font-size:32px; font-weight:700; color:var(--slate-900);">${blockedRoads.length}</div>
        <p class="text-xs" style="margin:0; color:var(--slate-900);">Active hazards in Sector 4 & Sector 6</p>
      </div>

      <div class="card">
        <div class="card__header">
          <span class="text-sm font-semibold">Critical Alerts</span>
          <span>🚨</span>
        </div>
        <div style="font-size:32px; font-weight:700; color:var(--slate-900);">${criticalAlerts.length}</div>
        <p class="text-xs" style="margin:0; color:var(--slate-600);">Requires operator acknowledgment</p>
      </div>
    </section>

    <!-- Priority Dispatch Table & Quick Command Grid -->
    <section style="display:grid; grid-template-columns: 2fr 1fr; gap: var(--space-lg);">
      <div class="card">
        <div class="card__header">
          <h2 class="card__title">Priority Mission Dispatch Queue</h2>
          <a href="convoy-dispatch.html" class="button button--secondary text-xs">Dispatch Surface</a>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Convoy ID</th>
                <th>Cargo Type</th>
                <th>Priority</th>
                <th>Destination</th>
                <th>Route Status</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              ${data.missions.slice(0, 4).map(m => `
                <tr>
                  <td class="font-semibold text-mono">${m.convoy_id || m.id}</td>
                  <td>${m.cargo || 'Medical Supplies'}</td>
                  <td><span class="priority-badge ${m.priority === 1 || m.priority === 'CRITICAL' ? 'priority-badge--critical' : 'priority-badge--high'}">${m.priority_label || 'CRITICAL'}</span></td>
                  <td>${m.destination || 'Shelter 06'}</td>
                  <td>${renderStatusBadge(m.status)}</td>
                  <td>${m.eta || '1h 42m'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card__header">
          <h2 class="card__title">Control Operations</h2>
        </div>
        <div style="display:flex; flex-direction:column; gap:var(--space-sm);">
          <a href="live-map.html" class="button button--primary" style="justify-content:flex-start;">🗺️ Live Map & Hazard Layers</a>
          <a href="convoy-dispatch.html" class="button button--secondary" style="justify-content:flex-start;">🚛 Convoy Dispatch & Tracking</a>
          <a href="shelter-board.html" class="button button--secondary" style="justify-content:flex-start;">🏠 Shelter Demand Board</a>
          <a href="hazard-log.html" class="button button--secondary" style="justify-content:flex-start;">⚠️ Incident Verification Feed</a>
          <a href="alerts.html" class="button button--critical" style="justify-content:flex-start;">🚨 Operational Alerts Inbox</a>
        </div>
      </div>
    </section>
  `;
}

/* --------------------------------------------------------------------------
   2. DISTRICT ADMIN DASHBOARD
   -------------------------------------------------------------------------- */
function renderDistrictAdminView(container, data, subtitleElem) {
  if (subtitleElem) {
    subtitleElem.textContent = 'District Disaster Operations Surface: Shelter demand forecasting, supply shortages, and regional logistics.';
  }

  container.innerHTML = `
    <!-- Shelter Supply Urgency Grid -->
    <section>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-md);">
        <h2 style="margin:0;">District Shelter Urgency Matrix</h2>
        <a href="shelter-board.html" class="button button--secondary text-xs">Full Shelter Board</a>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-lg);">
        ${data.shelters.map(s => `
          <div class="card ${s.days_remaining < 1 ? 'card--critical' : 'card--warning'}">
            <div class="card__header">
              <div>
                <h3 class="card__title">${s.name || 'Shelter'}</h3>
                <span class="text-xs" style="color:var(--slate-600);">${s.region || 'District Sector'}</span>
              </div>
              ${renderStatusBadge(s.days_remaining < 1 ? 'blocked' : 'caution', s.days_remaining < 1 ? 'ISOLATED' : 'DEGRADED')}
            </div>
            <div style="margin:var(--space-sm) 0; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Population</div>
                <div style="font-size:24px; font-weight:700;">${s.population || 450} evacuees</div>
              </div>
              <div style="text-align:right;">
                <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Insulin Supply</div>
                <div style="font-size:24px; font-weight:700; color:var(--slate-900);">${s.days_remaining || '0.5'} Days</div>
              </div>
            </div>
            <div class="alert alert--warning" style="padding:var(--space-xs) var(--space-sm); font-size:var(--font-size-xs);">
              <span>🚛 Incoming Convoy CV-014 ETA 1h 42m</span>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/* --------------------------------------------------------------------------
   3. FIELD CONVOY DRIVER DASHBOARD
   -------------------------------------------------------------------------- */
function renderFieldDriverView(container, data, subtitleElem) {
  if (subtitleElem) {
    subtitleElem.textContent = 'Field Driver Surface: Current mission routing, road hazard updates ahead, and incident reporting.';
  }

  const activeMission = data.missions[0] || {
    convoy_id: 'CV-014',
    cargo: 'Refrigerated Insulin & Blood Bags',
    origin: 'Regional Hub A',
    destination: 'Shelter 06 (Sector 4)',
    status: 'Rerouted',
    eta: '1h 42m (+38m delay)'
  };

  container.innerHTML = `
    <!-- Active Mission Card -->
    <div class="card card--critical">
      <div class="card__header">
        <div>
          <span class="priority-badge priority-badge--critical">ASSIGNED ACTIVE MISSION</span>
          <h2 class="card__title" style="font-size:var(--font-size-xl); margin-top:4px;">Convoy ${activeMission.convoy_id || 'CV-014'}</h2>
        </div>
        ${renderStatusBadge(activeMission.status)}
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:var(--space-md); margin:var(--space-md) 0;">
        <div>
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Cargo Type</div>
          <div class="font-semibold text-md">${activeMission.cargo}</div>
        </div>
        <div>
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Route Origin</div>
          <div class="font-semibold text-md">${activeMission.origin || 'Logistics Hub A'}</div>
        </div>
        <div>
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Target Destination</div>
          <div class="font-semibold text-md">${activeMission.destination || 'Shelter 06'}</div>
        </div>
        <div>
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Current ETA</div>
          <div class="font-semibold text-md" style="color:var(--slate-900);">${activeMission.eta}</div>
        </div>
      </div>
      <div class="alert alert--critical" style="margin-top:var(--space-sm);">
        <span>🛑 Route Recalculation Notice: Bridge B-14 marked impassable due to 1.4m water depth. Rerouted via Feeder Road C.</span>
      </div>
    </div>

    <!-- Quick Actions & Hazards Ahead -->
    <section style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-lg);">
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">Hazards Ahead on Active Corridor</h3>
        </div>
        <div style="display:flex; flex-direction:column; gap:var(--space-sm);">
          <div class="alert alert--warning text-xs">
            <span>▲ Debris Accumulation reported 3.2km ahead on Feeder Road C (Passable with caution).</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card__header">
          <h3 class="card__title">Field Actions</h3>
        </div>
        <div style="display:flex; flex-direction:column; gap:var(--space-sm);">
          <a href="hazard-log.html" class="button button--primary" style="justify-content:flex-start;">⚠️ Report Field Hazard Incident</a>
          <a href="live-map.html" class="button button--secondary" style="justify-content:flex-start;">🗺️ View Route Navigation Map</a>
        </div>
      </div>
    </section>
  `;
}

// Fallback Mock Data Providers
function getMockRoads() {
  return [
    { id: 'r1', name: 'Route B', status: 'blocked' },
    { id: 'r2', name: 'Feeder Road C', status: 'degraded' }
  ];
}

function getMockShelters() {
  return [
    { id: 's1', name: 'Shelter 06', region: 'Sector 4', days_remaining: 0.5, population: 450 },
    { id: 's2', name: 'Shelter 02', region: 'Sector 1', days_remaining: 2.1, population: 820 }
  ];
}

function getMockMissions() {
  return [
    { id: 'm1', convoy_id: 'CV-014', cargo: 'Insulin & Blood Bags', priority: 1, priority_label: 'CRITICAL', status: 'Rerouted', eta: '1h 42m' },
    { id: 'm2', convoy_id: 'CV-009', cargo: 'Infant Nutrition', priority: 2, priority_label: 'HIGH', status: 'On Route', eta: '45m' }
  ];
}

function getMockAlerts() {
  return [
    { id: 'a1', severity: 'critical', message: 'Bridge B-14 submerged in Sector 6. 2 convoys rerouted.' }
  ];
}
