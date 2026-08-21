import { ArrowRight } from 'lucide-react'
import { CATEGORY_STYLE } from '../../../lib/skillCategories'

// Skill points earned, strongest first.
//
// Labels and categories arrive with each row from the server. The page used to
// receive a bare {key: score} object and carry a five-entry label map covering
// only Data Analytics, so an Engineering or Sales student read their own skills
// as `crm_accuracy` and `html_css`.
//
// Deliberately no benchmark line here — that comparison is the Skill GPS's job,
// and duplicating it would mean two pages that can disagree. This one answers
// "what have I built up", and links across for "is it enough".
export default function SkillGrowth({ skills, onOpenSkillGps, limit = 8 }) {
  const rows = skills ?? []
  const shown = rows.slice(0, limit)

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-on-surface">Skills earned</h2>
          <p className="text-xs text-on-surface-variant">
            {rows.length === 0 ? 'From graded tasks' : `${rows.length} skill${rows.length === 1 ? '' : 's'}, strongest first`}
          </p>
        </div>
      </header>

      {shown.length === 0 ? (
        <p className="py-6 text-center text-xs text-on-surface-variant">
          Complete a graded task and the skills it awards appear here.
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((s) => {
            const style = CATEGORY_STYLE[s.category] ?? CATEGORY_STYLE.Technical
            return (
              <li key={s.skill_key}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                    <span className="truncate text-xs font-semibold text-on-surface">{s.label}</span>
                  </span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-on-surface">
                    {s.current_score}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-high">
                  <div
                    className={`h-full rounded-full ${style.bar}`}
                    style={{ width: `${Math.min(100, s.current_score)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <button
        onClick={onOpenSkillGps}
        className="mt-4 flex w-full items-center justify-center gap-1.5 border-t border-border pt-3 text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
      >
        {rows.length > limit ? `See all ${rows.length} in Skill GPS` : 'Compare against a role in Skill GPS'}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </section>
  )
}
