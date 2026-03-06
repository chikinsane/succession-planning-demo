/* ============================================================
   PIPELINE MODULE — Succession Pipeline, Bench Depth, Matching
   ============================================================ */

const Pipeline = (() => {
  let charts = {};

  function init() {
    DataStore.subscribe(render);
    document.getElementById('pipelineTierFilter').addEventListener('change', renderPipeline);
    document.getElementById('runMatchingBtn').addEventListener('click', runMatching);
  }

  function render() {
    if (!DataStore.hasData()) return;
    renderPipeline();
    renderBenchDepth();
    populateMatchSelect();
    populatePipelineFilters();
  }

  function populatePipelineFilters() {
    const org = DataStore.getOrgStructure();
    const deptSelect = document.getElementById('pipelineDeptFilter');
    if (deptSelect.options.length <= 1) {
      org.departments.forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; deptSelect.appendChild(o); });
      deptSelect.addEventListener('change', renderPipeline);
    }
  }

  function renderPipeline() {
    const roles = DataStore.getRoles();
    const map = DataStore.getSuccessionMap();
    const emps = DataStore.getEmployees();
    const tierFilter = document.getElementById('pipelineTierFilter').value;
    const deptFilter = document.getElementById('pipelineDeptFilter').value;

    let filtered = roles.filter(r => r.critical);
    if (tierFilter !== 'all') filtered = filtered.filter(r => r.tier === parseInt(tierFilter));
    if (deptFilter !== 'all') filtered = filtered.filter(r => r.department === deptFilter);

    const view = document.getElementById('pipelineView');
    if (!filtered.length) {
      view.innerHTML = '<div class="empty-state"><h3>No roles match the current filter</h3><p>Adjust your filter criteria to see succession pipelines.</p></div>';
      return;
    }

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#22d3ee', '#ec4899'];

    view.innerHTML = filtered.map((role, idx) => {
      const successors = map.filter(m => m.roleId === role.id);
      const readyNow = successors.filter(s => s.readiness === 'Ready Now');
      const oneTwo = successors.filter(s => s.readiness === '1-2 Years');
      const threePlus = successors.filter(s => s.readiness === '3+ Years');
      const health = readyNow.length >= 2 ? 'Healthy' : readyNow.length === 1 ? 'At Risk' : 'Critical';
      const healthClass = health === 'Healthy' ? 'status-green' : health === 'At Risk' ? 'status-amber' : 'status-red';

      return `
        <div class="pipeline-card">
          <div class="pipeline-card-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="pipeline-role-info">
              <span class="status-badge ${role.tier === 1 ? 'status-red' : role.tier === 2 ? 'status-amber' : 'status-blue'}">Tier ${role.tier}</span>
              <div>
                <div class="pipeline-role-name">${role.title}</div>
                <div class="pipeline-dept">${role.department} &middot; ${role.plant}</div>
              </div>
            </div>
            <div class="pipeline-meta">
              <div class="pipeline-meta-item"><span class="pipeline-meta-value" style="color:var(--success)">${readyNow.length}</span><span class="pipeline-meta-label">Ready Now</span></div>
              <div class="pipeline-meta-item"><span class="pipeline-meta-value" style="color:var(--warning)">${oneTwo.length}</span><span class="pipeline-meta-label">1-2 Yrs</span></div>
              <div class="pipeline-meta-item"><span class="pipeline-meta-value" style="color:var(--primary-light)">${threePlus.length}</span><span class="pipeline-meta-label">3+ Yrs</span></div>
              <span class="status-badge ${healthClass}">${health}</span>
            </div>
          </div>
          <div class="pipeline-successors">
            ${successors.length ? successors.map(s => {
              const emp = emps.find(e => e.id === s.employeeId);
              const color = colors[idx % colors.length];
              const readinessClass = s.readiness === 'Ready Now' ? 'status-green' : s.readiness === '1-2 Years' ? 'status-amber' : 'status-purple';
              return `
                <div class="successor-card" onclick="App.showEmployeeModal('${s.employeeId}')">
                  <div class="successor-avatar" style="background:${color}">${s.employeeName.charAt(0)}</div>
                  <div class="successor-info">
                    <div class="successor-name">${s.employeeName}</div>
                    <div class="successor-role">${emp ? emp.role : ''} &middot; ${emp ? emp.department : ''}</div>
                    <div class="successor-meta">
                      <span class="status-badge ${readinessClass}">${s.readiness}</span>
                      <span class="status-badge status-blue">Match: ${Math.round(s.matchScore * 100)}%</span>
                    </div>
                  </div>
                </div>`;
            }).join('') : '<div class="empty-state"><p>No successors identified for this role</p></div>'}
          </div>
        </div>`;
    }).join('');
  }

  function renderBenchDepth() {
    const roles = DataStore.getRoles().filter(r => r.critical);
    const map = DataStore.getSuccessionMap();

    // Bench overview chart
    const benchData = roles.slice(0, 10).map(r => {
      const successors = map.filter(m => m.roleId === r.id);
      return { title: r.title.length > 18 ? r.title.slice(0, 18) + '...' : r.title, readyNow: successors.filter(s => s.readiness === 'Ready Now').length, oneTwo: successors.filter(s => s.readiness === '1-2 Years').length, threePlus: successors.filter(s => s.readiness === '3+ Years').length };
    });

    if (charts.benchOverview) charts.benchOverview.destroy();
    charts.benchOverview = new Chart(document.getElementById('chartBenchOverview'), {
      type: 'bar',
      data: {
        labels: benchData.map(b => b.title),
        datasets: [
          { label: 'Ready Now', data: benchData.map(b => b.readyNow), backgroundColor: '#10b981', borderRadius: 4 },
          { label: '1-2 Years', data: benchData.map(b => b.oneTwo), backgroundColor: '#f59e0b', borderRadius: 4 },
          { label: '3+ Years', data: benchData.map(b => b.threePlus), backgroundColor: '#6366f1', borderRadius: 4 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { stacked: true, grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } }, border: { display: false } }, y: { stacked: true, grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#64748b', stepSize: 1 }, border: { display: false } } },
        plugins: { legend: { labels: { color: '#94a3b8', usePointStyle: true, font: { size: 11 } } } },
      }
    });

    // Coverage by BU
    const org = DataStore.getOrgStructure();
    const buData = org.businessUnits.map(bu => {
      const buRoles = roles.filter(r => r.businessUnit === bu);
      const covered = buRoles.filter(r => map.some(m => m.roleId === r.id && m.readiness === 'Ready Now')).length;
      return { bu, pct: buRoles.length ? Math.round(covered / buRoles.length * 100) : 0 };
    });

    if (charts.benchBU) charts.benchBU.destroy();
    charts.benchBU = new Chart(document.getElementById('chartBenchBU'), {
      type: 'bar',
      data: {
        labels: buData.map(b => b.bu),
        datasets: [{ label: 'Coverage %', data: buData.map(b => b.pct), backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#3b82f6'], borderRadius: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { grid: { display: false }, ticks: { color: '#64748b' }, border: { display: false } }, y: { max: 100, grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#64748b', callback: v => v + '%' }, border: { display: false } } },
        plugins: { legend: { display: false } },
      }
    });

    // Bench table
    const tbody = document.querySelector('#benchTable tbody');
    tbody.innerHTML = roles.map(r => {
      const successors = map.filter(m => m.roleId === r.id);
      const rn = successors.filter(s => s.readiness === 'Ready Now').length;
      const ot = successors.filter(s => s.readiness === '1-2 Years').length;
      const tp = successors.filter(s => s.readiness === '3+ Years').length;
      const health = rn >= 2 ? 'Healthy' : rn === 1 ? 'At Risk' : 'Critical';
      const hClass = health === 'Healthy' ? 'status-green' : health === 'At Risk' ? 'status-amber' : 'status-red';
      const incumbent = DataStore.getEmployees().find(e => e.role === r.title && e.plant === r.plant);
      return `<tr>
        <td><strong>${r.title}</strong></td>
        <td>${incumbent ? incumbent.name : '—'}</td>
        <td><span class="status-badge ${r.tier === 1 ? 'status-red' : 'status-amber'}">Tier ${r.tier}</span></td>
        <td style="color:var(--success);font-weight:700">${rn}</td>
        <td style="color:var(--warning);font-weight:700">${ot}</td>
        <td style="color:var(--primary-light);font-weight:700">${tp}</td>
        <td><span class="status-badge ${hClass}">${health}</span></td>
      </tr>`;
    }).join('');
  }

  function populateMatchSelect() {
    const roles = DataStore.getRoles().filter(r => r.critical);
    const select = document.getElementById('matchRoleSelect');
    select.innerHTML = '<option value="">Choose a role...</option>' +
      roles.map(r => `<option value="${r.id}">${r.title} — ${r.plant}</option>`).join('');
  }

  function runMatching() {
    const roleId = document.getElementById('matchRoleSelect').value;
    if (!roleId) { App.toast('Please select a target role', 'error'); return; }

    const role = DataStore.getRoles().find(r => r.id === roleId);
    const emps = DataStore.getEmployees();
    const results = document.getElementById('matchingResults');

    // AI matching simulation — score each employee
    const candidates = emps.map(emp => {
      let score = 0;
      // Department match
      if (emp.department === role.department) score += 15;
      // Performance
      score += (emp.perfScore / 5) * 20;
      // Potential
      score += (emp.potScore / 5) * 20;
      // Grade proximity
      const gradeDiff = Math.abs(emp.gradeNum - (role.tier === 1 ? 7 : role.tier === 2 ? 5 : 3));
      score += Math.max(0, 10 - gradeDiff * 3);
      // Skills match
      const roleComps = role.competencies || [];
      const empSkills = (emp.skills || []).map(s => s.name);
      const overlap = roleComps.filter(c => empSkills.includes(c)).length;
      score += roleComps.length ? (overlap / roleComps.length) * 20 : 10;
      // Experience
      score += Math.min(emp.tenure / 20, 1) * 10;
      // Flight risk penalty
      score -= emp.flightRisk30 * 10;
      // 360 feedback
      score += (emp.feedback360 / 5) * 5;

      return { emp, score: Math.min(Math.max(score, 10), 98) };
    }).sort((a, b) => b.score - a.score).slice(0, 8);

    const factors = [
      { label: 'Skills Match', class: 'status-green' },
      { label: 'High Performance', class: 'status-blue' },
      { label: 'Tenure Fit', class: 'status-purple' },
      { label: 'Low Flight Risk', class: 'status-green' },
      { label: 'Dept Aligned', class: 'status-amber' },
    ];

    results.innerHTML = `
      <div class="card" style="margin-bottom:16px;padding:16px 20px;border-left:3px solid var(--primary)">
        <strong>AI Matching Results for: ${role.title}</strong> — ${role.plant}
        <br><span class="text-muted" style="font-size:12px">Scored ${emps.length} candidates across skills, performance, potential, experience, and risk factors</span>
      </div>
      ${candidates.map((c, i) => `
        <div class="match-card" onclick="App.showEmployeeModal('${c.emp.id}')">
          <div class="match-rank">${i + 1}</div>
          <div class="match-info">
            <h4>${c.emp.name}</h4>
            <p>${c.emp.role} &middot; ${c.emp.department} &middot; ${c.emp.plant} &middot; Grade ${c.emp.grade}</p>
            <div class="match-factors">
              ${factors.slice(0, 3 + Math.floor(Math.random() * 2)).map(f =>
                `<span class="match-factor ${f.class}">${f.label}</span>`
              ).join('')}
            </div>
          </div>
          <div class="match-score-area">
            <div class="match-score-value">${Math.round(c.score)}%</div>
            <div class="match-score-label">Match Score</div>
          </div>
        </div>
      `).join('')}
    `;
  }

  return { init, render };
})();
