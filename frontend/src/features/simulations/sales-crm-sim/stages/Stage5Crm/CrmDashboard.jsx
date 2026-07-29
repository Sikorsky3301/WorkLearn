import { useMemo } from 'react'
import { DollarSign, Target, CheckSquare, Activity as ActivityIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { useCrmSimStore } from '../../store/useCrmSimStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../shared/ui/shadcn/card'
import { PIPELINE_STAGES, formatCurrency } from './crmConstants'

function KpiTile({ icon: Icon, label, value, sub }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-on-surface-variant mb-2">
          <Icon className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
        </div>
        <p className="text-2xl font-bold text-on-surface">{value}</p>
        {sub && <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function CrmDashboard() {
  const crm = useCrmSimStore((s) => s.crm)

  const openOpps = crm.opportunities.filter((o) => !o.stage?.startsWith('Closed'))
  const pipelineValue = openOpps.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
  const tasksDue = crm.tasks.filter((t) => !t.done).length

  const chartData = useMemo(
    () => PIPELINE_STAGES.map((stage) => ({
      stage: stage.replace('Closed ', ''),
      value: crm.opportunities.filter((o) => o.stage === stage).reduce((s, o) => s + (Number(o.amount) || 0), 0),
    })),
    [crm.opportunities]
  )

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile icon={DollarSign} label="Open Pipeline" value={formatCurrency(pipelineValue)} sub={`${openOpps.length} open deals`} />
        <KpiTile icon={Target} label="Opportunities" value={crm.opportunities.length} sub="total logged" />
        <KpiTile icon={CheckSquare} label="Tasks Due" value={tasksDue} sub={`${crm.tasks.length} total`} />
        <KpiTile icon={ActivityIcon} label="Activities" value={crm.activities.length} sub="logged this deal" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline by Stage</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eae7ef" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} width={48} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#312E81" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {crm.opportunities.length === 0 && (
        <div className="text-center py-10 border border-dashed border-border rounded-xl bg-white">
          <p className="text-sm text-on-surface-variant">Nothing in the pipeline yet — head to Accounts to log the deal.</p>
        </div>
      )}
    </div>
  )
}
