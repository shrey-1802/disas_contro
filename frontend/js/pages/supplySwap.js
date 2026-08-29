/* ==========================================
   DISISTA CONTROL — SUPPLY SWAP ENGINE
   Inter-Warehouse Rebalancing, Cold-Chain Matching,
   Impact Preview, and Transfer Lifecycle Tracker
   ========================================== */

class SupplySwapManager {
  constructor() {
    this.activeTab = 'offer';

    this.warehouses = {
      'wh-alpha': { name: 'Hub Alpha (Central Depot)', onHand: 14000, reserved: 2000, available: 12000, safety: 3000, daysAfter: 4.5 },
      'wh-bravo': { name: 'Hub Bravo (Northern Rift)', onHand: 6200, reserved: 1500, available: 4700, safety: 1500, daysAfter: 3.1 },
      'wh-charlie': { name: 'Hub Charlie (Coastal Base)', onHand: 9800, reserved: 800, available: 9000, safety: 2000, daysAfter: 5.2 }
    };

    this.offers = [
      {
        id: 'offer-001',
        from: 'wh-bravo',
        cargo: 'Insulin/Blood',
        onHand: 2400,
        reserved: 800,
        transferable: 1200,
        coldChain: true,
        status: 'Matched'
      },
      {
        id: 'offer-002',
        from: 'wh-charlie',
        cargo: 'Clean Water',
        onHand: 9000,
        reserved: 800,
        transferable: 4000,
        coldChain: false,
        status: 'Open'
      }
    ];

    this.requests = [
      {
        id: 'req-101',
        to: 'wh-alpha',
        cargo: 'Insulin/Blood',
        qty: 600,
        urgency: 'critical',
        matchedOffer: 'offer-001',
        status: 'Matched'
      }
    ];

    this.transfers = [
      {
        id: 'txfr-88',
        from: 'Hub Bravo (Northern Rift)',
        to: 'Hub Alpha (Central Depot)',
        cargo: 'Insulin & Blood Products',
        qty: 600,
        coldChain: true,
        currentStage: 3,   // 0=Requested,1=Matched,2=Approved,3=Picking,4=Loading,5=Dispatched,6=InTransit,7=Received,8=Completed
        convoy: 'Convoy 14',
        started: '08:30 UTC',
        eta: '14:20 UTC'
      },
      {
        id: 'txfr-91',
        from: 'Hub Charlie (Coastal Base)',
        to: 'Hub Bravo (Northern Rift)',
        cargo: 'Clean Water Containers',
        qty: 2400,
        coldChain: false,
        currentStage: 6,
        convoy: 'Convoy 22',
        started: '07:00 UTC',
        eta: '16:05 UTC'
      }
    ];

    this.LIFECYCLE_STAGES = [
      'Requested', 'Matched', 'Approved',
      'Picking', 'Loading', 'Dispatched',
      'In Transit', 'Received', 'Completed'
    ];

    this.pendingTransferApproval = null;
  }

  init() {
    this.enforceRoleAccess();
    this.renderOffers();
    this.renderMatches();
    this.renderActiveTransfers();
    this.updateMetrics();
    this.checkCriticalMatches();
  }

  enforceRoleAccess() {
    const user = auth.getCurrentUser();
    if (user) {
      const badge = document.getElementById('role-access-badge');
      const roleMap = {
        control_room: 'Control Room (Read-Only)',
        district_admin: 'District Admin (Read-Only)',
        warehouse_manager: 'Warehouse Manager',
        field_driver: 'Field Driver (No Access)'
      };
      badge.innerText = roleMap[user.role] || 'Operator';

      // Non-WH Manager roles can view but not approve
      if (user.role === 'control_room' || user.role === 'district_admin') {
        toast.info('You are viewing Supply Swap as read-only. Approving transfers requires Warehouse Manager access.');
      }
    }
  }

  checkCriticalMatches() {
    const hasCritical = this.requests.some(r => r.urgency === 'critical' && r.status === 'Matched');
    const matchBadge = document.getElementById('match-alert-badge');
    if (hasCritical) {
      matchBadge.style.display = 'inline-flex';
    }
  }

