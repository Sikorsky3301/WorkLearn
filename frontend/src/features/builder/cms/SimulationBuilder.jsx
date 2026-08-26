import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthContext'
import { useCmsBasePath } from '../../../hooks/useCmsBasePath'
import { useAdminSimulation, useCreateSimulation, useUpdateSimulation, usePublishSimulation, useUnpublishSimulation, usePatchPublishScope } from '../../../hooks'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/shadcn/tabs'
import { Badge } from '../../../components/ui/shadcn/badge'
import { Button } from '../../../components/ui/shadcn/button'
import MetadataTab from './tabs/MetadataTab'
import ManagerOnboardingTab from './tabs/ManagerOnboardingTab'
import StagesTab from './tabs/StagesTab'
import PreviewTab from './tabs/PreviewTab'
import ArchitectureTab from './tabs/ArchitectureTab'
import PublishScopeModal from '../shared/PublishScopeModal'

const BLANK_SIM = {
  id: '', title: '', description: '', company: '', domain: '', category: '',
  accent_color: 'bg-primary', difficulty: 'Beginner', estimated_hours: '',
  skills: [], manager: { name: '', role: '', avatar: '' },
  onboarding: { company: { name: '', industry: '', size: '', location: '', about: '' }, intro: '', learn: [], offer: { title: '', role: '', team: '', company: '', body: '' } },
  onboarding_xp_award: 0,
}

/** Job-sim CMS editor — Metadata / Onboarding / Architecture / Stages / Preview.
 * Mounted under AdminCmsLayout / MentorCmsLayout (sidebar stays visible). */
