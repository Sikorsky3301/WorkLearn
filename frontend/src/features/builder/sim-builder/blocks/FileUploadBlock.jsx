import { UploadCloud } from 'lucide-react'
import { Textarea } from '../../../../components/ui/shadcn/textarea'
import { Input } from '../../../../components/ui/shadcn/input'
import { Label } from '../../../../components/ui/shadcn/label'

export const meta = { label: 'File Upload', icon: UploadCloud }

export function Editor({ config, onChange }) {
  const acceptedTypes = config.accepted_types || []
  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">Instructions</Label>
        <Textarea rows={3} value={config.instructions || ''} onChange={(e) => onChange({ ...config, instructions: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Accepted file types (comma separated)</Label>
        <Input
          value={acceptedTypes.join(', ')}
          placeholder=".pdf, .docx"
          onChange={(e) => onChange({ ...config, accepted_types: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
        />
      </div>
      <div>
        <Label className="mb-1.5 block">Max size (MB)</Label>
        <Input type="number" value={config.max_size_mb ?? 10} onChange={(e) => onChange({ ...config, max_size_mb: Number(e.target.value) })} />
      </div>
      <p className="text-xs text-on-surface-variant/70">Actual file submission isn't wired up yet — this shows a static preview of the drop zone.</p>
    </div>
  )
}

export function Preview({ config }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
      <UploadCloud className="h-6 w-6 text-on-surface-variant/40 mx-auto mb-2" />
      {config.instructions && <p className="text-sm text-on-surface mb-1">{config.instructions}</p>}
      <p className="text-xs text-on-surface-variant/60">
        {(config.accepted_types || []).join(', ') || 'Any file'} · up to {config.max_size_mb ?? 10} MB
      </p>
    </div>
  )
}
