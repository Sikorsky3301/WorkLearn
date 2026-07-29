import { useState } from 'react'

export default function Settings() {
  const [profile, setProfile] = useState({ name: 'Rishi Raj', email: 'rishirajidentity@gmail.com', role: 'Aspiring Product Manager', bio: 'Building expertise in AI & Enterprise Systems through immersive simulations.', linkedin: '', github: '' })
  const [pace, setPace] = useState('professional')
  const [standupTime, setStandupTime] = useState('08:00')
  const [darkMode, setDarkMode] = useState(false)
  const [notifs, setNotifs] = useState({ morning: true, evening: true, mentorReminder: true, evaluations: true, cohortUpdates: false })
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sections = [
    { key: 'profile', label: 'Profile', icon: 'user' },
    { key: 'learning', label: 'Learning Preferences', icon: 'book' },
    { key: 'notifications', label: 'Notifications', icon: 'bell' },
    { key: 'appearance', label: 'Appearance', icon: 'palette' },
    { key: 'privacy', label: 'Privacy & Data', icon: 'shield' },
  ]

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Settings</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your account, preferences, and learning environment.</p>
        </div>
        <button onClick={save} className={`btn-primary text-sm px-5 py-2 flex items-center gap-1.5 transition-all ${saved ? 'bg-green-600' : ''}`}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="col-span-1">
          <nav className="card p-2 space-y-0.5">
            {sections.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeSection === s.key ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
                }`}>
                <SettingsIcon type={s.icon} active={activeSection === s.key} />
                {s.label}
              </button>
            ))}
          </nav>

          {/* Danger zone */}
          <div className="card mt-4 border-red-200 bg-red-50/50">
            <p className="text-xs font-semibold text-red-600 mb-2">Danger Zone</p>
            <button className="text-xs text-red-500 hover:text-red-700 font-medium block mb-1">Reset all progress data</button>
            <button className="text-xs text-red-500 hover:text-red-700 font-medium">Delete account</button>
          </div>
        </div>

        {/* Content */}
        <div className="col-span-3 space-y-5">

          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="card">
              <h2 className="font-bold text-on-surface mb-5">Profile Information</h2>
              <div className="flex items-center gap-5 mb-6 pb-5 border-b border-border">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">RR</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{profile.name}</p>
                  <p className="text-xs text-on-surface-variant">{profile.email}</p>
                  <button className="text-xs text-primary font-semibold mt-1 hover:underline">Change avatar</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', key: 'name', type: 'text' },
                  { label: 'Email', key: 'email', type: 'email' },
                  { label: 'Target Role / Title', key: 'role', type: 'text' },
                  { label: 'LinkedIn URL', key: 'linkedin', type: 'url', placeholder: 'https://linkedin.com/in/...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-on-surface-variant mb-1 block">{f.label}</label>
                    <input type={f.type} value={profile[f.key]} onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder || ''} className="input text-sm" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Bio</label>
                  <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    rows={3} className="input resize-none text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Learning Preferences */}
          {activeSection === 'learning' && (
            <div className="card">
              <h2 className="font-bold text-on-surface mb-5">Learning Preferences</h2>
              <div className="mb-6">
                <label className="text-xs font-semibold text-on-surface-variant mb-3 block">Learning Pace</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'casual', label: 'Casual', desc: '~1 hr/day · Relaxed progress', icon: '🌿' },
                    { key: 'professional', label: 'Professional', desc: '~2 hrs/day · Steady growth', icon: '💼' },
                    { key: 'intensive', label: 'Intensive', desc: '~4 hrs/day · Fast-track', icon: '🚀' },
                  ].map(p => (
                    <button key={p.key} onClick={() => setPace(p.key)}
                      className={`p-4 border rounded-lg text-left transition-colors ${pace === p.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <div className="text-2xl mb-2">{p.icon}</div>
                      <p className={`text-sm font-bold ${pace === p.key ? 'text-primary' : 'text-on-surface'}`}>{p.label}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <label className="text-xs font-semibold text-on-surface-variant mb-2 block">Manager Reminder Time</label>
                <div className="flex items-center gap-3">
                  <input type="time" value={standupTime} onChange={e => setStandupTime(e.target.value)} className="input text-sm w-32" />
                  <p className="text-xs text-on-surface-variant">Your Manager will send task reminders at this time daily.</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-2 block">Timezone</label>
                <select className="input text-sm w-64">
                  <option>Asia/Kolkata (IST, UTC+5:30)</option>
                  <option>America/New_York (EST, UTC-5)</option>
                  <option>Europe/London (GMT, UTC+0)</option>
                </select>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="card">
              <h2 className="font-bold text-on-surface mb-5">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: 'morning', label: 'Task Reminder', desc: 'Daily Manager reminder of your pending task at your configured time.' },
                  { key: 'evening', label: 'Evening Review Reminder', desc: 'End-of-day progress review prompt at 9 PM.' },
                  { key: 'mentorReminder', label: 'Mentor Session Reminders', desc: '30-minute reminder before scheduled AI Mentor sessions.' },
                  { key: 'evaluations', label: 'Evaluation Results', desc: 'Notify when AI Evaluator completes scoring your submissions.' },
                  { key: 'cohortUpdates', label: 'Cohort Activity', desc: 'Updates when peers in your cohort achieve milestones.' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{n.label}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{n.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))}
                      className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${notifs[n.key] ? 'bg-primary' : 'bg-surface-high'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifs[n.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="card">
              <h2 className="font-bold text-on-surface mb-5">Appearance</h2>
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div>
                  <p className="text-sm font-semibold text-on-surface">Dark Mode</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Switch to a dark color scheme for low-light environments.</p>
                </div>
                <button onClick={() => setDarkMode(v => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${darkMode ? 'bg-primary' : 'bg-surface-high'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="py-4">
                <p className="text-sm font-semibold text-on-surface mb-3">Accent Color</p>
                <div className="flex gap-3">
                  {['#312E81', '#0d9488', '#7c3aed', '#0284c7', '#b45309'].map(c => (
                    <button key={c} className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Privacy */}
          {activeSection === 'privacy' && (
            <div className="card">
              <h2 className="font-bold text-on-surface mb-5">Privacy & Data</h2>
              {[
                { label: 'Public Portfolio', desc: 'Allow your portfolio to be viewed by employers and peers.', default: true },
                { label: 'Show in Leaderboard', desc: 'Appear in cohort leaderboard rankings.', default: true },
                { label: 'Share Progress with Mentor', desc: 'Let AI Mentor access your full simulation and quiz history.', default: true },
                { label: 'Analytics Data Collection', desc: 'Allow WorkLearn to collect usage data to improve AI recommendations.', default: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                  </div>
                  <button className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${item.default ? 'bg-primary' : 'bg-surface-high'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.default ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
              <div className="mt-4 flex gap-3">
                <button className="btn-secondary text-xs px-4 py-2">Download My Data</button>
                <button className="text-xs text-on-surface-variant hover:text-primary font-medium">View Privacy Policy</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SettingsIcon({ type, active }) {
  const cls = `text-${active ? 'primary' : 'on-surface-variant'}`
  const p = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: active ? '#312E81' : '#474651', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'user') return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  if (type === 'book') return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
  if (type === 'bell') return <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  if (type === 'palette') return <svg {...p}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
  return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
}
