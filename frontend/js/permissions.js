/* FRONTEND ROLE PERMISSIONS & UI VISIBILITY CONTROLLER */
import { Auth, ROLES } from './auth.js';

export const Permissions = {
  applyUIRoleRestrictions() {
    const role = Auth.getRole();

    // Hide navigation links that user does not have permission to view
    document.querySelectorAll('[data-role-perm]').forEach(el => {
      const allowedRoles = el.dataset.rolePerm.split(',').map(r => r.trim());
      if (!allowedRoles.includes(role)) {
        el.style.display = 'none';
      }
    });

    // Handle Field Driver specific UI modes
    if (role === ROLES.FIELD_DRIVER) {
      document.body.classList.add('field-driver-mode');
    }
  }
};
