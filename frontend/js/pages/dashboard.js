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
  const [convoysRes, sheltersRes, reportsRes] = await Promise.all([
    ApiService.getMissions(),
    ApiService.getShelters(),
    ApiService.getReports()
  ]);

  if (convoysRes.status === API_STATUS.SUCCESS && document.getElementById('cnt-convoys')) {
    document.getElementById('cnt-convoys').textContent = convoysRes.data.length;
  }
  if (sheltersRes.status === API_STATUS.SUCCESS && document.getElementById('cnt-shelters')) {
    const criticalCount = sheltersRes.data.filter(s => s.daysOfSupply <= 2).length;
    document.getElementById('cnt-shelters').textContent = `${criticalCount} / ${sheltersRes.data.length}`;
  }
  if (reportsRes.status === API_STATUS.SUCCESS && document.getElementById('cnt-hazards')) {
    document.getElementById('cnt-hazards').textContent = reportsRes.data.length;
  }
});
