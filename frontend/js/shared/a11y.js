/* ==========================================
   DISISTA CONTROL — ACCESSIBILITY UTILITY (PHASE 18)
   WCAG 2.1 AA: Focus trap, aria-live, skip link, label audit
   ========================================== */

const A11yUtil = (() => {

  /* ── Skip Link (keyboard-first navigation) ── */
  function injectSkipLink(targetId = 'main-content') {
    if (document.getElementById('skip-link')) return;
    const link = document.createElement('a');
    link.id = 'skip-link';
    link.href = `#${targetId}`;
    link.textContent = 'Skip to main content';
    link.style.cssText = `
      position:absolute;top:-40px;left:8px;z-index:10000;
      background:var(--slate-800);color:var(--white);
      padding:8px 16px;border-radius:4px;font-size:14px;font-weight:600;
      transition:top 0.15s ease;text-decoration:none;
    `;
    link.addEventListener('focus', () => { link.style.top = '8px'; });
    link.addEventListener('blur',  () => { link.style.top = '-40px'; });
    document.body.prepend(link);
  }

  /* ── aria-live region for real-time announcements ── */
  function createLiveRegion(id = 'aria-announcer', politeness = 'polite') {
    if (document.getElementById(id)) return;
    const el = document.createElement('div');
    el.id = id;
    el.setAttribute('aria-live', politeness);
    el.setAttribute('aria-atomic', 'true');
    el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
    document.body.appendChild(el);
  }

  function announce(message, politeness = 'polite') {
    const id = politeness === 'assertive' ? 'aria-announcer-assertive' : 'aria-announcer';
    let el = document.getElementById(id);
    if (!el) { createLiveRegion(id, politeness); el = document.getElementById(id); }
    el.textContent = '';
    setTimeout(() => { if (el) el.textContent = message; }, 50);
  }

  /* ── Focus trap for modals ── */
  function trapFocus(modalEl) {
    const focusable = 'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const focusableEls = [...modalEl.querySelectorAll(focusable)].filter(el => !el.disabled && el.offsetParent !== null);
    if (focusableEls.length === 0) return () => {};

    const first = focusableEls[0];
    const last  = focusableEls[focusableEls.length - 1];
    first.focus();

    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }
    modalEl.addEventListener('keydown', handler);
    return () => modalEl.removeEventListener('keydown', handler);
  }

  /* ── Escape key modal close ── */
  function onEscape(callback) {
    function handler(e) { if (e.key === 'Escape') callback(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }

  /* ── Label audit (dev warning) ── */
  function auditLabels() {
    const inputs = document.querySelectorAll('input,select,textarea');
    inputs.forEach(el => {
      if (!el.id) return;
      const hasLabel = document.querySelector(`label[for="${el.id}"]`) || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if (!hasLabel) console.warn(`[A11y] Missing label for #${el.id}`);
    });
  }

  /* ── Init: run all baseline accessibility on DOMContentLoaded ── */
  function init() {
    injectSkipLink();
    createLiveRegion('aria-announcer', 'polite');
    createLiveRegion('aria-announcer-assertive', 'assertive');
    if (location.hostname === 'localhost') auditLabels();
  }

  return { init, injectSkipLink, createLiveRegion, announce, trapFocus, onEscape, auditLabels };
})();

window.A11yUtil = A11yUtil;
document.addEventListener('DOMContentLoaded', () => A11yUtil.init());
