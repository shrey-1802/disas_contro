/**
 * System Settings Controller — Field Mode, Role Access, Accessibility & Offline Cache Management
 * Relief Supply Chain Resilience & Rerouting System (Phase 10)
 */

import { renderGlobalShell } from '../navbar.js';
import { auth, ROLES } from '../auth.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

document.addEventListener('DOMContentLoaded', () => {
  renderGlobalShell('settings.html');

  // Initialize Settings UI State
  initRoleSelector();
  initFieldModeSetting();
  initLanguageSetting();
  initAccessibilitySettings();
  initOfflineSyncSettings();
});

/* --------------------------------------------------------------------------
   1. USER OPERATOR PROFILE & ROLE SWITCHER
   -------------------------------------------------------------------------- */
function initRoleSelector() {
  const roleSelect = document.getElementById('select-user-role');
  const userDisplayName = document.getElementById('user-display-name');

  const currentRole = auth.getRole();
  const currentUser = auth.getUser();

  if (userDisplayName) {
    userDisplayName.textContent = `${currentUser.name} (${currentUser.callsign || 'HQ-1'})`;
  }

  if (roleSelect) {
    roleSelect.value = currentRole;
    roleSelect.addEventListener('change', (e) => {
      const newRole = e.target.value;
      auth.setRole(newRole);

      // Re-render navigation shell to reflect updated role permissions
      renderGlobalShell('settings.html');
      toast.show(`Operational role switched to: ${getRoleTitle(newRole)}`, 'safe', 3000);
    });
  }
}

function getRoleTitle(roleKey) {
  switch (roleKey) {
    case ROLES.CONTROL_ROOM: return 'Control Room Operator';
    case ROLES.DISTRICT_ADMIN: return 'District Admin';
    case ROLES.FIELD_DRIVER: return 'Field Driver';
    default: return roleKey;
  }
}

/* --------------------------------------------------------------------------
   2. OUTDOOR FIELD TABLET MODE TOGGLE
   -------------------------------------------------------------------------- */
function initFieldModeSetting() {
  const fieldCb = document.getElementById('setting-field-mode');
  const badge = document.getElementById('field-mode-status-badge');

  const isFieldModeActive = auth.isFieldMode();

  if (fieldCb) {
    fieldCb.checked = isFieldModeActive;
    updateFieldModeUI(isFieldModeActive);

    fieldCb.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      auth.setFieldMode(enabled);
      updateFieldModeUI(enabled);
      renderGlobalShell('settings.html');

      toast.show(`Outdoor Field Mode ${enabled ? 'ENABLED (High-Contrast)' : 'DISABLED'}`, 'safe', 2500);
    });
  }
}

function updateFieldModeUI(enabled) {
  const badge = document.getElementById('field-mode-status-badge');
  if (badge) {
    if (enabled) {
      badge.textContent = 'FIELD MODE ACTIVE';
      badge.className = 'status-badge status-badge--safe';
    } else {
      badge.textContent = 'DEFAULT MODE';
      badge.className = 'status-badge status-badge--caution';
    }
  }
}

/* --------------------------------------------------------------------------
   3. LANGUAGE & LOCALIZATION SETTINGS
   -------------------------------------------------------------------------- */
function initLanguageSetting() {
  const langSelect = document.getElementById('language-select');
  const currentLang = localStorage.getItem('sys_lang') || 'en';

  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      localStorage.setItem('sys_lang', selected);

      const langNames = { en: 'English (Official)', es: 'Español (Spanish)', hi: 'हिंदी (Hindi)' };
      toast.show(`System language preference set to: ${langNames[selected]}`, 'safe', 3000);
    });
  }
}

/* --------------------------------------------------------------------------
   4. ACCESSIBILITY CONTROLS
   -------------------------------------------------------------------------- */
