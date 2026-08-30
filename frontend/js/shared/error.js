/* ==========================================
   DISISTA CONTROL — ERROR STATES UTILITY (PHASE 16)
   Full-page, stale-cache, offline, inline error modes
   ========================================== */

const ErrorUtil = (() => {

  function renderFull(container, { title, detail, retryFn } = {}) {
    if (!container) return;
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;text-align:center;color:var(--slate-500);">
        <svg width="40" height="40" fill="none" stroke="var(--slate-800)" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom:12px;" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        <h4 style="font-size:16px;color:var(--slate-800);margin-bottom:4px;">${title || 'Data Unavailable'}</h4>
        <p style="font-size:13px;max-width:360px;line-height:1.6;margin-bottom:16px;">${detail || 'Unable to load operational data. Check connectivity and retry.'}</p>
        ${retryFn ? `<button class="btn btn-primary" style="min-height:36px;font-size:13px;" onclick="(${retryFn.toString()})()">Retry Request</button>` : ''}
      </div>
    `;
  }

  function renderInlineBanner(container, message) {
    if (!container) return;
    const banner = document.createElement('div');
    banner.className = 'error-inline-banner';
    banner.style.cssText = 'background:var(--bg-honeydew);border:1px solid var(--forest-600);border-left:4px solid var(--forest-600);border-radius:var(--radius);padding:10px 14px;font-size:13px;color:var(--slate-800);margin-bottom:12px;display:flex;align-items:center;gap:8px;';
    banner.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="var(--forest-600)" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>${message}</span>
      <button style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:16px;color:var(--slate-500);" onclick="this.parentElement.remove()" aria-label="Dismiss error">✕</button>
    `;
    container.prepend(banner);
  }

  function renderOfflineBanner() {
    const existing = document.getElementById('offline-banner');
    if (existing) return;
    const banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:var(--slate-800);color:var(--white);padding:8px 20px;border-radius:20px;font-size:13px;z-index:9999;display:flex;align-items:center;gap:8px;';
    banner.innerHTML = `
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39"/>
        <path d="M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
      </svg>
      Offline — queued actions will sync when connectivity returns
    `;
    document.body.appendChild(banner);
  }

  function removeOfflineBanner() {
    const b = document.getElementById('offline-banner');
    if (b) b.remove();
  }

  return { renderFull, renderInlineBanner, renderOfflineBanner, removeOfflineBanner };
})();

window.ErrorUtil = ErrorUtil;

// Auto-detect offline/online
window.addEventListener('offline', () => ErrorUtil.renderOfflineBanner());
window.addEventListener('online',  () => ErrorUtil.removeOfflineBanner());
