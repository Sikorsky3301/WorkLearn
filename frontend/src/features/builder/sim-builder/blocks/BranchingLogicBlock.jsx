import { GitBranch, Plus, Trash2 } from 'lucide-react'
import { Input } from '../../../../components/ui/shadcn/input'
import { Textarea } from '../../../../components/ui/shadcn/textarea'
import { Label } from '../../../../components/ui/shadcn/label'

export const meta = { label: 'Branching Logic', icon: GitBranch }

export function Editor({ config, onChange }) {
  const branches = config.branches || []

  function update(i, patch) {
    const next = [...branches]; next[i] = { ...next[i], ...patch }
    onChange({ ...config, branches: next })
  }
  function add() { onChange({ ...config, branches: [...branches, { label: '', description: '' }] }) }
  function remove(i) { onChange({ ...config, branches: branches.filter((_, idx) => idx !== i) }) }

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">Decision prompt</Label>
        <Textarea rows={2} value={config.prompt || ''} onChange={(e) => onChange({ ...config, prompt: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Branches</Label>
        {branches.map((b, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input value={b.label} placeholder="Path label" onChange={(e) => update(i, { label: e.target.value })} className="flex-1" />
              <button type="button" onClick={() => remove(i)} className="cursor-pointer">
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            </div>
            <Textarea rows={2} value={b.description} placeholder="What happens on this path" onChange={(e) => update(i, { description: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={add} className="text-xs text-primary font-semibold flex items-center gap-1 cursor-pointer">
          <Plus className="h-3 w-3" /> Add branch
        </button>
      </div>
      <p className="text-xs text-on-surface-variant/70">Actually routing to a different page isn't wired up yet — this authors the decision point's content.</p>
    </div>
  )
}

export function Preview({ config }) {
  const branches = config.branches || []
  return (
    <div className="rounded-lg border border-border bg-white p-4 space-y-3">
      <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
        <GitBranch className="h-4 w-4 text-primary" /> {config.prompt || 'Decision point'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {branches.map((b, i) => (
          <div key={i} className="border border-border rounded-lg p-2.5">
            <p className="text-xs font-semibold text-on-surface">{b.label || `Path ${i + 1}`}</p>
            {b.description && <p className="text-[11px] text-on-surface-variant mt-0.5">{b.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
