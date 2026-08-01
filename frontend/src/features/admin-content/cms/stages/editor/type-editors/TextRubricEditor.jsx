import { Input } from '../../../../../../shared/ui/shadcn/input'
import { Textarea } from '../../../../../../shared/ui/shadcn/textarea'
import { Label } from '../../../../../../shared/ui/shadcn/label'
import { cn } from '../../../../../../lib/cn'
import FieldListEditor from '../fields/FieldListEditor'

export default function TextRubricEditor({ config, setConfig }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5 block">Grading mode</Label>
        <div className="flex gap-1.5">
          {['manual', 'llm'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setConfig('grading_mode', m)}
              className={cn('rounded-md border px-3 py-1.5 text-xs font-medium', config.grading_mode === m ? 'border-primary bg-primary/10 text-primary' : 'border-border text-on-surface-variant')}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {config.grading_mode === 'llm' && (
        <>
          <div>
            <Label className="mb-1.5 block">LLM judge prompt (use {'{text}'} for the submission)</Label>
            <Textarea rows={6} value={config.llm_judge_prompt || ''} onChange={(e) => setConfig('llm_judge_prompt', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Temperature (0-2, blank = provider default)</Label>
              <Input
                type="number" step="0.1" min="0" max="2"
                value={config.temperature ?? ''}
                onChange={(e) => setConfig('temperature', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Max response length (tokens, blank = default)</Label>
              <Input
                type="number"
                value={config.max_tokens ?? ''}
                onChange={(e) => setConfig('max_tokens', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
          </div>
        </>
      )}
      <div>
        <Label className="mb-1.5 block">Named fields (optional — leave empty for one free-text box)</Label>
        <FieldListEditor fields={config.fields || []} onChange={(f) => setConfig('fields', f)} />
      </div>
    </div>
  )
}