  updateMetrics() {
    document.getElementById('metric-offers').innerText = this.offers.filter(o => o.status === 'Open' || o.status === 'Matched').length;
    document.getElementById('metric-requests').innerText = this.requests.length;
    document.getElementById('metric-active').innerText = this.transfers.filter(t => t.currentStage < 8).length;
    document.getElementById('active-count-badge').innerText = this.transfers.filter(t => t.currentStage < 8).length;
    const critMatches = this.requests.filter(r => r.urgency === 'critical' && r.status === 'Matched').length;
    document.getElementById('metric-critical-matches').innerText = critMatches;
  }

  /* ------------------------------------------
     TAB SWITCHER
  ------------------------------------------ */
  switchTab(name) {
    this.activeTab = name;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-btn-${name}`).classList.add('active');
    document.getElementById(`panel-${name}`).classList.add('active');
  }

  /* ------------------------------------------
     OFFER TAB
  ------------------------------------------ */
  checkColdChain(cargoType) {
    const flag = document.getElementById('cold-chain-flag');
    const needsCold = cargoType === 'Insulin/Blood';
    flag.style.display = needsCold ? 'block' : 'none';
  }

  handleOfferSubmit(e) {
    e.preventDefault();
    const fromHub = document.getElementById('offer-from-hub').value;
    const cargo = document.getElementById('offer-cargo-type').value;
    const onHand = parseInt(document.getElementById('offer-on-hand').value);
    const reserved = parseInt(document.getElementById('offer-reserved').value);
    const transferable = parseInt(document.getElementById('offer-transferable').value);

    const available = onHand - reserved;
    if (transferable > available) {
      toast.error(`Transferable quantity (${transferable}) exceeds Available stock (${available}). Cannot be submitted.`);
      return;
    }

    const wh = this.warehouses[fromHub];
    if (wh && (wh.onHand - transferable) < wh.safety) {
      toast.error(`Transfer would drop ${wh.name} below its safety threshold (${wh.safety} units). Reduce transferable quantity.`);
      return;
    }

    const newOffer = {
      id: `offer-${Date.now()}`,
      from: fromHub,
      cargo,
      onHand,
      reserved,
      transferable,
      coldChain: cargo === 'Insulin/Blood',
      status: 'Open'
    };

    this.offers.push(newOffer);
    this.renderOffers();
    this.updateMetrics();
    toast.success(`Supply offer posted! ${cargo} (${transferable} units) from ${this.warehouses[fromHub]?.name || fromHub} — Matching engine scanning now.`);
  }

  renderOffers() {
    const container = document.getElementById('offers-list');
    container.innerHTML = '';

    if (this.offers.length === 0) {
      container.innerHTML = `<p class="text-meta">No open offers posted yet.</p>`;
      return;
    }

    this.offers.forEach(offer => {
      const wh = this.warehouses[offer.from];
      const statusBadgeHtml = offer.status === 'Matched'
        ? `<span class="badge badge-safe">✓ Matched</span>`
        : `<span class="badge badge-caution">⌛ Seeking Match</span>`;

      const available = offer.onHand - offer.reserved;
      const fillPct = Math.min(100, Math.round((available / offer.onHand) * 100));

      const div = document.createElement('div');
      div.style.cssText = `background: var(--bg-honeydew); border: 1px solid var(--border-hairline); border-radius: var(--radius); padding: var(--space-3);`;
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong>${offer.cargo}</strong>
          ${statusBadgeHtml}
        </div>
        <div class="text-meta">${wh ? wh.name : offer.from}</div>
        ${offer.coldChain ? `<span style="font-size: 11px; color: var(--forest-700); font-weight: 600;">🧊 Cold-Chain Eligible Only</span>` : ''}
        <div class="stock-bar-container">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--slate-500);">
            <span>Transferable: <strong>${offer.transferable} units</strong></span>
            <span>Available: ${available}</span>
          </div>
          <div class="stock-bar-track">
            <div class="stock-bar-fill" style="width: ${fillPct}%;"></div>
          </div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  /* ------------------------------------------
     REQUEST TAB
  ------------------------------------------ */
  handleRequestSubmit(e) {
    e.preventDefault();
    const toHub = document.getElementById('req-to-hub').value;
    const cargo = document.getElementById('req-cargo-type').value;
    const qty = parseInt(document.getElementById('req-qty').value);
    const urgency = document.getElementById('req-urgency').value;

    const newReq = {
      id: `req-${Date.now()}`,
      to: toHub,
      cargo,
      qty,
      urgency,
      matchedOffer: null,
      status: 'Open'
    };

    // Try to find a match
    const match = this.offers.find(o => o.cargo === cargo && o.transferable >= qty && o.status === 'Open');
    if (match) {
      newReq.status = 'Matched';
      newReq.matchedOffer = match.id;
      match.status = 'Matched';
      toast.success(`Match found! ${this.warehouses[match.from]?.name || match.from} has ${match.transferable} units available. Opening Impact Preview...`);
      setTimeout(() => this.openImpactPreview(match.id, newReq.id), 800);
    } else {
      toast.info(`Shortage request submitted. Scanning network for matching offers...`);
    }

    this.requests.push(newReq);
    this.renderMatches();
    this.renderOffers();
    this.updateMetrics();
    this.checkCriticalMatches();
  }

  renderMatches() {
    const container = document.getElementById('matches-list');
    container.innerHTML = '';

    const matched = this.requests.filter(r => r.status === 'Matched');
    if (matched.length === 0) {
      container.innerHTML = `<p class="text-meta" style="padding: var(--space-3);">No matched offers found yet. Post a shortage request to trigger matching.</p>`;
      return;
    }

    matched.forEach(req => {
      const matchedOffer = this.offers.find(o => o.id === req.matchedOffer);
      const fromWh = matchedOffer ? (this.warehouses[matchedOffer.from] || {}) : {};
      const urgencyBadge = req.urgency === 'critical'
        ? `<span class="badge badge-blocked">❖ Critical</span>`
        : `<span class="badge badge-caution">▲ Caution</span>`;

      const div = document.createElement('div');
      div.style.cssText = `background: #F0F5F2; border: 1px solid var(--forest-600); border-radius: var(--radius); padding: var(--space-3); margin-bottom: var(--space-3);`;
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong>${req.cargo} — ${req.qty} Units</strong>
          ${urgencyBadge}
        </div>
        <div class="text-meta">Source: ${fromWh.name || 'Hub'} → ${this.warehouses[req.to]?.name || req.to}</div>
        ${matchedOffer?.coldChain ? `<div style="font-size: 11px; color: var(--forest-700); font-weight: 600; margin-top: 4px;">🧊 Refrigerated Unit Confirmed</div>` : ''}
        <div style="display: flex; gap: var(--space-2); margin-top: var(--space-3);">
          <button class="btn btn-secondary" style="min-height: 34px; font-size: 11px; flex: 1;" onclick="supplySwap.openImpactPreview('${matchedOffer?.id}', '${req.id}')">
            📊 Review Impact Preview
          </button>
          <button class="btn btn-primary" style="min-height: 34px; font-size: 11px; flex: 1;" onclick="supplySwap.openImpactPreview('${matchedOffer?.id}', '${req.id}')">
            ✓ Approve Transfer
          </button>
        </div>
      `;
      container.appendChild(div);
    });
  }

  /* ------------------------------------------
     IMPACT PREVIEW MODAL
  ------------------------------------------ */
  openImpactPreview(offerId, reqId) {
    this.pendingTransferApproval = { offerId, reqId };
    const offer = this.offers.find(o => o.id === offerId);
    const req = this.requests.find(r => r.id === reqId);
    if (!offer || !req) return;

    const fromWh = this.warehouses[offer.from];
    const toWh = this.warehouses[req.to];

    // Calculate after-state
    const fromAfterAvailable = fromWh.available - req.qty;
    const fromAfterDays = ((fromWh.onHand - req.qty) / (fromWh.onHand / fromWh.daysAfter)).toFixed(1);
    const toAfterDays = (toWh.daysAfter + (req.qty / (toWh.onHand / toWh.daysAfter))).toFixed(1);
    const fromBelowSafety = (fromWh.onHand - req.qty) < fromWh.safety;

    const fromFillBefore = Math.min(100, Math.round((fromWh.available / fromWh.onHand) * 100));
    const fromFillAfter = Math.max(0, Math.min(100, Math.round((fromAfterAvailable / fromWh.onHand) * 100)));

    const content = document.getElementById('impact-preview-content');
    content.innerHTML = `
      <div style="background: var(--bg-honeydew); border-radius: var(--radius); padding: var(--space-3); margin-bottom: var(--space-4); font-size: var(--text-sm);">
        <strong>Transfer: ${offer.cargo}</strong> — ${req.qty} Units
        <br><span class="text-meta">
          ${offer.coldChain ? '🧊 Refrigerated vehicle confirmed for cold-chain cargo' : '📦 Standard vehicle'}
        </span>
      </div>

      <div class="impact-preview-grid">
        <div class="impact-hub-card">
          <span class="panel-label" style="color: var(--slate-500);">SOURCE HUB (After Transfer)</span>
          <h4 style="margin: 4px 0;">${fromWh?.name || offer.from}</h4>
          
          <div style="margin-top: var(--space-3);">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span>Before</span><span style="color: var(--forest-700);">${fromWh.available} units</span>
            </div>
            <div class="stock-bar-track">
              <div class="stock-bar-fill" style="width: ${fromFillBefore}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; margin-top: 6px;">
              <span>After</span>
              <span style="color: ${fromBelowSafety ? 'var(--slate-800)' : 'var(--forest-700)'}; font-weight: 600;">${fromAfterAvailable} units</span>
            </div>
            <div class="stock-bar-track">
              <div class="stock-bar-fill ${fromBelowSafety ? 'danger' : ''}" style="width: ${fromFillAfter}%;"></div>
            </div>
            <div class="data-numeral" style="font-size: var(--text-lg); margin-top: var(--space-3); color: ${fromBelowSafety ? 'var(--slate-800)' : 'var(--forest-700)'};">
              ${fromAfterDays} Days Cover
            </div>
          </div>

          ${fromBelowSafety ? `
            <div style="background: var(--slate-800); color: var(--white); padding: 6px; border-radius: 4px; font-size: 11px; margin-top: 8px; font-weight: 600;">
              ⚠️ Source drops below safety threshold! Consider reducing quantity.
            </div>
          ` : `<div style="font-size: 11px; color: var(--forest-700); margin-top: 6px;">✓ Stays above safety threshold</div>`}
        </div>

        <div class="impact-hub-card">
          <span class="panel-label" style="color: var(--forest-700);">DESTINATION HUB (After Receiving)</span>
          <h4 style="margin: 4px 0;">${toWh?.name || req.to}</h4>

          <div style="margin-top: var(--space-3);">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span>Before</span><span style="color: var(--slate-500);">${toWh.daysAfter} days cover</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; margin-top: 6px;">
              <span>After Receiving</span><span style="color: var(--forest-700); font-weight: 600;">${toAfterDays} days cover</span>
            </div>
            <div class="data-numeral" style="font-size: var(--text-lg); margin-top: var(--space-3); color: var(--forest-700);">
              ${toAfterDays} Days Cover
            </div>
            <div style="font-size: 11px; color: var(--forest-700); margin-top: 6px;">✓ Supply cover improved significantly</div>
          </div>
        </div>
      </div>

      ${fromBelowSafety ? `
        <div style="background: #FFF3F0; border: 1px solid var(--slate-800); border-radius: var(--radius); padding: var(--space-3); margin-top: var(--space-4); font-size: var(--text-sm);">
          <strong>⚠️ Suggested Safer Quantity:</strong> Transfer ${Math.max(0, req.qty - fromWh.safety)} units instead of ${req.qty} to keep source above safety threshold.
        </div>
      ` : ''}
    `;

    document.getElementById('impact-preview-modal').classList.remove('hidden');
  }

  closeImpactModal() {
    document.getElementById('impact-preview-modal').classList.add('hidden');
    this.pendingTransferApproval = null;
  }

  confirmTransfer() {
    if (!this.pendingTransferApproval) return;
    const { offerId, reqId } = this.pendingTransferApproval;
    const offer = this.offers.find(o => o.id === offerId);
    const req = this.requests.find(r => r.id === reqId);

    if (offer) offer.status = 'Approved';
    if (req) req.status = 'Approved';

    const fromWh = offer ? this.warehouses[offer.from] : null;
    const toWh = req ? this.warehouses[req.to] : null;

    // Add new active transfer
    this.transfers.push({
      id: `txfr-${Date.now()}`,
      from: fromWh?.name || 'Source Hub',
      to: toWh?.name || 'Destination Hub',
      cargo: offer?.cargo || 'Relief Supplies',
      qty: req?.qty || 0,
      coldChain: offer?.coldChain || false,
      currentStage: 2, // Approved
      convoy: 'Convoy (Queued)',
      started: `${new Date().toISOString().substring(11, 16)} UTC`,
      eta: 'TBD (Dispatch Pending)'
    });

    this.closeImpactModal();
    this.updateMetrics();
    this.renderActiveTransfers();
    this.renderMatches();
    this.renderOffers();

    toast.success(`Transfer approved! Convoy dispatch queued. Transfer lifecycle tracking active.`);
    setTimeout(() => this.switchTab('active'), 800);
  }

  /* ------------------------------------------
     ACTIVE TRANSFERS LIFECYCLE BOARD
  ------------------------------------------ */
  renderActiveTransfers() {
    const container = document.getElementById('active-transfers-container');
    container.innerHTML = '';

    if (this.transfers.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 48px;">
          <p class="text-meta">No active transfers. Approve a matched offer to initiate a transfer.</p>
        </div>
      `;
      return;
    }

