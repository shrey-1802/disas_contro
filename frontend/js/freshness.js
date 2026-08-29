/* Data Freshness Utility (Phase 13)
 * Classifies operational data timestamps into 4 freshness tiers: LIVE, RECENT, STALE, UNKNOWN.
 */

const LIVE_THRESHOLD   = 60 * 1000;        // < 1 min
const RECENT_THRESHOLD = 5 * 60 * 1000;    // < 5 min

export const FreshnessUtil = {
  classify(updatedAt) {
    if (!updatedAt) return 'unknown';
    const ts = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
    if (isNaN(ts.getTime())) return 'unknown';

    const ageMs = Date.now() - ts.getTime();
    if (ageMs < 0) return 'live';
    if (ageMs < LIVE_THRESHOLD)   return 'live';
    if (ageMs < RECENT_THRESHOLD) return 'recent';
    return 'stale';
  },

  label(updatedAt) {
    if (!updatedAt) return 'Last update time unknown';
    const ts = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
    if (isNaN(ts.getTime())) return 'Last update time unknown';

    const ageMs = Date.now() - ts.getTime();
    if (ageMs < 0) return 'Updated just now';

    const ageSeconds = Math.floor(ageMs / 1000);
    const ageMinutes = Math.floor(ageMs / 60000);
    const ageHours   = Math.floor(ageMs / 3600000);

    if (ageSeconds < 10)  return 'Updated just now';
    if (ageSeconds < 60)  return `Updated ${ageSeconds}s ago`;
    if (ageMinutes === 1) return 'Updated 1 min ago';
    if (ageMinutes < 60)  return `Updated ${ageMinutes} min ago`;
    if (ageHours === 1)   return 'Updated 1 hour ago';
    return `Updated ${ageHours} hours ago`;
  },

  _icon(tier) {
    switch (tier) {
      case 'live':
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      case 'recent':
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      case 'stale':
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      default:
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }
  },

  badge(updatedAt, source) {
    const tier = this.classify(updatedAt);
    const text = this.label(updatedAt);
    const sourceHtml = source ? `<span class="freshness-source">via ${source}</span>` : '';

    return `
      <span class="freshness-badge freshness-badge--${tier}" title="${text}">
        ${this._icon(tier)}
        <span class="freshness-label">${text}</span>
        ${sourceHtml}
      </span>
    `;
  },

  render(el, updatedAt, source) {
    if (!el) return;
    el.innerHTML = this.badge(updatedAt, source);
  },

  startLiveClock(el, updatedAt, source) {
    this.render(el, updatedAt, source);
    const intervalId = setInterval(() => {
      this.render(el, updatedAt, source);
    }, 30000);
    return () => clearInterval(intervalId);
  }
};

window.FreshnessUtil = FreshnessUtil;
export default FreshnessUtil;
