/* ==========================================
   DISISTA CONTROL — CONVOY DISPATCH MANAGER
   Risk Index Matrix, Path Diffs, & Fleet Control
   ========================================== */

class ConvoyDispatchManager {
  constructor() {
    this.convoys = [
      {
        id: 'convoy-14',
        name: 'Convoy 14',
        cargo: 'Insulin & Blood Products',
        priority: 'Insulin/Blood',
        origin: 'Hub Alpha',
        dest: 'Shelter 12',
        status: 'On Route',
        driver: 'Unit-4 (Driver Mark)',
        ackStatus: 'Acknowledged',
        eta: '14:20 UTC',
        riskLevel: 'medium',
        oldPath: null,
        newPath: 'Route 4 Direct',
        rationale: 'Nominal route active. Safe clearance verified.'
      },
      {
        id: 'convoy-22',
        name: 'Convoy 22',
        cargo: 'Infant Nutrition & Water',
        priority: 'Infant Nutrition',
        origin: 'Hub Bravo',
        dest: 'Shelter 04',
        status: 'Rerouted',
        driver: 'Unit-9 (Driver Elena)',
        ackStatus: 'Acknowledged',
        eta: '16:05 UTC',
        riskLevel: 'low',
        oldPath: 'Route 4 Corridor → Bridge B14',
        newPath: 'Bypass 2 via Rift Highway → Shelter 04',
        rationale: 'Bridge B14 submerged -> Rerouted via Bypass 2 (+14m)'
      },
      {
        id: 'convoy-09',
        name: 'Convoy 09',
        cargo: 'General Relief Supplies',
        priority: 'General',
        origin: 'Hub Charlie',
        dest: 'Shelter 19',
        status: 'Stranded',
        driver: 'Unit-2 (Driver David)',
        ackStatus: 'Ack Pending',
        eta: 'Delayed (Blocked)',
        riskLevel: 'high',
        oldPath: 'Coastal Highway 8',
        newPath: 'Pending Safe Corridor Assignment',
        rationale: 'Bridge B14 Impassable & Route 4 Flash Flood. Relay handoff required at Sector 8.',
        relayPoint: 'Sector 8 Relay Depot (Vehicle Transfer Required)'
      }
    ];

    this.selectedIds = new Set();
    this.expandedDiffs = new Set(['convoy-22']); // Open by default for demo
  }

  init() {
    this.applyRoleScope();
    this.render();
  }

  applyRoleScope() {
    const user = auth.getCurrentUser();
    const scopeBadge = document.getElementById('role-scope-badge');
    if (user && user.role === 'warehouse_manager') {
      scopeBadge.innerText = 'Scoped to Hub Alpha Missions';
      scopeBadge.className = 'badge badge-caution';
    } else {
      scopeBadge.innerText = 'Full Network View';
      scopeBadge.className = 'badge badge-safe';
    }
  }

  getFilteredConvoys() {
    const user = auth.getCurrentUser();
    let list = [...this.convoys];

    // Role Scoping: Warehouse Manager sees only Hub Alpha
    if (user && user.role === 'warehouse_manager') {
      list = list.filter(c => c.origin === 'Hub Alpha');
    }

    // Filter by Cargo Priority
    const cargoFilter = document.getElementById('filter-cargo').value;
    if (cargoFilter !== 'ALL') {
      list = list.filter(c => c.priority === cargoFilter);
    }

    // Filter by Status
    const statusFilter = document.getElementById('filter-status').value;
    if (statusFilter !== 'ALL') {
      list = list.filter(c => c.status === statusFilter);
    }

    // Sort
    const sortBy = document.getElementById('sort-by').value;
    list.sort((a, b) => {
      if (sortBy === 'risk') {
        const rank = { high: 3, medium: 2, low: 1 };
        return rank[b.riskLevel] - rank[a.riskLevel];
      } else if (sortBy === 'priority') {
        const priorityRank = { 'Insulin/Blood': 4, 'Infant Nutrition': 3, 'Clean Water': 2, 'General': 1 };
        return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      }
      return 0;
    });

    return list;
  }

