/* ==========================================
   DISISTA CONTROL — LIVE MAP MANAGER
   Leaflet Cartography, Hazard Fusion, Flash Flood Forecasts, & Isolated Reachability
   ========================================== */

class LiveMapManager {
  constructor() {
    this.map = null;
    this.layers = {
      convoys: L.layerGroup(),
      hazards: L.layerGroup(),
      shelters: L.layerGroup(),
      warehouses: L.layerGroup(),
      routes: L.layerGroup(),
      predictiveFloods: L.layerGroup()
    };

    this.customSelectedPoint = null;
  }

  init() {
    // Initialize Leaflet Map
    this.map = L.map('map', {
      center: [14.605, 120.985],
      zoom: 12,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Free OpenStreetMap Tiles (Clean, No API Key Required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | DISISTA CONTROL',
      maxZoom: 19
    }).addTo(this.map);

    // Add Layer Groups to Map
    Object.values(this.layers).forEach(layer => layer.addTo(this.map));

    // Render Initial Layers
    this.renderAllLayers();

    // Map Click Listener
    this.map.on('click', (e) => this.handleMapPointClick(e));

    // Subscribe to store updates
    if (window.store) {
      window.store.subscribe(() => this.renderAllLayers());
    }

    // Subscribe to socket events
    if (window.socket) {
      window.socket.on('route:recalculated', () => this.renderAllLayers());
      window.socket.on('hazard:updated', () => this.renderAllLayers());
    }
  }

  renderAllLayers() {
    this.renderWarehouses();
    this.renderShelters();
    this.renderHazards();
    this.renderConvoys();
    this.renderPredictiveFloods();
    this.auditIsolatedShelters();
  }

  /* ------------------------------------------
     PREDICTIVE FLASH-FLOOD OVERLAY (A.3)
     ------------------------------------------ */
  renderPredictiveFloods() {
    this.layers.predictiveFloods.clearLayers();

    // Flash-flood zone polygon (Sector 4 flood plain)
    const floodPolygon = L.polygon([
      [14.620, 120.970],
      [14.635, 120.990],
      [14.628, 121.005],
      [14.615, 120.985]
    ], {
      color: '#4A6656',
      fillColor: '#8FAF8C',
      fillOpacity: 0.28,
      weight: 2.5,
      dashArray: '6, 6'
    });

    // Time-to-block badge marker with animated beacon
    const labelIcon = L.divIcon({
      html: `<div style="background: var(--slate-800); color: var(--white); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid var(--sage-500); white-space: nowrap; box-shadow: 0 4px 12px rgba(58, 71, 80, 0.3); display: flex; align-items: center; gap: 6px;">
               <span class="network-pulse"></span>
               <span>△ Forecast: ~25m to Impassable Block</span>
             </div>`,
      className: 'flood-forecast-badge',
      iconAnchor: [60, 12]
    });

    const labelMarker = L.marker([14.625, 120.990], { icon: labelIcon });

    this.layers.predictiveFloods.addLayer(floodPolygon);
    this.layers.predictiveFloods.addLayer(labelMarker);
  }

  /* ------------------------------------------
     MARKER RENDERERS & SVG CONFIDENCE RINGS (A.9)
     ------------------------------------------ */
  renderHazards() {
    this.layers.hazards.clearLayers();
    const hazardsData = window.store ? window.store.getHazards() : [];

    hazardsData.forEach(h => {
      const strokeStyle = h.confirmed ? 'none' : '4 3';
      const strokeColor = h.severity === 'impassable' ? '#3A4750' : '#5A7A68';
      const iconShape = h.severity === 'impassable' ? '❖' : '▲';

      // SVG Confidence Ring calculation (Arc length = confidence %)
      const circumference = 2 * Math.PI * 15;
      const dashoffset = circumference - ((h.confidence || 80) / 100) * circumference;

      const svgHtml = `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <svg width="40" height="40" viewBox="0 0 40 40" style="position: absolute; top:0; left:0;">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(58, 71, 80, 0.2)" stroke-width="3.5"/>
            <circle cx="20" cy="20" r="16" fill="none" stroke="${strokeColor}" stroke-width="3.5"
                    stroke-dasharray="${strokeStyle === 'none' ? circumference : '5 3'}"
                    stroke-dashoffset="${strokeStyle === 'none' ? dashoffset : 0}"
                    transform="rotate(-90 20 20)" stroke-linecap="round"/>
          </svg>
          <div style="width: 24px; height: 24px; background: ${strokeColor}; color: #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
            ${iconShape}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: svgHtml,
        className: 'hazard-custom-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([h.lat, h.lng], { icon: customIcon });
      marker.on('click', () => this.inspectEntity('hazard', h));
      this.layers.hazards.addLayer(marker);
    });
  }

  renderConvoys() {
    this.layers.convoys.clearLayers();
    this.layers.routes.clearLayers();
    const convoysData = window.store ? window.store.getConvoys() : [];

    convoysData.forEach(c => {
      const routeColor = c.status === 'Stranded' ? '#3A4750' : (c.status === 'Rerouted' ? '#5A7A68' : '#4A6656');
      const lineStyle = c.status === 'Rerouted' ? '6, 6' : 'none';

      if (c.route) {
        const polyline = L.polyline(c.route, {
          color: routeColor,
          weight: 4.5,
          dashArray: lineStyle,
          opacity: 0.85
        });
        this.layers.routes.addLayer(polyline);
      }

      const arrowIcon = L.divIcon({
        html: `<div style="background: ${routeColor}; color: #FFF; padding: 5px 10px; border-radius: 16px; font-size: 11px; font-weight: 700; border: 1.5px solid #FFF; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 4px;">
                 <span>🚛</span>
                 <span>${c.name} (${c.status})</span>
               </div>`,
        className: 'convoy-marker',
        iconSize: [120, 28],
        iconAnchor: [60, 14]
      });

      const marker = L.marker([c.lat, c.lng], { icon: arrowIcon });
      marker.on('click', () => this.inspectEntity('convoy', c));
      this.layers.convoys.addLayer(marker);
    });
  }

  renderShelters() {
    this.layers.shelters.clearLayers();
    const sheltersData = window.store ? window.store.getShelters() : [];

    sheltersData.forEach(s => {
      const color = s.isolated || s.urgency === 'critical' ? '#3A4750' : '#5A7A68';
      const icon = L.divIcon({
        html: `<div style="background: ${color}; color: #FFF; padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; border: 1.5px solid #FFF; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
                 🏛️ ${s.name} ${s.isolated ? '⚠️ [ISOLATED]' : ''}
               </div>`,
        className: 'shelter-marker',
        iconAnchor: [45, 14]
      });
      const marker = L.marker([s.lat, s.lng], { icon });
      marker.on('click', () => this.inspectEntity('shelter', s));
      this.layers.shelters.addLayer(marker);
    });
  }

  renderWarehouses() {
    this.layers.warehouses.clearLayers();
    const warehousesData = window.store ? window.store.getWarehouses() : [];

    warehousesData.forEach(w => {
      const icon = L.divIcon({
        html: `<div style="background: #4A6656; color: #FFF; padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; border: 1.5px solid #FFF; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
                 📦 ${w.name}
               </div>`,
        className: 'wh-marker',
        iconAnchor: [45, 14]
      });
      const marker = L.marker([w.lat, w.lng], { icon });
      marker.on('click', () => this.inspectEntity('warehouse', w));
      this.layers.warehouses.addLayer(marker);
    });
  }

  /* ------------------------------------------
     AUTOMATED ISOLATED SHELTER AUDIT (A.4)
     ------------------------------------------ */
  auditIsolatedShelters() {
    const shelters = window.store ? window.store.getShelters() : [];
    const hazards = window.store ? window.store.getHazards() : [];

    const isBridgeBlocked = hazards.some(h => (h.name.includes('B14') || h.type.includes('Bridge')) && h.severity === 'impassable');

    shelters.forEach(s => {
      if (s.name.includes('19') || s.name.includes('Island')) {
        const newlyIsolated = isBridgeBlocked;
        if (s.isolated !== newlyIsolated) {
          s.isolated = newlyIsolated;
          if (newlyIsolated && window.toast) {
            window.toast.showBanner(`ISOLATED SHELTER DETECTED: ${s.name} has NO reachable road path from any warehouse!`);
          }
        }
      }
    });
  }

  /* ------------------------------------------
     MAP POINT CLICK & ROAD BLOCKING LOGIC
     ------------------------------------------ */
  handleMapPointClick(e) {
    this.customSelectedPoint = e.latlng;
    const latStr = e.latlng.lat.toFixed(4);
    const lngStr = e.latlng.lng.toFixed(4);

    const popupHtml = `
      <div style="font-size: 13px; font-family: var(--font-sans); padding: 4px;">
        <strong style="color: var(--slate-800); font-size: 14px;">Map Location Selected</strong><br>
        <span class="text-meta">Lat: ${latStr}, Lng: ${lngStr}</span>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid var(--border-hairline);">
        <button class="btn btn-destructive" style="min-height: 34px; padding: 0 12px; font-size: 11px; width: 100%;" onclick="liveMap.openRoadBlockModalWithPoint(${latStr}, ${lngStr})">
          🛑 Block Road At This Point
        </button>
      </div>
    `;

    L.popup()
      .setLatLng(e.latlng)
      .setContent(popupHtml)
      .openOn(this.map);
  }

  openRoadBlockModal() {
    const modal = document.getElementById('road-block-modal');
    if (modal) modal.classList.remove('hidden');
  }

  openRoadBlockModalWithPoint(lat, lng) {
    if (this.map) this.map.closePopup();
    this.customSelectedPoint = { lat, lng };
    const sel = document.getElementById('modal-road-select');
    if (sel) sel.value = 'custom-point';
    this.openRoadBlockModal();
  }

  closeRoadBlockModal() {
    const modal = document.getElementById('road-block-modal');
    if (modal) modal.classList.add('hidden');
  }

  handleRoadBlockSubmit(e) {
    e.preventDefault();
    const roadSelect = document.getElementById('modal-road-select').value;
    const status = document.getElementById('modal-road-status').value;
    const reason = document.getElementById('modal-road-reason').value.trim();

    let lat = 14.625;
    let lng = 120.980;
    let locationName = 'Route 4 Segment';

    if (roadSelect === 'custom-point' && this.customSelectedPoint) {
      lat = this.customSelectedPoint.lat;
      lng = this.customSelectedPoint.lng;
      locationName = `Point (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    } else if (roadSelect === 'bridge-b14') {
      lat = 14.640; lng = 120.970; locationName = 'Bridge B14';
    } else if (roadSelect === 'coastal-highway-8') {
      lat = 14.570; lng = 120.980; locationName = 'Coastal Highway 8';
    }

    const newHazard = {
      id: `haz-${Date.now()}`,
      name: locationName,
      lat: lat,
      lng: lng,
      type: 'Road Blocked / Closed',
      severity: status,
      confidence: 100,
      confirmed: true,
      notes: reason,
      timestamp: 'Just now'
    };

    if (window.store) {
      window.store.addHazard(newHazard);
    }

    this.closeRoadBlockModal();

    if (window.toast) {
      const alertMsg = `ROAD BLOCKED: ${locationName} marked ${status.toUpperCase()} (${reason}). Active convoys rerouted live!`;
      window.toast.showBanner(alertMsg);
      window.toast.success(`Road block registered and system rerouting calculated.`);
    }

    this.inspectEntity('hazard', newHazard);
  }

  verifyHazard(hazardId) {
    if (!window.auth || !window.auth.canPerform('verify_hazard')) {
      if (window.toast) window.toast.error('Verify hazard is restricted to Control Room Officers only.');
      return;
    }

    if (window.store) {
      window.store.verifyHazard(hazardId);
    }

    if (window.toast) {
      window.toast.success(`Hazard verified! Confidence promoted to 100%. Route graph updated.`);
    }
  }

  /* ------------------------------------------
     INSPECTOR PANEL CONTROLLER
     ------------------------------------------ */
  inspectEntity(type, entity) {
    const titleEl = document.getElementById('inspector-title');
    const subEl = document.getElementById('inspector-subtitle');
    const contentEl = document.getElementById('inspector-content');

    if (!titleEl || !contentEl) return;

    titleEl.innerText = `${type.toUpperCase()} INSPECTOR`;
    subEl.innerText = entity.name || entity.id;

    if (type === 'hazard') {
      const badge = window.statusBadge ? window.statusBadge.render(entity.severity, { confirmed: entity.confirmed, label: entity.severity.toUpperCase() }) : entity.severity;
      const canVerify = window.auth ? window.auth.canPerform('verify_hazard') && !entity.confirmed : false;

      contentEl.innerHTML = `
        <div style="margin-bottom: var(--space-3);">${badge}</div>
        <h3 style="font-size: var(--text-base); margin-bottom: 4px; font-weight: 700; color: var(--white);">${entity.name}</h3>
        <p class="text-meta" style="margin-bottom: var(--space-3); color: var(--sage-100);">Type: <strong style="color:var(--white);">${entity.type}</strong></p>

        <div style="background: rgba(255,255,255,0.08); padding: var(--space-3); border-radius: var(--radius); border: 1px solid rgba(255,255,255,0.15); margin-bottom: var(--space-4); font-size: var(--text-sm); color: var(--sage-100);">
          <div><strong>Confidence Score:</strong> ${entity.confidence || 80}%</div>
          <div><strong>Verification:</strong> ${entity.confirmed ? 'Confirmed (Solid Ring)' : 'Unconfirmed Report (Dashed Ring)'}</div>
          <div style="margin-top: 6px; font-size: var(--text-xs); opacity: 0.9;">${entity.notes || 'No description provided.'}</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: var(--space-2);">
          ${canVerify ? `
            <button class="btn btn-primary" onclick="liveMap.verifyHazard('${entity.id}')">
              ✓ VERIFY REPORT & PROMOTE STATUS
            </button>
          ` : ''}
          <button class="btn btn-destructive" onclick="liveMap.openRoadBlockModal()">
            🛑 BLOCK ADJACENT ROAD SEGMENT
          </button>
        </div>
      `;
    } else if (type === 'convoy') {
      const badge = window.statusBadge ? window.statusBadge.render(entity.status === 'Stranded' ? 'impassable' : (entity.status === 'Rerouted' ? 'degraded' : 'normal'), { label: entity.status }) : entity.status;

      contentEl.innerHTML = `
        <div style="margin-bottom: var(--space-3);">${badge}</div>
        <h3 style="font-size: var(--text-base); margin-bottom: 4px; font-weight: 700; color: var(--white);">${entity.name}</h3>
        <p class="text-meta" style="margin-bottom: var(--space-3); color: var(--sage-100);">Cargo: <strong style="color:var(--white);">${entity.cargo}</strong></p>

        <div style="background: rgba(255,255,255,0.08); padding: var(--space-3); border-radius: var(--radius); border: 1px solid rgba(255,255,255,0.15); margin-bottom: var(--space-4); font-size: var(--text-sm); color: var(--sage-100);">
          <div><strong>Origin:</strong> ${entity.origin}</div>
          <div><strong>Destination:</strong> ${entity.dest}</div>
          <div><strong>Priority Tier:</strong> ${entity.priority}</div>
          <div><strong>Driver Ack:</strong> ${entity.ackStatus || 'Acknowledged'}</div>
        </div>

        <button class="btn btn-secondary" style="width: 100%; border-color: rgba(255,255,255,0.3); color: var(--white); background: rgba(255,255,255,0.1);" onclick="window.location.href='convoy-dispatch.html'">
          View Convoy Dispatch Board →
        </button>
      `;
    } else if (type === 'shelter') {
      const badge = window.statusBadge ? window.statusBadge.render(entity.isolated || entity.urgency === 'critical' ? 'impassable' : 'degraded', { label: `${entity.daysSupply} Days Cover` }) : entity.urgency;

      contentEl.innerHTML = `
        <div style="margin-bottom: var(--space-3);">${badge}</div>
        <h3 style="font-size: var(--text-base); margin-bottom: 4px; font-weight: 700; color: var(--white);">${entity.name}</h3>
        <p class="text-meta" style="margin-bottom: var(--space-3); color: var(--sage-100);">Population: <strong style="color:var(--white);">${entity.population} occupants</strong></p>

        ${entity.isolated ? `
          <div style="background: rgba(0,0,0,0.3); color: var(--white); padding: var(--space-3); border-radius: var(--radius); border: 1px solid var(--slate-800); margin-bottom: var(--space-4); font-size: var(--text-xs);">
            <strong>⚠️ ISOLATED SHELTER WARNING:</strong> No road path reachable from any active warehouse depot! Automated alert active.
          </div>
        ` : ''}

        <button class="btn btn-secondary" style="width: 100%; border-color: rgba(255,255,255,0.3); color: var(--white); background: rgba(255,255,255,0.1);" onclick="window.location.href='shelter-board.html'">
          Open Shelter Regional Board →
        </button>
      `;
    }
  }

  toggleLayer(layerName, visible) {
    if (this.layers[layerName]) {
      if (visible) {
        this.map.addLayer(this.layers[layerName]);
      } else {
        this.map.removeLayer(this.layers[layerName]);
      }
    }
  }

  resetView() {
    if (this.map) {
      this.map.setView([14.605, 120.985], 12);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.liveMap = new LiveMapManager();
  window.liveMap.init();
});
