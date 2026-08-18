import { Terminal, ListChecks } from 'lucide-react'

// The two score types, side by side.
//
// They come from two independent nullable columns on the same TaskCompletion
// row, and they mean genuinely different things — one is "did your code do the
// job", the other is "did you understand why". Showing them as one blended
// number would hide a student who ships working code without understanding it,
// so they are never averaged together.
//
// The quiz chip is omitted entirely when there is no quiz score, rather than
// rendered as a dash: most tasks have no post-task quiz at all, and a row of
// empty placeholders reads as missing data rather than as "not applicable".

const band = (score) =>
  score >= 85 ? 'text-emerald-700 bg-emerald-50 ring-emerald-200'
  : score >= 60 ? 'text-amber-700 bg-amber-50 ring-amber-200'
  : 'text-rose-700 bg-rose-50 ring-rose-200'

function Chip({ icon: Icon, label, score, title }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${band(score)}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="text-[0.65rem] font-bold uppercase tracking-wider opacity-70">{label}</span>
      <span className="tabular-nums">{score}</span>
    </span>
  )
}

export default function ScoreChips({ score, quizScore, className = '' }) {
  if (score == null && quizScore == null) return null
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {score != null && (
        <Chip icon={Terminal} label="Code" score={score} title="Automated grading of your submitted code, out of 100" />
      )}
      {quizScore != null && (
        <Chip icon={ListChecks} label="Quiz" score={quizScore} title="Knowledge check score, out of 100" />
      )}
    </div>
  )
}
