import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Input } from '../../../../../../components/ui/shadcn/input'
import { Textarea } from '../../../../../../components/ui/shadcn/textarea'
import { Label } from '../../../../../../components/ui/shadcn/label'
import { cn } from '../../../../../../lib/cn'

// ── code_sandbox ─────────────────────────────────────────────────────────
export default function CodeSandboxEditor({ config, setConfig }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">Language</Label>
          <select value={config.language || 'python'} onChange={(e) => setConfig('language', e.target.value)} className="w-full text-sm border border-border rounded-md px-2 py-1.5">
            {['python', 'javascript', 'jsx', 'html', 'text'].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <Label className="mb-1.5 block">Grading strategy</Label>
          <select value={config.grading_strategy || 'declarative_rules'} onChange={(e) => setConfig('grading_strategy', e.target.value)} className="w-full text-sm border border-border rounded-md px-2 py-1.5">
            <option value="declarative_rules">Declarative rules (no-code)</option>
            <option value="registered_grader">Registered developer grader</option>
          </select>
        </div>
      </div>

      {config.grading_strategy === 'registered_grader' ? (
        <div>
          <Label className="mb-1.5 block">Grader key</Label>
          <Input value={config.grader_key || ''} onChange={(e) => setConfig('grader_key', e.target.value)} placeholder="e.g. da_job_sim.task1_cleaning" />
          <p className="text-xs text-on-surface-variant mt-1">Must match a key already registered in GRADER_REGISTRY — this is a developer-maintained list, not free text in production use.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Declarative-rules tasks grade against static expected values shared by every candidate — not
              per-candidate randomized data like the built-in graders. Don't use this for high-stakes assessments
              where answer-sharing between candidates is a concern.
            </p>
          </div>
          <RulesEditor rules={config.rules || []} onChange={(r) => setConfig('rules', r)} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div><Label className="mb-1.5 block">Input filename</Label><Input value={config.input_filename || ''} onChange={(e) => setConfig('input_filename', e.target.value)} /></div>
        <div><Label className="mb-1.5 block">Output filename</Label><Input value={config.output_filename || ''} onChange={(e) => setConfig('output_filename', e.target.value)} /></div>
      </div>
      <div>
        <Label className="mb-1.5 block">Starter code</Label>
        <Textarea rows={8} className="font-mono text-xs" value={config.starter_code || ''} onChange={(e) => setConfig('starter_code', e.target.value)} />
      </div>
    </div>
  )
}

const RULE_OPS = ['equals', 'tolerance', 'range', 'regex', 'array_contains', 'row_count_min', 'row_count_range']

function RulesEditor({ rules, onChange }) {
  const sum = rules.reduce((s, r) => s + (r.points || 0), 0)
  function update(i, patch) {
    const next = [...rules]; next[i] = { ...next[i], ...patch }; onChange(next)
  }
  function add() { onChange([...rules, { id: `rule-${rules.length + 1}`, label: '', field: '', op: 'equals', points: 0 }]) }
  function remove(i) { onChange(rules.filter((_, idx) => idx !== i)) }

  return (
    <div className="space-y-2">
      <Label>Grading rules (points must sum to 100)</Label>
      {rules.map((r, i) => (
        <div key={i} className="border border-border rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input value={r.label} placeholder="Label" onChange={(e) => update(i, { label: e.target.value })} />
            <Input value={r.field} placeholder="field path e.g. summary.total" onChange={(e) => update(i, { field: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <select value={r.op} onChange={(e) => update(i, { op: e.target.value })} className="text-sm border border-border rounded-md px-2 py-1.5">
              {RULE_OPS.map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
            <Input value={r.expected ?? ''} placeholder="expected value" onChange={(e) => update(i, { expected: e.target.value })} className="flex-1" />
            <Input type="number" value={r.points || 0} onChange={(e) => update(i, { points: Number(e.target.value) })} className="w-20" placeholder="pts" />
            <button onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-red-400" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add rule</button>
      {rules.length > 0 && (
        <p className={cn('text-xs', sum === 100 ? 'text-emerald-600' : 'text-amber-600')}>Points sum to {sum} {sum !== 100 && '(must equal 100 to publish)'}</p>
      )}
    </div>
  )
}
