/* ==========================================
   DISISTA CONTROL — SUPPLY SWAP ENGINE
   Inter-Warehouse Rebalancing, Cold-Chain Matching,
   Impact Preview, Multi-Hop Chains, and Transfer Lifecycle Tracker
   ========================================== */

class SupplySwapManager {
  constructor() {
    this.activeTab = 'offer';
    this.pendingTransferApproval = null;
  }

  init() {
    this.enforceRoleAccess();
    this.render();
    this.startEscalationWatcher();  // B.6

    if (window.store) {
      window.store.subscribe(() => this.render());
    }

    if (window.socket) {
      window.socket.on('transfer:status_update', () => this.render());
      window.socket.on('route:recalculated', () => this.render());
    }
  }

  /* B.6 — Auto-Escalation: stalled Critical transfers > 15 min */
  startEscalationWatcher() {
    const ESCALATION_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes per spec

    const check = () => {
      if (!window.store) return;
      const transfers = window.store.getTransfers();
      transfers.forEach(t => {
        if (
          t.status === 'Active' &&
          (t.cargoType === 'Insulin/Blood' || t.priority === 'critical') &&
          t.currentStage <= 1 && // Requested or Matched — not yet approved
          t.createdAt && (Date.now() - t.createdAt) > ESCALATION_THRESHOLD_MS
        ) {
          window.store.escalateTransfer(t.id);
          if (window.toast) {
            window.toast.error(`Transfer ${t.id} (${t.cargo}) escalated — unactioned past 15-minute threshold.`);
          }
        }
      });
    };

    check();
    this._escalationInterval = setInterval(check, 60000);
  }

  render() {
    this.renderShortcageForecasts(); // B.1
    this.renderOffers();
    this.renderMatches();
    this.renderActiveTransfers();
    this.updateMetrics();
  }

