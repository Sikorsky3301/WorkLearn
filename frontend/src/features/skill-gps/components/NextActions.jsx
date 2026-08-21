import { Sparkles, ArrowRight } from 'lucide-react'
import { useSkillGpsActions } from '../../../hooks'

// AI recommendations, on their own query.
//
// These used to be generated inside the gap-analysis request, so the whole page
// sat behind a full-screen spinner for the length of a model round trip on
// every visit and every role change. Isolating them means a slow or failing
// model costs this one card and nothing else — note the error branch says so
// explicitly rather than leaving the student wondering what broke.
export default function NextActions({ targetRole, onStart }) {
  const { data, isLoading, isError } = useSkillGpsActions(targetRole)
  const actions = data?.next_actions ?? []

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <header className="mb-4 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-on-surface">Next best actions</h2>
          <p className="text-xs text-on-surface-variant">Generated from your three largest gaps</p>
        </div>
      </header>

      {isLoading ? (
        <ul className="space-y-2.5" aria-label="Loading recommendations">
          {[0, 1, 2].map((i) => (
            <li key={i} className="space-y-2 rounded-lg border border-border p-3">
              <div className="h-2 animate-pulse rounded bg-surface-high" />
              <div className="h-2 w-2/3 animate-pulse rounded bg-surface-high" />
            </li>
          ))}
        </ul>
      ) : isError ? (
        <p className="text-xs leading-relaxed text-on-surface-variant">
          Recommendations aren&apos;t available right now. Everything else on this page is
          unaffected — it doesn&apos;t depend on them.
        </p>
      ) : actions.length === 0 ? (
        <p className="text-xs leading-relaxed text-on-surface-variant">
          Nothing left to close on this benchmark. Pick the next rung on your track to see
          what a more senior role asks for.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {actions.map((action, i) => (
            <li key={i} className="rounded-lg border border-border p-3">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.65rem] font-bold text-primary">
                  {i + 1}
                </span>
                <p className="text-xs leading-relaxed text-on-surface">{action}</p>
              </div>
            </li>
          ))}
          <li className="pt-1">
            <button onClick={onStart} className="btn-primary w-full text-xs">
              Go to simulations <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </li>
        </ol>
      )}
    </section>
  )
}
