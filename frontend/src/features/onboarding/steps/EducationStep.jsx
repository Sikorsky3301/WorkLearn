import { Plus, Trash2, GraduationCap } from 'lucide-react'

export default function EducationStep({ entries, onChange }) {
  function updateEntry(i, field, val) {
    const next = entries.slice()
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }
  function addEntry() {
    onChange([...entries, { institution: '', degree: '', field_of_study: '', start_year: '', end_year: '' }])
  }
  function removeEntry(i) {
    onChange(entries.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-4">
      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center text-on-surface-variant border-2 border-dashed border-border rounded-xl">
          <GraduationCap className="h-6 w-6 mb-2" strokeWidth={1.5} />
          <p className="text-sm font-medium mb-1">No education added yet</p>
          <p className="text-xs mb-3">Optional — you can always add this later from your Portfolio.</p>
          <button type="button" onClick={addEntry} className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> Add education
          </button>
        </div>
      )}

      {entries.map((entry, i) => (
        <div key={i} className="border border-border rounded-xl p-4 relative">
          <button
            type="button" onClick={() => removeEntry(i)}
            className="absolute top-3 right-3 text-on-surface-variant hover:text-red-600 cursor-pointer" aria-label="Remove entry"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <div className="grid grid-cols-2 gap-3 pr-6">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Institution</label>
              <input className="input text-sm" value={entry.institution} onChange={(e) => updateEntry(i, 'institution', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Degree</label>
              <input className="input text-sm" placeholder="B.Sc." value={entry.degree} onChange={(e) => updateEntry(i, 'degree', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Field of Study</label>
              <input className="input text-sm" placeholder="Computer Science" value={entry.field_of_study} onChange={(e) => updateEntry(i, 'field_of_study', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Start Year</label>
              <input type="number" className="input text-sm" value={entry.start_year} onChange={(e) => updateEntry(i, 'start_year', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">End Year</label>
              <input type="number" className="input text-sm" value={entry.end_year} onChange={(e) => updateEntry(i, 'end_year', e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      {entries.length > 0 && (
        <button type="button" onClick={addEntry} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer">
          <Plus className="h-3.5 w-3.5" /> Add another
        </button>
      )}
    </div>
  )
}
