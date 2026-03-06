/* ============================================================
   DEVELOPMENT MODULE — IDPs, Readiness Timeline
   ============================================================ */

const Development = (() => {
  let charts = {};

  function init() {
    DataStore.subscribe(render);
    document.getElementById('generateIDPBtn').addEventListener('click', generateIDP);
  }

  function render() {
    if (!DataStore.hasData()) return;
    populateEmployeeSelect();
    renderReadinessTimeline();
    renderReadinessTable();
  }

  function populateEmployeeSelect() {
    const emps = DataStore.getEmployees();
    const select = document.getElementById('devEmployeeSelect');
    select.innerHTML = '<option value="">Select Employee...</option>' +
      emps.filter(e => e.successorFor).map(e =>
        `<option value="${e.id}">${e.name} — ${e.role} (${e.department})</option>`
      ).join('');
  }

  function generateIDP() {
    const empId = document.getElementById('devEmployeeSelect').value;
    if (!empId) { App.toast('Please select an employee', 'error'); return; }

    const emp = DataStore.getEmployee(empId);
    if (!emp) return;

    const view = document.getElementById('idpView');

    // Simulate AI-generated IDP
    const gaps = (emp.skills || []).filter(s => s.level < 4).map(s => ({ skill: s.name, current: s.level, target: 5, gap: 5 - s.level }));
    const topGaps = gaps.sort((a, b) => b.gap - a.gap).slice(0, 5);

    const activities = [
      { title: 'Cross-Plant Shadow Assignment', desc: `Shadow ${emp.successorFor || 'target role'} at alternate plant for 3 months`, timeline: 'Q2 2026', type: 'Experience', status: Math.random() > 0.6 ? 'completed' : 'in-progress' },
      { title: 'P&L Simulation Workshop', desc: 'Complete advanced P&L management simulation program', timeline: 'Q3 2026', type: 'Learning', status: Math.random() > 0.5 ? 'in-progress' : '' },
      { title: 'Leadership Development Program', desc: 'Enroll in executive leadership cohort — strategic thinking & people leadership', timeline: 'Q3-Q4 2026', type: 'Learning', status: '' },
      { title: 'Stretch Project: Process Optimization', desc: 'Lead a cross-functional process optimization initiative to build strategic muscle', timeline: 'Q4 2026', type: 'Stretch', status: '' },
      { title: 'Mentoring with Senior Leader', desc: `Bi-weekly sessions with VP/Director for coaching on ${topGaps[0]?.skill || 'leadership'}`, timeline: 'Ongoing', type: 'Mentoring', status: 'in-progress' },
      { title: 'External Certification', desc: `Complete ${emp.education === 'B.Tech' ? 'PMP' : 'Six Sigma Black Belt'} certification`, timeline: 'Q1 2027', type: 'Certification', status: '' },
    ];

    view.innerHTML = `
      <div class="idp-card" style="border-left:3px solid var(--primary)">
        <h3><svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" width="20" height="20"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> AI-Generated IDP for ${emp.name}</h3>
        <div class="modal-grid" style="padding:0">
          <div class="modal-field"><div class="modal-field-label">Target Role</div><div class="modal-field-value">${emp.successorFor || 'Not assigned'}</div></div>
          <div class="modal-field"><div class="modal-field-label">Current Readiness</div><div class="modal-field-value"><span class="status-badge ${emp.readiness === 'Ready Now' ? 'status-green' : emp.readiness === '1-2 Years' ? 'status-amber' : 'status-purple'}">${emp.readiness}</span></div></div>
          <div class="modal-field"><div class="modal-field-label">Development Status</div><div class="modal-field-value">${emp.developmentStatus}</div></div>
          <div class="modal-field"><div class="modal-field-label">Mentor Assigned</div><div class="modal-field-value">${emp.mentorAssigned ? 'Yes' : 'No'}</div></div>
        </div>
      </div>

      <div class="idp-card">
        <h3>Competency Gap Analysis</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Competency</th><th>Current Level</th><th>Target Level</th><th>Gap</th><th>Priority</th></tr></thead>
            <tbody>
              ${topGaps.map(g => `
                <tr>
                  <td><strong>${g.skill}</strong></td>
                  <td>${renderStars(g.current)}</td>
                  <td>${renderStars(g.target)}</td>
                  <td><span style="color:var(--warning);font-weight:700">${g.gap}</span></td>
                  <td><span class="status-badge ${g.gap >= 3 ? 'status-red' : g.gap >= 2 ? 'status-amber' : 'status-blue'}">${g.gap >= 3 ? 'Critical' : g.gap >= 2 ? 'High' : 'Medium'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="idp-card">
        <h3>Development Roadmap</h3>
        <div class="idp-timeline">
          ${activities.map(a => `
            <div class="idp-item ${a.status}">
              <div class="idp-item-title">${a.title}</div>
              <div class="idp-item-desc">${a.desc}</div>
              <div class="idp-item-meta">
                <span><strong>Timeline:</strong> ${a.timeline}</span>
                <span><strong>Type:</strong> ${a.type}</span>
                <span class="status-badge ${a.status === 'completed' ? 'status-green' : a.status === 'in-progress' ? 'status-blue' : 'status-amber'}">${a.status === 'completed' ? 'Completed' : a.status === 'in-progress' ? 'In Progress' : 'Upcoming'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="idp-card">
        <h3>Stretch Assignment Recommendations</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">
          <div class="successor-card" style="cursor:default"><div class="successor-avatar" style="background:var(--primary)">1</div><div class="successor-info"><div class="successor-name">Cross-Plant Leadership</div><div class="successor-role">Lead production at alternate plant for 6 months</div></div></div>
          <div class="successor-card" style="cursor:default"><div class="successor-avatar" style="background:var(--success)">2</div><div class="successor-info"><div class="successor-name">Supply Chain Disruption Sim</div><div class="successor-role">Scenario-based exercise on supply chain resilience</div></div></div>
          <div class="successor-card" style="cursor:default"><div class="successor-avatar" style="background:var(--warning)">3</div><div class="successor-info"><div class="successor-name">Board Presentation</div><div class="successor-role">Present quarterly operations review to leadership</div></div></div>
        </div>
      </div>
    `;
  }

  function renderStars(level) {
    const full = Math.floor(level);
    return '<span style="color:var(--warning)">' + '&#9733;'.repeat(full) + '</span>' + '<span style="color:var(--border-light)">' + '&#9733;'.repeat(5 - full) + '</span>';
  }

  function renderReadinessTimeline() {
    const map = DataStore.getSuccessionMap();
    const readinessData = { 'Ready Now': 0, '1-2 Years': 0, '3+ Years': 0 };
    map.forEach(m => { if (readinessData[m.readiness] !== undefined) readinessData[m.readiness]++; });

    if (charts.readinessTimeline) charts.readinessTimeline.destroy();

    const emps = DataStore.getEmployees();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const readyNowTrend = months.map((_, i) => readinessData['Ready Now'] + Math.floor(Math.random() * 3 - 1 + i * 0.5));
    const oneTwoTrend = months.map((_, i) => readinessData['1-2 Years'] + Math.floor(Math.random() * 2 + i * 0.3));

    charts.readinessTimeline = new Chart(document.getElementById('chartReadinessTimeline'), {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label: 'Ready Now', data: readyNowTrend, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointRadius: 4 },
          { label: '1-2 Years', data: oneTwoTrend, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4, pointRadius: 4 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#64748b' }, border: { display: false } }, y: { grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#64748b' }, border: { display: false } } },
        plugins: { legend: { labels: { color: '#94a3b8', usePointStyle: true, font: { size: 11 } } } },
      }
    });
  }

  function renderReadinessTable() {
    const map = DataStore.getSuccessionMap();
    const tbody = document.querySelector('#readinessTable tbody');
    const milestones = ['1/4', '2/4', '3/4', '4/4'];
    const statuses = ['On Track', 'Ahead', 'Behind', 'Not Started'];

    tbody.innerHTML = map.slice(0, 15).map(m => {
      const mDone = Math.floor(Math.random() * 5);
      const status = mDone === 4 ? 'Ahead' : mDone >= 2 ? 'On Track' : mDone >= 1 ? 'Behind' : 'Not Started';
      const sClass = status === 'Ahead' ? 'status-green' : status === 'On Track' ? 'status-blue' : status === 'Behind' ? 'status-amber' : 'status-red';
      const target = new Date(); target.setMonth(target.getMonth() + Math.floor(Math.random() * 24 + 6));

      return `<tr>
        <td><strong>${m.employeeName}</strong></td>
        <td>${m.roleTitle}</td>
        <td><span class="status-badge ${m.readiness === 'Ready Now' ? 'status-green' : m.readiness === '1-2 Years' ? 'status-amber' : 'status-purple'}">${m.readiness}</span></td>
        <td>${mDone}/4</td>
        <td>${target.toISOString().split('T')[0]}</td>
        <td><span class="status-badge ${sClass}">${status}</span></td>
      </tr>`;
    }).join('');
  }

  return { init, render };
})();
