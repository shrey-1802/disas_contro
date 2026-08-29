/**
 * Authentication & Role Management Module
 * Relief Supply Chain Resilience & Rerouting System
 */

const STORAGE_KEY_TOKEN = 'disissta_auth_token';
const STORAGE_KEY_USER = 'disissta_user';
const STORAGE_KEY_FIELD_MODE = 'disissta_field_mode';

export const ROLES = {
  CONTROL_ROOM: 'Control Room',
  DISTRICT_ADMIN: 'District Admin',
  FIELD_DRIVER: 'Field Driver'
};

// Default fallback role configuration if unauthenticated demo mode
const DEFAULT_USER = {
  id: 'usr_001',
  name: 'Operator Officer',
  role: ROLES.CONTROL_ROOM,
  email: 'control@disaster.gov'
};

class AuthManager {
  constructor() {
    this.user = this.loadUser();
    this.token = localStorage.getItem(STORAGE_KEY_TOKEN) || null;
    this.fieldMode = localStorage.getItem(STORAGE_KEY_FIELD_MODE) === 'true';
    this.applyFieldMode();
  }

  loadUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      return stored ? JSON.parse(stored) : DEFAULT_USER;
    } catch (e) {
      return DEFAULT_USER;
    }
  }

  getUser() {
    return this.user;
  }

  getRole() {
    return this.user ? this.user.role : ROLES.CONTROL_ROOM;
  }

  isAuthenticated() {
    return !!this.user;
  }

  login(userObj, token = 'mock_jwt_token_12345') {
    this.user = userObj;
    this.token = token;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  }

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    window.location.href = 'login.html';
  }

  toggleFieldMode(enable) {
    this.fieldMode = enable !== undefined ? enable : !this.fieldMode;
    localStorage.setItem(STORAGE_KEY_FIELD_MODE, this.fieldMode ? 'true' : 'false');
    this.applyFieldMode();
    return this.fieldMode;
  }

  isFieldMode() {
    return this.fieldMode;
  }

  applyFieldMode() {
    if (this.fieldMode) {
      document.body.classList.add('field-mode');
    } else {
      document.body.classList.remove('field-mode');
    }
  }

  canAccessPage(pageName) {
    const role = this.getRole();
    switch (role) {
      case ROLES.CONTROL_ROOM:
        return true; // Full operational access
      case ROLES.DISTRICT_ADMIN:
        return pageName !== 'hazard-log.html'; // Admin sees live map, convoy dispatch, shelter board, alerts, settings
      case ROLES.FIELD_DRIVER:
        return pageName === 'hazard-log.html' || pageName === 'live-map.html' || pageName === 'settings.html' || pageName === 'dashboard.html';
      default:
        return true;
    }
  }

  getRoleLandingPage(role = null) {
    const r = role || this.getRole();
    switch (r) {
      case ROLES.CONTROL_ROOM:
        return 'live-map.html';
      case ROLES.DISTRICT_ADMIN:
        return 'shelter-board.html';
      case ROLES.FIELD_DRIVER:
        return 'hazard-log.html';
      default:
        return 'live-map.html';
    }
  }

  checkSessionGuard() {
    if (this.isAuthenticated() && window.location.pathname.endsWith('login.html')) {
      window.location.href = this.getRoleLandingPage();
    }
  }
}

export const auth = new AuthManager();
window.auth = auth;

