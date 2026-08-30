/* ==========================================
   DISISTA CONTROL — SHELTER BOARD MANAGER
   Telemetry Cards, Isolation Audits, & Rebalancing
   ========================================== */

class ShelterBoardManager {
  constructor() {
    this.expandedCards = new Set(['shelter-19']);
  }

  init() {
    this.render();
    if (window.store) {
      window.store.subscribe(() => this.render());
    }
    if (window.socket) {
      window.socket.on('shelter:demand_update', () => this.render());
      window.socket.on('route:recalculated', () => this.render());
    }
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
      list = list.filter(s => s.shortageType === shortageFilterEl.value);
    }

    // Sort: Isolated first, then lowest days of supply
    list.sort((a, b) => {
      if (a.isolated !== b.isolated) return b.isolated ? -1 : 1;
      return a.daysSupply - b.daysSupply;
    });

    return list;
  }

  render() {
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
      card.className = `card ${isIsolated ? 'critical' : (isCritical ? 'critical' : '')}`;
      card.style.cssText = `background: var(--white); ${isIsolated ? 'border: 2px solid var(--slate-800);' : ''}`;
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
