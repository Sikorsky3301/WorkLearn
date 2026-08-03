import { Type } from 'lucide-react'
import { Textarea } from '../../../../components/ui/shadcn/textarea'
import { Label } from '../../../../components/ui/shadcn/label'

export const meta = { label: 'Text', icon: Type }

export function Editor({ config, onChange }) {
  return (
    <div>
      <Label className="mb-1.5 block">Body</Label>
      <Textarea rows={5} value={config.body || ''} onChange={(e) => onChange({ ...config, body: e.target.value })} />
    </div>
  )
}

export function Preview({ config }) {
  return <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{config.body || 'Text block'}</p>
}
