import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus, Sparkles, ArrowLeft, Loader2, Workflow } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/shadcn/dialog'
import { useSimulationTemplates, useCreateSimulationFromTemplate, useCreateSimulationFromArchitecture } from '../../../hooks'
import { useCmsBasePath } from '../../../hooks/useCmsBasePath'
import MermaidArchitectureEditor from './architecture/MermaidArchitectureEditor'
import { AUTHOR_STARTER_MMD } from './architecture/constants'

/** "New Simulation" entry point — blank, domain templates, or Mermaid architecture. */
export default function NewSimulationDialog({ open, onOpenChange }) {
  const navigate = useNavigate()
  const cmsBase = useCmsBasePath()
  const { data, isLoading } = useSimulationTemplates()
  const createFromTemplate = useCreateSimulationFromTemplate()
  const createFromArch = useCreateSimulationFromArchitecture()
  const [picked, setPicked] = useState(null)
  const [id, setId] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [mermaid, setMermaid] = useState(AUTHOR_STARTER_MMD)
  const [parseResult, setParseResult] = useState(null)

  const isArchitecture = picked === 'architecture'

  function reset() {
    setPicked(null)
    setId('')
    setTitle('')
    setError('')
    setMermaid(AUTHOR_STARTER_MMD)
    setParseResult(null)
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

  function pickArchitecture() {
    setPicked('architecture')
    setId('')
    setTitle('')
    setError('')
  }

  function submitTemplate() {
    if (!id.trim()) { setError('Enter an id for the new simulation.'); return }
    createFromTemplate.mutate(
      { templateKey: picked.key, id: id.trim(), title: title.trim() || undefined },
      {
        onSuccess: (res) => { handleOpenChange(false); navigate(`${cmsBase}/simulations/${res.id}`) },
        onError: (e) => setError(e?.message || 'Could not create — that id may already exist.'),
      }
    )
  }

  function submitArchitecture() {
    if (!id.trim()) { setError('Enter an id for the new simulation.'); return }
    if (!mermaid.trim()) { setError('Paste a Mermaid flowchart first.'); return }
    createFromArch.mutate(
      { slug: id.trim(), title: title.trim() || undefined, mermaid },
      {
        onSuccess: (res) => { handleOpenChange(false); navigate(`${cmsBase}/simulations/${res.id}`) },
        onError: (e) => setError(e?.message || 'Could not create from the diagram.'),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={
          isArchitecture
            ? 'flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-4xl flex-col overflow-hidden'
            : 'flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-3xl flex-col overflow-hidden'
        }
      >
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle>
            {isArchitecture ? 'New simulation from architecture' : picked ? `New "${picked.label}" simulation` : 'New Simulation'}
          </DialogTitle>
          <DialogDescription>
            {isArchitecture
              ? 'Paste a Mermaid flowchart, Run it, then create a draft with mapped stages.'
              : picked
                ? 'Give it an id and title — you can edit everything else once it\'s created.'
                : 'Start from a blank simulation, a domain template, or a Mermaid architecture diagram.'}
          </DialogDescription>
        </DialogHeader>

        {isArchitecture ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Simulation id (used in URLs, lowercase-with-hyphens)</label>
              <input
                autoFocus
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. platform-architecture-1"
                className="input w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" placeholder="Optional — defaults from the diagram" />
            </div>
            <MermaidArchitectureEditor
              source={mermaid}
              onChange={setMermaid}
              parseResult={parseResult}
              onParseResult={setParseResult}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setPicked(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                onClick={submitArchitecture}
                disabled={createFromArch.isPending}
                className="text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {createFromArch.isPending ? 'Creating…' : 'Create Simulation'}
              </button>
            </div>
          </div>
        ) : picked ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
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
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-1 grid grid-cols-2 gap-3 content-start">
            <button
              onClick={() => { handleOpenChange(false); navigate(`${cmsBase}/simulations/new`) }}
              className="text-left rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-surface-low transition-colors p-4 cursor-pointer"
            >
              <FilePlus className="h-5 w-5 text-on-surface-variant mb-2" />
              <p className="text-sm font-semibold text-on-surface">Blank Simulation</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Start from nothing and author every stage yourself.</p>
            </button>

            <button
              onClick={pickArchitecture}
              className="text-left rounded-xl border border-border hover:border-primary/50 hover:bg-surface-low transition-colors p-4 cursor-pointer"
            >
              <Workflow className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-semibold text-on-surface">From architecture</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Paste Mermaid flowchart code and generate stages from it.</p>
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
