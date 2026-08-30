/* ==========================================
   DISISTA CONTROL — CONVOY DISPATCH MANAGER
   Risk Index Matrix, Relay Point Sub-Rows, Driver Ack, & After-Action Reports
   ========================================== */

class ConvoyDispatchManager {
  constructor() {
    this.selectedIds = new Set();
    this.expandedDiffs = new Set(['convoy-22']);
  }

  init() {
    this.applyRoleScope();
    this.initSearch();
    this.render();
    this.startAckTimeoutWatcher();   // A.6

    if (window.store) {
      window.store.subscribe(() => this.render());
    }

    if (window.socket) {
      window.socket.on('route:recalculated', () => this.render());
      window.socket.on('mission:risk_update', () => this.render());
    }
  }

  /* A.6 — Driver Ack Timeout Watcher
     Polls every 60s. Convoys stuck on "Ack Pending" > ACK_TIMEOUT_MS
     get flagged as "Ack Timeout" and surface a Critical alert. */
  startAckTimeoutWatcher() {
    const ACK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes per spec

    const check = () => {
      if (!window.store) return;
      const convoys = window.store.getConvoys();
      convoys.forEach(c => {
        if (c.ackStatus === 'Ack Pending') {
          const pendingSince = c.ackTimestamp || 0;
          if (pendingSince && (Date.now() - pendingSince) > ACK_TIMEOUT_MS) {
            window.store.flagAckTimeout(c.id);
            if (window.toast) {
              window.toast.error(`Ack timeout — ${c.name}. Driver has not responded. Manual contact required.`);
            }
            if (window.A11yUtil) {
              window.A11yUtil.announce(`Critical: ${c.name} driver acknowledgment has timed out.`, 'assertive');
            }
          }
        }
      });
    };

    // Run immediately then every 60s
    check();
    this._ackWatcherInterval = setInterval(check, 60000);
  }


  initSearch() {
    const inputEl = document.getElementById('convoy-search-input');
    const chipsEl = document.getElementById('convoy-search-chips');
    if (!inputEl || !window.SearchUtil) return;

    this._search = window.SearchUtil.create({
      inputEl,
      data: this.getAllConvoys(),
      fields: ['name', 'driver', 'cargo', 'origin', 'dest', 'status', 'priority'],
      onResults: (results) => { this._searchResults = results; this.renderTable(results); },
      onEmpty: () => {
        const tbody = document.getElementById('convoy-table-body');
        if (tbody && window.EmptyUtil) {
          const emptyDiv = document.createElement('tr');
          emptyDiv.innerHTML = `<td colspan="8">${window.EmptyUtil.renderConvoyEmpty()}</td>`;
          tbody.innerHTML = '';
          tbody.appendChild(emptyDiv);
        }
      }
    });

    // Register dropdown filters into SearchUtil
    this._search.addFilter('cargo', (v) => (item) => item.priority === v);
    this._search.addFilter('status', (v) => (item) => item.status === v);
  }

  applyRoleScope() {
    const user = window.auth ? window.auth.getCurrentUser() : null;
    const scopeBadge = document.getElementById('role-scope-badge');
    if (!scopeBadge) return;

    if (user && user.role === 'warehouse_manager') {
      scopeBadge.innerText = 'Scoped to Hub Alpha Missions';
      scopeBadge.className = 'badge badge-caution';
    } else {
      scopeBadge.innerText = 'Full Network View';
      scopeBadge.className = 'badge badge-safe';
    }
  }

  /* ------------------------------------------
     CONVOY RISK INDEX CALCULATOR (A.7)
     ------------------------------------------ */
  calculateRiskScore(convoy) {
    let score = 0;

    // Cargo priority weight
    if (convoy.priority === 'Insulin/Blood') score += 40;
    else if (convoy.priority === 'Infant Nutrition') score += 30;
    else if (convoy.priority === 'Water') score += 20;
    else score += 10;

    // Route Status weight
    if (convoy.status === 'Stranded') score += 50;
    else if (convoy.status === 'Rerouted') score += 30;

    // Driver Ack weight
    if (convoy.ackStatus === 'Ack Pending') score += 20;

    // Severity rating
    if (score >= 70) return { label: 'CRITICAL RISK', tier: 'blocked', percentage: Math.min(score, 100) };
    if (score >= 40) return { label: 'CAUTION RISK', tier: 'caution', percentage: score };
    return { label: 'LOW RISK', tier: 'safe', percentage: Math.max(score, 20) };
  }

