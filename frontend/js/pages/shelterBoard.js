/* ==========================================
   DISISTA CONTROL — SHELTER BOARD MANAGER
   Telemetry Cards, Isolation Audits, & Rebalancing
   ========================================== */

class ShelterBoardManager {
  constructor() {
    this.expandedCards = new Set(['shelter-19']);
  }

  init() {
    this.bindSearchInput();
    this.render();
    if (window.store) {
      window.store.subscribe(() => this.render());
    }
    if (window.socket) {
      window.socket.on('shelter:demand_update', () => this.render());
      window.socket.on('route:recalculated', () => this.render());
    }
  }

  bindSearchInput() {
    const searchInput = document.getElementById('shelter-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.render());
    }
  }

  applyFilters() {
    this.render();
  }

  resetFilters() {
    const urgencyFilterEl = document.getElementById('filter-urgency');
    const shortageFilterEl = document.getElementById('filter-shortage');
    const searchInput = document.getElementById('shelter-search-input');

    if (urgencyFilterEl) urgencyFilterEl.value = 'ALL';
    if (shortageFilterEl) shortageFilterEl.value = 'ALL';
    if (searchInput) searchInput.value = '';

    this.render();
  }

  openRequestModal() {
    const modal = document.getElementById('rebalance-modal');
    if (!modal) return;

    // Populate shelter select dynamically from store
    const selectEl = document.getElementById('rebalance-shelter-select');
    if (selectEl && window.store) {
      const shelters = window.store.getShelters();
      if (shelters.length > 0) {
        selectEl.innerHTML = shelters.map(s => {
          const tier = s.isolated ? 'ISOLATED' : (s.daysSupply < 1.5 ? 'Critical' : (s.daysSupply <= 3.0 ? 'Caution' : 'Safe'));
          return `<option value="${s.id}">${s.name} — ${tier} (${s.daysSupply} Days Cover)</option>`;
        }).join('');
      }
    }

    modal.classList.remove('hidden');
    if (window.A11yUtil && typeof window.A11yUtil.trapFocus === 'function') {
      window.A11yUtil.trapFocus(modal);
    }
  }

  closeRequestModal() {
    const modal = document.getElementById('rebalance-modal');
    if (!modal) return;
    modal.classList.add('hidden');
  }

  handleRebalanceSubmit(e) {
    e.preventDefault();
    const shelterId = document.getElementById('rebalance-shelter-select')?.value;
    const category = document.getElementById('rebalance-category')?.value;
    const qty = document.getElementById('rebalance-qty')?.value.trim();

    if (!shelterId || !category || !qty) return;

    const shelters = window.store ? window.store.getShelters() : [];
    const shelter = shelters.find(s => s.id === shelterId);
    const shelterName = shelter ? shelter.name : shelterId;

    if (window.store) {
      window.store.addTransfer({
        id: `txfr-${Date.now().toString().slice(-3)}`,
        from: 'Control Room Rebalance Request',
        to: shelterName,
        cargo: category,
        cargoType: category,
        qty: qty,
        coldChain: category.includes('Insulin') || category.includes('Cold-Chain'),
        currentStage: 0,
        convoy: 'Unassigned',
        started: 'Pending',
        eta: 'Pending',
        status: 'Active',
        priority: 'critical',
        createdAt: Date.now()
      });
    }

    if (window.toast) {
      window.toast.success(`Emergency rebalancing request submitted for ${shelterName}!`);
    }

    if (window.A11yUtil && typeof window.A11yUtil.announce === 'function') {
      window.A11yUtil.announce(`Emergency rebalancing request submitted for ${shelterName}.`);
    }

    this.closeRequestModal();
    this.render();
  }

  getFilteredShelters() {
    const shelters = window.store ? window.store.getShelters() : [];
    let list = [...shelters];

    const urgencyFilterEl = document.getElementById('filter-urgency');
    if (urgencyFilterEl) {
      const urgencyFilter = urgencyFilterEl.value;
      if (urgencyFilter === 'ISOLATED') {
        list = list.filter(s => s.isolated);
      } else if (urgencyFilter === 'CRITICAL') {
        list = list.filter(s => s.daysSupply < 1.5);
      } else if (urgencyFilter === 'CAUTION') {
        list = list.filter(s => s.daysSupply >= 1.5 && s.daysSupply <= 3.0);
      } else if (urgencyFilter === 'SAFE') {
        list = list.filter(s => s.daysSupply > 3.0);
      }
    }

    const shortageFilterEl = document.getElementById('filter-shortage');
    if (shortageFilterEl && shortageFilterEl.value !== 'ALL') {
      const val = shortageFilterEl.value.toLowerCase();
      list = list.filter(s => {
        if (s.shortageType && s.shortageType.toLowerCase() === val) return true;
        if (s.inventory) {
          return Object.keys(s.inventory).some(k => k.toLowerCase().includes(val));
        }
        return false;
      });
    }

    const searchInput = document.getElementById('shelter-search-input');
    if (searchInput && searchInput.value.trim()) {
      const q = searchInput.value.trim().toLowerCase();
      list = list.filter(s => {
        const nameMatch = s.name && s.name.toLowerCase().includes(q);
        const districtMatch = s.district && s.district.toLowerCase().includes(q);
        const typeMatch = s.shortageType && s.shortageType.toLowerCase().includes(q);
        const invMatch = s.inventory && Object.values(s.inventory).some(v => String(v).toLowerCase().includes(q));
        return nameMatch || districtMatch || typeMatch || invMatch;
      });
    }

    // Sort: Isolated first, then lowest days of supply
    list.sort((a, b) => {
      if (a.isolated !== b.isolated) return b.isolated ? -1 : 1;
      return a.daysSupply - b.daysSupply;
    });

    return list;
  }

