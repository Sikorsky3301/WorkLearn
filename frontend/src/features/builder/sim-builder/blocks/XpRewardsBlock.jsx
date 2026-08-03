import { Award } from 'lucide-react'
import { Input } from '../../../../components/ui/shadcn/input'
import { Label } from '../../../../components/ui/shadcn/label'

export const meta = { label: 'XP & Rewards', icon: Award }

export function Editor({ config, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">XP amount</Label>
        <Input type="number" min={0} value={config.xp_amount ?? 0} onChange={(e) => onChange({ ...config, xp_amount: Number(e.target.value) })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Badge label (optional)</Label>
        <Input value={config.badge_label || ''} onChange={(e) => onChange({ ...config, badge_label: e.target.value })} />
      </div>
      <p className="text-xs text-on-surface-variant/70">Awarding XP isn't wired up yet — this shows a static preview.</p>
    </div>
  )
}

export function Preview({ config }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
      <span className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
        <Award className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-amber-800">+{config.xp_amount ?? 0} XP</p>
        {config.badge_label && <p className="text-xs text-amber-700">Badge: {config.badge_label}</p>}
      </div>
    </div>
  )
}
