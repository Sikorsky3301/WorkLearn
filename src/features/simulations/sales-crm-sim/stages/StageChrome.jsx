import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { Button } from '../../../../shared/ui/shadcn/button'
import { cn } from '../../../../shared/utils/cn'

export function StageHeader({ stage }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
        Stage {stage.index} of 8 — {stage.shortTitle}
      </p>
      <h1 className="text-xl font-bold text-on-surface mb-1.5">{stage.title}</h1>
      <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">{stage.briefing}</p>
    </div>
  )
}

export function StageFooterNav({ stage, criteriaMet, isLast, onContinue }) {
  const allMet = criteriaMet.length > 0 && criteriaMet.every(Boolean)
  return (
    <div className="mt-8 border-t border-border pt-5 flex items-center justify-between gap-4 flex-wrap">
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {stage.successCriteria.map((c, i) => (
          <li
            key={i}
            className={cn('flex items-center gap-1.5 text-xs', criteriaMet[i] ? 'text-emerald-700' : 'text-on-surface-variant')}
          >
            {criteriaMet[i] ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
            {c}
          </li>
        ))}
      </ul>
      <Button onClick={onContinue} disabled={!allMet} className="shrink-0">
        {isLast ? 'Finish Simulation' : 'Continue'} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
