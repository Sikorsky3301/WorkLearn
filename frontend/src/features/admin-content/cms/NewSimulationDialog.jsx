import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus, Sparkles, ArrowLeft, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../shared/ui/shadcn/dialog'
import { useSimulationTemplates, useCreateSimulationFromTemplate } from '../../../shared/api/hooks'

/** "New Simulation" entry point — a template gallery instead of dropping the
 * admin straight into a blank builder. Two steps: pick blank/template, then
 * (for a template) name the new simulation before it's instantiated. */
export default function NewSimulationDialog({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { data, isLoading } = useSimulationTemplates()
  const createFromTemplate = useCreateSimulationFromTemplate()
  const [picked, setPicked] = useState(null) // template summary object, or null while browsing
  const [id, setId] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  function reset() {
    setPicked(null)
    setId('')
    setTitle('')
    setError('')
  }

  function handleOpenChange(next) {
    if (!next) reset()
    onOpenChange(next)
  }

  function pickTemplate(t) {
    setPicked(t)
    setId('')
    setTitle(t.label)
    setError('')
  }

  function submitTemplate() {
    if (!id.trim()) { setError('Enter an id for the new simulation.'); return }
    createFromTemplate.mutate(
      { templateKey: picked.key, id: id.trim(), title: title.trim() || undefined },
      {
        onSuccess: (res) => { handleOpenChange(false); navigate(`/admin/simulations/${res.id}`) },
        onError: (e) => setError(e?.message || 'Could not create — that id may already exist.'),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{picked ? `New "${picked.label}" simulation` : 'New Simulation'}</DialogTitle>
          <DialogDescription>
            {picked
              ? 'Give it an id and title — you can edit everything else once it\'s created.'
              : 'Start from a blank simulation, or a domain template scaffolded with realistic stages.'}
          </DialogDescription>
        </DialogHeader>

        {picked ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Simulation id (used in URLs, lowercase-with-hyphens)</label>
              <input
                autoFocus
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. customer-support-2"
                className="input w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setPicked(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to templates
              </button>
              <button
                onClick={submitTemplate}
                disabled={createFromTemplate.isPending}
                className="text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {createFromTemplate.isPending ? 'Creating…' : 'Create Simulation'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { handleOpenChange(false); navigate('/admin/simulations/new') }}
              className="text-left rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-surface-low transition-colors p-4 cursor-pointer"
            >
              <FilePlus className="h-5 w-5 text-on-surface-variant mb-2" />
              <p className="text-sm font-semibold text-on-surface">Blank Simulation</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Start from nothing and author every stage yourself.</p>
            </button>

            {isLoading ? (
              <div className="col-span-1 rounded-xl border border-border p-4 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : (
              (data?.templates ?? []).map((t) => (
                <button
                  key={t.key}
                  onClick={() => pickTemplate(t)}
                  className="text-left rounded-xl border border-border hover:border-primary/50 hover:bg-surface-low transition-colors p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="chip text-[10px] bg-surface-high text-on-surface-variant">{t.stage_count} stages</span>
                  </div>
                  <p className="text-sm font-semibold text-on-surface">{t.label}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{t.description}</p>
                </button>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
