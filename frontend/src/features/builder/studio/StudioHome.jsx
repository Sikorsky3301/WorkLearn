import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowUpRight, Blocks, Layers, Loader2, Plus, Search, Sparkles, Workflow,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import { adoptHandoffToken } from '../../../lib/tabHandoff'
import { useCmsBasePath } from '../../../hooks/useCmsBasePath'
import {
  useAdminSimulations, useBuilderCatalog, useCreateSimulation,
  useCreateSimulationFromTemplate, useCreateSimulationFromArchitecture, useSimulationTemplates,
} from '../../../hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/shadcn/dialog'
import { Field, TextInput, Select, Note } from './editors/Fields'
import MermaidArchitectureEditor from '../cms/architecture/MermaidArchitectureEditor'
import { AUTHOR_STARTER_MMD } from '../cms/architecture/constants'
import StudioBoot from './StudioBoot'
import logo from '../../../assets/logo.png'

// The Sim Builder's front door.
//
// It is deliberately NOT the admin portal's Simulations table. That page
// manages a catalogue — publish, unpublish, unenrol, delete, count students —
// and a builder that lives inside it is a detail view of an admin table. This
// one asks a single question, "which simulation are you building", and gets out
// of the way. The catalogue page keeps its own job and now links here.

const DOMAINS = [
  'Data Analytics', 'Engineering', 'Sales', 'Marketing', 'Finance',
  'Product', 'Customer Support', 'Human Resources', 'Healthcare', 'Operations',
]
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** The smallest simulation the API will accept.
 *
 *  Manager and onboarding are required by the schema but have nothing sensible
 *  to guess, so they go in structurally empty and the builder's readiness panel
 *  flags them on the first screen. Inventing "Alex Morgan, Team Lead" here
 *  would be worse: a placeholder that reads like content is one that survives
 *  to publish. */
function blankSimulation({ title, slug, company, domain, difficulty, hours }) {
  return {
    slug,
    title,
    description: '',
    company,
    domain,
    category: domain,
    difficulty,
    estimated_hours: hours,
    skills: [],
    manager: { name: '', role: '', avatar: '' },
    onboarding: {
      company: { name: company, industry: '', size: '', location: '', about: '' },
      intro: '',
      learn: [],
      offer: { title, role: title, team: '', company, body: '' },
    },
    onboarding_xp_award: 0,
  }
}

