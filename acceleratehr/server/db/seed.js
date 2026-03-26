import { v4 as uuid } from 'uuid';

export function seedDatabase(db) {
  const hasData = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (hasData.count > 0) return;

  // Settings
  const settings = {
    portal_title: 'AccelerateHR',
    portal_tagline: 'Your HR Intelligence Platform',
    company_name: 'AccelerateHR',
    contact_email: 'info@acceleratehr.com',
    admin_password_hash: 'AccelerateHR2024!',
  };
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(settings)) {
    insertSetting.run(key, value);
  }

  // Domains
  const insertDomain = db.prepare('INSERT INTO domains (id, label, color, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
  const defaultDomains = [
    { id: 'workforce_planning', label: 'Workforce Planning', color: '#3B82F6', icon: 'Users' },
    { id: 'talent_acquisition', label: 'Talent Acquisition', color: '#8B5CF6', icon: 'Target' },
    { id: 'people_development', label: 'People Development', color: '#10B981', icon: 'GraduationCap' },
    { id: 'compensation_benefits', label: 'Compensation & Benefits', color: '#F59E0B', icon: 'DollarSign' },
    { id: 'hr_operations', label: 'HR Operations', color: '#EC4899', icon: 'Settings' },
    { id: 'diversity_inclusion', label: 'Diversity & Inclusion', color: '#06B6D4', icon: 'Heart' },
  ];
  defaultDomains.forEach((d, i) => insertDomain.run(d.id, d.label, d.color, d.icon, i));

  // Data Models
  const insertModel = db.prepare(`
    INSERT INTO data_models (id, title, domain, description, entities, relationships, tags, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const models = [
    {
      title: 'Workforce Planning Model',
      domain: 'workforce_planning',
      description: 'Comprehensive data structures for headcount forecasting, organizational design, and strategic workforce planning. This model enables scenario-based modeling for FTE projections, budget allocation, and resource optimization across business units.',
      entities: JSON.stringify([
        { name: 'Employee', fields: ['employee_id (UUID)', 'full_name (STRING)', 'hire_date (DATE)', 'status (ENUM)', 'department_id (FK)'] },
        { name: 'Position', fields: ['position_id (UUID)', 'title (STRING)', 'grade_level (INT)', 'cost_center (STRING)', 'is_active (BOOL)'] },
        { name: 'Headcount Plan', fields: ['plan_id (UUID)', 'fiscal_year (INT)', 'org_unit_id (FK)', 'planned_hc (INT)', 'actual_hc (INT)'] },
        { name: 'Org Unit', fields: ['unit_id (UUID)', 'name (STRING)', 'parent_unit_id (FK)', 'leader_id (FK)', 'level (INT)'] },
        { name: 'Scenario', fields: ['scenario_id (UUID)', 'name (STRING)', 'type (ENUM)', 'base_plan_id (FK)', 'assumptions (JSON)'] },
        { name: 'Budget', fields: ['budget_id (UUID)', 'plan_id (FK)', 'category (ENUM)', 'amount (DECIMAL)', 'currency (STRING)'] },
      ]),
      relationships: JSON.stringify([
        'Employee → Position (many-to-one)',
        'Position → Org Unit (many-to-one)',
        'Headcount Plan → Org Unit (many-to-one)',
        'Scenario → Headcount Plan (many-to-one)',
        'Budget → Headcount Plan (one-to-one)',
      ]),
      tags: JSON.stringify(['Forecasting', 'FTE', 'Budgeting', 'Org Design', 'Scenario Planning']),
    },
    {
      title: 'Talent Acquisition Model',
      domain: 'talent_acquisition',
      description: 'End-to-end recruitment data model covering the full hiring lifecycle from requisition creation through candidate sourcing, interview management, offer negotiation, and onboarding handoff. Supports funnel analytics and sourcing effectiveness measurement.',
      entities: JSON.stringify([
        { name: 'Requisition', fields: ['req_id (UUID)', 'title (STRING)', 'department_id (FK)', 'priority (ENUM)', 'target_date (DATE)'] },
        { name: 'Candidate', fields: ['candidate_id (UUID)', 'name (STRING)', 'email (STRING)', 'source (ENUM)', 'skills (JSON)'] },
        { name: 'Application', fields: ['application_id (UUID)', 'candidate_id (FK)', 'req_id (FK)', 'status (ENUM)', 'applied_date (DATE)'] },
        { name: 'Interview', fields: ['interview_id (UUID)', 'application_id (FK)', 'interviewer_id (FK)', 'score (INT)', 'feedback (TEXT)'] },
        { name: 'Offer', fields: ['offer_id (UUID)', 'application_id (FK)', 'salary (DECIMAL)', 'status (ENUM)', 'expiry_date (DATE)'] },
        { name: 'Onboarding', fields: ['onboard_id (UUID)', 'employee_id (FK)', 'start_date (DATE)', 'buddy_id (FK)', 'checklist (JSON)'] },
      ]),
      relationships: JSON.stringify([
        'Candidate → Application (one-to-many)',
        'Requisition → Application (one-to-many)',
        'Application → Interview (one-to-many)',
        'Application → Offer (one-to-one)',
        'Offer → Onboarding (one-to-one)',
      ]),
      tags: JSON.stringify(['Recruitment', 'ATS', 'Funnel', 'Sourcing', 'Onboarding']),
    },
    {
      title: 'People Development Model',
      domain: 'people_development',
      description: 'Tracks employee learning journeys, skill acquisition, performance signals, and career progression. Supports competency mapping, training ROI analysis, and succession planning through integrated development data.',
      entities: JSON.stringify([
        { name: 'Employee', fields: ['employee_id (UUID)', 'full_name (STRING)', 'current_role (STRING)', 'manager_id (FK)', 'career_track (ENUM)'] },
        { name: 'Skill', fields: ['skill_id (UUID)', 'name (STRING)', 'category (ENUM)', 'proficiency_scale (INT)', 'is_critical (BOOL)'] },
        { name: 'Learning Path', fields: ['path_id (UUID)', 'title (STRING)', 'target_role (STRING)', 'duration_weeks (INT)', 'modules (JSON)'] },
        { name: 'Training', fields: ['training_id (UUID)', 'employee_id (FK)', 'path_id (FK)', 'status (ENUM)', 'completion_date (DATE)'] },
        { name: 'Certification', fields: ['cert_id (UUID)', 'employee_id (FK)', 'name (STRING)', 'issuer (STRING)', 'expiry_date (DATE)'] },
        { name: 'Goal', fields: ['goal_id (UUID)', 'employee_id (FK)', 'title (STRING)', 'target_date (DATE)', 'progress_pct (INT)'] },
      ]),
      relationships: JSON.stringify([
        'Employee → Skill (many-to-many via EmployeeSkill)',
        'Employee → Training (one-to-many)',
        'Learning Path → Training (one-to-many)',
        'Employee → Certification (one-to-many)',
        'Employee → Goal (one-to-many)',
      ]),
      tags: JSON.stringify(['Learning', 'Skills', 'Performance', 'Career', 'L&D']),
    },
    {
      title: 'Compensation & Benefits Model',
      domain: 'compensation_benefits',
      description: 'Structured data model for total rewards management including base pay, variable compensation, equity grants, and benefits enrollment. Supports pay equity analysis, market benchmarking, and compensation planning cycles.',
      entities: JSON.stringify([
        { name: 'Employee', fields: ['employee_id (UUID)', 'full_name (STRING)', 'job_family (STRING)', 'location (STRING)', 'hire_date (DATE)'] },
        { name: 'Compensation Band', fields: ['band_id (UUID)', 'grade (STRING)', 'min_salary (DECIMAL)', 'mid_salary (DECIMAL)', 'max_salary (DECIMAL)'] },
        { name: 'Bonus', fields: ['bonus_id (UUID)', 'employee_id (FK)', 'type (ENUM)', 'amount (DECIMAL)', 'payout_date (DATE)'] },
        { name: 'Benefit Plan', fields: ['plan_id (UUID)', 'name (STRING)', 'type (ENUM)', 'provider (STRING)', 'annual_cost (DECIMAL)'] },
        { name: 'Pay Grade', fields: ['grade_id (UUID)', 'level (INT)', 'title (STRING)', 'band_id (FK)', 'market_data (JSON)'] },
      ]),
      relationships: JSON.stringify([
        'Employee → Compensation Band (many-to-one via Pay Grade)',
        'Employee → Bonus (one-to-many)',
        'Employee → Benefit Plan (many-to-many via Enrollment)',
        'Pay Grade → Compensation Band (many-to-one)',
      ]),
      tags: JSON.stringify(['Compensation', 'Benefits', 'Pay Equity', 'Total Rewards', 'Benchmarking']),
    },
  ];
  models.forEach((m, i) => {
    insertModel.run(uuid(), m.title, m.domain, m.description, m.entities, m.relationships, m.tags, i);
  });

  // Dashboards
  const insertDash = db.prepare(`
    INSERT INTO dashboards (id, title, domain, description, embed_url, status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const dashboards = [
    {
      title: 'Workforce Planning Dashboard',
      domain: 'workforce_planning',
      description: 'Executive view of global headcount distribution, attrition trends, and FTE budget tracking. Includes scenario comparison overlays and org-level drill-downs.',
      embed_url: '',
      status: 'live',
    },
    {
      title: 'Talent Acquisition Dashboard',
      domain: 'talent_acquisition',
      description: 'Real-time recruitment funnel analytics with sourcing channel effectiveness, time-to-fill trends, and offer acceptance rate monitoring.',
      embed_url: '',
      status: 'live',
    },
    {
      title: 'People Development Dashboard',
      domain: 'people_development',
      description: 'Learning completion rates, skill gap heatmaps, and career progression tracking across the organization.',
      embed_url: '',
      status: 'preview',
    },
  ];
  dashboards.forEach((d, i) => {
    insertDash.run(uuid(), d.title, d.domain, d.description, d.embed_url, d.status, i);
  });

  // AI Use Cases
  const insertAI = db.prepare(`
    INSERT INTO ai_use_cases (id, title, icon, description, tags, demo_url, has_builtin_demo, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const aiUseCases = [
    { title: 'Job Description Generator', icon: '📝', description: 'Generate inclusive, skills-based job descriptions from role titles, seniority level, and department context. Powered by Claude AI.', tags: JSON.stringify(['Recruitment', 'AI', 'Content Generation']), demo_url: '', has_builtin_demo: 1 },
    { title: 'Performance & Skills Review', icon: '📊', description: 'Transform raw feedback notes and assessment data into structured, actionable development plans with clear growth trajectories.', tags: JSON.stringify(['Performance', 'Development', 'AI']), demo_url: '', has_builtin_demo: 0 },
    { title: 'Interview Question Builder', icon: '🎯', description: 'Generate role-specific, competency-aligned interview questions with scoring rubrics and follow-up prompts.', tags: JSON.stringify(['Recruitment', 'Interview', 'AI']), demo_url: '', has_builtin_demo: 0 },
    { title: 'Onboarding Plan Generator', icon: '🚀', description: 'Create personalized 30-60-90 day onboarding plans based on role, department, and seniority level.', tags: JSON.stringify(['Onboarding', 'Planning', 'AI']), demo_url: '', has_builtin_demo: 0 },
    { title: 'Succession Planning Analyzer', icon: '🏗️', description: 'Identify succession gaps, map potential successors, and generate readiness assessments for critical roles.', tags: JSON.stringify(['Succession', 'Strategy', 'AI']), demo_url: '', has_builtin_demo: 0 },
    { title: 'Salary Benchmarking Assistant', icon: '💰', description: 'Compare compensation packages against market data and generate equity-adjusted recommendations.', tags: JSON.stringify(['Compensation', 'Benchmarking', 'AI']), demo_url: '', has_builtin_demo: 0 },
  ];
  aiUseCases.forEach((a, i) => {
    insertAI.run(uuid(), a.title, a.icon, a.description, a.tags, a.demo_url, a.has_builtin_demo, i);
  });

  // KPIs
  const insertKPI = db.prepare(`
    INSERT INTO kpis (id, name, domain, definition, formula, benchmark, frequency, importance, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const kpis = [
    // Talent Acquisition
    { name: 'Time to Fill', domain: 'talent_acquisition', definition: 'The average number of calendar days from when a job requisition is opened to when an offer is accepted by a candidate.', formula: 'SUM(Days from Req Open to Offer Accepted) / Number of Filled Positions', benchmark: 'Industry average: 30–45 days', frequency: 'Monthly', importance: 'Directly impacts hiring manager satisfaction and business agility. Long fill times increase opportunity costs and workload on existing staff.' },
    { name: 'Cost per Hire', domain: 'talent_acquisition', definition: 'Total recruitment costs divided by the number of hires in a given period. Includes advertising, agency fees, recruiter time, and technology costs.', formula: '(Internal Recruiting Costs + External Recruiting Costs) / Total Hires', benchmark: 'Industry average: $4,000–$5,000 per hire', frequency: 'Quarterly', importance: 'Key efficiency metric for talent acquisition budgeting and vendor management. Helps optimize channel spend.' },
    { name: 'Offer Acceptance Rate', domain: 'talent_acquisition', definition: 'The percentage of job offers extended that are accepted by candidates.', formula: '(Offers Accepted / Total Offers Extended) × 100', benchmark: 'Target: >85%', frequency: 'Monthly', importance: 'Reflects competitiveness of compensation, employer brand strength, and candidate experience quality.' },
    { name: 'Quality of Hire', domain: 'talent_acquisition', definition: 'Composite score measuring the value new hires bring, typically combining performance ratings, retention, and hiring manager satisfaction.', formula: '(Performance Score + Retention Rate + Manager Satisfaction) / 3', benchmark: 'Target: >80/100 composite score', frequency: 'Annually', importance: 'The ultimate measure of recruiting effectiveness. Links talent acquisition to business outcomes.' },
    // Workforce Planning
    { name: 'Voluntary Attrition Rate', domain: 'workforce_planning', definition: 'The rate at which employees voluntarily leave the organization over a specified period.', formula: '(Voluntary Separations / Average Headcount) × 100', benchmark: 'Industry average: 10–15% annually', frequency: 'Monthly', importance: 'Primary indicator of employee satisfaction, engagement, and organizational health. High voluntary attrition signals culture or compensation issues.' },
    { name: 'Involuntary Attrition Rate', domain: 'workforce_planning', definition: 'The rate of employee separations initiated by the employer, including terminations and layoffs.', formula: '(Involuntary Separations / Average Headcount) × 100', benchmark: 'Typical range: 3–5% annually', frequency: 'Monthly', importance: 'Monitors workforce quality management and organizational restructuring activity.' },
    { name: 'Regrettable Attrition Rate', domain: 'workforce_planning', definition: 'The percentage of voluntary leavers classified as high-performers or in critical roles that the organization would have preferred to retain.', formula: '(Regrettable Departures / Total Voluntary Departures) × 100', benchmark: 'Target: <30% of voluntary attrition', frequency: 'Quarterly', importance: 'The most strategically important attrition metric. Losing top talent has outsized impact on team performance and institutional knowledge.' },
    { name: 'Headcount Growth Rate', domain: 'workforce_planning', definition: 'Percentage change in total employee headcount over a given period.', formula: '((End Period HC - Start Period HC) / Start Period HC) × 100', benchmark: 'Varies by industry and growth stage', frequency: 'Quarterly', importance: 'Tracks organizational scaling velocity and alignment with business growth plans.' },
    // People Development
    { name: 'Training Completion Rate', domain: 'people_development', definition: 'The percentage of assigned training programs or courses completed within the specified timeframe.', formula: '(Completed Trainings / Assigned Trainings) × 100', benchmark: 'Target: >85%', frequency: 'Monthly', importance: 'Measures learning program engagement and compliance. Low rates indicate content relevance or accessibility issues.' },
    { name: 'Internal Mobility Rate', domain: 'people_development', definition: 'The share of open positions filled by internal candidates through transfers, promotions, or lateral moves.', formula: '(Internal Fills / Total Fills) × 100', benchmark: 'Best practice: >25%', frequency: 'Quarterly', importance: 'Indicates strength of career development pathways and talent marketplace maturity. Higher rates correlate with better retention.' },
    { name: 'Skills Gap Index', domain: 'people_development', definition: 'A composite score measuring the gap between current workforce skills and the skills needed to achieve strategic objectives.', formula: '(Critical Skills Required - Critical Skills Available) / Critical Skills Required × 100', benchmark: 'Target: <20% gap', frequency: 'Semi-annually', importance: 'Essential for workforce transformation planning. Drives L&D investment priorities and hiring strategy.' },
    { name: 'Promotion Rate', domain: 'people_development', definition: 'The percentage of employees who received a promotion during the measurement period.', formula: '(Promotions / Average Headcount) × 100', benchmark: 'Typical range: 8–12% annually', frequency: 'Annually', importance: 'Signals career growth opportunities and meritocratic advancement. Imbalances across demographics highlight equity concerns.' },
    // Compensation & Benefits
    { name: 'Compa-Ratio', domain: 'compensation_benefits', definition: 'The ratio of an employee\'s actual pay to the midpoint of their salary band, indicating pay competitiveness.', formula: 'Employee Salary / Salary Band Midpoint × 100', benchmark: 'Target range: 90–110%', frequency: 'Annually', importance: 'Core metric for pay equity and market competitiveness analysis. Deviations signal potential retention risk or overspend.' },
    { name: 'Pay Equity Index', domain: 'compensation_benefits', definition: 'A statistical measure of pay fairness across demographic groups (gender, ethnicity) controlling for role, level, and experience.', formula: 'Regression-adjusted pay gap controlling for legitimate factors', benchmark: 'Target: <2% unexplained gap', frequency: 'Annually', importance: 'Critical for regulatory compliance, employer brand, and DEI commitments. Increasingly scrutinized by investors and regulators.' },
    { name: 'Benefits Utilization Rate', domain: 'compensation_benefits', definition: 'The percentage of eligible employees actively enrolled in and using available benefit programs.', formula: '(Active Benefit Users / Eligible Employees) × 100', benchmark: 'Target: >70% for core benefits', frequency: 'Quarterly', importance: 'Measures ROI on benefits spend and employee awareness. Low utilization suggests communication gaps or misaligned offerings.' },
    { name: 'Total Rewards Competitiveness', domain: 'compensation_benefits', definition: 'Composite index comparing the organization\'s total compensation package (base + bonus + equity + benefits) against market benchmarks.', formula: 'Weighted average of compensation elements vs. market median', benchmark: 'Target: P50–P75 of market', frequency: 'Annually', importance: 'Holistic view of employer value proposition. Drives strategic decisions on where to invest in the rewards mix.' },
    // HR Operations
    { name: 'HR-to-Employee Ratio', domain: 'hr_operations', definition: 'The number of HR full-time equivalents per total employee headcount.', formula: 'HR FTEs / Total Employee Headcount × 1000', benchmark: 'Industry average: 1.4:100 (or 14 per 1000)', frequency: 'Annually', importance: 'Benchmarks HR function efficiency and informs HR operating model design and technology investment decisions.' },
    { name: 'HR Cost per FTE', domain: 'hr_operations', definition: 'Total HR department operating cost divided by the number of employees served.', formula: 'Total HR Operating Cost / Total FTEs', benchmark: 'Industry average: $2,500–$3,500 per FTE', frequency: 'Annually', importance: 'Key efficiency metric for HR transformation business cases. Tracks impact of automation and process improvement.' },
    { name: 'HR Ticket Resolution Time', domain: 'hr_operations', definition: 'Average time to resolve employee HR service requests from submission to closure.', formula: 'SUM(Resolution Time) / Total Tickets Resolved', benchmark: 'Target: <48 hours for standard requests', frequency: 'Monthly', importance: 'Measures HR service delivery quality and impacts employee experience. Long resolution times erode trust in HR.' },
    // Diversity & Inclusion
    { name: 'Diversity Hire Rate', domain: 'diversity_inclusion', definition: 'The percentage of new hires from underrepresented groups in a given period.', formula: '(Diverse Hires / Total Hires) × 100', benchmark: 'Target: proportional to labor market availability', frequency: 'Quarterly', importance: 'Tracks progress on diversity commitments and inclusive recruiting practices. Leading indicator of workforce composition change.' },
    { name: 'Inclusion Index', domain: 'diversity_inclusion', definition: 'Composite survey-based score measuring employees\' sense of belonging, psychological safety, and equitable treatment.', formula: 'Weighted average of inclusion survey dimensions', benchmark: 'Target: >75/100', frequency: 'Semi-annually', importance: 'Diversity without inclusion doesn\'t drive business outcomes. This metric ensures the environment supports diverse talent.' },
    { name: 'Gender Pay Gap', domain: 'diversity_inclusion', definition: 'The difference in median earnings between male and female employees, expressed as a percentage of male earnings.', formula: '(Male Median Pay - Female Median Pay) / Male Median Pay × 100', benchmark: 'Target: <5% unadjusted gap', frequency: 'Annually', importance: 'Regulatory requirement in many jurisdictions and a key transparency metric for stakeholders and ESG reporting.' },
  ];
  kpis.forEach((k, i) => {
    insertKPI.run(uuid(), k.name, k.domain, k.definition, k.formula, k.benchmark, k.frequency, k.importance, i);
  });
}
