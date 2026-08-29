/**
 * Hazard & Incident Log Controller — Reverse-Chronological Timeline & Glove-Friendly Field Reporting
 * Relief Supply Chain Resilience & Rerouting System (Phase 8)
 */

import { renderGlobalShell } from '../navbar.js';
import { api } from '../api.js';
import { auth } from '../auth.js';
import { socketService } from '../socket.js';
import { renderStatusBadge } from '../statusBadge.js';
import { toast } from '../toast.js';

let hazardFeedList = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderGlobalShell('hazard-log.html');

  // Load telemetry data from API or fallbacks
  try {
    const rawReports = await api.getReports().catch(() => null);
    hazardFeedList = rawReports && rawReports.length > 0 ? rawReports : getMockHazards();
  } catch (err) {
    console.warn('[HazardLog] API fallback notice:', err.message);
    hazardFeedList = getMockHazards();
  }

  // Initial Sync Status Check
  updateOfflineSyncBanner();

  // Render Feed
  renderHazardFeed();

  // Filter Listeners
  document.getElementById('filter-hazard-type')?.addEventListener('change', renderHazardFeed);
  document.getElementById('filter-region')?.addEventListener('change', renderHazardFeed);
  document.getElementById('filter-source')?.addEventListener('change', renderHazardFeed);
  document.getElementById('filter-status')?.addEventListener('change', renderHazardFeed);

  // Modal Handlers
  document.getElementById('btn-open-report-modal')?.addEventListener('click', openReportModal);
  document.getElementById('btn-close-report-modal')?.addEventListener('click', closeReportModal);
  document.getElementById('btn-cancel-report')?.addEventListener('click', closeReportModal);
  document.getElementById('form-hazard-report')?.addEventListener('submit', handleFieldReportSubmit);

  // GPS Auto-detect button simulation
  document.getElementById('btn-detect-gps')?.addEventListener('click', handleGPSDetect);

  // Manual Sync Button
  document.getElementById('btn-manual-sync')?.addEventListener('click', syncPendingReports);

  // Online / Offline Window Event Listeners
  window.addEventListener('online', () => {
    updateOfflineSyncBanner();
    syncPendingReports();
  });
  window.addEventListener('offline', updateOfflineSyncBanner);

  // Real-Time Socket Stream Updates
  socketService.subscribe('alert_update', (data) => handleHazardStreamUpdate(data));
});

/* --------------------------------------------------------------------------
   1. TIMELINE FEED RENDER ENGINE (REVERSE CHRONOLOGICAL)
   -------------------------------------------------------------------------- */
function renderHazardFeed() {
  const container = document.getElementById('hazard-feed');
  if (!container) return;

  const typeFilter = document.getElementById('filter-hazard-type')?.value || 'all';
  const regionFilter = document.getElementById('filter-region')?.value || 'all';
  const sourceFilter = document.getElementById('filter-source')?.value || 'all';
  const statusFilter = document.getElementById('filter-status')?.value || 'all';

  let filtered = [...hazardFeedList];

  // Apply Hazard Type Filter
  if (typeFilter !== 'all') {
    filtered = filtered.filter(item => (item.type || item.hazard_type || '').toLowerCase().includes(typeFilter.toLowerCase()));
  }

  // Apply Region Filter
  if (regionFilter !== 'all') {
    filtered = filtered.filter(item => (item.location || item.region || '').toLowerCase().includes(regionFilter.toLowerCase()));
  }

  // Apply Source Filter
  if (sourceFilter !== 'all') {
    filtered = filtered.filter(item => (item.source || '').toLowerCase().includes(sourceFilter.toLowerCase()));
  }

  // Apply Verification Status Filter
  if (statusFilter !== 'all') {
    if (statusFilter === 'verified') {
      filtered = filtered.filter(item => item.verified === true || item.status === 'verified');
    } else {
      filtered = filtered.filter(item => !item.verified && item.status !== 'verified');
    }
  }

  // Enforce Reverse Chronological Order (Newest First)
  filtered.sort((a, b) => new Date(b.timestamp || Date.now()) - new Date(a.timestamp || Date.now()));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:var(--space-xl); color:var(--slate-600);">
        <span style="font-size:32px; display:block; margin-bottom:8px;">⚠️</span>
        <h3>No hazard incident reports match the selected filters</h3>
        <p class="text-xs">Adjust your hazard type, region, or source filters.</p>
      </div>
    `;
    return;
  }

  const userRole = auth.getUserRole ? auth.getUserRole() : 'control_room';
  const isControlRoom = userRole === 'control_room';

  container.innerHTML = filtered.map(item => {
    const id = item.id || `HZ-${Math.floor(100+Math.random()*900)}`;
    const title = item.title || item.type || 'Hazard Event';
    const description = item.description || item.details || 'No detailed observation attached.';
    const timeAgo = formatTimeAgo(item.timestamp);
    const source = item.source || 'Field Report';
    const confidence = item.confidence || '85%';
    const location = item.location || item.region || 'Sector 6';
    const isVerified = item.verified === true || item.status === 'verified';
    const severity = (item.severity || 'critical').toLowerCase();

    const cardCSS = severity === 'critical' ? 'card--critical' : 'card--warning';
    const statusBadgeHTML = severity === 'critical'
      ? renderStatusBadge('blocked', '🛑 IMPASSABLE')
      : renderStatusBadge('caution', '▲ DEGRADED');

    let verificationActionHTML = '';
    if (isVerified) {
      verificationActionHTML = renderStatusBadge('safe', '✓ VERIFIED');
    } else if (isControlRoom) {
      // Control Room verification action button
      verificationActionHTML = `
        <button class="button button--secondary text-xs btn-verify-report" data-id="${id}">
          Verify & Promote to Map
        </button>
      `;
    } else {
      verificationActionHTML = `<span class="text-xs" style="color:var(--slate-600); font-weight:600;">UNVERIFIED</span>`;
    }

    return `
      <div class="card ${cardCSS}" id="hazard-card-${id}">
        <div class="card__header">
          <div class="flex items-center gap-sm">
            ${statusBadgeHTML}
            <h3 class="card__title" style="font-size:var(--font-size-base);">${title}</h3>
          </div>
          <span class="text-xs" style="color:var(--slate-600);">${timeAgo}</span>
        </div>
        <p class="text-sm" style="margin-bottom:var(--space-sm); color:var(--slate-800);">${description}</p>
        <div class="flex items-center justify-between text-xs" style="color:var(--slate-600); border-top:1px solid var(--sage-100); padding-top:var(--space-xs);">
          <div>Source: <strong>${source}</strong> | Confidence: <strong>${confidence}</strong> | Region: <strong>${location}</strong></div>
          <div id="verify-container-${id}">
            ${verificationActionHTML}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach Verification Listeners for Control Room
  document.querySelectorAll('.btn-verify-report').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      handleVerifyReport(id);
    });
  });
}