function NewSimulationDialog({ open, onOpenChange, onCreated }) {
  const [mode, setMode] = useState('blank')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [company, setCompany] = useState('')
  const [domain, setDomain] = useState(DOMAINS[0])
  const [difficulty, setDifficulty] = useState('Beginner')
  const [hours, setHours] = useState('6-8 hours')
  const [template, setTemplate] = useState(null)
  const [mermaid, setMermaid] = useState(AUTHOR_STARTER_MMD)
  const [parseResult, setParseResult] = useState(null)
  const [error, setError] = useState('')

  const createSim = useCreateSimulation()
  const fromTemplate = useCreateSimulationFromTemplate()
  const fromArch = useCreateSimulationFromArchitecture()
  const { data: templateData, isLoading: templatesLoading } = useSimulationTemplates()
  const templates = templateData?.templates ?? []
  const pending = createSim.isPending || fromTemplate.isPending || fromArch.isPending

  const effectiveSlug = slugTouched ? slug : slugify(title)

  function reset() {
    setMode('blank'); setTitle(''); setSlug(''); setSlugTouched(false)
    setCompany(''); setDomain(DOMAINS[0]); setDifficulty('Beginner')
    setHours('6-8 hours'); setTemplate(null)
    setMermaid(AUTHOR_STARTER_MMD); setParseResult(null); setError('')
  }

  function close(next) {
    if (!next) reset()
    onOpenChange(next)
  }

  function submit() {
    setError('')
    if (!title.trim()) { setError('Give it a title.'); return }
    if (!effectiveSlug) { setError('That title produces an empty web address — add some letters or numbers.'); return }

    if (mode === 'template') {
      if (!template) { setError('Pick a template, or start blank.'); return }
      fromTemplate.mutate(
        { templateKey: template.key, slug: effectiveSlug, title: title.trim() },
        {
          onSuccess: (res) => { close(false); onCreated(res.id ?? res.slug) },
          onError: (e) => setError(e?.message || 'Could not create — that web address may already be taken.'),
        }
      )
      return
    }

    if (mode === 'architecture') {
      if (!mermaid.trim()) { setError('Paste a Mermaid flowchart first.'); return }
      fromArch.mutate(
        { slug: effectiveSlug, title: title.trim(), mermaid },
        {
          onSuccess: (res) => { close(false); onCreated(res.id ?? res.slug) },
          onError: (e) => setError(e?.message || 'Could not create from the diagram.'),
        }
      )
      return
    }

    if (!company.trim()) { setError('Name the company the student will be working for.'); return }
    createSim.mutate(
      blankSimulation({
        title: title.trim(), slug: effectiveSlug, company: company.trim(),
        domain, difficulty, hours,
      }),
      {
        onSuccess: (res) => { close(false); onCreated(res.id ?? res.slug) },
        onError: (e) => setError(e?.message || 'Could not create — that web address may already be taken.'),
      }
    )
  }

  const isArchitecture = mode === 'architecture'

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className={cn(
          'flex max-h-[min(90vh,calc(100dvh-2rem))] flex-col overflow-hidden',
          isArchitecture ? 'max-w-3xl' : 'max-w-2xl'
        )}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>New simulation</DialogTitle>
          <DialogDescription>
            Start empty, start from a template that already has one, or paste a Mermaid flowchart to
            generate the shape from it.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { key: 'blank', icon: Plus, title: 'Start blank', body: 'An empty simulation. Scaffold the format in one click once you are inside.' },
              { key: 'template', icon: Sparkles, title: 'From a template', body: 'A domain starter with tasks already written, to edit rather than invent.' },
              { key: 'architecture', icon: Workflow, title: 'From architecture', body: 'Paste Mermaid flowchart code and generate stages from it.' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setMode(option.key)}
                className={cn(
                  'rounded-xl border p-3.5 text-left transition-colors cursor-pointer',
                  mode === option.key ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-on-surface/25'
                )}
              >
                <p className="flex items-center gap-2 font-display text-[0.88rem] font-extrabold text-on-surface">
                  <option.icon className="h-3.5 w-3.5" /> {option.title}
                </p>
                <p className="mt-1 text-[0.74rem] leading-relaxed text-on-surface-variant">{option.body}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required help="What a student sees on the card.">
              <TextInput
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Junior Product Analyst"
              />
            </Field>
            <Field label="Web address" required help="Used in the URL. Letters, numbers and hyphens only.">
              <TextInput
                value={effectiveSlug}
                onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)) }}
                placeholder="junior-product-analyst"
                className="font-mono text-[0.82rem]"
              />
            </Field>
          </div>

          {mode === 'blank' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company" required help="The fictional employer the student joins.">
                <TextInput value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Lumen Retail" />
              </Field>
              <Field label="Domain">
                <Select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  options={DOMAINS.map((d) => ({ value: d, label: d }))}
                />
              </Field>
              <Field label="Difficulty">
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
                />
              </Field>
              <Field label="Estimated time">
                <TextInput value={hours} onChange={(e) => setHours(e.target.value)} placeholder="6-8 hours" />
              </Field>
            </div>
          ) : mode === 'architecture' ? (
            <MermaidArchitectureEditor
              source={mermaid}
              onChange={setMermaid}
              parseResult={parseResult}
              onParseResult={setParseResult}
            />
          ) : (
            <Field label="Template" help="Every template can be edited freely afterwards.">
              {templatesLoading ? (
                <p className="py-4 text-[0.8rem] text-outline">Loading templates…</p>
              ) : (
                <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-white p-2">
                  {templates.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTemplate(t)}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer',
                        template?.key === t.key ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-surface-low'
                      )}
                    >
                      <p className="text-[0.82rem] font-semibold text-on-surface">{t.label}</p>
                      <p className="mt-0.5 text-[0.72rem] leading-snug text-on-surface-variant">{t.description}</p>
                      <p className="mt-1 text-[0.66rem] text-outline">{t.domain} · {t.stage_count} tasks</p>
                    </button>
                  ))}
                </div>
              )}
            </Field>
          )}

          {mode === 'blank' && (
            <Note>
              The manager, the offer letter and the description are left empty on purpose — the
              builder flags them on the first screen. A placeholder that reads like real content is
              the kind that survives to publish.
            </Note>
          )}

          {error && <p className="text-[0.8rem] font-semibold text-red-600">{error}</p>}

          <div className="flex justify-end">
            <button
              onClick={submit}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-on-surface px-4 py-2 text-[0.84rem] font-bold text-white transition-colors hover:bg-primary disabled:opacity-50 cursor-pointer"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Create and open
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SimCard({ sim, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-xl border border-border bg-white px-4 py-3.5 text-left transition-colors hover:border-on-surface/30 cursor-pointer"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-low">
        <Blocks className="h-4 w-4 text-on-surface-variant" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[0.95rem] font-extrabold text-on-surface">
          {sim.title}
        </span>
        <span className="block truncate text-[0.72rem] text-outline">
          {sim.domain} · {sim.task_count} tasks · {sim.enrollment_count} enrolled · updated{' '}
          {new Date(sim.updated_at).toLocaleDateString()}
        </span>
      </span>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-wide',
          sim.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-high text-on-surface-variant'
        )}
      >
        {sim.status}
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-transparent transition-colors group-hover:text-on-surface" />
    </button>
  )
}

