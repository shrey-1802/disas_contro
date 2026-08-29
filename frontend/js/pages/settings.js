/* Settings Page Controller */

document.addEventListener('DOMContentLoaded', () => {
  // Load DOM elements
  const usernameInput = document.getElementById('setting-username');
  const roleSelect = document.getElementById('setting-role');
  const fieldModeToggle = document.getElementById('setting-field-mode');
  const simulateOfflineToggle = document.getElementById('setting-offline-simulate');
  const languageSelect = document.getElementById('setting-language');
  const fontScaleSelect = document.getElementById('setting-font-scale');
  
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const syncNowBtn = document.getElementById('sync-now-btn');
  const pendingActionsCount = document.getElementById('pending-actions-count');

  // Load initial states from localStorage
  if (usernameInput) usernameInput.value = localStorage.getItem('username') || 'John Doe';
  if (roleSelect) roleSelect.value = localStorage.getItem('user-role') || 'control_room';
  if (fieldModeToggle) fieldModeToggle.checked = localStorage.getItem('field-mode') === 'true';
  if (simulateOfflineToggle) simulateOfflineToggle.checked = localStorage.getItem('simulated-offline') === 'true';
  if (languageSelect) languageSelect.value = localStorage.getItem('language') || 'en';
  if (fontScaleSelect) fontScaleSelect.value = localStorage.getItem('font-scale') || 'standard';

  // Load initial IndexedDB pending queue stats
  if (window.SyncManager) {
    window.SyncManager.getCount().then(count => {
      if (pendingActionsCount) {
        pendingActionsCount.textContent = count;
      }
    });
  }

  // Trigger initial degradation warning banner if initially offline
  if (localStorage.getItem('simulated-offline') === 'true') {
    if (window.APIClient) {
      window.APIClient.triggerDegradedState('offline');
    }
  }

  // Apply saved font scale
  applyFontScale(localStorage.getItem('font-scale') || 'standard');

  // --- INTERACTION EVENT LISTENERS ---

  // Role Select Change (Instant updates)
  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      localStorage.setItem('user-role', roleSelect.value);
      // Refresh Navbar dynamically
      if (window.NavbarEngine) {
        window.NavbarEngine.refresh();
      }
      
      // Update role label in header if present
      const headerUserLabel = document.getElementById('header-user-role');
      if (headerUserLabel) {
        headerUserLabel.textContent = formatRole(roleSelect.value);
      }
      
      showToast(`User role switched to ${formatRole(roleSelect.value)}`);
    });
  }

  // Field Mode Toggle (Instant update & class trigger)
  if (fieldModeToggle) {
    fieldModeToggle.addEventListener('change', () => {
      const isEnabled = fieldModeToggle.checked;
      localStorage.setItem('field-mode', isEnabled ? 'true' : 'false');
      
      if (isEnabled) {
        document.body.classList.add('field-mode');
        showToast('Field Mode Enabled. Contrast and text size increased for outdoor/tablet use.');
      } else {
        document.body.classList.remove('field-mode');
        showToast('Field Mode Disabled.');
      }
    });
  }

  // Offline Simulation Toggle (Instant status bar change)
  if (simulateOfflineToggle) {
    simulateOfflineToggle.addEventListener('change', () => {
      const isSimulated = simulateOfflineToggle.checked;
      localStorage.setItem('simulated-offline', isSimulated ? 'true' : 'false');
      
      if (window.NavbarEngine) {
        window.NavbarEngine.updateConnectivity();
      }
      
      if (isSimulated) {
        if (window.APIClient) {
          window.APIClient.triggerDegradedState('offline');
        }
        if (window.SocketClient) {
          window.SocketClient.disconnect();
        }
        showToast('Simulated Offline Mode Active. Local edits will queue for sync.');
      } else {
        if (window.APIClient) {
          window.APIClient.clearDegradedState();
        }
        if (window.SocketClient) {
          window.SocketClient.connect();
        }
        showToast('Simulated Online Mode Restored.');
        // Auto trigger sync on reconnecting
        if (window.SyncManager) {
          window.SyncManager.process();
        }
      }
    });
  }

  // Font Scale Change (Instant layout resize)
  if (fontScaleSelect) {
    fontScaleSelect.addEventListener('change', () => {
      const scaleValue = fontScaleSelect.value;
      localStorage.setItem('font-scale', scaleValue);
      applyFontScale(scaleValue);
      showToast(`Text scale updated to: ${scaleValue}`);
    });
  }

  // Save Profile Details via APIClient request
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const username = usernameInput ? usernameInput.value : 'John Doe';
      
      if (window.APIClient) {
        try {
          const res = await window.APIClient.request('/profile', 'POST', { username });
          
          if (res && res.status === 'queued') {
            showToast('Saved locally. Action queued for synchronization.');
          } else {
            // Update UI headers on successful online transmit
            const headerUsername = document.getElementById('header-username');
            if (headerUsername) headerUsername.textContent = username;
            localStorage.setItem('username', username);
            showToast('Profile settings saved successfully.');
          }
        } catch (err) {
          showToast('Failed to save profile: ' + err.message, true);
        }
      }
      
      if (languageSelect) {
        localStorage.setItem('language', languageSelect.value);
      }
    });
  }

  // Sync Now Manual Action using SyncManager process
  if (syncNowBtn) {
    syncNowBtn.addEventListener('click', () => {
      const simulatedOffline = localStorage.getItem('simulated-offline') === 'true';
      if (simulatedOffline) {
        showToast('Cannot sync. Connection is currently simulated offline.', true);
        return;
      }
      if (window.SyncManager) {
        window.SyncManager.process();
      }
    });
  }

  // Button to trigger manual simulated live socket event
  const triggerMockBtn = document.getElementById('trigger-mock-event-btn');
  if (triggerMockBtn) {
    triggerMockBtn.addEventListener('click', () => {
      const simulatedOffline = localStorage.getItem('simulated-offline') === 'true';
      if (simulatedOffline) {
        showToast('Cannot trigger live socket events while offline.', true);
        return;
      }
      if (window.SocketClient) {
        window.SocketClient.triggerRandomMockEvent();
      }
    });
  }

  // --- REAL-TIME SOCKET TOPIC SUBSCRIPTIONS ---
  if (window.SocketClient) {
    // 1. Listen for new alerts
    window.SocketClient.subscribe('alert:new', (data) => {
      showToast(`[Alert] ${data.title}: ${data.description}`);
      
      // Update global critical banner text dynamically if critical
      const globalBanner = document.getElementById('global-critical-banner');
      if (globalBanner) {
        const bannerSpan = globalBanner.querySelector('.critical-banner-content span');
        if (bannerSpan) {
          bannerSpan.textContent = `CRITICAL: ${data.title} — ${data.description}`;
        }
        globalBanner.style.display = 'flex';
      }
    });

    // 2. Listen for road closure updates
    window.SocketClient.subscribe('road:update', (data) => {
      showToast(`[Road Update] ${data.name}: ${data.message}`);
    });

    // 3. Listen for bridge hazard updates
    window.SocketClient.subscribe('bridge:update', (data) => {
      showToast(`[Bridge Warning] Bridge ${data.bridgeId}: ${data.message}`);
    });

    // 4. Listen for shelter demand updates
    window.SocketClient.subscribe('shelter:demand_update', (data) => {
      showToast(`[Shelter Alert] ${data.shelterId} capacity: ${data.population} people, ${data.daysOfSupply} days remaining.`);
    });
  }

  // Listen for IndexedDB sync update events to refresh page stats
  window.addEventListener('sync-updated', (event) => {
    if (pendingActionsCount) {
      pendingActionsCount.textContent = event.detail.pendingCount;
    }
  });

  // Listen for sync status shifts to animate the synchronization controls
  window.addEventListener('sync-status-change', (event) => {
    const isSyncing = event.detail.status === 'syncing';
    if (syncNowBtn) {
      if (isSyncing) {
        syncNowBtn.disabled = true;
        syncNowBtn.innerHTML = `
          <svg class="animate-spin" style="animation: pulse 1s infinite alternate;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          <span>Syncing Queue...</span>
        `;
      } else {
        syncNowBtn.disabled = false;
        syncNowBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          <span>Sync Now</span>
        `;
        
        // Success feedback
        const now = new Date();
        localStorage.setItem('last-sync-timestamp', now.toISOString());
        if (window.NavbarEngine) {
          window.NavbarEngine.updateConnectivity();
        }
        showToast('Synchronization task completed.');
      }
    }
  });
});

/**
 * Formats machine role name to reader-friendly title
 */
function formatRole(role) {
  switch (role) {
    case 'control_room': return 'Control Room Operator';
    case 'district_admin': return 'District Admin';
    case 'field_driver': return 'Field Driver';
    default: return role;
  }
}

/**
 * Applies global CSS font scale based on accessibility preferences
 */
function applyFontScale(scale) {
  let rootSize;
  switch (scale) {
    case 'small':
      rootSize = '12px';
      break;
    case 'large':
      rootSize = '16px';
      break;
    case 'xlarge':
      rootSize = '18px';
      break;
    case 'standard':
    default:
      rootSize = '14px';
      break;
  }
  document.documentElement.style.fontSize = rootSize;
}

/**
 * Shows temporary confirmation toast alerts
 */
function showToast(message, isError = false) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const icon = isError 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EDF3E0" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    : `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    
  toast.innerHTML = `
    ${icon}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove toast after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
