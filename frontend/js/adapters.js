/* FRONTEND DATA NORMALIZATION ADAPTERS (Phase 24) */

/**
 * Maps raw backend status to 3 frontend operational status tiers:
 * normal, recoverable -> SAFE
 * degraded, restricted -> CAUTION
 * hazardous, impassable -> BLOCKED
 */
export function mapBackendStatusToTier(statusStr) {
  if (!statusStr) return 'SAFE';
  const s = String(statusStr).toLowerCase();
  if (s === 'normal' || s === 'recoverable' || s === 'safe' || s === 'on route') {
    return 'SAFE';
  }
  if (s === 'degraded' || s === 'restricted' || s === 'caution' || s === 'rerouted') {
    return 'CAUTION';
  }
  if (s === 'hazardous' || s === 'impassable' || s === 'blocked' || s === 'stranded') {
    return 'BLOCKED';
  }
  return 'SAFE';
}

export function normalizeRoad(raw = {}) {
  return {
    id: raw.id || raw._id || `road-${Math.random()}`,
    name: raw.name || raw.road_name || 'Unnamed Arterial Road',
    status: raw.status || 'normal',
    tier: mapBackendStatusToTier(raw.status),
    segmentId: raw.segmentId || raw.segment_id || '',
    coordinates: raw.coordinates || raw.geometry?.coordinates || [],
    floodDepthMeters: raw.floodDepthMeters || raw.flood_depth || 0,
    lastUpdated: raw.lastUpdated || raw.updated_at || new Date().toISOString()
  };
}

export function normalizeBridge(raw = {}) {
  return {
    id: raw.id || raw._id || `bridge-${Math.random()}`,
    name: raw.name || raw.bridge_name || 'Cross-River Bridge',
    status: raw.status || 'normal',
    tier: mapBackendStatusToTier(raw.status),
    coordinates: raw.coordinates || [raw.lat || 0, raw.lng || 0],
    structuralDamage: raw.structuralDamage || raw.damage_level || 'None',
    lastUpdated: raw.lastUpdated || raw.updated_at || new Date().toISOString()
  };
}

export function normalizeShelter(raw = {}) {
  return {
    id: raw.id || raw._id || `shelter-${Math.random()}`,
    name: raw.name || raw.shelter_name || 'Relief Shelter',
    region: raw.region || raw.sector || 'District 1',
    population: Number(raw.population || raw.people_count || 0),
    daysOfSupply: Number(raw.daysOfSupply || raw.days_remaining || 0),
    urgencyTier: raw.urgencyTier || (Number(raw.daysOfSupply) <= 2 ? 'CRITICAL' : Number(raw.daysOfSupply) <= 5 ? 'WARNING' : 'NORMAL'),
    isolationRisk: Boolean(raw.isolationRisk || raw.is_isolated),
    incomingConvoyEta: raw.incomingConvoyEta || raw.incoming_eta || 'No convoy assigned',
    contactRadio: raw.contactRadio || raw.radio_frequency || 'Ch. 4 (462.5625 MHz)',
    coordinates: raw.coordinates || [raw.lat || 0, raw.lng || 0],
    lastUpdated: raw.lastUpdated || raw.updated_at || new Date().toISOString()
  };
}

export function normalizeMission(raw = {}) {
  return {
    id: raw.id || raw.mission_id || `convoy-${Math.random()}`,
    cargoType: raw.cargoType || raw.cargo_name || 'General Supplies',
    priority: raw.priority || 'Medium', // Insulin/Blood, Infant Nutrition, Water, General
    originHub: raw.originHub || raw.origin || 'Main Depot',
    destinationShelter: raw.destinationShelter || raw.destination || 'Shelter Alpha',
    status: raw.status || 'On Route', // On Route, Rerouted, Stranded, Delivered
    tier: mapBackendStatusToTier(raw.status),
    eta: raw.eta || raw.estimated_arrival || 'Unknown',
    driverName: raw.driverName || raw.driver_name || 'Unassigned Driver',
    driverPhone: raw.driverPhone || raw.driver_phone || 'Radio Channel 9',
    oldPathName: raw.oldPathName || raw.previous_route || null,
    newPathName: raw.newPathName || raw.current_route || 'Primary Corridor',
    coordinates: raw.coordinates || [raw.lat || 0, raw.lng || 0],
    lastUpdated: raw.lastUpdated || raw.updated_at || new Date().toISOString()
  };
}

