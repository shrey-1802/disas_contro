/* UI Copy Module (Phase 20)
 *
 * Single source of truth for all operational UI copy.
 *
 * Rules enforced (Phase 20 requirements):
 *   — Direct operational language: "Reroute Convoy 14" not "Would you like to reroute?"
 *   — Explicit values: "Updated 3 min ago" not "Recently" or "3"
 *   — Specific labels: "Bridge B-14 blocked" not "Bridge issue"
 *   — Units always included: "1.2 m flood depth" not "1.2"
 *   — No exclamation marks
 *   — No decorative microcopy
 *   — Future-translation-ready: all user-visible strings pass through here
 *     (Phase 19: supports expansion by returning from a map, not hardcoded inline)
 *
 * Usage:
 *   Copy.action.reroute('Convoy 14')        → 'Reroute Convoy 14'
 *   Copy.action.dispatch(4, 'Route C')      → 'Dispatch 4 Convoys to Route C'
 *   Copy.status.label('rerouted')           → 'Rerouted'
 *   Copy.confirm.dispatch(4, 'Route C')     → 'Dispatch 4 Convoys to Route C'
 *   Copy.error.unableToLoad('shelter data') → 'Unable to load shelter data.'
 *   Copy.freshness.staleWarning()           → 'Data may not reflect current conditions.'
 */

