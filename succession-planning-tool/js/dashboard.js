/* ============================================================
   DASHBOARD MODULE
   ============================================================ */

const Dashboard = (() => {
  let charts = {};

  function init() {
    DataStore.subscribe(render);
  }

  function render() {
    if (!DataStore.hasData()) return;
    const emps = DataStore.getEmployees();
    const roles = DataStore.getRoles();
    const map = DataStore.getSuccessionMap();
    const criticalRoles = roles.filter(r => r.critical);

    // KPI calculations
    const rolesWithReadyNow = criticalRoles.filter(r => map.some(m => m.roleId === r.id && m.readiness === 'Ready Now'));
    const coverage = criticalRoles.length ? Math.round((rolesWithReadyNow.length / criticalRoles.length) * 100) : 0;
    const readyNowCount = map.filter(m => m.readiness === 'Ready Now').length;
    const highFlight = emps.filter(e => e.flightRisk30 >= 0.7).length;
    const avgBench = criticalRoles.length ? (map.length / criticalRoles.length).toFixed(1) : 0;

    document.getElementById('kpiCoverage').textContent = coverage + '%';
    document.getElementById('kpiReadyNow').textContent = readyNowCount;
    document.getElementById('kpiFlightRisk').textContent = highFlight;
    document.getElementById('kpiBenchDepth').textContent = avgBench;

    renderCoverageChart(criticalRoles, map);
    renderReadinessChart(map);
    renderFlightRiskChart(emps);
    renderGapsTable(criticalRoles, map);
    populateFilters();
  }

  function renderCoverageChart(critRoles, map) {
    const tiers = [1, 2, 3];
    const covered = tiers.map(t => {
      const tierRoles = critRoles.filter(r => r.tier === t);
      const withSucc = tierRoles.filter(r => map.some(m => m.roleId === r.id && m.readiness === 'Ready Now'));
      return tierRoles.length ? Math.round((withSucc.length / tierRoles.length) * 100) : 0;
    });
    const notCovered = covered.map(c => 100 - c);

    if (charts.coverage) charts.coverage.destroy();
    charts.coverage = new Chart(document.getElementById('chartCoverage'), {
      type: 'bar',
      data: {
        labels: ['Tier 1', 'Tier 2', 'Tier 3'],
        datasets: [
          { label: 'Covered', data: covered, backgroundColor: '#10b981', borderRadius: 6 },
          { label: 'Gap', data: notCovered, backgroundColor: 'rgba(239,68,68,0.3)', borderRadius: 6 },
        ]
      },
      options: {
        ...chartDefaults(),
        scales: { x: { stacked: true, ...axisDefaults() }, y: { stacked: true, max: 100, ...axisDefaults(), ticks: { ...axisDefaults().ticks, callback: v => v + '%' } } },
      }
    });
  }

  function renderReadinessChart(map) {
    const counts = { 'Ready Now': 0, '1-2 Years': 0, '3+ Years': 0 };
    map.forEach(m => { if (counts[m.readiness] !== undefined) counts[m.readiness]++; });

    if (charts.readiness) charts.readiness.destroy();
    charts.readiness = new Chart(document.getElementById('chartReadiness'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(counts),
        datasets: [{ data: Object.values(counts), backgroundColor: ['#10b981', '#f59e0b', '#6366f1'], borderWidth: 0, spacing: 3 }]
      },
      options: {
        ...chartDefaults(),
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } } } },
      }
    });
  }

  function renderFlightRiskChart(emps) {
    const depts = [...new Set(emps.map(e => e.department))].slice(0, 8);
    const high = depts.map(d => emps.filter(e => e.department === d && e.flightRisk30 >= 0.7).length);
    const med = depts.map(d => emps.filter(e => e.department === d && e.flightRisk30 >= 0.4 && e.flightRisk30 < 0.7).length);

    if (charts.flightRisk) charts.flightRisk.destroy();
    charts.flightRisk = new Chart(document.getElementById('chartFlightRisk'), {
      type: 'bar',
      data: {
        labels: depts,
        datasets: [
          { label: 'High Risk', data: high, backgroundColor: '#ef4444', borderRadius: 4 },
          { label: 'Medium Risk', data: med, backgroundColor: '#f59e0b', borderRadius: 4 },
        ]
      },
      options: { ...chartDefaults(), indexAxis: 'y', scales: { x: axisDefaults(), y: axisDefaults() } }
    });
  }

  function renderGapsTable(critRoles, map) {
    const tbody = document.querySelector('#gapsTable tbody');
    const gaps = critRoles.map(r => {
      const successors = map.filter(m => m.roleId === r.id);
      const readyNow = successors.filter(s => s.readiness === 'Ready Now').length;
      const oneTwo = successors.filter(s => s.readiness === '1-2 Years').length;
      const threePlus = successors.filter(s => s.readiness === '3+ Years').length;
      const risk = readyNow === 0 ? 'Critical' : readyNow < 2 ? 'At Risk' : 'Healthy';
      return { ...r, readyNow, oneTwo, threePlus, risk, total: successors.length };
    }).sort((a, b) => a.total - b.total);

    tbody.innerHTML = gaps.slice(0, 15).map(g => `
      <tr>
        <td><strong>${g.title}</strong></td>
        <td><span class="status-badge ${g.tier === 1 ? 'status-red' : g.tier === 2 ? 'status-amber' : 'status-blue'}">Tier ${g.tier}</span></td>
        <td>${g.department}</td>
        <td>${g.plant}</td>
        <td>${g.readyNow}</td>
        <td>${g.oneTwo}</td>
        <td>${g.threePlus}</td>
        <td><span class="status-badge ${g.risk === 'Critical' ? 'status-red' : g.risk === 'At Risk' ? 'status-amber' : 'status-green'}">${g.risk}</span></td>
      </tr>
    `).join('');
  }

  function populateFilters() {
    const org = DataStore.getOrgStructure();
    const buSelect = document.getElementById('dashBuFilter');
    buSelect.innerHTML = '<option value="all">All Business Units</option>' +
      org.businessUnits.map(b => `<option value="${b}">${b}</option>`).join('');
  }

  function chartDefaults() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, pointStyleWidth: 8, padding: 12 } },
      },
    };
  }

  function axisDefaults() {
    return {
      grid: { color: 'rgba(30,41,59,0.5)', drawBorder: false },
      ticks: { color: '#64748b', font: { size: 11 } },
      border: { display: false },
    };
  }

  return { init, render };
})();
