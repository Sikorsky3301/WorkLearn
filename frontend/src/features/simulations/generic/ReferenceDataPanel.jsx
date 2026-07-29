import { BookOpen } from 'lucide-react'

/** Read-only "case file" shown alongside the interactive task — the reference
 * material a student needs to review before/while filling out the form (a
 * lead file, account research, who-you're-talking-to context, etc). Renders
 * `task.reference_data = { title, fields: [{ label, value }] }` where `value`
 * is either a paragraph string or a list of strings (tags/bullets). Mirrors
 * the "Lead file" card the original hardcoded sales-crm-sim Stage 1 had,
 * generalized to any task type instead of being CRM-specific. */
export default function ReferenceDataPanel({ referenceData }) {
  if (!referenceData?.fields?.length) return null

  return (
    <div className="card mb-6">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <h2 className="text-sm font-bold text-on-surface">{referenceData.title || 'Reference'}</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {referenceData.fields.map((f, i) => (
            <div key={i} className={Array.isArray(f.value) || f.value?.length > 120 ? 'sm:col-span-2' : ''}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant mb-1">{f.label}</p>
              {Array.isArray(f.value) ? (
                <div className="flex flex-wrap gap-1.5">
                  {f.value.map((v, vi) => (
                    <span key={vi} className="text-xs px-2.5 py-1 rounded-lg border leading-snug bg-surface-low text-on-surface border-border">
                      {v}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-on-surface leading-relaxed">{f.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
