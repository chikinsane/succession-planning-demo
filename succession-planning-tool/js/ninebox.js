/* ============================================================
   9-BOX GRID MODULE
   ============================================================ */

const NineBox = (() => {
  function init() {
    DataStore.subscribe(render);
    setupFilters();
  }

  function setupFilters() {
    document.getElementById('nineboxDeptFilter').addEventListener('change', render);
    document.getElementById('nineboxPlantFilter').addEventListener('change', render);
  }

  function render() {
    if (!DataStore.hasData()) return;

    const deptFilter = document.getElementById('nineboxDeptFilter').value;
    const plantFilter = document.getElementById('nineboxPlantFilter').value;

    // Populate filter options
    const org = DataStore.getOrgStructure();
    const deptSelect = document.getElementById('nineboxDeptFilter');
    if (deptSelect.options.length <= 1) {
      org.departments.forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; deptSelect.appendChild(o); });
    }
    const plantSelect = document.getElementById('nineboxPlantFilter');
    if (plantSelect.options.length <= 1) {
      org.plants.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; plantSelect.appendChild(o); });
    }

    let emps = DataStore.getEmployees();
    if (deptFilter !== 'all') emps = emps.filter(e => e.department === deptFilter);
    if (plantFilter !== 'all') emps = emps.filter(e => e.plant === plantFilter);

    // Map employees to grid cells
    const grid = {};
    ['high', 'medium', 'low'].forEach(perf => {
      ['high', 'medium', 'low'].forEach(pot => {
        grid[`${perf}-${pot}`] = [];
      });
    });

    emps.forEach(emp => {
      const perf = emp.perfLevel.toLowerCase();
      const pot = emp.potLevel.toLowerCase();
      const key = `${perf}-${pot}`;
      if (grid[key]) grid[key].push(emp);
    });

    // Render cells
    document.querySelectorAll('.ninebox-cell').forEach(cell => {
      const box = cell.dataset.box;
      const cellEmps = grid[box] || [];
      cell.querySelector('.cell-count').textContent = cellEmps.length;

      const empContainer = cell.querySelector('.cell-employees');
      empContainer.innerHTML = cellEmps.slice(0, 8).map(e =>
        `<span class="emp-chip" data-id="${e.id}" title="${e.name} — ${e.role}">${e.firstName} ${e.lastName.charAt(0)}.</span>`
      ).join('') + (cellEmps.length > 8 ? `<span class="emp-chip">+${cellEmps.length - 8}</span>` : '');
    });

    // Add click handlers for employee chips
    document.querySelectorAll('.emp-chip[data-id]').forEach(chip => {
      chip.addEventListener('click', () => App.showEmployeeModal(chip.dataset.id));
    });

    renderSummary(emps, grid);
  }

  function renderSummary(emps, grid) {
    const summary = document.getElementById('nineboxSummary');
    const stars = grid['high-high'].length;
    const highPot = grid['medium-high'].length + grid['low-high'].length;
    const underperf = grid['low-low'].length;
    const total = emps.length;

    summary.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon kpi-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
        <div class="kpi-body"><span class="kpi-label">Stars (HiPo/HiPerf)</span><span class="kpi-value">${stars}</span><span class="kpi-trend neutral">${total ? Math.round(stars/total*100) : 0}% of total</span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon kpi-purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
        <div class="kpi-body"><span class="kpi-label">High Potentials</span><span class="kpi-value">${highPot}</span><span class="kpi-trend neutral">Need development focus</span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon kpi-amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
        <div class="kpi-body"><span class="kpi-label">Underperformers</span><span class="kpi-value">${underperf}</span><span class="kpi-trend down">Require intervention</span></div>
      </div>
    `;
  }

  return { init, render };
})();
