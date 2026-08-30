/* ==========================================
   DISISTA CONTROL — LOADING STATES UTILITY (PHASE 14)
   Skeleton Loaders, Spinners, & Table Placeholders
   ========================================== */

const LoadingUtil = (() => {
  function renderSkeletonTable(container, rows = 3, cols = 5) {
    if (!container) return;
    let html = '';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += `<td><div style="height: 16px; background: var(--sage-100); border-radius: 4px; animation: pulse 1.2s infinite ease-in-out;"></div></td>`;
      }
      html += '</tr>';
    }
    container.innerHTML = html;
  }

  function renderSpinner(container, text = 'Loading operational telemetry...') {
    if (!container) return;
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; color: var(--slate-500);">
        <div style="width: 28px; height: 28px; border: 3px solid var(--border-hairline); border-top-color: var(--forest-600); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px;"></div>
        <span style="font-size: 13px; font-weight: 500;">${text}</span>
      </div>
    `;
  }

  return { renderSkeletonTable, renderSpinner };
})();

window.LoadingUtil = LoadingUtil;