  render() {
    const convoys = this.getFilteredConvoys();
    const tbody = document.getElementById('convoy-table-body');
    tbody.innerHTML = '';

    // Update Metrics
    document.getElementById('metric-total').innerText = convoys.length;
    document.getElementById('metric-on-route').innerText = convoys.filter(c => c.status === 'On Route').length;
    document.getElementById('metric-rerouted').innerText = convoys.filter(c => c.status === 'Rerouted').length;
    document.getElementById('metric-stranded').innerText = convoys.filter(c => c.status === 'Stranded').length;

    if (convoys.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 32px; color: var(--slate-500);">
            No convoys matching active filters.
          </td>
        </tr>
      `;
      return;
    }

    convoys.forEach(c => {
      const isSelected = this.selectedIds.has(c.id);
      const isExpanded = this.expandedDiffs.has(c.id);
      const statusBadgeHtml = window.statusBadge.render(
        c.status === 'Stranded' ? 'impassable' : (c.status === 'Rerouted' ? 'degraded' : 'normal'),
        { label: c.status }
      );

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center;">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="convoyDispatch.toggleSelect('${c.id}', this.checked)">
        </td>
        <td>
          <div style="font-weight: 700;">${c.name}</div>
          <span class="badge ${c.priority === 'Insulin/Blood' ? 'badge-blocked' : 'badge-caution'}" style="font-size: 10px; padding: 1px 6px;">
            ${c.priority}
          </span>
        </td>
        <td>
          <div style="font-size: var(--text-sm); font-weight: 500;">${c.origin} → ${c.dest}</div>
          <div class="text-meta">${c.cargo}</div>
        </td>
        <td>
          <div class="risk-index-bar">
            <div class="risk-track">
              <div class="risk-fill ${c.riskLevel}"></div>
            </div>
            <span style="font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; color: var(--slate-800);">
              ${c.riskLevel}
            </span>
          </div>
        </td>
        <td>${statusBadgeHtml}</td>
        <td>
          <div style="font-size: var(--text-xs); font-weight: 600;">${c.driver}</div>
          <span class="text-meta" style="color: ${c.ackStatus === 'Acknowledged' ? 'var(--forest-700)' : 'var(--slate-800)'}">
            ${c.ackStatus === 'Acknowledged' ? '✓ Acked' : '⌛ Ack Pending'}
          </span>
        </td>
        <td style="font-weight: 600; font-variant-numeric: tabular-nums;">${c.eta}</td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 4px; justify-content: flex-end;">
            ${c.oldPath ? `
              <button class="btn btn-toggle" onclick="convoyDispatch.toggleDiff('${c.id}')" style="font-size: 11px;">
                ${isExpanded ? 'Hide Path Diff' : 'View Path Diff'}
              </button>
            ` : ''}
            <button class="btn btn-secondary" style="min-height: 32px; padding: 0 8px; font-size: 11px;" onclick="convoyDispatch.rerouteSingle('${c.id}')">
              Reroute
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);

      // Render Path Diff Row if Expanded
      if (c.oldPath && isExpanded) {
        const diffTr = document.createElement('tr');
        diffTr.className = 'path-diff-row';
        diffTr.innerHTML = `
          <td colspan="8">
            <div class="path-diff-container">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <strong>🔄 RECOMPUTED SHORTEST-SAFE-PATH DIFF</strong>
                <span class="badge badge-caution" style="font-size: 10px;">REASON: ${c.rationale}</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                <div>
                  <span class="panel-label" style="color: var(--slate-500);">PREVIOUS PATH (BLOCKED)</span>
                  <div class="old-path-diff">${c.oldPath}</div>
                </div>
                <div>
                  <span class="panel-label" style="color: var(--forest-700);">VERIFIED SAFE REROUTE</span>
                  <div class="new-path-diff">${c.newPath}</div>
                </div>
              </div>
              ${c.relayPoint ? `
                <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed var(--border-hairline); font-size: var(--text-xs); color: var(--slate-800); font-weight: 600;">
                  🔄 RELAY HANDOFF LEG: ${c.relayPoint}
                </div>
              ` : ''}
            </div>
          </td>
        `;
        tbody.appendChild(diffTr);
      }
    });

    this.updateBulkBar();
  }

  toggleSelect(id, checked) {
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
    this.updateBulkBar();
  }

  toggleSelectAll(checked) {
    const convoys = this.getFilteredConvoys();
    if (checked) {
      convoys.forEach(c => this.selectedIds.add(c.id));
    } else {
      this.selectedIds.clear();
    }
    this.render();
  }

  clearSelection() {
    this.selectedIds.clear();
    document.getElementById('select-all-checkbox').checked = false;
    this.render();
  }

  updateBulkBar() {
    const bar = document.getElementById('bulk-bar');
    const countEl = document.getElementById('bulk-selected-count');
    if (this.selectedIds.size > 0) {
      bar.classList.remove('hidden');
      countEl.innerText = `${this.selectedIds.size} Convoy(s) Selected`;
    } else {
      bar.classList.add('hidden');
    }
  }

  toggleDiff(id) {
    if (this.expandedDiffs.has(id)) this.expandedDiffs.delete(id);
    else this.expandedDiffs.add(id);
    this.render();
  }

  rerouteSingle(id) {
    const convoy = this.convoys.find(c => c.id === id);
    if (convoy) {
      convoy.status = 'Rerouted';
      convoy.riskLevel = 'low';
      convoy.oldPath = convoy.newPath || 'Previous Path';
      convoy.newPath = 'Bypass Corridor 4 (Verified Clear)';
      convoy.rationale = 'Manual dispatch reroute issued by operator.';
      this.render();
      toast.success(`${convoy.name} rerouted to Bypass Corridor 4! Reroute pushed live to driver.`);
    }
  }

  executeBulkDispatch() {
    if (this.selectedIds.size === 0) return;
    this.selectedIds.forEach(id => {
      const convoy = this.convoys.find(c => c.id === id);
      if (convoy) {
        convoy.status = 'On Route';
        convoy.riskLevel = 'low';
        convoy.ackStatus = 'Acknowledged';
      }
    });

    toast.success(`Bulk dispatch complete for ${this.selectedIds.size} convoys along verified safe routes!`);
    this.clearSelection();
  }

  applyFilters() {
    this.render();
  }

  resetFilters() {
    document.getElementById('filter-cargo').value = 'ALL';
    document.getElementById('filter-status').value = 'ALL';
    document.getElementById('sort-by').value = 'risk';
    this.render();
  }

  openNewConvoyModal() {
    document.getElementById('new-convoy-modal').classList.remove('hidden');
  }

  closeNewConvoyModal() {
    document.getElementById('new-convoy-modal').classList.add('hidden');
  }

  handleNewConvoySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('convoy-name-input').value.trim();
    const priority = document.getElementById('cargo-priority-input').value;
    const origin = document.getElementById('origin-select').value;
    const dest = document.getElementById('dest-select').value;

    const newConvoy = {
      id: `convoy-${Date.now()}`,
      name: name,
      cargo: `${priority} Emergency Relief Cargo`,
      priority: priority,
      origin: origin,
      dest: dest,
      status: 'On Route',
      driver: 'Unit-12 (Driver Dispatch)',
      ackStatus: 'Acknowledged',
      eta: '15:45 UTC',
      riskLevel: 'low',
      oldPath: null,
      newPath: 'Direct Verified Corridor',
      rationale: 'New mission authorized along verified shortest-safe-path.'
    };

    this.convoys.unshift(newConvoy);
    this.closeNewConvoyModal();
    this.render();
    toast.success(`New mission "${name}" dispatched from ${origin} to ${dest}!`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.convoyDispatch = new ConvoyDispatchManager();
  window.convoyDispatch.init();
});
