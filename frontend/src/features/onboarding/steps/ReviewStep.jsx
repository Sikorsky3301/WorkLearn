import { useMemo } from 'react'
import { useSimulations } from '../../../hooks'

export default function ReviewStep({ form, photoPreview, name, email }) {
  const initial = name?.[0]?.toUpperCase() || '?'
  const { data } = useSimulations()
  const matching = useMemo(() => {
    const want = (form.preferred_domain || '').trim().toLowerCase()
    if (!want) return []
    return (data?.simulations ?? []).filter((s) => {
      const domain = (s.domain || '').trim().toLowerCase()
      const category = (s.category || '').trim().toLowerCase()
      return want === domain || (category && want === category)
    })
  }, [data, form.preferred_domain])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-surface-low rounded-xl">
        {photoPreview ? (
          <img src={photoPreview} alt="" className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold shrink-0">{initial}</div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-on-surface truncate">{name}</p>
          <p className="text-xs text-on-surface-variant truncate">{email}</p>
        </div>
      </div>

      <SummaryRow label="Headline" value={form.headline || '—'} />
      <SummaryRow label="Domain" value={form.preferred_domain || 'Not selected'} />
      <SummaryRow label="Contact info" value={[form.phone, form.location].filter(Boolean).join(' · ') || '—'} />
      <SummaryRow label="Education entries" value={String(form.educationEntries?.filter((e) => e.institution?.trim()).length || 0)} />

      <div className="pt-3 border-t border-border space-y-2">
        <p className="text-xs font-semibold text-on-surface">You’ll start with</p>
        {matching.length === 0 ? (
          <p className="text-xs text-on-surface-variant leading-relaxed">
            No published simulations for this domain are available at your university yet. You can still finish — browse the catalog later from your dashboard.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {matching.map((s) => (
              <li key={s.id} className="text-sm text-on-surface font-medium">
                {s.title}
                {s.company ? <span className="text-xs text-on-surface-variant font-normal"> · {s.company}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-on-surface-variant leading-relaxed">
        Finishing enrolls you in the matching simulations above. You can edit your profile later from Portfolio.
      </p>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm gap-4">
      <span className="text-on-surface-variant shrink-0">{label}</span>
      <span className="font-semibold text-on-surface text-right truncate">{value}</span>
    </div>
  )
}
