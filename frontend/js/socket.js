/* ==========================================
   DISISTA CONTROL — REAL-TIME EVENT BUS (SOCKET.IO CLIENT SIMULATOR)
   Simulates WebSocket connection and event handling across all pages
   ========================================== */

class SocketClient {
  constructor() {
    this.connected = true;
    this.listeners = {};
    this.initGlobalChannel();
  }

  initGlobalChannel() {
    // Inter-tab / window broadcast channel using BroadcastChannel API
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('disista_socket_events');
      this.channel.onmessage = (event) => {
        const { eventName, payload } = event.data;
        this.triggerLocal(eventName, payload);
      };
    }
  }

  on(eventName, handler) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(handler);
  }

  off(eventName, handler) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(h => h !== handler);
    }
  }

  emit(eventName, payload) {
    // Trigger local handlers
    this.triggerLocal(eventName, payload);

    // Broadcast across windows/tabs
    if (this.channel) {
      this.channel.postMessage({ eventName, payload });
    }

    // Handle global side effects (such as alerts banner)
    this.handleGlobalEventSideEffects(eventName, payload);
  }

  triggerLocal(eventName, payload) {
    const handlers = this.listeners[eventName] || [];
    handlers.forEach(h => {
      try {
        h(payload);
      } catch (err) {
        console.error(`[Socket] Error in listener for ${eventName}:`, err);
      }
    });
  }

  handleGlobalEventSideEffects(eventName, payload) {
    if (eventName === 'route:recalculated') {
      if (window.toast) {
        window.toast.info('⚡ ROUTE RECALCULATED: Cost graph updated with hazard penalty.');
      }
    } else if (eventName === 'alert:new') {
      if (window.toast && payload && payload.title) {
        window.toast.showBanner(payload.title, payload.id);
      }
    } else if (eventName === 'transfer:status_update') {
      if (window.toast && payload && payload.cargo) {
        window.toast.info(`📦 Supply Transfer ${payload.id} updated: ${payload.cargo}`);
      }
    }
  }
}

window.socket = new SocketClient();