export function normalizeReport(raw = {}) {
  return {
    id: raw.id || raw._id || `report-${Math.random()}`,
    hazardType: raw.hazardType || raw.type || 'Debris',
    sourceType: raw.sourceType || raw.source || 'Field Report', // Sensor, Field Report, Satellite, Manual
    reportedAt: raw.reportedAt || raw.timestamp || new Date().toISOString(),
    confidencePercent: Number(raw.confidencePercent || raw.confidence || 85),
    region: raw.region || raw.location || 'Sector 6',
    status: raw.status || 'Caution',
    tier: mapBackendStatusToTier(raw.status),
    verificationState: raw.verificationState || raw.verified ? 'Verified' : 'Unverified',
    description: raw.description || raw.notes || 'Hazard observed on arterial link.',
    coordinates: raw.coordinates || [raw.lat || 0, raw.lng || 0]
  };
}

export function normalizeAlert(raw = {}) {
  return {
    id: raw.id || raw._id || `alert-${Math.random()}`,
    severity: (raw.severity || 'WARNING').toUpperCase(), // CRITICAL, WARNING, ADVISORY
    message: raw.message || raw.title || 'Operational alert issued.',
    region: raw.region || 'Sector 6',
    convoyId: raw.convoyId || raw.convoy_id || null,
    timestamp: raw.timestamp || raw.created_at || new Date().toISOString(),
    acknowledged: Boolean(raw.acknowledged),
    escalated: Boolean(raw.escalated)
  };
}

export function normalizeInventory(raw = {}) {
  return {
    id: raw.id || raw.item_id || `inv-${Math.random()}`,
    name: raw.name || raw.item_name || 'Relief Supplies',
    category: raw.category || 'Medical',
    physicalCount: Number(raw.physicalCount || raw.total_qty || 0),
    reservedCount: Number(raw.reservedCount || raw.reserved_qty || 0),
    transferableCount: Number(raw.transferableCount || (Number(raw.physicalCount || 0) - Number(raw.reservedCount || 0))),
    unit: raw.unit || 'units',
    warehouse: raw.warehouse || 'Regional Warehouse Alpha',
    healthStatus: raw.healthStatus || (Number(raw.physicalCount) > 50 ? 'HEALTHY' : 'LOW'),
    lastUpdated: raw.lastUpdated || raw.updated_at || new Date().toISOString()
  };
}

export function normalizeSupplySwap(raw = {}) {
  return {
    id: raw.id || raw.swap_id || `SW-${Math.floor(100 + Math.random() * 900)}`,
    sourceWarehouse: raw.sourceWarehouse || raw.origin_warehouse || 'Regional Warehouse Alpha',
    targetDestination: raw.targetDestination || raw.target_name || 'Shelter 06',
    destinationType: raw.destinationType || 'Shelter',
    supplyItem: raw.supplyItem || raw.item_name || 'Refrigerated Insulin',
    quantity: Number(raw.quantity || raw.qty || 40),
    unit: raw.unit || 'doses',
    urgencyHoursRemaining: Number(raw.urgencyHoursRemaining || raw.time_to_harm_hours || 4),
    routeFeasibility: raw.routeFeasibility || 'CAUTION', // SAFE, CAUTION, BLOCKED
    status: raw.status || 'PENDING_APPROVAL', // PENDING_APPROVAL, APPROVED, EN_ROUTE, COMPLETED, REJECTED
    requester: raw.requester || raw.requesting_user || 'Shelter 06 Officer',
    convoyId: raw.convoyId || null,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString()
  };
}

