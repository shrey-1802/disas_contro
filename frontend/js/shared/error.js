/* Error State Utility (Phase 16)
 *
 * Renders factual, honest error states for every failure scenario.
 * Three distinct modes:
 *   1. FULL ERROR — no data at all, backend unreachable
 *      "Unable to load shelter data. Retry"
 *   2. STALE CACHE — backend failed but cached data is available
 *      "Unable to refresh live data. Showing last synchronized data from 18 min ago."
 *   3. NOT IMPLEMENTED — endpoint missing / feature unavailable
 *      "This action is not yet available. Contact system administrator."
 *
 * Rules (Phase 20 compliant):
 *   — Never fabricate fallback values
 *   — Never say "Something went wrong" without specifics
 *   — Always offer a Retry if retrying is meaningful
 *   — Distinguish OFFLINE from SERVER ERROR from NOT_IMPLEMENTED
 *
 * Usage:
 *   ErrorUtil.render(containerEl, 'shelters', { onRetry: fn })
 *   ErrorUtil.renderWithCache(containerEl, 'shelters', lastSyncedAt, { onRetry: fn })
 *   ErrorUtil.renderOffline(containerEl, lastSyncedAt)
 *   ErrorUtil.renderNotImplemented(containerEl, 'Verify report')
 *   ErrorUtil.clear(containerEl)
 */

