/* ==========================================
   DISISTA CONTROL — STATUS BADGE RENDERER
   Enforces Icon Shape + Text Label + Color Tier
   ========================================== */

const STATUS_TIERS = {
  // Safe Tier
  normal: { tier: 'safe', label: 'Normal / Safe', class: 'badge-safe' },
  recoverable: { tier: 'safe', label: 'Recoverable', class: 'badge-safe' },

  // Caution Tier
  degraded: { tier: 'caution', label: 'Degraded', class: 'badge-caution' },
  restricted: { tier: 'caution', label: 'Restricted', class: 'badge-caution' },

  // Blocked / Hazard Tier
  hazardous: { tier: 'blocked', label: 'Hazardous', class: 'badge-blocked' },
  impassable: { tier: 'blocked', label: 'Impassable', class: 'badge-blocked' }
};

const ICONS = {
  // Safe: Circle-Check
  safe: `<svg class="badge-icon" viewBox="0 0 20 20" fill="currentColor">
           <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
         </svg>`,

  // Caution: Triangle
  caution: `<svg class="badge-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>`,

  // Blocked: Octagon Stop
  blocked: `<svg class="badge-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6.267 3.455a1 1 0 01.707-.293h6.052a1 1 0 01.707.293l4.52 4.52a1 1 0 01.293.707v6.052a1 1 0 01-.293.707l-4.52 4.52a1 1 0 01-.707.293H6.974a1 1 0 01-.707-.293l-4.52-4.52A1 1 0 011.454 14.52V8.468a1 1 0 01.293-.707l4.52-4.52zM9 6a1 1 0 012 0v4a1 1 0 11-2 0V6zm1 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
            </svg>`
};

class StatusBadgeRenderer {
  render(backendStatus, options = {}) {
    const key = (backendStatus || 'normal').toLowerCase();
    const config = STATUS_TIERS[key] || STATUS_TIERS.normal;
    const isUnconfirmed = options.confirmed === false;
    const customLabel = options.label || config.label;

    const unconfirmedClass = isUnconfirmed ? 'unconfirmed' : '';
    const iconSvg = ICONS[config.tier];

    return `
      <span class="badge ${config.class} ${unconfirmedClass}" title="${isUnconfirmed ? 'Unconfirmed report - stroke dashed' : 'Verified status'}">
        ${iconSvg}
        <span>${customLabel}${isUnconfirmed ? ' (Unconfirmed)' : ''}</span>
      </span>
    `;
  }
}

window.statusBadge = new StatusBadgeRenderer();
