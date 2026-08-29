/* Search & Filter Utility (Phase 17)
 *
 * Reusable, client-side search and filter architecture.
 *
 * Principles:
 *   — Text search is debounced 300ms (Phase 17 requirement)
 *   — Filtering happens client-side when dataset is already loaded
 *   — Never triggers excessive API calls
 *   — Does NOT debounce immediate operational controls (e.g. status toggles)
 *
 * Usage:
 *   const search = SearchUtil.create({
 *     inputEl: document.getElementById('search-input'),
 *     data: arrayOfObjects,
 *     fields: ['id', 'cargo', 'driver'],   // fields to match text against
 *     onResults: (filtered) => renderRows(filtered),
 *     onEmpty: () => EmptyUtil.render(tbody, 'search'),
 *   });
 *
 *   search.addFilter('status', value => item => item.status === value);
 *   search.setFilter('status', 'rerouted');
 *   search.clearFilter('status');
 *   search.clearAll();
 *   search.update(newData);   // replace underlying dataset
 *   search.destroy();         // remove event listeners
 */

const SearchUtil = (() => {

  const DEFAULT_DEBOUNCE_MS = 300;

  /**
   * Creates a search+filter controller bound to a text input.
   *
   * @param {{
   *   inputEl: HTMLInputElement,
   *   data: Array<object>,
   *   fields: string[],
   *   onResults: function(Array),
   *   onEmpty?: function(),
   *   debounceMs?: number,
   * }} cfg
   * @returns {{ addFilter, setFilter, clearFilter, clearAll, update, destroy, getActiveFilters }}
   */
  function create(cfg) {
    let data          = cfg.data || [];
    const fields      = cfg.fields || [];
    const onResults   = cfg.onResults;
    const onEmpty     = cfg.onEmpty || null;
    const debounceMs  = cfg.debounceMs !== undefined ? cfg.debounceMs : DEFAULT_DEBOUNCE_MS;
    const inputEl     = cfg.inputEl;

    // Active filter map: { key: testFn(item => bool) }
    const filterFns = {};
    // Active filter values: { key: value } — for display / chip rendering
    const filterValues = {};

    let currentQuery = '';
    let debounceTimer = null;

    /* ── Text input handler (debounced) ──────────────────────── */

    function _onInput(e) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentQuery = (e.target.value || '').trim().toLowerCase();
        _run();
      }, debounceMs);
    }

    /* ── Core filter runner ───────────────────────────────────── */

    function _run() {
      let result = data;

      // 1. Apply text search across specified fields
      if (currentQuery) {
        result = result.filter(item =>
          fields.some(field => {
            const val = _deepGet(item, field);
            return val !== null && val !== undefined && String(val).toLowerCase().includes(currentQuery);
          })
        );
      }

      // 2. Apply each active filter
      for (const key of Object.keys(filterFns)) {
        const fn = filterFns[key];
        if (fn) result = result.filter(fn);
      }

      // 3. Emit results
      if (result.length === 0 && onEmpty) {
        onEmpty();
      } else {
        onResults(result);
      }
    }

    /* ── Public API ───────────────────────────────────────────── */

    /**
     * Register a filter by key. The factory returns a predicate for a given value.
     * @param {string} key
     * @param {function(value): function(item): boolean} factory
     */
    function addFilter(key, factory) {
      // Store the factory so setFilter can call it later
      filterFns[`__factory_${key}`] = factory;
    }

    /**
     * Activate a registered filter with a specific value.
     * Pass null/undefined to deactivate.
     * @param {string} key
     * @param {*} value
     */
    function setFilter(key, value) {
      const factory = filterFns[`__factory_${key}`];
      if (value === null || value === undefined || value === '') {
        delete filterFns[key];
        delete filterValues[key];
      } else {
        filterFns[key] = factory ? factory(value) : null;
        filterValues[key] = value;
      }
      _run();
    }

    /**
     * Remove a specific active filter.
     * @param {string} key
     */
    function clearFilter(key) {
      delete filterFns[key];
      delete filterValues[key];
      _run();
    }

    /**
     * Clear all active filters and reset search query.
     */
    function clearAll() {
      for (const key of Object.keys(filterFns)) {
        if (!key.startsWith('__factory_')) delete filterFns[key];
      }
      for (const key of Object.keys(filterValues)) {
        delete filterValues[key];
      }
      currentQuery = '';
      if (inputEl) inputEl.value = '';
      _run();
    }

    /**
     * Replace the underlying dataset and re-run filters.
     * @param {Array} newData
     */
    function update(newData) {
      data = newData || [];
      _run();
    }

    /**
     * Returns currently active filter values.
     * @returns {object}
     */
    function getActiveFilters() {
      return { ...filterValues };
    }

    /**
     * Remove event listeners. Call when the page is unloaded.
     */
    function destroy() {
      clearTimeout(debounceTimer);
      if (inputEl) inputEl.removeEventListener('input', _onInput);
    }

    /* ── Bind input ───────────────────────────────────────────── */

    if (inputEl) {
      inputEl.addEventListener('input', _onInput);
    }

    // Run once immediately with initial data
    _run();

    return { addFilter, setFilter, clearFilter, clearAll, update, getActiveFilters, destroy };
  }

  /* ── Utility: render filter chips ────────────────────────── */

  /**
   * Renders active filter chips into a container element.
   * Each chip shows the filter key + value and a remove button.
   *
   * @param {HTMLElement} container
   * @param {object} activeFilters  - from search.getActiveFilters()
   * @param {function(key)} onRemove  - called with the filter key when chip × is clicked
   * @param {object} labelMap       - { key: 'Human Label' } for display
   */
  function renderFilterChips(container, activeFilters, onRemove, labelMap = {}) {
    if (!container) return;
    container.innerHTML = '';

    const keys = Object.keys(activeFilters);
    if (keys.length === 0) return;

    keys.forEach(key => {
      const value = activeFilters[key];
      const label = labelMap[key] || key;

      const chip = document.createElement('span');
      chip.className = 'filter-chip';
      chip.innerHTML = `
        <span class="filter-chip-label">${label}: <strong>${value}</strong></span>
        <button class="filter-chip-remove" type="button" aria-label="Remove ${label} filter">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;
      chip.querySelector('.filter-chip-remove').addEventListener('click', () => onRemove(key));
      container.appendChild(chip);
    });
  }

  /* ── Utility: deep field getter ──────────────────────────── */

  function _deepGet(obj, path) {
    return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
  }

  /* ── Utility: highlight matched text ─────────────────────── */

  /**
   * Wraps matching substring in a <mark> for display in results.
   * @param {string} text
   * @param {string} query
   * @returns {string} HTML string
   */
  function highlight(text, query) {
    if (!query || !text) return String(text || '');
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return String(text).replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>');
  }

  return { create, renderFilterChips, highlight };
})();

window.SearchUtil = SearchUtil;
