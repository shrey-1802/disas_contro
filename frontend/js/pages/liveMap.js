/* ==========================================
   DISISTA CONTROL — LIVE MAP MANAGER
   Leaflet Cartography, Hazard Fusion, and Road Blocking
   ========================================== */

class LiveMapManager {
  constructor() {
    this.map = null;
    this.layers = {
      convoys: L.layerGroup(),
      hazards: L.layerGroup(),
      shelters: L.layerGroup(),
      warehouses: L.layerGroup(),
      routes: L.layerGroup()
    };

    // State
    this.hazardsData = [
      { id: 'haz-101', name: 'Route 4 Flash Flood', lat: 14.625, lng: 120.980, type: 'Flash Flood', severity: 'hazardous', confidence: 85, confirmed: false, notes: 'Water depth 1.2m across 400m stretch.' },
      { id: 'haz-102', name: 'Bridge B14 Submerged', lat: 14.640, lng: 120.970, type: 'Bridge Impassable', severity: 'impassable', confidence: 98, confirmed: true, notes: 'Bridge deck submerged. Structural failure risk.' }
    ];

    this.convoysData = [
      { id: 'convoy-14', name: 'Convoy 14', cargo: 'Insulin & Blood Products', priority: 'Insulin/Blood', origin: 'Hub Alpha', dest: 'Shelter 12', status: 'On Route', lat: 14.615, lng: 120.970, route: [[14.6095, 120.9742], [14.625, 120.980], [14.6495, 120.9642]] },
      { id: 'convoy-22', name: 'Convoy 22', cargo: 'Infant Nutrition & Water', priority: 'Infant Nutrition', origin: 'Hub Bravo', dest: 'Shelter 04', status: 'Rerouted', lat: 14.630, lng: 121.005, route: [[14.6395, 120.9942], [14.630, 121.005], [14.6295, 121.0242]] },
      { id: 'convoy-09', name: 'Convoy 09', cargo: 'General Relief Supplies', priority: 'General', origin: 'Hub Charlie', dest: 'Shelter 19', status: 'Stranded', lat: 14.570, lng: 120.980, route: [[14.5795, 121.0142], [14.570, 120.980], [14.5595, 120.9442]] }
    ];

    this.sheltersData = [
      { id: 'shelter-12', name: 'Shelter 12 (North Community)', lat: 14.6495, lng: 120.9642, pop: 1450, daysSupply: 1.5, urgency: 'critical', isolated: false },
      { id: 'shelter-04', name: 'Shelter 04 (Rift Valley High)', lat: 14.6295, lng: 121.0242, pop: 920, daysSupply: 3.2, urgency: 'caution', isolated: false },
      { id: 'shelter-19', name: 'Shelter 19 (Island Reach)', lat: 14.5595, lng: 120.9442, pop: 2100, daysSupply: 0.5, urgency: 'critical', isolated: true }
    ];

    this.warehousesData = [
      { id: 'wh-alpha', name: 'Hub Alpha (Central Depot)', lat: 14.6095, lng: 120.9742, available: 12000 },
      { id: 'wh-bravo', name: 'Hub Bravo (Northern Rift)', lat: 14.6395, lng: 120.9942, available: 4700 },
      { id: 'wh-charlie', name: 'Hub Charlie (Coastal Base)', lat: 14.5795, lng: 121.0142, available: 9000 }
    ];

    this.customSelectedPoint = null;
  }

  init() {
    // Initialize Map
    this.map = L.map('map', {
      center: [14.605, 120.985],
      zoom: 12,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // CartoDB Positron Basemap (Clean Honeydew compatible tiles)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; DISISTA CONTROL — Relief Intelligence',
      maxZoom: 18
    }).addTo(this.map);

    // Add Layer Groups to Map
    Object.values(this.layers).forEach(layer => layer.addTo(this.map));

    // Render Initial Map Markers
    this.renderAllLayers();

    // Map Click Listener (Point Selection for Road Blocking)
    this.map.on('click', (e) => this.handleMapPointClick(e));
  }

  renderAllLayers() {
    this.renderWarehouses();
    this.renderShelters();
    this.renderHazards();
    this.renderConvoys();
  }

