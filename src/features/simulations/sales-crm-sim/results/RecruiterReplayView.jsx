import { ArrowLeft, Clock } from 'lucide-react'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { STAGES } from '../engine/simulationConfig'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/ui/shadcn/card'
import { Button } from '../../../../shared/ui/shadcn/button'
import { Badge } from '../../../../shared/ui/shadcn/badge'
import { Separator } from '../../../../shared/ui/shadcn/separator'
import { cn } from '../../../../shared/utils/cn'

function eventLabel(evt) {
  const stage = STAGES.find((s) => s.index === evt.stage)?.shortTitle ?? `Stage ${evt.stage}`
  switch (evt.type) {
    case 'sim_start': return 'Started the simulation'
    case 'stage_enter': return `Entered ${stage}`
    case 'stage_complete': return `Completed ${stage}`
    case 'crm_create': return `Created ${evt.payload.entity} in CRM`
    case 'crm_update': return `Updated ${evt.payload.entity} in CRM`
    case 'crm_delete': return `Deleted ${evt.payload.entity} from CRM`
    case 'email_revision': return 'Revised the outreach email'
    case 'email_graded': return `Graded outreach email (${evt.payload.grade?.overall ?? '—'}/100)`
    case 'chat_message': return `Sent a message (${evt.payload.stage})`
    case 'decision': return `Recorded a close-stage decision`
    case 'field_update': return `Updated ${evt.payload.form} notes`
    default: return evt.type
  }
}

function Transcript({ title, transcript }) {
  if (!transcript.length) return null
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2 max-h-72 overflow-y-auto">
        {transcript.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[75%] rounded-lg px-3 py-1.5 text-xs', m.role === 'user' ? 'bg-primary text-white' : 'bg-surface-low text-on-surface')}>
              {m.content}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function RecruiterReplayView({ onBack }) {
  const eventLog = useCrmSimStore((s) => s.eventLog)
  const discoveryCall = useCrmSimStore((s) => s.discoveryCall)
  const objectionHandling = useCrmSimStore((s) => s.objectionHandling)
  const leadQualification = useCrmSimStore((s) => s.leadQualification)
  const research = useCrmSimStore((s) => s.research)
  const close = useCrmSimStore((s) => s.close)

  const crmEvents = eventLog.filter((e) => e.type.startsWith('crm_'))

  return (
    <div className="min-h-screen bg-surface-low py-8">
      <div className="max-w-container mx-auto px-6 space-y-6">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back to results</Button>
        <h1 className="text-2xl font-bold text-on-surface">Recruiter Replay</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          <Transcript title="Discovery Call Transcript" transcript={discoveryCall.transcript} />
          <Transcript title="Objection Handling Transcript" transcript={objectionHandling.transcript} />
        </div>

        <Card>
          <CardHeader><CardTitle>Decision History</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-on-surface mb-1">Lead Qualification</p>
              <p className="text-on-surface-variant">
                Score {leadQualification.leadScore ?? '—'}/100 · Intent: {leadQualification.buyingIntent || '—'} · Priority: {leadQualification.priority || '—'}
              </p>
              <p className="text-on-surface-variant italic mt-1">"{leadQualification.reasoning}"</p>
            </div>
            <Separator />
            <div>
              <p className="font-semibold text-on-surface mb-1">Research Findings</p>
              <p className="text-on-surface-variant"><span className="font-medium">Pain points:</span> {research.painPoints || '—'}</p>
              <p className="text-on-surface-variant"><span className="font-medium">Opportunities:</span> {research.opportunities || '—'}</p>
              <p className="text-on-surface-variant"><span className="font-medium">Risks:</span> {research.risks || '—'}</p>
            </div>
            <Separator />
            <div>
              <p className="font-semibold text-on-surface mb-1">Close</p>
              <p className="text-on-surface-variant">{close.negotiationNotes || 'No negotiation notes recorded.'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>CRM Action Log ({crmEvents.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 max-h-64 overflow-y-auto">
            {crmEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                <span className="text-on-surface">{eventLabel(e)}</span>
                <span className="text-on-surface-variant">{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Full Timeline ({eventLog.length} events)</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 max-h-96 overflow-y-auto">
            {eventLog.map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-xs py-1">
                <Badge variant="outline" className="shrink-0 w-16 justify-center">Stage {e.stage}</Badge>
                <span className="text-on-surface flex-1">{eventLabel(e)}</span>
                <span className="text-on-surface-variant shrink-0">{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