export default function StudioHome() {
  useState(() => adoptHandoffToken())
  const navigate = useNavigate()
  const cmsBase = useCmsBasePath()
  const [search, setSearch] = useState('')
  const [newOpen, setNewOpen] = useState(false)

  const { data, isLoading } = useAdminSimulations()
  const { isLoading: catalogLoading } = useBuilderCatalog()

  const sims = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.simulations ?? []).filter(
      (s) => !q || s.title.toLowerCase().includes(q) || (s.domain || '').toLowerCase().includes(q)
    )
  }, [data, search])

  function open(id) { navigate(`${cmsBase}/content/sim-builder/${id}`) }

  return (
    <>
      <StudioBoot ready={!isLoading && !catalogLoading} detail="Opening the Sim Builder" />

      <div className="min-h-screen bg-white">
        <header className="flex h-14 items-center gap-4 border-b border-border px-6">
          <button
            onClick={() => navigate(cmsBase === '/mentor' ? '/mentor' : '/admin')}
            className="flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-surface-low cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-on-surface-variant" />
            <img src={logo} alt="" className="h-6 w-6 rounded object-cover" />
          </button>
          <div className="h-5 w-px bg-border" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.86rem] font-bold text-on-surface">Sim Builder</p>
            <p className="text-[0.68rem] text-outline">Build and publish job simulations</p>
          </div>
          <button
            onClick={() => setNewOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-on-surface px-3.5 py-1.5 text-[0.8rem] font-bold text-white transition-colors hover:bg-primary cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> New simulation
          </button>
        </header>

        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="border-t-2 border-on-surface pt-4">
            <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-tight text-on-surface">
              What are you building?
            </h1>
            <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-on-surface-variant">
              Every simulation here runs the same shape: three weeks of three tasks, a check after
              each one, and a final assessment. Open any of them to edit that structure page by page.
            </p>
          </div>

          <div className="relative mt-7">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search simulations…"
              className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-outline/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="mt-4 space-y-2">
            {isLoading ? (
              [0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-low" />)
            ) : sims.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-on-surface-variant">
                {search ? 'Nothing matches that.' : 'No simulations yet. Create the first one.'}
              </p>
            ) : (
              sims.map((sim) => <SimCard key={sim.id} sim={sim} onOpen={() => open(sim.id)} />)
            )}
          </div>

          {/* The older block-based tool. Kept reachable rather than removed —
              it owns its own project rows, and some are in flight. */}
          <div className="mt-10 border-t border-border pt-6">
            <button
              onClick={() => navigate(`${cmsBase}/content/sim-builder/projects`)}
              className="group flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left transition-colors hover:border-on-surface/30 cursor-pointer"
            >
              <Layers className="h-4 w-4 shrink-0 text-outline" />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.86rem] font-bold text-on-surface">Visual block projects</span>
                <span className="block text-[0.72rem] text-outline">
                  The earlier page-and-block editor. Publishes into a simulation when it is finished.
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-transparent transition-colors group-hover:text-on-surface" />
            </button>
          </div>
        </div>
      </div>

      <NewSimulationDialog open={newOpen} onOpenChange={setNewOpen} onCreated={open} />
    </>
  )
}
