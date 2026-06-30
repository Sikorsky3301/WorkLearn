import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const FEATURE_LABELS = {
  python_sandbox:   { label: 'Python Sandbox', icon: '🐍', desc: 'Run Python code in-browser with pandas & matplotlib' },
  model_solution:   { label: 'Model Solution', icon: '💡', desc: 'View model solution after attempting the task' },
  certificate:      { label: 'Certificate',    icon: '🏆', desc: 'Earn a verified completion certificate' },
  all_courses:      { label: 'Full Catalog',   icon: '📚', desc: 'Browse and start any course in the catalog' },
}

const ALL_COURSES = [
  { id: 'da-job-sim',          type: 'simulation', title: 'Junior Data Analyst Job Simulation', level: 'Beginner',     duration: '3–4 hrs', tags: ['Python', 'SQL', 'Analytics'], requiredFeature: null },
  { id: 'sql-masterclass',     type: 'course',     title: 'SQL Masterclass',                    level: 'Beginner',     duration: '4 hrs',   tags: ['SQL', 'Database'],             requiredFeature: 'all_courses' },
  { id: 'python-for-data',     type: 'course',     title: 'Python for Data Analysis',           level: 'Intermediate', duration: '6 hrs',   tags: ['Python', 'pandas', 'numpy'],   requiredFeature: 'all_courses' },
  { id: 'ml-fundamentals',     type: 'course',     title: 'ML Fundamentals',                    level: 'Intermediate', duration: '10 hrs',  tags: ['ML', 'sklearn'],               requiredFeature: 'all_courses' },
  { id: 'advanced-sys-design', type: 'course',     title: 'Advanced System Design',             level: 'Advanced',     duration: '8 hrs',   tags: ['Architecture', 'Scale'],       requiredFeature: 'all_courses' },
  { id: 'tableau-basics',      type: 'course',     title: 'Tableau & Data Visualization',       level: 'Beginner',     duration: '3 hrs',   tags: ['Tableau', 'Charts'],           requiredFeature: 'all_courses' },
]

function LockOverlay({ feature, onRequest }) {
  const info = FEATURE_LABELS[feature] || { label: feature, icon: '🔒', desc: '' }
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center gap-2 z-10">
      <span className="text-2xl">🔒</span>
      <p className="text-xs font-bold text-on-surface text-center px-4">{info.label} locked</p>
      <p className="text-[11px] text-on-surface-variant text-center px-6">{info.desc}</p>
      <button
        onClick={onRequest}
        className="mt-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold rounded-lg transition-colors"
      >
        Request Unlock
      </button>
    </div>
  )
}

