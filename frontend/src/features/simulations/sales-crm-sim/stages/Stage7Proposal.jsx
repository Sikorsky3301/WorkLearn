import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  FileText, AlertCircle, Lightbulb, ListChecks, TrendingUp, Calendar,
  DollarSign, CheckCircle2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useStageCompletion } from '../engine/useSimEngine'
import { stageByIndex } from '../engine/simulationConfig'
import { StageHeader, StageFooterNav } from './StageChrome'
import { Card, CardContent } from '../../../../shared/ui/shadcn/card'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'
import { Button } from '../../../../shared/ui/shadcn/button'
import { cn } from '../../../../shared/utils/cn'

const STAGE = stageByIndex(7)

const SECTIONS = [
  { key: 'executiveSummary', label: 'Executive Summary', icon: FileText, tip: 'The one-paragraph version of the whole deal.', placeholder: 'Atlas Forge needs real-time pipeline visibility to fix a forecast gap and support...' },
  { key: 'businessProblems', label: 'Business Problems', icon: AlertCircle, tip: 'What is actually broken today? Pull directly from discovery, not assumptions.', placeholder: 'No shared pipeline visibility. Manual spreadsheet tracking over 6-9 month cycles...' },
  { key: 'recommendedSolution', label: 'Recommended Solution', icon: Lightbulb, tip: 'How does Nimbus CRM solve each problem above?', placeholder: "Nimbus CRM's AI Sales Platform — centralized pipeline, automated data capture..." },
  { key: 'implementationPlan', label: 'Implementation Plan', icon: ListChecks, tip: 'Rollout steps, timeline, who does what — this reduces perceived risk.', placeholder: 'Phase 1 (Weeks 1-2): migration. Phase 2: training. Phase 3: forecast review cadence...' },
  { key: 'expectedROI', label: 'Expected ROI', icon: TrendingUp, tip: 'Tie this back to something they told you in discovery — not a generic industry stat.', placeholder: 'Closing even half of last quarter\'s forecast gap represents...' },
  { key: 'timeline', label: 'Timeline', icon: Calendar, tip: 'Key milestones and dates from signature to go-live.', placeholder: 'Signed → onboarding kickoff within 5 business days → full team live within 30 days...' },
  { key: 'pricingSummary', label: 'Pricing Summary', icon: DollarSign, tip: 'Should match exactly what you scoped in the CRM opportunity.', placeholder: '$96,000 annual contract, includes onboarding and quarterly reviews...' },
]

export default function Stage7Proposal() {
  const proposal = useCrmSimStore((s) => s.proposal)
  const updateProposal = useCrmSimStore((s) => s.updateProposal)
  const { completeStageIndex } = useStageCompletion()
  const [active, setActive] = useState(0)

  const { register, watch, getValues } = useForm({ defaultValues: proposal })
  const watched = watch()

  const isDone = (key) => (watched[key] || '').trim().length >= 5
  const criteriaMet = [SECTIONS.every((s) => isDone(s.key))]
  const section = SECTIONS[active]
  const wordCount = (watched[section.key] || '').trim().split(/\s+/).filter(Boolean).length

  function saveAndGo(index) {
    updateProposal(getValues())
    setActive(index)
  }

  return (
    <div>
      <StageHeader stage={STAGE} />

      {/* Section stepper */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {SECTIONS.map((s, i) => {
          const done = isDone(s.key)
          const isActive = i === active
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => saveAndGo(i)}
              title={s.label}
              className={cn(
                'flex items-center justify-center h-9 w-9 rounded-full shrink-0 transition-all border-2',
                done && 'bg-emerald-500 border-emerald-500 text-white',
                !done && isActive && 'bg-primary border-primary text-white ring-4 ring-primary/15',
                !done && !isActive && 'bg-white border-border text-on-surface-variant hover:border-primary/50'
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
            </button>
          )
        })}
        <div className="flex-1 min-w-2" />
        <span className="text-xs text-on-surface-variant shrink-0 pl-2">
          {SECTIONS.filter((s) => isDone(s.key)).length} / {SECTIONS.length} sections
        </span>
      </div>

      <form onBlur={() => updateProposal(getValues())}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <section.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Section {active + 1} of {SECTIONS.length}</p>
                <p className="font-semibold text-on-surface text-sm">{section.label}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4 pl-[42px]">{section.tip}</p>

            <Textarea
              key={section.key}
              rows={7}
              placeholder={section.placeholder}
              className="text-sm"
              {...register(section.key)}
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-on-surface-variant">{wordCount} words</span>
              {isDone(section.key) && (
                <span className="text-[11px] text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Section complete</span>
              )}
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
              <Button type="button" variant="outline" size="sm" disabled={active === 0} onClick={() => saveAndGo(Math.max(0, active - 1))}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button type="button" size="sm" disabled={active === SECTIONS.length - 1} onClick={() => saveAndGo(Math.min(SECTIONS.length - 1, active + 1))}>
                Next Section <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <StageFooterNav stage={STAGE} criteriaMet={criteriaMet} onContinue={(quizScore) => { updateProposal(getValues()); completeStageIndex(7, { quizScore }) }} />
    </div>
  )
}