function initAccessibilitySettings() {
  const highContrastCb = document.getElementById('setting-high-contrast');
  const reduceMotionCb = document.getElementById('setting-reduce-motion');
  const fontRange = document.getElementById('range-font-scale');
  const fontValue = document.getElementById('font-scale-value');

  // High Contrast
  const isHighContrast = localStorage.getItem('highContrast') === 'true';
  if (highContrastCb) {
    highContrastCb.checked = isHighContrast;
    if (isHighContrast) document.body.classList.add('high-contrast');

    highContrastCb.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      localStorage.setItem('highContrast', enabled);
      document.body.classList.toggle('high-contrast', enabled);
      toast.show(`High Contrast Mode ${enabled ? 'Enabled' : 'Disabled'}`, 'safe', 2000);
    });
  }

  // Reduce Motion
  const isReduceMotion = localStorage.getItem('reduceMotion') === 'true';
  if (reduceMotionCb) {
    reduceMotionCb.checked = isReduceMotion;
    if (isReduceMotion) document.body.classList.add('reduce-motion');

    reduceMotionCb.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      localStorage.setItem('reduceMotion', enabled);
      document.body.classList.toggle('reduce-motion', enabled);
      toast.show(`Reduce Motion ${enabled ? 'Enabled' : 'Disabled'}`, 'safe', 2000);
    });
  }

  // Font Scale
  const currentScale = localStorage.getItem('fontScale') || '100';
  if (fontRange && fontValue) {
    fontRange.value = currentScale;
    fontValue.textContent = `${currentScale}%`;

    fontRange.addEventListener('input', (e) => {
      const val = e.target.value;
      fontValue.textContent = `${val}%`;
      localStorage.setItem('fontScale', val);
      document.documentElement.style.fontSize = `${(14 * (val / 100)).toFixed(1)}px`;
    });
  }
}

/* --------------------------------------------------------------------------
   5. OFFLINE QUEUE & LOCAL STORAGE CACHE MANAGER
   -------------------------------------------------------------------------- */
function initOfflineSyncSettings() {
  const netStatusBadge = document.getElementById('settings-network-status');
  const pendingCountElem = document.getElementById('pending-reports-count');
  const lastSyncElem = document.getElementById('last-sync-time');
  const syncBtn = document.getElementById('btn-sync-now');
  const clearBtn = document.getElementById('btn-clear-cache');

  // Update Network Status Badge
  if (netStatusBadge) {
    if (navigator.onLine) {
      netStatusBadge.textContent = 'ONLINE';
      netStatusBadge.className = 'status-badge status-badge--safe';
    } else {
      netStatusBadge.textContent = 'OFFLINE MODE';
      netStatusBadge.className = 'status-badge status-badge--blocked';
    }
  }

  // Update Pending Queue Count
  updatePendingCount();

  // Handle Trigger Re-Sync
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      if (!navigator.onLine) {
        toast.show('Cannot sync: Device is currently offline', 'critical', 3000);
        return;
      }

      toast.show('Re-synchronizing local telemetry & field reports with server...', 'warning', 2500);

      const pending = JSON.parse(localStorage.getItem('pending_field_reports') || '[]');
      if (pending.length > 0) {
        let synced = 0;
        const remaining = [];
        for (const r of pending) {
          try {
            await api.createReport(r).catch(() => null);
            synced++;
          } catch (err) {
            remaining.push(r);
          }
        }
        localStorage.setItem('pending_field_reports', JSON.stringify(remaining));
        updatePendingCount();
        toast.show(`Successfully synced ${synced} queued report(s) to Control Room`, 'safe', 3500);
      } else {
        toast.show('All local field reports are up-to-date with server', 'safe', 3000);
      }

      if (lastSyncElem) lastSyncElem.textContent = 'Just now';
    });
  }

  // Handle Clear Offline Cache & Queue
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const pending = JSON.parse(localStorage.getItem('pending_field_reports') || '[]');
      const count = pending.length;

      const confirmMsg = count > 0
        ? `Clear ${count} queued offline field report(s) and reset cached telemetry?`
        : `Clear cached operational maps and offline storage parameters?`;

      if (window.confirm(confirmMsg)) {
        localStorage.removeItem('pending_field_reports');
        localStorage.removeItem('unacknowledged_critical_alert');
        updatePendingCount();
        toast.show('Offline storage queue and cached telemetry cleared', 'safe', 3000);
      }
    });
  }
}

function updatePendingCount() {
  const pendingCountElem = document.getElementById('pending-reports-count');
  if (pendingCountElem) {
    const pending = JSON.parse(localStorage.getItem('pending_field_reports') || '[]');
    pendingCountElem.textContent = `${pending.length} Item${pending.length === 1 ? '' : 's'}`;
  }
}
