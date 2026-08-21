// Where the period's XP came from.
//
// A total on its own hides whether a student is finishing tasks or farming
// quiz bonuses. The ledger already records a `source` per row; nothing had ever
// read it.
export default function XpBreakdown({ breakdown, periodLabel }) {
  const rows = breakdown ?? []
  const total = rows.reduce((a, r) => a + r.xp, 0)

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <header className="mb-4">
        <h2 className="text-sm font-bold text-on-surface">XP sources</h2>
        <p className="text-xs text-on-surface-variant">{periodLabel}</p>
      </header>

      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-on-surface-variant">No XP earned in this period.</p>
      ) : (
        <>
          <p className="mb-3 text-2xl font-bold tabular-nums text-on-surface">
            {total}
            <span className="ml-1 text-sm font-semibold text-on-surface-variant">XP</span>
          </p>
          {/* One stacked bar, then the legend — the proportions are the point,
              and a stack states them in a way four separate bars cannot. */}
          <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-surface-high">
            {rows.map((r, i) => (
              <div
                key={r.key}
                className={i === 0 ? 'bg-primary' : i === 1 ? 'bg-secondary' : 'bg-amber-500'}
                style={{ width: `${(r.xp / total) * 100}%` }}
                title={`${r.label}: ${r.xp} XP`}
              />
            ))}
          </div>
          <ul className="space-y-2">
            {rows.map((r, i) => (
              <li key={r.key} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${
                    i === 0 ? 'bg-primary' : i === 1 ? 'bg-secondary' : 'bg-amber-500'
                  }`} />
                  <span className="truncate text-on-surface">{r.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-on-surface-variant">
                  <span className="font-semibold text-on-surface">{r.xp}</span> · {r.count}×
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
