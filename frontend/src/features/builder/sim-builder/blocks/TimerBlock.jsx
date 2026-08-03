import { Timer as TimerIcon } from 'lucide-react'
import { Input } from '../../../../components/ui/shadcn/input'
import { Label } from '../../../../components/ui/shadcn/label'

export const meta = { label: 'Timer', icon: TimerIcon }

export function Editor({ config, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">Label</Label>
        <Input value={config.label || ''} onChange={(e) => onChange({ ...config, label: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Duration (minutes)</Label>
        <Input type="number" min={1} value={config.duration_minutes ?? 15} onChange={(e) => onChange({ ...config, duration_minutes: Number(e.target.value) })} />
      </div>
      <p className="text-xs text-on-surface-variant/70">The countdown isn't wired up yet — this shows a static preview.</p>
    </div>
  )
}

export function Preview({ config }) {
  const minutes = config.duration_minutes ?? 15
  return (
    <div className="rounded-lg border border-border bg-white p-4 flex items-center gap-3">
      <span className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
        <TimerIcon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-on-surface">{config.label || 'Time limit'}</p>
        <p className="text-xs text-on-surface-variant">{minutes} minute{minutes === 1 ? '' : 's'}</p>
      </div>
    </div>
  )
}
