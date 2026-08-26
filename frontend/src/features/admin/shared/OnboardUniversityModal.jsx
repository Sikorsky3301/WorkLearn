import { useEffect, useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { useOnboardUniversity } from '../../../hooks'
import LogoUploadField from '../../builder/cms/shared/LogoUploadField'

const empty = {
  name: '',
  code: '',
  logo_url: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
}

/** Platform Admin wizard: create university + first university_admin. */
export default function OnboardUniversityModal({ onClose }) {
  const onboard = useOnboardUniversity()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const codePreview = (form.code || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  // Preview the real deployment host, not a hardcoded dev one.
  const appHost = typeof window === 'undefined' ? '' : window.location.host
  const hostPreview = `${codePreview || '{code}'}.${appHost}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const logo = (form.logo_url || '').trim()
      const result = await onboard.mutateAsync({
        name: form.name.trim(),
        code: form.code.trim().toLowerCase(),
        ...(logo ? { logo_url: logo } : {}),
        admin: {
          name: form.adminName.trim(),
          email: form.adminEmail.trim(),
          password: form.adminPassword,
        },
      })
      setDone(result)
    } catch (err) {
      setError(err.message || 'Onboard failed')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onClick={onClose} role="presentation">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboard-uni-title"
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 id="onboard-uni-title" className="font-bold text-slate-900 dark:text-slate-100">Onboard University</h3>
            <p className="text-xs text-slate-500 mt-0.5">Create partner org, subdomain code, and first University Admin.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="p-5 space-y-3">
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <strong>{done.university?.name}</strong> onboarded. University Admin: {done.admin?.email}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Partner login host: <code className="font-mono text-primary">{done.login_host}</code>
            </p>
            <p className="text-xs text-slate-500">University Admin signs in at that host via Admin sign-in (`/admin`), then lands in the University Admin portal.</p>
            <button type="button" onClick={onClose} className="btn-primary w-full py-2.5 text-sm">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">University name</label>
              <input required value={form.name} onChange={set('name')} className="input w-full" placeholder="IIT Delhi" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subdomain code</label>
              <input
                required
                value={form.code}
                onChange={set('code')}
                className="input w-full font-mono"
                placeholder="iitd"
                pattern="[a-zA-Z0-9]+"
                title="Lowercase alphanumeric subdomain label"
              />
              <p className="text-[11px] text-slate-500 mt-1">Partner host: <span className="font-mono text-primary">{hostPreview}</span> (code is immutable after create)</p>
            </div>
            <LogoUploadField
              label="University logo (optional)"
              value={form.logo_url}
              onChange={(v) => setForm((f) => ({ ...f, logo_url: v }))}
            />
            <p className="text-[11px] text-slate-500 -mt-2">Shown on the partner subdomain. If omitted, WorkLearn logo is used.</p>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">First University Admin</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Name</label>
                  <input required value={form.adminName} onChange={set('adminName')} className="input w-full" placeholder="Campus Admin" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
                  <input required type="email" value={form.adminEmail} onChange={set('adminEmail')} className="input w-full" placeholder="admin@university.edu" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Password</label>
                  <input required type="password" minLength={6} value={form.adminPassword} onChange={set('adminPassword')} className="input w-full" placeholder="••••••••" />
                </div>
              </div>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">Cancel</button>
              <button type="submit" disabled={onboard.isPending} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                {onboard.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {onboard.isPending ? 'Creating…' : 'Onboard'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
