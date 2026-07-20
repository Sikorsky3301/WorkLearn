import { useState } from 'react'
import { CalendarCheck, FileSignature, Handshake, CalendarClock, ClipboardList, Trophy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useStageCompletion } from '../engine/useSimEngine'
import { stageByIndex } from '../engine/simulationConfig'
import { StageHeader, StageFooterNav } from './StageChrome'
import { Card, CardContent } from '../../../../shared/ui/shadcn/card'
import { Button } from '../../../../shared/ui/shadcn/button'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'
import { Label } from '../../../../shared/ui/shadcn/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../shared/ui/shadcn/select'
import { cn } from '../../../../shared/utils/cn'

const STAGE = stageByIndex(8)

function ActionCard({ icon: Icon, title, description, done, action }) {
  return (
    <Card className={cn(done && 'border-emerald-300 bg-emerald-50/40')}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', done ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary')}>
          {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface">{title}</p>
          <p className="text-xs text-on-surface-variant mb-2.5">{description}</p>
          {action}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Stage8Close() {
  const close = useCrmSimStore((s) => s.close)
  const opportunities = useCrmSimStore((s) => s.crm.opportunities)
  const updateClose = useCrmSimStore((s) => s.updateClose)
  const addTask = useCrmSimStore((s) => s.addTask)
  const addCalendarEvent = useCrmSimStore((s) => s.addCalendarEvent)
  const updateOpportunity = useCrmSimStore((s) => s.updateOpportunity)
  const { completeStageIndex } = useStageCompletion()

  const [finalStage, setFinalStage] = useState('Closed Won')
  const primaryOpp = opportunities[0]

  const criteriaMet = [
    close.demoScheduled,
    close.signatureRequested,
    close.followUpBooked,
    close.onboardingTaskCreated,
    close.opportunityStageUpdated,
  ]

  function scheduleDemo() {
    addCalendarEvent({ title: `Product demo — ${primaryOpp?.name ?? 'Atlas Forge deal'}`, date: new Date(Date.now() + 3 * 86400000).toISOString() })
    updateClose({ demoScheduled: true })
    toast.success('Demo scheduled')
  }

  function requestSignature() {
    addTask({ title: 'Send contract for signature', priority: 'high' })
    updateClose({ signatureRequested: true })
    toast.success('Signature requested')
  }

  function bookFollowUp() {
    addCalendarEvent({ title: `Follow-up — ${primaryOpp?.name ?? 'Atlas Forge deal'}`, date: new Date(Date.now() + 7 * 86400000).toISOString() })
    updateClose({ followUpBooked: true })
    toast.success('Follow-up booked')
  }

  function createOnboardingTask() {
    addTask({ title: 'Kick off customer onboarding', priority: 'medium' })
    updateClose({ onboardingTaskCreated: true })
    toast.success('Onboarding task created')
  }

  function updateStage() {
    if (primaryOpp) updateOpportunity(primaryOpp.id, { stage: finalStage, probability: finalStage === 'Closed Won' ? 100 : 0 })
    updateClose({ opportunityStageUpdated: true })
    toast.success(`Opportunity marked ${finalStage}`)
  }

  return (
    <div>
      <StageHeader stage={STAGE} />

      {!primaryOpp && (
        <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          No opportunity found — go back to Stage 5 (CRM) and create one before closing.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <ActionCard
          icon={CalendarCheck} title="Schedule Demo" description="Get the product demo on the calendar."
          done={close.demoScheduled}
          action={<Button size="sm" onClick={scheduleDemo} disabled={close.demoScheduled}>{close.demoScheduled ? 'Scheduled' : 'Schedule demo'}</Button>}
        />
        <ActionCard
          icon={FileSignature} title="Request Signature" description="Send the contract for signature."
          done={close.signatureRequested}
          action={<Button size="sm" onClick={requestSignature} disabled={close.signatureRequested}>{close.signatureRequested ? 'Requested' : 'Request signature'}</Button>}
        />
        <ActionCard
          icon={CalendarClock} title="Book Follow-up" description="Always leave a follow-up on the calendar, win or lose."
          done={close.followUpBooked}
          action={<Button size="sm" onClick={bookFollowUp} disabled={close.followUpBooked}>{close.followUpBooked ? 'Booked' : 'Book follow-up'}</Button>}
        />
        <ActionCard
          icon={ClipboardList} title="Create Onboarding Task" description="Turn a signature into a happy customer."
          done={close.onboardingTaskCreated}
          action={<Button size="sm" onClick={createOnboardingTask} disabled={close.onboardingTaskCreated}>{close.onboardingTaskCreated ? 'Created' : 'Create onboarding task'}</Button>}
        />
        <ActionCard
          icon={Handshake} title="Negotiation Notes" description="Log how the final negotiation went."
          done={close.negotiationNotes.trim().length > 0}
          action={
            <Textarea
              rows={2} value={close.negotiationNotes} placeholder="Final terms, concessions made, sticking points..."
              onChange={(e) => updateClose({ negotiationNotes: e.target.value })}
            />
          }
        />
        <ActionCard
          icon={Trophy} title="Update Opportunity Stage" description="A deal isn't closed until the CRM says so."
          done={close.opportunityStageUpdated}
          action={
            <div className="flex items-center gap-2">
              <Select value={finalStage} onValueChange={setFinalStage}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Closed Won">Closed Won</SelectItem>
                  <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={updateStage} disabled={!primaryOpp || close.opportunityStageUpdated}>
                {close.opportunityStageUpdated ? 'Updated' : 'Update'}
              </Button>
            </div>
          }
        />
      </div>

      <StageFooterNav stage={STAGE} criteriaMet={criteriaMet} isLast onContinue={() => completeStageIndex(8)} />
    </div>
  )
}
