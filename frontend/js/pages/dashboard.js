/* FRONTEND DASHBOARD PAGE CONTROLLER — WAREHOUSE MANAGER DECISION CENTER */
import { Navbar } from '../navbar.js';
import { Auth, ROLES } from '../auth.js';
import { ApiService, API_STATUS } from '../api.js';

document.addEventListener('DOMContentLoaded', async () => {
  Navbar.render('dashboard');
  const user = Auth.getUser();

  const titleEl = document.getElementById('dashboard-title');
  const subEl = document.getElementById('dashboard-subtitle');
  const container = document.getElementById('role-dashboard-container');

  if (titleEl) titleEl.textContent = 'Warehouse Manager Decision Center';
  if (subEl) subEl.innerHTML = `
    Regional Warehouse Alpha &bull; <span class="text-forest-700 font-bold">● FUNCTIONAL</span> &bull; 
    <span style="color:var(--slate-700);">3 critical supply requests &bull; 2 restricted routes &bull; 7 Supply Swap matches</span>
  `;

  if (container) {
    container.innerHTML = `
      <!-- KPI Decision Cards -->
      <div style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-sm);">
        <div class="card" onclick="window.location.href='supply-swap.html'" style="cursor:pointer; background:var(--white);">
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Transferable Inventory</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: var(--slate-900);">2,480 <span style="font-size:0.9rem; font-weight:normal;">units</span></div>
          <div class="text-xs" style="color:var(--forest-700); margin-top:2px;">● 87% Healthy Operational Status</div>
        </div>

        <div class="card" onclick="window.location.href='shelter-board.html'" style="cursor:pointer; background:var(--white);">
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Critical Requests</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: var(--slate-900);">03</div>
          <div class="text-xs" style="color:var(--slate-700); margin-top:2px;">⚡ &lt; 4h Time-to-Harm Remaining</div>
        </div>

        <div class="card" onclick="window.location.href='supply-swap.html'" style="cursor:pointer; background:var(--white);">
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Swap Opportunities</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: var(--forest-800);">07</div>
          <div class="text-xs" style="color:var(--slate-700); margin-top:2px;">Surplus matches ready for transfer</div>
        </div>

        <div class="card" onclick="window.location.href='convoy-dispatch.html'" style="cursor:pointer; background:var(--white);">
          <div class="text-xs font-bold uppercase" style="color:var(--slate-600);">Active Transfers</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: var(--slate-900);">04</div>
          <div class="text-xs" style="color:var(--slate-700); margin-top:2px;">En route to destination shelters</div>
        </div>
      </div>

      <!-- Priority Actions Section (Time-to-Harm Urgency) -->
      <div style="grid-column: 1 / -1;" class="card">
        <h2 style="font-size: 1.1rem; margin-bottom: var(--space-md);">🔥 Priority Decision Queue (Sorted by Time-to-Harm)</h2>
        
        <div style="display:flex; flex-direction:column; gap:var(--space-md);">
          <!-- Action Item 1 -->
          <div style="background:var(--bg-honeydew); border:1px solid var(--sage-500); border-radius:var(--radius); padding:var(--space-md); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-md);">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="priority-badge priority-badge--critical">⚡ CRITICAL &bull; 4 Hours Remaining</span>
                <span class="font-bold text-sm">Shelter 06 (East Valley Sector 4)</span>
              </div>
              <p style="margin:4px 0 0 0; font-size:0.9rem;" class="text-slate-800">
                Requires <strong>40 vials Refrigerated Insulin</strong>. Regional Warehouse Alpha has 200 transferable vials.
              </p>
              <div class="text-xs" style="color:var(--slate-700); margin-top:2px;">
                Route Feasibility: <strong>▲ CAUTION</strong> (Highway 1 Bypass cleared) &bull; Confidence: 92%
              </div>
            </div>
            <div>
              <a href="supply-swap.html" class="button button--primary text-xs">🔄 Review & Approve Supply Swap</a>
            </div>
          </div>

          <!-- Action Item 2 -->
          <div style="background:var(--white); border:1px solid var(--slate-300); border-radius:var(--radius); padding:var(--space-md); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-md);">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="priority-badge priority-badge--high">⚠️ ACTION REQUIRED &bull; 8 Hours Remaining</span>
                <span class="font-bold text-sm">Shelter 02 (Gymnasium)</span>
              </div>
              <p style="margin:4px 0 0 0; font-size:0.9rem;" class="text-slate-800">
                Requests <strong>15 units Whole Blood Bags (O-)</strong>. Transferable inventory ready.
              </p>
              <div class="text-xs" style="color:var(--slate-700); margin-top:2px;">
                Route Feasibility: <strong>✓ SAFE</strong> &bull; Confidence: 98%
              </div>
            </div>
            <div>
              <a href="supply-swap.html" class="button button--secondary text-xs">View Transfer Request</a>
            </div>
          </div>

          <!-- Action Item 3 -->
          <div style="background:var(--white); border:1px solid var(--slate-300); border-radius:var(--radius); padding:var(--space-md); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-md);">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="priority-badge priority-badge--medium">🛑 ROUTE HAZARD ALERT &bull; Convoy CV-014 Impacted</span>
                <span class="font-bold text-sm">Bridge B-14 Submerged in Sector 6</span>
              </div>
              <p style="margin:4px 0 0 0; font-size:0.9rem;" class="text-slate-800">
                Relief Convoy CV-014 carrying potable water rerouted via Feeder Corridor C (+38 min ETA delta).
              </p>
              <div class="text-xs" style="color:var(--slate-700); margin-top:2px;">
                Source: Field Report &bull; Verified by Control Room
              </div>
            </div>
            <div>
              <a href="live-map.html?convoy=CV-014" class="button button--secondary text-xs">🗺️ Track Impact on Live Map</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
});
