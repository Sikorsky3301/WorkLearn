import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { MultiStepLoader } from '../../../components/ui/multi-step-loader'
import { api } from '../../../lib/client'
import { useAuth } from '../AuthContext'
import TenantBrandMark from '../../../components/TenantBrandMark'
import { ROLES } from '../../../rbac/roles'

// Backend verifies the token's audience against its own GOOGLE_CLIENT_ID —
// the two must match exactly (see backend/.env). Sign-in silently has
// nothing to render if this is unset, rather than a broken button.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Loaded once and reused — mounting/unmounting Login (or switching signin/
// signup mode, which remounts the button container) must not inject the
// script tag again.
let googleScriptPromise = null
function loadGoogleScript() {
  if (googleScriptPromise) return googleScriptPromise
  googleScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Failed to load Google sign-in'))
    document.head.appendChild(script)
  })
  return googleScriptPromise
}

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

/** The line under the error telling you what to actually do about it.
 *
 * Written for the person looking at the screen — a student trying to get into
 * their course — not for whoever maintains the server. Three rules:
 *
 *   • Say what happened in words they'd use themselves. No status codes, no
 *     hostnames, nothing about backends or APIs; none of it is something they
 *     can act on, and all of it makes a routine typo feel like a system fault.
 *   • When it isn't their fault, say so immediately. "Your password is fine"
 *     is the most useful sentence we can offer someone who is about to start
 *     doubting a password that was always correct.
 *   • Give them one thing to try.
 *
 * The 401 advice leads with spelling on purpose. The server cannot tell us
 * whether the email or the password was wrong — saying so would confirm to a
 * stranger which accounts exist — so naming the likeliest cause is more honest
 * than implying we know which field failed. */
function helpFor(result, email) {
  if (result.isNetworkError) {
    return navigator.onLine === false
      ? 'Your details were never sent, so nothing is wrong with your password. Reconnect and try again.'
      : "Your details were never sent, so nothing is wrong with your password. Check your connection and try again in a moment — if it keeps happening, WorkLearn may be briefly down."
  }
  switch (result.status) {
    case 401:
      return email
        ? `Double-check ${email} for a typo — a swapped or missing letter is the usual culprit — and make sure Caps Lock is off. Passwords are case-sensitive.`
        : 'Double-check your email for a typo, and make sure Caps Lock is off. Passwords are case-sensitive.'
    case 403:
      return 'You typed everything correctly — this account just isn’t active at the moment. Your administrator can reopen it for you.'
    case 429:
      return 'For security we pause sign-ins after several tries. Wait a minute, then have another go.'
    case 400:
    case 422:
      return null // the server's own message already says what's wrong with the input
    default:
      return result.status >= 500
        ? 'Something went wrong on our side — your email and password are fine. Please try again in a moment.'
        : null
  }
}

