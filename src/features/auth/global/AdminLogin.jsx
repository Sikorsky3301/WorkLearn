import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, Users2, Blocks } from 'lucide-react'
import { useAuth } from '../AuthContext'
import logo from '../../../assets/logo.png'

const TRUST_POINTS = [
  { Icon: Blocks, text: 'Build and publish job simulations across every domain' },
  { Icon: Users2, text: 'Monitor learners, universities, and mentor activity in real time' },
  { Icon: ShieldCheck, text: 'Control feature access and platform-wide permissions' },
]

export default function AdminLogin() {
  const navigate = useNavigate()
  const { loginSuperAdmin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await loginSuperAdmin(email, password)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    navigate('/admin')
  }

  return (
    <div className="min-h-screen flex bg-surface-low">
      {/* ── Brand panel (hidden on small screens) ── */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <img src={logo} alt="WorkLearn AI" className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-lg ring-1 ring-white/20" />
            <div>
              <p className="font-bold text-lg leading-tight">WorkLearn AI</p>
              <p className="text-white/60 text-xs leading-tight">Platform Administration</p>
            </div>
          </div>

          <div className="max-w-sm">
            <h2 className="text-3xl font-bold leading-tight mb-4">
              Run the platform from one control center.
            </h2>
            <p className="text-white/70 text-sm leading-relaxed mb-8">
              Sign in with your administrator credentials to manage simulations, learners, and
              access controls across WorkLearn AI.
            </p>
            <ul className="space-y-4">
              {TRUST_POINTS.map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="h-8 w-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-white/80 leading-snug pt-1.5">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-white/40 text-xs">
            Access is restricted to authorized administrators. All activity is logged.
          </p>
        </div>
      </div>

      {/* ── Sign-in panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={logo} alt="WorkLearn AI" className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm" />
            <div>
              <p className="font-bold text-on-surface text-lg leading-tight">WorkLearn AI</p>
              <p className="text-on-surface-variant text-xs leading-tight">Platform Administration</p>
            </div>
          </div>

          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 chip bg-primary/10 text-primary mb-4 normal-case tracking-normal">
              <ShieldCheck className="h-3 w-3" /> Restricted access
            </div>
            <h1 className="text-2xl font-bold text-on-surface mb-1.5">Admin sign in</h1>
            <p className="text-sm text-on-surface-variant">Sign in with your administrator account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="text-xs font-semibold text-on-surface-variant block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  autoFocus
                  placeholder="admin@worklearn.ai"
                  className="w-full bg-white border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-on-surface placeholder-outline/60 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-password" className="text-xs font-semibold text-on-surface-variant">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-on-surface placeholder-outline/60 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-2 mt-6 text-outline">
            <Lock className="h-3 w-3 shrink-0" />
            <p className="text-xs">Access is limited to authorized administrators and is logged.</p>
          </div>

          <p className="text-center mt-6 text-xs text-outline">
            <a href="/login" className="hover:text-on-surface-variant transition-colors">← Back to platform login</a>
          </p>
        </div>
      </div>
    </div>
  )
}
