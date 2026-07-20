import { Building2, Package, Swords, TriangleAlert, UserRound, Wallet } from 'lucide-react'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useStageCompletion } from '../engine/useSimEngine'
import { stageByIndex } from '../engine/simulationConfig'
import { ACCOUNT_RESEARCH } from '../data/seedData'
import { StageHeader, StageFooterNav } from './StageChrome'
import { Card, CardContent } from '../../../../shared/ui/shadcn/card'
import { Label } from '../../../../shared/ui/shadcn/label'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../shared/ui/shadcn/tabs'

const STAGE = stageByIndex(2)
const MIN_LEN = 10

export default function Stage2Research() {
  const form = useCrmSimStore((s) => s.research)
  const updateResearch = useCrmSimStore((s) => s.updateResearch)
  const { completeStageIndex } = useStageCompletion()

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
            <h3 className="text-sm font-bold text-on-surface mb-4">Account Research</h3>
            <Tabs defaultValue="profile">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="profile"><Building2 className="h-3.5 w-3.5 mr-1" /> Profile</TabsTrigger>
                <TabsTrigger value="products"><Package className="h-3.5 w-3.5 mr-1" /> Products</TabsTrigger>
                <TabsTrigger value="competitors"><Swords className="h-3.5 w-3.5 mr-1" /> Competitors</TabsTrigger>
                <TabsTrigger value="challenges"><TriangleAlert className="h-3.5 w-3.5 mr-1" /> Challenges</TabsTrigger>
                <TabsTrigger value="people"><UserRound className="h-3.5 w-3.5 mr-1" /> Decision Makers</TabsTrigger>
                <TabsTrigger value="budget"><Wallet className="h-3.5 w-3.5 mr-1" /> Budget &amp; Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <p className="text-sm text-on-surface-variant leading-relaxed">{ACCOUNT_RESEARCH.companyProfile}</p>
              </TabsContent>

              <TabsContent value="products">
                <ul className="space-y-2">
                  {ACCOUNT_RESEARCH.products.map((p, i) => (
                    <li key={i} className="text-sm text-on-surface-variant leading-relaxed flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="competitors">
                <ul className="space-y-2">
                  {ACCOUNT_RESEARCH.competitors.map((p, i) => (
                    <li key={i} className="text-sm text-on-surface-variant leading-relaxed flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="challenges">
                <ul className="space-y-2">
                  {ACCOUNT_RESEARCH.challenges.map((p, i) => (
                    <li key={i} className="text-sm text-on-surface-variant leading-relaxed flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="people">
                <div className="space-y-3">
                  {ACCOUNT_RESEARCH.decisionMakers.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-surface-low rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{p.name}</p>
                        <p className="text-xs text-on-surface-variant">{p.title}</p>
                      </div>
                      <span className="text-xs text-primary font-medium text-right max-w-[45%]">{p.role}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="budget">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Budget signal</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{ACCOUNT_RESEARCH.budgetSignal}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Timeline signal</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{ACCOUNT_RESEARCH.timelineSignal}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 h-fit lg:sticky lg:top-[76px]">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-on-surface">Your Analysis</h3>
            <div>
              <Label className="mb-1.5 block">Pain points</Label>
              <Textarea rows={3} value={form.painPoints} placeholder="What's actually hurting them?"
                onChange={(e) => updateResearch({ painPoints: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Opportunities</Label>
              <Textarea rows={3} value={form.opportunities} placeholder="Where can Nimbus CRM clearly help?"
                onChange={(e) => updateResearch({ opportunities: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Risks</Label>
              <Textarea rows={3} value={form.risks} placeholder="What could stall or kill this deal?"
                onChange={(e) => updateResearch({ risks: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <StageFooterNav stage={STAGE} criteriaMet={criteriaMet} onContinue={() => completeStageIndex(2)} />
    </div>
  )
}
