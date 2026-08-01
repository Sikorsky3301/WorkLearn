import { useAdminSimulations } from '../../../../hooks'
import { Input } from '../../../../shared/ui/shadcn/input'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'
import { Label } from '../../../../shared/ui/shadcn/label'
import { Card, CardContent } from '../../../../shared/ui/shadcn/card'
import LogoUploadField from '../shared/LogoUploadField'

const ACCENT_COLORS = ['bg-primary', 'bg-orange-500', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600']
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

function set(draft, setDraft, key, value) {
  setDraft({ ...draft, [key]: value })
}

export default function MetadataTab({ draft, setDraft, isNew }) {
  const { data } = useAdminSimulations()
  const knownDomains = [...new Set((data?.simulations || []).map((s) => s.domain).filter(Boolean))]

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Simulation ID (slug)</Label>
            <Input
              value={draft.id}
              disabled={!isNew}
              placeholder="e.g. it-support-sim"
              onChange={(e) => set(draft, setDraft, 'id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            />
            {!isNew && <p className="text-xs text-on-surface-variant mt-1">Immutable after creation.</p>}
          </div>
          <div>
            <Label className="mb-1.5 block">Title</Label>
            <Input value={draft.title} onChange={(e) => set(draft, setDraft, 'title', e.target.value)} />
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block">Description</Label>
          <Textarea rows={3} value={draft.description} onChange={(e) => set(draft, setDraft, 'description', e.target.value)} />
        </div>

        <LogoUploadField label="Company logo" value={draft.logo_url} onChange={(v) => set(draft, setDraft, 'logo_url', v)} />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Company</Label>
            <Input value={draft.company} onChange={(e) => set(draft, setDraft, 'company', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Domain</Label>
            <Input
              list="known-domains"
              value={draft.domain}
              placeholder="e.g. IT, Business Development, Sales"
              onChange={(e) => set(draft, setDraft, 'domain', e.target.value)}
            />
            <datalist id="known-domains">
              {knownDomains.map((d) => <option key={d} value={d} />)}
            </datalist>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label className="mb-1.5 block">Difficulty</Label>
            <div className="flex gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set(draft, setDraft, 'difficulty', d)}
                  className={`flex-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors ${draft.difficulty === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-on-surface-variant'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Estimated time</Label>
            <Input value={draft.estimated_hours} placeholder="e.g. 2-3 hrs" onChange={(e) => set(draft, setDraft, 'estimated_hours', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Accent color</Label>
            <div className="flex gap-1.5">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set(draft, setDraft, 'accent_color', c)}
                  className={`h-8 w-8 rounded-full ${c} ${draft.accent_color === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block">Skills (comma-separated)</Label>
          <Input
            value={(draft.skills || []).join(', ')}
            onChange={(e) => set(draft, setDraft, 'skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Rating (0–5)</Label>
            <Input
              type="number" min="0" max="5" step="0.1"
              value={draft.rating ?? 4.8}
              onChange={(e) => set(draft, setDraft, 'rating', Number(e.target.value))}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Rating count (learners rated)</Label>
            <Input
              type="number" min="0"
              value={draft.rating_count ?? 0}
              onChange={(e) => set(draft, setDraft, 'rating_count', Number(e.target.value))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
