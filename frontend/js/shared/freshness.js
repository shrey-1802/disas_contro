/* ==========================================
   DISISTA CONTROL — DATA FRESHNESS UTILITY (PHASE 13)
   Classifies operational data into LIVE / RECENT / STALE / UNKNOWN badges
   ========================================== */

const FreshnessUtil = (() => {
  const LIVE_THRESHOLD   = 60 * 1000;      // < 1 min
  const RECENT_THRESHOLD = 5 * 60 * 1000;  // < 5 min

  function classify(updatedAt) {
    if (!updatedAt) return 'unknown';
    const ts = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
    if (isNaN(ts.getTime())) return 'unknown';

    const ageMs = Date.now() - ts.getTime();
    if (ageMs < 0) return 'live';
    if (ageMs < LIVE_THRESHOLD)   return 'live';
    if (ageMs < RECENT_THRESHOLD) return 'recent';
    return 'stale';
  }

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

  function badge(updatedAt, source) {
    const tier = classify(updatedAt);
    const text = label(updatedAt);
    const badgeClass = tier === 'live' ? 'badge-safe' : (tier === 'recent' ? 'badge-caution' : 'badge-blocked');

    return `
      <span class="badge ${badgeClass}" title="${text}">
        <span>● ${tier.toUpperCase()}</span>
        <span>${text}</span>
        ${source ? `<span style="opacity:0.8;">(via ${source})</span>` : ''}
      </span>
    `;
  }

  function render(el, updatedAt, source) {
    if (!el) return;
    el.innerHTML = badge(updatedAt, source);
  }

  return { classify, label, badge, render };
})();

window.FreshnessUtil = FreshnessUtil;
