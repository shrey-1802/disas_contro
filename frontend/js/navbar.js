/* ==========================================
   DISISTA CONTROL — NAVBAR COMPONENT (PHASE 10 ENHANCED)
   Role-gated navigation + live freshness clock + offline pill
   + Ctrl+K search trigger + keyboard shortcuts
   ========================================== */

const NAV_ITEMS = [
  { id: 'live-map.html',        label: 'Live Map',        icon: '🌐', shortcut: '1' },
  { id: 'dashboard.html',       label: 'Dashboard',       icon: '📊', shortcut: '2' },
  { id: 'convoy-dispatch.html', label: 'Convoy Dispatch', icon: '🚛', shortcut: '3' },
  { id: 'shelter-board.html',   label: 'Shelter Board',   icon: '🏛️', shortcut: '4' },
  { id: 'hazard-log.html',      label: 'Hazard Log',      icon: '⚠️', shortcut: '5' },
  { id: 'supply-swap.html',     label: 'Supply Swap',     icon: '📦', shortcut: '6' },
  { id: 'alerts.html',          label: 'Alerts',          icon: '🔔', shortcut: '7' },
  { id: 'settings.html',        label: 'Settings',        icon: '⚙️', shortcut: ',' }
];

class NavbarComponent {
  constructor() {
    this.currentScreen = window.location.pathname.split('/').pop() || 'index.html';
    this._clockTimer = null;
    this._lastSyncTime = Date.now();
  }

