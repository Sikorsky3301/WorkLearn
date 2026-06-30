import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, ROLES } from './AuthContext'

export default function Login() {
  const navigate  = useNavigate()
  const { loginDirect } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const result = loginDirect(email, password)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    if (result.role === ROLES.SUPER_ADMIN) navigate('/superadmin')
    else navigate('/dashboard')
  }

  const fillDemo  = () => { setEmail('demo@worklearn.ai');  setPassword('demo123') }
  const fillAdmin = () => { setEmail('admin@worklearn.ai'); setPassword('admin123') }

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-indigo-700 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-xl">WorkLearn AI</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Learn by doing real<br />analyst work.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Job simulations, AI mentoring, and portfolio-building tools — all in one place.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: '📊', label: 'Junior DA Job Simulation', sub: '5-task real-world analytics project' },
            { icon: '🐍', label: 'In-browser Python Sandbox', sub: 'Run pandas & matplotlib instantly' },
            { icon: '🏆', label: 'Verifiable Certificates', sub: 'LinkedIn-ready portfolio projects' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-4 bg-white/10 rounded-xl px-4 py-3">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-white/60 text-xs">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right login form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-on-surface">WorkLearn AI</span>
          </div>

          <h2 className="text-2xl font-bold text-on-surface mb-1">Welcome back</h2>
          <p className="text-sm text-on-surface-variant mb-8">Sign in to continue learning.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input w-full"
              />
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
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-surface-low rounded-xl border border-border">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Demo Credentials</p>
            <div className="space-y-2">
              <button
                onClick={fillDemo}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-border transition-colors text-xs"
              >
                <span className="text-on-surface font-medium">Regular User</span>
                <span className="font-mono text-on-surface-variant">demo@worklearn.ai / demo123</span>
              </button>
              <button
                onClick={fillAdmin}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-border transition-colors text-xs"
              >
                <span className="text-on-surface font-medium">Super Admin</span>
                <span className="font-mono text-on-surface-variant">admin@worklearn.ai / admin123</span>
              </button>
            </div>
          </div>

          {/* University link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-on-surface-variant">
              Joining through a university?{' '}
              <Link to="/university/login" className="text-primary font-semibold hover:underline">
                University Login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
