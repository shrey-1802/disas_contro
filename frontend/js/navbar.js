/**
 * Navigation & Global Application Shell Controller
 * Relief Supply Chain Resilience & Rerouting System
 */

import { auth, ROLES } from './auth.js';

export function renderGlobalShell(activePageFilename) {
  const currentRole = auth.getRole();
  const currentUser = auth.getUser();

  // Enforce access permission
  if (!auth.canAccessPage(activePageFilename)) {
    console.warn(`[Nav] Access denied for role ${currentRole} to page ${activePageFilename}`);
  }

  // Render Top Operational Bar
  const headerElem = document.getElementById('app-header');
  if (headerElem) {
    headerElem.innerHTML = `
      <div class="app-header__identity">
        <div class="app-header__emblem" title="Government Emergency Management System">GOV</div>
        <div class="app-header__title">
          <span class="app-header__sysname">DISISSTA OPERATIONAL CONTROL</span>
          <span class="app-header__subtitle">Relief Supply Chain & Rerouting Platform</span>
        </div>
      </div>

      <div class="app-header__center">
        <div class="search-bar">
          <span class="search-bar__icon">🔍</span>
          <input type="search" id="global-search-input" placeholder="Search convoy ID, shelter, or hazard region..." aria-label="Global Operational Search">
        </div>
      </div>

      <div class="app-header__actions">
        <div class="sync-indicator" id="last-sync-indicator" title="System Synchronization Status">
          <span>🔄</span> <span id="sync-timestamp-text">Synced 1m ago</span>
        </div>

        <div class="connectivity-indicator connectivity-indicator--online" id="connectivity-indicator-badge">
          <span class="connectivity-indicator__dot"></span>
          <span id="connectivity-status-text">ONLINE</span>
        </div>

        <button class="button button--secondary text-xs" id="field-mode-toggle" title="Toggle Field Mode (High-contrast outdoor tablet optimization)">
          ${auth.isFieldMode() ? '☀️ Field Mode ON' : '📱 Field Mode'}
        </button>

        <div class="app-header__user" style="display:flex; align-items:center; gap:8px;">
          <span class="priority-badge priority-badge--high">${currentRole}</span>
          <button class="button button--secondary text-xs" id="logout-btn" title="Exit Operational Session">Logout</button>
        </div>
      </div>
    `;

    // Bind Header Events
    document.getElementById('field-mode-toggle')?.addEventListener('click', () => {
      const isField = auth.toggleFieldMode();
      renderGlobalShell(activePageFilename);
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      auth.logout();
    });
  }

  // Render Role-Based Navigation Sidebar
  const navElem = document.getElementById('app-nav');
  if (navElem) {
    const navItems = [
      { id: 'dashboard.html', label: 'Overview Dashboard', icon: '📊', roles: [ROLES.CONTROL_ROOM, ROLES.DISTRICT_ADMIN, ROLES.FIELD_DRIVER] },
      { id: 'live-map.html', label: 'Live Situational Map', icon: '🗺️', roles: [ROLES.CONTROL_ROOM, ROLES.DISTRICT_ADMIN, ROLES.FIELD_DRIVER] },
      { id: 'convoy-dispatch.html', label: 'Convoy Dispatch', icon: '🚛', roles: [ROLES.CONTROL_ROOM, ROLES.DISTRICT_ADMIN] },
      { id: 'shelter-board.html', label: 'Shelter & Supply Board', icon: '🏠', roles: [ROLES.CONTROL_ROOM, ROLES.DISTRICT_ADMIN] },
      { id: 'hazard-log.html', label: 'Hazard & Incident Log', icon: '⚠️', roles: [ROLES.CONTROL_ROOM, ROLES.FIELD_DRIVER] },
      { id: 'alerts.html', label: 'Alerts & Commands', icon: '🚨', roles: [ROLES.CONTROL_ROOM, ROLES.DISTRICT_ADMIN] },
      { id: 'settings.html', label: 'System Settings', icon: '⚙️', roles: [ROLES.CONTROL_ROOM, ROLES.DISTRICT_ADMIN, ROLES.FIELD_DRIVER] }
    ];

    const filteredItems = navItems.filter(item => item.roles.includes(currentRole));

    navElem.innerHTML = `
      <ul class="app-nav__list">
        ${filteredItems.map(item => `
          <li class="app-nav__item ${activePageFilename === item.id ? 'active' : ''}">
            <a href="${item.id}">
              <span class="app-nav__icon">${item.icon}</span>
              <span class="app-nav__label">${item.label}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    `;
  }

  // Listen for connectivity changes
  window.addEventListener('connectivityChange', (e) => {
    const indicator = document.getElementById('connectivity-indicator-badge');
    const text = document.getElementById('connectivity-status-text');
    if (indicator && text) {
      if (e.detail.online) {
        indicator.className = 'connectivity-indicator connectivity-indicator--online';
        text.textContent = 'ONLINE';
      } else {
        indicator.className = 'connectivity-indicator connectivity-indicator--offline';
        text.textContent = 'OFFLINE MODE';
      }
    }
  });
}
