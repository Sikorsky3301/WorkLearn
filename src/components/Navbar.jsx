import { useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

// ── Simulations dropdown ──────────────────────────────────────────────────
const simItems = [
  {
    label: 'My Simulations',
    badge: 'Enrolled',
    desc: 'Continue your active and enrolled simulations.',
    to: '/simulations',
    color: 'text-primary bg-primary/10',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    label: 'Job Simulations',
    desc: 'Real-world workplace scenarios and projects.',
    to: '/courses?type=simulation',
    color: 'text-indigo-600 bg-indigo-50',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  },
  {
    label: 'Coding Simulations',
    desc: 'Hands-on technical challenges and DSA problems.',
    to: '/courses?type=coding',
    color: 'text-blue-600 bg-blue-50',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  },
]

// ── Courses mega-menu ─────────────────────────────────────────────────────
const mainCourses = [
  { label: 'Product Management', desc: 'Ace product interviews from strategy cases to technical skills.', abbr: 'PM', color: 'bg-indigo-100 text-indigo-700', to: '/courses?category=pm', badge: 'New' },
  { label: 'Engineering Management', desc: 'Review key leadership and people management skills.', abbr: 'EM', color: 'bg-violet-100 text-violet-700', to: '/courses?category=em' },
  { label: 'Software Engineering', desc: 'Learn essential strategies for coding problems and more.', abbr: 'SWE', color: 'bg-blue-100 text-blue-700', to: '/courses?category=swe' },
  { label: 'System Design', desc: 'Define architectures, interfaces, and databases in a time crunch.', abbr: 'SD', color: 'bg-cyan-100 text-cyan-700', to: '/courses?category=sd' },
  { label: 'Data Science', desc: 'Execute statistical techniques and experimentation effectively.', abbr: 'DS', color: 'bg-teal-100 text-teal-700', to: '/courses?category=ds' },
  { label: 'Machine Learning', desc: 'Review building, evaluating, and deploying AI/ML models.', abbr: 'ML', color: 'bg-emerald-100 text-emerald-700', to: '/courses?category=ml' },
  { label: 'Data Engineering', desc: 'Design complex data models and ETL pipelines.', abbr: 'DE', color: 'bg-amber-100 text-amber-700', to: '/courses?category=de' },
  { label: 'Data Analytics', desc: 'Translate data into actionable insights and business decisions.', abbr: 'DA', color: 'bg-orange-100 text-orange-700', to: '/courses?category=da' },
]

const moreCourses = [
  'Generative AI', 'Security Engineer', 'Eng Behavioral', 'TPM',
  'Solutions Architect', 'UX / Product Design', 'BizOps & Strategy', 'SQL Interviews',
]

// ── Notifications ─────────────────────────────────────────────────────────
const notifications = [
  { id: 1, type: 'manager', title: 'AI Manager Morning Standup', body: "Today's sprint: 3 objectives ready. Start your daily review.", time: '8:00 AM', unread: true },
  { id: 2, type: 'eval', title: 'Evaluation Complete', body: "Your Q3 Systems Optimization was scored — 94/100.", time: '7:42 AM', unread: true },
  { id: 3, type: 'mentor', title: 'Session in 30 minutes', body: "AI Mentor session: Doubt Review + Q3 Goal Planning starts at 4:00 PM.", time: '3:30 PM', unread: false },
  { id: 4, type: 'gps', title: 'Skill GPS Update', body: "New recommendation: Advanced Stakeholder Management simulation added to your roadmap.", time: 'Yesterday', unread: false },
  { id: 5, type: 'cohort', title: 'Cohort Milestone', body: "Priya S. just earned Expert badge in Data Literacy!", time: '2 days ago', unread: false },
]

const notifIcons = {
  manager: { bg: 'bg-primary', char: 'AI' },
  eval: { bg: 'bg-green-600', char: '✓' },
  mentor: { bg: 'bg-violet-600', char: 'M' },
  gps: { bg: 'bg-teal-600', char: '◎' },
  cohort: { bg: 'bg-amber-500', char: '★' },
}

const XP_TOTAL = 2450
const XP_NEXT_LEVEL = 3000
const LEVEL = 7
const xpPct = Math.round((XP_TOTAL / XP_NEXT_LEVEL) * 100)

const chevron = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

export default function Navbar() {
  const navigate = useNavigate()
  const [courseOpen, setCourseOpen] = useState(false)
  const [simOpen, setSimOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifList, setNotifList] = useState(notifications)
  const courseRef = useRef(null)
  const simRef = useRef(null)
  const isCoursesActive = window.location.pathname.startsWith('/courses')
  const isSimActive = window.location.pathname.startsWith('/simulations')
  const unreadCount = notifList.filter(n => n.unread).length

  function openCourse() { clearTimeout(courseRef.current); setCourseOpen(true) }
  function closeCourse() { courseRef.current = setTimeout(() => setCourseOpen(false), 120) }
  function openSim() { clearTimeout(simRef.current); setSimOpen(true) }
  function closeSim() { simRef.current = setTimeout(() => setSimOpen(false), 120) }

  function markAllRead() { setNotifList(n => n.map(x => ({ ...x, unread: false }))) }

  const navLink = ({ isActive }) =>
    `px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${isActive ? 'text-primary font-semibold bg-surface-low' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-low'}`

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      {/* XP progress strip */}
      <div className="h-0.5 bg-surface-high w-full">
        <div className="h-full bg-primary transition-all" style={{ width: `${xpPct}%` }} />
      </div>

      <div className="max-w-container mx-auto px-6 flex items-center gap-1" style={{ height: 52 }}>
        {/* Logo */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 shrink-0 mr-4">
          <img src={logo} alt="WorkLearn" className="w-8 h-8 rounded object-cover" />
          <span className="font-bold text-on-surface text-sm tracking-tight">WorkLearn</span>
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          <NavLink to="/dashboard" className={navLink}>Dashboard</NavLink>

          {/* ── Courses mega-menu ── */}
          <div className="relative" onMouseEnter={openCourse} onMouseLeave={closeCourse}>
            <button className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${isCoursesActive ? 'text-primary font-semibold bg-surface-low' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-low'}`}>
              Courses
              <span className={`transition-transform duration-150 inline-flex ${courseOpen ? 'rotate-180' : ''}`}>{chevron}</span>
            </button>

            {courseOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 bg-white border border-border rounded-xl shadow-xl z-50 flex"
                style={{ width: 680 }}
                onMouseEnter={openCourse} onMouseLeave={closeCourse}
              >
                {/* Left — main course cards */}
                <div className="flex-1 p-4">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3 px-1">Courses</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {mainCourses.map(c => (
                      <button
                        key={c.label}
                        onClick={() => { navigate(c.to); setCourseOpen(false) }}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-low transition-colors text-left group"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${c.color}`}>
                          {c.abbr}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors leading-none">{c.label}</p>
                            {c.badge && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">{c.badge}</span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant leading-snug">{c.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px bg-border my-4" />

                {/* Right — more courses */}
                <div className="w-52 p-4 shrink-0">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3 px-1">More Courses</p>
                  <div className="space-y-0.5">
                    {moreCourses.map(name => (
                      <button
                        key={name}
                        onClick={() => { navigate(`/courses?category=${name.toLowerCase().replace(/[\s/]/g, '-')}`); setCourseOpen(false) }}
                        className="w-full text-left px-2 py-2 rounded-lg text-sm text-on-surface-variant hover:text-primary hover:bg-surface-low transition-colors font-medium"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => { navigate('/courses'); setCourseOpen(false) }}
                      className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                    >
                      View all courses
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Simulations dropdown ── */}
          <div className="relative" onMouseEnter={openSim} onMouseLeave={closeSim}>
            <button className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${isSimActive ? 'text-primary font-semibold bg-surface-low' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-low'}`}>
              Simulations
              <span className={`transition-transform duration-150 inline-flex ${simOpen ? 'rotate-180' : ''}`}>{chevron}</span>
            </button>

            {simOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-border rounded-xl shadow-xl py-2 z-50"
                onMouseEnter={openSim} onMouseLeave={closeSim}
              >
                <p className="px-3 pt-1 pb-2 text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Simulations</p>
                {simItems.map(item => (
                  <button
                    key={item.label}
                    onClick={() => { navigate(item.to); setSimOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-low transition-colors text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{item.label}</p>
                        {item.badge && (
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full leading-none">{item.badge}</span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant leading-tight">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Simple nav links */}
          {[
            { label: 'Skill GPS', to: '/skill-gps' },
            { label: 'AI Mentor', to: '/ai-mentor' },
            { label: 'Portfolio', to: '/portfolio' },
            { label: 'Community', to: '/community' },
          ].map(item => (
            <NavLink key={item.to} to={item.to} className={navLink}>{item.label}</NavLink>
          ))}
        </nav>

        {/* Right */}
        <div className="ml-auto flex items-center gap-2.5">
          {/* XP Level badge */}
          <button onClick={() => navigate('/analytics')} className="flex items-center gap-1.5 bg-surface-low border border-border rounded-full px-2.5 py-1 hover:border-primary transition-colors">
            <span className="text-xs font-bold text-primary">Lv.{LEVEL}</span>
            <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${xpPct}%` }} />
            </div>
            <span className="text-xs text-on-surface-variant">{XP_TOTAL.toLocaleString()} XP</span>
          </button>

          {/* Search */}
          <input type="text" placeholder="Search..." className="input w-36 text-xs py-1.5" />

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setNotifOpen(v => !v)}
              className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-low transition-colors">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-lg z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="text-sm font-bold text-on-surface">Notifications</p>
                  <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:underline">Mark all read</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifList.map(n => {
                    const cfg = notifIcons[n.type]
                    return (
                      <div key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-low cursor-pointer transition-colors ${n.unread ? 'bg-primary/2' : ''}`}
                        onClick={() => setNotifList(list => list.map(x => x.id === n.id ? { ...x, unread: false } : x))}>
                        <div className={`w-8 h-8 ${cfg.bg} rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold`}>{cfg.char}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-on-surface">{n.title}</p>
                            {n.unread && <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />}
                          </div>
                          <p className="text-xs text-on-surface-variant leading-snug mt-0.5">{n.body}</p>
                          <p className="text-xs text-on-surface-variant mt-1 opacity-60">{n.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-border">
                  <button className="text-xs text-primary font-semibold hover:underline">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* Avatar → Settings */}
          <button onClick={() => navigate('/settings')} className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
            <span className="text-white text-xs font-bold">R</span>
          </button>
        </div>
      </div>
    </header>
  )
}
