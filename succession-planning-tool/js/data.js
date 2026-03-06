/* ============================================================
   DATA MODULE — Central data store, Excel parsing, demo generation
   ============================================================ */

const DataStore = (() => {
  let employees = [];
  let roles = [];
  let orgStructure = { departments: [], plants: [], businessUnits: [] };
  let successionMap = [];
  let auditLog = [];
  let listeners = [];

  const DEPARTMENTS = ['Production', 'Quality', 'Maintenance', 'EHS', 'Supply Chain', 'Engineering', 'HR', 'Finance', 'IT', 'Automation'];
  const PLANTS = ['Plant A — Pune', 'Plant B — Chennai', 'Plant C — Ahmedabad', 'Plant D — Jamshedpur', 'Corporate HQ — Mumbai'];
  const BU = ['Manufacturing', 'Operations', 'Corporate'];
  const GRADES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'];
  const PERF_LABELS = ['Low', 'Medium', 'High'];
  const POT_LABELS = ['Low', 'Medium', 'High'];
  const READINESS = ['Ready Now', '1-2 Years', '3+ Years'];
  const GENDERS = ['Male', 'Female', 'Non-Binary'];
  const CERT_TYPES = ['HAZMAT', 'Fire Safety', 'Electrical HV', 'ISO Auditor', 'Six Sigma Green', 'Six Sigma Black', 'PMP', 'Welding', 'PLC Programming', 'SCADA', 'Safety Officer'];

  const FIRST_NAMES = ['Arjun','Priya','Vikram','Ananya','Rajesh','Meera','Suresh','Kavita','Amit','Neha','Ravi','Pooja','Kiran','Divya','Manish','Sneha','Arun','Rekha','Deepak','Swati','Rahul','Isha','Gaurav','Anjali','Vivek','Pallavi','Sanjay','Nisha','Ashok','Ritika','Manoj','Tanvi','Hitesh','Shikha','Rohan','Jyoti','Varun','Geeta','Nikhil','Sunita','Tarun','Aarti','Ajay','Bhavna','Vinod','Chitra','Dinesh','Ekta','Farhan','Garima','Harish','Indira','Jayesh','Komal','Lalit','Megha','Neeraj','Padma','Rohit','Seema','Tushar','Uma','Yash','Zoya','Abhishek','Devika','Girish','Hema','Ishaan','Jaya'];
  const LAST_NAMES = ['Sharma','Patel','Gupta','Singh','Reddy','Kumar','Joshi','Mehta','Shah','Rao','Verma','Iyer','Nair','Desai','Chauhan','Bhatt','Kulkarni','Menon','Pillai','Das','Mishra','Tiwari','Pandey','Saxena','Bose','Sen','Banerjee','Mukherjee','Ghosh','Roy','Malhotra','Kapoor','Arora','Sinha','Thakur'];

  const ROLES_TEMPLATE = [
    { title: 'Plant Head', tier: 1, dept: 'Production', critical: true },
    { title: 'VP Operations', tier: 1, dept: 'Production', critical: true },
    { title: 'Production Manager', tier: 2, dept: 'Production', critical: true },
    { title: 'Quality Head', tier: 1, dept: 'Quality', critical: true },
    { title: 'Quality Manager', tier: 2, dept: 'Quality', critical: true },
    { title: 'Maintenance Head', tier: 2, dept: 'Maintenance', critical: true },
    { title: 'EHS Director', tier: 1, dept: 'EHS', critical: true },
    { title: 'EHS Manager', tier: 2, dept: 'EHS', critical: true },
    { title: 'Supply Chain Head', tier: 1, dept: 'Supply Chain', critical: true },
    { title: 'Logistics Manager', tier: 2, dept: 'Supply Chain', critical: false },
    { title: 'Engineering Manager', tier: 2, dept: 'Engineering', critical: true },
    { title: 'Automation Lead', tier: 2, dept: 'Automation', critical: true },
    { title: 'HR Director', tier: 2, dept: 'HR', critical: false },
    { title: 'Finance Controller', tier: 2, dept: 'Finance', critical: false },
    { title: 'IT Manager', tier: 3, dept: 'IT', critical: false },
    { title: 'Shift Supervisor', tier: 3, dept: 'Production', critical: true },
    { title: 'Line Leader', tier: 3, dept: 'Production', critical: false },
    { title: 'Safety Officer', tier: 3, dept: 'EHS', critical: true },
    { title: 'Procurement Head', tier: 2, dept: 'Supply Chain', critical: false },
    { title: 'CHRO', tier: 1, dept: 'HR', critical: true },
  ];

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randFloat(min, max, dec = 2) { return +(Math.random() * (max - min) + min).toFixed(dec); }

  function generateDemo() {
    employees = [];
    roles = [];
    successionMap = [];
    auditLog = [];

    // Generate roles across plants
    PLANTS.forEach((plant, pi) => {
      ROLES_TEMPLATE.forEach((rt, ri) => {
        if (plant.includes('Corporate') && ['Production', 'Maintenance', 'EHS', 'Automation'].includes(rt.dept)) return;
        roles.push({
          id: `R${pi}${ri}`,
          title: rt.title,
          tier: rt.tier,
          department: rt.dept,
          plant: plant,
          critical: rt.critical,
          businessUnit: plant.includes('Corporate') ? 'Corporate' : 'Manufacturing',
          competencies: generateCompetencies(rt.dept),
        });
      });
    });

    // Generate 160 employees
    for (let i = 0; i < 160; i++) {
      const dept = rand(DEPARTMENTS);
      const plant = rand(PLANTS);
      const grade = rand(GRADES);
      const gradeNum = parseInt(grade.slice(1));
      const perfScore = randFloat(1, 5);
      const potScore = randFloat(1, 5);
      const perfLevel = perfScore >= 3.8 ? 'High' : perfScore >= 2.5 ? 'Medium' : 'Low';
      const potLevel = potScore >= 3.8 ? 'High' : potScore >= 2.5 ? 'Medium' : 'Low';
      const gender = rand(GENDERS);
      const age = randInt(25, 60);
      const tenure = randInt(1, 25);

      const flightBase = Math.random();
      const flightFactors = [];
      if (flightBase > 0.6) flightFactors.push('Low pay relativity');
      if (tenure < 3) flightFactors.push('Short tenure');
      if (Math.random() > 0.7) flightFactors.push('Stalled career');
      if (Math.random() > 0.8) flightFactors.push('Market demand');

      const certs = [];
      const numCerts = randInt(0, 4);
      for (let c = 0; c < numCerts; c++) {
        const cert = rand(CERT_TYPES);
        if (!certs.find(x => x.name === cert)) {
          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + randInt(-6, 24));
          certs.push({ name: cert, expiry: expiry.toISOString().split('T')[0], status: expiry > new Date() ? 'Valid' : 'Expired' });
        }
      }

      employees.push({
        id: `EMP${String(i + 1001).padStart(4, '0')}`,
        firstName: rand(FIRST_NAMES),
        lastName: rand(LAST_NAMES),
        get name() { return `${this.firstName} ${this.lastName}`; },
        email: '',
        department: dept,
        plant: plant,
        businessUnit: plant.includes('Corporate') ? 'Corporate' : 'Manufacturing',
        role: rand(roles.filter(r => r.department === dept)).title || 'Associate',
        grade: grade,
        gradeNum: gradeNum,
        hireDate: new Date(Date.now() - tenure * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tenure: tenure,
        age: age,
        gender: gender,
        education: rand(['B.Tech', 'M.Tech', 'MBA', 'B.Sc', 'Diploma', 'ITI', 'PhD']),
        perfRatings: [randFloat(1, 5), randFloat(1, 5), randFloat(1, 5)],
        perfScore: perfScore,
        perfLevel: perfLevel,
        potScore: potScore,
        potLevel: potLevel,
        learningAgility: randFloat(1, 5),
        strategicThinking: randFloat(1, 5),
        peopleLeadership: randFloat(1, 5),
        flightRisk30: randFloat(0, 1),
        flightRisk60: randFloat(0, 1),
        flightRisk90: randFloat(0, 1),
        flightFactors: flightFactors,
        compaRatio: randFloat(0.75, 1.3),
        mobility: rand(['Open to relocation', 'Prefer current', 'International ready']),
        aspiration: rand(['VP Operations', 'Plant Head', 'Functional Head', 'Technical Expert', 'Same role', 'Cross-functional']),
        skills: generateSkills(dept),
        certifications: certs,
        feedback360: randFloat(2.5, 5),
        readiness: rand(READINESS),
        successorFor: '',
        developmentStatus: rand(['On Track', 'Ahead', 'Behind', 'Not Started']),
        mentorAssigned: Math.random() > 0.5,
        knowledgeRisk: randFloat(0, 1),
      });
    }

    // Assign succession mapping
    roles.filter(r => r.critical).forEach(role => {
      const deptEmps = employees.filter(e => e.department === role.department || Math.random() > 0.8);
      const numSuccessors = randInt(0, 4);
      const selected = deptEmps.sort(() => Math.random() - 0.5).slice(0, numSuccessors);
      selected.forEach(emp => {
        successionMap.push({
          roleId: role.id,
          roleTitle: role.title,
          roleTier: role.tier,
          rolePlant: role.plant,
          roleDept: role.department,
          employeeId: emp.id,
          employeeName: emp.name,
          readiness: rand(READINESS),
          matchScore: randFloat(0.5, 0.98),
        });
        emp.successorFor = role.title;
      });
    });

    // Generate audit log
    const actions = ['Calibration session completed', 'Successor nominated', 'IDP approved', 'Flight risk alert triggered', 'Readiness level updated', 'Successor removed', 'Role criticality changed'];
    const users = ['HR Admin', 'CHRO', 'Plant Head', 'VP Ops', 'Dept Manager'];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - randInt(0, 90));
      auditLog.push({
        date: d.toISOString().split('T')[0],
        action: rand(actions),
        by: rand(users),
        details: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)} — ${rand(roles).title}`,
      });
    }
    auditLog.sort((a, b) => b.date.localeCompare(a.date));

    orgStructure = { departments: [...new Set(employees.map(e => e.department))], plants: [...new Set(employees.map(e => e.plant))], businessUnits: BU };

    notify();
    return { total: employees.length, roles: roles.length, mappings: successionMap.length };
  }

  function generateCompetencies(dept) {
    const base = ['Leadership', 'Communication', 'Problem Solving', 'Strategic Thinking'];
    const techMap = {
      'Production': ['Lean Manufacturing', 'OEE Optimization', 'Shift Management'],
      'Quality': ['ISO 9001', 'SPC', 'Root Cause Analysis', 'FMEA'],
      'Maintenance': ['TPM', 'Predictive Maintenance', 'CMMS'],
      'EHS': ['OSHA Compliance', 'Incident Investigation', 'Risk Assessment'],
      'Supply Chain': ['Inventory Mgmt', 'Logistics', 'Vendor Management'],
      'Engineering': ['CAD/CAM', 'Process Engineering', 'Project Mgmt'],
      'Automation': ['PLC Programming', 'SCADA', 'Industry 4.0', 'IoT'],
    };
    return [...base, ...(techMap[dept] || ['Domain Expertise'])];
  }

  function generateSkills(dept) {
    const skills = generateCompetencies(dept);
    return skills.map(s => ({ name: s, level: randInt(1, 5) }));
  }

  function parseExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          const empSheet = wb.Sheets[wb.SheetNames.find(s => s.toLowerCase().includes('employee')) || wb.SheetNames[0]];
          if (!empSheet) { reject('No employee sheet found'); return; }

          const data = XLSX.utils.sheet_to_json(empSheet);
          if (!data.length) { reject('Empty spreadsheet'); return; }

          employees = data.map((row, i) => ({
            id: row['Employee ID'] || row['ID'] || row['EmployeeID'] || `EMP${i + 1001}`,
            firstName: row['First Name'] || row['FirstName'] || (row['Name'] || '').split(' ')[0] || '',
            lastName: row['Last Name'] || row['LastName'] || (row['Name'] || '').split(' ').slice(1).join(' ') || '',
            get name() { return `${this.firstName} ${this.lastName}`; },
            department: row['Department'] || row['Dept'] || '',
            plant: row['Plant'] || row['Site'] || row['Location'] || '',
            businessUnit: row['Business Unit'] || row['BU'] || '',
            role: row['Role'] || row['Title'] || row['Job Title'] || '',
            grade: row['Grade'] || row['Level'] || '',
            gradeNum: parseInt((row['Grade'] || row['Level'] || 'L3').replace(/\D/g, '')) || 3,
            hireDate: row['Hire Date'] || row['HireDate'] || '',
            tenure: parseInt(row['Tenure']) || 0,
            age: parseInt(row['Age']) || 0,
            gender: row['Gender'] || '',
            education: row['Education'] || '',
            perfRatings: [
              parseFloat(row['Perf Y1'] || row['Performance Year 1']) || 3,
              parseFloat(row['Perf Y2'] || row['Performance Year 2']) || 3,
              parseFloat(row['Perf Y3'] || row['Performance Year 3']) || 3,
            ],
            perfScore: parseFloat(row['Performance Score'] || row['Perf Score']) || 3,
            perfLevel: row['Performance Level'] || row['Perf Level'] || 'Medium',
            potScore: parseFloat(row['Potential Score'] || row['Pot Score']) || 3,
            potLevel: row['Potential Level'] || row['Pot Level'] || 'Medium',
            learningAgility: parseFloat(row['Learning Agility']) || 3,
            strategicThinking: parseFloat(row['Strategic Thinking']) || 3,
            peopleLeadership: parseFloat(row['People Leadership']) || 3,
            flightRisk30: parseFloat(row['Flight Risk 30']) || Math.random() * 0.5,
            flightRisk60: parseFloat(row['Flight Risk 60']) || Math.random() * 0.6,
            flightRisk90: parseFloat(row['Flight Risk 90']) || Math.random() * 0.7,
            flightFactors: (row['Flight Factors'] || '').split(',').filter(Boolean),
            compaRatio: parseFloat(row['Compa Ratio']) || 1.0,
            mobility: row['Mobility'] || '',
            aspiration: row['Aspiration'] || '',
            skills: [],
            certifications: [],
            feedback360: parseFloat(row['360 Score']) || 3.5,
            readiness: row['Readiness'] || 'Not Assessed',
            successorFor: row['Successor For'] || '',
            developmentStatus: row['Dev Status'] || 'Not Started',
            mentorAssigned: row['Mentor'] === 'Yes',
            knowledgeRisk: parseFloat(row['Knowledge Risk']) || 0.3,
          }));

          // Try parsing roles sheet
          const roleSheet = wb.Sheets[wb.SheetNames.find(s => s.toLowerCase().includes('role')) || ''];
          if (roleSheet) {
            const roleData = XLSX.utils.sheet_to_json(roleSheet);
            roles = roleData.map((r, i) => ({
              id: r['Role ID'] || `R${i}`,
              title: r['Title'] || r['Role'] || '',
              tier: parseInt(r['Tier']) || 2,
              department: r['Department'] || '',
              plant: r['Plant'] || '',
              critical: r['Critical'] === 'Yes' || r['Critical'] === true,
              businessUnit: r['Business Unit'] || '',
              competencies: (r['Competencies'] || '').split(',').filter(Boolean),
            }));
          }

          // Try parsing succession sheet
          const succSheet = wb.Sheets[wb.SheetNames.find(s => s.toLowerCase().includes('succession')) || ''];
          if (succSheet) {
            const succData = XLSX.utils.sheet_to_json(succSheet);
            successionMap = succData.map(s => ({
              roleId: s['Role ID'] || '',
              roleTitle: s['Role'] || '',
              roleTier: parseInt(s['Tier']) || 2,
              rolePlant: s['Plant'] || '',
              roleDept: s['Department'] || '',
              employeeId: s['Employee ID'] || '',
              employeeName: s['Employee Name'] || '',
              readiness: s['Readiness'] || '',
              matchScore: parseFloat(s['Match Score']) || 0.5,
            }));
          }

          orgStructure = {
            departments: [...new Set(employees.map(e => e.department).filter(Boolean))],
            plants: [...new Set(employees.map(e => e.plant).filter(Boolean))],
            businessUnits: [...new Set(employees.map(e => e.businessUnit).filter(Boolean))],
          };

          notify();
          resolve({ total: employees.length, roles: roles.length, mappings: successionMap.length });
        } catch (err) {
          reject(err.message || 'Failed to parse Excel file');
        }
      };
      reader.onerror = () => reject('Failed to read file');
      reader.readAsArrayBuffer(file);
    });
  }

  function generateTemplate() {
    const wb = XLSX.utils.book_new();

    // Employees sheet
    const empHeaders = ['Employee ID', 'First Name', 'Last Name', 'Department', 'Plant', 'Business Unit', 'Role', 'Grade', 'Hire Date', 'Tenure', 'Age', 'Gender', 'Education', 'Perf Y1', 'Perf Y2', 'Perf Y3', 'Performance Score', 'Performance Level', 'Potential Score', 'Potential Level', 'Learning Agility', 'Strategic Thinking', 'People Leadership', 'Flight Risk 30', 'Flight Risk 60', 'Flight Risk 90', 'Flight Factors', 'Compa Ratio', 'Mobility', 'Aspiration', '360 Score', 'Readiness', 'Successor For', 'Dev Status', 'Mentor', 'Knowledge Risk'];
    const empSample = [['EMP1001', 'Rajesh', 'Sharma', 'Production', 'Plant A — Pune', 'Manufacturing', 'Production Manager', 'L5', '2018-03-15', 7, 42, 'Male', 'B.Tech', 4.2, 3.8, 4.0, 4.0, 'High', 3.9, 'High', 4.1, 3.7, 3.5, 0.25, 0.35, 0.42, 'Market demand', 1.05, 'Open to relocation', 'Plant Head', 4.1, 'Ready Now', 'Plant Head', 'On Track', 'Yes', 0.3]];
    const empWs = XLSX.utils.aoa_to_sheet([empHeaders, ...empSample]);
    XLSX.utils.book_append_sheet(wb, empWs, 'Employees');

    // Roles sheet
    const roleHeaders = ['Role ID', 'Title', 'Tier', 'Department', 'Plant', 'Business Unit', 'Critical', 'Competencies'];
    const roleSample = [['R01', 'Plant Head', 1, 'Production', 'Plant A — Pune', 'Manufacturing', 'Yes', 'Leadership,Lean Manufacturing,OEE Optimization']];
    const roleWs = XLSX.utils.aoa_to_sheet([roleHeaders, ...roleSample]);
    XLSX.utils.book_append_sheet(wb, roleWs, 'Roles');

    // Succession sheet
    const succHeaders = ['Role ID', 'Role', 'Tier', 'Plant', 'Department', 'Employee ID', 'Employee Name', 'Readiness', 'Match Score'];
    const succSample = [['R01', 'Plant Head', 1, 'Plant A — Pune', 'Production', 'EMP1001', 'Rajesh Sharma', 'Ready Now', 0.92]];
    const succWs = XLSX.utils.aoa_to_sheet([succHeaders, ...succSample]);
    XLSX.utils.book_append_sheet(wb, succWs, 'Succession');

    // Org Structure sheet
    const orgHeaders = ['Department', 'Plant', 'Business Unit'];
    const orgWs = XLSX.utils.aoa_to_sheet([orgHeaders, ['Production', 'Plant A — Pune', 'Manufacturing']]);
    XLSX.utils.book_append_sheet(wb, orgWs, 'Org Structure');

    XLSX.writeFile(wb, 'TalentForge_Template.xlsx');
  }

  function clearAll() {
    employees = [];
    roles = [];
    successionMap = [];
    orgStructure = { departments: [], plants: [], businessUnits: [] };
    auditLog = [];
    notify();
  }

  function subscribe(fn) { listeners.push(fn); }
  function notify() { listeners.forEach(fn => fn()); }

  function getEmployees() { return employees; }
  function getRoles() { return roles; }
  function getSuccessionMap() { return successionMap; }
  function getOrgStructure() { return orgStructure; }
  function getAuditLog() { return auditLog; }
  function getEmployee(id) { return employees.find(e => e.id === id); }
  function hasData() { return employees.length > 0; }

  return {
    generateDemo, parseExcel, generateTemplate, clearAll,
    subscribe, getEmployees, getRoles, getSuccessionMap,
    getOrgStructure, getAuditLog, getEmployee, hasData,
  };
})();
