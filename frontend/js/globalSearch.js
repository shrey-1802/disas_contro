/* ==========================================
   DISISTA CONTROL — GLOBAL COMMAND PALETTE & SEARCH (PHASE 10)
   Ctrl+K global search across all entities + keyboard navigation
   ========================================== */

class GlobalSearch {
  constructor() {
    this.isOpen = false;
    this.activeIndex = -1;
    this.results = [];
    this.cleanupEsc = null;

    this.entities = [
      // Navigation shortcuts
      { type: 'nav', icon: '🌐', title: 'Live Map', sub: 'Real-time hazard cartography & convoy routes', href: 'live-map.html', badge: 'Control Room' },
      { type: 'nav', icon: '🚛', title: 'Convoy Dispatch', sub: 'Fleet management, risk index & path diffs', href: 'convoy-dispatch.html', badge: 'Operations' },
      { type: 'nav', icon: '🏛️', title: 'Shelter Board', sub: 'Regional shelter supply telemetry', href: 'shelter-board.html', badge: 'District' },
      { type: 'nav', icon: '⚠️', title: 'Hazard Log', sub: 'Field observation feed & report submission', href: 'hazard-log.html', badge: 'Field Ops' },
      { type: 'nav', icon: '📦', title: 'Supply Swap', sub: 'Inter-warehouse rebalancing engine', href: 'supply-swap.html', badge: 'Warehouse' },
      { type: 'nav', icon: '🔔', title: 'Alerts Inbox', sub: 'Command center critical alerts & escalations', href: 'alerts.html', badge: 'Command' },
      { type: 'nav', icon: '⚙️', title: 'System Settings', sub: 'Field mode, offline sync, user management', href: 'settings.html', badge: 'All Roles' },

      // Actions
      { type: 'action', icon: '🛑', title: 'Block Road Segment', sub: 'Mark a road or bridge as hazardous or impassable', action: () => window.liveMap && (window.location.href = 'live-map.html') },
      { type: 'action', icon: '📋', title: 'Submit Field Hazard Report', sub: 'Submit a field observation to the fusion pipeline', action: () => window.location.href = 'hazard-log.html' },
      { type: 'action', icon: '✓', title: 'Toggle Field Mode', sub: 'Switch to outdoor tablet display mode', action: () => { if (window.auth) { window.auth.toggleFieldMode(); if (window.navbar) window.navbar.updateFieldBtn(); if (window.toast) window.toast.success('Field Mode toggled.'); } } },
      { type: 'action', icon: '📊', title: 'View Convoy Risk Index', sub: 'Sort dispatch table by composite risk score', action: () => window.location.href = 'convoy-dispatch.html' }
    ];
  }

  init() {
    this.injectDOM();
    this.bindKeys();
  }

