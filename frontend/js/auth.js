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
  }
};
