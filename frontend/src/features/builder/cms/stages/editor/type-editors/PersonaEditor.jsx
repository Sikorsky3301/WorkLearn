import { Plus, Trash2 } from 'lucide-react'
import { Input } from '../../../../../../components/ui/shadcn/input'
import { Textarea } from '../../../../../../components/ui/shadcn/textarea'
import { Label } from '../../../../../../components/ui/shadcn/label'
import { linesToList } from '../../../shared/textListUtils'

// ── ai_roleplay_chat ─────────────────────────────────────────────────────────
export default function PersonaEditor({ config, setConfig }) {
  const persona = config.persona || {}
  const moodOptions = persona.mood_options?.length ? persona.mood_options : ['neutral']
  function setPersona(key, value) { setConfig('persona', { ...persona, [key]: value }) }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label className="mb-1.5 block">Name</Label><Input value={persona.name || ''} onChange={(e) => setPersona('name', e.target.value)} /></div>
        <div><Label className="mb-1.5 block">Role</Label><Input value={persona.role || ''} onChange={(e) => setPersona('role', e.target.value)} /></div>
      </div>
      <div>
        <Label className="mb-1.5 block">Personality prompt</Label>
        <Textarea rows={5} value={persona.personality_prompt || ''} onChange={(e) => setPersona('personality_prompt', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">Mode</Label>
          <select value={config.mode || 'custom'} onChange={(e) => setConfig('mode', e.target.value)} className="w-full text-sm border border-border rounded-md px-2 py-1.5">
            {['discovery', 'objection', 'custom'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <Label className="mb-1.5 block">Min. messages to complete</Label>
          <Input type="number" value={config.min_messages_for_completion ?? 4} onChange={(e) => setConfig('min_messages_for_completion', Number(e.target.value))} />
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block">
          Additional instructions (always included, on top of the mode preset above — use this for
          genre-specific scene-setting the "discovery"/"objection" presets don't cover)
        </Label>
        <Textarea rows={3} value={config.additional_instructions || ''} onChange={(e) => setConfig('additional_instructions', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">Mood options (comma separated)</Label>
          <Input
            value={moodOptions.join(', ')}
            onChange={(e) => {
              const opts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
              setPersona('mood_options', opts.length ? opts : ['neutral'])
            }}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Opening mood</Label>
          <select value={persona.opening_mood || moodOptions[0]} onChange={(e) => setPersona('opening_mood', e.target.value)} className="w-full text-sm border border-border rounded-md px-2 py-1.5">
            {moodOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
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
      <div>
        <Label className="mb-1.5 block">Context (key: value, one per line)</Label>
        <Textarea
          rows={2}
          value={Object.entries(config.context || {}).map(([k, v]) => `${k}: ${v}`).join('\n')}
          onChange={(e) => {
            const entries = linesToList(e.target.value).map((l) => l.split(':').map((s) => s.trim()))
            setConfig('context', Object.fromEntries(entries.filter(([k]) => k)))
          }}
        />
      </div>
      <ContextDocumentsEditor documents={config.context_documents || []} onChange={(d) => setConfig('context_documents', d)} />
    </div>
  )
}

// Structured "reference materials" the persona can be given beyond the flat
// context dict above (e.g. a supporting ledger excerpt, a resume, a case
// file) — rendered as a distinct prompt section by _build_roleplay_prompt.
function ContextDocumentsEditor({ documents, onChange }) {
  function update(i, patch) {
    const next = [...documents]; next[i] = { ...next[i], ...patch }; onChange(next)
  }
  function add() { onChange([...documents, { title: '', body: '' }]) }
  function remove(i) { onChange(documents.filter((_, idx) => idx !== i)) }

  return (
    <div>
      <Label className="mb-1.5 block">Reference materials (optional — shown to the AI as a distinct "Reference Materials" section)</Label>
      <div className="space-y-2">
        {documents.map((d, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input value={d.title} placeholder="Document title" onChange={(e) => update(i, { title: e.target.value })} className="flex-1" />
              <button onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-red-400" /></button>
            </div>
            <Textarea rows={3} value={d.body} placeholder="Document text" onChange={(e) => update(i, { body: e.target.value })} />
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="text-xs text-primary font-semibold flex items-center gap-1 mt-2"><Plus className="h-3 w-3" /> Add document</button>
    </div>
  )
}