function AssignedTaskCard({ task }) {
  const navigate = useNavigate()
  const isSimulation = task.type === 'simulation'
  const daysLeft = task.dueDate
    ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const handleStart = () => {
    if (task.resourceId === 'da-job-sim') navigate('/simulations/da-job-sim')
    else navigate(`/courses/${task.resourceId}`)
  }

  return (
    <div className={`card border ${task.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
      <div className="flex items-start gap-4">
        <span className="text-2xl mt-0.5">{isSimulation ? '🎮' : '📖'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-on-surface text-sm">{task.title}</p>
            <span className={`chip text-[10px] ${task.status === 'completed' ? 'bg-green-200 text-green-800' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {task.status === 'in_progress' ? 'In progress' : task.status === 'completed' ? 'Completed' : 'Pending'}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mb-2">
            Assigned by mentor
            {daysLeft !== null && (
              <> · <span className={daysLeft <= 3 ? 'text-red-600 font-semibold' : 'text-on-surface-variant'}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
              </span></>
            )}
          </p>
          {task.status !== 'completed' && (
            <div>
              <div className="flex justify-between text-[11px] text-on-surface-variant mb-1">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <div className="h-1.5 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleStart}
          className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            task.status === 'completed'
              ? 'bg-white text-on-surface-variant border border-border hover:bg-surface-low'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {task.status === 'completed' ? 'Review' : task.status === 'in_progress' ? 'Continue →' : 'Start →'}
        </button>
      </div>
    </div>
  )
}

export default function UniversityPortal() {
  const navigate = useNavigate()
  const { user, hasFeature, logout } = useAuth()
  const [requestSent, setRequestSent] = useState({})
  const [activeTab, setActiveTab] = useState('assigned')

  const handleRequestUnlock = (feature) => {
    setRequestSent(prev => ({ ...prev, [feature]: true }))
  }

  const assignedTasks = user?.assignedTasks || []
  const inProgressTasks  = assignedTasks.filter(t => t.status === 'in_progress')
  const completedTasks   = assignedTasks.filter(t => t.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top nav ── */}
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">W</span>
          </div>
          <div>
            <span className="font-bold text-sm text-on-surface">WorkLearn AI</span>
            <span className="mx-2 text-border">·</span>
            <span className="text-xs text-on-surface-variant">{user?.institution} — University Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <p className="text-xs font-semibold text-on-surface">{user?.name}</p>
            <p className="text-[11px] text-on-surface-variant">{user?.rollNo} · {user?.department} · Section {user?.section}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/university/login') }}
            className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Welcome banner ── */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white mb-8">
          <p className="text-sm font-semibold opacity-75 mb-1">{user?.institution}</p>
          <h1 className="text-2xl font-bold mb-0.5">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-white/70 text-sm">
            {inProgressTasks.length > 0
              ? `You have ${inProgressTasks.length} active assignment${inProgressTasks.length > 1 ? 's' : ''} — keep going!`
              : completedTasks.length === assignedTasks.length && assignedTasks.length > 0
              ? 'All assigned tasks complete. Great work!'
              : 'No active assignments right now.'}
          </p>
        </div>

        {/* ── Feature gate status ── */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {Object.entries(FEATURE_LABELS).map(([key, meta]) => {
            const unlocked = hasFeature(key)
            const sent     = requestSent[key]
            return (
              <div
                key={key}
                className={`rounded-xl border p-3 flex items-start gap-2.5 ${unlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <span className="text-base mt-0.5">{unlocked ? '✅' : '🔒'}</span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${unlocked ? 'text-green-800' : 'text-on-surface-variant'}`}>{meta.label}</p>
                  {!unlocked && (
                    <button
                      onClick={() => handleRequestUnlock(key)}
                      disabled={sent}
                      className={`text-[10px] mt-1 font-semibold ${sent ? 'text-gray-400' : 'text-orange-600 hover:text-orange-700'}`}
                    >
                      {sent ? 'Request sent ✓' : 'Request unlock →'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {[
            { id: 'assigned', label: `Assigned Tasks (${assignedTasks.length})` },
            { id: 'catalog',  label: 'Course Catalog' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors ${
                activeTab === t.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ASSIGNED TASKS ── */}
        {activeTab === 'assigned' && (
          <div className="space-y-4">
            {assignedTasks.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-sm font-semibold text-on-surface">No assignments yet</p>
                <p className="text-xs text-on-surface-variant mt-1">Your mentor hasn't assigned any tasks. Check back soon.</p>
              </div>
            ) : (
              <>
                {inProgressTasks.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">In Progress</h3>
                    <div className="space-y-3">
                      {inProgressTasks.map(t => <AssignedTaskCard key={t.id} task={t} />)}
                    </div>
                  </div>
                )}
                {assignedTasks.filter(t => t.status === 'pending').length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 mt-6">Pending</h3>
                    <div className="space-y-3">
                      {assignedTasks.filter(t => t.status === 'pending').map(t => <AssignedTaskCard key={t.id} task={t} />)}
                    </div>
                  </div>
                )}
                {completedTasks.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 mt-6">Completed</h3>
                    <div className="space-y-3">
                      {completedTasks.map(t => <AssignedTaskCard key={t.id} task={t} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── COURSE CATALOG ── */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-2 gap-4">
            {ALL_COURSES.map(course => {
              const locked = course.requiredFeature && !hasFeature(course.requiredFeature)
              const isAssigned = assignedTasks.some(t => t.resourceId === course.id)
              return (
                <div key={course.id} className="card relative overflow-hidden">
                  {locked && (
                    <LockOverlay
                      feature={course.requiredFeature}
                      onRequest={() => handleRequestUnlock(course.requiredFeature)}
                    />
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{course.type === 'simulation' ? '🎮' : '📖'}</span>
                    <div className="flex gap-1.5">
                      {isAssigned && <span className="chip text-[10px] bg-orange-100 text-orange-700">Assigned</span>}
                      <span className={`chip text-[10px] ${course.level === 'Beginner' ? 'bg-green-100 text-green-700' : course.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {course.level}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-on-surface mb-1">{course.title}</h3>
                  <p className="text-xs text-on-surface-variant mb-3">{course.duration}</p>
                  <div className="flex gap-1.5 flex-wrap mb-4">
                    {course.tags.map(t => (
                      <span key={t} className="chip text-[10px] bg-surface-low text-on-surface-variant">{t}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (locked) return
                      if (course.id === 'da-job-sim') navigate('/simulations/da-job-sim')
                      else navigate(`/courses/${course.id}`)
                    }}
                    disabled={locked}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${locked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark text-white'}`}
                  >
                    {locked ? '🔒 Locked — Request Unlock' : isAssigned ? 'Continue →' : 'Start →'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
