/* ==========================================
   DISISTA CONTROL — NAVBAR COMPONENT
   Role-Scoped Shared Top & Navigation Bar
   ========================================== */

const NAV_ITEMS = [
  { id: 'live-map.html', label: 'Live Map', icon: '🌐' },
  { id: 'dashboard.html', label: 'Dashboard', icon: '📊' },
  { id: 'convoy-dispatch.html', label: 'Convoy Dispatch', icon: '🚛' },
  { id: 'shelter-board.html', label: 'Shelter Board', icon: '🏛️' },
  { id: 'hazard-log.html', label: 'Hazard Log', icon: '⚠️' },
  { id: 'supply-swap.html', label: 'Supply Swap', icon: '📦' },
  { id: 'alerts.html', label: 'Alerts Inbox', icon: '🔔' },
  { id: 'settings.html', label: 'Settings', icon: '⚙️' }
];

class NavbarComponent {
  constructor() {
    this.currentScreen = window.location.pathname.split('/').pop() || 'index.html';
  }

  render() {
    // Enforce route guard
    if (window.auth && !window.auth.guardRoute(this.currentScreen)) {
      return;
    }

    const user = window.auth ? window.auth.getCurrentUser() : null;
    const roleId = user ? user.role : 'control_room';
    const roleConfig = window.ROLES ? Object.values(window.ROLES).find(r => r.id === roleId) : null;
    const allowedNavs = roleConfig ? roleConfig.nav : NAV_ITEMS.map(n => n.id);

    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--space-5);">
        <a href="${roleConfig ? roleConfig.defaultScreen : 'live-map.html'}" class="brand">
          <div class="brand-emblem">D</div>
          <div class="brand-title">
            <span class="brand-name">DISISTA CONTROL</span>
            <span class="brand-sub">Relief Route Intelligence</span>
          </div>
        </a>

        <nav class="app-nav" style="display: flex; gap: var(--space-1);">
          ${NAV_ITEMS.filter(item => allowedNavs.includes(item.id)).map(item => `
            <a href="${item.id}" class="nav-link ${this.currentScreen === item.id ? 'active' : ''}" style="
              display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
              color: ${this.currentScreen === item.id ? 'var(--white)' : 'var(--sage-100)'};
              background: ${this.currentScreen === item.id ? 'var(--forest-600)' : 'transparent'};
              border-radius: var(--radius); text-decoration: none; font-size: var(--text-sm); font-weight: 500;
              transition: background var(--motion-fast) var(--ease);
            ">
              <span>${item.icon}</span>
              <span>${item.label}</span>
            </a>
          `).join('')}
        </nav>
      </div>

      <div class="header-controls">
        <div class="system-status">
          <span class="status-dot"></span>
          <span id="nav-sync-status">SYNCED 1m AGO</span>
        </div>

        <button class="btn btn-toggle" id="nav-field-btn" onclick="auth.toggleFieldMode(); navbar.updateFieldBtn();">
          ${auth.isFieldMode() ? 'Field Mode: ON' : 'Field Mode: OFF'}
        </button>

        <div style="display: flex; align-items: center; gap: var(--space-2); padding-left: var(--space-3); border-left: 1px solid rgba(255,255,255,0.2);">
          <span class="badge badge-safe" style="background: rgba(255,255,255,0.15); color: var(--white); border-color: rgba(255,255,255,0.3);">
            ${roleConfig ? roleConfig.badge : 'Operator'}
          </span>
          <button class="btn btn-toggle" onclick="auth.logout()" title="Sign Out" style="background: rgba(0,0,0,0.2); color: var(--white);">
            Logout
          </button>
        </div>
      </div>
    `;

    const existingHeader = document.querySelector('.app-header');
    if (existingHeader) {
      existingHeader.replaceWith(header);
    } else {
      document.body.prepend(header);
    }
  }

  updateFieldBtn() {
    const btn = document.getElementById('nav-field-btn');
    if (btn && window.auth) {
      const isField = window.auth.isFieldMode();
      btn.innerText = `Field Mode: ${isField ? 'ON' : 'OFF'}`;
      btn.classList.toggle('active', isField);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.navbar = new NavbarComponent();
  window.navbar.render();
});
