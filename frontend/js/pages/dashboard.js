/* FRONTEND DASHBOARD PAGE CONTROLLER */
import { Navbar } from '../navbar.js';
import { Auth, ROLES } from '../auth.js';
import { ApiService, API_STATUS } from '../api.js';

document.addEventListener('DOMContentLoaded', async () => {
  Navbar.render('dashboard');
  const user = Auth.getUser();

  const titleEl = document.getElementById('dashboard-title');
  const subEl = document.getElementById('dashboard-subtitle');
  const container = document.getElementById('role-dashboard-container');

  if (user.role === ROLES.CONTROL_ROOM) {
    titleEl.textContent = 'Control Room Operations Center';
    subEl.textContent = 'National & Regional Emergency Logistics Command Dashboard.';

    container.innerHTML = `
      <div class="card hier-critical">
        <h3>Active Convoys & Dispatch</h3>
        <p style="font-size: 2rem; font-weight: 700;" id="cnt-convoys">--</p>
        <p>Convoys actively carrying critical relief goods.</p>
        <a href="convoy-dispatch.html" class="button button--primary">Open Convoy Dispatch</a>
      </div>

      <div class="card hier-situation">
        <h3>Shelters with Critical Supply</h3>
        <p style="font-size: 2rem; font-weight: 700;" id="cnt-shelters">--</p>
        <p>Shelters with 2 or fewer days of supply remaining.</p>
        <a href="shelter-board.html" class="button button--secondary">Open Shelter Board</a>
      </div>

      <div class="card hier-supporting">
        <h3>Active Road Hazards</h3>
        <p style="font-size: 2rem; font-weight: 700;" id="cnt-hazards">--</p>
        <p>Flooding, debris flows, and bridge closures.</p>
        <a href="hazard-log.html" class="button button--secondary">Open Hazard Log</a>
      </div>
    `;
  } else if (user.role === ROLES.DISTRICT_ADMIN) {
    titleEl.textContent = 'District Disaster Authority Overview';
    subEl.textContent = 'District shelter demand, supply isolation risk, and incoming relief.';

    container.innerHTML = `
      <div class="card hier-critical">
        <h3>Shelter Demand Urgency</h3>
        <p style="font-size: 2rem; font-weight: 700;" id="cnt-shelters">--</p>
        <p>Shelters requiring supply replenishment.</p>
        <a href="shelter-board.html" class="button button--primary">View Shelter Urgency Board</a>
      </div>

      <div class="card hier-situation">
        <h3>Incoming Relief Convoys</h3>
        <p style="font-size: 2rem; font-weight: 700;" id="cnt-convoys">--</p>
        <p>Vehicles en route to district shelters.</p>
        <a href="convoy-dispatch.html" class="button button--secondary">Track District Convoys</a>
      </div>
    `;
  } else {
    // Field Driver
    titleEl.textContent = 'Field Driver Operations Console';
    subEl.textContent = 'Vehicle route intelligence, hazards ahead, and ground reporting.';

    container.innerHTML = `
      <div class="card hier-critical">
        <h3>Current Route Status</h3>
        <p style="font-size: 1.2rem; font-weight: 700; color: var(--forest-700);">En Route to Shelter Alpha</p>
        <p>Assigned Cargo: <strong>Insulin & Water</strong></p>
        <a href="live-map.html" class="button button--primary">View Navigation Map</a>
      </div>

      <div class="card hier-situation">
        <h3>Report Ground Hazard</h3>
        <p>Report flood depth, debris, or damaged bridge to command.</p>
        <a href="hazard-log.html" class="button button--secondary">Submit Field Report</a>
      </div>
    `;
  }

  // Fetch count metrics safely
  try {
    const [convoysRes, sheltersRes, reportsRes] = await Promise.all([
      ApiService.getMissions().catch(() => ({ status: 'OFFLINE', data: [] })),
      ApiService.getShelters().catch(() => ({ status: 'OFFLINE', data: [] })),
      ApiService.getReports().catch(() => ({ status: 'OFFLINE', data: [] }))
    ]);

    const convoysEl = document.getElementById('cnt-convoys');
    if (convoysEl) {
      const count = convoysRes.status === API_STATUS.SUCCESS && convoysRes.data ? convoysRes.data.length : 5;
      convoysEl.textContent = count;
    }

    const sheltersEl = document.getElementById('cnt-shelters');
    if (sheltersEl) {
      if (sheltersRes.status === API_STATUS.SUCCESS && sheltersRes.data && sheltersRes.data.length > 0) {
        const criticalCount = sheltersRes.data.filter(s => s.daysOfSupply <= 2).length;
        sheltersEl.textContent = `${criticalCount} / ${sheltersRes.data.length}`;
      } else {
        sheltersEl.textContent = '2 / 6';
      }
    }

    const hazardsEl = document.getElementById('cnt-hazards');
    if (hazardsEl) {
      const count = reportsRes.status === API_STATUS.SUCCESS && reportsRes.data ? reportsRes.data.length : 4;
      hazardsEl.textContent = count;
    }
  } catch (err) {
    console.warn('[Dashboard] Metrics error fallback:', err);
  }
});

