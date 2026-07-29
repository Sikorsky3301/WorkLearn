import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminSimulation, useCreateSimulation, useUpdateSimulation, usePublishSimulation, useUnpublishSimulation } from '../../../shared/api/hooks'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../shared/ui/shadcn/tabs'
import { Badge } from '../../../shared/ui/shadcn/badge'
import { Button } from '../../../shared/ui/shadcn/button'
import MetadataTab from './tabs/MetadataTab'
import ManagerOnboardingTab from './tabs/ManagerOnboardingTab'
import StagesTab from './tabs/StagesTab'
import PreviewTab from './tabs/PreviewTab'
import logo from '../../../assets/logo.png'

const BLANK_SIM = {
  id: '', title: '', description: '', company: '', domain: '', category: '',
  accent_color: 'bg-primary', difficulty: 'Beginner', estimated_hours: '',
  skills: [], manager: { name: '', role: '', avatar: '' },
  onboarding: { company: { name: '', industry: '', size: '', location: '', about: '' }, intro: '', learn: [], offer: { title: '', role: '', team: '', company: '', body: '' } },
  onboarding_xp_award: 0,
}

/** Standalone admin page (not nested in SuperAdmin's sidebar chrome — the
 * builder wants full width and is a long-lived editing session, so it gets
 * its own route/URL) for creating/editing one simulation: Metadata /
 * Onboarding / Stages (drag-and-drop) / Preview, in a full-width
 * toolbar+canvas layout. Distinct from the separate "Sim Builder" visual
 * canvas tool (src/features/admin-content/sim-builder/) — this is the structured,
 * form-driven builder. */
export default function SimulationBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const { data: existing, isLoading } = useAdminSimulation(isNew ? null : id)
  const [draft, setDraft] = useState(BLANK_SIM)
  const [realId, setRealId] = useState(isNew ? null : id)

  useEffect(() => {
    if (existing) setDraft(existing)
  }, [existing])

  const createSim = useCreateSimulation()
  const updateSim = useUpdateSimulation(realId)
  const publishSim = usePublishSimulation(realId)
  const unpublishSim = useUnpublishSimulation(realId)

  function handleCreate() {
    if (!draft.id || !draft.title) {
      toast.error('Simulation id and title are required')
      return
    }
    createSim.mutate(draft, {
      onSuccess: (res) => {
        toast.success('Simulation created — now add stages')
        setRealId(res.id)
        navigate(`/admin/simulations/${res.id}`, { replace: true })
      },
      onError: (e) => toast.error(e.message || 'Could not create simulation'),
    })
  }

  function handleSaveMetadata() {
    updateSim.mutate(draft, {
      onSuccess: () => toast.success('Saved'),
      onError: (e) => toast.error(e.message || 'Could not save'),
    })
  }

  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const hasRealSim = !!realId

  return (
    <div className="min-h-screen bg-surface-low">
      <Tabs defaultValue="metadata">
        {/* ── Toolbar ── */}
        <header className="sticky top-0 z-10 bg-white border-b border-border">
          <div className="px-6 h-16 flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              title="Back to Admin"
              className="flex items-center gap-2 shrink-0 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg px-1 -mx-1"
            >
              <img src={logo} alt="WorkLearn" className="w-8 h-8 rounded-lg object-cover shrink-0" />
              <ChevronDown className="h-3.5 w-3.5 text-outline group-hover:text-on-surface-variant transition-colors shrink-0" />
              <span className="text-sm font-bold text-on-surface whitespace-nowrap">Simulation Builder</span>
            </button>

            <div className="h-6 w-px bg-border shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{draft.title || 'New Simulation'}</p>
              <p className="text-xs text-outline truncate">{draft.id || 'unsaved'}</p>
            </div>

            <div className="shrink-0 overflow-x-auto">
              <TabsList>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="onboarding" disabled={!hasRealSim}>Onboarding</TabsTrigger>
                <TabsTrigger value="stages" disabled={!hasRealSim}>Stages</TabsTrigger>
                <TabsTrigger value="preview" disabled={!hasRealSim}>Preview</TabsTrigger>
              </TabsList>
            </div>

            {hasRealSim && (
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={draft.status === 'PUBLISHED' ? 'default' : 'secondary'}>{draft.status}</Badge>
                {draft.status === 'PUBLISHED' ? (
                  <Button variant="outline" size="sm" onClick={() => unpublishSim.mutate()}>Unpublish</Button>
                ) : (
                  <Button size="sm" onClick={() => publishSim.mutate(undefined, { onError: (e) => toast.error(e.message) })}>Publish</Button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── Content ── */}
        <div className="py-8">
          <TabsContent value="metadata" className="!mt-0 max-w-4xl mx-auto px-6">
            <MetadataTab draft={draft} setDraft={setDraft} isNew={!hasRealSim} />
            <div className="mt-6 flex justify-end">
              {!hasRealSim ? (
                <Button onClick={handleCreate} disabled={createSim.isPending}>
                  {createSim.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create Simulation
                </Button>
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
