/* FRONTEND EMERGENCY ALERTS PAGE CONTROLLER (Phase 9 & 28 Scenario 5) */
import { Navbar } from '../navbar.js';
import { ApiService, API_STATUS } from '../api.js';
import { Toast } from '../toast.js';
import { formatRelativeTime, escapeHTML } from '../utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  Navbar.render('alerts');

  const container = document.getElementById('alerts-list-container');
  const banner = document.getElementById('alerts-critical-banner');
  const bannerMsg = document.getElementById('alert-banner-msg');
  const filter = document.getElementById('severity-filter');

  const mockAlerts = [
    { id: 'alt-901', severity: 'CRITICAL', message: 'Convoy 14 stranded in Sector 6 debris flow. Immediate rerouting required.', region: 'Sector 6', convoyId: 'convoy-14', timestamp: new Date(Date.now() - 300000).toISOString(), acknowledged: false, escalated: false },
    { id: 'alt-902', severity: 'WARNING', message: 'Shelter Alpha insulin supply reached critical 1.5-day threshold.', region: 'Sector 6', convoyId: null, timestamp: new Date(Date.now() - 900000).toISOString(), acknowledged: false, escalated: false },
    { id: 'alt-903', severity: 'ADVISORY', message: 'Sensor river level rising 0.2m/hr at Bridge 4.', region: 'Sector 2', convoyId: null, timestamp: new Date(Date.now() - 1800000).toISOString(), acknowledged: true, escalated: false }
  ];

  function renderAlerts(alerts) {
    const unackCritical = alerts.find(a => a.severity === 'CRITICAL' && !a.acknowledged);
    if (unackCritical) {
      bannerMsg.textContent = unackCritical.message;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }

    if (!alerts || alerts.length === 0) {
      container.innerHTML = `<div class="card"><p>No emergency alerts in inbox.</p></div>`;
      return;
    }

    container.innerHTML = alerts.map(a => {
      const isCrit = a.severity === 'CRITICAL';
      const isWarn = a.severity === 'WARNING';
      const cardClass = isCrit ? 'card alert-banner--critical hier-critical' : isWarn ? 'card alert-banner--warning hier-situation' : 'card hier-supporting';

      return `
        <div class="${cardClass}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">
                ${a.severity} SEVERITY ALERT — ${escapeHTML(a.region)}
              </div>
              <h3 style="font-size: 1.05rem; margin: 4px 0; color: inherit;">${escapeHTML(a.message)}</h3>
              <div style="font-size: 0.8rem; opacity: 0.9;">
                Issued: ${formatRelativeTime(a.timestamp)} ${a.convoyId ? `| Related Convoy: <strong>${escapeHTML(a.convoyId)}</strong>` : ''}
              </div>
            </div>

            <div style="display: flex; gap: var(--space-xs); flex-wrap: wrap;">
              ${!a.acknowledged ? `
                <button class="button button--secondary ack-btn" data-id="${escapeHTML(a.id)}" style="font-size: 0.8rem; padding: 4px 10px;">
                  Acknowledge
                </button>
              ` : `
                <span class="status-badge status-badge--safe">Acknowledged</span>
              `}

              ${!a.escalated ? `
                <button class="button button--critical esc-btn" data-id="${escapeHTML(a.id)}" style="font-size: 0.8rem; padding: 4px 10px;">
                  Escalate to District
                </button>
              ` : `
                <span class="status-badge status-badge--blocked">Escalated</span>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach Handlers
    document.querySelectorAll('.ack-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const res = await ApiService.acknowledgeAlert(id);
        const item = alerts.find(x => x.id === id);
        if (item) item.acknowledged = true;
        renderAlerts(alerts);
        Toast.show(`Alert ${id} acknowledged by operator.`, 'success');
      });
    });

    document.querySelectorAll('.esc-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const res = await ApiService.escalateAlert(id);
        const item = alerts.find(x => x.id === id);
        if (item) item.escalated = true;
        renderAlerts(alerts);
        Toast.show(`Alert ${id} escalated to District Disaster Command.`, 'warning');
      });
    });
  }

  const res = await ApiService.getAlerts();
  let allAlerts = (res.status === API_STATUS.SUCCESS && res.data.length) ? res.data : mockAlerts;

  renderAlerts(allAlerts);

  filter.addEventListener('change', () => {
    const val = filter.value;
    const filtered = val === 'ALL' ? allAlerts : allAlerts.filter(a => a.severity === val);
    renderAlerts(filtered);
  });
});
