import { Textarea } from '../../../../../../shared/ui/shadcn/textarea'
import { Label } from '../../../../../../shared/ui/shadcn/label'
import { linesToList } from '../../../shared/textListUtils'

// ── crm_workspace ─────────────────────────────────────────────────────────
export default function CrmWorkspaceEditor({ config, setConfig }) {
  const required = config.required_entities || {}
  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5 block">Required entities (key:count, one per line)</Label>
        <Textarea
          rows={3}
          value={Object.entries(required).map(([k, v]) => `${k}:${v}`).join('\n')}
          onChange={(e) => {
            const entries = linesToList(e.target.value).map((l) => l.split(':'))
            setConfig('required_entities', Object.fromEntries(entries.map(([k, v]) => [k.trim(), Number(v) || 1])))
          }}
        />
      </div>
      <div>
        <Label className="mb-1.5 block">Pipeline stages (one per line)</Label>
        <Textarea rows={4} value={(config.pipeline_stages || []).join('\n')} onChange={(e) => setConfig('pipeline_stages', linesToList(e.target.value))} />
      </div>
    </div>
  )
}
