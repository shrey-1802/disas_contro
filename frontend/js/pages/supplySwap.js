/**
 * Supply Swap & Surplus Matching Controller — Warehouse Manager Decisions
 * Interconnected Real-Time Cross-Page State Integration
 */

import { renderGlobalShell } from '../navbar.js';
import { Store } from '../store.js';
import { socketService } from '../socket.js';
import { renderStatusBadge } from '../statusBadge.js';
import { toast } from '../toast.js';

let swapsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderGlobalShell('supply-swap.html');

  swapsList = Store.getSwaps();
  renderSwapCards();

  // Check URL query params for target shelter deep link (e.g. ?target=Shelter06)
  const urlParams = new URLSearchParams(window.location.search);
  const targetParam = urlParams.get('target');
  if (targetParam) {
    const targetSelect = document.getElementById('input-target-destination');
    if (targetSelect) {
      for (let i = 0; i < targetSelect.options.length; i++) {
        if (targetSelect.options[i].value.toLowerCase().includes(targetParam.toLowerCase())) {
          targetSelect.selectedIndex = i;
          break;
        }
      }
    }
    openCreateSwapModal();
  }

  // Filter Listeners
  document.getElementById('filter-urgency')?.addEventListener('change', renderSwapCards);
  document.getElementById('filter-category')?.addEventListener('change', renderSwapCards);
  document.getElementById('filter-route-status')?.addEventListener('change', renderSwapCards);
  document.getElementById('filter-swap-status')?.addEventListener('change', renderSwapCards);

  // Create Swap Modal Handlers
  document.getElementById('btn-create-swap')?.addEventListener('click', openCreateSwapModal);
  document.getElementById('btn-close-swap-modal')?.addEventListener('click', closeCreateSwapModal);
  document.getElementById('btn-cancel-swap')?.addEventListener('click', closeCreateSwapModal);
  document.getElementById('form-create-swap')?.addEventListener('submit', handleCreateSwapSubmit);

  // Reactive store updates across browser tabs/windows
  window.addEventListener('store-updated', () => {
    swapsList = Store.getSwaps();
    renderSwapCards();
  });
});