    this.transfers.forEach(t => {
      const isCompleted = t.currentStage >= 8;
      const statusBadgeHtml = isCompleted
        ? window.statusBadge.render('normal', { label: 'Completed' })
        : t.currentStage >= 5
          ? window.statusBadge.render('degraded', { label: this.LIFECYCLE_STAGES[t.currentStage] })
          : window.statusBadge.render('normal', { label: this.LIFECYCLE_STAGES[t.currentStage] });

      const div = document.createElement('div');
      div.className = 'transfer-card';
      div.innerHTML = `
        <div class="transfer-card-header">
          <div>
            <div style="font-weight: 700; margin-bottom: 2px;">${t.id} — ${t.cargo} (${t.qty} Units)</div>
            <div class="text-meta">${t.from} → ${t.to}</div>
            <div class="text-meta">Convoy: <strong>${t.convoy}</strong> · Started: ${t.started} · ETA: ${t.eta}</div>
            ${t.coldChain ? `<span style="font-size: 11px; color: var(--forest-700); font-weight: 600;">🧊 Cold-Chain Cargo</span>` : ''}
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
            ${statusBadgeHtml}
            ${!isCompleted ? `
              <button class="btn btn-secondary" style="min-height: 30px; font-size: 11px;" onclick="supplySwap.advanceTransferStage('${t.id}')">
                ⏭ Advance Stage
              </button>
            ` : ''}
          </div>
        </div>

        <!-- LIFECYCLE TRACK -->
        <div class="lifecycle-track">
          ${this.LIFECYCLE_STAGES.map((stage, i) => {
            const isDone = i < t.currentStage;
            const isActive = i === t.currentStage;
            const stateClass = isDone ? 'done' : isActive ? 'active' : '';
            return `
              ${i > 0 ? `<div class="lifecycle-line ${isDone ? 'done' : ''}"></div>` : ''}
              <div class="lifecycle-step">
                <div class="lifecycle-dot ${stateClass}">${isDone ? '✓' : (i + 1)}</div>
                <div class="lifecycle-label ${stateClass}">${stage}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      container.appendChild(div);
    });
  }

  advanceTransferStage(transferId) {
    const t = this.transfers.find(x => x.id === transferId);
    if (!t || t.currentStage >= 8) return;
    t.currentStage++;

    if (t.currentStage === 5) {
      t.convoy = 'Convoy (Dispatched - On Route)';
    } else if (t.currentStage === 8) {
      t.convoy += ' ✓ Delivered';
      toast.success(`Transfer ${t.id} COMPLETED! ${t.cargo} successfully received at ${t.to}.`);
    } else {
      toast.info(`Transfer ${t.id} advanced to stage: ${this.LIFECYCLE_STAGES[t.currentStage]}`);
    }

    this.updateMetrics();
    this.renderActiveTransfers();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.supplySwap = new SupplySwapManager();
  window.supplySwap.init();
});
