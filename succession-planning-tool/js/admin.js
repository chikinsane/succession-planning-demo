/* ============================================================
   ADMIN MODULE — Upload, Template, Data Management
   ============================================================ */

const Admin = (() => {
  function init() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

    document.getElementById('downloadTemplateBtn').addEventListener('click', () => {
      DataStore.generateTemplate();
      App.toast('Template downloaded successfully', 'success');
    });

    document.getElementById('loadDemoBtn').addEventListener('click', loadDemo);
    document.getElementById('clearDataBtn').addEventListener('click', clearData);

    DataStore.subscribe(refreshAdmin);
  }

  function handleFile(file) {
    if (!file.name.match(/\.xlsx?$/)) {
      App.toast('Please upload an Excel file (.xlsx or .xls)', 'error');
      return;
    }

    const progress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const result = document.getElementById('uploadResult');

    progress.style.display = 'block';
    result.style.display = 'none';
    progressFill.style.width = '30%';
    progressText.textContent = 'Reading file...';

    setTimeout(() => {
      progressFill.style.width = '60%';
      progressText.textContent = 'Parsing data...';

      DataStore.parseExcel(file).then(stats => {
        progressFill.style.width = '100%';
        progressText.textContent = 'Complete!';

        setTimeout(() => {
          progress.style.display = 'none';
          result.style.display = 'block';
          result.innerHTML = `
            <div style="padding:12px;background:var(--success-bg);border-radius:var(--radius-sm);border:1px solid rgba(16,185,129,0.2)">
              <strong style="color:var(--success)">Upload Successful</strong>
              <div style="font-size:13px;color:var(--text-secondary);margin-top:6px">
                Loaded <strong>${stats.total}</strong> employees, <strong>${stats.roles}</strong> roles, <strong>${stats.mappings}</strong> succession mappings
              </div>
            </div>
          `;
          App.toast(`Loaded ${stats.total} employees from Excel`, 'success');
        }, 500);
      }).catch(err => {
        progress.style.display = 'none';
        result.style.display = 'block';
        result.innerHTML = `
          <div style="padding:12px;background:var(--danger-bg);border-radius:var(--radius-sm);border:1px solid rgba(239,68,68,0.2)">
            <strong style="color:var(--danger)">Upload Failed</strong>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:6px">${err}</div>
          </div>
        `;
        App.toast('Failed to parse Excel file', 'error');
      });
    }, 500);
  }

  function loadDemo() {
    const stats = DataStore.generateDemo();
    App.toast(`Demo loaded: ${stats.total} employees, ${stats.roles} roles`, 'success');
  }

  function clearData() {
    DataStore.clearAll();
    document.getElementById('uploadResult').style.display = 'none';
    App.toast('All data cleared', 'info');
  }

  function refreshAdmin() {
    const emps = DataStore.getEmployees();
    const roles = DataStore.getRoles();
    const map = DataStore.getSuccessionMap();

    // Employee count
    document.getElementById('empCount').textContent = `${emps.length} employees loaded`;

    // Data health
    const health = document.getElementById('dataHealth');
    if (!emps.length) {
      health.innerHTML = '<div class="health-item"><span class="health-dot red"></span><span>No data loaded</span></div>';
    } else {
      const hasPerfData = emps.some(e => e.perfScore > 0);
      const hasPotData = emps.some(e => e.potScore > 0);
      const hasRoles = roles.length > 0;
      const hasMapping = map.length > 0;
      const hasSkills = emps.some(e => e.skills && e.skills.length);

      health.innerHTML = `
        <div class="health-item"><span class="health-dot green"></span><span>Employee Profiles: ${emps.length} loaded</span></div>
        <div class="health-item"><span class="health-dot ${hasPerfData ? 'green' : 'amber'}"></span><span>Performance Data: ${hasPerfData ? 'Available' : 'Missing'}</span></div>
        <div class="health-item"><span class="health-dot ${hasPotData ? 'green' : 'amber'}"></span><span>Potential Scores: ${hasPotData ? 'Available' : 'Missing'}</span></div>
        <div class="health-item"><span class="health-dot ${hasRoles ? 'green' : 'red'}"></span><span>Role Definitions: ${hasRoles ? roles.length + ' roles' : 'Not defined'}</span></div>
        <div class="health-item"><span class="health-dot ${hasMapping ? 'green' : 'red'}"></span><span>Succession Mapping: ${hasMapping ? map.length + ' mappings' : 'Not configured'}</span></div>
        <div class="health-item"><span class="health-dot ${hasSkills ? 'green' : 'amber'}"></span><span>Skills Data: ${hasSkills ? 'Available' : 'Not loaded'}</span></div>
      `;
    }

    // Employee table
    const tbody = document.querySelector('#employeeTable tbody');
    tbody.innerHTML = emps.slice(0, 50).map(e => `
      <tr onclick="App.showEmployeeModal('${e.id}')" style="cursor:pointer">
        <td>${e.id}</td>
        <td><strong>${e.name}</strong></td>
        <td>${e.department}</td>
        <td>${e.role}</td>
        <td>${e.plant.split('—')[0].trim()}</td>
        <td>${e.grade}</td>
        <td><span style="color:${e.perfLevel === 'High' ? 'var(--success)' : e.perfLevel === 'Medium' ? 'var(--warning)' : 'var(--danger)'}">${e.perfScore.toFixed(1)}</span></td>
        <td><span class="status-badge ${e.potLevel === 'High' ? 'status-green' : e.potLevel === 'Medium' ? 'status-amber' : 'status-red'}">${e.potLevel}</span></td>
      </tr>
    `).join('');

    if (emps.length > 50) {
      tbody.innerHTML += `<tr><td colspan="8" class="text-center text-muted" style="padding:16px">Showing 50 of ${emps.length} employees</td></tr>`;
    }
  }

  return { init };
})();