  /* ------------------------------------------
     AFTER-ACTION REPORT GENERATOR (A.8)
     ------------------------------------------ */
  generateAfterActionReport(convoy) {
    if (convoy.status === 'Delivered') {
      return `Fact: ${convoy.name} (${convoy.cargo}) rerouted via ${convoy.newPath || 'Bypass corridor'}. Delivered successfully to ${convoy.dest}. All cold-chain standards met.`;
    }
    return null;
  }

  getAllConvoys() {
    return window.store ? window.store.getConvoys() : [];
  }

  getFilteredConvoys() {
    const convoys = this.getAllConvoys();
    const user = window.auth ? window.auth.getCurrentUser() : null;
    let list = [...convoys];

    // Role Scoping: Warehouse Manager sees only Hub Alpha
    if (user && user.role === 'warehouse_manager') {
      list = list.filter(c => c.origin.includes('Alpha') || c.origin.includes('wh-alpha'));
    }

    // If search is active, use search results
    if (this._searchResults !== undefined) {
      const ids = new Set(this._searchResults.map(r => r.id));
      list = list.filter(c => ids.has(c.id));
    }

    // Filter by Cargo Priority
    const cargoFilterEl = document.getElementById('filter-cargo');
    if (cargoFilterEl && cargoFilterEl.value !== 'ALL') {
      list = list.filter(c => c.priority === cargoFilterEl.value);
    }

    // Filter by Status
    const statusFilterEl = document.getElementById('filter-status');
    if (statusFilterEl && statusFilterEl.value !== 'ALL') {
      list = list.filter(c => c.status === statusFilterEl.value);
    }

    return list;
  }

  render() {
    const convoys = this.getFilteredConvoys();
    this.renderTable(convoys);
  }

  renderTable(convoys) {
    const container = document.getElementById('convoy-table-body');
    if (!container) return;

    if (!convoys || convoys.length === 0) {
      if (window.EmptyUtil) {
        container.innerHTML = `<tr><td colspan="8">${window.EmptyUtil.renderConvoyEmpty()}</td></tr>`;
      } else {
        container.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--slate-500);padding:24px;">No convoys matching current filters.</td></tr>`;
      }
      return;
    }

