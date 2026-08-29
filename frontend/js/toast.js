/* ==========================================
   DISISTA CONTROL — PERSISTENT ALERT & TOAST SYSTEM
   Global Critical Banner + Toast Notifications
   ========================================== */

class ToastManager {
  constructor() {
    this.bannerEl = null;
    this.toastContainerEl = null;
    this.initContainers();
  }

  initContainers() {
    // Create Banner container if not exists
    if (!document.getElementById('global-alert-banner')) {
      const banner = document.createElement('div');
      banner.id = 'global-alert-banner';
      banner.className = 'alert-banner-global hidden';
      banner.innerHTML = `
        <div class="alert-banner-content">
          <span class="alert-banner-title">CRITICAL ALERT</span>
          <span id="global-alert-msg">Hazard reported on Route 4. rerouting active convoys.</span>
        </div>
        <button class="btn btn-toggle" id="global-alert-ack-btn" onclick="toast.acknowledgeBanner()">Acknowledge</button>
      `;
      document.body.prepend(banner);
      this.bannerEl = banner;
    } else {
      this.bannerEl = document.getElementById('global-alert-banner');
    }

    // Create Toast Container
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
      this.toastContainerEl = container;
    } else {
      this.toastContainerEl = document.getElementById('toast-container');
    }
  }

  showBanner(message, id = null) {
    if (!this.bannerEl) this.initContainers();
    const msgEl = document.getElementById('global-alert-msg');
    if (msgEl) msgEl.innerText = message;
    this.bannerEl.classList.remove('hidden');
    this.activeBannerId = id;
  }

  acknowledgeBanner() {
    if (this.bannerEl) {
      this.bannerEl.classList.add('hidden');
      this.info('Alert acknowledged.');
    }
  }

  show(message, type = 'info', duration = 4000) {
    if (!this.toastContainerEl) this.initContainers();

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.innerHTML = `
      <span>${message}</span>
      <button style="background:none; border:none; color:inherit; cursor:pointer; font-size:16px;" onclick="this.parentElement.remove()">✕</button>
    `;

    this.toastContainerEl.appendChild(toastEl);

    if (duration > 0) {
      setTimeout(() => {
        if (toastEl.parentElement) toastEl.remove();
      }, duration);
    }
  }

  info(msg) { this.show(msg, 'info', 3000); }
  success(msg) { this.show(msg, 'success', 3500); }
  error(msg) { this.show(msg, 'error', 5000); }
}

window.toast = new ToastManager();
