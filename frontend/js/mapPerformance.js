/* FRONTEND MAP PERFORMANCE ARCHITECTURE (Phase 23) */

export class MapPerformanceManager {
  constructor(leafletMap) {
    this.map = leafletMap;
    this.markers = new Map(); // entityId -> L.Marker
    this.layers = new Map();  // layerId -> L.LayerGroup or L.Polyline
  }

  /**
   * High performance marker insertion or incremental update (Phase 23)
   */
  updateMarker(id, latlng, icon, popupHtml, onClickCallback) {
    if (this.markers.has(id)) {
      const existing = this.markers.get(id);
      existing.setLatLng(latlng);
      if (icon) existing.setIcon(icon);
      if (popupHtml) existing.setPopupContent(popupHtml);
    } else {
      const marker = L.marker(latlng, { icon });
      if (popupHtml) marker.bindPopup(popupHtml);
      if (onClickCallback) marker.on('click', onClickCallback);
      marker.addTo(this.map);
      this.markers.set(id, marker);
    }
  }

  removeMarker(id) {
    if (this.markers.has(id)) {
      this.map.removeLayer(this.markers.get(id));
      this.markers.delete(id);
    }
  }

  clearAllMarkers() {
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers.clear();
  }
}
