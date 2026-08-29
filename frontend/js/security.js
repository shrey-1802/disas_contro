/* FRONTEND SECURITY & AUTHORIZATION GUARDS (Phase 25) */
import { escapeHTML } from './utils.js';

export const Security = {
  /**
   * Sanitize user input before rendering
   */
  sanitize(input) {
    return escapeHTML(input);
  },

  /**
   * Verify if role has permission to perform action
   * @param {string} userRole - 'Control Room' | 'District Admin' | 'Field Driver'
   * @param {string} action - Action identifier
   */
  canPerform(userRole, action) {
    const permissionsMatrix = {
      'Control Room': [
        'view_map', 'view_convoys', 'view_shelters', 'view_hazards', 'view_alerts',
        'dispatch_convoy', 'verify_report', 'acknowledge_alert', 'escalate_alert', 'edit_settings'
      ],
      'District Admin': [
        'view_map', 'view_convoys', 'view_shelters', 'view_alerts',
        'update_shelter_demand', 'acknowledge_alert', 'edit_settings'
      ],
      'Field Driver': [
        'view_map_readonly', 'view_hazards', 'submit_field_report', 'edit_settings'
      ]
    };

    const rolePerms = permissionsMatrix[userRole] || [];
    return rolePerms.includes(action);
  }
};
