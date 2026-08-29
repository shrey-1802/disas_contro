/* FRONTEND GLOBAL APPLICATION SHELL & NAVBAR (Phase 1) */
import { Auth } from './auth.js';
import { formatRelativeTime } from './utils.js';

export const Navbar = {
  render(activePageId) {
    const topbar = document.getElementById('app-topbar');
    const sidebar = document.getElementById('app-sidebar');
    const user = Auth.getUser();

    if (topbar) {
      topbar.innerHTML = `
        <a href="dashboard.html" class="topbar__brand">
          <div class="topbar__emblem">NDMA</div>
          <span>DISISSTA Emergency Logistics</span>
        </a>
        <div class="topbar__meta">
          <div class="sync-indicator">
            Last Synced: <span id="sync-timestamp">${formatRelativeTime(new Date())}</span>
          </div>
          <div class="connectivity-indicator ${navigator.onLine ? 'connectivity-indicator--online' : 'connectivity-indicator--offline'}">
            <span class="connectivity-indicator__dot"></span>
            <span id="connectivity-label">${navigator.onLine ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <div class="user-chip">
            <strong>${user.username}</strong> (${user.role})
          </div>
          <button id="logout-btn" class="button button--secondary" style="padding: 4px 8px; font-size: 0.8rem;">Logout</button>
        </div>
      `;

      document.getElementById('logout-btn')?.addEventListener('click', () => Auth.logout());
    }

    if (sidebar) {
      const links = [
        { id: 'live-map', href: 'live-map.html', label: 'Live Situational Map', icon: '🗺️', roles: ['Control Room', 'District Admin', 'Field Driver'] },
        { id: 'convoy-dispatch', href: 'convoy-dispatch.html', label: 'Convoy Dispatch', icon: '🚚', roles: ['Control Room', 'District Admin'] },
        { id: 'shelter-board', href: 'shelter-board.html', label: 'Shelter & Supply Board', icon: '⛺', roles: ['Control Room', 'District Admin'] },
        { id: 'hazard-log', href: 'hazard-log.html', label: 'Hazard & Incident Log', icon: '⚠️', roles: ['Control Room', 'District Admin', 'Field Driver'] },
        { id: 'alerts', href: 'alerts.html', label: 'Emergency Alerts', icon: '🔔', roles: ['Control Room', 'District Admin'] },
        { id: 'settings', href: 'settings.html', label: 'System Settings', icon: '⚙️', roles: ['Control Room', 'District Admin', 'Field Driver'] }
      ];

      sidebar.innerHTML = links
        .filter(link => link.roles.includes(user.role))
        .map(link => `
          <a href="${link.href}" class="sidebar__nav-item ${link.id === activePageId ? 'sidebar__nav-item--active' : ''}">
            <span class="sidebar__icon">${link.icon}</span>
            <span class="sidebar__label">${link.label}</span>
          </a>
        `).join('');
    }
  }
};
