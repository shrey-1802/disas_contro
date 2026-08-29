/* Global Search & Modal Search Utility (Phase 17 + Ctrl+K Support) */

export const SearchUtil = {
  createModal() {
    let modal = document.getElementById('global-search-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'global-search-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.style.zIndex = '9999';

    modal.innerHTML = `
      <div class="modal" style="max-width: 650px; padding: 0; overflow: hidden;">
        <header style="background: var(--forest-600); color: #FFF; padding: var(--space-md); display: flex; justify-content: space-between; align-items: center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem;">🔍</span>
            <strong style="font-size:1rem;">Global Operations Search</strong>
          </div>
          <span style="font-size:12px; opacity:0.8; background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:4px;">ESC to close</span>
        </header>
        <div style="padding: var(--space-md); background: var(--bg-honeydew);">
          <input type="search" id="modal-search-input" placeholder="Search inventory, warehouse, convoy ID, shelter, hazard..." style="width:100%; font-size:1.1rem; padding:12px 16px; border:2px solid var(--forest-600);">
        </div>
        <div id="modal-search-results" style="max-height: 400px; overflow-y: auto; padding: var(--space-md); background: #FFF; display: flex; flex-direction: column; gap: 8px;">
          <div class="text-xs" style="color:var(--slate-600); text-align:center; padding: 20px;">Type a query to search across all operational data.</div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    const input = modal.querySelector('#modal-search-input');
    if (input) {
      input.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        this.renderSearchResults(query);
      });
    }

    return modal;
  },

  renderSearchResults(query) {
    const resultsContainer = document.getElementById('modal-search-results');
    if (!resultsContainer) return;

    if (!query || query.length < 2) {
      resultsContainer.innerHTML = `<div class="text-xs" style="color:var(--slate-600); text-align:center; padding: 20px;">Type at least 2 characters to search...</div>`;
      return;
    }

    const matches = [
      { type: 'INVENTORY', title: 'Refrigerated Insulin (250 vials)', sub: 'Regional Warehouse Alpha • 60 transferable doses', link: 'supply-swap.html' },
      { type: 'SUPPLY REQUEST', title: 'Shelter 06 (East Valley Sector 4)', sub: 'Insulin shortage • 4 hours time-to-harm', link: 'supply-swap.html' },
      { type: 'CONVOY', title: 'Convoy CV-014 (Water Supplies)', sub: 'Rerouted via Feeder Corridor C • Driver Marcus V.', link: 'convoy-dispatch.html' },
      { type: 'HAZARD', title: 'Bridge B-14 Submerged (1.4m Flood)', sub: 'Sector 6 • Impassable hazard reported by Sensor', link: 'hazard-log.html' },
      { type: 'ALERT', title: 'Convoy 14 Stranded Warning', sub: 'Critical Severity • Acknowledged by Control Room', link: 'alerts.html' }
    ].filter(item => item.title.toLowerCase().includes(query) || item.sub.toLowerCase().includes(query) || item.type.toLowerCase().includes(query));

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div class="text-xs" style="color:var(--slate-600); text-align:center; padding: 20px;">No operational entities found matching "${query}".</div>`;
      return;
    }

    resultsContainer.innerHTML = matches.map(m => `
      <a href="${m.link}" style="display:block; padding:10px 14px; background:var(--bg-honeydew); border:1px solid var(--slate-300); border-radius:6px; color:inherit; text-decoration:none;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.9rem; color:var(--slate-900);">${m.title}</strong>
          <span class="priority-badge priority-badge--high" style="font-size:10px;">${m.type}</span>
        </div>
        <div class="text-xs" style="color:var(--slate-700); margin-top:2px;">${m.sub}</div>
      </a>
    `).join('');
  },

  initGlobalShortcuts() {
    this.createModal();

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const modal = this.createModal();
        modal.style.display = 'flex';
        const input = modal.querySelector('#modal-search-input');
        if (input) {
          input.focus();
          input.select();
        }
      } else if (e.key === 'Escape') {
        const modal = document.getElementById('global-search-modal');
        if (modal) modal.style.display = 'none';
      }
    });
  }
};

SearchUtil.initGlobalShortcuts();
export default SearchUtil;
