import { AlertTriangle, CheckCircle2, ClipboardCheck, Zap } from 'lucide-react'

// The brief, kept beside the code rather than behind a tab.
//
// What you're building, the numbered instructions with the XP they're worth,
// and whatever the last run had to say.
//
// Hints and the worked solution deliberately are NOT here any more. Both moved
// into HelpDrawer, behind toolbar buttons: the rail is the thing you read
// while working, and a permanently-visible "reveal the answer" card at the
// bottom of it was both a standing distraction and a claim on space every
// task paid for whether or not anyone opened it.

function FeedbackCallout({ result, isSubmit }) {
  if (!result) return null

  const score = result.score ?? 0
  const details = result.details || {}
  const failed = (result.checks || []).filter((c) => !c.pass)
  const errored = Boolean(details.stderr?.trim()) || details.error

  if (errored && score === 0) {
    return (
      <div className="rounded-xl bg-rose-50 p-4 ring-1 ring-rose-200">
        <p className="flex items-center gap-2 font-display text-sm font-extrabold text-rose-900">
          <AlertTriangle className="h-4 w-4" /> Your code didn&apos;t run
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-rose-800">
          Check the Errors tab for the full message — it usually points at the exact line.
        </p>
      </div>
    )
  }

  const passed = score >= 80
  return (
    <div className={`rounded-xl p-4 ring-1 ${passed ? 'bg-emerald-50 ring-emerald-200' : 'bg-amber-50 ring-amber-200'}`}>
      <p className={`flex items-center gap-2 font-display text-sm font-extrabold ${passed ? 'text-emerald-900' : 'text-amber-900'}`}>
        {passed ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {passed ? 'Looking good' : 'Not quite there'} — {score}/100
      </p>
      {!isSubmit && (
        <p className={`mt-1 text-xs font-semibold ${passed ? 'text-emerald-700' : 'text-amber-700'}`}>
          Trial run — nothing recorded yet.
        </p>
      )}
      {failed.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {failed.slice(0, 4).map((c, i) => (
            <li key={c.id ?? i} className={`flex gap-2 text-sm ${passed ? 'text-emerald-800' : 'text-amber-800'}`}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
              {c.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ExerciseRail({ task, sectionLabel, result, isSubmit }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">
          {sectionLabel ? `${sectionLabel} · ` : ''}Exercise
        </p>
        <h1 className="mt-1 font-display text-xl font-extrabold leading-snug text-on-surface">{task.title}</h1>
        {task.objective && (
          <p className="mt-2.5 text-sm leading-relaxed text-on-surface-variant">{task.objective}</p>
        )}
      </div>

      {task.what_to_do?.length > 0 && (
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-on-surface">
              Instructions
            </h2>
            {task.xp_award > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[0.65rem] font-bold text-amber-800">
                <Zap className="h-3 w-3" /> {task.xp_award} XP
              </span>
            )}
          </div>
          <ol className="space-y-3">
            {task.what_to_do.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-on-surface">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-low font-mono text-[0.65rem] font-bold text-primary">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {result && (
        <div className="border-b border-slate-200 px-6 py-5">
          <FeedbackCallout result={result} isSubmit={isSubmit} />
        </div>
      )}

      {task.what_to_submit?.length > 0 && (
        <div className="px-6 py-5">
          <h2 className="mb-2.5 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-on-surface">
            <ClipboardCheck className="h-4 w-4 text-primary" /> What to submit
          </h2>
          <ul className="space-y-1.5">
            {task.what_to_submit.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-on-surface-variant">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
