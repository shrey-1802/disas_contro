import { renderGlobalShell, renderCriticalAlertBanner } from '../navbar.js';
import { Store } from '../store.js';
import { socketService } from '../socket.js';
import { renderStatusBadge } from '../statusBadge.js';
import { toast } from '../toast.js';

let alertsInboxList = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderGlobalShell('alerts.html');

  alertsInboxList = Store.getAlerts();
  renderAlertsInbox();

  // Bind Filters & Buttons
  document.getElementById('filter-severity')?.addEventListener('change', renderAlertsInbox);
  document.getElementById('filter-state')?.addEventListener('change', renderAlertsInbox);
  document.getElementById('btn-clear-ack')?.addEventListener('click', handleClearAcknowledged);

  // Reactive store update listener
  window.addEventListener('store-updated', () => {
    alertsInboxList = Store.getAlerts();
    renderAlertsInbox();
  });
});


/* --------------------------------------------------------------------------
   1. INBOX RENDERING ENGINE (3-TIER SEVERITY MODEL)
   -------------------------------------------------------------------------- */
function renderAlertsInbox() {
  const container = document.getElementById('alerts-container');
  if (!container) return;

  const severityFilter = document.getElementById('filter-severity')?.value || 'all';
  const stateFilter = document.getElementById('filter-state')?.value || 'all';

  let filtered = [...alertsInboxList];

  // Severity Filter
  if (severityFilter !== 'all') {
    filtered = filtered.filter(a => (a.severity || 'critical').toLowerCase() === severityFilter.toLowerCase());
  }

  // State Filter
  if (stateFilter !== 'all') {
    if (stateFilter === 'pending') {
      filtered = filtered.filter(a => !a.acknowledged && !a.escalated);
    } else if (stateFilter === 'acknowledged') {
      filtered = filtered.filter(a => a.acknowledged === true);
    } else if (stateFilter === 'escalated') {
      filtered = filtered.filter(a => a.escalated === true);
    }
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:var(--space-xl); color:var(--slate-600);">
        <span style="font-size:32px; display:block; margin-bottom:8px;">🚨</span>
        <h3>No operational alerts match the selected criteria</h3>
        <p class="text-xs">Adjust your severity or acknowledgment state filters.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const id = item.id || `ALT-${Math.floor(100 + Math.random() * 900)}`;
    const severity = (item.severity || 'critical').toLowerCase();
    const title = item.title || item.message || 'Operational System Alert';
    const description = item.description || item.details || 'Immediate command attention required.';
    const location = item.location || item.region || 'Sector 6';
    const timestamp = formatTimeAgo(item.timestamp);
    const source = item.source || 'Automated Telemetry';
    const isAck = item.acknowledged === true;
    const isEsc = item.escalated === true;

    // Severity Badge & Card Border
    let cardCSS = 'card--critical';
    let badgeHTML = `<span class="priority-badge priority-badge--critical">CRITICAL SEVERITY</span>`;

    if (severity === 'warning') {
      cardCSS = 'card--warning';
      badgeHTML = `<span class="priority-badge priority-badge--high">WARNING SEVERITY</span>`;
    } else if (severity === 'advisory') {
      cardCSS = '';
      badgeHTML = `<span class="priority-badge priority-badge--medium">ADVISORY</span>`;
    }

    // State Badge
    let stateBadgeHTML = '';
    if (isEsc) {
      stateBadgeHTML = renderStatusBadge('blocked', 'ESCALATED TO DISTRICT COMMAND');
    } else if (isAck) {
      stateBadgeHTML = renderStatusBadge('safe', '✓ ACKNOWLEDGED');
    } else {
      stateBadgeHTML = renderStatusBadge('caution', 'PENDING ACTION');
    }

    // Action Buttons
    const mapLinkHTML = item.link
      ? `<a href="${item.link}" class="button button--secondary text-xs">🗺️ Open Map Context</a>`
      : `<a href="live-map.html" class="button button--secondary text-xs">🗺️ Locate on Map</a>`;

    let actionButtonsHTML = '';
    if (!isAck && !isEsc) {
      actionButtonsHTML = `
        <button class="button button--secondary text-xs btn-ack-alert" data-id="${id}">Acknowledge</button>
        <button class="button button--critical text-xs btn-esc-alert" data-id="${id}">Escalate to District Command</button>
      `;
    } else if (isAck && !isEsc) {
      actionButtonsHTML = `
        <button class="button button--critical text-xs btn-esc-alert" data-id="${id}">Escalate to District Command</button>
      `;
    }

    return `
      <div class="card ${cardCSS}" id="alert-card-${id}">
        <div class="card__header">
          <div class="flex items-center gap-sm">
            ${badgeHTML}
            <h3 class="card__title" style="font-size:var(--font-size-base);">${title}</h3>
          </div>
          <span class="text-xs" style="color:var(--slate-600);">${timestamp}</span>
        </div>
        <p class="text-sm" style="margin-bottom:var(--space-sm); color:var(--slate-800);">${description}</p>
        <div class="flex items-center justify-between text-xs" style="color:var(--slate-600); margin-bottom:var(--space-sm);">
          <div>Location: <strong>${location}</strong> | Source: <strong>${source}</strong></div>
          <div>State: ${stateBadgeHTML}</div>
        </div>
        <div class="flex items-center justify-between" style="border-top:1px solid var(--sage-100); padding-top:var(--space-sm);">
          ${mapLinkHTML}
          <div class="flex gap-sm" id="alert-actions-${id}">
            ${actionButtonsHTML}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach Action Button Listeners
  document.querySelectorAll('.btn-ack-alert').forEach(btn => {
    btn.addEventListener('click', (e) => handleAcknowledge(e.target.getAttribute('data-id')));
  });
  document.querySelectorAll('.btn-esc-alert').forEach(btn => {
    btn.addEventListener('click', (e) => handleEscalate(e.target.getAttribute('data-id')));
  });
}

/* --------------------------------------------------------------------------
   2. ACKNOWLEDGMENT WORKFLOW (PATCH /api/alerts/:id/acknowledge)
   -------------------------------------------------------------------------- */
function handleAcknowledge(id) {
  Store.acknowledgeAlert(id);
  alertsInboxList = Store.getAlerts();
  renderAlertsInbox();
  toast.success(`Alert #${id} acknowledged by operator`);
}


/* --------------------------------------------------------------------------
   3. ESCALATION WORKFLOW (PATCH /api/alerts/:id/escalate)
   -------------------------------------------------------------------------- */
async function handleEscalate(id) {
  try {
    // API request to escalate alert
    await api.escalateAlert(id).catch(err => {
      throw new Error(err.message || 'Server escalation failed');
    });

    // On Success: Update local state to Escalated
    const alert = alertsInboxList.find(a => (a.id === id || a.alert_id === id));
    if (alert) {
      alert.escalated = true;
    }

    renderAlertsInbox();
    toast.show(`Alert #${id} ESCALATED to District Command`, 'warning', 3500);

  } catch (err) {
    // NEVER fake success if API call fails
    console.error('[Alerts] Escalation error:', err.message);
    toast.show(`Escalation failed: Could not escalate Alert #${id} to server`, 'critical', 4000);
  }
}

/* --------------------------------------------------------------------------
   4. CLEAR ACKNOWLEDGED & SOCKET STREAM HANDLERS
   -------------------------------------------------------------------------- */
function handleClearAcknowledged() {
  const initialCount = alertsInboxList.length;
  alertsInboxList = alertsInboxList.filter(a => !a.acknowledged);
  const clearedCount = initialCount - alertsInboxList.length;

  renderAlertsInbox();
  toast.show(`Cleared ${clearedCount} acknowledged alert(s) from current view`, 'safe', 2500);
}

function handleAlertStreamUpdate(data) {
  const newAlert = {
    id: data.id || `ALT-${Math.floor(100 + Math.random() * 900)}`,
    title: data.title || data.message || 'Real-Time Operational Alert',
    description: data.details || data.message || 'Telemetry anomaly reported over socket stream.',
    severity: data.severity || 'critical',
    location: data.location || 'Sector 6',
    source: data.source || 'Socket Telemetry',
    timestamp: new Date().toISOString(),
    acknowledged: false,
    escalated: false
  };

  alertsInboxList.unshift(newAlert);
  renderAlertsInbox();

  // If critical, update persistent top banner
  if (newAlert.severity === 'critical') {
    localStorage.setItem('unacknowledged_critical_alert', JSON.stringify(newAlert));
    renderCriticalAlertBanner(newAlert);
    toast.show(`🛑 CRITICAL ALERT: ${newAlert.title}`, 'critical', 5000);
  } else {
    toast.show(`🚨 ALERT: ${newAlert.title}`, 'warning', 3000);
  }
}

function formatTimeAgo(isoString) {
  if (!isoString) return '3 mins ago';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Fallback Mock Operational Alerts
function getMockAlerts() {
  return [
    {
      id: 'ALT-101',
      title: 'Convoy CV-014 Path Stranded Risk — Sector 6',
      description: 'Bridge B-14 closed due to 1.4m water depth. Convoy CV-014 carrying refrigerated insulin requires rerouting approval to bypass damaged bridge via Route D.',
      severity: 'critical',
      location: 'Sector 6 (Bridge B-14)',
      source: 'Bridge Sensor Telemetry',
      timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
      acknowledged: false,
      escalated: false,
      link: 'live-map.html?convoy=CV-014'
    },
    {
      id: 'ALT-102',
      title: 'Shelter 06 Medical Reserve Depletion Risk',
      description: 'Insulin inventory estimated remaining under 12 hours (0.5 days). Priority dispatch CV-014 delayed due to bridge submersion.',
      severity: 'warning',
      location: 'East Valley Sector 4',
      source: 'Shelter Supply Monitor',
      timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
      acknowledged: false,
      escalated: false,
      link: 'shelter-board.html'
    },
    {
      id: 'ALT-103',
      title: 'Route C Feeder Corridor Passability Caution',
      description: 'Minor hillside mud accumulation detected by satellite imagery. Passable for heavy clearance convoys only.',
      severity: 'advisory',
      location: 'Sector 2 Feeder C',
      source: 'Satellite Imagery Stream',
      timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
      acknowledged: true,
      escalated: false,
      link: 'live-map.html'
    }
  ];
}
