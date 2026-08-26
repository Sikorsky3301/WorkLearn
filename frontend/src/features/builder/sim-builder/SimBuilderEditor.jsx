import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthContext'
import {
  useSimBuilderProject, useCreateSimBuilderPage, useDeleteSimBuilderPage, useReorderSimBuilderPages,
  useCreateSimBuilderBlock, useDeleteSimBuilderBlock, useReorderSimBuilderBlocks, useUpdateSimBuilderBlock,
  usePublishSimBuilderProject,
} from '../../../hooks'
import { DEFAULT_BLOCK_CONFIG } from './blockTypeRegistry'
import Toolbar from './Toolbar'
import LeftSidebar from './LeftSidebar'
import Canvas from './Canvas'
import PropertiesPanel from './PropertiesPanel'
import VersionHistoryPanel from './VersionHistoryPanel'
import AiGenerateDialog from './AiGenerateDialog'
import PreviewOverlay from './PreviewOverlay'
import PublishScopeModal from '../shared/PublishScopeModal'

/** Top-level 4-zone Sim Builder editor: toolbar / left sidebar / canvas /
 * properties panel. Structural edits (add/delete/reorder a page or block)
 * persist immediately via the mutation hooks below and push an inverse
 * action onto an in-memory undo stack (session-only — see the plan's v1
 * scope notes). Block *config* edits are a local draft until Save is
 * clicked, mirroring the job-sim builder's TaskEditorPanel draft/save split
 * — and are mirrored live into the Canvas for WYSIWYG feedback. */