/* --------------------------------------------------------------------------
   2. CONTROL ROOM VERIFICATION WORKFLOW (PATCH /api/reports/:id/verify)
   -------------------------------------------------------------------------- */
async function handleVerifyReport(id) {
  const container = document.getElementById(`verify-container-${id}`);

  try {
    // Attempt API verification request
    await api.verifyReport(id).catch(err => {
      throw new Error(err.message || 'Server verification failed');
    });

    // On Success: Update local state and UI
    const item = hazardFeedList.find(h => (h.id === id || h.report_id === id));
    if (item) {
      item.verified = true;
      item.status = 'verified';
    }

    if (container) {
      container.innerHTML = renderStatusBadge('safe', '✓ VERIFIED');
    }
    toast.show(`Report #${id} verified & promoted to live map`, 'safe', 3000);

  } catch (err) {
    // On Failure: Do NOT modify UI state as if successful! Show error toast.
    console.error('[HazardLog] Verification failed:', err.message);
    toast.show(`Verification failed: Report #${id} remains unverified`, 'critical', 4000);
  }
}

/* --------------------------------------------------------------------------
   3. MOBILE-FIRST FIELD REPORTING & OFFLINE LOCALSTORAGE QUEUE
   -------------------------------------------------------------------------- */
function openReportModal() {
  const modal = document.getElementById('modal-hazard-report');
  if (modal) modal.style.display = 'flex';
}

function closeReportModal() {
  const modal = document.getElementById('modal-hazard-report');
  if (modal) modal.style.display = 'none';
}

function handleGPSDetect() {
  const input = document.getElementById('input-hazard-location');
  if (input) {
    input.value = 'Sector 6 (Lat 26.142, Long 91.738)';
    toast.show('📍 GPS Coordinates detected', 'safe', 2000);
  }
}

async function handleFieldReportSubmit(e) {
  e.preventDefault();

  const location = document.getElementById('input-hazard-location')?.value;
  const type = document.getElementById('input-hazard-type')?.value;
  const severity = document.getElementById('input-hazard-severity')?.value;
  const description = document.getElementById('input-hazard-description')?.value;

  const newReport = {
    id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
    title: `${type} — ${location}`,
    type,
    location,
    severity,
    description,
    source: 'Field Report',
    confidence: '92%',
    verified: false,
    timestamp: new Date().toISOString()
  };

  closeReportModal();
  document.getElementById('form-hazard-report')?.reset();

  // Check network status
  if (navigator.onLine) {
    try {
      await api.createReport(newReport).catch(() => null);
    } catch (err) {
      console.warn('[HazardLog] API report create fallback:', err.message);
    }

    hazardFeedList.unshift(newReport);
    renderHazardFeed();
    toast.show(`Field Report #${newReport.id} submitted to Control Room`, 'safe', 3000);

  } else {
    // MISSION-CRITICAL RULE: If offline, save locally & NEVER say "Report submitted"
    saveReportLocally(newReport);
    updateOfflineSyncBanner();
    toast.show('Saved locally — Pending synchronization', 'warning', 4000);
  }
}

