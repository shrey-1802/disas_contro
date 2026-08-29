/* FRONTEND AUTHENTICATION & ROLE SESSION MANAGER */

export const ROLES = {
  CONTROL_ROOM: 'Control Room',
  DISTRICT_ADMIN: 'District Admin',
  FIELD_DRIVER: 'Field Driver'
};

export const Auth = {
  getUser() {
    const userStr = localStorage.getItem('disissta_user');
    if (!userStr) {
      return { username: 'Operator', role: ROLES.CONTROL_ROOM };
    }
    try {
      return JSON.parse(userStr);
    } catch {
      return { username: 'Operator', role: ROLES.CONTROL_ROOM };
    }
  },

  getRole() {
    return this.getUser().role || ROLES.CONTROL_ROOM;
  },

  login(username, role) {
    const user = { username, role, token: 'mock-jwt-token-' + Date.now() };
    localStorage.setItem('disissta_user', JSON.stringify(user));
    localStorage.setItem('auth_token', user.token);
    return user;
  },

  logout() {
    localStorage.removeItem('disissta_user');
    localStorage.removeItem('auth_token');
    window.location.href = 'login.html';
  },

  getLandingPageForRole(role) {
    switch (role) {
      case ROLES.CONTROL_ROOM:
        return 'live-map.html';
      case ROLES.DISTRICT_ADMIN:
        return 'shelter-board.html';
      case ROLES.FIELD_DRIVER:
        return 'hazard-log.html';
      default:
        return 'dashboard.html';
    }
  },

  canAccessPage(pageName) {
    const role = this.getRole();
    if (role === ROLES.CONTROL_ROOM) return true;
    if (role === ROLES.DISTRICT_ADMIN) {
      return ['dashboard.html', 'live-map.html', 'convoy-dispatch.html', 'shelter-board.html', 'alerts.html', 'settings.html'].includes(pageName);
    }
    if (role === ROLES.FIELD_DRIVER) {
      return ['dashboard.html', 'live-map.html', 'hazard-log.html', 'settings.html'].includes(pageName);
    }
    return true;
  },

  isFieldMode() {
    return localStorage.getItem('disissta_field_mode') === 'true' || localStorage.getItem('field-mode') === 'true';
  },

  toggleFieldMode() {
    const next = !this.isFieldMode();
    localStorage.setItem('disissta_field_mode', next ? 'true' : 'false');
    localStorage.setItem('field-mode', next ? 'true' : 'false');
    if (next) {
      document.body.classList.add('field-mode');
    } else {
      document.body.classList.remove('field-mode');
    }
    return next;
  },

  setRole(role) {
    const u = this.getUser();
    u.role = role;
    localStorage.setItem('disissta_user', JSON.stringify(u));
    localStorage.setItem('user-role', role);
  },

  setUsername(name) {
    const u = this.getUser();
    u.username = name;
    localStorage.setItem('disissta_user', JSON.stringify(u));
    localStorage.setItem('username', name);
  }
};
export const auth = Auth;
export default Auth;
