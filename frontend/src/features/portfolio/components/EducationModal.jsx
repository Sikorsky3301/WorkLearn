import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useAddEducation, useUpdateEducation } from '../../../shared/api/hooks'
import Modal from './Modal'

export default function EducationModal({ entry, onClose }) {
  const { refreshUser } = useAuth()
  const isEdit = Boolean(entry)
  const [form, setForm] = useState({
    institution: entry?.institution || '',
    degree: entry?.degree || '',
    field_of_study: entry?.field_of_study || '',
    start_year: entry?.start_year ?? '',
    end_year: entry?.end_year ?? '',
    is_current: entry?.is_current || false,
    description: entry?.description || '',
  })
  const [error, setError] = useState('')
  const addEducation = useAddEducation()
  const updateEducation = useUpdateEducation()
  const busy = addEducation.isPending || updateEducation.isPending

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.institution.trim()) { setError('Institution is required.'); return }
    setError('')
    const body = {
      ...form,
      start_year: form.start_year ? Number(form.start_year) : null,
      end_year: form.is_current ? null : (form.end_year ? Number(form.end_year) : null),
    }
    try {
      if (isEdit) await updateEducation.mutateAsync({ id: entry.id, ...body })
      else await addEducation.mutateAsync(body)
      await refreshUser()
      onClose()
    } catch (err) { setError(err.message) }
  }

  return (
    <Modal title={isEdit ? 'Edit Education' : 'Add Education'} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div>
          <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Institution *</label>
          <input required className="input text-sm" value={form.institution} onChange={(e) => set('institution', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Degree</label>
            <input className="input text-sm" placeholder="B.Sc." value={form.degree} onChange={(e) => set('degree', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Field of Study</label>
            <input className="input text-sm" placeholder="Computer Science" value={form.field_of_study} onChange={(e) => set('field_of_study', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Start Year</label>
            <input type="number" className="input text-sm" placeholder="2020" value={form.start_year} onChange={(e) => set('start_year', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1 block">End Year</label>
            <input
              type="number" disabled={form.is_current} className="input text-sm disabled:opacity-50"
              placeholder="2024" value={form.end_year} onChange={(e) => set('end_year', e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-on-surface cursor-pointer">
          <input type="checkbox" checked={form.is_current} onChange={(e) => set('is_current', e.target.checked)} className="rounded border-border" />
          I currently study here
        </label>

        <div>
          <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Description</label>
          <textarea rows={2} className="input text-sm resize-none" placeholder="Relevant coursework, achievements..." value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary text-sm px-5 py-2 disabled:opacity-60">
            {busy ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Education'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
