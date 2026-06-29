import { useNavigate, useParams } from 'react-router-dom'

const COURSE_DATA = {
  'advanced-system-design': {
    title: 'Advanced System Design Simulation',
    categoryLabel: 'System Design',
    categoryColor: 'bg-cyan-100 text-cyan-700',
    level: 'Mastery',
    description: 'Navigate complex technical architectures and lead engineering teams with confidence. This simulation puts you in the role of a Lead PM at a high-growth tech company tasked with scaling a legacy billing system to support global expansion.',
    lessons: 12,
    hours: '4.5h',
    meta: ['2 peer reviews', '7 cohort editions'],
    startRoute: '/simulations',
    curriculum: [
      { week: 1, title: 'System Scalability Fundamentals', desc: 'Distributed systems thinking for PMs.', icon: '⚙️' },
      { week: 2, title: 'API Design for Non-Engineers', desc: 'Designing clear interfaces that facilitate developer productivity.', icon: '🔌' },
      { week: 3, title: 'Database Selection Strategies', desc: 'Performance implications of SQL vs NoSQL decisions.', icon: '🗄️' },
      { week: 4, title: 'Managing Technical Debt', desc: 'Frameworks for prioritizing engineering maintenance against new features.', icon: '📋' },
    ],
    objectives: [
      'Architect global systems capable of handling 10M+ concurrent users.',
      'Draft comprehensive Technical Requirements Documents (TRDs).',
      'Confidently mediate technical disputes between Product and Engineering.',
      'Evaluate vendor APIs and cloud infrastructure for long-term viability.',
    ],
    prerequisites: [
      'Basic understanding of software development lifecycle',
      'Familiarity with agile business models',
      'No prior coding experience required',
      'Comfort with technical terminology is beneficial',
    ],
    targetAudience: ['Senior Product Managers', 'Aspiring Technical PMs', 'Engineering Leads transitioning to Product'],
    certTitle: 'Systems Architect',
    certDesc: "Earn a verifiable 'Systems Architect' badge upon completion to display on your profile and LinkedIn.",
    mentor: { name: 'Sarah', title: 'AI System Design Expert', desc: 'Sarah will review your technical decisions, provide feedback on your PRDs, and guide you through the simulation with real-time insights.' },
    stats: [
      { label: 'Enrolled Learners', value: '2,847' },
      { label: 'Completion Rate', value: '78%' },
      { label: 'Avg. Rating', value: '4.9 / 5' },
      { label: 'Certifications Issued', value: '1,204' },
    ],
  },

  'da-job-sim': {
    title: 'Junior Data Analyst Job Simulation',
    categoryLabel: 'Data Analytics',
    categoryColor: 'bg-orange-100 text-orange-700',
    level: 'Beginner → Intermediate',
    description: "You won't watch lectures. You'll do the actual work a junior analyst does in their first 90 days: clean messy real-world data, build a performance report leadership actually reads, segment customers, evaluate an experiment, and turn it all into a recommendation an executive will act on. Every task mirrors a real ticket from your manager, Priya Nair.",
    lessons: 6,
    hours: '5–6h',
    meta: ['Tool-optional: Excel, SQL, or Python', 'Self-paced, mastery-based'],
    startRoute: '/simulations/da-job-sim',
    curriculum: [
      { week: 0, title: 'Onboarding — Welcome to Growth & Analytics', desc: 'Meet your manager Priya Nair, load lumen_orders.csv in your tool of choice, and read your first ticket.', icon: '👋' },
      { week: 1, title: 'Task 1 — Clean the Data & Run an EDA', desc: 'Profile and clean 18 months of messy order data. Build a data-quality log that documents every decision.', icon: '🧹' },
      { week: 2, title: 'Task 2 — Build the Sales Performance Report', desc: 'Calculate headline KPIs (Revenue, AOV, Units/Order), break down by channel and category, and make it exec-readable in 30 seconds.', icon: '📊' },
      { week: 3, title: 'Task 3 — Segment the Customers (RFM)', desc: 'Score every customer on Recency, Frequency, and Monetary value. Name actionable segments and recommend what to do with each.', icon: '🎯' },
      { week: 4, title: 'Task 4 — Read the A/B Test', desc: "Evaluate a free-shipping threshold experiment. Ship it, or kill it — and explain why to the growth PM who's certain it worked.", icon: '🧪' },
      { week: 5, title: 'Task 5 — Brief the Executive', desc: 'Synthesize everything into a one-page VP memo. Lead with the recommendation, support with the data, keep the jargon out.', icon: '📋' },
    ],
    objectives: [
      'Audit and clean a messy operational dataset, justifying every cleaning decision.',
      'Define and calculate the KPIs a retail/e-commerce business runs on.',
      'Segment a customer base using RFM analysis and translate segments into actions.',
      "Read an A/B test correctly — including knowing when not to ship.",
      'Communicate findings to non-technical stakeholders in plain business language.',
    ],
    prerequisites: [
      'Comfort with basic spreadsheets',
      'SQL or Python helpful but not required',
      'No prior analytics role experience needed',
      'Works in Excel, Google Sheets, SQL, or Python',
    ],
    targetAudience: ['Aspiring Data Analysts', 'Recent graduates in business, statistics, or CS', 'Career switchers entering analytics', 'Analysts wanting portfolio projects'],
    certTitle: 'Junior Data Analyst',
    certDesc: "Earn a verifiable 'Junior Data Analyst' badge and a portfolio-ready deliverables package upon completion.",
    mentor: { name: 'Priya Nair', title: 'AI Analytics Manager', desc: "Priya will review your data quality log, push back on weak reasoning, and give you the same feedback a real analytics manager would — every number you give leadership, you should be able to explain." },
    stats: [
      { label: 'Enrolled Learners', value: '1,234' },
      { label: 'Completion Rate', value: '82%' },
      { label: 'Avg. Rating', value: '4.8 / 5' },
      { label: 'Certifications Issued', value: '891' },
    ],
  },
}

