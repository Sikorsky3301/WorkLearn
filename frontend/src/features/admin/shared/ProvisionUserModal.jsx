import { useEffect, useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { useAdminUniversities, useProvisionUser } from '../../../hooks'

/**
 * Provision a user into a partner university.
 * Platform Admin: pick university + role (student | teacher | university_admin).
 * University Admin: no university picker; student | teacher only.
 */
export default function ProvisionUserModal({ onClose, mode = 'platform', defaultUniversityId = null }) {
  const isUniAdmin = mode === 'university_admin'
  const { data: universities } = useAdminUniversities({ enabled: !isUniAdmin })
  const provision = useProvisionUser()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    roll_no: '',
    university_id: defaultUniversityId ? String(defaultUniversityId) : '',
    department: '',
    section: '',
  })
  const [error, setError] = useState('')

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

  const partners = (universities ?? []).filter((u) => !u.is_default)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      roll_no: form.role === 'student' ? (form.roll_no.trim() || null) : null,
      department: form.department.trim() || null,
      section: form.section.trim() || null,
    }
    if (!isUniAdmin) {
      if (!form.university_id) {
        setError('Select a university')
        return
      }
      body.university_id = Number(form.university_id)
    }
    try {
      await provision.mutateAsync(body)
      onClose()
    } catch (err) {
      setError(err.message || 'Provision failed')
    }
  }

  const roles = isUniAdmin
    ? [
        { value: 'student', label: 'Student' },
        { value: 'teacher', label: 'Teacher' },
      ]
    : [
        { value: 'student', label: 'Student' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'university_admin', label: 'University Admin' },
      ]

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onClick={onClose} role="presentation">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="provision-user-title"
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 id="provision-user-title" className="font-bold text-slate-900 dark:text-slate-100">Provision user</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isUniAdmin ? 'Create a student or teacher in your university.' : 'Create a user in a partner university.'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {!isUniAdmin && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">University</label>
              <select required value={form.university_id} onChange={set('university_id')} className="input w-full">
                <option value="">Select…</option>
                {partners.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Role</label>
            <select value={form.role} onChange={set('role')} className="input w-full">
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Name</label>
            <input required value={form.name} onChange={set('name')} className="input w-full" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
            <input required type="email" value={form.email} onChange={set('email')} className="input w-full" />
          </div>
          {form.role === 'student' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Roll number</label>
              <input required value={form.roll_no} onChange={set('roll_no')} className="input w-full" placeholder="21CS001" />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Password</label>
            <input required type="password" minLength={6} value={form.password} onChange={set('password')} className="input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Department</label>
              <input value={form.department} onChange={set('department')} className="input w-full" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Section</label>
              <input value={form.section} onChange={set('section')} className="input w-full" />
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
            <button type="submit" disabled={provision.isPending} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
              {provision.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {provision.isPending ? 'Creating…' : 'Provision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