export default function SimBuilderEditor() {
  const { id: projectId } = useParams()
  const { hasPermission } = useAuth()
  const isPlatformAdmin = hasPermission()
  const { data: project, isLoading } = useSimBuilderProject(projectId)

  const [activePageId, setActivePageId] = useState(null)
  const [selectedBlockId, setSelectedBlockId] = useState(null)
  const [draftConfig, setDraftConfig] = useState(null)
  const [overlay, setOverlay] = useState(null) // null | 'preview' | 'versions' | 'ai-generate'
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [scopeOpen, setScopeOpen] = useState(false)

  const createPage = useCreateSimBuilderPage(projectId)
  const deletePage = useDeleteSimBuilderPage(projectId)
  const reorderPages = useReorderSimBuilderPages(projectId)
  const createBlock = useCreateSimBuilderBlock(projectId)
  const deleteBlock = useDeleteSimBuilderBlock(projectId)
  const reorderBlocks = useReorderSimBuilderBlocks(projectId)
  const updateBlock = useUpdateSimBuilderBlock(projectId)
  const publishProject = usePublishSimBuilderProject(projectId)

  const pages = project?.pages ?? []
  const activePage = pages.find((p) => p.id === activePageId) || null
  const selectedBlock = activePage?.blocks.find((b) => b.id === selectedBlockId) || null

  function pushUndo(action) {
    setUndoStack((s) => [...s, action])
    setRedoStack([])
  }

  function selectPage(pageId) {
    setActivePageId(pageId)
    setSelectedBlockId(null)
    setDraftConfig(null)
  }

  function selectBlock(block) {
    setSelectedBlockId(block.id)
    setDraftConfig({ ...block.config })
  }

  function closeBlock() {
    setSelectedBlockId(null)
    setDraftConfig(null)
  }

  async function handleSaveBlock() {
    if (!activePageId || !selectedBlockId || !draftConfig) return
    try {
      await updateBlock.mutateAsync({ pageId: activePageId, blockId: selectedBlockId, config: draftConfig })
      toast.success('Block saved')
    } catch (e) {
      toast.error(e?.message || 'Could not save block')
    }
  }

  async function handleAddPage() {
    const maxOrder = pages.length ? Math.max(...pages.map((p) => p.order)) : 0
    const body = { title: 'Untitled Page', order: maxOrder + 1 }
    try {
      const created = await createPage.mutateAsync(body)
      const ref = { id: created.id }
      pushUndo({
        label: 'Add page',
        undo: async () => { await deletePage.mutateAsync(ref.id) },
        redo: async () => { const c = await createPage.mutateAsync(body); ref.id = c.id },
      })
      selectPage(created.id)
    } catch (e) {
      toast.error(e?.message || 'Could not add page')
    }
  }

  async function handleDeletePage(page) {
    const snapshot = {
      title: page.title, week: page.week, order: page.order,
      blocks: page.blocks.map((b) => ({ block_type: b.block_type, order: b.order, config: b.config })),
    }
    try {
      await deletePage.mutateAsync(page.id)
      const ref = { id: null }
      pushUndo({
        label: 'Delete page',
        undo: async () => {
          const created = await createPage.mutateAsync({ title: snapshot.title, week: snapshot.week, order: snapshot.order })
          ref.id = created.id
          for (const b of snapshot.blocks) {
            await createBlock.mutateAsync({ pageId: created.id, block_type: b.block_type, order: b.order, config: b.config })
          }
        },
        redo: async () => { await deletePage.mutateAsync(ref.id) },
      })
      if (activePageId === page.id) selectPage(null)
    } catch (e) {
      toast.error(e?.message || 'Could not delete page')
    }
  }

  async function handleReorderPages(newOrderIds) {
    const previousOrderIds = pages.map((p) => p.id)
    try {
      await reorderPages.mutateAsync(newOrderIds)
      pushUndo({
        label: 'Reorder pages',
        undo: async () => { await reorderPages.mutateAsync(previousOrderIds) },
        redo: async () => { await reorderPages.mutateAsync(newOrderIds) },
      })
    } catch (e) {
      toast.error(e?.message || 'Could not reorder pages')
    }
  }

  async function handleAddBlock(blockType) {
    if (!activePage) return
    const maxOrder = activePage.blocks.length ? Math.max(...activePage.blocks.map((b) => b.order)) : 0
    const body = { pageId: activePage.id, block_type: blockType, order: maxOrder + 1, config: DEFAULT_BLOCK_CONFIG[blockType] || {} }
    try {
      const created = await createBlock.mutateAsync(body)
      const ref = { id: created.id }
      pushUndo({
        label: 'Add block',
        undo: async () => { await deleteBlock.mutateAsync({ pageId: activePage.id, blockId: ref.id }) },
        redo: async () => { const c = await createBlock.mutateAsync(body); ref.id = c.id },
      })
      selectBlock(created)
    } catch (e) {
      toast.error(e?.message || 'Could not add block')
    }
  }

  async function handleDeleteBlock(block) {
    if (!activePage) return
    const pageId = activePage.id
    const body = { pageId, block_type: block.block_type, order: block.order, config: block.config }
    try {
      await deleteBlock.mutateAsync({ pageId, blockId: block.id })
      const ref = { id: null }
      pushUndo({
        label: 'Delete block',
        undo: async () => { const c = await createBlock.mutateAsync(body); ref.id = c.id },
        redo: async () => { await deleteBlock.mutateAsync({ pageId, blockId: ref.id }) },
      })
      if (selectedBlockId === block.id) closeBlock()
    } catch (e) {
      toast.error(e?.message || 'Could not delete block')
    }
  }

  async function handleReorderBlocks(newOrderIds) {
    if (!activePage) return
    const pageId = activePage.id
    const previousOrderIds = activePage.blocks.map((b) => b.id)
    try {
      await reorderBlocks.mutateAsync({ pageId, blockIds: newOrderIds })
      pushUndo({
        label: 'Reorder blocks',
        undo: async () => { await reorderBlocks.mutateAsync({ pageId, blockIds: previousOrderIds }) },
        redo: async () => { await reorderBlocks.mutateAsync({ pageId, blockIds: newOrderIds }) },
      })
    } catch (e) {
      toast.error(e?.message || 'Could not reorder blocks')
    }
  }

  async function handleUndo() {
    const action = undoStack[undoStack.length - 1]
    if (!action) return
    setUndoStack((s) => s.slice(0, -1))
    await action.undo()
    setRedoStack((s) => [...s, action])
  }

  async function handleRedo() {
    const action = redoStack[redoStack.length - 1]
    if (!action) return
    setRedoStack((s) => s.slice(0, -1))
    await action.redo()
    setUndoStack((s) => [...s, action])
  }

  async function handlePublish() {
    if (isPlatformAdmin) {
      setScopeOpen(true)
      return
    }
    try {
      await publishProject.mutateAsync({})
      toast.success('Project published')
    } catch (e) {
      toast.error(e?.message || 'Could not publish')
    }
  }

  async function handleScopeConfirm(body) {
    try {
      await publishProject.mutateAsync(body)
      setScopeOpen(false)
      toast.success('Project published')
    } catch (e) {
      toast.error(e?.message || 'Could not publish')
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-on-surface-variant dark:text-slate-400">Project not found.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-surface-low dark:bg-slate-950">
      <Toolbar
        project={project}
        onSave={handleSaveBlock}
        saving={updateBlock.isPending}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenPreview={() => setOverlay('preview')}
        onOpenVersions={() => setOverlay('versions')}
        onOpenAiGenerate={() => setOverlay('ai-generate')}
        onPublish={handlePublish}
        publishing={publishProject.isPending}
      />

      <div className="flex-1 flex min-h-0">
        <LeftSidebar
          pages={pages}
          activePageId={activePageId}
          onSelectPage={selectPage}
          onAddPage={handleAddPage}
          onDeletePage={handleDeletePage}
        />
        <Canvas
          page={activePage}
          selectedBlockId={selectedBlockId}
          draftConfig={draftConfig}
          onSelectBlock={selectBlock}
          onAddBlock={handleAddBlock}
          onDeleteBlock={handleDeleteBlock}
          onReorderBlocks={handleReorderBlocks}
        />
        <PropertiesPanel
          block={selectedBlock}
          draftConfig={draftConfig}
          onDraftChange={setDraftConfig}
          onSave={handleSaveBlock}
          saving={updateBlock.isPending}
          onClose={closeBlock}
        />
      </div>

      {overlay === 'versions' && <VersionHistoryPanel projectId={projectId} onClose={() => setOverlay(null)} />}
      {overlay === 'ai-generate' && <AiGenerateDialog projectId={projectId} onClose={() => setOverlay(null)} />}
      {overlay === 'preview' && <PreviewOverlay project={project} onClose={() => setOverlay(null)} />}
      <PublishScopeModal
        open={scopeOpen}
        onOpenChange={setScopeOpen}
        onConfirm={handleScopeConfirm}
        confirming={publishProject.isPending}
        title="Publish to universities"
        confirmLabel="Publish"
      />
    </div>
  )
}