export default function CourseDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const course = COURSE_DATA[id]

  if (!course) {
    return (
      <div className="max-w-container mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-6">
          <button className="hover:text-primary" onClick={() => navigate('/courses')}>Courses</button>
          <span>/</span>
          <span className="text-on-surface">Course Details</span>
        </div>
        <div className="text-center py-24">
          <p className="text-on-surface-variant text-sm mb-3">Full course details coming soon.</p>
          <button onClick={() => navigate('/courses')} className="btn-secondary text-xs px-4 py-2">← Back to Catalog</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-6">
        <button className="hover:text-primary" onClick={() => navigate('/courses')}>Courses</button>
        <span>/</span>
        <span className="text-on-surface">{course.title}</span>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main content */}
        <div className="col-span-2">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`chip ${course.categoryColor}`}>{course.categoryLabel}</span>
              <span className="chip">{course.level} Level</span>
            </div>
            <h1 className="text-3xl font-bold text-on-surface mb-3 leading-tight">{course.title}</h1>
            <p className="text-on-surface-variant leading-relaxed mb-4">{course.description}</p>
            <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-6 flex-wrap">
              <span className="flex items-center gap-1.5"><span>📖</span> {course.lessons} modules</span>
              <span className="flex items-center gap-1.5"><span>⏱️</span> {course.hours}</span>
              {course.meta.map((m, i) => (
                <span key={i} className="flex items-center gap-1.5"><span>✏️</span> {m}</span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-primary px-6 py-2.5" onClick={() => navigate(course.startRoute)}>
                Start Simulation
              </button>
              <button className="btn-secondary px-4 py-2.5">Save to Library</button>
            </div>
          </div>

          {/* Curriculum */}
          <div className="card mb-6">
            <h2 className="text-lg font-bold text-on-surface mb-4">Curriculum Breakdown</h2>
            <div className="space-y-0">
              {course.curriculum.map((item, i) => (
                <div key={i} className={`flex items-start gap-4 py-4 ${i < course.curriculum.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="w-8 h-8 bg-surface-low rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {item.week}
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">{item.title}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                  </div>
                  <span className="ml-auto text-lg">{item.icon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="card mb-6">
            <h2 className="text-lg font-bold text-on-surface mb-4">Learning Objectives</h2>
            <div className="grid grid-cols-2 gap-3">
              {course.objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-surface-low rounded-lg">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  </div>
                  <p className="text-sm text-on-surface leading-snug">{obj}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisites */}
          <div className="card">
            <h2 className="text-lg font-bold text-on-surface mb-3">Prerequisites</h2>
            <div className="flex flex-wrap gap-2">
              {course.prerequisites.map((p, i) => (
                <span key={i} className="chip">{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-1 space-y-4">
          {/* Target Audience */}
          <div className="card">
            <span className="section-label">Target Audience</span>
            <ul className="mt-3 space-y-2">
              {course.targetAudience.map((t, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-on-surface">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Certification */}
          <div className="card border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-bold text-on-surface text-sm">Professional Certification</p>
                <p className="text-xs text-on-surface-variant">{course.certDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-xs font-semibold text-green-700">Industry Recognized</span>
            </div>
          </div>

          {/* AI Mentor */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div>
                <p className="font-semibold text-on-surface text-sm">AI Mentor: {course.mentor.name}</p>
                <p className="text-xs text-on-surface-variant">{course.mentor.title}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">{course.mentor.desc}</p>
            <button className="btn-secondary w-full mt-3 text-xs py-2">Schedule Mentoring Session</button>
          </div>

          {/* Stats */}
          <div className="card">
            <span className="section-label">Course Stats</span>
            <div className="mt-3 space-y-2">
              {course.stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">{stat.label}</span>
                  <span className="font-semibold text-on-surface">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 border-t border-border pt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <span>WorkLearn AI</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Terms of Service</a>
          <a href="#" className="hover:text-primary">Privacy Policy</a>
          <a href="#" className="hover:text-primary">Help Center</a>
          <a href="#" className="hover:text-primary">Support</a>
        </div>
        <span>© 2025 WorkLearn AI. All rights reserved.</span>
      </footer>
    </div>
  )
}
