/* FRONTEND CENTRALIZED SOCKET.IO SERVICE (Phase 12) */

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
  }

  init() {
    if (typeof io !== 'undefined') {
      try {
        this.socket = io(window.location.origin, {
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000
        });

        this.socket.on('connect', () => {
          this.connected = true;
          this.emitLocal('connection:change', { online: true });
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
          this.emitLocal('connection:change', { online: false });
        });

        // Forward core socket events
        const events = [
          'road:update', 'bridge:update', 'shelter:update',
          'mission:update', 'hazard:new', 'alert:critical'
        ];

        events.forEach(evt => {
          this.socket.on(evt, (data) => this.emitLocal(evt, data));
        });
      } catch (e) {
        console.warn('Socket.io initialization skipped or failed:', e);
      }
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emitLocal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }
}

export const Socket = new SocketService();
