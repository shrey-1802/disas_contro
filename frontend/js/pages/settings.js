/* ==========================================
   DISISTA CONTROL — SETTINGS PAGE CONTROLLER (PHASE 10)
   Offline queue, freshness telemetry, user management, field mode
   ========================================== */

class SettingsManager {
  constructor() {
    this._telemetryInterval = null;
  }

  init() {
    this.renderUserManagement();
    this.updateFieldModeUI();
    this.renderOfflineQueue();
    this.renderFreshnessTelemetry();
    this._startTelemetryPoll();
  }

  /* ── Field Mode ── */
  updateFieldModeUI() {
    const btn = document.getElementById('field-mode-toggle-btn');
    if (!btn || !window.auth) return;
    const isField = window.auth.isFieldMode();
    btn.textContent = isField ? 'Disable Field Mode' : 'Enable Field Mode';
    btn.setAttribute('aria-pressed', String(isField));
  }

  /* ── Language ── */
  changeLanguage(lang) {
    if (window.store) window.store.set('language', lang);
    if (window.toast) window.toast.success(`Language set to ${lang}. Some labels will update on next page load.`);
  }

  /* ── Offline Queue ── */
  renderOfflineQueue() {
    const container = document.getElementById('offline-queue-table');
    if (!container || !window.offlineQueue) return;
    window.offlineQueue.renderQueueTable(container);
  }

  forceSync() {
    if (!navigator.onLine) {
      if (window.toast) window.toast.error('No network connectivity — sync cannot proceed.');
      return;
    }
    if (window.offlineQueue) {
      window.offlineQueue.flush((action) => {
        // Simulate API call — in production this hits the real socket/REST layer
        return new Promise((resolve) => setTimeout(() => {
          if (window.socket) window.socket.emit(action.type, action.payload);
          resolve();
        }, 200));
      }).then(() => this.renderOfflineQueue());
    }
    if (window.navbar) window.navbar.updateSyncTime();
    if (window.toast) window.toast.success('Sync initiated — pending actions are being flushed.');
  }

  clearQueue() {
    if (!window.offlineQueue) return;
    window.offlineQueue.clear();
    this.renderOfflineQueue();
    if (window.toast) window.toast.success('Offline sync queue cleared.');
  }

  /* ── Freshness Telemetry Panel ── */
  renderFreshnessTelemetry() {
    const panel = document.getElementById('freshness-status-panel');
    if (!panel) return;

    const sources = [
      { name: 'Convoy positions', key: 'convoys_updated', sampleOffset: 45000 },
      { name: 'Shelter supply telemetry', key: 'shelters_updated', sampleOffset: 120000 },
      { name: 'Hazard fusion feed', key: 'hazards_updated', sampleOffset: 20000 },
      { name: 'Flood-risk model', key: 'flood_updated', sampleOffset: 300000 },
      { name: 'Alert inbox', key: 'alerts_updated', sampleOffset: 8000 },
    ];

    const rows = sources.map(src => {
      const ts = window.store ? window.store.get(src.key) : null;
      const resolvedTs = ts || (Date.now() - src.sampleOffset);
      const tier = window.FreshnessUtil ? window.FreshnessUtil.getTier(resolvedTs) : { label: 'UNKNOWN', cls: 'unknown' };
      const elapsed = Math.floor((Date.now() - resolvedTs) / 1000);
      const elapsedStr = elapsed < 60 ? `${elapsed}s ago` : `${Math.floor(elapsed/60)}m ${elapsed%60}s ago`;
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border-hairline);">
          <span style="font-size:12px;color:var(--slate-800);">${src.name}</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:11px;color:var(--slate-500);">${elapsedStr}</span>
            <span class="freshness-badge freshness-badge--${tier.cls || tier.label.toLowerCase()}">${tier.label}</span>
          </div>
        </div>
      `;
    });

    panel.innerHTML = rows.join('') || '<p style="color:var(--slate-500);font-size:13px;">No telemetry data available.</p>';
  }

  _startTelemetryPoll() {
    this._telemetryInterval = setInterval(() => this.renderFreshnessTelemetry(), 30000);
  }

  /* ── User Management ── */
  renderUserManagement() {
    const container = document.getElementById('user-mgmt-container');
    if (!container || !window.auth) return;

    const currentUser = window.auth.getCurrentUser();
    const roleConfig  = window.auth.getRoleConfig(currentUser.role);

    // Only admins see full user list
    if (currentUser.role !== 'district_admin') {
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <span class="card-title">Your Account</span>
            <span class="badge badge-safe">${roleConfig ? roleConfig.badge : currentUser.role}</span>
          </div>
          <div style="font-size:13px;line-height:1.8;color:var(--slate-800);">
            <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-hairline);">
              <strong>Role</strong><span>${roleConfig ? roleConfig.badge : currentUser.role}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-hairline);">
              <strong>Access Level</strong><span>${roleConfig ? (roleConfig.nav || []).length : '—'} screens</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;">
              <strong>Field Mode</strong><span>${window.auth.isFieldMode() ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
          <button class="btn btn-secondary" style="margin-top:var(--space-4);" onclick="auth.logout()">Sign Out</button>
        </div>
      `;
      return;
    }

    // District Admin: full user roster
    const users = [
      { name: 'Control Room Alpha', role: 'control_room', status: 'Online' },
      { name: 'Field Officer B-12', role: 'field_officer', status: 'Online' },
      { name: 'Warehouse Lead — Depot 3', role: 'warehouse_manager', status: 'Offline' },
      { name: 'District Admin — HQ', role: 'district_admin', status: 'Online' }
    ];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">User Management</span>
          <span class="badge badge-safe">District Admin Only</span>
        </div>
        <div class="table-container">
          <table class="data-table" role="table" aria-label="User management table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => {
                const rc = window.auth.getRoleConfig(u.role);
                return `
                  <tr>
                    <td>${u.name}</td>
                    <td><span class="badge badge-safe" style="font-size:10px;">${rc ? rc.badge : u.role}</span></td>
                    <td><span class="badge ${u.status === 'Online' ? 'badge-safe' : ''}" style="font-size:10px;background:${u.status === 'Online' ? '' : 'var(--sage-100)'};color:${u.status === 'Online' ? '' : 'var(--slate-500)'};">${u.status}</span></td>
                    <td>
                      <button class="btn btn-ghost" style="min-height:30px;font-size:11px;" onclick="toast.success('Role reassignment requires supervisor approval.')">Reassign Role</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.settingsManager = new SettingsManager();
  window.settingsManager.init();
});
