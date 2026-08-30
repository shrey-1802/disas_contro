/* ==========================================
   DISISTA CONTROL — ALERTS & COMMAND CENTER MANAGER
   Inbox, Severity Tiers, & Escalation Workflow
   ========================================== */

class AlertsManager {
  constructor() {}

  init() {
    this.render();
    if (window.store) {
      window.store.subscribe(() => this.render());
    }
  }

  render() {
    const container = document.getElementById('alerts-list');
    const badgeCount = document.getElementById('active-critical-count');
    if (!container) return;

    const alerts = window.store ? window.store.getAlerts() : [];
    const activeCritical = alerts.filter(a => a.tier === 'critical' && !a.acknowledged);

    if (badgeCount) {
      badgeCount.innerText = `${activeCritical.length} Critical Active`;
      badgeCount.className = activeCritical.length > 0 ? 'badge badge-blocked' : 'badge badge-safe';
    }

    container.innerHTML = '';

    if (alerts.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--slate-500); padding: var(--space-4);">No active operational alerts.</div>`;
      return;
    }

    alerts.forEach(a => {
      const canAckEscalate = window.auth ? window.auth.canPerform('ack_escalate_alert') : false;
      const tierClass = a.tier === 'critical' ? 'critical' : (a.tier === 'warning' ? 'warning' : 'default');
      const badgeType = a.tier === 'critical' ? 'badge-blocked' : (a.tier === 'warning' ? 'badge-caution' : 'badge-safe');

      const div = document.createElement('div');
      div.className = `card ${tierClass}`;
      div.style.cssText = `background: var(--bg-honeydew); ${a.acknowledged ? 'opacity: 0.6;' : ''}`;
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge ${badgeType}">❖ ${a.tier ? a.tier.toUpperCase() : 'ALERT'}</span>
              ${a.escalated ? '<span class="badge badge-blocked">ESCALATED TO HQ</span>' : ''}
              ${a.acknowledged ? '<span class="badge badge-safe">✓ ACKNOWLEDGED</span>' : ''}
            </div>
            <h4>${a.title}</h4>
            <p style="font-size: var(--text-sm); color: var(--slate-500); margin-top: 4px;">
              ${a.description}
            </p>
            <span class="text-meta" style="margin-top: 6px; display: inline-block;">Reported ${a.timestamp || 'recently'}</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
            ${!a.acknowledged ? `
              <button class="btn btn-primary" style="min-height: 32px; font-size: 11px;"
                      ${!canAckEscalate ? 'disabled title="Acknowledging alerts requires Control Room or District Admin role."' : ''}
                      onclick="alertsManager.ackAlert('${a.id}')">
                Acknowledge Alert
              </button>
            ` : ''}
            ${!a.escalated ? `
              <button class="btn btn-secondary" style="min-height: 32px; font-size: 11px;"
                      ${!canAckEscalate ? 'disabled title="Escalation requires Control Room or District Admin role."' : ''}
                      onclick="alertsManager.escalateAlert('${a.id}')">
                ⚡ Escalate to HQ Command
              </button>
            ` : ''}
          </div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  ackAlert(alertId) {
    if (!window.auth || !window.auth.canPerform('ack_escalate_alert')) {
      if (window.toast) window.toast.error('Alert acknowledgment requires Control Room or District Admin role.');
      return;
    }
    if (window.store) {
      window.store.acknowledgeAlert(alertId);
      if (window.toast) window.toast.success('Alert acknowledged by command operator.');
    }
  }

  escalateAlert(alertId) {
    if (!window.auth || !window.auth.canPerform('ack_escalate_alert')) {
      if (window.toast) window.toast.error('Escalation requires Control Room or District Admin role.');
      return;
    }
    if (window.store) {
      window.store.escalateAlert(alertId);
      if (window.toast) window.toast.error(`Alert ${alertId} escalated to HQ Command Center! Priority broadcast pushed.`);
    }
  }

  ackAll() {
    if (!window.auth || !window.auth.canPerform('ack_escalate_alert')) {
      if (window.toast) window.toast.error('Acknowledging alerts requires Control Room or District Admin role.');
      return;
    }
    const alerts = window.store ? window.store.getAlerts() : [];
    alerts.forEach(a => {
      if (window.store) window.store.acknowledgeAlert(a.id);
    });
    if (window.toast) window.toast.success('All operational alerts acknowledged.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.alertsManager = new AlertsManager();
  window.alertsManager.init();
});