  updateMetrics() {
    const allShelters = window.store ? window.store.getShelters() : [];

    const totalEl = document.getElementById('metric-shelters-count');
    const isolatedEl = document.getElementById('metric-isolated-count');
    const criticalEl = document.getElementById('metric-critical-count');
    const safeEl = document.getElementById('metric-safe-count');

    if (totalEl) totalEl.innerText = allShelters.length;
    if (isolatedEl) isolatedEl.innerText = allShelters.filter(s => s.isolated).length;
    if (criticalEl) criticalEl.innerText = allShelters.filter(s => s.daysSupply < 1.5).length;
    if (safeEl) safeEl.innerText = allShelters.filter(s => s.daysSupply > 3.0).length;
  }

  render() {
    this.updateMetrics();

    const container = document.getElementById('shelter-grid') || document.getElementById('shelter-cards-container');
    if (!container) return;

    const list = this.getFilteredShelters();
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--slate-500); padding: 32px;">No shelters match selected filters.</div>`;
      return;
    }

    list.forEach(s => {
      const isExpanded = this.expandedCards.has(s.id);
      const isIsolated = s.isolated;
      const isCritical = s.daysSupply < 1.5;

      const badgeType = isIsolated ? 'badge-blocked' : (isCritical ? 'badge-blocked' : (s.daysSupply <= 3.0 ? 'badge-caution' : 'badge-safe'));
      const badgeText = isIsolated ? '❖ ISOLATED (NO ROAD ACCESS)' : (isCritical ? 'CRITICAL SHORTAGE' : `${s.daysSupply} DAYS COVER`);

      const card = document.createElement('div');
      card.className = `card shelter-card ${isIsolated ? 'isolated-card' : (isCritical ? 'critical' : '')}`;
      card.innerHTML = `
        <div class="card-header">
          <div>
            <span class="badge ${badgeType}" style="margin-bottom: 6px;">${badgeText}</span>
            <h3 style="font-size: var(--text-base); margin: 0;">${s.name}</h3>
            <span class="text-meta">${s.district || 'District 4'}</span>
          </div>
          <div style="text-align: right;">
            <div class="data-numeral" style="font-size: 28px; color: ${isIsolated || isCritical ? 'var(--slate-800)' : 'var(--forest-700)'};">
              ${s.daysSupply} <span style="font-size: 12px; font-weight: normal;">Days</span>
            </div>
            <span class="text-meta">Pop: ${s.population}</span>
          </div>
        </div>

        ${isIsolated ? `
          <div style="background: var(--slate-800); color: var(--white); padding: 8px 12px; border-radius: var(--radius); font-size: 11px; margin-bottom: 12px;">
            ⚠️ <strong>ISOLATION DETECTED (A.4):</strong> Bridge B14 and primary corridors impassable. No safe road path from any warehouse depot.
          </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 12px; background: var(--bg-honeydew); padding: 8px; border-radius: var(--radius); margin-bottom: 12px;">
          <div><strong>Water:</strong><br><span style="font-size: 11px;">${s.inventory ? s.inventory.water : '400L'}</span></div>
          <div><strong>Insulin:</strong><br><span style="font-size: 11px;">${s.inventory ? s.inventory.insulin : '12 Vials'}</span></div>
          <div><strong>Rations:</strong><br><span style="font-size: 11px;">${s.inventory ? s.inventory.nutrition : '80 Packs'}</span></div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span class="text-meta">Incoming: <strong>${s.incomingConvoy || 'None Assigned'}</strong></span>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" style="font-size: 11px; padding: 4px 8px;" onclick="shelterBoard.toggleCard('${s.id}')">
              ${isExpanded ? 'Hide History' : 'View Sparkline'}
            </button>
            <button class="btn btn-primary" style="font-size: 11px; padding: 4px 8px;" onclick="window.location.href='supply-swap.html'">
              Request Supply Swap →
            </button>
          </div>
        </div>

        ${isExpanded ? `
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--border-hairline); font-size: 11px; color: var(--slate-500);">
            <strong>Supply History Trend (72 Hours):</strong>
            <div style="height: 36px; display: flex; align-items: flex-end; gap: 4px; margin-top: 6px;">
              <div style="height: 100%; width: 12px; background: var(--forest-600);" title="72h ago: 4.0 days"></div>
              <div style="height: 75%; width: 12px; background: var(--forest-600);" title="48h ago: 3.0 days"></div>
              <div style="height: 50%; width: 12px; background: var(--sage-500);" title="24h ago: 2.0 days"></div>
              <div style="height: 20%; width: 12px; background: var(--slate-800);" title="Current: ${s.daysSupply} days"></div>
            </div>
            <span class="text-meta" style="margin-top: 4px; display: block;">Consumption draw rate accelerating due to surge population.</span>
          </div>
        ` : ''}
      `;
      container.appendChild(card);
    });
  }

  toggleCard(id) {
    if (this.expandedCards.has(id)) this.expandedCards.delete(id);
    else this.expandedCards.add(id);
    this.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.shelterBoard = new ShelterBoardManager();
  window.shelterBoard.init();
});
