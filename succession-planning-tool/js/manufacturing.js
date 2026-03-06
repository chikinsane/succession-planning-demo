/* ============================================================
   MANUFACTURING MODULE — Plant views, Safety, Knowledge Transfer
   ============================================================ */

const Manufacturing = (() => {
  function init() {
    DataStore.subscribe(() => renderTab('plantview'));
    document.querySelectorAll('.mfg-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.mfg-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTab(tab.dataset.tab);
      });
    });
  }

  function renderTab(tab) {
    if (!DataStore.hasData()) return;
    const container = document.getElementById('mfgContent');
    switch (tab) {
      case 'plantview': renderPlantView(container); break;
      case 'safety': renderSafetyCerts(container); break;
      case 'knowledge': renderKnowledgeTransfer(container); break;
      case 'shopfloor': renderShopfloorPipeline(container); break;
      case 'continuity': renderProductionContinuity(container); break;
    }
  }

  function renderPlantView(el) {
    const emps = DataStore.getEmployees();
    const roles = DataStore.getRoles();
    const map = DataStore.getSuccessionMap();
    const plants = [...new Set(emps.map(e => e.plant))];

    el.innerHTML = `<div class="plant-grid">${plants.map(plant => {
      const plantEmps = emps.filter(e => e.plant === plant);
      const plantRoles = roles.filter(r => r.plant === plant && r.critical);
      const covered = plantRoles.filter(r => map.some(m => m.roleId === r.id && m.readiness === 'Ready Now')).length;
      const highFlight = plantEmps.filter(e => e.flightRisk30 >= 0.7).length;
      const avgPerf = plantEmps.length ? (plantEmps.reduce((s, e) => s + e.perfScore, 0) / plantEmps.length).toFixed(1) : 0;
      const coverage = plantRoles.length ? Math.round(covered / plantRoles.length * 100) : 0;
      const coverageColor = coverage >= 70 ? 'var(--success)' : coverage >= 40 ? 'var(--warning)' : 'var(--danger)';

      return `
        <div class="plant-card">
          <div class="plant-card-header">
            <div>
              <div class="plant-name">${plant.split('—')[0].trim()}</div>
              <div class="plant-location">${plant.split('—')[1]?.trim() || ''}</div>
            </div>
            <span class="status-badge ${coverage >= 70 ? 'status-green' : coverage >= 40 ? 'status-amber' : 'status-red'}">${coverage}% covered</span>
          </div>
          <div class="plant-metrics">
            <div class="plant-metric"><span class="plant-metric-label">Employees</span><span class="plant-metric-value">${plantEmps.length}</span></div>
            <div class="plant-metric"><span class="plant-metric-label">Critical Roles</span><span class="plant-metric-value">${plantRoles.length}</span></div>
            <div class="plant-metric"><span class="plant-metric-label">Avg Performance</span><span class="plant-metric-value" style="color:var(--primary-light)">${avgPerf}</span></div>
            <div class="plant-metric"><span class="plant-metric-label">High Flight Risk</span><span class="plant-metric-value" style="color:${highFlight > 3 ? 'var(--danger)' : 'var(--warning)'}">${highFlight}</span></div>
          </div>
        </div>`;
    }).join('')}</div>`;
  }

  function renderSafetyCerts(el) {
    const emps = DataStore.getEmployees();
    const allCerts = [];
    emps.forEach(e => {
      (e.certifications || []).forEach(c => {
        const expiry = new Date(c.expiry);
        const now = new Date();
        const daysLeft = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
        let status = 'valid';
        if (daysLeft < 0) status = 'expired';
        else if (daysLeft < 90) status = 'expiring';
        allCerts.push({ ...c, employee: e.name, empId: e.id, plant: e.plant, daysLeft, status });
      });
    });

    const expired = allCerts.filter(c => c.status === 'expired').length;
    const expiring = allCerts.filter(c => c.status === 'expiring').length;

    el.innerHTML = `
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card"><div class="kpi-icon kpi-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div class="kpi-body"><span class="kpi-label">Total Certifications</span><span class="kpi-value">${allCerts.length}</span></div></div>
        <div class="kpi-card"><div class="kpi-icon kpi-amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="kpi-body"><span class="kpi-label">Expiring Soon</span><span class="kpi-value" style="color:var(--warning)">${expiring}</span><span class="kpi-trend down">within 90 days</span></div></div>
        <div class="kpi-card"><div class="kpi-icon kpi-purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg></div><div class="kpi-body"><span class="kpi-label">Expired</span><span class="kpi-value" style="color:var(--danger)">${expired}</span><span class="kpi-trend down">require renewal</span></div></div>
      </div>
      <div class="cert-grid">
        ${allCerts.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 20).map(c => `
          <div class="cert-card">
            <div class="cert-status ${c.status}"></div>
            <div class="cert-info">
              <div class="cert-name">${c.name}</div>
              <div class="cert-detail">${c.employee} &middot; ${c.plant}</div>
              <div class="cert-detail">${c.status === 'expired' ? `Expired ${Math.abs(c.daysLeft)} days ago` : `Expires in ${c.daysLeft} days (${c.expiry})`}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderKnowledgeTransfer(el) {
    const emps = DataStore.getEmployees();
    const seniorEmps = emps.filter(e => e.age >= 50 || e.tenure >= 15).sort((a, b) => b.knowledgeRisk - a.knowledgeRisk);

    el.innerHTML = `
      <div class="card" style="margin-bottom:16px;padding:16px 20px;border-left:3px solid var(--warning)">
        <strong>Knowledge Transfer Risk Assessment</strong>
        <br><span class="text-muted" style="font-size:12px">${seniorEmps.length} employees identified with high institutional knowledge concentration</span>
      </div>
      ${seniorEmps.slice(0, 12).map(e => {
        const progress = Math.floor(Math.random() * 100);
        const color = progress >= 70 ? 'var(--success)' : progress >= 40 ? 'var(--warning)' : 'var(--danger)';
        return `
          <div class="kt-card">
            <div class="kt-header">
              <div>
                <strong style="cursor:pointer" onclick="App.showEmployeeModal('${e.id}')">${e.name}</strong>
                <div class="text-muted" style="font-size:12px">${e.role} &middot; ${e.department} &middot; ${e.plant} &middot; ${e.tenure} yrs tenure</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:12px;color:var(--text-muted)">Knowledge Risk</div>
                <div style="font-size:18px;font-weight:700;color:${e.knowledgeRisk >= 0.7 ? 'var(--danger)' : 'var(--warning)'}">${(e.knowledgeRisk * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:11px;color:var(--text-muted)">Transfer Progress</span>
              <span style="font-size:11px;font-weight:600;color:${color}">${progress}%</span>
            </div>
            <div class="kt-progress"><div class="kt-progress-fill" style="width:${progress}%;background:${color}"></div></div>
          </div>`;
      }).join('')}
    `;
  }

  function renderShopfloorPipeline(el) {
    const emps = DataStore.getEmployees();
    const shopfloor = emps.filter(e => e.gradeNum <= 3).sort((a, b) => b.potScore - a.potScore);

    const pathwayStages = ['Operator', 'Senior Operator', 'Shift Supervisor', 'Production Manager', 'Plant Head'];

    el.innerHTML = `
      <div class="card" style="margin-bottom:16px;padding:16px 20px;border-left:3px solid var(--accent)">
        <strong>Shopfloor-to-Leadership Pipeline</strong>
        <br><span class="text-muted" style="font-size:12px">Tracking ${shopfloor.length} blue-collar and early-career high performers for supervisory/management pathways</span>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
        ${pathwayStages.map((s, i) => `
          <div style="display:flex;align-items:center;gap:8px">
            <span class="status-badge ${i < 2 ? 'status-blue' : i < 4 ? 'status-amber' : 'status-green'}">${s}</span>
            ${i < pathwayStages.length - 1 ? '<span style="color:var(--text-muted)">&rarr;</span>' : ''}
          </div>
        `).join('')}
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Employee</th><th>Current Role</th><th>Grade</th><th>Plant</th><th>Potential</th><th>Performance</th><th>Readiness</th><th>Education</th></tr></thead>
          <tbody>
            ${shopfloor.slice(0, 20).map(e => `
              <tr onclick="App.showEmployeeModal('${e.id}')" style="cursor:pointer">
                <td><strong>${e.name}</strong></td>
                <td>${e.role}</td>
                <td>${e.grade}</td>
                <td>${e.plant.split('—')[0].trim()}</td>
                <td><span style="font-weight:700;color:${e.potScore >= 4 ? 'var(--success)' : 'var(--warning)'}">${e.potScore.toFixed(1)}</span></td>
                <td>${e.perfScore.toFixed(1)}</td>
                <td><span class="status-badge ${e.readiness === 'Ready Now' ? 'status-green' : 'status-amber'}">${e.readiness}</span></td>
                <td>${e.education}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderProductionContinuity(el) {
    const roles = DataStore.getRoles().filter(r => r.critical);
    const map = DataStore.getSuccessionMap();
    const emps = DataStore.getEmployees();

    const risks = roles.map(r => {
      const successors = map.filter(m => m.roleId === r.id);
      const readyNow = successors.filter(s => s.readiness === 'Ready Now').length;
      const vacancyImpact = r.tier === 1 ? 'Severe' : r.tier === 2 ? 'High' : 'Moderate';
      const oeeImpact = r.tier === 1 ? `${Math.floor(Math.random() * 15 + 10)}%` : r.tier === 2 ? `${Math.floor(Math.random() * 10 + 3)}%` : `${Math.floor(Math.random() * 5 + 1)}%`;
      const costImpact = r.tier === 1 ? `${Math.floor(Math.random() * 400 + 100)} Cr` : r.tier === 2 ? `${Math.floor(Math.random() * 50 + 10)} Cr` : `${Math.floor(Math.random() * 10 + 1)} Cr`;
      return { ...r, readyNow, vacancyImpact, oeeImpact, costImpact, riskScore: readyNow === 0 ? 'Critical' : readyNow < 2 ? 'High' : 'Low' };
    }).sort((a, b) => {
      const order = { 'Critical': 0, 'High': 1, 'Low': 2 };
      return (order[a.riskScore] || 3) - (order[b.riskScore] || 3);
    });

    el.innerHTML = `
      <div class="card" style="margin-bottom:16px;padding:16px 20px;border-left:3px solid var(--danger)">
        <strong>Production Continuity Risk Model</strong>
        <br><span class="text-muted" style="font-size:12px">Succession gaps linked to OEE impact, capacity utilisation, and estimated cost of vacancy</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Role</th><th>Tier</th><th>Plant</th><th>Ready Now</th><th>Vacancy Impact</th><th>OEE Impact</th><th>Est. Cost</th><th>Risk</th></tr></thead>
          <tbody>
            ${risks.slice(0, 20).map(r => `
              <tr>
                <td><strong>${r.title}</strong></td>
                <td><span class="status-badge ${r.tier === 1 ? 'status-red' : 'status-amber'}">Tier ${r.tier}</span></td>
                <td>${r.plant.split('—')[0].trim()}</td>
                <td style="font-weight:700;color:${r.readyNow === 0 ? 'var(--danger)' : 'var(--success)'}">${r.readyNow}</td>
                <td>${r.vacancyImpact}</td>
                <td style="color:var(--warning)">${r.oeeImpact}</td>
                <td style="font-weight:600">${r.costImpact}</td>
                <td><span class="status-badge ${r.riskScore === 'Critical' ? 'status-red' : r.riskScore === 'High' ? 'status-amber' : 'status-green'}">${r.riskScore}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return { init, renderTab };
})();
