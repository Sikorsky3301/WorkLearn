import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { ROLES } from '../../../rbac/roles'

const DEPARTMENTS = [
  'Computer Science & Engineering (CSE)',
  'Electronics & Communication (ECE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Electrical Engineering (EE)',
  'Information Technology (IT)',
  'Data Science & AI (DS)',
  'Business Administration (MBA)',
  'Mathematics & Computing (MnC)',
]

const INSTITUTIONS = [
  'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur',
  'BITS Pilani', 'NIT Trichy', 'NIT Warangal',
  'VIT Vellore', 'SRM University', 'Manipal University',
  'IIIT Bangalore', 'ISB Hyderabad', 'DTU Delhi', 'Amity University',
]

export default function UniversityLogin() {
  const navigate = useNavigate()
  const { loginUniversity } = useAuth()

  const [institution, setInstitution] = useState('')
  const [rollNo,      setRollNo]      = useState('')
  const [department,  setDepartment]  = useState('')
  const [section,     setSection]     = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await loginUniversity(rollNo, password)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    if (result.role === ROLES.TEACHER) navigate('/mentor')
    else navigate('/dashboard')
  }

  const fillStudent = () => {
    setRollNo('21CS001'); setPassword('student123')
    setInstitution('IIT Delhi'); setDepartment('Computer Science & Engineering (CSE)'); setSection('A')
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-orange-500 to-orange-700 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <p className="font-bold text-sm">WorkLearn AI</p>
              <p className="text-white/60 text-[11px]">University Edition</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold leading-tight mb-4">
            Skills-first learning,<br />built for institutions.
          </h1>
          <p className="text-white/70 leading-relaxed text-sm mb-10">
            Your mentor assigns real-world simulations. You learn by doing — and your progress is tracked end-to-end.
          </p>

          <div className="space-y-3">
            {[
              { icon: '📋', text: 'Mentor-assigned simulations & courses' },
              { icon: '🔓', text: 'Feature access controlled by your mentor' },
              { icon: '📊', text: 'Real-time progress reports for your class' },
              { icon: '🏆', text: 'Institution-verified certificates' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 text-sm">
                <span>{f.icon}</span>
                <span className="text-white/80">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">Partner Institutions</p>
          <div className="flex flex-wrap gap-2">
            {['IIT Delhi', 'BITS Pilani', 'VIT', 'NIT Trichy', 'ISB', 'Manipal'].map(u => (
              <span key={u} className="text-[11px] bg-white/15 px-2.5 py-1 rounded-full">{u}</span>
            ))}
            <span className="text-[11px] bg-white/15 px-2.5 py-1 rounded-full">+6 more</span>
          </div>
        </div>
      </div>

      {/* ── Right form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-on-surface">WorkLearn — University</span>
          </div>

          <h2 className="text-2xl font-bold text-on-surface mb-1">University Login</h2>
          <p className="text-sm text-on-surface-variant mb-8">
            Use your institutional credentials to sign in.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Institution */}
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1.5">Institution</label>
              <select
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                required
                className="input w-full"
              >
                <option value="">Select your institution…</option>
                {INSTITUTIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {/* Roll number */}
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1.5">
                Roll Number / Student ID
              </label>
              <input
                type="text"
                value={rollNo}
                onChange={e => setRollNo(e.target.value)}
                placeholder="e.g. 21CS001"
                required
                className="input w-full font-mono"
              />
            </div>

            {/* Department + Section row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1.5">Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  required
                  className="input w-full text-xs"
                >
                  <option value="">Select dept…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1.5">Section / Class</label>
                <input
                  type="text"
                  value={section}
                  onChange={e => setSection(e.target.value)}
                  placeholder="e.g. A, B, CS-3A"
                  required
                  className="input w-full"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input w-full"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In to University Portal'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-surface-low rounded-xl border border-border">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Demo Credential</p>
            <button
              onClick={fillStudent}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white border border-transparent hover:border-border transition-colors"
            >
              <p className="text-xs font-semibold text-on-surface">Student — Rahul Sharma</p>
              <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">Roll: 21CS001 · IIT Delhi · CSE-A · Password: student123</p>
            </button>
          </div>

          <div className="mt-5 space-y-2 text-center">
            <p className="text-xs text-on-surface-variant">
              Are you a mentor?{' '}
              <Link to="/mentor/login" className="text-primary font-semibold hover:underline">Mentor Login →</Link>
            </p>
            <p className="text-xs text-on-surface-variant">
              Not a university user?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Regular Login →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
