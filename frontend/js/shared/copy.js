/* ==========================================
   DISISTA CONTROL — UI COPY STRINGS (PHASE 20)
   Centralised operational copy — factual, direct, no exclamation marks
   All units always stated. Errors state what happened + what to do.
   ========================================== */

const Copy = {

  /* ── Status Labels ── */
  statusLabel: {
    normal:      'Normal — Safe passage confirmed',
    recoverable: 'Recoverable — Minor obstacle, passable',
    degraded:    'Degraded — Reduced capacity, proceed with caution',
    restricted:  'Restricted — Limited vehicle types permitted',
    hazardous:   'Hazardous — Unsafe, convoy detour required',
    impassable:  'Impassable — Road closed, no through passage'
  },

  /* ── Convoy / Mission ── */
  convoy: {
    ackPending:        'Acknowledgment pending from field driver',
    ackTimeout:        'Driver has not acknowledged reroute order — manual contact required',
    ackReceived:       'Reroute acknowledged by driver',
    rerouted:          (reason) => `Route recalculated — ${reason}`,
    stranded:          'Convoy stranded at current position — rescue or relay required',
    relayRequired:     'Vehicle handoff required at relay depot',
    afterAction:       (name, cargo, via, dest, elapsed, delta) =>
                       `${name} (${cargo}) delivered to ${dest} via ${via}. Transit: ${elapsed}. Delta from original ETA: ${delta}.`,
    noConvoys:         'No active convoys match current filter criteria.',
    bulkDispatched:    (n) => `${n} convoy${n === 1 ? '' : 's'} dispatched on recalculated safe corridor.`
  },

  /* ── Hazards & Reports ── */
  hazard: {
    unconfirmed:       'Unconfirmed — pending Control Room verification',
    confirmed:         'Confirmed — status promoted to verified',
    verifySuccess:     (loc) => `Report at ${loc} verified. Confidence promoted to 100%. Route cost graph updated.`,
    verifyDenied:      'Hazard verification is restricted to Control Room Officers only.',
    submitted:         (loc) => `Field hazard observation submitted for ${loc}. Fusion pipeline processing.`,
    fusionConflict:    (newSrc, oldSrc) => `Conflict — newer report from ${newSrc} being applied for routing, pending verification over older ${oldSrc} data.`
  },

  /* ── Supply Swap ── */
  swap: {
    coldChainDenied:   'This vehicle is not refrigerated — insulin and blood products cannot be assigned to it.',
    coldChainOk:       'Cold-chain requirement met — refrigerated vehicle confirmed.',
    impactWarning:     (wh, daysAfter) => `${wh} drops to ${daysAfter} days cover after transfer — below 3-day safety threshold. Consider reducing quantity.`,
    approved:          (id) => `Transfer ${id} approved. Lifecycle advanced to Approved stage.`,
    completed:         (id) => `Transfer ${id} completed successfully. Receiving warehouse inventory updated.`,
    escalated:         (id) => `Critical transfer ${id} escalated to District Command — no action taken within 15 minutes.`,
    noMatches:         'No matching donor warehouses found for this request at the current time.',
    chainAvailable:    'Partial match — chain swap available from multiple warehouses. Approve each leg independently.'
  },

  /* ── Shelters ── */
  shelter: {
    isolated:          (name) => `${name} — no reachable road path from any active warehouse depot. Immediate aerial or relay intervention required.`,
    critical:          (name, days) => `${name} has ${days} days of supply remaining — critical shortage threshold reached.`,
    caution:           (name, days) => `${name} has ${days} days of supply remaining — monitor closely.`,
    noShelters:        'All registered shelters currently report supply cover above minimum threshold.'
  },

  /* ── Alerts ── */
  alerts: {
    acknowledged:      'Alert acknowledged by command operator.',
    escalated:         'Alert escalated to HQ Command Center.',
    ackDenied:         'Alert management requires Control Room or District Admin role.',
    noAlerts:          'Command center alerts inbox is clear.'
  },

  /* ── System / Generic ── */
  system: {
    syncSuccess:       'Offline action queue synchronised — 0 actions pending.',
    syncFailed:        'Synchronisation failed — check network connectivity and retry.',
    fieldModeOn:       'Field Mode enabled — text size and touch targets increased for outdoor operation.',
    fieldModeOff:      'Field Mode disabled — standard desktop density restored.',
    loginSuccess:      (roleName) => `Authenticated as ${roleName}. Redirecting to default screen.`,
    loginFailed:       'Authentication failed — check credentials and selected role.',
    sessionExpired:    'Session expired — sign in again to continue.',
    noRole:            'Select an operational role before authenticating.',
    forbidden:         (action, requiredRole) => `${action} requires ${requiredRole} role. Contact your supervisor to request access.`
  }
};

window.Copy = Copy;
