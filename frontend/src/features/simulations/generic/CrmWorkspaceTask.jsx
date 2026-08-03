import { CheckCircle2, Circle } from 'lucide-react'
import { useCrmSimStore } from '../../../app/store/useCrmSimStore'
import CrmShellLayout from '../sales-crm-sim/stages/Stage5Crm/CrmShellLayout'
import { Button } from '../../../components/ui/shadcn/button'
import { cn } from '../../../lib/cn'

/** Thin wrapper reusing Stage5Crm's 10-module CRM mini-app wholesale.
 * `required_entities` (from task.config) drives the completion gate instead
 * of sales-crm-sim's hardcoded criteriaMet array. Known v1 limitation: this
 * still reads/writes the one global useCrmSimStore instance — fine for one
 * running crm_workspace task at a time, not yet safe for two concurrently
 * open simulations both using this task type (see CMS plan's risk notes). */
export default function CrmWorkspaceTask({ task, onComplete }) {
  const crm = useCrmSimStore((s) => s.crm)
  const required = task.config?.required_entities || {}

  const checks = Object.entries(required).map(([entity, min]) => {
    const count = (crm[entity] || []).length
    return { label: `${entity} (${count}/${min})`, met: count >= min }
  })
  const allMet = checks.every((c) => c.met)

  return (
    <div className="flex flex-col h-[calc(100vh-260px)] min-h-[500px]">
      <div className="flex-1 min-h-0 -mx-6">
        <CrmShellLayout />
      </div>
      <div className="border-t border-border pt-4 mt-4 flex items-center justify-between gap-4 flex-wrap">
        <ul className="flex flex-wrap gap-2">
          {checks.map((c, i) => (
            <li key={i} className={cn(
              'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border',
              c.met ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-on-surface-variant bg-surface-low border-border'
            )}>
              {c.met ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
              {c.label}
            </li>
          ))}
        </ul>
        <Button disabled={!allMet} onClick={() => onComplete({ score: null, rubric_rating: null })}>
          Mark Complete
        </Button>
      </div>
    </div>
  )
}
