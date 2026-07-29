import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, ROLES } from '../AuthContext'

export default function Login() {
  const navigate             = useNavigate()
  const { loginDirect, register } = useAuth()

  const [mode,     setMode]     = useState('signin') // 'signin' | 'signup'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const switchMode = (m) => {
    setMode(m); setError('')
    setName(''); setEmail(''); setPassword(''); setConfirm('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.'); return
    }
    setLoading(true)
    const result = mode === 'signin'
      ? await loginDirect(email, password)
      : await register(name, email, password)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    if (result.role === ROLES.SUPER_ADMIN) navigate('/super-admin')
    else if (result.role === ROLES.ADMIN) navigate('/admin')
    else navigate('/dashboard')
  }

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
            Learn by doing real<br />professional work.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Job simulations, AI mentoring, and portfolio-building tools — built for every career path.
          </p>
        </div>

        <div className="space-y-3">
          <div className="bg-white/10 rounded-2xl p-5">
            <p className="text-sm font-semibold mb-1">Hands-on job simulations</p>
            <p className="text-white/60 text-xs leading-relaxed">Work on real tasks from top roles across tech, data, business, and more.</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5">
            <p className="text-sm font-semibold mb-1">AI mentor, always available</p>
            <p className="text-white/60 text-xs leading-relaxed">Get unstuck instantly. Your AI mentor knows exactly where you are in your journey.</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5">
            <p className="text-sm font-semibold mb-1">Skills that show, not just tell</p>
            <p className="text-white/60 text-xs leading-relaxed">Build a verified portfolio recruiters can trust — no matter your field.</p>
          </div>
        </div>
      </div>

      {/* ── Right form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-on-surface">WorkLearn AI</span>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-surface-low rounded-xl p-1 mb-8">
            <button
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === 'signin' ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === 'signup' ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant'}`}
            >
              Create Account
            </button>
          </div>

          <h2 className="text-2xl font-bold text-on-surface mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Get started free'}
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">
            {mode === 'signin' ? 'Sign in to continue learning.' : 'Create your account in seconds.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="input w-full"
                />
              </div>
            )}

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
                minLength={mode === 'signup' ? 6 : undefined}
                className="input w-full"
              />
              {mode === 'signup' && (
                <p className="text-[11px] text-on-surface-variant mt-1">Minimum 6 characters</p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input w-full"
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading
                ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </button>
          </form>


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
