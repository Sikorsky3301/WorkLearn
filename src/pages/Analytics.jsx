import { useState } from 'react'

const weekActivity = [
  { day: 'Mon', hours: 2.5, sims: 1, courses: 1 },
  { day: 'Tue', hours: 1.8, sims: 0, courses: 2 },
  { day: 'Wed', hours: 3.2, sims: 2, courses: 0 },
  { day: 'Thu', hours: 0.5, sims: 0, courses: 1 },
  { day: 'Fri', hours: 2.0, sims: 1, courses: 1 },
  { day: 'Sat', hours: 4.1, sims: 2, courses: 2 },
  { day: 'Sun', hours: 1.2, sims: 0, courses: 1 },
]

const skillGrowth = [
  { skill: 'Systems Arch', data: [72, 76, 80, 85, 88, 91, 94], color: '#312E81' },
  { skill: 'Data Literacy', data: [60, 65, 70, 74, 80, 85, 88], color: '#0d9488' },
  { skill: 'Agile PM', data: [78, 80, 82, 84, 87, 89, 90], color: '#7c3aed' },
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

const timeBreakdown = [
  { label: 'Simulations', hours: 48, pct: 45, color: 'bg-primary' },
  { label: 'Courses', hours: 32, pct: 30, color: 'bg-teal-500' },
  { label: 'Mentor Sessions', hours: 18, pct: 17, color: 'bg-violet-500' },
  { label: 'Quizzes', hours: 8, pct: 8, color: 'bg-amber-500' },
]

const streakGrid = (() => {
  const rows = []
  const today = new Date()
  for (let week = 11; week >= 0; week--) {
    const cols = []
    for (let day = 6; day >= 0; day--) {
      const d = new Date(today)
      d.setDate(today.getDate() - (week * 7 + day))
      const intensity = Math.random()
      const level = intensity > 0.7 ? 4 : intensity > 0.5 ? 3 : intensity > 0.3 ? 2 : intensity > 0.1 ? 1 : 0
      cols.push({ date: d.toDateString(), level })
    }
    rows.push(cols)
  }
  return rows
})()

const intensityColors = ['bg-surface-high', 'bg-primary/20', 'bg-primary/40', 'bg-primary/70', 'bg-primary']

const topStats = [
  { label: 'Total Hours Logged', value: '106 hrs', delta: '+12% vs last month', up: true },
  { label: 'Current Streak', value: '14 days', delta: 'Personal best!', up: true },
  { label: 'Simulations Completed', value: '124', delta: '+8 this week', up: true },
  { label: 'Avg. Daily Study', value: '2.1 hrs', delta: '-0.3 vs last week', up: false },
]

export default function Analytics() {
  const [period, setPeriod] = useState('week')
  const maxHours = Math.max(...weekActivity.map(d => d.hours))

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Progress & Analytics</h1>
          <p className="text-sm text-on-surface-variant mt-1">Track your learning velocity, streaks, and skill growth over time.</p>
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          {['week', 'month', 'all time'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${period === p ? 'bg-primary text-white' : 'bg-white text-on-surface-variant hover:bg-surface-low'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {topStats.map(s => (
          <div key={s.label} className="card">
            <p className="text-xs text-on-surface-variant mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-primary mb-1">{s.value}</p>
            <p className={`text-xs font-semibold flex items-center gap-1 ${s.up ? 'text-green-600' : 'text-red-500'}`}>
              {s.up ? '↑' : '↓'} {s.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* Weekly Activity Bar Chart */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="section-label">Daily Activity</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">Hours spent learning this week</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary inline-block"/>Simulations</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-500 inline-block"/>Courses</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {weekActivity.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold text-primary">{d.hours}h</span>
                <div className="w-full flex flex-col gap-0.5" style={{ height: `${(d.hours / maxHours) * 120}px` }}>
                  <div className="bg-primary rounded-t w-full" style={{ flex: d.sims || 0.1, minHeight: d.sims ? 4 : 0 }} />
                  <div className="bg-teal-500 w-full" style={{ flex: d.courses || 0.1, minHeight: d.courses ? 4 : 0 }} />
                </div>
                <span className="text-xs text-on-surface-variant">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time Breakdown Donut */}
        <div className="card">
          <span className="section-label mb-4 block">Time Breakdown</span>
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  let offset = 0
                  return timeBreakdown.map((t, i) => {
                    const dash = t.pct
                    const elem = (
                      <circle key={i} cx="18" cy="18" r="15.915"
                        fill="none"
                        stroke={['#312E81', '#0d9488', '#7c3aed', '#f59e0b'][i]}
                        strokeWidth="3.5"
                        strokeDasharray={`${dash} ${100 - dash}`}
                        strokeDashoffset={-offset}
                      />
                    )
                    offset += dash
                    return elem
                  })
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-primary">106</span>
                <span className="text-xs text-on-surface-variant">hrs total</span>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {timeBreakdown.map(t => (
              <div key={t.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-on-surface">{t.label}</span>
                  <span className="text-xs font-bold text-on-surface">{t.hours}h <span className="text-on-surface-variant font-normal">({t.pct}%)</span></span>
                </div>
                <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
                  <div className={`h-full ${t.color} rounded-full`} style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Growth Line Chart */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="section-label">Skill Growth Over Time</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">Competency score trends (Jan – Jul 2024)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {skillGrowth.map(s => (
                <span key={s.skill} className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 rounded inline-block" style={{ backgroundColor: s.color }} />
                  {s.skill}
                </span>
              ))}
            </div>
          </div>
          <div className="relative h-40">
            <svg viewBox="0 0 420 140" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid lines */}
              {[60, 70, 80, 90, 100].map(v => (
                <line key={v} x1="0" y1={140 - (v - 50) * 2.8} x2="420" y2={140 - (v - 50) * 2.8}
                  stroke="#e5e7eb" strokeWidth="0.5" />
              ))}
              {/* Lines */}
              {skillGrowth.map(skill => {
                const pts = skill.data.map((v, i) => `${(i / 6) * 420},${140 - (v - 50) * 2.8}`).join(' ')
                return (
                  <g key={skill.skill}>
                    <polyline points={pts} fill="none" stroke={skill.color} strokeWidth="2" strokeLinejoin="round" />
                    {skill.data.map((v, i) => (
                      <circle key={i} cx={(i / 6) * 420} cy={140 - (v - 50) * 2.8} r="3" fill={skill.color} />
                    ))}
                  </g>
                )
              })}
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
              {months.map(m => <span key={m} className="text-xs text-on-surface-variant">{m}</span>)}
            </div>
          </div>
        </div>

        {/* Streak Calendar */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="section-label">Activity Streak</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">Last 12 weeks</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-on-surface-variant">
              <span>Less</span>
              {intensityColors.map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c} border border-white`} />
              ))}
              <span>More</span>
            </div>
          </div>
          <div className="flex gap-1">
            {streakGrid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-4 h-4 rounded-sm ${intensityColors[day.level]} border border-white`}
                    title={day.date}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Longest Streak', val: '21 days' },
                { label: 'Current Streak', val: '14 days' },
                { label: 'Active Days', val: '68 / 90' },
                { label: 'Total Sessions', val: '132' },
              ].map(s => (
                <div key={s.label} className="bg-surface-low rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-primary">{s.val}</p>
                  <p className="text-xs text-on-surface-variant">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-10 border-t border-border pt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <span>WorkLearn AI</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Terms</a>
          <a href="#" className="hover:text-primary">Privacy</a>
          <a href="#" className="hover:text-primary">Help Center</a>
        </div>
        <span>© 2024 WorkLearn AI. All rights reserved.</span>
      </footer>
    </div>
  )
}