  /* ------------------------------------------
     MARKER RENDERERS & SVG CONFIDENCE RINGS
     ------------------------------------------ */
  renderHazards() {
    this.layers.hazards.clearLayers();

    this.hazardsData.forEach(h => {
      // Create SVG Confidence Ring Marker
      const strokeStyle = h.confirmed ? 'solid' : 'dashed';
      const strokeColor = h.severity === 'impassable' ? '#3A4750' : '#5A7A68';
      const iconShape = h.severity === 'impassable' ? '❖' : '▲';

      const svgHtml = `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <svg width="36" height="36" viewBox="0 0 36 36" style="position: absolute; top:0; left:0;">
            <circle cx="18" cy="18" r="15" fill="none" stroke="${strokeColor}" stroke-width="3" stroke-dasharray="${strokeStyle === 'dashed' ? '4 3' : 'none'}" opacity="0.9"/>
          </svg>
          <div style="width: 22px; height: 22px; background: ${strokeColor}; color: #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold;">
            ${iconShape}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: svgHtml,
        className: 'hazard-custom-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([h.lat, h.lng], { icon: customIcon });
      marker.on('click', () => this.inspectEntity('hazard', h));
      this.layers.hazards.addLayer(marker);
    });
  }

  renderConvoys() {
    this.layers.convoys.clearLayers();
    this.layers.routes.clearLayers();

    this.convoysData.forEach(c => {
      // Render Route Polyline
      const routeColor = c.status === 'Stranded' ? '#3A4750' : (c.status === 'Rerouted' ? '#5A7A68' : '#8FAF8C');
      const lineStyle = c.status === 'Rerouted' ? '6, 6' : 'none';

      const polyline = L.polyline(c.route, {
        color: routeColor,
        weight: 4,
        dashArray: lineStyle,
        opacity: 0.8
      });
      this.layers.routes.addLayer(polyline);

      // Render Convoy Marker Arrow
      const arrowIcon = L.divIcon({
        html: `<div style="background: ${routeColor}; color: #FFF; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; border: 1px solid #FFF; white-space: nowrap;">
                 🚛 ${c.name} (${c.status})
               </div>`,
        className: 'convoy-marker',
        iconSize: [100, 24],
        iconAnchor: [50, 12]
      });

      const marker = L.marker([c.lat, c.lng], { icon: arrowIcon });
      marker.on('click', () => this.inspectEntity('convoy', c));
      this.layers.convoys.addLayer(marker);
    });
  }

  renderShelters() {
    this.layers.shelters.clearLayers();
    this.sheltersData.forEach(s => {
      const color = s.urgency === 'critical' ? '#3A4750' : '#5A7A68';
      const icon = L.divIcon({
        html: `<div style="background: ${color}; color: #FFF; padding: 4px 6px; border-radius: 6px; font-size: 11px; font-weight: bold; border: 1px solid #FFF;">
                 🏛️ ${s.name} ${s.isolated ? '⚠️ [ISOLATED]' : ''}
               </div>`,
        className: 'shelter-marker',
        iconAnchor: [40, 12]
      });
      const marker = L.marker([s.lat, s.lng], { icon });
      marker.on('click', () => this.inspectEntity('shelter', s));
      this.layers.shelters.addLayer(marker);
    });
  }

  renderWarehouses() {
    this.layers.warehouses.clearLayers();
    this.warehousesData.forEach(w => {
      const icon = L.divIcon({
        html: `<div style="background: #4A6656; color: #FFF; padding: 4px 6px; border-radius: 6px; font-size: 11px; font-weight: bold; border: 1px solid #FFF;">
                 📦 ${w.name}
               </div>`,
        className: 'wh-marker',
        iconAnchor: [40, 12]
      });
      const marker = L.marker([w.lat, w.lng], { icon });
      marker.on('click', () => this.inspectEntity('warehouse', w));
      this.layers.warehouses.addLayer(marker);
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
      <div style="font-size: 13px; font-family: var(--font-sans);">
        <strong>Map Location Selected</strong><br>
        <span class="text-meta">Lat: ${latStr}, Lng: ${lngStr}</span>
        <hr style="margin: 6px 0; border: none; border-top: 1px solid #DDD;">
        <button class="btn btn-destructive" style="min-height: 32px; padding: 0 8px; font-size: 11px;" onclick="liveMap.openRoadBlockModalWithPoint(${latStr}, ${lngStr})">
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
    document.getElementById('road-block-modal').classList.remove('hidden');
  }

  openRoadBlockModalWithPoint(lat, lng) {
    this.map.closePopup();
    this.customSelectedPoint = { lat, lng };
    document.getElementById('modal-road-select').value = 'custom-point';
    document.getElementById('road-block-modal').classList.remove('hidden');
  }

  closeRoadBlockModal() {
    document.getElementById('road-block-modal').classList.add('hidden');
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

    // Add new hazard entry
    const newHazard = {
      id: `haz-${Date.now()}`,
      name: locationName,
      lat: lat,
      lng: lng,
      type: 'Road Blocked / Closed',
      severity: status,
      confidence: 100,
      confirmed: true,
      notes: reason
    };

    this.hazardsData.push(newHazard);

    // Update convoy status & reroute
    this.convoysData.forEach(c => {
      if (c.status === 'On Route') {
        c.status = 'Rerouted';
      }
    });

    // Re-render map layers
    this.renderAllLayers();
    this.closeRoadBlockModal();

    // Broadcast Critical Alert Banner & Toast
    const alertMsg = `ROAD BLOCKED: ${locationName} marked ${status.toUpperCase()} (${reason}). Active convoys rerouted live!`;
    toast.showBanner(alertMsg);
    toast.success(`Road block registered and system rerouting calculated.`);

    // Refresh Inspector
    this.inspectEntity('hazard', newHazard);
  }

  /* ------------------------------------------
     HAZARD VERIFICATION ENGINE (Control Room)
     ------------------------------------------ */
  verifyHazard(hazardId) {
    if (!auth.canPerform('verify_hazard')) {
      toast.error('Verify hazard is restricted to Control Room Officers only.');
      return;
    }

    const hazard = this.hazardsData.find(h => h.id === hazardId);
    if (hazard) {
      hazard.confirmed = true;
      hazard.confidence = 100;
      this.renderHazards();
      toast.success(`Hazard "${hazard.name}" verified! Confidence promoted to 100%. Route graph updated.`);
      this.inspectEntity('hazard', hazard);
    }
  }

  /* ------------------------------------------
     INSPECTOR PANEL CONTROLLER
     ------------------------------------------ */
  inspectEntity(type, entity) {
    const titleEl = document.getElementById('inspector-title');
    const subEl = document.getElementById('inspector-subtitle');
    const contentEl = document.getElementById('inspector-content');

    titleEl.innerText = `${type.toUpperCase()} INSPECTOR`;
    subEl.innerText = entity.name || entity.id;

    if (type === 'hazard') {
      const badge = window.statusBadge.render(entity.severity, { confirmed: entity.confirmed, label: entity.severity.toUpperCase() });
      const canVerify = auth.canPerform('verify_hazard') && !entity.confirmed;

      contentEl.innerHTML = `
        <div style="margin-bottom: var(--space-3);">
          ${badge}
        </div>
        <h3 style="font-size: var(--text-base); margin-bottom: 4px;">${entity.name}</h3>
        <p class="text-meta" style="margin-bottom: var(--space-3);">Type: <strong>${entity.type}</strong></p>

        <div style="background: var(--bg-honeydew); padding: var(--space-3); border-radius: var(--radius); border: 1px solid var(--border-hairline); margin-bottom: var(--space-4); font-size: var(--text-sm);">
          <div><strong>Confidence Score:</strong> ${entity.confidence}%</div>
          <div><strong>Verification:</strong> ${entity.confirmed ? 'Confirmed (Solid Ring)' : 'Unconfirmed Report (Dashed Ring)'}</div>
          <div style="margin-top: 6px; font-size: var(--text-xs); color: var(--slate-500);">${entity.notes}</div>
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
      const badge = window.statusBadge.render(entity.status === 'Stranded' ? 'impassable' : (entity.status === 'Rerouted' ? 'degraded' : 'normal'), { label: entity.status });

      contentEl.innerHTML = `
        <div style="margin-bottom: var(--space-3);">${badge}</div>
        <h3 style="font-size: var(--text-base); margin-bottom: 4px;">${entity.name}</h3>
        <p class="text-meta" style="margin-bottom: var(--space-3);">Cargo: <strong>${entity.cargo}</strong></p>

        <div style="background: var(--bg-honeydew); padding: var(--space-3); border-radius: var(--radius); border: 1px solid var(--border-hairline); margin-bottom: var(--space-4); font-size: var(--text-sm);">
          <div><strong>Origin:</strong> ${entity.origin}</div>
          <div><strong>Destination:</strong> ${entity.dest}</div>
          <div><strong>Priority Tier:</strong> ${entity.priority}</div>
        </div>

        <button class="btn btn-secondary" style="width: 100%;" onclick="window.location.href='convoy-dispatch.html'">
          View Convoy Dispatch Board →
        </button>
      `;
    } else if (type === 'shelter') {
      const badge = window.statusBadge.render(entity.urgency === 'critical' ? 'impassable' : 'degraded', { label: `${entity.daysSupply} Days Cover` });

      contentEl.innerHTML = `
        <div style="margin-bottom: var(--space-3);">${badge}</div>
        <h3 style="font-size: var(--text-base); margin-bottom: 4px;">${entity.name}</h3>
        <p class="text-meta" style="margin-bottom: var(--space-3);">Population: <strong>${entity.pop} occupants</strong></p>

        ${entity.isolated ? `
          <div style="background: var(--slate-800); color: var(--white); padding: var(--space-3); border-radius: var(--radius); margin-bottom: var(--space-4); font-size: var(--text-xs);">
            <strong>⚠️ ISOLATED SHELTER WARNING:</strong> No road path reachable from any active warehouse depot! Automated alert active.
          </div>
        ` : ''}

        <button class="btn btn-secondary" style="width: 100%;" onclick="window.location.href='shelter-board.html'">
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
