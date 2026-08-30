/* ==========================================
   DISISTA CONTROL — HAZARD LOG & REPORTING MANAGER
   Field Observation Feed, SVG Confidence Rings, & Fusion Resolution
   ========================================== */

class HazardLogManager {
  constructor() {}

  init() {
    this.renderFeed();
    if (window.store) {
      window.store.subscribe(() => this.renderFeed());
    }
  }

  renderFeed() {
    const container = document.getElementById('hazard-feed-container');
    if (!container) return;

    const reports = window.store ? window.store.getReports() : [];
    container.innerHTML = '';

    if (reports.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--slate-500); padding: var(--space-4);">No hazard observations logged yet.</div>`;
      return;
    }

    reports.forEach(r => {
      const badge = window.statusBadge ? window.statusBadge.render(r.severity, { confirmed: r.confirmed, label: r.severity.toUpperCase() }) : r.severity;
      const canVerify = window.auth ? window.auth.canPerform('verify_hazard') && !r.confirmed : false;

      // SVG Confidence Ring (Arc length = confidence %)
      const circumference = 2 * Math.PI * 12;
      const dashoffset = circumference - (r.confidence / 100) * circumference;
      const ringColor = r.severity === 'impassable' ? 'var(--slate-800)' : 'var(--forest-600)';

      const div = document.createElement('div');
      div.className = 'card';
      div.style.cssText = 'background: var(--bg-honeydew); padding: var(--space-3); border-radius: var(--radius); border: 1px solid var(--border-hairline);';
      div.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="28" height="28" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="none" stroke="var(--border-hairline)" stroke-width="3"/>
              <circle cx="16" cy="16" r="12" fill="none" stroke="${ringColor}" stroke-width="3"
                      stroke-dasharray="${circumference}" stroke-dashoffset="${dashoffset}"
                      transform="rotate(-90 16 16)" stroke-linecap="round"/>
            </svg>
            <strong>${r.type} @ ${r.loc}</strong>
          </div>
          ${badge}
        </div>
        <div class="text-meta" style="margin-bottom: 6px;">
          Source: <strong>${r.source}</strong> · ${r.timestamp} · Confidence: <strong>${r.confidence}%</strong> (${r.confirmed ? 'Confirmed' : 'Unconfirmed Report'})
        </div>
        ${!r.confirmed ? `
          <div style="font-size: 11px; color: var(--slate-500); background: rgba(0,0,0,0.03); padding: 4px 8px; border-radius: 4px; margin-bottom: 6px;">
            ℹ️ Fusion Conflict: Newer field report being used for routing pending Control Room verification.
          </div>
        ` : ''}
        ${canVerify ? `
          <button class="btn btn-secondary" style="margin-top: 4px; min-height: 32px; font-size: 11px;" onclick="hazardLog.verifyReport('${r.id}')">
            ✓ Verify Report & Promote Status
          </button>
        ` : ''}
      `;
      container.appendChild(div);
    });
  }

  handleHazardSubmit(e) {
    e.preventDefault();
    const loc = document.getElementById('hazard-loc').value;
    const type = document.getElementById('hazard-type').value;
    const sev = document.getElementById('hazard-severity').value;
    const desc = document.getElementById('hazard-desc').value;

    const user = window.auth ? window.auth.getCurrentUser() : null;
    const newHazard = {
      id: `haz-${Date.now()}`,
      name: loc,
      lat: 14.625,
      lng: 120.980,
      type: type,
      severity: sev,
      confidence: 80,
      confirmed: false,
      notes: desc || `${type} reported at ${loc}. Clearance limited.`,
      source: user ? `${user.username} (${user.badge})` : 'Field Driver (Unit 4)'
    };

    if (window.store) {
      window.store.addHazard(newHazard);
    }

    if (window.toast) {
      window.toast.success(`Field hazard report submitted for ${loc}! Fusion pipeline processing...`);
    }

    document.getElementById('hazard-desc').value = '';
  }

  verifyReport(id) {
    if (!window.auth || !window.auth.canPerform('verify_hazard')) {
      if (window.toast) window.toast.error('Verify hazard is restricted to Control Room Officers only.');
      return;
    }

    if (window.store) {
      window.store.verifyHazard(id);
    }

    if (window.toast) {
      window.toast.success(`Report ${id} verified by Control Room! Status promoted to 100% confidence.`);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.hazardLog = new HazardLogManager();
  window.hazardLog.init();
});
