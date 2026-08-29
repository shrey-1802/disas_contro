import { renderGlobalShell } from '../navbar.js';
import { Store } from '../store.js';
import { socketService } from '../socket.js';
import { renderStatusBadge } from '../statusBadge.js';
import { toast } from '../toast.js';

// Mandatory static cargo priority lookup table as required by specifications
const CARGO_PRIORITY = {
  insulin: 1,
  blood: 1,
  infant_nutrition: 2,
  water: 3,
  general: 4
};

let missionsList = [];
let selectedConvoyIds = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  renderGlobalShell('convoy-dispatch.html');

  // Load telemetry data from Store
  missionsList = Store.getMissions();
  renderConvoyTable();

  // Highlight specific convoy if passed via query parameter (e.g. ?convoy=CV-014)
  const urlParams = new URLSearchParams(window.location.search);
  const targetConvoyId = urlParams.get('convoy');
  if (targetConvoyId) {
    setTimeout(() => {
      const row = document.getElementById(`row-${targetConvoyId}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.style.outline = '3px solid var(--forest-600)';
        row.style.backgroundColor = 'var(--sage-100)';
      }
    }, 200);
  }

  // Event Listeners for Filters
  document.getElementById('filter-cargo-priority')?.addEventListener('change', renderConvoyTable);
  document.getElementById('filter-status')?.addEventListener('change', renderConvoyTable);

  // Bulk Selection Handlers
  document.getElementById('select-all-convoys')?.addEventListener('change', handleSelectAll);
  document.getElementById('btn-bulk-dispatch')?.addEventListener('click', openBulkConfirmModal);
  document.getElementById('btn-cancel-bulk')?.addEventListener('click', closeBulkModal);
  document.getElementById('btn-close-bulk-modal')?.addEventListener('click', closeBulkModal);
  document.getElementById('btn-commit-bulk')?.addEventListener('click', executeBulkDispatch);

  // New Mission Modal Handlers
  document.getElementById('btn-new-dispatch')?.addEventListener('click', openNewDispatchModal);
  document.getElementById('btn-close-modal')?.addEventListener('click', closeNewDispatchModal);
  document.getElementById('btn-cancel-dispatch')?.addEventListener('click', closeNewDispatchModal);
  document.getElementById('form-new-dispatch')?.addEventListener('submit', handleNewDispatchSubmit);

  // Reactive store update listeners
  window.addEventListener('store-updated', () => {
    missionsList = Store.getMissions();
    renderConvoyTable();
  });
});


/* --------------------------------------------------------------------------
   1. CARGO PRIORITY CALCULATOR
   -------------------------------------------------------------------------- */
function deriveCargoPriority(cargoText) {
  if (!cargoText) return 4;
  const lower = cargoText.toLowerCase();

  if (lower.includes('insulin') || lower.includes('blood')) {
    return CARGO_PRIORITY.insulin;
  }
  if (lower.includes('infant') || lower.includes('nutrition') || lower.includes('formula')) {
    return CARGO_PRIORITY.infant_nutrition;
  }
  if (lower.includes('water')) {
    return CARGO_PRIORITY.water;
  }
  return CARGO_PRIORITY.general;
}

function getPriorityBadgeHTML(priorityTier) {
  switch (priorityTier) {
    case 1:
      return `<span class="priority-badge priority-badge--critical">CRITICAL (TIER 1)</span>`;
    case 2:
      return `<span class="priority-badge priority-badge--high">HIGH (TIER 2)</span>`;
    case 3:
      return `<span class="priority-badge priority-badge--medium">MEDIUM (TIER 3)</span>`;
    default:
      return `<span class="priority-badge priority-badge--low">LOW (TIER 4)</span>`;
  }
}

/* --------------------------------------------------------------------------
   2. TABLE RENDER ENGINE & REROUTED VISUALIZATION
   -------------------------------------------------------------------------- */
function renderConvoyTable() {
  const tbody = document.getElementById('convoy-table-body');
  if (!tbody) return;

  const priorityFilter = document.getElementById('filter-cargo-priority')?.value || 'all';
  const statusFilter = document.getElementById('filter-status')?.value || 'all';

  // Process & Sort Missions by derived cargo priority
  let filtered = missionsList.map(m => {
    const calculatedPriority = deriveCargoPriority(m.cargo);
    return { ...m, derivedPriority: calculatedPriority };
  });

  // Apply Priority Filter
  if (priorityFilter !== 'all') {
    const tierMap = { critical: 1, high: 2, medium: 3, low: 4 };
    const targetTier = tierMap[priorityFilter];
    if (targetTier) {
      filtered = filtered.filter(m => m.derivedPriority === targetTier);
    }
  }

  // Apply Status Filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter(m => m.status === statusFilter);
  }

  // Sort: Tier 1 (Critical) top
  filtered.sort((a, b) => a.derivedPriority - b.derivedPriority);

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:var(--space-lg); color:var(--slate-600);">
          No active relief convoys match the selected filter criteria.
        </td>
      </tr>
    `;
    updateBulkActionBar();
    return;
  }

  tbody.innerHTML = filtered.map(m => {
    const id = m.convoy_id || m.id;
    const isChecked = selectedConvoyIds.has(id);
    const isRerouted = m.status === 'Rerouted';

    // Rerouted route visualization: OLD (slate, struck-through) -> NEW (forest, active)
    let routeHTML = '';
    if (isRerouted) {
      const oldRoute = m.old_route || 'Route B (Submerged)';
      const newRoute = m.route || 'Feeder Road C';
      const reason = m.reroute_reason || 'Bridge B-14 Structurally Unsafe';
      const delay = m.eta_delta || '+38 min delay';

      routeHTML = `
        <div class="reroute-visualization">
          <div class="old-route">OLD: ${oldRoute}</div>
          <div class="new-route">NEW: ${newRoute}</div>
          <span class="reroute-reason">Reason: ${reason} (${delay})</span>
        </div>
      `;
    } else {
      routeHTML = `
        <div style="font-size:var(--font-size-xs); color:var(--slate-800); font-weight:600;">
          ${m.route || 'Highway 1 Direct'}
        </div>
        <div class="text-xs" style="color:var(--slate-600);">ETA: ${m.eta || 'Nominal'}</div>
      `;
    }

    return `
      <tr id="row-${id}">

        <td style="text-align:center;">
          <input type="checkbox" class="convoy-checkbox" data-id="${id}" ${isChecked ? 'checked' : ''}>
        </td>
        <td class="font-semibold text-mono">${id}</td>
        <td>${m.cargo || 'Relief Supplies'}</td>
        <td>${getPriorityBadgeHTML(m.derivedPriority)}</td>
        <td class="text-sm">${m.origin || 'Logistics Hub'}</td>
        <td class="text-sm">${m.destination || 'Field Shelter'}</td>
        <td>
          <div style="margin-bottom:4px;">${renderStatusBadge(m.status)}</div>
          ${routeHTML}
        </td>
        <td class="text-sm">${m.driver || 'Radio Fleet Command'}</td>
        <td>
          <a href="live-map.html?convoy=${id}" class="button button--secondary text-xs">🗺️ Trace on Map</a>
        </td>
      </tr>
    `;
  }).join('');

  // Rebind Checkbox Listeners
  document.querySelectorAll('.convoy-checkbox').forEach(cb => {
    cb.addEventListener('change', handleRowCheckboxChange);
  });

  updateBulkActionBar();
}

/* --------------------------------------------------------------------------
   3. BULK SELECTION & OPERATIONAL CONFIRMATION WORKFLOW
   -------------------------------------------------------------------------- */
function handleRowCheckboxChange(e) {
  const id = e.target.getAttribute('data-id');
  if (e.target.checked) {
    selectedConvoyIds.add(id);
  } else {
    selectedConvoyIds.delete(id);
  }

  updateBulkActionBar();
}

function handleSelectAll(e) {
  const checkboxes = document.querySelectorAll('.convoy-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = e.target.checked;
    const id = cb.getAttribute('data-id');
    if (e.target.checked) {
      selectedConvoyIds.add(id);
    } else {
      selectedConvoyIds.delete(id);
    }
  });

  updateBulkActionBar();
}

function updateBulkActionBar() {
  const bar = document.getElementById('bulk-action-bar');
  const countText = document.getElementById('bulk-selected-count');

  if (!bar || !countText) return;

  if (selectedConvoyIds.size > 0) {
    bar.style.display = 'flex';
    countText.textContent = `${selectedConvoyIds.size} Convoy${selectedConvoyIds.size > 1 ? 's' : ''} Selected`;
  } else {
    bar.style.display = 'none';
  }
}

function openBulkConfirmModal() {
  if (selectedConvoyIds.size === 0) return;

  const modal = document.getElementById('modal-bulk-confirm');
  const targetRouteSelect = document.getElementById('bulk-target-route');
  const selectedRoute = targetRouteSelect ? targetRouteSelect.value : 'Route C (Feeder Corridor)';

  const convoyListStr = Array.from(selectedConvoyIds).join(', ');
  const convoysElem = document.getElementById('bulk-modal-convoys');
  const routeElem = document.getElementById('bulk-modal-target-route');
  const commitBtn = document.getElementById('btn-commit-bulk');

  if (convoysElem) convoysElem.textContent = convoyListStr;
  if (routeElem) routeElem.textContent = selectedRoute;

  // Requirement: Direct operational confirmation language (e.g. "Dispatch 4 Convoys to Route C")
  if (commitBtn) {
    commitBtn.textContent = `Dispatch ${selectedConvoyIds.size} Convoy${selectedConvoyIds.size > 1 ? 's' : ''} to ${selectedRoute.split(' ')[0]}`;
  }

  if (modal) modal.style.display = 'flex';
}

function closeBulkModal() {
  const modal = document.getElementById('modal-bulk-confirm');
  if (modal) modal.style.display = 'none';
}

function executeBulkDispatch() {
  const targetRouteSelect = document.getElementById('bulk-target-route');
  const selectedRoute = targetRouteSelect ? targetRouteSelect.value : 'Route C (Feeder Corridor)';
  const count = selectedConvoyIds.size;

  selectedConvoyIds.forEach(id => {
    const idx = missionsList.findIndex(m => (m.convoy_id || m.id) === id);
    if (idx !== -1) {
      missionsList[idx].status = 'On Route';
      missionsList[idx].route = selectedRoute;
      missionsList[idx].reroute_reason = 'Cleared corridor bulk assignment';
      missionsList[idx].eta_delta = 'On Time';
    }
  });

  closeBulkModal();
  selectedConvoyIds.clear();
  const selectAllCb = document.getElementById('select-all-convoys');
  if (selectAllCb) selectAllCb.checked = false;

  renderConvoyTable();
  toast.show(`Operational Dispatch Executed: ${count} convoy(s) assigned to ${selectedRoute}`, 'safe', 3500);
}

/* --------------------------------------------------------------------------
   4. NEW MISSION DISPATCH MODAL WORKFLOW
   -------------------------------------------------------------------------- */
function openNewDispatchModal() {
  const modal = document.getElementById('modal-new-dispatch');
  if (modal) modal.style.display = 'flex';
}

function closeNewDispatchModal() {
  const modal = document.getElementById('modal-new-dispatch');
  if (modal) modal.style.display = 'none';
}

async function handleNewDispatchSubmit(e) {
  e.preventDefault();

  const cargo = document.getElementById('input-cargo')?.value;
  const driver = document.getElementById('input-driver')?.value;
  const origin = document.getElementById('input-origin')?.value;
  const destination = document.getElementById('input-destination')?.value;
  const route = document.getElementById('input-route')?.value;

  const newMission = {
    id: `CV-${Math.floor(100 + Math.random() * 900)}`,
    cargo,
    driver,
    origin,
    destination,
    route,
    status: 'On Route',
    eta: '40m',
    eta_delta: 'Nominal',
    reroute_reason: 'Optimal initial route cleared'
  };

  try {
    await api.createMission(newMission).catch(() => null);
  } catch (err) {
    console.warn('[ConvoyDispatch] API mission create fallback:', err.message);
  }

  missionsList.unshift(newMission);
  closeNewDispatchModal();
  document.getElementById('form-new-dispatch')?.reset();

  renderConvoyTable();
  toast.show(`Emergency Mission ${newMission.id} successfully dispatched!`, 'safe', 3000);
}

/* --------------------------------------------------------------------------
   5. REAL-TIME SOCKET STREAM PATCH HANDLER
   -------------------------------------------------------------------------- */
function handleMissionUpdateStream(updatedMission) {
  const targetId = updatedMission.id || updatedMission.convoy_id;
  const idx = missionsList.findIndex(m => (m.convoy_id || m.id) === targetId);

  if (idx !== -1) {
    Object.assign(missionsList[idx], updatedMission);
  } else {
    missionsList.unshift(updatedMission);
  }

  renderConvoyTable();
  toast.show(`Real-Time Telemetry: Convoy ${targetId} row updated`, 'safe', 2500);
}

// Fallback Mock Missions
function getMockMissions() {
  return [
    {
      id: 'CV-014',
      cargo: 'Refrigerated Insulin & Blood Bags',
      origin: 'Regional Logistics Hub A',
      destination: 'Shelter 06 (Sector 4)',
      route: 'Feeder Road C',
      old_route: 'Route B (Bridge Submerged)',
      status: 'Rerouted',
      reroute_reason: 'Bridge B-14 Submerged in 1.4m floodwater',
      eta: '1h 42m',
      eta_delta: '+38 min',
      driver: 'Driver Marcus V. (CH-4)'
    },
    {
      id: 'CV-009',
      cargo: 'Infant Nutrition & Formula',
      origin: 'Logistics Hub B',
      destination: 'Shelter 02 (Sector 1)',
      route: 'Highway 1 Direct',
      status: 'On Route',
      reroute_reason: 'Optimal clear corridor',
      eta: '45m',
      eta_delta: 'On Time',
      driver: 'Driver Sarah L. (CH-2)'
    },
    {
      id: 'CV-022',
      cargo: 'Clean Drinking Water Rations',
      origin: 'Water Purification Hub 3',
      destination: 'Shelter 09 (Sector 6)',
      route: 'Sector 6 Outer Ring',
      status: 'Stranded',
      old_route: 'Sector 6 Main Arterial',
      reroute_reason: 'Hillside debris slide blocking pass',
      eta: '2h 10m',
      eta_delta: '+1h 15m',
      driver: 'Driver Alex K. (CH-9)'
    }
  ];
}
