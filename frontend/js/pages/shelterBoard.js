/* ==========================================
   DISISTA CONTROL — SHELTER BOARD MANAGER
   Telemetry Cards, Isolation Audits, & Rebalancing
   ========================================== */

class ShelterBoardManager {
  constructor() {
    this.shelters = [
      {
        id: 'shelter-19',
        name: 'Shelter 19 (Island Reach)',
        district: 'District 4 (Northern Rift)',
        population: 2100,
        daysSupply: 0.5,
        urgency: 'critical',
        isolated: true,
        incomingConvoy: null,
        shortageType: 'medical',
        inventory: {
          water: '400 Liters (Critically Low)',
          insulin: '12 Vials (0.2 Days Cover)',
          nutrition: '80 Ration Packs'
        }
      },
      {
        id: 'shelter-12',
        name: 'Shelter 12 (North Community)',
        district: 'District 4 (Northern Rift)',
        population: 1450,
        daysSupply: 1.5,
        urgency: 'critical',
        isolated: false,
        incomingConvoy: 'Convoy 14 (ETA 45m)',
        shortageType: 'medical',
        inventory: {
          water: '1,200 Liters',
          insulin: '45 Vials (1.2 Days Cover)',
          nutrition: '300 Ration Packs'
        }
      },
      {
        id: 'shelter-04',
        name: 'Shelter 04 (Rift Valley High)',
        district: 'District 4 (Northern Rift)',
        population: 920,
        daysSupply: 3.2,
        urgency: 'safe',
        isolated: false,
        incomingConvoy: 'Convoy 22 (ETA 1h 20m)',
        shortageType: 'food',
        inventory: {
          water: '3,500 Liters',
          insulin: '120 Vials (3.5 Days Cover)',
          nutrition: '850 Ration Packs'
        }
      }
    ];

    this.expandedCards = new Set(['shelter-19']); // Open isolated shelter by default
  }

  init() {
    this.render();
    this.auditIsolatedShelters();
  }

  auditIsolatedShelters() {
    const isolated = this.shelters.filter(s => s.isolated);
    if (isolated.length > 0) {
      const names = isolated.map(s => s.name).join(', ');
      toast.showBanner(`ISOLATED SHELTER DETECTED: ${names} has NO reachable road path from any warehouse depot!`);
    }
  }

  getFilteredShelters() {
    let list = [...this.shelters];

    const urgencyFilter = document.getElementById('filter-urgency').value;
    if (urgencyFilter === 'ISOLATED') {
      list = list.filter(s => s.isolated);
    } else if (urgencyFilter === 'CRITICAL') {
      list = list.filter(s => s.daysSupply < 1.5);
    } else if (urgencyFilter === 'CAUTION') {
      list = list.filter(s => s.daysSupply >= 1.5 && s.daysSupply <= 3.0);
    } else if (urgencyFilter === 'SAFE') {
      list = list.filter(s => s.daysSupply > 3.0);
    }

    const shortageFilter = document.getElementById('filter-shortage').value;
    if (shortageFilter !== 'ALL') {
      list = list.filter(s => s.shortageType === shortageFilter);
    }

    // Sort: Isolated first, then lowest days of supply
    list.sort((a, b) => {
      if (a.isolated !== b.isolated) return b.isolated ? 1 : -1;
      return a.daysSupply - b.daysSupply;
    });

    return list;
  }

