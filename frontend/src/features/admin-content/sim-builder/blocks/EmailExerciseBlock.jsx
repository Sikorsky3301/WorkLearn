import { Mail } from 'lucide-react'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'
import { Input } from '../../../../shared/ui/shadcn/input'
import { Label } from '../../../../shared/ui/shadcn/label'

export const meta = { label: 'Email Exercise', icon: Mail }

export function Editor({ config, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">Scenario / brief</Label>
        <Textarea rows={3} value={config.scenario || ''} onChange={(e) => onChange({ ...config, scenario: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">"To" placeholder</Label>
        <Input value={config.to_placeholder || ''} onChange={(e) => onChange({ ...config, to_placeholder: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">"Subject" placeholder</Label>
        <Input value={config.subject_placeholder || ''} onChange={(e) => onChange({ ...config, subject_placeholder: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">"Body" placeholder</Label>
        <Textarea rows={3} value={config.body_placeholder || ''} onChange={(e) => onChange({ ...config, body_placeholder: e.target.value })} />
      </div>
      <p className="text-xs text-on-surface-variant/70">Email drafting/grading isn't wired up yet — this shows a static preview of the compose form.</p>
    </div>
  )
}

export function Preview({ config }) {
  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      {config.scenario && <p className="text-sm text-on-surface p-3 border-b border-border bg-surface-low">{config.scenario}</p>}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs border-b border-border pb-2">
          <span className="font-semibold text-on-surface-variant w-14 shrink-0">To</span>
          <span className="text-on-surface-variant/60 italic">{config.to_placeholder || 'recipient@company.com'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs border-b border-border pb-2">
          <span className="font-semibold text-on-surface-variant w-14 shrink-0">Subject</span>
          <span className="text-on-surface-variant/60 italic">{config.subject_placeholder || 'Subject line…'}</span>
        </div>
        <p className="text-xs text-on-surface-variant/60 italic pt-1">{config.body_placeholder || 'Write your email here…'}</p>
      </div>
    </div>
  )
}
