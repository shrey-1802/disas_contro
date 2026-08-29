/* Shared Navbar and Global Shell Management */

// Define page structure per role
const ROLE_NAVIGATION = {
  control_room: [
    { label: 'Live Map', href: 'live-map.html', icon: 'map' },
    { label: 'Convoy Dispatch', href: 'convoy-dispatch.html', icon: 'truck' },
    { label: 'Shelter Board', href: 'shelter-board.html', icon: 'home' },
    { label: 'Hazard Log', href: 'hazard-log.html', icon: 'alert-triangle' },
    { label: 'Alerts', href: 'alerts.html', icon: 'bell' },
    { label: 'Settings', href: 'settings.html', icon: 'settings' }
  ],
  district_admin: [
    { label: 'Live Map', href: 'live-map.html', icon: 'map' },
    { label: 'Convoy Dispatch', href: 'convoy-dispatch.html', icon: 'truck' },
    { label: 'Shelter Board', href: 'shelter-board.html', icon: 'home' },
    { label: 'Alerts', href: 'alerts.html', icon: 'bell' },
    { label: 'Settings', href: 'settings.html', icon: 'settings' }
  ],
  field_driver: [
    { label: 'Hazard Log', href: 'hazard-log.html', icon: 'alert-triangle' },
    { label: 'Live Map (Read-Only)', href: 'live-map.html?readonly=true', icon: 'map' },
    { label: 'Settings', href: 'settings.html', icon: 'settings' }
  ]
};

// SVG icons mapping
const ICONS = {
  map: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>`,
  truck: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`,
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  'alert-triangle': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  bell: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
};

/**
 * Initializes the global navigation bar and updates based on the current role.
 */
function initNavbar() {
  const currentRole = localStorage.getItem('user-role') || 'control_room';
  const navContainer = document.getElementById('sidebar-nav-list');
  if (!navContainer) return;

  // Clear existing items
  navContainer.innerHTML = '';

  const links = ROLE_NAVIGATION[currentRole] || ROLE_NAVIGATION.control_room;
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  links.forEach(link => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    
    // Check active state
    const isActive = currentPath === link.href || 
                     (currentPath === '' && link.href === 'live-map.html') ||
                     (currentPath.includes('live-map') && link.href.includes('live-map'));
    
    a.href = link.href;
    a.className = `nav-link${isActive ? ' active' : ''}`;
    a.innerHTML = `
      ${ICONS[link.icon] || ''}
      <span>${link.label}</span>
    `;
    
    li.appendChild(a);
    navContainer.appendChild(li);
  });
}

/**
 * Updates the online/offline status in the global header.
 */
function updateConnectivityStatus() {
  const connectionIndicator = document.getElementById('connectivity-indicator');
  const syncTimeIndicator = document.getElementById('last-synced-time');
  
  if (!connectionIndicator) return;

  const socketStatus = localStorage.getItem('socket-status') || 'disconnected';
  const pendingCount = parseInt(localStorage.getItem('pending-actions-count') || '0', 10);
  const syncStatus = localStorage.getItem('sync-status') || 'idle';

  if (syncStatus === 'syncing') {
    connectionIndicator.className = 'connectivity-indicator reconnecting';
    connectionIndicator.innerHTML = `
      <span class="indicator-dot"></span>
      <span>Syncing Queue...</span>
    `;
  } else if (socketStatus === 'connected') {
    connectionIndicator.className = 'connectivity-indicator online';
    connectionIndicator.innerHTML = `
      <span class="indicator-dot"></span>
      <span>System Online</span>
    `;
  } else if (socketStatus === 'reconnecting') {
    connectionIndicator.className = 'connectivity-indicator reconnecting';
    connectionIndicator.innerHTML = `
      <span class="indicator-dot"></span>
      <span>Reconnecting...</span>
    `;
  } else {
    connectionIndicator.className = 'connectivity-indicator offline';
    const pendingText = pendingCount > 0 ? ` (${pendingCount} pending)` : '';
    connectionIndicator.innerHTML = `
      <span class="indicator-dot"></span>
      <span>System Offline${pendingText}</span>
    `;
  }

  // Update sync timestamp if requested
  if (syncTimeIndicator) {
    const lastSyncStr = localStorage.getItem('last-sync-timestamp');
    if (lastSyncStr) {
      const lastSync = new Date(lastSyncStr);
      const minutesAgo = Math.floor((new Date() - lastSync) / 60000);
      syncTimeIndicator.textContent = minutesAgo <= 0 ? 'Just now' : `${minutesAgo}m ago`;
    } else {
      syncTimeIndicator.textContent = 'Never';
    }
  }
}

// Watch connection changes
window.addEventListener('online', updateConnectivityStatus);
window.addEventListener('offline', updateConnectivityStatus);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  updateConnectivityStatus();

  // Listen for IndexedDB sync update events
  window.addEventListener('sync-updated', (event) => {
    localStorage.setItem('pending-actions-count', event.detail.pendingCount);
    updateConnectivityStatus();
  });

  window.addEventListener('sync-status-change', (event) => {
    localStorage.setItem('sync-status', event.detail.status);
    updateConnectivityStatus();
  });

  // Listen for Socket connection lifecycle changes
  window.addEventListener('socket-status-change', (event) => {
    updateConnectivityStatus();
  });
  
  // Set a periodic interval to update the "last synced" time display
  setInterval(updateConnectivityStatus, 30000);
});

// Export helper for global use if modularized
window.NavbarEngine = {
  refresh: initNavbar,
  updateConnectivity: updateConnectivityStatus
};
