import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminSimulation, useCreateSimulation, useUpdateSimulation, usePublishSimulation, useUnpublishSimulation } from '../../../shared/api/hooks'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../shared/ui/shadcn/tabs'
import { Badge } from '../../../shared/ui/shadcn/badge'
import { Button } from '../../../shared/ui/shadcn/button'
import MetadataTab from './tabs/MetadataTab'
import ManagerOnboardingTab from './tabs/ManagerOnboardingTab'
import StagesTab from './tabs/StagesTab'
import PreviewTab from './tabs/PreviewTab'

const BLANK_SIM = {
  id: '', title: '', description: '', company: '', domain: '', category: '',
  accent_color: 'bg-primary', difficulty: 'Beginner', estimated_hours: '',
  skills: [], manager: { name: '', role: '', avatar: '' },
  onboarding: { company: { name: '', industry: '', size: '', location: '', about: '' }, intro: '', learn: [], offer: { title: '', role: '', team: '', company: '', body: '' } },
  onboarding_xp_award: 0,
}

/** Standalone admin page (not nested in SuperAdmin's sidebar chrome — the
 * builder wants full width and is a long-lived editing session, so it gets
 * its own route/URL, per the CMS plan) for creating/editing one simulation:
 * Metadata / Manager & Onboarding / Stages (drag-and-drop) / Preview. */
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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Admin
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{draft.title || 'New Simulation'}</p>
            <p className="text-xs text-gray-400 truncate">{draft.id || 'unsaved'}</p>
          </div>
          {hasRealSim && (
            <>
              <Badge variant={draft.status === 'PUBLISHED' ? 'default' : 'secondary'}>{draft.status}</Badge>
              {draft.status === 'PUBLISHED' ? (
                <Button variant="outline" size="sm" onClick={() => unpublishSim.mutate()}>Unpublish</Button>
              ) : (
                <Button size="sm" onClick={() => publishSim.mutate(undefined, { onError: (e) => toast.error(e.message) })}>Publish</Button>
              )}
            </>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="metadata">
          <TabsList>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="onboarding" disabled={!hasRealSim}>Manager &amp; Onboarding</TabsTrigger>
            <TabsTrigger value="stages" disabled={!hasRealSim}>Stages</TabsTrigger>
            <TabsTrigger value="preview" disabled={!hasRealSim}>Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="metadata" className="mt-6">
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
              <TabsContent value="onboarding" className="mt-6">
                <ManagerOnboardingTab draft={draft} setDraft={setDraft} onSave={handleSaveMetadata} saving={updateSim.isPending} />
              </TabsContent>
              <TabsContent value="stages" className="mt-6">
                <StagesTab simId={realId} />
              </TabsContent>
              <TabsContent value="preview" className="mt-6">
                <PreviewTab simId={realId} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}
