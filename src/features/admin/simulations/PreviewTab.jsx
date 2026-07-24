import { Loader2 } from 'lucide-react'
import { useAdminSimulation } from '../../../shared/api/hooks'
import { Card, CardContent } from '../../../shared/ui/shadcn/card'
import { Badge } from '../../../shared/ui/shadcn/badge'
import RatingStars from '../../../shared/ui/RatingStars'
import { taskTypeRegistry } from '../../simulations/generic/taskTypeRegistry'

/** Read-only content review before publishing — shows every stage's
 * title/objective/briefing/hints/success-criteria/rubric/xp+skills exactly
 * as the generic runtime will render them. A fully interactive live-run
 * preview (rendering GenericSimShell against the in-progress draft with no
 * enrollment/grading side effects) is a natural next step, deferred here
 * since it needs the public runtime endpoint to accept draft simulations for
 * a superadmin token — not built in this pass. */
export default function PreviewTab({ simId }) {
  const { data: sim, isLoading } = useAdminSimulation(simId)

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  if (!sim) return null

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Badge>{sim.domain}</Badge>
            <Badge variant="secondary">{sim.difficulty}</Badge>
          </div>
          <h2 className="text-lg font-bold text-on-surface">{sim.title}</h2>
          <p className="text-sm text-on-surface-variant mb-1.5">{sim.company} · {sim.estimated_hours} · {sim.tasks.length} tasks</p>
          <RatingStars rating={sim.rating} count={sim.rating_count} size="sm" />
        </CardContent>
      </Card>

      {sim.tasks.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-8">No stages yet — add some in the Stages tab.</p>
      ) : (
        sim.tasks.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Task {t.task_index} · {taskTypeRegistry[t.type]?.label || t.type}
                </p>
                <span className="text-xs text-on-surface-variant">{t.xp_award} XP</span>
              </div>
              <h3 className="text-sm font-bold text-on-surface mb-1">{t.title}</h3>
              {t.objective && <p className="text-xs text-on-surface-variant mb-2">{t.objective}</p>}
              {t.briefing && <p className="text-sm text-on-surface leading-relaxed mb-3 whitespace-pre-line">{t.briefing}</p>}

              {t.what_to_do?.length > 0 && (
                <div className="mb-2">
                  <p className="text-[11px] font-bold uppercase text-on-surface-variant mb-1">What to do</p>
                  <ol className="text-xs text-on-surface-variant space-y-0.5 list-decimal list-inside">
                    {t.what_to_do.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}
              {t.what_to_submit?.length > 0 && (
                <div className="mb-2">
                  <p className="text-[11px] font-bold uppercase text-on-surface-variant mb-1">What to submit</p>
                  <ul className="text-xs text-on-surface-variant space-y-0.5 list-disc list-inside">
                    {t.what_to_submit.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {t.reference_data?.fields?.length > 0 && (
                <div className="mb-3 bg-surface-low rounded-lg p-3">
                  <p className="text-[11px] font-bold uppercase text-primary mb-1.5">{t.reference_data.title || 'Reference data'}</p>
                  <div className="space-y-1.5">
                    {t.reference_data.fields.map((f, i) => (
                      <div key={i}>
                        <p className="text-[10px] font-semibold uppercase text-on-surface-variant">{f.label}</p>
                        {Array.isArray(f.value) ? (
                          <p className="text-xs text-on-surface">{f.value.join(' · ')}</p>
                        ) : (
                          <p className="text-xs text-on-surface">{f.value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {t.model_solution && (
                <div className="mb-3 bg-primary/[0.04] border border-primary/15 rounded-lg p-3">
                  <p className="text-[11px] font-bold uppercase text-primary mb-1.5">Model solution ({(t.model_solution.steps || []).length} steps)</p>
                  {t.model_solution.great_looks_like && (
                    <p className="text-xs text-on-surface-variant italic">"{t.model_solution.great_looks_like}"</p>
                  )}
                </div>
              )}
              {t.hints?.length > 0 && (
                <div className="mb-2">
                  <p className="text-[11px] font-bold uppercase text-on-surface-variant mb-1">Hints</p>
                  <ul className="text-xs text-on-surface-variant space-y-0.5 list-disc list-inside">
                    {t.hints.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}
              {t.success_criteria?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {t.success_criteria.map((c, i) => <Badge key={i} variant="outline" className="text-[10px]">{c}</Badge>)}
                </div>
              )}
              {t.rubric && Object.keys(t.rubric).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(t.rubric).map(([k, w]) => (
                    <Badge key={k} className="text-[10px] bg-primary/10 text-primary border-transparent">{k} {Math.round(w * 100)}%</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
