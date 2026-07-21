import { useState } from 'react'
import { Building2, Package, Swords, TriangleAlert, UserRound, Wallet, CheckCircle2, Circle } from 'lucide-react'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useStageCompletion } from '../engine/useSimEngine'
import { stageByIndex } from '../engine/simulationConfig'
import { ACCOUNT_RESEARCH } from '../data/seedData'
import { StageHeader, StageFooterNav } from './StageChrome'
import { Card, CardContent } from '../../../../shared/ui/shadcn/card'
import { Label } from '../../../../shared/ui/shadcn/label'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../shared/ui/shadcn/tabs'
import { cn } from '../../../../shared/utils/cn'

const STAGE = stageByIndex(2)
const MIN_LEN = 10

const TABS = [
  { value: 'profile', label: 'Profile', icon: Building2 },
  { value: 'products', label: 'Products', icon: Package },
  { value: 'competitors', label: 'Competitors', icon: Swords },
  { value: 'challenges', label: 'Challenges', icon: TriangleAlert },
  { value: 'people', label: 'Decision Makers', icon: UserRound },
  { value: 'budget', label: 'Budget & Timeline', icon: Wallet },
]

function ChipList({ items, color }) {
  return (
    <div className="space-y-2">
      {items.map((p, i) => (
        <div key={i} className={cn('text-sm leading-relaxed rounded-lg border px-3 py-2', color)}>{p}</div>
      ))}
    </div>
  )
}

const ANALYSIS_FIELDS = [
  { key: 'painPoints', label: 'Pain points', placeholder: "What's actually hurting them?" },
  { key: 'opportunities', label: 'Opportunities', placeholder: 'Where can Nimbus CRM clearly help?' },
  { key: 'risks', label: 'Risks', placeholder: 'What could stall or kill this deal?' },
]

export default function Stage2Research() {
  const form = useCrmSimStore((s) => s.research)
  const updateResearch = useCrmSimStore((s) => s.updateResearch)
  const { completeStageIndex } = useStageCompletion()
  const [visited, setVisited] = useState(new Set(['profile']))

  const criteriaMet = [
    form.painPoints.trim().length >= MIN_LEN,
    form.opportunities.trim().length >= MIN_LEN,
    form.risks.trim().length >= MIN_LEN,
  ]

  return (
    <div>
      <StageHeader stage={STAGE} />

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface">Account Research</h3>
              <span className="text-[11px] text-on-surface-variant">{visited.size} / {TABS.length} explored</span>
            </div>
            <Tabs defaultValue="profile" onValueChange={(v) => setVisited((prev) => new Set(prev).add(v))}>
              <TabsList className="flex-wrap h-auto">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="relative">
                    <t.icon className="h-3.5 w-3.5 mr-1" /> {t.label}
                    {visited.has(t.value) && (
                      <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="profile">
                <p className="text-sm text-on-surface-variant leading-relaxed">{ACCOUNT_RESEARCH.companyProfile}</p>
              </TabsContent>

              <TabsContent value="products">
                <ChipList items={ACCOUNT_RESEARCH.products} color="bg-violet-50 text-violet-800 border-violet-100" />
              </TabsContent>

              <TabsContent value="competitors">
                <ChipList items={ACCOUNT_RESEARCH.competitors} color="bg-rose-50 text-rose-800 border-rose-100" />
              </TabsContent>

              <TabsContent value="challenges">
                <ChipList items={ACCOUNT_RESEARCH.challenges} color="bg-amber-50 text-amber-800 border-amber-100" />
              </TabsContent>

              <TabsContent value="people">
                <div className="space-y-2.5">
                  {ACCOUNT_RESEARCH.decisionMakers.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-surface-low rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {p.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-on-surface">{p.name}</p>
                        <p className="text-xs text-on-surface-variant">{p.title}</p>
                      </div>
                      <span className="text-xs text-primary font-medium text-right max-w-[35%] shrink-0">{p.role}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="budget">
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-1">Budget signal</p>
                    <p className="text-sm text-on-surface leading-relaxed">{ACCOUNT_RESEARCH.budgetSignal}</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 mb-1">Timeline signal</p>
                    <p className="text-sm text-on-surface leading-relaxed">{ACCOUNT_RESEARCH.timelineSignal}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 h-fit lg:sticky lg:top-[76px]">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-on-surface">Your Analysis</h3>
            {ANALYSIS_FIELDS.map((f, i) => {
              const done = criteriaMet[i]
              return (
                <div key={f.key}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-outline" />}
                    <Label>{f.label}</Label>
                  </div>
                  <Textarea
                    rows={3} value={form[f.key]} placeholder={f.placeholder}
                    className={cn(done && 'border-emerald-200')}
                    onChange={(e) => updateResearch({ [f.key]: e.target.value })}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <StageFooterNav stage={STAGE} criteriaMet={criteriaMet} onContinue={(quizScore) => completeStageIndex(2, { quizScore })} />
    </div>
  )
}
