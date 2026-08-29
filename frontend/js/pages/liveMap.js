/* FRONTEND LIVE SITUATIONAL MAP PAGE CONTROLLER (Phase 4 & Phase 23) */
import { Navbar } from '../navbar.js';
import { ApiService, API_STATUS } from '../api.js';
import { Socket } from '../socket.js';
import { MapPerformanceManager } from '../mapPerformance.js';
import { createStatusBadge } from '../statusBadge.js';
import { formatRelativeTime, escapeHTML } from '../utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  Navbar.render('live-map');

  // Center map around typical regional emergency coordinates [27.7, 85.3]
  const map = L.map('map-canvas').setView([27.7172, 85.3240], 12);

  // Honeydew-styled OpenStreetMap tile layer or fallback
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors | NDMA Emergency Platform'
  }).addTo(map);

  const mapPerf = new MapPerformanceManager(map);

  // Sample data fallback if backend is offline / empty
  const mockMissions = [
    { id: 'convoy-14', cargoType: 'Insulin & Blood Bags', priority: 'Critical', status: 'Rerouted', driverName: 'Capt. Sharma', eta: '45 mins', oldPathName: 'Highway A1', newPathName: 'feeder link B-4', coordinates: [27.72, 85.31] },
    { id: 'convoy-08', cargoType: 'Potable Water', priority: 'Medium', status: 'On Route', driverName: 'Driver Singh', eta: '15 mins', oldPathName: null, newPathName: 'Arterial North', coordinates: [27.70, 85.33] }
  ];

  const mockShelters = [
    { id: 'shelter-1', name: 'Shelter Alpha (Stadium)', region: 'Sector 6', daysOfSupply: 1.5, population: 850, coordinates: [27.73, 85.34] },
    { id: 'shelter-2', name: 'Shelter Beta (School)', region: 'Sector 2', daysOfSupply: 4, population: 320, coordinates: [27.69, 85.30] }
  ];

  const mockHazards = [
    { id: 'haz-101', hazardType: 'Debris Flow', sourceType: 'Field Report', confidencePercent: 88, reportedAt: new Date(Date.now() - 360000).toISOString(), status: 'Caution', coordinates: [27.715, 85.315] },
    { id: 'haz-102', hazardType: 'Submerged Road', sourceType: 'Sensor', confidencePercent: 94, reportedAt: new Date(Date.now() - 720000).toISOString(), status: 'Blocked', coordinates: [27.725, 85.325] }
  ];

  function renderMapData(missions, shelters, hazards) {
    // Render Convoys
    missions.forEach(convoy => {
      const icon = L.divIcon({
        className: 'custom-convoy-icon',
        html: `<div style="background-color: var(--forest-600); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: var(--shadow-md);">🚚</div>`,
        iconSize: [28, 28]
      });

      const popupHtml = `
        <div class="hazard-popover">
          <div class="hazard-popover__title">Convoy: ${escapeHTML(convoy.id)}</div>
          <div class="hazard-popover__meta">
            <span>Cargo:</span><strong>${escapeHTML(convoy.cargoType)}</strong>
            <span>Status:</span><strong>${escapeHTML(convoy.status)}</strong>
            <span>ETA:</span><strong>${escapeHTML(convoy.eta)}</strong>
          </div>
        </div>
      `;

      mapPerf.updateMarker(convoy.id, convoy.coordinates, icon, popupHtml, () => {
        showConvoyDetails(convoy);
      });
    });

    // Render Shelters
    shelters.forEach(shelter => {
      const icon = L.divIcon({
        className: 'custom-shelter-icon',
        html: `<div style="background-color: var(--slate-800); color: white; width: 26px; height: 26px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px;">⛺</div>`,
        iconSize: [26, 26]
      });

      const popupHtml = `
        <div class="hazard-popover">
          <div class="hazard-popover__title">${escapeHTML(shelter.name)}</div>
          <div class="hazard-popover__meta">
            <span>Supply:</span><strong>${shelter.daysOfSupply} Days</strong>
            <span>Population:</span><strong>${shelter.population}</strong>
          </div>
        </div>
      `;

      mapPerf.updateMarker(shelter.id, shelter.coordinates, icon, popupHtml, () => {
        showShelterDetails(shelter);
      });
    });

    // Render Hazards
    hazards.forEach(haz => {
      const icon = L.divIcon({
        className: 'custom-hazard-icon',
        html: `<div style="background-color: var(--status-blocked-bg); color: var(--slate-900); width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid var(--slate-800);">⚠️</div>`,
        iconSize: [26, 26]
      });

      const popupHtml = `
        <div class="hazard-popover">
          <div class="hazard-popover__title">${escapeHTML(haz.hazardType)}</div>
          <div class="hazard-popover__meta">
            <span>Source:</span><strong>${escapeHTML(haz.sourceType)}</strong>
            <span>Reported:</span><strong>${formatRelativeTime(haz.reportedAt)}</strong>
            <span>Confidence:</span><strong>${haz.confidencePercent}%</strong>
          </div>
        </div>
      `;

      mapPerf.updateMarker(haz.id, haz.coordinates, icon, popupHtml);
    });
  }

  function showConvoyDetails(convoy) {
    const detailPanel = document.getElementById('detail-panel-content');
    detailPanel.innerHTML = `
      <h3 style="margin-bottom: var(--space-xs);">${escapeHTML(convoy.id)}</h3>
      <div style="margin-bottom: var(--space-sm);">
        <span class="status-badge ${convoy.status === 'Rerouted' ? 'status-badge--caution' : 'status-badge--safe'}">
          ${escapeHTML(convoy.status)}
        </span>
      </div>

      <div style="font-size: 0.9rem; display: flex; flex-direction: column; gap: 8px; margin-bottom: var(--space-md);">
        <div><strong>Cargo Priority:</strong> ${escapeHTML(convoy.priority)} (${escapeHTML(convoy.cargoType)})</div>
        <div><strong>Driver:</strong> ${escapeHTML(convoy.driverName)}</div>
        <div><strong>ETA:</strong> ${escapeHTML(convoy.eta)}</div>
      </div>

      ${convoy.status === 'Rerouted' ? `
        <div class="route-diff" style="margin-bottom: var(--space-md);">
          <strong>Route Recalculation Diff:</strong>
          <div>Original: <span class="route-diff__old">${escapeHTML(convoy.oldPathName || 'Highway Segment A')}</span></div>
          <div>New Route: <span class="route-diff__new">${escapeHTML(convoy.newPathName || 'Detour Via Sector 4')}</span></div>
        </div>
      ` : ''}

      <button class="button button--primary" style="width: 100%;">Contact Driver</button>
    `;
  }

  function showShelterDetails(shelter) {
    const detailPanel = document.getElementById('detail-panel-content');
    detailPanel.innerHTML = `
      <h3 style="margin-bottom: var(--space-xs);">${escapeHTML(shelter.name)}</h3>
      <div style="margin-bottom: var(--space-sm);">
        <span class="status-badge ${shelter.daysOfSupply <= 2 ? 'status-badge--blocked' : 'status-badge--safe'}">
          ${shelter.daysOfSupply <= 2 ? 'CRITICAL SHORTAGE' : 'ADEQUATE SUPPLY'}
        </span>
      </div>

      <div style="font-size: 0.9rem; display: flex; flex-direction: column; gap: 8px;">
        <div><strong>Population Served:</strong> ${shelter.population} individuals</div>
        <div><strong>Days of Supply Remaining:</strong> ${shelter.daysOfSupply} Days</div>
        <div><strong>Region:</strong> ${escapeHTML(shelter.region)}</div>
      </div>
    `;
  }

  // Load from API with Mock Fallback
  const [missionsRes, sheltersRes, reportsRes] = await Promise.all([
    ApiService.getMissions(),
    ApiService.getShelters(),
    ApiService.getReports()
  ]);

  const missions = (missionsRes.status === API_STATUS.SUCCESS && missionsRes.data.length) ? missionsRes.data : mockMissions;
  const shelters = (sheltersRes.status === API_STATUS.SUCCESS && sheltersRes.data.length) ? sheltersRes.data : mockShelters;
  const hazards = (reportsRes.status === API_STATUS.SUCCESS && reportsRes.data.length) ? reportsRes.data : mockHazards;

  renderMapData(missions, shelters, hazards);

  // Connect Socket for real-time incremental marker updates (Phase 23)
  Socket.init();
  Socket.on('mission:update', (updatedConvoy) => {
    mapPerf.updateMarker(updatedConvoy.id, updatedConvoy.coordinates);
  });
});
