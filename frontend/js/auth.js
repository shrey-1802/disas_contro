/* ==========================================
   DISISTA CONTROL — AUTHENTICATION & ACCESS CONTROL
   Single Source of Truth for Roles & Permissions
   ========================================== */

const ROLES = {
  CONTROL_ROOM: {
    id: 'control_room',
    name: 'Control Room Officer',
    badge: 'HQ Operations',
    defaultScreen: 'live-map.html',
    description: 'Full network oversight, hazard report verification, and system-wide reroute approvals.',
    nav: ['live-map.html', 'convoy-dispatch.html', 'shelter-board.html', 'hazard-log.html', 'supply-swap.html', 'alerts.html', 'settings.html']
  },
  DISTRICT_ADMIN: {
    id: 'district_admin',
    name: 'District Administrator',
    badge: 'District HQ',
    defaultScreen: 'shelter-board.html',
    description: 'Regional oversight of convoys, shelters, and prioritized emergency alerts within district.',
    nav: ['live-map.html', 'convoy-dispatch.html', 'shelter-board.html', 'supply-swap.html', 'alerts.html', 'settings.html']
  },
  WAREHOUSE_MANAGER: {
    id: 'warehouse_manager',
    name: 'Warehouse Manager',
    badge: 'Logistics Hub',
    defaultScreen: 'dashboard.html',
    description: 'Local inventory control, convoy dispatch, and inter-warehouse Supply Swap execution.',
    nav: ['dashboard.html', 'convoy-dispatch.html', 'shelter-board.html', 'supply-swap.html', 'alerts.html', 'settings.html']
  },
  FIELD_DRIVER: {
    id: 'field_driver',
    name: 'Field Driver',
    badge: 'Field Ops',
    defaultScreen: 'hazard-log.html',
    description: 'Submits field hazard observations, views personal route status, and acknowledges reroutes.',
    nav: ['hazard-log.html', 'live-map.html', 'settings.html']
  }
};

const ACTION_PERMISSIONS = {
  verify_hazard: ['control_room'],
  ack_escalate_alert: ['control_room', 'district_admin'],
  approve_supply_swap: ['warehouse_manager'],
  dispatch_convoy: ['control_room', 'warehouse_manager'],
  submit_field_report: ['field_driver', 'control_room'],
  ack_reroute: ['field_driver'],
  toggle_field_mode: ['control_room', 'district_admin', 'warehouse_manager', 'field_driver']
};

class AuthManager {
  constructor() {
    this.STORAGE_KEY = 'disista_session';
    this.FIELD_MODE_KEY = 'disista_field_mode';
    this.initFieldMode();
  }

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  getCurrentRole() {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  isLoggedIn() {
    return !!this.getCurrentUser();
  }

  login(roleId, username = 'Operator') {
    const roleConfig = Object.values(ROLES).find(r => r.id === roleId);
    if (!roleConfig) {
      throw new Error(`Invalid role selected: ${roleId}`);
    }

    const session = {
      username: username || 'Operator',
      role: roleConfig.id,
      roleName: roleConfig.name,
      badge: roleConfig.badge,
      loginTime: new Date().toISOString(),
      district: 'District 4 (Northern Rift)',
      warehouse: 'Hub Alpha (Central Depot)'
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    return roleConfig.defaultScreen;
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    window.location.href = 'login.html';
  }

  canPerform(action) {
    const role = this.getCurrentRole();
    if (!role) return false;
    const allowed = ACTION_PERMISSIONS[action] || [];
    return allowed.includes(role);
  }

  guardRoute(currentScreen) {
    const user = this.getCurrentUser();
    if (!user) {
      if (currentScreen !== 'login.html' && currentScreen !== 'index.html') {
        window.location.href = 'login.html';
      }
      return false;
    }

    const roleConfig = Object.values(ROLES).find(r => r.id === user.role);
    if (!roleConfig) {
      this.logout();
      return false;
    }

    // Check if user is on login page while already authenticated
    if (currentScreen === 'login.html' || currentScreen === 'index.html') {
      window.location.href = roleConfig.defaultScreen;
      return true;
    }

    // Check permissions for target screen
    if (!roleConfig.nav.includes(currentScreen)) {
      console.warn(`Unauthorized access to ${currentScreen} for role ${user.role}. Redirecting...`);
      window.location.href = roleConfig.defaultScreen;
      return false;
    }

    return true;
  }

  /* Field Mode Toggle */
  initFieldMode() {
    const isFieldMode = localStorage.getItem(this.FIELD_MODE_KEY) === 'true';
    if (isFieldMode) {
      document.body.classList.add('field-mode');
    }
  }

  toggleFieldMode() {
    const isFieldMode = document.body.classList.toggle('field-mode');
    localStorage.setItem(this.FIELD_MODE_KEY, isFieldMode ? 'true' : 'false');
    return isFieldMode;
  }

  isFieldMode() {
    return document.body.classList.contains('field-mode');
  }
}

window.auth = new AuthManager();
window.ROLES = ROLES;
