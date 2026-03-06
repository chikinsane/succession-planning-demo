/* ============================================================
   APP MODULE — Main controller, routing, PWA, modals
   ============================================================ */

const App = (() => {
  let currentPage = 'dashboard';

  function init() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    // Initialize modules
    Dashboard.init();
    NineBox.init();
    Pipeline.init();
    Development.init();
    Analytics.init();
    Manufacturing.init();
    Admin.init();

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(item.dataset.page);
      });
    });

    // Mobile sidebar
    document.getElementById('hamburger').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarClose').addEventListener('click', toggleSidebar);
    document.getElementById('mobileOverlay').addEventListener('click', toggleSidebar);

    // Modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('employeeModal').addEventListener('click', e => {
      if (e.target === document.getElementById('employeeModal')) closeModal();
    });

    // Notifications
    document.getElementById('notifBtn').addEventListener('click', () => {
      document.getElementById('notifPanel').classList.toggle('open');
    });
    document.getElementById('notifClose').addEventListener('click', () => {
      document.getElementById('notifPanel').classList.remove('open');
    });

    // Global search
    document.getElementById('globalSearch').addEventListener('input', handleSearch);

    // Generate default notifications
    generateNotifications();

    // Check for hash navigation
    const hash = window.location.hash.replace('#', '');
    if (hash) navigateTo(hash);
  }

  function navigateTo(page) {
    currentPage = page;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    // Update breadcrumb
    const nameMap = {
      dashboard: 'Dashboard', ninebox: '9-Box Grid', flightrisk: 'Flight Risk',
      potential: 'Potential Assessment', pipeline: 'Succession Pipeline',
      benchdepth: 'Bench Depth', matching: 'Successor Matching',
      development: 'Development Plans', readiness: 'Readiness Timeline',
      analytics: 'Analytics & DEI', manufacturing: 'Manufacturing',
      admin: 'Admin Console'
    };
    document.getElementById('breadcrumb').innerHTML = `<span class="breadcrumb-page">${nameMap[page] || page}</span>`;

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobileOverlay').classList.remove('active');

    window.location.hash = page;
  }

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('mobileOverlay').classList.toggle('active');
  }

  function showEmployeeModal(empId) {
    const emp = DataStore.getEmployee(empId);
    if (!emp) return;

    const map = DataStore.getSuccessionMap().filter(m => m.employeeId === empId);

    document.getElementById('modalTitle').textContent = emp.name;
    document.getElementById('modalBody').innerHTML = `
      <div class="modal-grid">
        <div class="modal-field"><div class="modal-field-label">Employee ID</div><div class="modal-field-value">${emp.id}</div></div>
        <div class="modal-field"><div class="modal-field-label">Department</div><div class="modal-field-value">${emp.department}</div></div>
        <div class="modal-field"><div class="modal-field-label">Current Role</div><div class="modal-field-value">${emp.role}</div></div>
        <div class="modal-field"><div class="modal-field-label">Plant</div><div class="modal-field-value">${emp.plant}</div></div>
        <div class="modal-field"><div class="modal-field-label">Grade</div><div class="modal-field-value">${emp.grade}</div></div>
        <div class="modal-field"><div class="modal-field-label">Tenure</div><div class="modal-field-value">${emp.tenure} years</div></div>
        <div class="modal-field"><div class="modal-field-label">Age</div><div class="modal-field-value">${emp.age}</div></div>
        <div class="modal-field"><div class="modal-field-label">Education</div><div class="modal-field-value">${emp.education}</div></div>
      </div>

      <h3 style="margin:20px 0 12px;font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Performance & Potential</h3>
      <div class="modal-grid">
        <div class="modal-field">
          <div class="modal-field-label">Performance (3yr)</div>
          <div class="modal-field-value">
            ${emp.perfRatings.map((r, i) => `Y${i + 1}: <strong>${r.toFixed(1)}</strong>`).join(' &middot; ')}
            <br><span class="status-badge ${emp.perfLevel === 'High' ? 'status-green' : emp.perfLevel === 'Medium' ? 'status-amber' : 'status-red'}" style="margin-top:4px">${emp.perfLevel} (${emp.perfScore.toFixed(1)})</span>
          </div>
        </div>
        <div class="modal-field">
          <div class="modal-field-label">Potential</div>
          <div class="modal-field-value">
            <span class="status-badge ${emp.potLevel === 'High' ? 'status-green' : emp.potLevel === 'Medium' ? 'status-amber' : 'status-red'}">${emp.potLevel} (${emp.potScore.toFixed(1)})</span>
          </div>
        </div>
        <div class="modal-field">
          <div class="modal-field-label">9-Box Position</div>
          <div class="modal-field-value">${emp.perfLevel} Perf / ${emp.potLevel} Pot</div>
        </div>
        <div class="modal-field">
          <div class="modal-field-label">Flight Risk (30d)</div>
          <div class="modal-field-value">
            <span class="flight-score ${emp.flightRisk30 >= 0.7 ? 'high' : emp.flightRisk30 >= 0.4 ? 'medium' : 'low'}">
              <span class="dot"></span>${emp.flightRisk30.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <h3 style="margin:20px 0 12px;font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Potential Dimensions</h3>
      <div class="modal-grid">
        <div class="modal-field"><div class="modal-field-label">Learning Agility</div><div class="modal-field-value">${emp.learningAgility.toFixed(1)} / 5</div></div>
        <div class="modal-field"><div class="modal-field-label">Strategic Thinking</div><div class="modal-field-value">${emp.strategicThinking.toFixed(1)} / 5</div></div>
        <div class="modal-field"><div class="modal-field-label">People Leadership</div><div class="modal-field-value">${emp.peopleLeadership.toFixed(1)} / 5</div></div>
        <div class="modal-field"><div class="modal-field-label">360 Feedback</div><div class="modal-field-value">${emp.feedback360.toFixed(1)} / 5</div></div>
      </div>

      <h3 style="margin:20px 0 12px;font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Succession</h3>
      <div class="modal-grid">
        <div class="modal-field"><div class="modal-field-label">Successor For</div><div class="modal-field-value">${emp.successorFor || '—'}</div></div>
        <div class="modal-field"><div class="modal-field-label">Readiness</div><div class="modal-field-value"><span class="status-badge ${emp.readiness === 'Ready Now' ? 'status-green' : emp.readiness === '1-2 Years' ? 'status-amber' : 'status-purple'}">${emp.readiness}</span></div></div>
        <div class="modal-field"><div class="modal-field-label">Development Status</div><div class="modal-field-value">${emp.developmentStatus}</div></div>
        <div class="modal-field"><div class="modal-field-label">Mentor Assigned</div><div class="modal-field-value">${emp.mentorAssigned ? 'Yes' : 'No'}</div></div>
      </div>

      ${emp.certifications && emp.certifications.length ? `
        <h3 style="margin:20px 0 12px;font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Certifications</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${emp.certifications.map(c => `
            <span class="status-badge ${c.status === 'Valid' ? 'status-green' : 'status-red'}">${c.name} (${c.status})</span>
          `).join('')}
        </div>
      ` : ''}

      ${emp.skills && emp.skills.length ? `
        <h3 style="margin:20px 0 12px;font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Skills & Competencies</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${emp.skills.map(s => `
            <span class="status-badge status-blue">${s.name}: ${s.level}/5</span>
          `).join('')}
        </div>
      ` : ''}

      <div style="margin-top:20px;display:flex;gap:8px">
        <div class="modal-field" style="flex:1"><div class="modal-field-label">Mobility</div><div class="modal-field-value">${emp.mobility || '—'}</div></div>
        <div class="modal-field" style="flex:1"><div class="modal-field-label">Aspiration</div><div class="modal-field-value">${emp.aspiration || '—'}</div></div>
        <div class="modal-field" style="flex:1"><div class="modal-field-label">Compa Ratio</div><div class="modal-field-value">${emp.compaRatio.toFixed(2)}</div></div>
      </div>
    `;

    document.getElementById('employeeModal').classList.add('active');
  }

  function closeModal() {
    document.getElementById('employeeModal').classList.remove('active');
  }

  function handleSearch(e) {
    const q = e.target.value.toLowerCase();
    if (!q || q.length < 2) return;

    const emps = DataStore.getEmployees();
    const matches = emps.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    ).slice(0, 5);

    if (matches.length === 1) {
      showEmployeeModal(matches[0].id);
    }
  }

  function generateNotifications() {
    const list = document.getElementById('notifList');
    const notifs = [
      { title: 'Flight Risk Alert', desc: 'A Ready Now successor shows high flight risk (0.82). Retention action recommended.', time: '2 hours ago', color: 'var(--danger)' },
      { title: 'Certification Expiring', desc: '3 safety certifications expiring within 30 days across Plant A.', time: '5 hours ago', color: 'var(--warning)' },
      { title: 'Calibration Session Due', desc: 'Q1 talent calibration session pending for Production department.', time: '1 day ago', color: 'var(--info)' },
      { title: 'IDP Milestone Completed', desc: 'Priya Patel completed cross-plant shadow assignment.', time: '2 days ago', color: 'var(--success)' },
      { title: 'Succession Gap Detected', desc: 'Plant Head role at Plant D has zero Ready Now successors.', time: '3 days ago', color: 'var(--danger)' },
    ];

    list.innerHTML = notifs.map(n => `
      <div class="notif-item" style="border-left:3px solid ${n.color}">
        <div class="notif-item-title">${n.title}</div>
        <div class="notif-item-desc">${n.desc}</div>
        <div class="notif-item-time">${n.time}</div>
      </div>
    `).join('');
  }

  function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${type === 'success' ? '&#10003;' : type === 'error' ? '&#10007;' : '&#8505;'}</span> ${message}`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
  }

  // Auto-init on DOM ready
  document.addEventListener('DOMContentLoaded', init);

  return { navigateTo, showEmployeeModal, toast };
})();
