import { MessageCircle } from 'lucide-react'
import { Input } from '../../../../components/ui/shadcn/input'
import { Textarea } from '../../../../components/ui/shadcn/textarea'
import { Label } from '../../../../components/ui/shadcn/label'

// Static, editor-preview only for v1 — no live LLM call wired up yet (see
// the plan's "explicitly deferred" runtime section). Shows what the chat
// opener will look like, not an interactive conversation.
export const meta = { label: 'AI Chat', icon: MessageCircle }

export function Editor({ config, onChange }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1.5 block">Persona name</Label>
          <Input value={config.persona_name || ''} onChange={(e) => onChange({ ...config, persona_name: e.target.value })} />
        </div>
        <div>
          <Label className="mb-1.5 block">Persona role</Label>
          <Input value={config.persona_role || ''} onChange={(e) => onChange({ ...config, persona_role: e.target.value })} />
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block">Prompt / scenario</Label>
        <Textarea rows={4} value={config.prompt || ''} onChange={(e) => onChange({ ...config, prompt: e.target.value })} />
      </div>
      <p className="text-xs text-on-surface-variant/70">Live chat isn't wired up yet — this shows a static preview of how the conversation will open.</p>
    </div>
  )
}

export function Preview({ config }) {
  const initials = (config.persona_name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="rounded-lg border border-border bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{initials}</span>
        <div>
          <p className="text-xs font-semibold text-on-surface">{config.persona_name || 'Persona'}</p>
          <p className="text-[10px] text-on-surface-variant">{config.persona_role || 'Role'}</p>
        </div>
      </div>
      <div className="bg-surface-low rounded-lg rounded-tl-none px-3 py-2 max-w-[85%]">
        <p className="text-sm text-on-surface">{config.prompt || 'The AI persona will open the conversation with this scenario.'}</p>
      </div>
    </div>
  )
}