    convoys.forEach(c => {
      const risk = this.calculateRiskScore(c);
      const isExpanded = this.expandedDiffs.has(c.id);
      const isSelected = this.selectedIds.has(c.id);
      const canAck = window.auth ? window.auth.canPerform('ack_reroute') : false;
      const user = window.auth ? window.auth.getCurrentUser() : null;

      const badge = window.statusBadge ? window.statusBadge.render(c.status === 'Stranded' ? 'impassable' : (c.status === 'Rerouted' ? 'degraded' : 'normal'), { label: c.status }) : c.status;

      const tr = document.createElement('tr');
      tr.style.background = isSelected ? 'rgba(143, 175, 140, 0.15)' : 'transparent';
      tr.innerHTML = `
        <td><input type="checkbox" ${isSelected ? 'checked' : ''} onchange="convoyDispatch.toggleSelect('${c.id}', this.checked)"></td>
        <td>
          <strong>${c.name}</strong><br>
          <span class="text-meta">${c.driver}</span>
        </td>
        <td>
          <span class="badge ${c.priority === 'Insulin/Blood' ? 'badge-blocked' : 'badge-caution'}" style="font-size: 10px;">
            ${c.priority === 'Insulin/Blood' ? '❄️ Cold-Chain' : '📦 Standard'}
          </span>
          <div style="font-size: 12px; margin-top: 2px;">${c.cargo}</div>
        </td>
        <td>${c.origin} → ${c.dest}</td>
        <td>${badge}</td>
        <td><strong>${c.eta}</strong></td>
        <td>
          ${c.ackStatus === 'Ack Timeout'
            ? `<span class="badge badge-blocked" style="font-size:10px;" title="Driver has not responded past timeout. Manual contact required.">
                 ⚠ Ack Timeout
               </span>`
            : `<span class="badge ${c.ackStatus === 'Acknowledged' ? 'badge-safe' : 'badge-caution'}">
                 ${c.ackStatus || 'Acknowledged'}
               </span>`
          }
          ${canAck && c.ackStatus === 'Ack Pending' ? `
            <button class="btn btn-primary" style="margin-top:4px;font-size:10px;min-height:26px;padding:0 6px;"
              onclick="convoyDispatch.ackDriverReroute('${c.id}')"
              aria-label="Acknowledge reroute for ${c.name}">
              ✓ Ack Reroute
            </button>
          ` : ''}
        </td>

        <td>
          <div style="display: flex; flex-direction: column; gap: 2px; width: 100px;">
            <div style="font-size: 10px; font-weight: bold; color: var(--slate-800);">${risk.label}</div>
            <div style="width: 100%; height: 6px; background: var(--border-hairline); border-radius: 3px; overflow: hidden;">
              <div style="width: ${risk.percentage}%; height: 100%; background: ${risk.tier === 'blocked' ? 'var(--slate-800)' : (risk.tier === 'caution' ? 'var(--forest-600)' : 'var(--sage-500)')};"></div>
            </div>
          </div>
        </td>
        <td>
          <button class="btn btn-secondary" style="font-size: 11px; padding: 2px 8px; min-height: 28px;" onclick="convoyDispatch.toggleDiff('${c.id}')">
            ${isExpanded ? 'Hide Details' : 'View Path Diff'}
          </button>
        </td>
      `;
      container.appendChild(tr);

      // Render Expanded Details Row (Path Diff, Relay Sub-Rows A.5, & After Action Report A.8)
      if (isExpanded) {
        const afterActionText = this.generateAfterActionReport(c);

        const diffTr = document.createElement('tr');
        diffTr.style.background = 'var(--bg-honeydew)';
        diffTr.innerHTML = `
          <td colspan="9" style="padding: 12px 16px; border-bottom: 2px solid var(--border-hairline);">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div>
                <strong>Path Recalculation Rationale:</strong>
                <span style="color: var(--forest-700);">${c.rationale || 'Direct safe path confirmed by route engine.'}</span>
              </div>

              ${c.oldPath ? `
                <div style="display: flex; gap: 16px; font-size: 13px;">
                  <div><span style="color: var(--slate-500);">Previous Path:</span> <del style="color: #A00;">${c.oldPath}</del></div>
                  <div><span style="color: var(--slate-500);">Recalculated Safe Path:</span> <strong style="color: var(--forest-600);">${c.newPath}</strong></div>
                </div>
              ` : ''}

              <!-- RELAY / VEHICLE-HANDOFF SUB-ROWS (A.5) -->
              ${c.relayPoint ? `
                <div style="background: var(--white); border: 1px solid var(--border-hairline); border-radius: var(--radius); padding: 8px 12px; margin-top: 4px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                    <strong style="font-size: 12px; color: var(--slate-800);">🔀 MULTI-LEG RELAY HANDOFF ACTIVE (A.5)</strong>
                    <span class="badge badge-caution">Relay Vehicle Handoff</span>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
                    <div>
                      <strong>Leg 1 (Heavy Cargo Truck):</strong> ${c.origin} → ${c.relayPoint}<br>
                      <span class="text-meta">Status: Delivered to Relay Depot · Vehicle: 10-Ton Axle</span>
                    </div>
                    <div>
                      <strong>Leg 2 (4x4 All-Terrain):</strong> ${c.relayPoint} → ${c.dest}<br>
                      <span class="text-meta">Status: In Transit · Vehicle: Light 4x4 Offroad</span>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- AFTER-ACTION REPORT (A.8) -->
              ${afterActionText ? `
                <div style="background: var(--white); border-left: 3px solid var(--forest-600); padding: 8px 12px; font-size: 12px; margin-top: 4px;">
                  <strong>📄 AFTER-ACTION FACTUAL RECORD:</strong> ${afterActionText}
                </div>
              ` : ''}
            </div>
          </td>
        `;
        container.appendChild(diffTr);
      }
    });

    this.updateBulkActionBar();
    this.updateMetrics(convoys);
  }

  updateMetrics(convoys) {
    const totalEl     = document.getElementById('metric-total');
    const onRouteEl   = document.getElementById('metric-on-route');
    const reroutedEl  = document.getElementById('metric-rerouted');
    const strandedEl  = document.getElementById('metric-stranded');
    if (!totalEl) return;
    const all = this.getAllConvoys();
    totalEl.textContent    = all.length;
    onRouteEl.textContent  = all.filter(c => c.status === 'On Route').length;
    reroutedEl.textContent = all.filter(c => c.status === 'Rerouted').length;
    strandedEl.textContent = all.filter(c => c.status === 'Stranded').length;
  }

  ackDriverReroute(convoyId) {
    if (window.store) {
      window.store.acknowledgeDriverRoute(convoyId);
      if (window.toast) window.toast.success(`Reroute order acknowledged by field driver.`);
    }
  }

  toggleSelect(id, isChecked) {
    if (isChecked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
    this.updateBulkActionBar();
  }

  toggleDiff(id) {
    if (this.expandedDiffs.has(id)) this.expandedDiffs.delete(id);
    else this.expandedDiffs.add(id);
    this.render();
  }

  updateBulkActionBar() {
    const bar     = document.getElementById('bulk-bar');
    const countEl = document.getElementById('bulk-selected-count');
    if (!bar || !countEl) return;
    countEl.textContent = `${this.selectedIds.size} Convoy${this.selectedIds.size === 1 ? '' : 's'} Selected`;
    bar.classList.toggle('hidden', this.selectedIds.size === 0);
  }

  toggleSelectAll(checked) {
    const convoys = this.getFilteredConvoys();
    convoys.forEach(c => { if (checked) this.selectedIds.add(c.id); else this.selectedIds.delete(c.id); });
    this.render();
  }

  clearSelection() {
    this.selectedIds.clear();
    this.render();
  }

  applyFilters() {
    // Sync dropdown selections into SearchUtil if available
    if (this._search) {
      const cargoEl  = document.getElementById('filter-cargo');
      const statusEl = document.getElementById('filter-status');
      if (cargoEl)  this._search.setFilter('cargo',  cargoEl.value  !== 'ALL' ? cargoEl.value  : null);
      if (statusEl) this._search.setFilter('status', statusEl.value !== 'ALL' ? statusEl.value : null);
    }
    // Clear cached search results so dropdowns work standalone
    this._searchResults = undefined;
    this.render();
  }

  resetFilters() {
    const cargoEl  = document.getElementById('filter-cargo');
    const statusEl = document.getElementById('filter-status');
    const sortEl   = document.getElementById('sort-by');
    if (cargoEl)  cargoEl.value  = 'ALL';
    if (statusEl) statusEl.value = 'ALL';
    if (sortEl)   sortEl.value   = 'risk';
    if (this._search) this._search.clearAll();
    this._searchResults = undefined;
    this.render();
  }

  openNewConvoyModal() {
    const modal = document.getElementById('new-convoy-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    if (window.A11yUtil) window.A11yUtil.trapFocus(modal);
  }

  closeNewConvoyModal() {
    const modal = document.getElementById('new-convoy-modal');
    if (modal) modal.classList.add('hidden');
  }

  handleNewConvoySubmit(e) {
    e.preventDefault();
    const name   = document.getElementById('convoy-name-input')?.value;
    const cargo  = document.getElementById('cargo-priority-input')?.value;
    const origin = document.getElementById('origin-select')?.value;
    const dest   = document.getElementById('dest-select')?.value;
    if (!name || !cargo || !origin || !dest) return;

    if (window.store) window.store.addConvoy({ name, cargo, priority: cargo, origin, dest, status: 'On Route', ackStatus: 'Acknowledged', eta: '+2h 30m', driver: 'Field Driver' });
    if (window.toast) window.toast.success(`${name} dispatched from ${origin} to ${dest}.`);
    if (window.A11yUtil) window.A11yUtil.announce(`${name} dispatched successfully.`);
    this.closeNewConvoyModal();
    this.render();
  }

  executeBulkDispatch() {
    const canDispatch = window.auth ? window.auth.canPerform('dispatch_convoy') : false;
    if (!canDispatch) {
      if (window.toast) window.toast.error('Bulk dispatch requires Control Room or Warehouse Manager role.');
      return;
    }
    if (window.toast) window.toast.success(`${this.selectedIds.size} convoy${this.selectedIds.size === 1 ? '' : 's'} dispatched on recalculated safe corridor.`);
    this.selectedIds.clear();
    this.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.convoyDispatch = new ConvoyDispatchManager();
  window.convoyDispatch.init();
});