  render() {
    // Enforce route guard
    if (window.auth && !window.auth.guardRoute(this.currentScreen)) return;

    const user       = window.auth ? window.auth.getCurrentUser() : null;
    const roleId     = user ? user.role : 'control_room';
    const roleConfig = window.ROLES ? Object.values(window.ROLES).find(r => r.id === roleId) : null;
    const allowedNavs = roleConfig ? roleConfig.nav : NAV_ITEMS.map(n => n.id);
    const visibleNavs = NAV_ITEMS.filter(item => allowedNavs.includes(item.id));

    const isField = window.auth ? window.auth.isFieldMode() : false;

    const header = document.createElement('header');
    header.className = 'app-header';
    header.setAttribute('role', 'banner');
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:var(--space-4);">
        <a href="${roleConfig ? roleConfig.defaultScreen : 'live-map.html'}" class="brand" aria-label="DISISTA CONTROL — go to home screen">
          <div class="brand-emblem" aria-hidden="true">D</div>
          <div class="brand-title">
            <span class="brand-name">DISISTA CONTROL</span>
            <span class="brand-sub">Relief Route Intelligence</span>
          </div>
        </a>

        <!-- Global Search Trigger (Ctrl+K) -->
        <button
          id="nav-search-trigger"
          onclick="window.globalSearch && window.globalSearch.open()"
          title="Global search (Ctrl+K)"
          aria-label="Open global search — keyboard shortcut Ctrl K"
          style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:var(--white);border-radius:var(--radius);padding:5px 12px;font-size:12px;cursor:pointer;min-height:32px;transition:background var(--motion-fast) var(--ease);"
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          Search
          <kbd style="font-size:10px;opacity:0.7;background:rgba(0,0,0,0.2);padding:1px 4px;border-radius:3px;">Ctrl K</kbd>
        </button>

        <nav class="app-nav" aria-label="Main navigation">
          ${visibleNavs.map(item => `
            <a
              href="${item.id}"
              class="nav-link ${this.currentScreen === item.id ? 'active' : ''}"
              aria-current="${this.currentScreen === item.id ? 'page' : 'false'}"
              title="${item.label} (Alt+${item.shortcut})"
              style="
                display:inline-flex;align-items:center;gap:5px;padding:6px 11px;
                color:${this.currentScreen === item.id ? 'var(--white)' : 'var(--sage-100)'};
                background:${this.currentScreen === item.id ? 'var(--forest-600)' : 'transparent'};
                border-radius:var(--radius);text-decoration:none;font-size:var(--text-sm);font-weight:500;
                transition:background var(--motion-fast) var(--ease);
              "
            >
              <span aria-hidden="true">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          `).join('')}
        </nav>
      </div>

      <div class="header-controls">
        <!-- Freshness / Sync status clock -->
        <div class="system-status" aria-live="polite" aria-label="Last data synchronisation time">
          <span class="status-dot" id="nav-sync-dot" aria-hidden="true"></span>
          <span id="nav-sync-status" style="font-size:11px;">SYNCED JUST NOW</span>
        </div>

        <!-- Offline queue pill (hidden when online + no queue) -->
        <span
          id="nav-offline-pill"
          role="status"
          aria-label="Offline sync queue status"
          style="display:none;font-size:11px;padding:2px 10px;border-radius:12px;background:var(--forest-700);color:var(--white);font-weight:600;"
        ></span>

        <!-- Alert count badge -->
        <a href="alerts.html" id="nav-alert-badge" aria-label="Open alerts inbox" style="display:none;position:relative;text-decoration:none;">
          <svg width="20" height="20" fill="none" stroke="var(--white)" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span id="nav-alert-count" style="position:absolute;top:-4px;right:-6px;background:var(--slate-800);color:var(--white);border-radius:9px;font-size:9px;font-weight:700;padding:1px 5px;min-width:16px;text-align:center;"></span>
        </a>

        <button
          class="btn btn-toggle ${isField ? 'active' : ''}"
          id="nav-field-btn"
          onclick="auth.toggleFieldMode(); navbar.updateFieldBtn();"
          title="Toggle Field Mode for outdoor tablet operation"
          aria-pressed="${isField}"
        >
          ${isField ? 'Field Mode ON' : 'Field Mode'}
        </button>

        <div style="display:flex;align-items:center;gap:var(--space-2);padding-left:var(--space-3);border-left:1px solid rgba(255,255,255,0.2);">
          <span class="badge" style="background:rgba(255,255,255,0.15);color:var(--white);border-color:rgba(255,255,255,0.3);font-size:11px;">
            ${roleConfig ? roleConfig.badge : 'Operator'}
          </span>
          <button
            class="btn btn-toggle"
            onclick="auth.logout()"
            style="background:rgba(0,0,0,0.2);color:var(--white);min-height:32px;font-size:12px;"
            aria-label="Sign out of DISISTA CONTROL"
          >
            Logout
          </button>
        </div>
      </div>
    `;

    const existingHeader = document.querySelector('.app-header');
    if (existingHeader) existingHeader.replaceWith(header);
    else document.body.prepend(header);

    this._startClock();
    this._bindAltShortcuts(visibleNavs);
    this._listenAlertCount();
  }

  /* ── Sync clock — updates "SYNCED X AGO" every 30s ── */
  _startClock() {
    if (this._clockTimer) clearInterval(this._clockTimer);
    this._clockTimer = setInterval(() => this._tickClock(), 30000);
    // Listen for socket-driven data updates
    document.addEventListener('disista:data-updated', () => {
      this._lastSyncTime = Date.now();
      this._tickClock();
    });
  }

  _tickClock() {
    const statusEl = document.getElementById('nav-sync-status');
    const dotEl    = document.getElementById('nav-sync-dot');
    if (!statusEl) return;

    const secsAgo = Math.floor((Date.now() - this._lastSyncTime) / 1000);
    let label, tier;

    if (secsAgo < 30)         { label = 'SYNCED JUST NOW'; tier = 'live'; }
    else if (secsAgo < 120)   { label = `SYNCED ${secsAgo}s AGO`;  tier = 'live'; }
    else if (secsAgo < 300)   { label = `SYNCED ${Math.floor(secsAgo/60)}m AGO`; tier = 'recent'; }
    else if (secsAgo < 900)   { label = `STALE — ${Math.floor(secsAgo/60)}m AGO`; tier = 'stale'; }
    else                      { label = `OFFLINE — ${Math.floor(secsAgo/60)}m AGO`; tier = 'unknown'; }

    statusEl.textContent = label;
    if (dotEl) {
      const colors = { live: '#8FAF8C', recent: '#5A7A68', stale: '#9CA3AF', unknown: '#6B7280' };
      dotEl.style.background = colors[tier] || '#8FAF8C';
    }
  }

  /* ── Alt+1..7 keyboard shortcuts for nav items ── */
  _bindAltShortcuts(navItems) {
    document.addEventListener('keydown', (e) => {
      // Skip if inside an input/textarea
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.altKey) {
        const item = navItems.find(n => n.shortcut === e.key);
        if (item) { e.preventDefault(); window.location.href = item.id; }
      }
    });
  }

  /* ── Poll alert count from store ── */
  _listenAlertCount() {
    setInterval(() => {
      const badge    = document.getElementById('nav-alert-badge');
      const countEl  = document.getElementById('nav-alert-count');
      if (!badge || !countEl) return;

      // Get unread alert count from store if available
      const alerts = window.store ? window.store.get('alerts') : [];
      const unread = (alerts || []).filter(a => !a.acknowledged).length;
      if (unread > 0) {
        badge.style.display = 'block';
        countEl.textContent = unread > 9 ? '9+' : String(unread);
      } else {
        badge.style.display = 'none';
      }
    }, 5000);
  }

  updateFieldBtn() {
    const btn = document.getElementById('nav-field-btn');
    if (btn && window.auth) {
      const isField = window.auth.isFieldMode();
      btn.textContent = isField ? 'Field Mode ON' : 'Field Mode';
      btn.classList.toggle('active', isField);
      btn.setAttribute('aria-pressed', String(isField));
    }
  }

  updateSyncTime() {
    this._lastSyncTime = Date.now();
    this._tickClock();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.navbar = new NavbarComponent();
  window.navbar.render();
});
