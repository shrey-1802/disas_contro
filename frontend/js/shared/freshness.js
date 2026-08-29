/* Data Freshness Utility
 *
 * Classifies any operational data timestamp into one of four freshness tiers:
 *   LIVE     — updated within the last 60 seconds
 *   RECENT   — updated within the last 5 minutes
 *   STALE    — updated more than 5 minutes ago
 *   UNKNOWN  — no timestamp available
 *
 * Usage:
 *   FreshnessUtil.classify(updatedAt)          → 'live' | 'recent' | 'stale' | 'unknown'
 *   FreshnessUtil.label(updatedAt)             → 'Updated just now' | 'Updated 3 min ago' | ...
 *   FreshnessUtil.badge(updatedAt, source)     → HTML string for a freshness badge
 *   FreshnessUtil.render(el, updatedAt, src)   → mutates a DOM element to show badge
 *   FreshnessUtil.startLiveClock(el, updatedAt)→ auto-refreshes label every 30s
 */

const FreshnessUtil = (() => {
  // Tier thresholds in milliseconds
  const LIVE_THRESHOLD   = 60 * 1000;        // < 1 min
  const RECENT_THRESHOLD = 5 * 60 * 1000;    // < 5 min

  /**
   * Classifies a timestamp string/Date into a freshness tier
   * @param {string|Date|null} updatedAt
   * @returns {'live'|'recent'|'stale'|'unknown'}
   */
  function classify(updatedAt) {
    if (!updatedAt) return 'unknown';
    const ts = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
    if (isNaN(ts.getTime())) return 'unknown';

    const ageMs = Date.now() - ts.getTime();
    if (ageMs < 0) return 'live'; // Future timestamp — treat as live
    if (ageMs < LIVE_THRESHOLD)   return 'live';
    if (ageMs < RECENT_THRESHOLD) return 'recent';
    return 'stale';
  }

  /**
   * Returns a human-readable, explicit label for the timestamp.
   * Never returns "Live" or a raw number — always a complete sentence fragment.
   * @param {string|Date|null} updatedAt
   * @returns {string}
   */
  function label(updatedAt) {
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
  }

  /**
   * Generates icon SVG for each tier
   */
  function _icon(tier) {
    switch (tier) {
      case 'live':
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>`;
      case 'recent':
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>`;
      case 'stale':
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>`;
      case 'unknown':
      default:
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>`;
    }
  }

  /**
   * Builds an HTML string for a self-contained freshness badge.
   * Includes icon + explicit label + optional source attribution.
   * @param {string|Date|null} updatedAt
   * @param {string|null} source - e.g. 'Field Report', 'Sensor', 'Satellite', 'Manual Entry'
   * @returns {string} HTML
   */
  function badge(updatedAt, source) {
    const tier = classify(updatedAt);
    const text = label(updatedAt);
    const sourceHtml = source
      ? `<span class="freshness-source">via ${source}</span>`
      : '';

    return `
      <span class="freshness-badge freshness-badge--${tier}" title="${text}">
        ${_icon(tier)}
        <span class="freshness-label">${text}</span>
        ${sourceHtml}
      </span>
    `;
  }

  /**
   * Mutates a DOM element with the freshness badge HTML.
   * @param {HTMLElement} el
   * @param {string|Date|null} updatedAt
   * @param {string|null} source
   */
  function render(el, updatedAt, source) {
    if (!el) return;
    el.innerHTML = badge(updatedAt, source);
  }

  /**
   * Starts a live clock that auto-updates the freshness badge every 30 seconds.
   * Returns a cleanup function — call it to stop the interval.
   * @param {HTMLElement} el
   * @param {string|Date|null} updatedAt
   * @param {string|null} source
   * @returns {function} cleanup
   */
  function startLiveClock(el, updatedAt, source) {
    render(el, updatedAt, source);
    const intervalId = setInterval(() => {
      render(el, updatedAt, source);
    }, 30000);
    return () => clearInterval(intervalId);
  }

  /**
   * Formats a data object's freshness for display in a table row / card subtitle.
   * Returns a plain-text string suitable for aria-label or title attributes.
   * @param {object} dataObj - any object with updatedAt, source, confidence fields
   * @returns {string}
   */
  function describe(dataObj) {
    if (!dataObj) return 'No data';
    const parts = [];
    if (dataObj.updatedAt) parts.push(label(dataObj.updatedAt));
    if (dataObj.source)    parts.push(`Source: ${dataObj.source}`);
    if (dataObj.confidence != null) parts.push(`Confidence: ${Math.round(dataObj.confidence * 100)}%`);
    return parts.join(' · ') || 'Data freshness unknown';
  }

  return { classify, label, badge, render, startLiveClock, describe };
})();

// Expose globally
window.FreshnessUtil = FreshnessUtil;
