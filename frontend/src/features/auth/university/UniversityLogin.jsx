import { useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { portalPathForRole } from '../../../rbac/roles'
import PortalSpinner from '../../../app/router/guards/PortalSpinner'

export default function UniversityLogin() {
  const navigate = useNavigate()
  const { user, loading: authLoading, loginUniversity } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await loginUniversity(email, password)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    navigate(portalPathForRole(result.role), { replace: true })
  }

  if (authLoading) return <PortalSpinner />
  if (user) return <Navigate to={portalPathForRole(user.role)} replace />

  const fillStudent = () => {
    setEmail('rahul@iitd.ac.in')
    setPassword('password')
  }

  return (
    <div className="min-h-screen flex">
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
        </div>
        <div className="bg-white/10 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Partner host</p>
          <p className="text-sm text-white/90">Sign in on your university subdomain (e.g. iitd.localhost:5173).</p>
        </div>
      </div>

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
            Sign in with your institutional email and password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                autoComplete="username"
                className="input w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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

          <div className="mt-6 p-4 bg-surface-low rounded-xl border border-border">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Demo Credential</p>
            <button
              type="button"
              onClick={fillStudent}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white border border-transparent hover:border-border transition-colors cursor-pointer"
            >
              <p className="text-xs font-semibold text-on-surface">Student — Rahul Sharma</p>
              <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">rahul@iitd.ac.in · password</p>
            </button>
          </div>

          <div className="mt-5 space-y-2 text-center">
            <p className="text-xs text-on-surface-variant">
              Are you a teacher?{' '}
              <Link to="/mentor/login" className="text-primary font-semibold hover:underline">Mentor Login →</Link>
            </p>
            <p className="text-xs text-on-surface-variant">
              University Admin?{' '}
              <Link to="/admin" className="text-primary font-semibold hover:underline">Admin sign-in →</Link>
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
