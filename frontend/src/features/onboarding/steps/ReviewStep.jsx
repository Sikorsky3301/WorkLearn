export default function ReviewStep({ form, photoPreview, name, email }) {
  const initial = name?.[0]?.toUpperCase() || '?'

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

      <p className="text-xs text-on-surface-variant leading-relaxed pt-3 border-t border-border">
        You can edit any of this later from your Portfolio page.
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