const Copy = (() => {

  /* ── Actions ─────────────────────────────────────────────── */
  // All action labels are direct imperatives — no "Would you like to..."

  const action = {
    reroute:       (convoyId) => `Reroute ${convoyId}`,
    dispatch:      (count, route) => `Dispatch ${count} ${count === 1 ? 'Convoy' : 'Convoys'} to ${route}`,
    acknowledge:   (alertId) => alertId ? `Acknowledge ${alertId}` : 'Acknowledge Alert',
    escalate:      (alertId) => alertId ? `Escalate ${alertId}` : 'Escalate Alert',
    verify:        (reportId) => reportId ? `Verify Report ${reportId}` : 'Verify Report',
    reject:        (reportId) => reportId ? `Reject Report ${reportId}` : 'Reject Report',
    markSafe:      (entityId) => `Mark ${entityId} Safe`,
    markBlocked:   (entityId) => `Mark ${entityId} Blocked`,
    retry:         () => 'Retry',
    refresh:       () => 'Refresh',
    cancel:        () => 'Cancel',
    confirm:       () => 'Confirm',
    close:         () => 'Close',
    viewOnMap:     () => 'View on Map',
    viewDetails:   () => 'View Details',
    fileReport:    () => 'File Hazard Report',
    submitReport:  () => 'Submit Report',
    saveSettings:  () => 'Save Settings',
    resetSettings: () => 'Reset to Defaults',
    logout:        () => 'Sign Out',
    clearFilters:  () => 'Clear Filters',
  };

  /* ── Confirmation dialog titles ──────────────────────────── */
  // Never "Are you sure?" — always the direct action as the title

  const confirm = {
    dispatch:    (count, route) => `Dispatch ${count} ${count === 1 ? 'Convoy' : 'Convoys'} to ${route}`,
    reroute:     (convoyId, newRoute) => `Reroute ${convoyId} to ${newRoute}`,
    acknowledge: (alertId) => `Acknowledge ${alertId}`,
    escalate:    (alertId) => `Escalate ${alertId}`,
    verify:      (reportId) => `Verify Report ${reportId}`,
    reject:      (reportId) => `Reject Report ${reportId}`,
  };

  /* ── Status labels ───────────────────────────────────────── */

  const status = {
    label: (statusKey) => {
      const map = {
        safe:          'Safe',
        caution:       'Caution',
        blocked:       'Blocked',
        normal:        'Safe',
        recoverable:   'Safe',
        degraded:      'Caution',
        restricted:    'Caution',
        hazardous:     'Blocked',
        impassable:    'Blocked',
        on_route:      'On Route',
        rerouted:      'Rerouted',
        stranded:      'Stranded',
        delivered:     'Delivered',
        pending:       'Pending',
        active:        'Active',
        resolved:      'Resolved',
        acknowledged:  'Acknowledged',
        unverified:    'Unverified',
        verified:      'Verified',
        rejected:      'Rejected',
        online:        'Connected',
        offline:       'Offline',
        reconnecting:  'Reconnecting',
      };
      return map[statusKey] || statusKey;
    },

    roadTier: (rawStatus) => {
      if (['normal', 'recoverable'].includes(rawStatus))     return 'safe';
      if (['degraded', 'restricted'].includes(rawStatus))    return 'caution';
      if (['hazardous', 'impassable'].includes(rawStatus))   return 'blocked';
      return 'unknown';
    },
  };

  /* ── Priority labels ─────────────────────────────────────── */

  const priority = {
    label: (level) => {
      const map = { 1: 'Critical', 2: 'High', 3: 'Standard', 4: 'Routine' };
      return map[level] || 'Routine';
    },
    fromCargo: (cargoKey) => {
      const map = { insulin: 1, blood: 1, infant_nutrition: 2, water: 3, general: 4 };
      return map[(cargoKey || '').toLowerCase()] || 4;
    },
  };

  /* ── Error messages ──────────────────────────────────────── */
  // Specific, honest, actionable — never "Something went wrong"

  const error = {
    unableToLoad:    (entity) => `Unable to load ${entity}.`,
    unableToRefresh: (entity) => `Unable to refresh ${entity}.`,
    actionFailed:    (action) => `${action} failed. Check connectivity and retry.`,
    notImplemented:  (action) => `${action} is not available. Contact the system administrator.`,
    offline:         () => 'No network connection. Operating in offline mode.',
    authFailed:      () => 'Authentication failed. Check credentials and retry.',
    permissionDenied:() => 'You do not have permission to perform this action.',
    sessionExpired:  () => 'Your session has expired. Sign in again to continue.',
  };

  /* ── Data freshness copy ─────────────────────────────────── */
  // Explicit time phrases — never "Live" when it isn't, never raw numbers

  const freshness = {
    justNow:       () => 'Updated just now',
    secondsAgo:    (s) => `Updated ${s}s ago`,
    minutesAgo:    (m) => m === 1 ? 'Updated 1 min ago' : `Updated ${m} min ago`,
    hoursAgo:      (h) => h === 1 ? 'Updated 1 hour ago' : `Updated ${h} hours ago`,
    unknown:       () => 'Last update time unknown',
    staleWarning:  () => 'Data may not reflect current conditions.',
    offlineNotice: () => 'Last synchronized data is shown. Live updates paused.',
  };

  /* ── Units & measurements ────────────────────────────────── */
  // Always include the unit — never raw numbers

  const units = {
    floodDepth:     (m) => `${m} m flood depth`,
    supplyDays:     (d) => d === 1 ? '1 day remaining' : `${d.toFixed(1)} days remaining`,
    supplyHours:    (h) => h === 1 ? '1 hour remaining' : `${h} hours remaining`,
    etaMinutes:     (m) => m < 60 ? `${m} min` : `${Math.floor(m/60)}h ${m%60}m`,
    etaChange:      (m) => m >= 0 ? `+${m} min delay` : `${Math.abs(m)} min saved`,
    population:     (n) => `${n.toLocaleString()} people`,
    confidence:     (c) => `${Math.round(c * 100)}% confidence`,
  };

  /* ── Empty state copy ────────────────────────────────────── */
  // Reserved here for future i18n — actual rendering is in EmptyUtil

  const empty = {
    noActiveConvoys: () => 'No active convoys',
    noShelterData:   () => 'No shelter data',
    noHazardReports: () => 'No hazard reports',
    noAlerts:        () => 'No active alerts',
    noResults:       () => 'No results found',
  };

  /* ── Navigation labels ───────────────────────────────────── */

  const nav = {
    liveMap:        () => 'Live Map',
    convoyDispatch: () => 'Convoy Dispatch',
    shelterBoard:   () => 'Shelter Board',
    hazardLog:      () => 'Hazard Log',
    alerts:         () => 'Alerts',
    settings:       () => 'Settings',
    dashboard:      () => 'Overview',
    signOut:        () => 'Sign Out',
  };

  return { action, confirm, status, priority, error, freshness, units, empty, nav };
})();

window.Copy = Copy;
