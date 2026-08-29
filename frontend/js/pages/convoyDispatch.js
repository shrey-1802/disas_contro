/* FRONTEND CONVOY DISPATCH PAGE CONTROLLER (Phase 6 & Phase 21/22/24) */
import { Navbar } from '../navbar.js';
import { ApiService, API_STATUS } from '../api.js';
import { createStatusBadge } from '../statusBadge.js';
import { escapeHTML } from '../utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  Navbar.render('convoy-dispatch');

  const tbody = document.getElementById('missions-table-body');
  const searchInput = document.getElementById('dispatch-search');
  const priorityFilter = document.getElementById('priority-filter');

  const mockMissions = [
    { id: 'convoy-14', cargoType: 'Insulin & Blood Bags', priority: 'Critical', originHub: 'Main Central Depot', destinationShelter: 'Shelter Alpha (Stadium)', status: 'Rerouted', eta: '45 mins', driverName: 'Capt. Sharma', driverPhone: 'Ch. 9 (462.6375 MHz)', oldPathName: 'Arterial Highway 1', newPathName: 'Detour via Feeder B-4' },
    { id: 'convoy-08', cargoType: 'Potable Water Containers', priority: 'Medium', originHub: 'River Supply Depot', destinationShelter: 'Shelter Beta (School)', status: 'On Route', eta: '15 mins', driverName: 'Driver Singh', driverPhone: 'Ch. 4 (462.5625 MHz)', oldPathName: null, newPathName: 'Primary Corridor North' },
    { id: 'convoy-22', cargoType: 'Infant Nutrition Formula', priority: 'High', originHub: 'East Airfield', destinationShelter: 'Shelter Gamma (Gym)', status: 'Stranded', eta: 'DELAYED', driverName: 'Driver Patel', driverPhone: 'Ch. 11 (462.6875 MHz)', oldPathName: 'Bridge 4 Crossing', newPathName: 'Submerged Link (Blocked)' }
  ];

  // Priority sorting rank: Insulin/Blood (Critical) > Infant Nutrition (High) > Water (Medium) > General (Low)
  const priorityRank = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };

  function renderTable(missions) {
    if (!missions || missions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px;">No convoy dispatch missions found matching criteria.</td></tr>`;
      return;
    }

    // Sort by priority rank
    const sorted = [...missions].sort((a, b) => (priorityRank[a.priority] || 99) - (priorityRank[b.priority] || 99));

    tbody.innerHTML = sorted.map(mission => {
      const badge = createStatusBadge(mission.status);
      const isRerouted = mission.status === 'Rerouted' || mission.oldPathName;

      return `
        <tr>
          <td><input type="checkbox" class="convoy-select-checkbox" value="${escapeHTML(mission.id)}"></td>
          <td><strong>${escapeHTML(mission.id)}</strong></td>
          <td>
            <span class="priority-chip priority-chip--${String(mission.priority).toLowerCase()}">
              ${escapeHTML(mission.priority)}
            </span>
            <div style="font-size: 0.85rem; color: var(--slate-700);">${escapeHTML(mission.cargoType)}</div>
          </td>
          <td>${escapeHTML(mission.originHub)}</td>
          <td>${escapeHTML(mission.destinationShelter)}</td>
          <td>${badge.outerHTML}</td>
          <td><strong>${escapeHTML(mission.eta)}</strong></td>
          <td>
            <div><strong>${escapeHTML(mission.driverName)}</strong></div>
            <div style="font-size: 0.8rem; color: var(--slate-600);">${escapeHTML(mission.driverPhone)}</div>
          </td>
          <td>
            ${isRerouted ? `
              <div class="route-diff">
                <span class="route-diff__old">${escapeHTML(mission.oldPathName || 'Original Route')}</span> → 
                <span class="route-diff__new">${escapeHTML(mission.newPathName || 'New Path')}</span>
              </div>
            ` : `<span style="color: var(--slate-600); font-size: 0.85rem;">Standard Path</span>`}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Fetch API data with fallback
  const res = await ApiService.getMissions();
  let allMissions = (res.status === API_STATUS.SUCCESS && res.data.length) ? res.data : mockMissions;

  renderTable(allMissions);

  // Filters
  function applyFilters() {
    const q = searchInput.value.toLowerCase();
    const p = priorityFilter.value;

    const filtered = allMissions.filter(m => {
      const matchQ = m.id.toLowerCase().includes(q) || m.cargoType.toLowerCase().includes(q) || m.driverName.toLowerCase().includes(q);
      const matchP = p === 'ALL' || m.priority === p;
      return matchQ && matchP;
    });
    renderTable(filtered);
  }

  searchInput.addEventListener('input', applyFilters);
  priorityFilter.addEventListener('change', applyFilters);
});