const ErrorUtil = (() => {

  const ENTITY_LABELS = {
    shelters:  'shelter data',
    convoys:   'convoy data',
    hazards:   'hazard reports',
    alerts:    'alert data',
    roads:     'road status',
    bridges:   'bridge status',
    reports:   'field reports',
    missions:  'mission data',
    vehicles:  'vehicle data',
    map:       'map data',
    generic:   'data'
  };

  /* ── 1. Full error — no cached data ──────────────────────── */

  /**
   * @param {HTMLElement} container
   * @param {string} entityType  - key from ENTITY_LABELS
   * @param {{ onRetry?: function, detail?: string }} opts
   */
  function render(container, entityType = 'generic', opts = {}) {
    if (!container) return;
    clear(container);

    const label = ENTITY_LABELS[entityType] || ENTITY_LABELS.generic;
    const detail = opts.detail ? `<p class="error-state-detail">${opts.detail}</p>` : '';
    const retryBtn = opts.onRetry
      ? `<button class="button button--secondary error-state-retry" type="button">Retry</button>`
      : '';

    const el = _buildEl(`
      <div class="error-state-icon" aria-hidden="true">${_iconAlert()}</div>
      <h2 class="error-state-headline">Unable to load ${label}.</h2>
      ${detail}
      ${retryBtn}
    `, `Unable to load ${label}`);

    if (opts.onRetry) {
      el.querySelector('.error-state-retry').addEventListener('click', opts.onRetry);
    }

    container.appendChild(el);
  }

  /* ── 2. Stale cache — backend failed, cached data visible ── */

  /**
   * @param {HTMLElement} container
   * @param {string} entityType
   * @param {string|Date|null} lastSyncedAt  - timestamp of last successful sync
   * @param {{ onRetry?: function }} opts
   */
  function renderWithCache(container, entityType = 'generic', lastSyncedAt = null, opts = {}) {
    if (!container) return;
    clear(container);

    const label = ENTITY_LABELS[entityType] || ENTITY_LABELS.generic;
    const ageText = lastSyncedAt ? _formatAge(lastSyncedAt) : 'an unknown time';
    const retryBtn = opts.onRetry
      ? `<button class="button button--secondary error-state-retry" type="button">Retry</button>`
      : '';

    const el = _buildEl(`
      <div class="error-state-icon error-state-icon--warn" aria-hidden="true">${_iconWarn()}</div>
      <h2 class="error-state-headline">Unable to refresh live ${label}.</h2>
      <p class="error-state-body">Showing last synchronized data from ${ageText}.</p>
      ${retryBtn}
    `, `Unable to refresh ${label}. Showing cached data.`);

    el.classList.add('error-state--stale');

    if (opts.onRetry) {
      el.querySelector('.error-state-retry').addEventListener('click', opts.onRetry);
    }

    container.appendChild(el);
  }

  /* ── 3. Offline ─────────────────────────────────────────── */

  /**
   * @param {HTMLElement} container
   * @param {string|Date|null} lastSyncedAt
   */
  function renderOffline(container, lastSyncedAt = null) {
    if (!container) return;
    clear(container);

    const ageText = lastSyncedAt ? _formatAge(lastSyncedAt) : 'an unknown time';

    const el = _buildEl(`
      <div class="error-state-icon" aria-hidden="true">${_iconOffline()}</div>
      <h2 class="error-state-headline">No network connection.</h2>
      <p class="error-state-body">
        The system is operating in offline mode.
        Last synchronized ${ageText}.
        Data shown may not reflect current conditions.
      </p>
    `, 'Offline. Last synchronized data is shown.');

    el.classList.add('error-state--offline');
    container.appendChild(el);
  }

  /* ── 4. Not Implemented ──────────────────────────────────── */

  /**
   * @param {HTMLElement} container
   * @param {string} actionLabel  - e.g. 'Verify report', 'Acknowledge alert'
   */
  function renderNotImplemented(container, actionLabel = 'This action') {
    if (!container) return;
    clear(container);

    const el = _buildEl(`
      <div class="error-state-icon" aria-hidden="true">${_iconBlock()}</div>
      <h2 class="error-state-headline">${actionLabel} is not available.</h2>
      <p class="error-state-body">
        This endpoint has not been implemented on the backend.
        Contact the system administrator.
      </p>
    `, `${actionLabel} is not available`);

    el.classList.add('error-state--not-implemented');
    container.appendChild(el);
  }

  /* ── 5. Inline banner (non-blocking) ─────────────────────── */

  /**
   * Renders a compact inline error banner inside container (does not replace content).
   * @param {HTMLElement} container
   * @param {string} message
   * @param {{ onRetry?: function, onDismiss?: function }} opts
   * @returns {HTMLElement} the banner element
   */
  function renderBanner(container, message, opts = {}) {
    if (!container) return null;

    const existing = container.querySelector('[data-error-banner]');
    if (existing) existing.remove();

    const retryBtn = opts.onRetry
      ? `<button class="error-banner-retry button button--secondary" type="button">Retry</button>`
      : '';
    const dismissBtn = opts.onDismiss
      ? `<button class="error-banner-dismiss" type="button" aria-label="Dismiss error">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
             <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
           </svg>
         </button>`
      : '';

    const banner = document.createElement('div');
    banner.className = 'error-banner';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'assertive');
    banner.setAttribute('data-error-banner', '1');
    banner.innerHTML = `
      <div class="error-banner-content">
        <span class="error-banner-icon" aria-hidden="true">${_iconAlert()}</span>
        <span class="error-banner-message">${message}</span>
        ${retryBtn}
      </div>
      ${dismissBtn}
    `;

    if (opts.onRetry)   banner.querySelector('.error-banner-retry').addEventListener('click', opts.onRetry);
    if (opts.onDismiss) banner.querySelector('.error-banner-dismiss').addEventListener('click', () => {
      banner.remove();
      opts.onDismiss();
    });

    container.insertAdjacentElement('afterbegin', banner);
    return banner;
  }

  /* ── Clear ───────────────────────────────────────────────── */

  function clear(container) {
    if (!container) return;
    container.querySelectorAll('[data-error-state]').forEach(el => el.remove());
  }

  /* ── Internal helpers ────────────────────────────────────── */

  function _buildEl(html, ariaLabel) {
    const el = document.createElement('div');
    el.className = 'error-state';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-label', ariaLabel);
    el.setAttribute('data-error-state', '1');
    el.innerHTML = html;
    return el;
  }

  function _formatAge(timestamp) {
    const ts = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (!ts || isNaN(ts.getTime())) return 'an unknown time';
    const ageMs = Date.now() - ts.getTime();
    const ageMin = Math.floor(ageMs / 60000);
    const ageHr  = Math.floor(ageMs / 3600000);
    if (ageMin < 1)  return 'just now';
    if (ageMin === 1) return '1 min ago';
    if (ageMin < 60)  return `${ageMin} min ago`;
    if (ageHr === 1)  return '1 hour ago';
    return `${ageHr} hours ago`;
  }

  function _iconAlert() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>`;
  }
  function _iconWarn() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`;
  }
  function _iconOffline() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <circle cx="12" cy="20" r="1"/>
    </svg>`;
  }
  function _iconBlock() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>`;
  }

  return { render, renderWithCache, renderOffline, renderNotImplemented, renderBanner, clear };
})();

window.ErrorUtil = ErrorUtil;
