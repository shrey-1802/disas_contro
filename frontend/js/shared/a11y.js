/* Accessibility Utility (Phase 18)
 *
 * Enforces WCAG 2.1 AA requirements across the application.
 *
 * Provides:
 *   1. trapFocus(el)           — focus trap for modal dialogs (Escape closes)
 *   2. releaseFocus()          — release the current focus trap
 *   3. announce(msg, urgency)  — screen-reader live region announcements
 *   4. restoreFocus(el)        — restore focus to a trigger element after dialog close
 *   5. ensureLabel(el)         — dev-time audit: warn if interactive element has no label
 *   6. setAriaExpanded(btn, b) — toggle aria-expanded for disclosure patterns
 *   7. initSkipLink()          — wire up the skip-to-main-content link
 *
 * Requirements met:
 *   — keyboard navigation
 *   — visible focus (handled by base.css :focus-visible)
 *   — semantic HTML (authoring responsibility)
 *   — proper labels (ensureLabel audit helper)
 *   — ARIA only where needed
 *   — accessible status messages (announce)
 *   — screen-reader-friendly alerts (aria-live regions)
 *   — no color-only status (enforced in CSS/component design)
 *   — 44×44 touch targets (enforced via CSS --touch-target-min)
 *   — no hover-only essential info (authoring responsibility)
 *   — focus trapping for modal dialogs (trapFocus)
 *   — Escape closes non-critical overlays (trapFocus onEscape callback)
 *   — logical tab order (enforced by DOM order; tabIndex audit helper)
 *
 * Usage:
 *   const release = A11yUtil.trapFocus(modalEl, { onEscape: () => closeModal() });
 *   release();  // call to release trap when modal closes
 *
 *   A11yUtil.announce('Route recalculated for Convoy 14.');
 *   A11yUtil.announce('Bridge B-14 blocked. Immediate attention required.', 'assertive');
 */

const A11yUtil = (() => {

  // Selectors for focusable elements within a container
  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'details > summary',
  ].join(', ');

  // Currently active focus trap cleanup (only one at a time)
  let _activeTrapRelease = null;

  // Live region elements (created once, reused)
  let _politeRegion   = null;
  let _assertiveRegion = null;

  /* ── 1. Focus Trap ───────────────────────────────────────── */

  /**
   * Traps keyboard focus inside a modal/dialog element.
   * Pressing Escape calls onEscape() if provided.
   * Tab and Shift+Tab cycle within the focusable elements.
   *
   * @param {HTMLElement} el        — the modal/drawer to trap within
   * @param {{ onEscape?: function }} opts
   * @returns {function} release   — call to remove the trap
   */
  function trapFocus(el, opts = {}) {
    if (!el) return () => {};

    // Release any previously active trap
    if (_activeTrapRelease) _activeTrapRelease();

    const getFocusable = () => Array.from(el.querySelectorAll(FOCUSABLE)).filter(f => !f.closest('[hidden]'));

    function handleKeydown(e) {
      if (e.key === 'Escape') {
        if (opts.onEscape) opts.onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) { e.preventDefault(); return; }

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    el.addEventListener('keydown', handleKeydown);

    // Move focus to first focusable element inside the trap
    const firstEl = getFocusable()[0];
    if (firstEl) {
      setTimeout(() => firstEl.focus(), 50); // slight delay for animation frames
    }

    function release() {
      el.removeEventListener('keydown', handleKeydown);
      _activeTrapRelease = null;
    }

    _activeTrapRelease = release;
    return release;
  }

  /**
   * Explicitly releases the current focus trap.
   */
  function releaseFocus() {
    if (_activeTrapRelease) _activeTrapRelease();
  }

  /* ── 2. Live Region Announcements ────────────────────────── */

  /**
   * Announces a message to screen readers via an aria-live region.
   * @param {string} message
   * @param {'polite'|'assertive'} urgency
   *   — 'polite': after current speech (default, for status updates)
   *   — 'assertive': interrupts current speech (for critical alerts only)
   */
  function announce(message, urgency = 'polite') {
    _ensureLiveRegions();
    const region = urgency === 'assertive' ? _assertiveRegion : _politeRegion;
    // Clear first to force re-announcement of the same message
    region.textContent = '';
    setTimeout(() => { region.textContent = message; }, 50);
  }

  function _ensureLiveRegions() {
    if (!_politeRegion) {
      _politeRegion = document.createElement('div');
      _politeRegion.setAttribute('aria-live', 'polite');
      _politeRegion.setAttribute('aria-atomic', 'true');
      _politeRegion.className = 'sr-only';
      document.body.appendChild(_politeRegion);
    }
    if (!_assertiveRegion) {
      _assertiveRegion = document.createElement('div');
      _assertiveRegion.setAttribute('aria-live', 'assertive');
      _assertiveRegion.setAttribute('aria-atomic', 'true');
      _assertiveRegion.className = 'sr-only';
      document.body.appendChild(_assertiveRegion);
    }
  }

  /* ── 3. Restore Focus ────────────────────────────────────── */

  /**
   * Restores keyboard focus to a trigger element (e.g. after a modal closes).
   * @param {HTMLElement|null} el
   */
  function restoreFocus(el) {
    if (el && typeof el.focus === 'function') {
      setTimeout(() => el.focus(), 50);
    }
  }

  /* ── 4. aria-expanded toggle ─────────────────────────────── */

  /**
   * Sets aria-expanded on a disclosure button.
   * @param {HTMLElement} btn
   * @param {boolean} expanded
   */
  function setAriaExpanded(btn, expanded) {
    if (btn) btn.setAttribute('aria-expanded', String(expanded));
  }

  /* ── 5. Skip Link ─────────────────────────────────────────── */

  /**
   * Wires up a "Skip to main content" link.
   * Must be the first focusable element in the page.
   * Usage: add <a href="#main-content" id="skip-link" class="skip-link">Skip to main content</a>
   *        to the top of <body>, and id="main-content" on <main>.
   */
  function initSkipLink() {
    const link = document.getElementById('skip-link');
    if (!link) return;
    link.addEventListener('click', e => {
      const target = document.getElementById('main-content');
      if (target) {
        e.preventDefault();
        target.setAttribute('tabindex', '-1');
        target.focus();
      }
    });
  }

  /* ── 6. Dev-time label audit ─────────────────────────────── */

  /**
   * Warns in console if any interactive element is missing an accessible label.
   * Call once on DOMContentLoaded during development.
   * No-ops in production (detect via data-env="production" on <html>).
   */
  function auditLabels() {
    if (document.documentElement.dataset.env === 'production') return;
    const els = document.querySelectorAll('button, input, select, textarea, a[href]');
    els.forEach(el => {
      const label = el.getAttribute('aria-label') ||
                    el.getAttribute('aria-labelledby') ||
                    el.getAttribute('title') ||
                    el.textContent.trim();
      if (!label) {
        console.warn('[A11y] Missing accessible label:', el);
      }
    });
  }

  /* ── 7. Logical tab order helper ─────────────────────────── */

  /**
   * Returns focusable elements in DOM order within a container.
   * Useful to verify logical tab order without relying on tabindex attributes.
   * @param {HTMLElement} container
   * @returns {HTMLElement[]}
   */
  function getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => {
      return !el.closest('[hidden]') && !el.closest('[aria-hidden="true"]');
    });
  }

  return {
    trapFocus,
    releaseFocus,
    announce,
    restoreFocus,
    setAriaExpanded,
    initSkipLink,
    auditLabels,
    getFocusableElements,
  };
})();

window.A11yUtil = A11yUtil;
