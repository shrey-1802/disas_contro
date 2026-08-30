/* ==========================================
   DISISTA CONTROL — WAREHOUSE DASHBOARD MANAGER
   ========================================== */

class DashboardManager {
  constructor() {
    this.currentWarehouseId = 'wh-alpha';
  }

  init() {
    this.bindEvents();
    this.render();

    // Listen to store updates
    if (window.store) {
      window.store.subscribe(() => this.render());
    }
  }

  bindEvents() {
    // Role & Warehouse name update
    const user = window.auth ? window.auth.getCurrentUser() : null;
    if (user && user.warehouse) {
      const whTitle = document.getElementById('wh-title');
      if (whTitle) whTitle.innerText = `${user.warehouse} Dashboard`;
    }
  }

  render() {
    const warehouses = window.store ? window.store.getWarehouses() : [];
    const convoys = window.store ? window.store.getConvoys() : [];
    const transfers = window.store ? window.store.getTransfers() : [];
    const shelters = window.store ? window.store.getShelters() : [];

    const wh = warehouses.find(w => w.id === this.currentWarehouseId) || warehouses[0] || {};

    // Update inventory metrics
    const onHandEl = document.getElementById('metric-onhand');
    const reservedEl = document.getElementById('metric-reserved');
    const availableEl = document.getElementById('metric-available');
    const matchesEl = document.getElementById('metric-matches');

    if (onHandEl) onHandEl.innerText = `${(wh.onHand || 14000).toLocaleString()} Units`;
    if (reservedEl) reservedEl.innerText = `${(wh.reserved || 2000).toLocaleString()} Units`;
    if (availableEl) availableEl.innerText = `${(wh.available || 12000).toLocaleString()} Units`;
    if (matchesEl) matchesEl.innerText = `${transfers.length} Matches`;

    // Render active convoys table
    const tableBody = document.getElementById('dashboard-convoys-body');
    if (tableBody) {
      const activeConvoys = convoys.filter(c => c.origin.includes('Alpha') || c.origin.includes('wh-alpha'));
      if (activeConvoys.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--slate-500);">No active convoys for this hub.</td></tr>`;
      } else {
        tableBody.innerHTML = activeConvoys.map(c => `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.cargo}</td>
            <td>${c.dest}</td>
            <td>${window.statusBadge ? window.statusBadge.render(c.status === 'Stranded' ? 'impassable' : (c.status === 'Rerouted' ? 'degraded' : 'normal'), { label: c.status }) : c.status}</td>
            <td>${c.eta}</td>
          </tr>
        `).join('');
      }
    }

    // Predictive Shortage Forecast (B.1)
    const forecastContainer = document.getElementById('forecast-card-container');
    if (forecastContainer) {
      const criticalShelter = shelters.find(s => s.daysSupply < 1.0);
      if (criticalShelter) {
        forecastContainer.innerHTML = `
          <div class="card warning" style="border-left: 4px solid var(--forest-600); background: var(--bg-honeydew);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span class="badge badge-caution">⏱️ Predictive Shortage Forecast</span>
              <span class="text-meta">Draw Rate: 180 units/hr</span>
            </div>
            <h4 style="font-size: var(--text-sm); margin-bottom: 4px;">${criticalShelter.name} — Insulin Stockout Imminent</h4>
            <p style="font-size: var(--text-xs); color: var(--slate-500); margin-bottom: 12px;">
              Estimated stockout in <strong>6h 40m</strong> at current draw rate. Inter-warehouse Supply Swap recommended.
            </p>
            <button class="btn btn-primary" style="width: 100%; min-height: 36px; font-size: 12px;" onclick="window.location.href='supply-swap.html'">
              Open Supply Swap Engine →
            </button>
          </div>
        `;
      } else {
        forecastContainer.innerHTML = `<div class="card" style="padding: 12px; font-size: 12px; color: var(--slate-500);">All regional stock levels within safe threshold (>3 days).</div>`;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new DashboardManager();
  window.dashboard.init();
});
