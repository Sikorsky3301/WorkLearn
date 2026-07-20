import { useForm } from 'react-hook-form'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useStageCompletion } from '../engine/useSimEngine'
import { stageByIndex } from '../engine/simulationConfig'
import { StageHeader, StageFooterNav } from './StageChrome'
import { Card, CardContent } from '../../../../shared/ui/shadcn/card'
import { Label } from '../../../../shared/ui/shadcn/label'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'

const STAGE = stageByIndex(7)

const SECTIONS = [
  { key: 'executiveSummary', label: 'Executive Summary', placeholder: 'The one-paragraph version of the whole deal...' },
  { key: 'businessProblems', label: 'Business Problems', placeholder: 'What is actually broken today?' },
  { key: 'recommendedSolution', label: 'Recommended Solution', placeholder: 'How does Nimbus CRM solve it?' },
  { key: 'implementationPlan', label: 'Implementation Plan', placeholder: 'Rollout steps, timeline, who does what...' },
  { key: 'expectedROI', label: 'Expected ROI', placeholder: 'Tie this back to something they told you in discovery...' },
  { key: 'timeline', label: 'Timeline', placeholder: 'Key milestones and dates...' },
  { key: 'pricingSummary', label: 'Pricing Summary', placeholder: 'Should match what you scoped in the opportunity...' },
]

export default function Stage7Proposal() {
  const proposal = useCrmSimStore((s) => s.proposal)
  const updateProposal = useCrmSimStore((s) => s.updateProposal)
  const { completeStageIndex } = useStageCompletion()

  const { register, watch, getValues } = useForm({ defaultValues: proposal })
  const watched = watch()

  const criteriaMet = [SECTIONS.every((s) => (watched[s.key] || '').trim().length >= 5)]

  return (
    <div>
      <StageHeader stage={STAGE} />

      <form onBlur={() => updateProposal(getValues())}>
        <Card>
          <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
            {SECTIONS.map((section) => (
              <div key={section.key} className={section.key === 'executiveSummary' ? 'sm:col-span-2' : ''}>
                <Label className="mb-1.5 block">{section.label}</Label>
                <Textarea rows={section.key === 'executiveSummary' ? 3 : 4} placeholder={section.placeholder} {...register(section.key)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </form>

      <StageFooterNav stage={STAGE} criteriaMet={criteriaMet} onContinue={() => { updateProposal(getValues()); completeStageIndex(7) }} />
    </div>
  )
}