function renderSwapCards() {
  const container = document.getElementById('supply-swap-list');
  if (!container) return;

  const urgencyFilter = document.getElementById('filter-urgency')?.value || 'all';
  const categoryFilter = document.getElementById('filter-category')?.value || 'all';
  const routeFilter = document.getElementById('filter-route-status')?.value || 'all';
  const swapFilter = document.getElementById('filter-swap-status')?.value || 'all';

  swapsList = Store.getSwaps();
  let filtered = [...swapsList];

  // Urgency Filter
  if (urgencyFilter !== 'all') {
    if (urgencyFilter === 'critical') filtered = filtered.filter(s => s.urgencyHoursRemaining <= 4);
    else if (urgencyFilter === 'warning') filtered = filtered.filter(s => s.urgencyHoursRemaining > 4 && s.urgencyHoursRemaining <= 12);
    else if (urgencyFilter === 'standard') filtered = filtered.filter(s => s.urgencyHoursRemaining > 12);
  }

  // Category Filter
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(s => {
      const item = (s.supplyItem || '').toLowerCase();
      if (categoryFilter === 'insulin') return item.includes('insulin') || item.includes('blood');
      if (categoryFilter === 'nutrition') return item.includes('nutrition') || item.includes('infant');
      if (categoryFilter === 'water') return item.includes('water');
      return true;
    });
  }

  // Route Feasibility Filter
  if (routeFilter !== 'all') {
    filtered = filtered.filter(s => s.routeFeasibility === routeFilter);
  }

  // Swap Status Filter
  if (swapFilter !== 'all') {
    filtered = filtered.filter(s => s.status === swapFilter);
  }

  // Priority Sort: lowest time-to-harm hours first
  filtered.sort((a, b) => a.urgencyHoursRemaining - b.urgencyHoursRemaining);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="background:#FFF; border:1px solid var(--slate-300); border-radius:var(--radius); padding:var(--space-xl); text-align:center; color:var(--slate-700);">
        <p style="font-size:1.1rem; font-weight:600; margin-bottom:4px;">No Surplus Supply Swaps Match Filter Criteria</p>
        <p class="text-xs">Adjust urgency or route feasibility filters to view regional warehouse transfers.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(s => {
    const isApproved = s.status === 'APPROVED' || s.status === 'EN_ROUTE';
    const isBlocked = s.routeFeasibility === 'BLOCKED';

    return `
      <div class="swap-item-card" id="card-${s.id}">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="font-bold text-sm" style="color:var(--forest-700);">${s.id}</span>
            <span class="priority-badge ${s.urgencyHoursRemaining <= 4 ? 'priority-badge--critical' : 'priority-badge--high'}">
              ⚡ ${s.urgencyHoursRemaining}h Time-to-Harm
            </span>
          </div>
          <div style="font-weight:700; font-size:1.05rem; color:var(--slate-900);">${s.quantity} ${s.unit} ${s.supplyItem}</div>
          <div class="text-xs" style="color:var(--slate-700); margin-top:2px;">
            Origin: <strong>${s.sourceWarehouse}</strong> → Target: <strong>${s.targetDestination}</strong>
          </div>
        </div>

        <div>
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Route Feasibility</div>
          <div style="margin-top:4px;">
            ${renderStatusBadge(s.routeFeasibility).outerHTML}
          </div>
        </div>

        <div>
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Swap Status</div>
          <div style="margin-top:4px; font-weight:600; font-size:0.85rem;" class="${isApproved ? 'text-forest-700' : 'text-slate-800'}">
            ${isApproved ? '✅ Approved & Dispatched' : '⏳ Pending Manager Action'}
          </div>
        </div>

        <div>
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Requester</div>
          <div class="text-xs" style="color:var(--slate-800); margin-top:4px;">${s.requester}</div>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          ${!isApproved ? `
            <button class="button button--primary text-xs btn-approve-swap" data-id="${s.id}" ${isBlocked ? 'disabled title="Route is impassable"' : ''}>
              ✅ Approve & Dispatch
            </button>
            <a href="live-map.html" class="button button--secondary text-xs">🗺️ Inspect Route</a>
          ` : `
            <a href="convoy-dispatch.html" class="button button--secondary text-xs">🚛 Track Convoy Dispatch</a>
          `}
        </div>
      </div>
    `;
  }).join('');

  // Bind Approve Action Listeners
  document.querySelectorAll('.btn-approve-swap').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      handleApproveSwap(id);
    });
  });
}

function handleApproveSwap(id) {
  const result = Store.approveSwap(id);
  if (!result) return;

  toast.success(`Supply Swap ${id} approved! Relief Convoy ${result.convoyId} automatically dispatched.`);
  renderSwapCards();

  // Automatically navigate to convoy dispatch tracking after 1 second
  setTimeout(() => {
    window.location.href = `convoy-dispatch.html?convoy=${result.convoyId}`;
  }, 1000);
}

function openCreateSwapModal() {
  const modal = document.getElementById('modal-create-swap');
  if (modal) modal.style.display = 'flex';
}

function closeCreateSwapModal() {
  const modal = document.getElementById('modal-create-swap');
  if (modal) modal.style.display = 'none';
}

function handleCreateSwapSubmit(e) {
  e.preventDefault();
  const target = document.getElementById('input-target-destination')?.value;
  const item = document.getElementById('input-supply-item')?.value;
  const qty = document.getElementById('input-quantity')?.value;
  const hours = document.getElementById('input-urgency-hours')?.value;

  const newSwap = {
    id: `SW-${Math.floor(200 + Math.random() * 800)}`,
    sourceWarehouse: 'Regional Warehouse Alpha',
    targetDestination: target,
    supplyItem: item,
    quantity: Number(qty),
    unit: 'units',
    urgencyHoursRemaining: Number(hours),
    routeFeasibility: 'SAFE',
    status: 'PENDING_APPROVAL',
    requester: 'Regional Operations Manager',
    createdAt: new Date().toISOString()
  };

  const swaps = Store.getSwaps();
  swaps.unshift(newSwap);
  Store.saveSwaps(swaps);

  closeCreateSwapModal();
  renderSwapCards();
  toast.success(`New Supply Swap offer created for ${target}!`);
}
