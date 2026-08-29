/* FRONTEND COMMON UTILITIES & HELPERS */

/**
 * Escapes HTML characters to prevent XSS attacks (Phase 25 Security)
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format relative timestamp string (e.g. "3 min ago", "Just now")
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Unknown';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid date';

  const diffSeconds = Math.floor((new Date() - date) / 1000);
  if (diffSeconds < 30) return 'Just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Create DOM element with attributes & children safely
 * @param {string} tag 
 * @param {Object} attrs 
 * @param {Array|string} children 
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, val]) => {
    if (key === 'className') {
      el.className = val;
    } else if (key === 'dataset') {
      Object.entries(val).forEach(([dk, dv]) => { el.dataset[dk] = dv; });
    } else if (key.startsWith('on') && typeof val === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (val !== null && val !== undefined) {
      el.setAttribute(key, val);
    }
  });

  if (typeof children === 'string') {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        el.appendChild(child);
      }
    });
  }

  return el;
}
