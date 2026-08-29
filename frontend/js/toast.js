/**
 * Toast Notification Service Module
 * Relief Supply Chain Resilience & Rerouting System
 */

class ToastService {
  constructor() {
    this.container = null;
    this.initContainer();
  }

  initContainer() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.createContainerElem());
    } else {
      this.createContainerElem();
    }
  }

  createContainerElem() {
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'safe', durationMs = 4000) {
    if (!this.container) this.createContainerElem();

    const toastElem = document.createElement('div');
    toastElem.className = `toast toast--${type}`;

    let iconSymbol = 'ℹ️';
    if (type === 'safe') iconSymbol = '✓';
    if (type === 'warning' || type === 'caution') iconSymbol = '⚠️';
    if (type === 'critical' || type === 'blocked') iconSymbol = '🛑';

    toastElem.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${iconSymbol}</span>
      <span class="toast__message">${message}</span>
    `;

    this.container.appendChild(toastElem);

    setTimeout(() => {
      toastElem.style.opacity = '0';
      toastElem.style.transition = 'opacity 200ms ease';
      setTimeout(() => toastElem.remove(), 200);
    }, durationMs);
  }
}

export const toast = new ToastService();
window.toast = toast;
