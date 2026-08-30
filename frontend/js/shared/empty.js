/* ==========================================
   DISISTA CONTROL — EMPTY STATES UTILITY (PHASE 15)
   Entity-specific zero-data states with Phase 20 compliant copy
   ========================================== */

const EmptyUtil = (() => {
  const STATES = {
    convoys: { icon: '🚛', title: 'No Convoys Active', msg: 'There are currently no active or dispatched convoys matching your criteria.' },
    hazards: { icon: '⚠️', title: 'No Hazards Logged', msg: 'No active road blockages or flash flood hazard reports present in system.' },
    shelters: { icon: '🏛️', title: 'No Shelter Shortages', msg: 'All registered relief shelters currently operate above minimum supply cover threshold.' },
    transfers: { icon: '📦', title: 'No Active Swaps', msg: 'No inter-warehouse supply rebalancing transfers currently in progress.' },
    alerts: { icon: '🔔', title: 'No Active Critical Alerts', msg: 'Command center alerts inbox is clear. All operational signals acknowledged.' },
    search: { icon: '🔍', title: 'No Results Found', msg: 'No records matched your search query. Try broadening your keywords or filters.' }
  };

  function render(container, entityType = 'search', actionBtnHtml = '') {
    if (!container) return;
    const config = STATES[entityType] || STATES.search;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; color: var(--slate-500);">
        <span style="font-size: 36px; margin-bottom: 8px;">${config.icon}</span>
        <h4 style="font-size: 16px; color: var(--slate-800); margin-bottom: 4px;">${config.title}</h4>
        <p style="font-size: 13px; max-width: 380px; line-height: 1.5; margin-bottom: 12px;">${config.msg}</p>
        ${actionBtnHtml}
      </div>
    `;
  }

  return { render };
})();

window.EmptyUtil = EmptyUtil;
