/* FRONTEND TOAST NOTIFICATION SERVICE */
import { createElement } from './utils.js';

class ToastService {
  constructor() {
    this.container = null;
  }

  ensureContainer() {
    if (!this.container) {
      this.container = createElement('div', { className: 'toast-container', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 4000) {
    this.ensureContainer();

    const toast = createElement('div', { className: `toast toast--${type}` }, [
      createElement('span', { className: 'toast__message' }, message)
    ]);

    this.container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, duration);
  }
}

export const Toast = new ToastService();
