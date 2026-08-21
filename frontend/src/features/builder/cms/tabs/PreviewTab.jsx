import { useState } from 'react'
import { Loader2, PlayCircle } from 'lucide-react'
import { useAdminSimulation } from '../../../../hooks'
import { Card, CardContent } from '../../../../components/ui/shadcn/card'
import { Badge } from '../../../../components/ui/shadcn/badge'
import RatingStars from '../../../../components/ui/RatingStars'
import { taskTypeRegistry } from '../../../simulations/generic/taskTypeRegistry'
import InteractiveSimPreview from '../../../simulations/generic/InteractiveSimPreview'

/** Read-only content review before publishing (skim-check) — shows every
 * stage's title/objective/briefing/hints/success-criteria/rubric/xp+skills
 * exactly as the generic runtime will render them — plus a full interactive
 * run-through launched via InteractiveSimPreview, rendering the actual
 * student-facing components against the draft with no enrollment/grading
 * side effects (see admin_simulations.py's preview-full/preview-run-sandbox). */
export default function PreviewTab({ simId }) {
  const { data: sim, isLoading } = useAdminSimulation(simId)
  const [interactiveOpen, setInteractiveOpen] = useState(false)

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  if (!sim) return null

  return (
    <div className="space-y-4">
      {interactiveOpen && <InteractiveSimPreview simId={simId} onClose={() => setInteractiveOpen(false)} />}

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2">
              <Badge>{sim.domain}</Badge>
              <Badge variant="secondary">{sim.difficulty}</Badge>
            </div>
            <button
              onClick={() => setInteractiveOpen(true)}
              disabled={sim.tasks.length === 0}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg disabled:opacity-40 cursor-pointer"
            >
              <PlayCircle className="h-4 w-4" /> Launch Interactive Preview
            </button>
          </div>
          <h2 className="text-lg font-bold text-on-surface dark:text-slate-100">{sim.title}</h2>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 mb-1.5">{sim.company} · {sim.estimated_hours} · {sim.tasks.length} tasks</p>
          <RatingStars rating={sim.rating} count={sim.rating_count} size="sm" />
        </CardContent>
      </Card>

      {sim.tasks.length === 0 ? (
        <p className="text-sm text-on-surface-variant dark:text-slate-400 text-center py-8">No stages yet — add some in the Stages tab.</p>
      ) : (
        sim.tasks.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Task {t.task_index} · {taskTypeRegistry[t.type]?.label || t.type}
                </p>
                <span className="text-xs text-on-surface-variant dark:text-slate-400">{t.xp_award} XP</span>
              </div>
              <h3 className="text-sm font-bold text-on-surface dark:text-slate-100 mb-1">{t.title}</h3>
              {t.objective && <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-2">{t.objective}</p>}
              {t.briefing && <p className="text-sm text-on-surface dark:text-slate-200 leading-relaxed mb-3 whitespace-pre-line">{t.briefing}</p>}

              {t.what_to_do?.length > 0 && (
                <div className="mb-2">
                  <p className="text-[11px] font-bold uppercase text-on-surface-variant dark:text-slate-400 mb-1">What to do</p>
                  <ol className="text-xs text-on-surface-variant dark:text-slate-400 space-y-0.5 list-decimal list-inside">
                    {t.what_to_do.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}
              {t.what_to_submit?.length > 0 && (
                <div className="mb-2">
                  <p className="text-[11px] font-bold uppercase text-on-surface-variant dark:text-slate-400 mb-1">What to submit</p>
                  <ul className="text-xs text-on-surface-variant dark:text-slate-400 space-y-0.5 list-disc list-inside">
                    {t.what_to_submit.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {t.reference_data?.fields?.length > 0 && (
                <div className="mb-3 bg-surface-low dark:bg-slate-800/60 rounded-lg p-3">
                  <p className="text-[11px] font-bold uppercase text-primary mb-1.5">{t.reference_data.title || 'Reference data'}</p>
                  <div className="space-y-1.5">
                    {t.reference_data.fields.map((f, i) => (
                      <div key={i}>
                        <p className="text-[10px] font-semibold uppercase text-on-surface-variant dark:text-slate-500">{f.label}</p>
                        {Array.isArray(f.value) ? (
                          <p className="text-xs text-on-surface dark:text-slate-200">{f.value.join(' · ')}</p>
                        ) : (
                          <p className="text-xs text-on-surface dark:text-slate-200">{f.value}</p>
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
                    <p className="text-xs text-on-surface-variant dark:text-slate-400 italic">"{t.model_solution.great_looks_like}"</p>
                  )}
                </div>
              )}
              {t.hints?.length > 0 && (
                <div className="mb-2">
                  <p className="text-[11px] font-bold uppercase text-on-surface-variant dark:text-slate-400 mb-1">Hints</p>
                  <ul className="text-xs text-on-surface-variant dark:text-slate-400 space-y-0.5 list-disc list-inside">
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
