/* ==========================================
   DISISTA CONTROL — SEARCH & FILTER UTILITY (PHASE 17)
   300ms debounced global search, filter pipeline, chip rendering
   ========================================== */

const SearchUtil = (() => {
  const DEFAULT_DEBOUNCE_MS = 300;

  function create({ inputEl, data = [], fields = [], onResults, onEmpty, debounceMs = DEFAULT_DEBOUNCE_MS }) {
    let _data = data;
    const _filterFns = {};
    const _filterFactories = {};
    const _filterValues = {};
    let _query = '';
    let _timer = null;

    function _onInput(e) {
      clearTimeout(_timer);
      _timer = setTimeout(() => {
        _query = (e.target.value || '').trim().toLowerCase();
        _run();
      }, debounceMs);
    }

    function _run() {
      let result = _data;

      if (_query) {
        result = result.filter(item =>
          fields.some(f => {
            const v = f.split('.').reduce((o, k) => (o != null ? o[k] : undefined), item);
            return v != null && String(v).toLowerCase().includes(_query);
          })
        );
      }

      for (const key of Object.keys(_filterFns)) {
        if (_filterFns[key]) result = result.filter(_filterFns[key]);
      }

      if (result.length === 0 && onEmpty) onEmpty();
      else if (onResults) onResults(result);
    }

    if (inputEl) inputEl.addEventListener('input', _onInput);
    _run();

    return {
      addFilter(key, factory) { _filterFactories[key] = factory; },
      setFilter(key, value) {
        if (value === null || value === undefined || value === '') {
          delete _filterFns[key]; delete _filterValues[key];
        } else {
          const factory = _filterFactories[key];
          _filterFns[key] = factory ? factory(value) : null;
          _filterValues[key] = value;
        }
        _run();
      },
      clearFilter(key) { delete _filterFns[key]; delete _filterValues[key]; _run(); },
      clearAll() {
        for (const k of Object.keys(_filterFns)) delete _filterFns[k];
        for (const k of Object.keys(_filterValues)) delete _filterValues[k];
        _query = ''; if (inputEl) inputEl.value = ''; _run();
      },
      update(newData) { _data = newData || []; _run(); },
      getActiveFilters() { return { ..._filterValues }; },
      destroy() { clearTimeout(_timer); if (inputEl) inputEl.removeEventListener('input', _onInput); }
    };
  }

  function renderFilterChips(container, activeFilters, onRemove, labelMap = {}) {
    if (!container) return;
    container.innerHTML = '';
    Object.keys(activeFilters).forEach(key => {
      const chip = document.createElement('span');
      chip.className = 'filter-chip';
      chip.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:var(--sage-100);border:1px solid var(--border-hairline);border-radius:20px;padding:2px 10px;font-size:12px;';
      chip.innerHTML = `<span>${labelMap[key] || key}: <strong>${activeFilters[key]}</strong></span>
        <button style="background:none;border:none;cursor:pointer;font-size:13px;color:var(--slate-500);padding:0 0 0 4px;" onclick="this.closest('.filter-chip').remove()">✕</button>`;
      chip.querySelector('button').addEventListener('click', () => onRemove(key));
      container.appendChild(chip);
    });
  }

  function highlight(text, query) {
    if (!query || !text) return String(text || '');
    const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return String(text).replace(new RegExp(`(${esc})`, 'gi'), '<mark style="background:rgba(143,175,140,0.4);border-radius:2px;">$1</mark>');
  }

  return { create, renderFilterChips, highlight };
})();

window.SearchUtil = SearchUtil;
