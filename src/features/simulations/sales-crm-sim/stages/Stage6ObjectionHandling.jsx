import { Check } from 'lucide-react'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useStageCompletion } from '../engine/useSimEngine'
import { stageByIndex } from '../engine/simulationConfig'
import { OBJECTION_CONTACT, SEED_LEAD } from '../data/seedData'
import { StageHeader, StageFooterNav } from './StageChrome'
import AiCustomerChat from './AiCustomerChat'
import { Card, CardContent } from '../../../../shared/ui/shadcn/card'
import { cn } from '../../../../shared/utils/cn'

const STAGE = stageByIndex(6)

const OBJECTION_TYPES = [
  'Too expensive',
  'Happy with competitor',
  'Need management approval',
  'Implementation concerns',
  'Security concerns',
  'No budget',
  'Already using another CRM',
]

export default function Stage6ObjectionHandling() {
  const objectionHandling = useCrmSimStore((s) => s.objectionHandling)
  const discoveryCall = useCrmSimStore((s) => s.discoveryCall)
  const opportunity = useCrmSimStore((s) => s.crm.opportunities[0])
  const appendObjectionMessage = useCrmSimStore((s) => s.appendObjectionMessage)
  const updateObjectionHandling = useCrmSimStore((s) => s.updateObjectionHandling)
  const { completeStageIndex } = useStageCompletion()

  const criteriaMet = [
    objectionHandling.transcript.length >= 4,
    objectionHandling.objectionsResolved.length >= 1,
  ]

  function toggleRaised(item) {
    const raised = objectionHandling.objectionsRaised.includes(item)
      ? objectionHandling.objectionsRaised.filter((o) => o !== item)
      : [...objectionHandling.objectionsRaised, item]
    updateObjectionHandling({ objectionsRaised: raised })
  }

  function toggleResolved(item) {
    const resolved = objectionHandling.objectionsResolved.includes(item)
      ? objectionHandling.objectionsResolved.filter((o) => o !== item)
      : [...objectionHandling.objectionsResolved, item]
    updateObjectionHandling({ objectionsResolved: resolved })
  }

  const promptContext = {
    lead: { name: SEED_LEAD.name, company: SEED_LEAD.company },
    researchNotes: discoveryCall.notes,
    priorStageNotes: opportunity
      ? `Opportunity "${opportunity.name}" — stage ${opportunity.stage}, amount ${opportunity.amount ?? 'unset'}, close date ${opportunity.expectedCloseDate ?? 'unset'}.`
      : 'No opportunity created yet in the CRM.',
  }

  return (
    <div>
      <StageHeader stage={STAGE} />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <AiCustomerChat
            mode="objection"
            contact={OBJECTION_CONTACT}
            personalityKey={OBJECTION_CONTACT.key}
            transcript={objectionHandling.transcript}
            mood={objectionHandling.mood}
            onAppendMessage={appendObjectionMessage}
            onMoodChange={(mood) => updateObjectionHandling({ mood })}
            promptContext={promptContext}
          />
        </div>

        <Card className="lg:col-span-2 h-fit lg:sticky lg:top-[76px]">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-on-surface mb-1">Objection Tracker</h3>
            <p className="text-xs text-on-surface-variant mb-4">Tag what comes up in the conversation and whether you resolved it.</p>
            <div className="space-y-1.5">
              {OBJECTION_TYPES.map((item) => {
                const raised = objectionHandling.objectionsRaised.includes(item)
                const resolved = objectionHandling.objectionsResolved.includes(item)
                return (
                  <div key={item} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                    <span className="text-sm text-on-surface">{item}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleRaised(item)}
                        className={cn(
                          'text-[11px] font-semibold px-2 py-1 rounded border transition-colors',
                          raised ? 'bg-amber-100 text-amber-700 border-amber-200' : 'border-border text-on-surface-variant hover:border-amber-300'
                        )}
                      >
                        Raised
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleResolved(item)}
                        disabled={!raised}
                        className={cn(
                          'text-[11px] font-semibold px-2 py-1 rounded border transition-colors flex items-center gap-1 disabled:opacity-40',
                          resolved ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'border-border text-on-surface-variant hover:border-emerald-300'
                        )}
                      >
                        <Check className="h-3 w-3" /> Resolved
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <StageFooterNav stage={STAGE} criteriaMet={criteriaMet} onContinue={(quizScore) => completeStageIndex(6, { quizScore })} />
    </div>
  )
}
