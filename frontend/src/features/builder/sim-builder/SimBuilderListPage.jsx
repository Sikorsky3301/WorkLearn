import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wand2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import TablePagination, { useClientPagination } from '../../../components/design-system/TablePagination'
import {
  useSimBuilderProjects, useCreateSimBuilderProject, useDeleteSimBuilderProject,
} from '../../../hooks'
import { useCmsBasePath } from '../../../hooks/useCmsBasePath'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/shadcn/dialog'

/** Sim Builder project list — rendered inside AdminCmsLayout / MentorCmsLayout. */
export default function SimBuilderListPage() {
  const navigate = useNavigate()
  const cmsBase = useCmsBasePath()
  const { data, isLoading } = useSimBuilderProjects()
  const [newOpen, setNewOpen] = useState(false)

  const projects = data?.projects ?? []
  const { page, setPage, pageSize, setPageSize, pageRows, total } = useClientPagination(projects)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Sim Builder</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Visual editor for job simulations</p>
        </div>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 shrink-0"
        >
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {isLoading ? (
        <div className="card shadow-sm"><div className="h-40 bg-surface-high dark:bg-slate-800 rounded animate-pulse" /></div>
      ) : projects.length === 0 ? (
        <div className="card shadow-sm text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Wand2 className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No Sim Builder projects yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create one to start building a visual job simulation.</p>
        </div>
      ) : (
        <div className="card shadow-sm p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-surface-low dark:bg-slate-800/60 border-b border-border dark:border-slate-800">
              <tr>
                {['Title', 'Status', 'Pages', 'Updated', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-slate-800">
              {pageRows.map((p) => (
                <ProjectRow key={p.id} project={p} onOpen={() => navigate(`${cmsBase}/sim-builder/${p.id}`)} />
              ))}
            </tbody>
          </table>
          <TablePagination
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      <NewProjectDialog open={newOpen} onOpenChange={setNewOpen} cmsBase={cmsBase} />
    </div>
  )
}

function ProjectRow({ project, onOpen }) {
  const deleteProject = useDeleteSimBuilderProject()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <tr className="hover:bg-surface-low dark:hover:bg-slate-800/60 transition-colors">
      <td className="px-4 py-3 font-medium text-on-surface dark:text-slate-100">
        <button type="button" onClick={onOpen} className="hover:underline cursor-pointer text-left">{project.title}</button>
      </td>
      <td className="px-4 py-3">
        <span className={`chip text-[10px] ${project.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-surface-high text-on-surface-variant dark:bg-slate-800 dark:text-slate-300'}`}>
          {project.status}
        </span>
      </td>
      <td className="px-4 py-3 text-on-surface-variant dark:text-slate-400 tabular-nums">{project.page_count}</td>
      <td className="px-4 py-3 text-xs text-outline dark:text-slate-500">{new Date(project.updated_at).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <button type="button" onClick={onOpen} className="text-xs font-semibold text-primary hover:underline mr-3 cursor-pointer">Open</button>
        {!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer">Delete</button>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => deleteProject.mutate(project.id, { onError: () => toast.error('Could not delete this project.') })}
              className="text-xs font-semibold text-white bg-red-600 px-2 py-0.5 rounded cursor-pointer"
            >
              Confirm
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-outline cursor-pointer hover:text-on-surface-variant transition-colors">Cancel</button>
          </span>
        )}
      </td>
    </tr>
  )
}

function NewProjectDialog({ open, onOpenChange, cmsBase = '/admin' }) {
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
        onSuccess: (project) => { handleOpenChange(false); navigate(`${cmsBase}/sim-builder/${project.id}`) },
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
            type="button"
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