export default function SimulationBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cmsBase = useCmsBasePath()
  const isNew = id === 'new'

  const { data: existing, isLoading, isError, error } = useAdminSimulation(isNew ? null : id)
  const [draft, setDraft] = useState(BLANK_SIM)
  const [realId, setRealId] = useState(isNew ? null : id)

  // Keep local id in sync when the route changes (e.g. /new → /123 after create).
  useEffect(() => {
    if (id && id !== 'new') setRealId(id)
    else if (id === 'new') setRealId(null)
  }, [id])

  useEffect(() => {
    if (!existing) return
    // MetadataTab edits the public slug via `draft.id` for new sims; after
    // load keep that field as the slug string (numeric PK stays in realId).
    setDraft({ ...existing, id: existing.slug || existing.id })
    if (existing.id != null) setRealId(String(existing.id))
  }, [existing])

  const { hasPermission } = useAuth()
  const isPlatformAdmin = hasPermission()
  const createSim = useCreateSimulation()
  const updateSim = useUpdateSimulation(realId)
  const publishSim = usePublishSimulation(realId)
  const unpublishSim = useUnpublishSimulation(realId)
  const patchScope = usePatchPublishScope(realId)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [scopeMode, setScopeMode] = useState('publish')

  function handlePublishClick() {
    if (isPlatformAdmin) {
      setScopeMode('publish')
      setScopeOpen(true)
      return
    }
    publishSim.mutate({}, { onError: (e) => toast.error(e.message) })
  }

  function handleScopeConfirm(body) {
    const mut = scopeMode === 'edit' ? patchScope : publishSim
    mut.mutate(body, {
      onSuccess: () => {
        setScopeOpen(false)
        toast.success(scopeMode === 'edit' ? 'Publish scope updated' : 'Published')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  function handleCreate() {
    if (!draft.id || !draft.title) {
      toast.error('Simulation id and title are required')
      return
    }
    createSim.mutate(draft, {
      onSuccess: (res) => {
        toast.success('Simulation created — now add stages')
        const nextId = res.id ?? res.slug
        setRealId(String(nextId))
        navigate(`${cmsBase}/simulations/${nextId}`, { replace: true })
      },
      onError: (e) => {
        const msg = e?.message || ''
        // Earlier create may have saved the row then failed on response —
        // open the existing draft so Onboarding/Stages unlock.
        if (/already exists/i.test(msg) && draft.id) {
          toast.message('That simulation already exists — opening it')
          navigate(`${cmsBase}/simulations/${draft.id}`, { replace: true })
          return
        }
        toast.error(msg || 'Could not create simulation')
      },
    })
  }

  function handleSaveMetadata() {
    if (!realId) {
      handleCreate()
      return
    }
    updateSim.mutate(draft, {
      onSuccess: () => toast.success('Saved'),
      onError: (e) => toast.error(e.message || 'Could not save'),
    })
  }

  if (!isNew && isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!isNew && isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 min-h-[40vh]">
        <p className="text-sm text-on-surface-variant dark:text-slate-400">{error?.message || 'Could not load this simulation.'}</p>
        <Button variant="outline" onClick={() => navigate(`${cmsBase}/simulations`)}>Back to list</Button>
      </div>
    )
  }

  const hasRealSim = !!realId && !isNew

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-surface-low dark:bg-slate-950">
      <Tabs defaultValue="metadata" className="flex-1 min-h-0 flex flex-col">
        {/* ── Toolbar ── */}
        <header className="sticky top-0 z-10 shrink-0 bg-white dark:bg-slate-900 border-b border-border dark:border-slate-800">
          <div className="px-6 h-16 flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(`${cmsBase}/simulations`)}
              title="Back to simulations list"
              className="flex items-center gap-2 shrink-0 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg px-1 -mx-1"
            >
              <ArrowLeft className="h-4 w-4 text-outline group-hover:text-on-surface-variant dark:text-slate-400 dark:group-hover:text-slate-200 transition-colors shrink-0" />
              <span className="text-sm font-bold text-on-surface dark:text-slate-100 whitespace-nowrap">Simulations</span>
            </button>

            <div className="h-6 w-px bg-border dark:bg-slate-700 shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface dark:text-slate-100 truncate">{draft.title || 'New Simulation'}</p>
              <p className="text-xs text-outline dark:text-slate-500 truncate">{draft.id || 'unsaved'}</p>
            </div>

            <div className="shrink-0 overflow-x-auto">
              <TabsList>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="onboarding" disabled={!hasRealSim}>Onboarding</TabsTrigger>
                <TabsTrigger value="architecture" disabled={!hasRealSim}>Architecture</TabsTrigger>
                <TabsTrigger value="stages" disabled={!hasRealSim}>Stages</TabsTrigger>
                <TabsTrigger value="preview" disabled={!hasRealSim}>Preview</TabsTrigger>
              </TabsList>
            </div>

            {hasRealSim && (
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={draft.status === 'PUBLISHED' ? 'default' : 'secondary'}>{draft.status}</Badge>
                {draft.status === 'PUBLISHED' ? (
                  <>
                    {isPlatformAdmin && (
                      <Button variant="outline" size="sm" onClick={() => { setScopeMode('edit'); setScopeOpen(true) }}>
                        Edit scope
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => unpublishSim.mutate()}>Unpublish</Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handlePublishClick}>Publish</Button>
                )}
              </div>
            )}
          </div>
        </header>

        <PublishScopeModal
          open={scopeOpen}
          onOpenChange={setScopeOpen}
          onConfirm={handleScopeConfirm}
          confirming={publishSim.isPending || patchScope.isPending}
          title={scopeMode === 'edit' ? 'Edit publish scope' : 'Publish to universities'}
          confirmLabel={scopeMode === 'edit' ? 'Save scope' : 'Publish'}
          initialAvailableToAll={draft.available_to_all_universities !== false}
          initialUniversityIds={draft.university_ids || []}
        />

        {/* ── Content ── */}
        <div className="flex-1 min-h-0 overflow-y-auto py-8">
          <TabsContent value="metadata" className="!mt-0 max-w-4xl mx-auto px-6">
            <MetadataTab draft={draft} setDraft={setDraft} isNew={!hasRealSim} />
            <div className="mt-6 flex flex-col items-end gap-2">
              {!hasRealSim ? (
                <>
                  <Button onClick={handleCreate} disabled={createSim.isPending}>
                    {createSim.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create Simulation
                  </Button>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">
                    Create the simulation first to unlock Onboarding, Architecture, Stages, and Preview.
                  </p>
                </>
              ) : (
                <Button onClick={handleSaveMetadata} disabled={updateSim.isPending}>
                  {updateSim.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
                </Button>
              )}
            </div>
          </TabsContent>

          {hasRealSim && (
            <>
              <TabsContent value="onboarding" className="!mt-0 max-w-4xl mx-auto px-6">
                <ManagerOnboardingTab draft={draft} setDraft={setDraft} onSave={handleSaveMetadata} saving={updateSim.isPending} />
              </TabsContent>
              <TabsContent value="architecture" className="!mt-0 px-6">
                <ArchitectureTab simId={realId} />
              </TabsContent>
              <TabsContent value="stages" className="!mt-0 px-6">
                <StagesTab simId={realId} />
              </TabsContent>
              <TabsContent value="preview" className="!mt-0 max-w-4xl mx-auto px-6">
                <PreviewTab simId={realId} />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  )
}
