import { Code2 } from 'lucide-react'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'
import { Label } from '../../../../shared/ui/shadcn/label'

const LANGUAGES = ['python', 'javascript', 'jsx', 'html', 'text']

// Static, editor-preview only for v1 — no sandbox execution wired up yet
// (see the plan's "explicitly deferred" runtime section).
export const meta = { label: 'Coding Challenge', icon: Code2 }

export function Editor({ config, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">Language</Label>
        <select
          value={config.language || 'python'}
          onChange={(e) => onChange({ ...config, language: e.target.value })}
          className="w-full text-sm border border-border rounded-md px-2 py-1.5"
        >
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <Label className="mb-1.5 block">Instructions</Label>
        <Textarea rows={3} value={config.instructions || ''} onChange={(e) => onChange({ ...config, instructions: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Starter code</Label>
        <Textarea rows={6} className="font-mono text-xs" value={config.starter_code || ''} onChange={(e) => onChange({ ...config, starter_code: e.target.value })} />
      </div>
      <p className="text-xs text-on-surface-variant/70">Sandbox execution isn't wired up yet — this shows a static preview of the challenge.</p>
    </div>
  )
}

export function Preview({ config }) {
  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-surface-low">
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{config.language || 'python'}</p>
      </div>
      {config.instructions && <p className="text-sm text-on-surface px-3 pt-3">{config.instructions}</p>}
      <pre className="text-xs font-mono text-on-surface p-3 overflow-x-auto whitespace-pre-wrap">{config.starter_code || '# starter code'}</pre>
    </div>
  )
}