  injectDOM() {
    if (document.getElementById('global-search-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'global-search-overlay';
    overlay.className = 'global-search-overlay hidden';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Global search and command palette');
    overlay.innerHTML = `
      <div class="global-search-modal" id="global-search-modal" role="combobox" aria-expanded="true" aria-haspopup="listbox">
        <div class="global-search-input-row">
          <svg width="18" height="18" fill="none" stroke="var(--slate-500)" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            id="global-search-input"
            type="text"
            placeholder="Search convoys, shelters, hazards, or run an action…"
            autocomplete="off"
            aria-autocomplete="list"
            aria-controls="global-search-results-list"
            aria-label="Global search"
          >
          <kbd style="font-size:11px;padding:2px 6px;background:var(--sage-100);border:1px solid var(--border-hairline);border-radius:4px;color:var(--slate-500);">ESC</kbd>
        </div>
        <div class="global-search-results" id="global-search-results-list" role="listbox" aria-label="Search results"></div>
        <div style="display:flex;align-items:center;gap:12px;padding:6px 14px;border-top:1px solid var(--border-hairline);font-size:11px;color:var(--slate-500);">
          <span><kbd style="padding:1px 5px;background:var(--sage-100);border:1px solid var(--border-hairline);border-radius:3px;">↑↓</kbd> Navigate</span>
          <span><kbd style="padding:1px 5px;background:var(--sage-100);border:1px solid var(--border-hairline);border-radius:3px;">Enter</kbd> Select</span>
          <span><kbd style="padding:1px 5px;background:var(--sage-100);border:1px solid var(--border-hairline);border-radius:3px;">ESC</kbd> Close</span>
          <span style="margin-left:auto;">DISISTA CONTROL — Global Command Palette</span>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    document.body.appendChild(overlay);

    const input = document.getElementById('global-search-input');
    if (input) {
      input.addEventListener('input', () => this.search(input.value));
      input.addEventListener('keydown', (e) => this.handleInputKey(e));
    }

    this.renderResults(this.entities);
  }

  bindKeys() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.isOpen ? this.close() : this.open();
      }
    });
  }

  open() {
    const overlay = document.getElementById('global-search-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    this.isOpen = true;
    this.activeIndex = -1;
    this.renderResults(this.entities);

    setTimeout(() => {
      const input = document.getElementById('global-search-input');
      if (input) { input.value = ''; input.focus(); }
    }, 50);

    this.cleanupEsc = window.A11yUtil ? window.A11yUtil.onEscape(() => this.close()) : null;
    if (window.A11yUtil) {
      const modal = document.getElementById('global-search-modal');
      if (modal) window.A11yUtil.trapFocus(modal);
    }
  }

  close() {
    const overlay = document.getElementById('global-search-overlay');
    if (overlay) overlay.classList.add('hidden');
    this.isOpen = false;
    if (this.cleanupEsc) { this.cleanupEsc(); this.cleanupEsc = null; }
  }

  search(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      this.renderResults(this.entities);
      return;
    }
    const filtered = this.entities.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.sub && e.sub.toLowerCase().includes(q))
    );
    this.results = filtered;
    this.activeIndex = -1;
    this.renderResults(filtered, q);
  }

  renderResults(items, query = '') {
    const container = document.getElementById('global-search-results-list');
    if (!container) return;
    this.results = items;

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:24px;color:var(--slate-500);font-size:13px;">
          No results found. Try a different search term.
        </div>`;
      return;
    }

    // Group by type
    const navItems    = items.filter(i => i.type === 'nav');
    const actionItems = items.filter(i => i.type === 'action');
    const dataItems   = items.filter(i => i.type === 'data');

    let html = '';
    let idx = 0;

    const renderGroup = (title, group) => {
      if (!group.length) return '';
      let g = `<div style="padding:6px 12px 2px;font-size:10px;font-weight:700;color:var(--slate-500);letter-spacing:0.06em;text-transform:uppercase;">${title}</div>`;
      group.forEach(item => {
        const hl = (text) => query ? SearchUtil && SearchUtil.highlight ? SearchUtil.highlight(text, query) : text : text;
        g += `
          <div class="search-result-item" role="option" data-idx="${idx}" aria-selected="false"
               onclick="window.globalSearch.selectItem(${idx})"
               onmouseover="window.globalSearch.setActive(${idx})">
            <div class="search-result-icon">${item.icon}</div>
            <div style="flex:1;min-width:0;">
              <div class="search-result-title">${hl(item.title)}</div>
              <div class="search-result-sub">${hl(item.sub || '')}</div>
            </div>
            ${item.badge ? `<span class="badge badge-safe" style="font-size:10px;padding:1px 6px;">${item.badge}</span>` : ''}
          </div>
        `;
        idx++;
      });
      return g;
    };

    html += renderGroup('Navigation', navItems);
    html += renderGroup('Quick Actions', actionItems);
    html += renderGroup('Data Results', dataItems);

    container.innerHTML = html;
  }

  setActive(idx) {
    this.activeIndex = idx;
    document.querySelectorAll('.search-result-item').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
      el.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });
  }

  selectItem(idx) {
    const item = this.results[idx];
    if (!item) return;
    this.close();
    if (item.href) {
      window.location.href = item.href;
    } else if (item.action) {
      item.action();
    }
  }

  handleInputKey(e) {
    const count = this.results.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.setActive(Math.min(this.activeIndex + 1, count - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.setActive(Math.max(this.activeIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.activeIndex >= 0) this.selectItem(this.activeIndex);
    }
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  window.globalSearch = new GlobalSearch();
  window.globalSearch.init();
});
