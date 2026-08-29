/* FRONTEND SETTINGS PAGE CONTROLLER (Phase 10 & Field Mode) */
import { Navbar } from '../navbar.js';
import { Offline } from '../offline.js';
import { Toast } from '../toast.js';

document.addEventListener('DOMContentLoaded', () => {
  Navbar.render('settings');

  const toggle = document.getElementById('toggle-field-mode');
  const langSelect = document.getElementById('select-language');
  const queueCount = document.getElementById('offline-queue-count');
  const syncBtn = document.getElementById('btn-force-sync');

  // Load field mode setting
  const isFieldMode = localStorage.getItem('disissta_field_mode') === 'true';
  toggle.checked = isFieldMode;
  if (isFieldMode) {
    document.body.classList.add('field-mode');
  }

  toggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    localStorage.setItem('disissta_field_mode', enabled);
    if (enabled) {
      document.body.classList.add('field-mode');
      Toast.show('Field Tablet Mode enabled (16px base font & 44px touch targets).', 'info');
    } else {
      document.body.classList.remove('field-mode');
      Toast.show('Standard Desktop Mode restored.', 'info');
    }
  });

  // Offline queue status
  const updateQueueDisplay = () => {
    const items = Offline.getQueuedReports();
    queueCount.textContent = `${items.length} Pending Local Reports`;
  };
  updateQueueDisplay();

  syncBtn.addEventListener('click', async () => {
    await Offline.syncQueuedReports();
    updateQueueDisplay();
  });
});
