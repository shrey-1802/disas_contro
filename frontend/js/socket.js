/**
 * Socket.io Real-Time Event Centralized Module
 * Relief Supply Chain Resilience & Rerouting System
 */

import { toast } from './toast.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.init();
  }

  init() {
    if (typeof io !== 'undefined') {
      try {
        this.socket = io();

        this.socket.on('connect', () => {
          console.log('[Socket] Connected to real-time stream:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
          console.warn('[Socket] Disconnected from real-time stream');
        });

        this.socket.on('road_update', (data) => this.emit('road_update', data));
        this.socket.on('bridge_update', (data) => this.emit('bridge_update', data));
        this.socket.on('mission_update', (data) => this.emit('mission_update', data));
        this.socket.on('shelter_update', (data) => this.emit('shelter_update', data));
        this.socket.on('alert_update', (data) => {
          this.emit('alert_update', data);
          toast.show(`Emergency Alert: ${data.message || 'New operational update'}`, 'critical');
        });
      } catch (err) {
        console.warn('[Socket] Socket.io client failed initialization:', err.message);
      }
    } else {
      console.warn('[Socket] io global library not available');
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try { cb(data); } catch (e) { console.error(`Error in event listener [${event}]:`, e); }
      });
    }
  }

  // Simulation Helper for Testing Real-Time Stream Updates
  simulateEvent(event, data) {
    console.log(`[Socket Demo Stream] Simulating incoming ${event}:`, data);
    this.emit(event, data);
  }
}

export const socketService = new SocketService();
window.socketService = socketService;
