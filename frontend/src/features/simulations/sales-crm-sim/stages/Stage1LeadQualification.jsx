import { Building2, DollarSign, Users, Database, AlertTriangle, Newspaper, Globe, Zap } from 'lucide-react'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useStageCompletion } from '../engine/useSimEngine'
import { stageByIndex } from '../engine/simulationConfig'
import { StageHeader, StageFooterNav } from './StageChrome'
import { Card, CardContent } from '../../../../shared/ui/shadcn/card'
import { Label } from '../../../../shared/ui/shadcn/label'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'
import { Badge } from '../../../../shared/ui/shadcn/badge'
import { cn } from '../../../../shared/utils/cn'

const STAGE = stageByIndex(1)

const LEVELS = ['low', 'medium', 'high']

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant mb-1">{label}</p>
        {children}
      </div>
    </div>
  )
}

function TagList({ items, color }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((p, i) => (
        <span key={i} className={cn('text-xs px-2.5 py-1 rounded-lg border leading-snug', color)}>{p}</span>
      ))}
    </div>
  )
}

function SegmentedPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {LEVELS.map((lvl) => (
        <button
          key={lvl}
          type="button"
          onClick={() => onChange(lvl)}
          className={cn(
            'rounded-lg border-2 py-2 text-xs font-semibold capitalize transition-all',
            value === lvl ? 'border-primary bg-primary text-white shadow-sm' : 'border-border text-on-surface-variant hover:border-primary/40'
          )}
        >
          {lvl}
        </button>
      ))}
    </div>
  )
}

function scoreZone(score) {
  if (score == null) return { color: '#94a3b8', label: 'Unscored' }
  if (score < 40) return { color: '#dc2626', label: 'Weak fit' }
  if (score < 70) return { color: '#d97706', label: 'Worth pursuing' }
  return { color: '#059669', label: 'Strong fit' }
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
  const zone = scoreZone(form.leadScore)

  return (
    <div>
      <StageHeader stage={STAGE} />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Lead file */}
        <Card className="lg:col-span-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {lead.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">{lead.name}</h2>
                  <p className="text-xs text-on-surface-variant">{lead.title} · {lead.company}</p>
                </div>
              </div>
              <Badge variant="outline">New Inbound Lead</Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5 p-4 bg-surface-low rounded-xl">
              <InfoRow icon={Building2} label="Industry"><p className="text-sm text-on-surface">{lead.industry}</p></InfoRow>
              <InfoRow icon={DollarSign} label="Revenue"><p className="text-sm text-on-surface">{lead.revenue}</p></InfoRow>
              <InfoRow icon={Users} label="Employees"><p className="text-sm text-on-surface">{lead.employees}</p></InfoRow>
              <InfoRow icon={Database} label="Existing CRM"><p className="text-sm text-on-surface">{lead.existingCrm}</p></InfoRow>
            </div>

            <div className="space-y-4">
              <InfoRow icon={AlertTriangle} label="Pain points">
                <TagList items={lead.painPoints} color="bg-red-50 text-red-700 border-red-100" />
              </InfoRow>
              <InfoRow icon={Newspaper} label="Recent news">
                <TagList items={lead.recentNews} color="bg-blue-50 text-blue-700 border-blue-100" />
              </InfoRow>
              <InfoRow icon={Globe} label="Website summary">
                <p className="text-sm text-on-surface leading-relaxed">{lead.websiteSummary}</p>
              </InfoRow>
              <InfoRow icon={Zap} label="Buying signals">
                <TagList items={lead.buyingSignals} color="bg-emerald-50 text-emerald-700 border-emerald-100" />
              </InfoRow>
            </div>
          </CardContent>
        </Card>

        {/* Qualification form */}
        <Card className="lg:col-span-2 h-fit lg:sticky lg:top-[76px]">
          <CardContent className="p-5 space-y-5">
            <h3 className="text-sm font-bold text-on-surface">Your Assessment</h3>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Lead score</Label>
                <span className="text-[11px] font-semibold" style={{ color: zone.color }}>{zone.label}</span>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={form.leadScore ?? 50}
                onChange={(e) => updateLeadQualification({ leadScore: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: zone.color }}
              />
              <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: zone.color }}>
                {form.leadScore ?? '—'}<span className="text-sm text-on-surface-variant font-normal"> / 100</span>
              </p>
            </div>

            <div>
              <Label className="mb-1.5 block">Buying intent</Label>
              <SegmentedPicker value={form.buyingIntent} onChange={(v) => updateLeadQualification({ buyingIntent: v })} />
            </div>

            <div>
              <Label className="mb-1.5 block">Priority</Label>
              <SegmentedPicker value={form.priority} onChange={(v) => updateLeadQualification({ priority: v })} />
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

      <StageFooterNav stage={STAGE} criteriaMet={criteriaMet} onContinue={(quizScore) => completeStageIndex(1, { quizScore })} />
    </div>
  )
}
