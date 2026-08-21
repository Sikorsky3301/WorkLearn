import { Input } from '../../../../../../components/ui/shadcn/input'
import { Textarea } from '../../../../../../components/ui/shadcn/textarea'
import { Label } from '../../../../../../components/ui/shadcn/label'
import { cn } from '../../../../../../lib/cn'
import { STUDENT_STARTER_MMD } from '../../../architecture/constants'

export default function MermaidDiagramEditor({ config, setConfig }) {
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
            <Label className="mb-1.5 block">LLM judge prompt (use {'{text}'} for the Mermaid source)</Label>
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
        <Label className="mb-1.5 block">Minimum words in source (0 = none)</Label>
        <Input
          type="number"
          min="0"
          value={config.min_words ?? 0}
          onChange={(e) => setConfig('min_words', Number(e.target.value) || 0)}
        />
      </div>
      <div>
        <Label className="mb-1.5 block">Starter Mermaid (shown to the student)</Label>
        <Textarea
          rows={8}
          className="font-mono text-xs"
          value={config.starter_code || ''}
          placeholder={STUDENT_STARTER_MMD}
          onChange={(e) => setConfig('starter_code', e.target.value)}
        />
      </div>
    </div>
  )
}
