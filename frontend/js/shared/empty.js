/* Empty State Utility (Phase 15)
 *
 * Renders meaningful, factual empty states for every entity type.
 * Rules enforced here (Phase 20 compliant):
 *   — No exclamation marks
 *   — No "Nothing here!" style copy
 *   — Copy is direct, operational, factual
 *   — Icon + headline + supporting sentence
 *   — Optional action button
 *
 * Usage:
 *   EmptyUtil.render(containerEl, 'convoys')
 *   EmptyUtil.render(containerEl, 'shelters', { action: { label: 'Refresh', onClick: fn } })
 *   EmptyUtil.renderCustom(containerEl, { icon, headline, body, action })
 *   EmptyUtil.clear(containerEl)
 */

const EmptyUtil = (() => {

  /* ── Approved empty-state copy per entity ─────────────────── */
  const DEFINITIONS = {
    convoys: {
      icon: _iconTruck(),
      headline: 'No active convoys',
      body: 'There are currently no active convoy missions. Convoys will appear here once dispatched.'
    },
    shelters: {
      icon: _iconHome(),
      headline: 'No shelter data',
      body: 'Shelter records have not loaded. Check connectivity and retry.'
    },
    hazards: {
      icon: _iconTriangle(),
      headline: 'No hazard reports',
      body: 'No hazard or incident reports have been filed for the current filter criteria.'
    },
    alerts: {
      icon: _iconBell(),
      headline: 'No active alerts',
      body: 'There are no unacknowledged alerts at this time.'
    },
    roads: {
      icon: _iconRoad(),
      headline: 'No road data',
      body: 'Road status information is not available. Data will appear once the backend responds.'
    },
    bridges: {
      icon: _iconBridge(),
      headline: 'No bridge data',
      body: 'Bridge status records are not available. Check connectivity and retry.'
    },
    reports: {
      icon: _iconClipboard(),
      headline: 'No field reports',
      body: 'No field reports have been submitted. Reports filed by drivers will appear here.'
    },
    missions: {
      icon: _iconTarget(),
      headline: 'No missions',
      body: 'There are no missions matching the current filter.'
    },
    vehicles: {
      icon: _iconTruck(),
      headline: 'No vehicles',
      body: 'No vehicles are currently registered or visible in the system.'
    },
    search: {
      icon: _iconSearch(),
      headline: 'No results found',
      body: 'The current search and filter combination returned no results. Adjust your criteria and try again.'
    },
    generic: {
      icon: _iconInbox(),
      headline: 'No data available',
      body: 'This section has no data to display at this time.'
    }
  };

  /* ── Public API ───────────────────────────────────────────── */

  /**
   * Renders a predefined empty state for the given entity type.
   * @param {HTMLElement} container
   * @param {string} type  - key from DEFINITIONS (convoys|shelters|hazards|alerts|roads|bridges|reports|missions|vehicles|search|generic)
   * @param {{ action?: { label: string, onClick: function } }} opts
   */
  function render(container, type = 'generic', opts = {}) {
    const def = DEFINITIONS[type] || DEFINITIONS.generic;
    renderCustom(container, { ...def, action: opts.action });
  }

  /**
   * Renders a fully custom empty state.
   * @param {HTMLElement} container
   * @param {{ icon: string, headline: string, body: string, action?: { label, onClick } }} cfg
   */
  function renderCustom(container, cfg) {
    if (!container) return;
    clear(container);

    const actionHtml = cfg.action
      ? `<button class="button button--secondary empty-state-action" type="button">${cfg.action.label}</button>`
      : '';

    const el = document.createElement('div');
    el.className = 'empty-state';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', cfg.headline);
    el.setAttribute('data-empty-state', '1');
    el.innerHTML = `
      <div class="empty-state-icon" aria-hidden="true">${cfg.icon || _iconInbox()}</div>
      <h2 class="empty-state-headline">${cfg.headline}</h2>
      <p class="empty-state-body">${cfg.body}</p>
      ${actionHtml}
    `;

    if (cfg.action) {
      el.querySelector('.empty-state-action').addEventListener('click', cfg.action.onClick);
    }

    container.appendChild(el);
  }

  /**
   * Removes any empty state injected into container.
   * @param {HTMLElement} container
   */
  function clear(container) {
    if (!container) return;
    container.querySelectorAll('[data-empty-state]').forEach(el => el.remove());
  }

  /* ── SVG Icon helpers (inline, no external dependency) ────── */
  function _iconTruck() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>`;
  }
  function _iconHome() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`;
  }
  function _iconTriangle() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`;
  }
  function _iconBell() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>`;
  }
  function _iconRoad() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path d="M5 21L12 3l7 18"/><line x1="12" y1="3" x2="12" y2="21"/>
    </svg>`;
  }
  function _iconBridge() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path d="M3 12 Q7 4 12 12 Q17 4 21 12"/><line x1="3" y1="12" x2="3" y2="20"/>
      <line x1="21" y1="12" x2="21" y2="20"/>
    </svg>`;
  }
  function _iconClipboard() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>`;
  }
  function _iconTarget() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>`;
  }
  function _iconSearch() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>`;
  }
  function _iconInbox() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>`;
  }

  return { render, renderCustom, clear };
})();

window.EmptyUtil = EmptyUtil;
