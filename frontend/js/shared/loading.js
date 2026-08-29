/* Loading State Utility (Phase 14)
 *
 * Provides reusable helpers to show and remove intentional loading states.
 * Three patterns:
 *   1. Page/section loading spinner  — showPageLoading / hidePageLoading
 *   2. Card skeleton placeholders    — showCardSkeletons / hideSkeletons
 *   3. Table row skeleton rows       — showTableSkeletons / hideSkeletons
 *   4. Map loading overlay           — showMapLoading / hideMapLoading
 *
 * Usage:
 *   LoadingUtil.showPageLoading(containerEl, 'Loading shelters...')
 *   LoadingUtil.hidePageLoading(containerEl)
 *
 *   LoadingUtil.showCardSkeletons(containerEl, 3)
 *   LoadingUtil.hideSkeletons(containerEl)
 *
 *   LoadingUtil.showTableSkeletons(tbodyEl, 5, 4)
 *   LoadingUtil.hideSkeletons(tbodyEl)
 *
 *   LoadingUtil.showMapLoading(mapContainerEl)
 *   LoadingUtil.hideMapLoading(mapContainerEl)
 */

const LoadingUtil = (() => {
  const SKELETON_ATTR = 'data-skeleton';
  const PAGE_LOAD_ATTR = 'data-page-loading';
  const MAP_LOAD_ATTR  = 'data-map-loading';

  /* ── 1. PAGE / SECTION LOADING ─────────────────────────────── */

  /**
   * Injects a centered spinner + label into containerEl.
   * Previous content is hidden, not removed.
   * @param {HTMLElement} container
   * @param {string} label  - e.g. 'Loading shelters...'
   * @param {string} sub    - optional sub-label shown below
   */
  function showPageLoading(container, label = 'Loading data...', sub = '') {
    if (!container) return;
    hidePageLoading(container); // no duplicates

    const el = document.createElement('div');
    el.className = 'page-loading';
    el.setAttribute(PAGE_LOAD_ATTR, '1');
    el.innerHTML = `
      <div class="page-loading-spinner" role="status" aria-label="${label}"></div>
      <p class="page-loading-label">${label}</p>
      ${sub ? `<p class="page-loading-sub">${sub}</p>` : ''}
    `;

    // Hide real content visually while loading
    Array.from(container.children).forEach(child => {
      if (!child.hasAttribute(PAGE_LOAD_ATTR)) {
        child.setAttribute('aria-hidden', 'true');
        child.style.display = 'none';
      }
    });

    container.appendChild(el);
  }

  /**
   * Removes the loading indicator and restores hidden content.
   * @param {HTMLElement} container
   */
  function hidePageLoading(container) {
    if (!container) return;
    const el = container.querySelector(`[${PAGE_LOAD_ATTR}]`);
    if (el) el.remove();

    Array.from(container.children).forEach(child => {
      if (child.getAttribute('aria-hidden') === 'true') {
        child.removeAttribute('aria-hidden');
        child.style.display = '';
      }
    });
  }

  /* ── 2. CARD SKELETONS ──────────────────────────────────────── */

  /**
   * Injects N skeleton card placeholders into container.
   * @param {HTMLElement} container
   * @param {number} count  - number of skeleton cards to show
   */
  function showCardSkeletons(container, count = 3) {
    if (!container) return;
    hideSkeletons(container);

    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'skeleton-card';
      card.setAttribute(SKELETON_ATTR, '1');
      card.setAttribute('aria-hidden', 'true');
      card.innerHTML = `
        <div class="skeleton-card-header">
          <span class="skeleton skeleton-circle"></span>
          <span class="skeleton skeleton-heading" style="flex: 1;"></span>
        </div>
        <span class="skeleton skeleton-line skeleton-line--long"></span>
        <span class="skeleton skeleton-line skeleton-line--medium"></span>
        <span class="skeleton skeleton-line skeleton-line--short"></span>
      `;
      container.appendChild(card);
    }
  }

  /* ── 3. TABLE ROW SKELETONS ─────────────────────────────────── */

  /**
   * Injects N skeleton rows into a <tbody> element.
   * @param {HTMLElement} tbody
   * @param {number} rows     - number of skeleton rows
   * @param {number} cols     - number of columns per row
   */
  function showTableSkeletons(tbody, rows = 5, cols = 4) {
    if (!tbody) return;
    hideSkeletons(tbody);

    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      tr.setAttribute(SKELETON_ATTR, '1');
      tr.setAttribute('aria-hidden', 'true');

      for (let c = 0; c < cols; c++) {
        const td = document.createElement('td');
        td.style.padding = '12px 8px';
        // Vary widths slightly for realism
        const widths = ['skeleton-line--short', 'skeleton-line--medium', 'skeleton-line--long', 'skeleton-line--full'];
        const w = widths[c % widths.length];
        td.innerHTML = `<span class="skeleton skeleton-line ${w}"></span>`;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  /* ── 4. MAP LOADING OVERLAY ─────────────────────────────────── */

  /**
   * Injects a semi-transparent loading overlay over a map container.
   * The map container must have position: relative.
   * @param {HTMLElement} mapContainer
   * @param {string} label
   */
  function showMapLoading(mapContainer, label = 'Loading map data...') {
    if (!mapContainer) return;
    hideMapLoading(mapContainer);

    mapContainer.style.position = 'relative'; // ensure stacking context
    const overlay = document.createElement('div');
    overlay.className = 'map-loading-overlay';
    overlay.setAttribute(MAP_LOAD_ATTR, '1');
    overlay.innerHTML = `
      <div class="map-loading-spinner" role="status" aria-label="${label}"></div>
      <p class="map-loading-label">${label}</p>
    `;
    mapContainer.appendChild(overlay);
  }

  /**
   * Removes the map loading overlay.
   * @param {HTMLElement} mapContainer
   */
  function hideMapLoading(mapContainer) {
    if (!mapContainer) return;
    const overlay = mapContainer.querySelector(`[${MAP_LOAD_ATTR}]`);
    if (overlay) overlay.remove();
  }

  /* ── 5. GENERIC SKELETON CLEAR ──────────────────────────────── */

  /**
   * Removes all skeleton elements inside a container.
   * @param {HTMLElement} container
   */
  function hideSkeletons(container) {
    if (!container) return;
    container.querySelectorAll(`[${SKELETON_ATTR}]`).forEach(el => el.remove());
  }

  /* ── 6. BUTTON LOADING STATE ────────────────────────────────── */

  /**
   * Puts a button into loading state (spinner via CSS ::after).
   * @param {HTMLButtonElement} btn
   * @param {string} loadingText
   */
  function setButtonLoading(btn, loadingText = 'Loading...') {
    if (!btn) return;
    btn._prevHTML = btn.innerHTML;
    btn._prevDisabled = btn.disabled;
    btn.classList.add('button--loading');
    btn.disabled = true;
    btn.innerHTML = `<span>${loadingText}</span>`;
  }

  /**
   * Restores a button to its pre-loading state.
   * @param {HTMLButtonElement} btn
   */
  function clearButtonLoading(btn) {
    if (!btn) return;
    btn.classList.remove('button--loading');
    btn.disabled = btn._prevDisabled || false;
    if (btn._prevHTML) btn.innerHTML = btn._prevHTML;
  }

  return {
    showPageLoading,
    hidePageLoading,
    showCardSkeletons,
    showTableSkeletons,
    showMapLoading,
    hideMapLoading,
    hideSkeletons,
    setButtonLoading,
    clearButtonLoading
  };
})();

window.LoadingUtil = LoadingUtil;