  /* B.1 — Predictive Shortage Forecasting
     Formula: time-to-stockout = onHand ÷ consumptionRate (estimated)
     Threshold: < 8 hours → show forecast card */
  renderShortcageForecasts() {
    const container = document.getElementById('shortage-forecast-container');
    if (!container) return;

    const warehouses = window.store ? window.store.getWarehouses() : [];

    // Estimate consumption: assume daily burn = onHand / daysCover
    const forecasts = [];
    warehouses.forEach(w => {
      if (!w.daysCover || w.daysCover <= 0) return;
      const dailyBurn = w.onHand / w.daysCover;
      const available = w.available || (w.onHand - (w.reserved || 0));
      const hoursToStockout = available > 0 ? (available / dailyBurn) * 24 : 0;

      if (hoursToStockout < 8 && hoursToStockout > 0) {
        const hrs = Math.floor(hoursToStockout);
        const mins = Math.round((hoursToStockout - hrs) * 60);
        forecasts.push({ warehouse: w.name, hoursToStockout, label: `${hrs}h ${mins}m` });
      }
    });

    if (forecasts.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div style="margin-bottom:var(--space-4);">
        <span class="panel-label">⏱ PREDICTIVE SHORTAGE FORECAST (B.1)</span>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-3);margin-top:var(--space-2);">
          ${forecasts.map(f => `
            <div style="border:1px dashed var(--forest-600);border-radius:var(--radius);padding:var(--space-3);background:var(--bg-honeydew);">
              <div style="display:flex;align-items:center;gap:8px;">
                <svg width="16" height="16" fill="none" stroke="var(--forest-600)" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <span class="panel-label" style="font-size:10px;">STOCKOUT FORECAST</span>
              </div>
              <div style="font-size:var(--text-sm);font-weight:600;margin-top:4px;">${f.warehouse}</div>
              <div style="font-size:var(--text-xs);color:var(--slate-500);">Stockout in <strong style="color:var(--forest-700);">${f.label}</strong> at current draw rate. Open Supply Swap to rebalance.</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  enforceRoleAccess() {
    const user = window.auth ? window.auth.getCurrentUser() : null;
    const badge = document.getElementById('role-access-badge');
    if (!badge) return;

    if (user && user.role === 'warehouse_manager') {
      badge.innerText = 'Full Transactional Access (Warehouse Manager)';
      badge.className = 'badge badge-safe';
    } else {
      badge.innerText = 'Read-Only Network Rollup (Control Room / District Admin)';
      badge.className = 'badge badge-caution';
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('hidden', content.id !== `tab-${tabName}`);
    });
    this.render();
  }

  render() {
    this.renderOffers();
    this.renderMatches();
    this.renderActiveTransfers();
    this.updateMetrics();
  }

  updateMetrics() {
    const transfers = window.store ? window.store.getTransfers() : [];
    const activeCount = transfers.filter(t => t.currentStage < 8).length;

    const offerCountEl  = document.getElementById('count-offers')   || document.getElementById('metric-offers');
    const reqCountEl    = document.getElementById('count-requests') || document.getElementById('metric-requests');
    const activeCountEl = document.getElementById('count-active')   || document.getElementById('metric-active');

    if (offerCountEl)  offerCountEl.innerText  = '2 Offers Open';
    if (reqCountEl)    reqCountEl.innerText    = '1 Critical Need';
    if (activeCountEl) activeCountEl.innerText = `${activeCount} Active Transfers`;
  }


  /* ------------------------------------------
     OFFERS TAB RENDERER
     ------------------------------------------ */
  renderOffers() {
    const container = document.getElementById('offers-list');
    if (!container) return;

    const warehouses = window.store ? window.store.getWarehouses() : [];
    container.innerHTML = warehouses.map(w => `
      <div class="card" style="margin-bottom: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <strong>${w.name}</strong>
          <span class="badge badge-safe">${w.available.toLocaleString()} Units Available</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 12px; background: var(--bg-honeydew); padding: 8px; border-radius: var(--radius);">
          <div>On Hand:<br><strong>${w.onHand.toLocaleString()}</strong></div>
          <div>Reserved:<br><strong>${w.reserved.toLocaleString()}</strong></div>
          <div>Available:<br><strong style="color: var(--forest-600);">${w.available.toLocaleString()}</strong></div>
          <div>Safety Threshold:<br><strong>${w.safety.toLocaleString()}</strong></div>
        </div>
      </div>
    `).join('');
  }

  /* ------------------------------------------
     MATCHES & IMPACT PREVIEW MODAL (B.5 & B.3)
     ------------------------------------------ */
  renderMatches() {
    const container = document.getElementById('matches-list');
    if (!container) return;

    const canApprove = window.auth ? window.auth.canPerform('approve_supply_swap') : false;

    container.innerHTML = `
      <!-- CRITICAL SINGLE MATCH -->
      <div class="card warning" style="border-left: 4px solid var(--slate-800); margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span class="badge badge-blocked">❖ CRITICAL MATCH DETECTED</span>
              <span class="badge badge-safe">❄️ Cold-Chain Fit Verified</span>
            </div>
            <h4 style="margin: 0;">Hub Bravo → Hub Alpha: 600 Vials Insulin & Blood Products</h4>
            <span class="text-meta">Recipient Shelter 12 at 0.5 Days Supply Cover</span>
          </div>
          <button class="btn btn-primary" style="font-size: 11px; min-height: 32px;"
                  ${!canApprove ? 'disabled title="Approving transfers is a Warehouse Manager action."' : ''}
                  onclick="supplySwap.openImpactPreview('Hub Bravo', 'Hub Alpha', 'Insulin & Blood Products', 600, true)">
            Preview Impact & Approve →
          </button>
        </div>
      </div>

      <!-- MULTI-HOP CHAIN SWAP CARD (B.2) -->
      <div class="card" style="border-left: 4px solid var(--forest-600);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span class="badge badge-caution">🔀 MULTI-HOP CHAIN SWAP AVAILABLE (B.2)</span>
              <span class="badge badge-safe">2-Leg Chain Match</span>
            </div>
            <h4 style="margin: 0;">Chain Swap: Hub Charlie (400 Units) + Hub Bravo (200 Units) → Hub Alpha</h4>
            <span class="text-meta">No single warehouse has full surplus. Combined multi-hop chain covers 100% of demand.</span>
          </div>
          <button class="btn btn-secondary" style="font-size: 11px; min-height: 32px;"
                  ${!canApprove ? 'disabled title="Approving transfers is a Warehouse Manager action."' : ''}
                  onclick="supplySwap.openImpactPreview('Hub Charlie + Bravo', 'Hub Alpha', 'Insulin & Blood Products', 600, true)">
            Inspect Chain Legs →
          </button>
        </div>
      </div>
    `;
  }

  /* ------------------------------------------
     TRANSFER IMPACT PREVIEW MODAL (B.5)
     ------------------------------------------ */
  openImpactPreview(fromName, toName, cargoName, qty, coldChain) {
    this.pendingTransferApproval = { fromName, toName, cargoName, qty, coldChain };

    const modal = document.getElementById('impact-preview-modal');
    if (!modal) return;

    const descEl = document.getElementById('impact-modal-desc');
    const warningEl = document.getElementById('impact-modal-warning');

    if (descEl) {
      descEl.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div style="background: var(--bg-honeydew); padding: 10px; border-radius: var(--radius);">
            <strong>Donor: ${fromName}</strong><br>
            Stock Before: 6,200 Units (3.1 Days)<br>
            <strong style="color: var(--forest-600);">Stock After: 5,600 Units (2.8 Days)</strong>
          </div>
          <div style="background: var(--bg-honeydew); padding: 10px; border-radius: var(--radius);">
            <strong>Recipient: ${toName}</strong><br>
            Stock Before: 14,000 Units (4.5 Days)<br>
            <strong style="color: var(--forest-700);">Stock After: 14,600 Units (4.9 Days)</strong>
          </div>
        </div>
      `;
    }

    if (warningEl) {
      warningEl.innerHTML = `
        <div style="background: rgba(90, 122, 104, 0.15); border: 1px solid var(--forest-600); padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-bottom: 12px;">
          ⚠️ <strong>Safety Threshold Advisory (B.5):</strong> Donor stock drops slightly below 3.0 days threshold. Recommended safe transfer quantity: 450 units.
        </div>
      `;
    }

    modal.classList.remove('hidden');
  }

  closeImpactPreview() {
    const modal = document.getElementById('impact-preview-modal');
    if (modal) modal.classList.add('hidden');
  }

  confirmImpactApproval() {
    if (!this.pendingTransferApproval) return;
    const t = this.pendingTransferApproval;

    const newTxfr = {
      id: `txfr-${Date.now().toString().slice(-3)}`,
      from: t.fromName,
      to: t.toName,
      cargo: t.cargoName,
      cargoType: t.cargoName.includes('Insulin') ? 'Insulin/Blood' : 'General',
      qty: t.qty,
      coldChain: t.coldChain,
      currentStage: 2, // Approved
      convoy: 'Convoy 14',
      started: 'Just now',
      eta: '14:20 UTC',
      status: 'Active'
    };

    if (window.store) {
      window.store.addTransfer(newTxfr);
    }

    this.closeImpactPreview();
    if (window.toast) {
      window.toast.success(`Supply Swap Transfer ${newTxfr.id} APPROVED! Lifecycle stage advanced to Approved.`);
    }
  }

  /* ------------------------------------------
     ACTIVE TRANSFERS & LIFECYCLE TRACKER
     ------------------------------------------ */
  renderActiveTransfers() {
    const container = document.getElementById('transfers-list') || document.getElementById('active-transfers-container');
    if (!container) return;


    const transfers = window.store ? window.store.getTransfers() : [];
    const stages = [
      'Requested', 'Matched', 'Approved',
      'Picking', 'Loading', 'Dispatched',
      'In Transit', 'Received', 'Completed'
    ];

    container.innerHTML = transfers.map(t => {
      const isRerouted = t.currentStage === 6; // In transit reroute warning

      return `
        <div class="card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span class="badge ${t.currentStage === 8 ? 'badge-safe' : 'badge-caution'}">${t.id} — ${stages[t.currentStage]}</span>
                ${t.coldChain ? '<span class="badge badge-blocked">❄️ Cold-Chain Gate Passed</span>' : ''}
              </div>
              <h4 style="margin: 0;">${t.from} → ${t.to}</h4>
              <span class="text-meta">Cargo: <strong>${t.cargo}</strong> (${t.qty} Units) · Convoy: ${t.convoy} · ETA: ${t.eta}</span>
            </div>
            ${t.currentStage < 8 ? `
              <button class="btn btn-secondary" style="font-size: 11px; min-height: 32px;" onclick="supplySwap.advanceStage('${t.id}')">
                Advance Stage (${stages[t.currentStage + 1]}) →
              </button>
            ` : '<span class="badge badge-safe">✓ Completed</span>'}
          </div>

          <!-- MID-TRANSIT REROUTE ALERT (B.4) -->
          ${isRerouted ? `
            <div style="background: var(--bg-honeydew); border-left: 3px solid var(--forest-600); padding: 8px 12px; border-radius: 4px; font-size: 11px; margin-bottom: 8px;">
              ⚠️ <strong>MID-TRANSIT REROUTE ALERT (B.4):</strong> Bridge B14 closed mid-transit. Convoy 14 auto-rerouted via Bypass 2. ETA updated: +25 mins.
            </div>
          ` : ''}

          <!-- LIFECYCLE PROGRESS BAR -->
          <div style="display: flex; gap: 4px; margin-top: 12px;">
            ${stages.map((st, idx) => `
              <div style="flex: 1; text-align: center;">
                <div style="height: 6px; border-radius: 3px; background: ${idx <= t.currentStage ? (idx === 8 ? 'var(--sage-500)' : 'var(--forest-600)') : 'var(--border-hairline)'};"></div>
                <span style="font-size: 9px; color: ${idx === t.currentStage ? 'var(--slate-800)' : 'var(--slate-500)'}; font-weight: ${idx === t.currentStage ? 'bold' : 'normal'}; display: block; margin-top: 2px;">
                  ${st}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  /* B.7 — Low-Bandwidth Shelter Need Ping */
  openShelterPingModal() {
    const modal = document.getElementById('shelter-ping-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    if (window.A11yUtil) window.A11yUtil.trapFocus(modal);
  }

  closeShelterPingModal() {
    const modal = document.getElementById('shelter-ping-modal');
    if (modal) modal.classList.add('hidden');
  }

  submitShelterNeedPing(e) {
    e.preventDefault();
    const shelterId = document.getElementById('ping-shelter-id')?.value.trim();
    const item      = document.getElementById('ping-item')?.value;
    const qty       = document.getElementById('ping-qty')?.value.trim();
    const urgency   = document.getElementById('ping-urgency')?.value;
    if (!shelterId || !item || !qty) return;

    // Enter the same transfer/request pipeline, tagged as Field Report
    if (window.store) {
      window.store.addTransfer({
        from: 'Shelter Field Report (B.7)',
        to: shelterId,
        cargo: item,
        cargoType: item,
        qty: parseInt(qty, 10) || 0,
        coldChain: item === 'Insulin/Blood',
        currentStage: 0,
        convoy: 'Unassigned',
        started: 'Pending',
        eta: 'Pending',
        status: urgency === 'critical' ? 'Active' : 'Active',
        priority: urgency,
        createdAt: Date.now(),
        isFieldReport: true  // B.7 field-report tag
      });
    }

    if (window.toast) window.toast.success(`Shelter need registered: ${item} for ${shelterId}. Entering request pipeline.`);
    if (window.A11yUtil) window.A11yUtil.announce(`Shelter need ping submitted for ${shelterId}.`);
    this.closeShelterPingModal();
    this.render();
  }

  advanceStage(transferId) {
    if (window.store) {
      window.store.advanceTransferStage(transferId);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.supplySwap = new SupplySwapManager();
  window.supplySwap.init();
});
