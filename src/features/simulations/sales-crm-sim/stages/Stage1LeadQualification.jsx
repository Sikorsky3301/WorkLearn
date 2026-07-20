import { Building2, DollarSign, Users, Database, AlertTriangle, Newspaper, Globe, Zap } from 'lucide-react'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useStageCompletion } from '../engine/useSimEngine'
import { stageByIndex } from '../engine/simulationConfig'
import { StageHeader, StageFooterNav } from './StageChrome'
import { Card, CardContent } from '../../../../shared/ui/shadcn/card'
import { Label } from '../../../../shared/ui/shadcn/label'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../shared/ui/shadcn/select'
import { Badge } from '../../../../shared/ui/shadcn/badge'

const STAGE = stageByIndex(1)

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
        <div className="text-sm text-on-surface">{children}</div>
      </div>
    </div>
  )
}

export default function Stage1LeadQualification() {
  const lead = useCrmSimStore((s) => s.crm.leads[0])
  const form = useCrmSimStore((s) => s.leadQualification)
  const updateLeadQualification = useCrmSimStore((s) => s.updateLeadQualification)
  const { completeStageIndex } = useStageCompletion()

  const criteriaMet = [
    form.leadScore != null,
    !!form.buyingIntent,
    (form.reasoning || '').trim().length >= 40,
  ]

  return (
    <div>
      <StageHeader stage={STAGE} />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Lead file */}
        <Card className="lg:col-span-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-on-surface">{lead.name}</h2>
                <p className="text-xs text-on-surface-variant">{lead.title} · {lead.company}</p>
              </div>
              <Badge variant="outline">New Inbound Lead</Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <InfoRow icon={Building2} label="Industry">{lead.industry}</InfoRow>
              <InfoRow icon={DollarSign} label="Revenue">{lead.revenue}</InfoRow>
              <InfoRow icon={Users} label="Employees">{lead.employees}</InfoRow>
              <InfoRow icon={Database} label="Existing CRM">{lead.existingCrm}</InfoRow>
            </div>

            <div className="space-y-4">
              <InfoRow icon={AlertTriangle} label="Pain points">
                <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                  {lead.painPoints.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </InfoRow>
              <InfoRow icon={Newspaper} label="Recent news">
                <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                  {lead.recentNews.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </InfoRow>
              <InfoRow icon={Globe} label="Website summary">{lead.websiteSummary}</InfoRow>
              <InfoRow icon={Zap} label="Buying signals">
                <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                  {lead.buyingSignals.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </InfoRow>
            </div>
          </CardContent>
        </Card>

        {/* Qualification form */}
        <Card className="lg:col-span-2 h-fit lg:sticky lg:top-[76px]">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-on-surface">Your Assessment</h3>

            <div>
              <Label className="mb-1.5 block">Lead score (0-100)</Label>
              <input
                type="range" min={0} max={100} step={5}
                value={form.leadScore ?? 50}
                onChange={(e) => updateLeadQualification({ leadScore: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <p className="text-sm font-semibold text-primary mt-1">{form.leadScore ?? '—'} / 100</p>
            </div>

            <div>
              <Label className="mb-1.5 block">Buying intent</Label>
              <Select value={form.buyingIntent} onValueChange={(v) => updateLeadQualification({ buyingIntent: v })}>
                <SelectTrigger><SelectValue placeholder="Select intent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => updateLeadQualification({ priority: v })}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block">Notes</Label>
              <Textarea rows={3} value={form.notes} placeholder="Anything else worth flagging..."
                onChange={(e) => updateLeadQualification({ notes: e.target.value })} />
            </div>

            <div>
              <Label className="mb-1.5 block">Reasoning — why this score?</Label>
              <Textarea rows={4} value={form.reasoning} placeholder="Defend your score and priority call..."
                onChange={(e) => updateLeadQualification({ reasoning: e.target.value })} />
              <p className="text-[11px] text-on-surface-variant mt-1">{(form.reasoning || '').trim().length} / 40 characters minimum</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <StageFooterNav stage={STAGE} criteriaMet={criteriaMet} onContinue={() => completeStageIndex(1)} />
    </div>
  )
}
