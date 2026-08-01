import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useCrmSimStore } from '../../../../../stores/useCrmSimStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../shared/ui/shadcn/card'
import { PIPELINE_STAGES, formatCurrency } from './crmConstants'

const PIE_COLORS = ['#94a3b8', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']

export default function CrmReports() {
  const opportunities = useCrmSimStore((s) => s.crm.opportunities)

  const won = opportunities.filter((o) => o.stage === 'Closed Won')
  const lost = opportunities.filter((o) => o.stage === 'Closed Lost')
  const wonRevenue = won.reduce((s, o) => s + (Number(o.amount) || 0), 0)
  const avgDealSize = won.length ? Math.round(wonRevenue / won.length) : 0
  const closedCount = won.length + lost.length
  const conversionRate = closedCount ? Math.round((won.length / closedCount) * 100) : 0

  const pieData = useMemo(
    () => PIPELINE_STAGES.map((stage) => ({ name: stage, value: opportunities.filter((o) => o.stage === stage).length })).filter((d) => d.value > 0),
    [opportunities]
  )

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-on-surface">Reports</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">Won Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(wonRevenue)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">Avg Deal Size</p>
          <p className="text-2xl font-bold text-on-surface">{formatCurrency(avgDealSize)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">Win Rate</p>
          <p className="text-2xl font-bold text-on-surface">{conversionRate}%</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{won.length} won / {lost.length} lost</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Opportunities by Stage</CardTitle></CardHeader>
        <CardContent className="pt-2">
          {pieData.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-8 text-center">No opportunities to report on yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={PIE_COLORS[PIPELINE_STAGES.indexOf(entry.name) % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
