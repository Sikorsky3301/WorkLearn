import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { MultiStepLoader } from '../../../components/ui/multi-step-loader'
import { api } from '../../../lib/client'
import { useAuth } from '../AuthContext'
import { ROLES } from '../../../rbac/roles'
import logo from '../../../assets/logo.png'

// Shown between a successful sign-in and the first authenticated screen. The
// steps are not decoration: the same window is used to prefetch the queries
// the dashboard mounts with (see `warmUp` below), so the app is already
// populated by the time the redirect happens instead of showing a second
// round of spinners on arrival.
const SIGN_IN_STATES = [
  { text: 'Verifying your credentials' },
  { text: 'Loading your simulations' },
  { text: 'Syncing your progress' },
  { text: 'Setting up your workspace' },
]

const SIGN_UP_STATES = [
  { text: 'Creating your account' },
  { text: 'Setting up your profile' },
  { text: 'Loading available simulations' },
  { text: 'Getting you started' },
]

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3C33.7 32 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3.1l5.1-5.1C33.9 5.5 29.2 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5Z" />
      <path fill="#FF3D00" d="m6.3 14.7 5.9 4.3C13.7 15.6 18.5 12.5 24 12.5c3.1 0 5.9 1.1 8 3.1l5.1-5.1C33.9 6.5 29.2 4.5 24 4.5c-7.6 0-14.1 4.3-17.7 10.2Z" />
      <path fill="#4CAF50" d="M24 44.5c5.1 0 9.8-1.9 13.3-5.1l-6.1-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.1 4.7C9.8 40.1 16.4 44.5 24 44.5Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.1 5.2C40.7 35.9 44.5 30.5 44.5 24c0-1.2-.1-2.4-.3-3.5Z" />
    </svg>
  )
}

export default function Login() {
  const navigate                  = useNavigate()
  const queryClient               = useQueryClient()
  const { loginDirect, register } = useAuth()

  const [mode,     setMode]     = useState('signin') // 'signin' | 'signup'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [notice,   setNotice]   = useState('')
  // Where to go once the loader finishes. Non-null means "authenticated,
  // loader running" — the redirect is deferred to the loader's onComplete.
  const [destination, setDestination] = useState(null)

  const switchMode = (m) => {
    setMode(m); setError(''); setNotice('')
    setName(''); setEmail(''); setPassword(''); setConfirm('')
  }

  // Fire-and-forget: warm the caches the first authenticated screen reads.
  // Deliberately not awaited — the loader's own timing governs how long the
  // user waits, and a slow endpoint must not extend that or block the
  // redirect. Failures are swallowed because these are pure optimisations;
  // the destination screen refetches through its own hooks regardless.
  const warmUp = useCallback(() => {
    const prefetch = [
      ['simulations', '/api/simulations'],
      ['my-assignments', '/api/my-assignments'],
    ]
    for (const [key, url] of prefetch) {
      queryClient.prefetchQuery({ queryKey: [key], queryFn: () => api.get(url) }).catch(() => {})
    }
  }, [queryClient])

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

    // Role picks the portal; host already picked the tenant via the API.
    // Admins / mentors share none of the student dashboard queries — skip warmUp.
    let to = '/dashboard'
    if (result.role === ROLES.SUPER_ADMIN) to = '/super-admin'
    else if (result.role === ROLES.ADMIN) to = '/admin'
    else if (result.role === ROLES.UNIVERSITY_ADMIN) to = '/university-admin'
    else if (result.role === ROLES.TEACHER) to = '/mentor'
    else warmUp()

    setDestination(to)
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <MultiStepLoader
        loadingStates={mode === 'signin' ? SIGN_IN_STATES : SIGN_UP_STATES}
        loading={destination !== null}
        duration={620}
        onComplete={() => navigate(destination)}
      />

      {/* ── Left: form — its own scroll container, so a tall signup form
          (or a short viewport) never breaks the page layout; the right
          image always stays fixed at full height. ── */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center px-8 py-6 bg-white">
        <div className="w-full max-w-sm">

          <img src={logo} alt="WorkLearn" className="w-10 h-10 rounded-xl object-cover mb-5" />

          <h1 className="text-2xl font-bold text-on-surface mb-1">
            {mode === 'signin' ? 'Welcome back!' : 'Get started free!'}
          </h1>
          <p className="text-sm text-on-surface-variant mb-5">
            {mode === 'signin'
              ? 'Enter to get unlimited access to job simulations & AI mentoring.'
              : 'Create your account in seconds — no card required.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" required className="input w-full"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your mail address" required className="input w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password" required
                  minLength={mode === 'signup' ? 6 : undefined}
                  className="input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-[11px] text-on-surface-variant mt-1">Minimum 6 characters</p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Enter password again" required className="input w-full"
                />
              </div>
            )}

            {mode === 'signin' && (
              <div className="flex items-center justify-end">
                <a
                  href="mailto:support@worklearn.ai?subject=Password%20Reset%20Request"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            {notice && (
              <p className="text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{notice}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading
                ? (mode === 'signin' ? 'Logging in…' : 'Creating account…')
                : (mode === 'signin' ? 'Log In' : 'Create Account')}
            </button>
          </form>

          {mode === 'signin' && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-on-surface-variant">Or, Login with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                type="button"
                onClick={() => setNotice("Google sign-in isn't set up yet — please continue with email and password above.")}
                className="btn-secondary w-full py-2.5 text-sm flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <GoogleIcon /> Sign in with Google
              </button>
            </>
          )}

          <p className="text-center text-sm text-on-surface mt-4">
            {mode === 'signin' ? (
              <>Don't have an account?{' '}
                <button onClick={() => switchMode('signup')} className="text-primary font-semibold hover:underline cursor-pointer">
                  Register here
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => switchMode('signin')} className="text-primary font-semibold hover:underline cursor-pointer">
                  Log in
                </button>
              </>
            )}
          </p>

          <p className="text-center text-xs text-on-surface-variant mt-2">
            Joining through a university?{' '}
            <Link to="/university/login" className="text-primary font-semibold hover:underline">
              University Login →
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right: collage — all three source files are shown at their true
          native pixel size (no width/height scaling anywhere below), so
          none of them gets blurred by upscaling. They're staggered and
          rotated like an overlapping photo stack rather than tiled edge to
          edge, since none of the three shares the same aspect ratio and
          the panel isn't wide enough to lay all three out side by side at
          full size without overlap. The two accent images intentionally
          bleed past the panel edges into the surrounding backdrop — the
          container clips them rather than shrinking them. */}
      <div className="hidden lg:flex lg:w-1/2 h-full items-center justify-center bg-[#132b8c] overflow-hidden relative">
        <img
          src="/images/collage-warm.jpg"
          alt=""
          width={736} height={1314}
          className="absolute rounded-xl shadow-2xl"
          style={{ top: '-160px', left: '-280px', transform: 'rotate(-9deg)' }}
        />
        <img
          src="/images/collage-blue.jpg"
          alt=""
          width={736} height={736}
          className="absolute rounded-xl shadow-2xl"
          style={{ bottom: '-140px', right: '-240px', transform: 'rotate(10deg)' }}
        />
        <img
          src="/images/login-illustration.jpg"
          alt=""
          width={735} height={1040}
          className="relative z-10 rounded-xl shadow-2xl"
        />
      </div>
    </div>
  )
}
