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
  info(msg) { this.show(msg, 'info'); }
  success(msg) { this.show(msg, 'success'); }
  warning(msg) { this.show(msg, 'warning'); }
  error(msg) { this.show(msg, 'error'); }
  critical(msg) { this.show(msg, 'critical'); }
}

export const Toast = new ToastService();
export const toast = Toast;
export default Toast;
