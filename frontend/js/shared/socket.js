/* Centralized Socket.io client wrapper */

class SocketClient {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.status = 'disconnected'; // 'connected', 'disconnected', 'reconnecting'
    this.isSimulated = false;
    this.mockInterval = null;
  }

  /**
   * Initializes the socket connection
   */
  connect() {
    const simulatedOffline = localStorage.getItem('simulated-offline') === 'true';
    
    // Clean up any existing connection
    this.disconnect();

    if (simulatedOffline) {
      this.initMockConnection();
      return;
    }

    // Try to load Socket.io client library
    if (typeof io !== 'undefined') {
      try {
        console.log('Centralized Socket: Initializing real Socket.io connection.');
        this.socket = io({
          autoConnect: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000
        });
        this.isSimulated = false;
        this.registerRealSocketEvents();
      } catch (err) {
        console.warn('Real Socket.io initialization failed, falling back to simulator:', err);
        this.initMockConnection();
      }
    } else {
      console.log('Centralized Socket: io library not found. Falling back to WebSocket simulator.');
      this.initMockConnection();
    }
  }

  /**
   * Disconnects the socket
   */
  disconnect() {
    if (this.socket) {
      if (typeof this.socket.disconnect === 'function') {
        this.socket.disconnect();
      }
      this.socket = null;
    }
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    this.updateStatus('disconnected');
  }

  /**
   * Registers listeners for standard Socket.io events
   */
  registerRealSocketEvents() {
    this.socket.on('connect', () => {
      this.updateStatus('connected');
    });

    this.socket.on('disconnect', () => {
      this.updateStatus('disconnected');
    });

    this.socket.on('reconnect_attempt', () => {
      this.updateStatus('reconnecting');
    });

    this.socket.on('error', (err) => {
      console.error('Socket connection error:', err);
      this.updateStatus('disconnected');
    });

    // Map common event types to our internal dispatcher
    const events = [
      'mission:risk_update',
      'shelter:demand_update',
      'alert:new',
      'road:update',
      'bridge:update',
      'vehicle:update',
      'report:update'
    ];

    events.forEach(event => {
      this.socket.on(event, (data) => {
        this.dispatchEvent(event, data);
      });
    });
  }

  /**
   * Initializes a mock connection simulator for testing in offline/static environments
   */
  initMockConnection() {
    this.isSimulated = true;
    console.log('Centralized Socket: Simulated socket loop started.');
    
    // Simulate connection lag
    this.updateStatus('reconnecting');
    
    setTimeout(() => {
      const simulatedOffline = localStorage.getItem('simulated-offline') === 'true';
      if (simulatedOffline) {
        this.updateStatus('disconnected');
        return;
      }
      
      this.updateStatus('connected');
      
      // Setup periodic event simulator (pushes a random event every 40 seconds)
      this.mockInterval = setInterval(() => {
        this.triggerRandomMockEvent();
      }, 40000);
      
    }, 1000);
  }

  /**
   * Subscribes a callback to an event topic
   */
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    console.log(`Socket: Subscribed listener to [${event}]`);
  }

  /**
   * Unsubscribes a callback from an event topic
   */
  unsubscribe(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    console.log(`Socket: Unsubscribed listener from [${event}]`);
  }

  /**
   * Emits/dispatches local events to subscribers
   */
  dispatchEvent(event, data) {
    if (!this.listeners[event]) return;
    console.log(`Socket: Dispatching event [${event}] to subscribers:`, data);
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in socket event [${event}] callback:`, err);
      }
    });
  }

  /**
   * Updates global connection status
   */
  updateStatus(newStatus) {
    this.status = newStatus;
    localStorage.setItem('socket-status', newStatus);
    
    // Dispatch a global event so layout shell UI elements (navbar, header stats) update
    window.dispatchEvent(new CustomEvent('socket-status-change', {
      detail: { status: newStatus }
    }));
  }

  /**
   * Triggers a specific mock event manually (useful for validation testing)
   */
  triggerMockEvent(event, data) {
    console.log(`Socket: Injecting mock live event [${event}]`);
    this.dispatchEvent(event, data);
  }

  /**
   * Generates a random simulated emergency operations update
   */
  triggerRandomMockEvent() {
    const events = ['road:update', 'bridge:update', 'alert:new', 'shelter:demand_update'];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    let mockData = {};
    const sectors = ['Sector 2', 'Sector 4', 'Sector 6', 'Sector 7'];
    const sector = sectors[Math.floor(Math.random() * sectors.length)];

    switch (randomEvent) {
      case 'road:update':
        mockData = {
          roadId: 'R-104',
          name: 'Highway 4 Northbound',
          status: 'degraded',
          message: `${sector} minor flooding detected. Speed limits restricted.`
        };
        break;
      case 'bridge:update':
        mockData = {
          bridgeId: 'B-14',
          status: 'hazardous',
          message: `Bridge B-14 in ${sector} marked structural danger!`
        };
        break;
      case 'alert:new':
        mockData = {
          id: 'alt_' + Date.now().toString().slice(-4),
          title: 'River Tributary Overflow',
          description: `Water levels risen to 1.1m in ${sector}. Clear detour advised.`,
          severity: 'warning',
          timestamp: new Date().toISOString()
        };
        break;
      case 'shelter:demand_update':
        mockData = {
          shelterId: 'Shelter-07',
          population: 1420,
          daysOfSupply: 1.8,
          urgency: 'caution'
        };
        break;
    }

    this.dispatchEvent(randomEvent, mockData);
    
    // Trigger custom notifications for mock events in system logs
    window.dispatchEvent(new CustomEvent('live-socket-log', {
      detail: { event: randomEvent, data: mockData }
    }));
  }
}

// Instantiate globally
window.SocketClient = new SocketClient();

// Connect immediately on script load
window.addEventListener('load', () => {
  window.SocketClient.connect();
});