  render() {
    const container = document.getElementById('shelter-cards-container');
    const shelters = this.getFilteredShelters();
    container.innerHTML = '';

    // Update Metric Badges
    document.getElementById('metric-shelters-count').innerText = this.shelters.length;
    document.getElementById('metric-isolated-count').innerText = this.shelters.filter(s => s.isolated).length;
    document.getElementById('metric-critical-count').innerText = this.shelters.filter(s => s.daysSupply < 1.5).length;
    document.getElementById('metric-safe-count').innerText = this.shelters.filter(s => s.daysSupply >= 3.0).length;

    if (shelters.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--white); border: 1px solid var(--border-hairline); border-radius: var(--radius);">
          <p style="color: var(--slate-500);">No shelters matching active filter parameters.</p>
        </div>
      `;
      return;
    }

    shelters.forEach(s => {
      const isExpanded = this.expandedCards.has(s.id);
      const daysClass = s.daysSupply < 1.5 ? 'critical' : (s.daysSupply <= 3.0 ? 'caution' : 'safe');
      const badgeHtml = s.isolated
        ? `<span class="badge badge-blocked" style="border: 2px solid var(--slate-800); font-weight: 700;">❖ ISOLATED SHELTER</span>`
        : window.statusBadge.render(s.urgency === 'critical' ? 'impassable' : 'normal', { label: s.urgency.toUpperCase() });

      const card = document.createElement('div');
      card.className = `card shelter-card hover-focus ${s.isolated ? 'isolated-card' : ''}`;
      card.innerHTML = `
        <div class="shelter-card-top">
          <div>
            <h3 style="font-size: var(--text-base); margin-bottom: 2px;">${s.name}</h3>
            <span class="text-meta">👥 ${s.population} Occupants · ${s.district}</span>
          </div>
          <div>${badgeHtml}</div>
        </div>

        <!-- DAYS OF SUPPLY TABULAR DISPLAY -->
        <div class="days-cover-display">
          <span class="panel-label">ESTIMATED SUPPLY COVER</span>
          <div class="days-cover-numeral ${daysClass}">${s.daysSupply} Days</div>
          <div class="text-meta" style="margin-top: 2px;">
            ${s.incomingConvoy ? `🚚 Incoming: <strong>${s.incomingConvoy}</strong>` : `<span style="color: var(--slate-800); font-weight: 600;">⚠️ NO INCOMING CONVOY EN ROUTE</span>`}
          </div>
        </div>

        <div style="display: flex; gap: var(--space-2);">
          <button class="btn btn-secondary" style="flex: 1; min-height: 36px; font-size: var(--text-xs);" onclick="shelterBoard.toggleCard('${s.id}')">
            ${isExpanded ? 'Hide Telemetry ▲' : 'View Telemetry ▼'}
          </button>
          <button class="btn btn-primary" style="flex: 1; min-height: 36px; font-size: var(--text-xs);" onclick="shelterBoard.openRequestModal('${s.id}')">
            Request Rebalancing →
          </button>
        </div>

        <!-- EXPANDABLE INVENTORY BREAKDOWN -->
        ${isExpanded ? `
          <div class="supply-breakdown-list">
            <div class="supply-item">
              <strong>💧 Clean Water:</strong><br>${s.inventory.water}
            </div>
            <div class="supply-item">
              <strong>🩸 Insulin / Vials:</strong><br>${s.inventory.insulin}
            </div>
            <div class="supply-item" style="grid-column: 1 / -1;">
              <strong>🍼 Infant & Food Rations:</strong><br>${s.inventory.nutrition}
            </div>
          </div>

          <div class="sparkline-placeholder">
            <span>📊 7-Day Demand Trend: Not enough history data points yet — telemetry logging active.</span>
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

  applyFilters() {
    this.render();
  }

  resetFilters() {
    document.getElementById('filter-urgency').value = 'ALL';
    document.getElementById('filter-shortage').value = 'ALL';
    this.render();
  }

  openRequestModal(shelterId = null) {
    if (shelterId) {
      document.getElementById('rebalance-shelter-select').value = shelterId;
    }
    document.getElementById('rebalance-modal').classList.remove('hidden');
  }

  closeRequestModal() {
    document.getElementById('rebalance-modal').classList.add('hidden');
  }

  handleRebalanceSubmit(e) {
    e.preventDefault();
    const shelter = document.getElementById('rebalance-shelter-select').value;
    const category = document.getElementById('rebalance-category').value;
    const qty = document.getElementById('rebalance-qty').value;

    this.closeRequestModal();
    toast.success(`Emergency Rebalancing Request for ${category} (${qty}) submitted! Routed to Supply Swap module.`);
    setTimeout(() => {
      window.location.href = 'supply-swap.html';
    }, 1200);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.shelterBoard = new ShelterBoardManager();
  window.shelterBoard.init();
});