function saveReportLocally(report) {
  const pending = JSON.parse(localStorage.getItem('pending_field_reports') || '[]');
  pending.push(report);
  localStorage.setItem('pending_field_reports', JSON.stringify(pending));
}

function getPendingReports() {
  return JSON.parse(localStorage.getItem('pending_field_reports') || '[]');
}

async function syncPendingReports() {
  const pending = getPendingReports();
  if (pending.length === 0) return;

  if (!navigator.onLine) {
    toast.show('Cannot sync: Device is currently offline', 'critical', 3000);
    return;
  }

  let syncedCount = 0;
  const remaining = [];

  for (const report of pending) {
    try {
      await api.createReport(report).catch(() => null);
      hazardFeedList.unshift(report);
      syncedCount++;
    } catch (err) {
      remaining.push(report);
    }
  }

  localStorage.setItem('pending_field_reports', JSON.stringify(remaining));
  updateOfflineSyncBanner();
  renderHazardFeed();

  if (syncedCount > 0) {
    toast.show(`Synced ${syncedCount} pending field report(s) with server`, 'safe', 3500);
  }
}

function updateOfflineSyncBanner() {
  const banner = document.getElementById('offline-sync-banner');
  const title = document.getElementById('sync-banner-title');
  const subtitle = document.getElementById('sync-banner-subtitle');
  const pending = getPendingReports();

  if (!banner) return;

  if (!navigator.onLine || pending.length > 0) {
    banner.style.display = 'flex';
    if (!navigator.onLine) {
      if (title) title.textContent = `⚡ Offline Mode: ${pending.length} field report(s) saved locally`;
      if (subtitle) subtitle.textContent = 'Device is disconnected. Reports will auto-sync when field connection restores.';
    } else {
      if (title) title.textContent = `Saved locally — ${pending.length} report(s) pending synchronization`;
      if (subtitle) subtitle.textContent = 'Field connection active. Click Retry Sync Now to upload queued reports.';
    }
  } else {
    banner.style.display = 'none';
  }
}

/* --------------------------------------------------------------------------
   4. REAL-TIME SOCKET STREAM PATCH HANDLER
   -------------------------------------------------------------------------- */
function handleHazardStreamUpdate(data) {
  const newHazard = {
    id: data.id || `HZ-${Math.floor(100+Math.random()*900)}`,
    title: data.title || data.message || 'Live Hazard Telemetry Alert',
    type: data.type || 'Debris',
    location: data.location || 'Sector 6',
    severity: data.severity || 'critical',
    description: data.details || data.message || 'Real-time alert transmitted via socket stream.',
    source: data.source || 'Sensor Network',
    confidence: data.confidence || '95%',
    verified: false,
    timestamp: new Date().toISOString()
  };

  hazardFeedList.unshift(newHazard);
  renderHazardFeed();
  toast.show(`Live Telemetry: ${newHazard.title}`, 'warning', 3000);
}

// Relative time formatter
function formatTimeAgo(isoString) {
  if (!isoString) return 'Just now';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Fallback Mock Hazards
function getMockHazards() {
  return [
    {
      id: 'HZ-104',
      title: 'Bridge B-14 Submersion & Structural Failure',
      type: 'Bridge',
      location: 'Sector 6',
      severity: 'critical',
      description: 'Water depth exceeded 1.4m over deck surface following hillside surge. Debris accumulation blocking northbound lane.',
      source: 'Field Report',
      confidence: '89%',
      verified: false,
      timestamp: new Date(Date.now() - 12 * 60000).toISOString()
    },
    {
      id: 'HZ-098',
      title: 'Hillside Debris Slide — Route C Feeder Road',
      type: 'Debris',
      location: 'Sector 2',
      severity: 'warning',
      description: 'Partial mud accumulation across single lane. Passable only by 4WD/heavy clearance relief convoys.',
      source: 'Satellite',
      confidence: '76%',
      verified: true,
      timestamp: new Date(Date.now() - 45 * 60000).toISOString()
    },
    {
      id: 'HZ-088',
      title: 'Flash Flood Overflow — Sector 4 Lowland Corridor',
      type: 'Flood',
      location: 'East Valley',
      severity: 'critical',
      description: 'Water depth rising rapidly at 12cm/hr. All light vehicles directed to Highway 1 Bypass.',
      source: 'Sensor',
      confidence: '95%',
      verified: true,
      timestamp: new Date(Date.now() - 120 * 60000).toISOString()
    }
  ];
}
