import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const INSTITUTIONS = [
  'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur',
  'BITS Pilani', 'NIT Trichy', 'NIT Warangal',
  'VIT Vellore', 'SRM University', 'Manipal University',
  'IIIT Bangalore', 'ISB Hyderabad', 'DTU Delhi', 'Amity University',
]

export default function MentorLogin() {
  const navigate          = useNavigate()
  const { loginMentor }   = useAuth()

  const [institution, setInstitution] = useState('')
  const [mentorId,    setMentorId]    = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await loginMentor(mentorId, password)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    navigate('/mentor')
  }

  const fillDemo = () => {
    setMentorId('MENTOR001')
    setPassword('mentor123')
    setInstitution('IIT Delhi')
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-primary to-indigo-700 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <p className="font-bold text-sm">WorkLearn AI</p>
              <p className="text-white/60 text-[11px]">Mentor Portal</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold leading-tight mb-4">
            Your class.<br />Your dashboard.
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-10">
            Track every student's progress, assign simulations and courses, and unlock features when your students are ready.
          </p>

          <div className="space-y-3">
            {[
              { icon: '👥', text: 'Track all students in your section' },
              { icon: '📋', text: 'Assign courses and simulations with deadlines' },
              { icon: '🔓', text: 'Approve or deny feature unlock requests' },
              { icon: '📊', text: 'Section-level progress reports' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 text-sm">
                <span>{f.icon}</span>
                <span className="text-white/80">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">You manage</p>
          <p className="text-2xl font-bold">10 students</p>
          <p className="text-white/60 text-sm mt-0.5">across 2 sections · IIT Delhi CSE</p>
        </div>
      </div>

      {/* ── Right form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-on-surface">WorkLearn — Mentor</span>
          </div>

          <h2 className="text-2xl font-bold text-on-surface mb-1">Mentor Login</h2>
          <p className="text-sm text-on-surface-variant mb-8">
            Sign in with your institution-assigned Mentor ID.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1.5">Mentor ID</label>
              <input
                type="text"
                value={mentorId}
                onChange={e => setMentorId(e.target.value)}
                placeholder="e.g. MENTOR001"
                required
                className="input w-full font-mono"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                Your Mentor ID is provided by your institution admin.
              </p>
            </div>

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
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In to Mentor Dashboard'}
            </button>
          </form>

          {/* Demo */}
          <div className="mt-5 p-4 bg-surface-low rounded-xl border border-border">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Demo Credential</p>
            <button
              onClick={fillDemo}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white border border-transparent hover:border-border transition-colors"
            >
              <p className="text-xs font-semibold text-on-surface">Prof. Ananya Sharma</p>
              <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                MENTOR001 · IIT Delhi · Password: mentor123
              </p>
            </button>
          </div>

          <div className="mt-6 space-y-2 text-center">
            <p className="text-xs text-on-surface-variant">
              Student?{' '}
              <Link to="/university/login" className="text-primary font-semibold hover:underline">
                University Login →
              </Link>
            </p>
            <p className="text-xs text-on-surface-variant">
              Platform user?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Regular Login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
