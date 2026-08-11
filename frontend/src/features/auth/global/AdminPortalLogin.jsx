import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../AuthContext'
import logo from '../../../assets/logo.png'

/** Admin portal's own login, separate from Super Admin's (see
 * SuperAdminLogin.jsx) — hits POST /api/auth/login/admin, a distinct
 * backend-verified role check from login/superadmin. Same split-screen shape
 * as the main Login.jsx: a scrollable form on the left, a full-height image
 * panel on the right. */
export default function AdminPortalLogin() {
  const navigate = useNavigate()
  const { loginAdmin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await loginAdmin(email, password)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    if (result.role === 'university_admin') navigate('/university-admin')
    else navigate('/admin')
  }

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Left: form — its own scroll container, same pattern as Login.jsx ── */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center px-8 py-6 bg-white">
        <div className="w-full max-w-sm">
          <img src={logo} alt="WorkLearn AI" className="w-10 h-10 rounded-xl object-cover mb-5" />

          <div className="inline-flex items-center gap-1.5 chip bg-primary/10 text-primary mb-4 normal-case tracking-normal">
            <ShieldCheck className="h-3 w-3" /> Restricted access
          </div>
          <h1 className="text-2xl font-bold text-on-surface mb-1">Admin sign in</h1>
          <p className="text-sm text-on-surface-variant mb-5">
            Platform Admin on the academy host, or University Admin on your university subdomain — you will land in the matching portal.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div>
              <label htmlFor="admin-portal-email" className="text-xs font-semibold text-on-surface block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
                <input
                  id="admin-portal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  autoFocus
                  placeholder="admin@worklearn.ai"
                  className="input w-full pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-portal-password" className="text-xs font-semibold text-on-surface block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
                <input
                  id="admin-portal-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input w-full pl-10 pr-10"
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
              type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-2 mt-5 text-outline">
            <Lock className="h-3 w-3 shrink-0" />
            <p className="text-xs">Access is limited to authorized admins and is logged.</p>
          </div>

          <p className="text-center mt-4 text-xs text-outline">
            <a href="/login" className="hover:text-on-surface-variant transition-colors">← Back to platform login</a>
          </p>
        </div>
      </div>

      {/* ── Right: single hero image, shown at up to its true native pixel
          size (736×1104) and never upscaled beyond that — object-contain
          only ever scales it DOWN to fit a shorter viewport, which stays
          sharp; it never stretches UP to fill a taller one, which would
          blur. #3d2a26 is the image's own dominant dark tone, sampled
          directly from it, so any letterboxed space above/below reads as
          part of the same palette rather than a mismatched bar. ── */}
      <div className="hidden lg:flex lg:w-1/2 h-full items-center justify-center bg-[#3d2a26] overflow-hidden p-10">
        <img
          src="/images/admin-geometric.jpg"
          alt=""
          width={736}
          height={1104}
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl shadow-2xl"
        />
      </div>
    </div>
  )
}
