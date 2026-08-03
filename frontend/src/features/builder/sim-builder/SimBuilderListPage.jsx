import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wand2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useSimBuilderProjects, useCreateSimBuilderProject, useDeleteSimBuilderProject,
} from '../../../hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/shadcn/dialog'
import SimBuilderLogo from './SimBuilderLogo'

/** Sim Builder's landing page — list of projects + create/delete, parallel
 * to the job-sim builder's SimulationsListPanel.jsx but a standalone route
 * (own header) rather than a tab embedded in SuperAdmin. */
export default function SimBuilderListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useSimBuilderProjects()
  const [newOpen, setNewOpen] = useState(false)

  const projects = data?.projects ?? []

  return (
    <div className="min-h-screen bg-surface-low">
      <header className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Admin
          </button>
          <div className="h-6 w-px bg-border shrink-0" />
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <SimBuilderLogo className="w-8 h-8" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface leading-tight truncate">Sim Builder</p>
              <p className="text-[11px] text-on-surface-variant leading-tight">Visual editor for job simulations</p>
            </div>
          </div>
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 shrink-0"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="card shadow-sm"><div className="h-40 bg-surface-high rounded animate-pulse" /></div>
        ) : projects.length === 0 ? (
          <div className="card shadow-sm text-center py-16">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Wand2 className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-on-surface">No Sim Builder projects yet</p>
            <p className="text-xs text-outline mt-1">Create one to start building a visual job simulation.</p>
          </div>
        ) : (
          <div className="card shadow-sm p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-low border-b border-border">
                <tr>
                  {['Title', 'Status', 'Pages', 'Updated', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {projects.map((p) => (
                  <ProjectRow key={p.id} project={p} onOpen={() => navigate(`/admin/sim-builder/${p.id}`)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewProjectDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}

function ProjectRow({ project, onOpen }) {
  const deleteProject = useDeleteSimBuilderProject()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <tr className="hover:bg-surface-low transition-colors">
      <td className="px-4 py-3 font-medium text-on-surface">
        <button onClick={onOpen} className="hover:underline cursor-pointer text-left">{project.title}</button>
      </td>
      <td className="px-4 py-3">
        <span className={`chip text-[10px] ${project.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-high text-on-surface-variant'}`}>
          {project.status}
        </span>
      </td>
      <td className="px-4 py-3 text-on-surface-variant tabular-nums">{project.page_count}</td>
      <td className="px-4 py-3 text-xs text-outline">{new Date(project.updated_at).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <button onClick={onOpen} className="text-xs font-semibold text-primary hover:underline mr-3 cursor-pointer">Open</button>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer">Delete</button>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <button
              onClick={() => deleteProject.mutate(project.id, { onError: () => toast.error('Could not delete this project.') })}
              className="text-xs font-semibold text-white bg-red-600 px-2 py-0.5 rounded cursor-pointer"
            >
              Confirm
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-outline cursor-pointer hover:text-on-surface-variant transition-colors">Cancel</button>
          </span>
        )}
      </td>
    </tr>
  )
}

function NewProjectDialog({ open, onOpenChange }) {
  const navigate = useNavigate()
  const createProject = useCreateSimBuilderProject()
  const [title, setTitle] = useState('')

  function handleOpenChange(next) {
    if (!next) setTitle('')
    onOpenChange(next)
  }

  function handleCreate() {
    if (!title.trim()) return
    createProject.mutate(
      { title: title.trim() },
      {
        onSuccess: (project) => { handleOpenChange(false); navigate(`/admin/sim-builder/${project.id}`) },
        onError: (e) => toast.error(e?.message || 'Could not create project'),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Sim Builder project</DialogTitle>
          <DialogDescription>Give it a name — you'll build out Weeks, Pages, and Blocks next.</DialogDescription>
        </DialogHeader>
        <div>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Customer Support Onboarding"
            className="input w-full"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            disabled={createProject.isPending || !title.trim()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg disabled:opacity-50 cursor-pointer"
          >
            {createProject.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create Project
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
