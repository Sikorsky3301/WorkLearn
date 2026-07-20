import { useMemo } from 'react'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useStageCompletion } from '../engine/useSimEngine'
import { stageByIndex } from '../engine/simulationConfig'
import { DISCOVERY_CONTACT, SEED_LEAD } from '../data/seedData'
import { StageHeader, StageFooterNav } from './StageChrome'
import AiCustomerChat from './AiCustomerChat'
import { Card, CardContent } from '../../../../shared/ui/shadcn/card'
import { Label } from '../../../../shared/ui/shadcn/label'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'
import { Input } from '../../../../shared/ui/shadcn/input'

const STAGE = stageByIndex(4)

export default function Stage4DiscoveryCall() {
  const call = useCrmSimStore((s) => s.discoveryCall)
  const research = useCrmSimStore((s) => s.research)
  const leadQualification = useCrmSimStore((s) => s.leadQualification)
  const appendDiscoveryMessage = useCrmSimStore((s) => s.appendDiscoveryMessage)
  const updateDiscoveryCall = useCrmSimStore((s) => s.updateDiscoveryCall)
  const { completeStageIndex } = useStageCompletion()

  const criteriaMet = [
    call.transcript.length >= 6,
    call.notes.trim().length > 0,
    call.budgetNoted.trim().length > 0 && call.timelineNoted.trim().length > 0,
  ]

  const speakingRatio = useMemo(() => {
    const repChars = call.transcript.filter((m) => m.role === 'user').reduce((s, m) => s + m.content.length, 0)
    const prospectChars = call.transcript.filter((m) => m.role === 'assistant').reduce((s, m) => s + m.content.length, 0)
    const total = repChars + prospectChars
    if (!total) return { rep: 50, prospect: 50 }
    return { rep: Math.round((repChars / total) * 100), prospect: Math.round((prospectChars / total) * 100) }
  }, [call.transcript])

  const promptContext = {
    lead: { name: SEED_LEAD.name, company: SEED_LEAD.company, painPoints: SEED_LEAD.painPoints },
    researchNotes: `Pain points: ${research.painPoints}. Opportunities: ${research.opportunities}. Risks: ${research.risks}`,
    priorStageNotes: leadQualification.reasoning,
  }

  return (
    <div>
      <StageHeader stage={STAGE} />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <AiCustomerChat
            mode="discovery"
            contact={DISCOVERY_CONTACT}
            personalityKey={DISCOVERY_CONTACT.key}
            transcript={call.transcript}
            mood={call.mood}
            onAppendMessage={appendDiscoveryMessage}
            onMoodChange={(mood) => updateDiscoveryCall({ mood })}
            promptContext={promptContext}
          />
        </div>

        <Card className="lg:col-span-2 h-fit lg:sticky lg:top-[76px]">
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">Speaking ratio</p>
              <div className="h-2 w-full rounded-full overflow-hidden flex bg-surface-high">
                <div className="h-full bg-primary" style={{ width: `${speakingRatio.rep}%` }} />
                <div className="h-full bg-outline-variant" style={{ width: `${speakingRatio.prospect}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
                <span>You {speakingRatio.rep}%</span>
                <span>{DISCOVERY_CONTACT.name.split(' ')[0]} {speakingRatio.prospect}%</span>
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Budget noted</Label>
              <Input value={call.budgetNoted} placeholder="What did they say about budget?"
                onChange={(e) => updateDiscoveryCall({ budgetNoted: e.target.value })} />
            </div>

            <div>
              <Label className="mb-1.5 block">Timeline noted</Label>
              <Input value={call.timelineNoted} placeholder="What did they say about timing?"
                onChange={(e) => updateDiscoveryCall({ timelineNoted: e.target.value })} />
            </div>

            <div>
              <Label className="mb-1.5 block">Call notes</Label>
              <Textarea rows={6} value={call.notes} placeholder="Key challenges, goals, and quotes worth remembering..."
                onChange={(e) => updateDiscoveryCall({ notes: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <StageFooterNav stage={STAGE} criteriaMet={criteriaMet} onContinue={() => completeStageIndex(4)} />
    </div>
  )
}
