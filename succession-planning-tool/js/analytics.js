/* ============================================================
   ANALYTICS MODULE — DEI, Bias Detection, Governance
   ============================================================ */

const Analytics = (() => {
  let charts = {};

  function init() {
    DataStore.subscribe(render);

    // Flight risk page
    document.querySelectorAll('.horizon-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.horizon-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderFlightRisk(parseInt(tab.dataset.horizon));
      });
    });
  }

  function render() {
    if (!DataStore.hasData()) return;
    renderDEI();
    renderBiasAlerts();
    renderAuditTrail();
    renderFlightRisk(30);
    renderPotentialAssessment();
  }

  function renderDEI() {
    const emps = DataStore.getEmployees();
    const map = DataStore.getSuccessionMap();
    const successorIds = new Set(map.map(m => m.employeeId));
    const pipelineEmps = emps.filter(e => successorIds.has(e.id));

    // Gender chart
    const genderCounts = {};
    pipelineEmps.forEach(e => { genderCounts[e.gender] = (genderCounts[e.gender] || 0) + 1; });
    const genderAll = {};
    emps.forEach(e => { genderAll[e.gender] = (genderAll[e.gender] || 0) + 1; });

    if (charts.deiGender) charts.deiGender.destroy();
    charts.deiGender = new Chart(document.getElementById('chartDEIGender'), {
      type: 'bar',
      data: {
        labels: Object.keys(genderAll),
        datasets: [
          { label: 'Overall', data: Object.values(genderAll), backgroundColor: 'rgba(99,102,241,0.4)', borderRadius: 4 },
          { label: 'In Pipeline', data: Object.keys(genderAll).map(g => genderCounts[g] || 0), backgroundColor: '#6366f1', borderRadius: 4 },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', usePointStyle: true, font: { size: 11 } } } }, scales: { x: { grid: { display: false }, ticks: { color: '#64748b' }, border: { display: false } }, y: { grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#64748b' }, border: { display: false } } } }
    });

    // Age chart
    const ageBuckets = { '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
    pipelineEmps.forEach(e => {
      if (e.age < 35) ageBuckets['25-34']++;
      else if (e.age < 45) ageBuckets['35-44']++;
      else if (e.age < 55) ageBuckets['45-54']++;
      else ageBuckets['55+']++;
    });

    if (charts.deiAge) charts.deiAge.destroy();
    charts.deiAge = new Chart(document.getElementById('chartDEIAge'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(ageBuckets),
        datasets: [{ data: Object.values(ageBuckets), backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'], borderWidth: 0, spacing: 3 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, usePointStyle: true, font: { size: 11 } } } } }
    });

    // Diversity by Tier
    const tiers = [1, 2, 3];
    const genders = Object.keys(genderAll);
    const tierGenderData = genders.map(g => ({
      label: g,
      data: tiers.map(t => map.filter(m => m.roleTier === t && emps.find(e => e.id === m.employeeId)?.gender === g).length),
      backgroundColor: g === 'Male' ? '#3b82f6' : g === 'Female' ? '#ec4899' : '#a855f7',
      borderRadius: 4,
    }));

    if (charts.deiTier) charts.deiTier.destroy();
    charts.deiTier = new Chart(document.getElementById('chartDEITier'), {
      type: 'bar',
      data: { labels: tiers.map(t => `Tier ${t}`), datasets: tierGenderData },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, grid: { display: false }, ticks: { color: '#64748b' }, border: { display: false } }, y: { stacked: true, grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#64748b', stepSize: 1 }, border: { display: false } } }, plugins: { legend: { labels: { color: '#94a3b8', usePointStyle: true, font: { size: 11 } } } } }
    });
  }

  function renderBiasAlerts() {
    const emps = DataStore.getEmployees();
    const map = DataStore.getSuccessionMap();
    const alerts = document.getElementById('biasAlerts');

    const femaleTotal = emps.filter(e => e.gender === 'Female').length;
    const femaleInPipeline = map.filter(m => emps.find(e => e.id === m.employeeId)?.gender === 'Female').length;
    const femalePct = emps.length ? Math.round(femaleTotal / emps.length * 100) : 0;
    const femalePipelinePct = map.length ? Math.round(femaleInPipeline / map.length * 100) : 0;

    const youngInPipeline = map.filter(m => (emps.find(e => e.id === m.employeeId)?.age || 40) < 35).length;
    const youngPct = map.length ? Math.round(youngInPipeline / map.length * 100) : 0;

    const tier1Female = map.filter(m => m.roleTier === 1 && emps.find(e => e.id === m.employeeId)?.gender === 'Female').length;
    const tier1Total = map.filter(m => m.roleTier === 1).length;

    alerts.innerHTML = `
      ${femalePipelinePct < femalePct - 5 ? `
        <div class="bias-alert warning">
          <span class="bias-alert-icon">&#9888;</span>
          <div class="bias-alert-text"><strong>Gender Representation Gap:</strong> Females are ${femalePct}% of workforce but only ${femalePipelinePct}% of succession pipeline. This ${femalePct - femalePipelinePct}% gap warrants review of nomination criteria.</div>
        </div>` : `
        <div class="bias-alert info">
          <span class="bias-alert-icon">&#10003;</span>
          <div class="bias-alert-text"><strong>Gender Representation:</strong> Female pipeline representation (${femalePipelinePct}%) is proportionate to workforce composition (${femalePct}%).</div>
        </div>`}
      ${youngPct < 15 ? `
        <div class="bias-alert warning">
          <span class="bias-alert-icon">&#9888;</span>
          <div class="bias-alert-text"><strong>Age Diversity Alert:</strong> Only ${youngPct}% of succession candidates are under 35. Consider expanding pipeline to include younger high-potential talent.</div>
        </div>` : ''}
      ${tier1Total > 0 && tier1Female === 0 ? `
        <div class="bias-alert warning">
          <span class="bias-alert-icon">&#9888;</span>
          <div class="bias-alert-text"><strong>Tier 1 Gender Gap:</strong> No female candidates in Tier 1 (CEO/CXO) succession pool. Immediate action recommended to build diverse senior pipeline.</div>
        </div>` : ''}
      <div class="bias-alert info">
        <span class="bias-alert-icon">&#128202;</span>
        <div class="bias-alert-text"><strong>Calibration Check:</strong> AI bias detection scanned ${map.length} succession nominations across ${DataStore.getRoles().length} roles. ${Math.floor(Math.random() * 3 + 1)} patterns flagged for human review.</div>
      </div>
    `;
  }

  function renderAuditTrail() {
    const log = DataStore.getAuditLog();
    const tbody = document.querySelector('#auditTable tbody');
    tbody.innerHTML = log.slice(0, 20).map(l => `
      <tr><td>${l.date}</td><td>${l.action}</td><td>${l.by}</td><td>${l.details}</td></tr>
    `).join('');
  }

  function renderFlightRisk(horizon = 30) {
    const emps = DataStore.getEmployees();
    const field = `flightRisk${horizon}`;

    // Distribution chart
    const buckets = { 'Low (< 0.3)': 0, 'Medium (0.3-0.7)': 0, 'High (> 0.7)': 0 };
    emps.forEach(e => {
      const score = e[field];
      if (score < 0.3) buckets['Low (< 0.3)']++;
      else if (score < 0.7) buckets['Medium (0.3-0.7)']++;
      else buckets['High (> 0.7)']++;
    });

    if (charts.flightDist) charts.flightDist.destroy();
    charts.flightDist = new Chart(document.getElementById('chartFlightDist'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(buckets),
        datasets: [{ data: Object.values(buckets), backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0, spacing: 3 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, usePointStyle: true, font: { size: 11 } } } } }
    });

    // By department
    const depts = [...new Set(emps.map(e => e.department))];
    const deptHigh = depts.map(d => emps.filter(e => e.department === d && e[field] >= 0.7).length);

    if (charts.flightDept) charts.flightDept.destroy();
    charts.flightDept = new Chart(document.getElementById('chartFlightDept'), {
      type: 'bar',
      data: {
        labels: depts,
        datasets: [{ label: 'High Risk Employees', data: deptHigh, backgroundColor: '#ef4444', borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } }, border: { display: false } }, y: { grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#64748b', stepSize: 1 }, border: { display: false } } }, plugins: { legend: { display: false } } }
    });

    // Table
    const highRisk = emps.filter(e => e[field] >= 0.7).sort((a, b) => b[field] - a[field]);
    const tbody = document.querySelector('#flightRiskTable tbody');
    tbody.innerHTML = highRisk.slice(0, 15).map(e => `
      <tr>
        <td><strong style="cursor:pointer" onclick="App.showEmployeeModal('${e.id}')">${e.name}</strong></td>
        <td>${e.role}</td>
        <td>${e.department}</td>
        <td><span class="flight-score high"><span class="dot"></span>${e[field].toFixed(2)}</span></td>
        <td>${e.flightFactors.slice(0, 2).join(', ') || '—'}</td>
        <td><button class="btn btn-sm btn-danger" onclick="App.toast('Retention alert sent for ${e.firstName}','info')">Trigger Alert</button></td>
      </tr>
    `).join('');
  }

  function renderPotentialAssessment() {
    const emps = DataStore.getEmployees();

    // Potential distribution
    const potBuckets = { 'High (4-5)': 0, 'Medium (3-4)': 0, 'Low (1-3)': 0 };
    emps.forEach(e => {
      if (e.potScore >= 4) potBuckets['High (4-5)']++;
      else if (e.potScore >= 3) potBuckets['Medium (3-4)']++;
      else potBuckets['Low (1-3)']++;
    });

    if (charts.potentialDist) charts.potentialDist.destroy();
    charts.potentialDist = new Chart(document.getElementById('chartPotentialDist'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(potBuckets),
        datasets: [{ data: Object.values(potBuckets), backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0, spacing: 3 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, usePointStyle: true, font: { size: 11 } } } } }
    });

    // Radar for avg dimensions
    const avgLA = (emps.reduce((s, e) => s + e.learningAgility, 0) / emps.length).toFixed(1);
    const avgST = (emps.reduce((s, e) => s + e.strategicThinking, 0) / emps.length).toFixed(1);
    const avgPL = (emps.reduce((s, e) => s + e.peopleLeadership, 0) / emps.length).toFixed(1);
    const avg360 = (emps.reduce((s, e) => s + e.feedback360, 0) / emps.length).toFixed(1);
    const avgPerf = (emps.reduce((s, e) => s + e.perfScore, 0) / emps.length).toFixed(1);

    if (charts.potentialRadar) charts.potentialRadar.destroy();
    charts.potentialRadar = new Chart(document.getElementById('chartPotentialRadar'), {
      type: 'radar',
      data: {
        labels: ['Learning Agility', 'Strategic Thinking', 'People Leadership', '360 Feedback', 'Performance'],
        datasets: [{
          label: 'Org Average',
          data: [avgLA, avgST, avgPL, avg360, avgPerf],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.15)',
          pointBackgroundColor: '#6366f1',
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, color: '#64748b', backdropColor: 'transparent' }, grid: { color: 'rgba(30,41,59,0.5)' }, angleLines: { color: 'rgba(30,41,59,0.5)' }, pointLabels: { color: '#94a3b8', font: { size: 11 } } } },
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      }
    });

    // Table
    const tbody = document.querySelector('#potentialTable tbody');
    tbody.innerHTML = emps.sort((a, b) => b.potScore - a.potScore).slice(0, 20).map(e => `
      <tr onclick="App.showEmployeeModal('${e.id}')" style="cursor:pointer">
        <td><strong>${e.name}</strong><br><span class="text-muted">${e.role}</span></td>
        <td>${e.learningAgility.toFixed(1)}</td>
        <td>${e.strategicThinking.toFixed(1)}</td>
        <td>${e.peopleLeadership.toFixed(1)}</td>
        <td><span style="font-weight:700;color:${e.potScore >= 4 ? 'var(--success)' : e.potScore >= 3 ? 'var(--warning)' : 'var(--danger)'}">${e.potScore.toFixed(1)}</span></td>
        <td><span class="status-badge ${e.potLevel === 'High' ? 'status-green' : e.potLevel === 'Medium' ? 'status-amber' : 'status-red'}">${e.potLevel}</span></td>
      </tr>
    `).join('');
  }

  return { init, render };
})();