export default function Login() {
  const navigate                  = useNavigate()
  const queryClient               = useQueryClient()
  const { loginDirect, loginWithGoogle, register, setAuthTransition } = useAuth()
  const googleButtonRef           = useRef(null)
  // Always points at the current handler, so the effect below can set up
  // Google's button once per mode-switch (not on every keystroke) while
  // still calling into fresh component state/props. Standard "latest ref"
  // pattern for a callback an external, non-React script holds onto.
  const handleGoogleCredentialRef = useRef(null)

  const [mode,     setMode]     = useState('signin') // 'signin' | 'signup'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // `error` is the sentence; `errorHelp` is the line telling you what to do
  // about it. Kept apart so the advice can differ from the message without
  // the API having to phrase both.
  const [error,    setError]    = useState('')
  const [errorHelp, setErrorHelp] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [notice,   setNotice]   = useState('')
  // Where to go once the loader finishes. Non-null means "authenticated,
  // loader running" — the redirect is deferred to the loader's onComplete.
  const [destination, setDestination] = useState(null)

  const switchMode = (m) => {
    setMode(m); setError(''); setErrorHelp(''); setNotice('')
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

  // The redirect half of a successful sign-in — shared by the password form
  // and Google, so "which portal does this role land on" exists in exactly
  // one place regardless of how someone authenticated.
  const proceedAfterAuth = useCallback((role) => {
    // Role picks the portal; host already picked the tenant via the API.
    // Admins / mentors share none of the student dashboard queries — skip warmUp.
    let to = '/dashboard'
    if (role === ROLES.SUPER_ADMIN) to = '/super-admin'
    else if (role === ROLES.ADMIN) to = '/admin'
    else if (role === ROLES.UNIVERSITY_ADMIN) to = '/university-admin'
    else if (role === ROLES.TEACHER) to = '/mentor'
    else warmUp()

    // Order matters. GuestOnlyRoute redirects a signed-in user away from this
    // page, and by now `user` is already set — so the flag has to go up before
    // the loader does, or the guard unmounts us first and the loader never
    // renders. Cleared in the loader's onComplete, once we have navigated.
    setAuthTransition(true)
    setDestination(to)
  }, [warmUp, setAuthTransition])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setErrorHelp('')
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.'); return
    }
    setLoading(true)
    const result = mode === 'signin'
      ? await loginDirect(email, password)
      : await register(name, email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      setErrorHelp(helpFor(result, email))
      return
    }
    proceedAfterAuth(result.role)
  }

  // `response.credential` is Google's signed ID-token JWT — handed straight
  // to the backend, which does the actual verification (signature, issuer,
  // audience) against Google's own keys. Nothing here trusts it itself.
  handleGoogleCredentialRef.current = async (response) => {
    setError(''); setErrorHelp('')
    const result = await loginWithGoogle(response.credential)
    if (result.error) {
      setError(result.error)
      setErrorHelp(helpFor(result))
      return
    }
    proceedAfterAuth(result.role)
  }

  // Sets up Google's own button once per signin/signup switch (the container
  // it renders into is unmounted in signup mode) — not on every keystroke,
  // since the ref indirection above means this never needs the latest
  // email/password to fire the latest handler.
  useEffect(() => {
    if (mode !== 'signin' || !GOOGLE_CLIENT_ID || !googleButtonRef.current) return
    let cancelled = false
    loadGoogleScript()
      .then(() => {
        if (cancelled || !googleButtonRef.current) return
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => handleGoogleCredentialRef.current(response),
        })
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline', size: 'large', shape: 'pill',
          width: 344, text: 'signin_with', logo_alignment: 'center',
        })
      })
      .catch(() => {
        setNotice("Google sign-in couldn't load — please continue with email and password above.")
      })
    return () => { cancelled = true }
  }, [mode])

  return (
    <div className="h-screen flex overflow-hidden">
      <MultiStepLoader
        loadingStates={mode === 'signin' ? SIGN_IN_STATES : SIGN_UP_STATES}
        loading={destination !== null}
        duration={620}
        onComplete={() => {
          navigate(destination, { replace: true })
          // Stand the guard back up. Doing it after navigate() means a Back
          // press onto /login is bounced again, which is the behaviour the
          // guard exists for.
          setAuthTransition(false)
        }}
      />

      {/* ── Left: form — its own scroll container, so a tall signup form
          (or a short viewport) never breaks the page layout; the right
          image always stays fixed at full height. ── */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center px-8 py-6 bg-white">
        <div className="w-full max-w-sm">

          <TenantBrandMark size="md" className="mb-5" />

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
              // role="alert" so a screen reader announces the failure the
              // moment it appears — otherwise the form simply seems not to
              // respond to the button.
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600"
              >
                <p className="text-xs font-semibold">{error}</p>
                {errorHelp && <p className="mt-1 text-xs leading-relaxed text-red-600/80">{errorHelp}</p>}
              </div>
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

          {mode === 'signin' && GOOGLE_CLIENT_ID && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-on-surface-variant">Or, Login with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google's own script renders the actual button here — see
                  the useEffect above. Its styling (outline/pill) is the
                  closest match Google's renderButton API allows to the rest
                  of this form's buttons; it can't be a plain custom-styled
                  button like the rest of the page, since Google requires
                  their own script to own the click. */}
              <div ref={googleButtonRef} className="flex justify-center" />
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
