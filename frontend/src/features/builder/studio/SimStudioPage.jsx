import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { adoptHandoffToken } from '../../../lib/tabHandoff'
import { useAuth } from '../../auth/AuthContext'
import { useCmsBasePath } from '../../../hooks/useCmsBasePath'
import {
  useAdminSimulation, useBuilderCatalog, useCreateTask, useDeleteTask,
  useDuplicateTask, usePatchPublishScope, usePublishSimulation, useReorderTasks,
  useUnpublishSimulation, useUpdateSimulation, useUpdateTask,
} from '../../../hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/shadcn/dialog'
import PublishScopeModal from '../shared/PublishScopeModal'
import StudioBoot from './StudioBoot'
import StudioOutline, { PAGE } from './StudioOutline'
import TaskPage from './pages/TaskPage'
import WeekPage from './pages/WeekPage'
import ReviewPage from './pages/ReviewPage'
import { SetupPage, OnboardingPage } from './pages/SetupPage'
import { DEFAULT_FORMAT, checkTask, groupIntoWeeks, nextTaskIndex, readiness } from './lib/simFormat'
import { blankConfigFor } from './lib/scaffold'
import logo from '../../../assets/logo.png'

// The Sim Builder.
//
// ── WHAT THIS REPLACED ────────────────────────────────────────────────────
//
// A four-tab form (Metadata / Onboarding / Stages / Preview) reached from a
// row on the Simulations LIST — so "manage the catalogue" and "build a
// simulation" were the same page, and the builder was a detail view of an
// admin table. Its Stages tab was a palette, a flat task list, and a resizable
// side panel holding roughly forty ungrouped controls.
//
// It also could not author the format the platform actually ships: `explainer`
// and `assessment` had no UI at all, `week` was a bare number input, and
// `is_final_assessment` did not exist in the tool. Every simulation built here
// came out shaped like the OLD product.
//
// ── WHAT IT IS NOW ────────────────────────────────────────────────────────
//
// Its own tab, at /admin/content/sim-builder, laid out the way a page builder
// is: an outline of the simulation as pages on the left, one page open in the
// middle, and a readiness reading in the bar. The outline IS the structure the
// runtime renders — three weeks of three tasks and a final assessment — so
// getting the shape right is a matter of looking at it rather than counting.

function useHandoff() {
  // MUST run during render, before the first authenticated fetch — an effect
  // fires after the queries have already gone out without a token. See
  // lib/tabHandoff.js.
  useState(() => adoptHandoffToken())
}

function ReadinessMeter({ report }) {
  const { score, blockers, warnings, publishable } = report
  const tone = publishable ? 'bg-emerald-500' : blockers.length > 3 ? 'bg-red-500' : 'bg-amber-500'
  return (
    <div className="hidden min-w-0 items-center gap-3 lg:flex">
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-high">
        <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${score}%` }} />
      </div>
      <p className="whitespace-nowrap text-[0.72rem] font-semibold text-on-surface-variant">
        {blockers.length > 0
          ? `${blockers.length} blocking`
          : warnings.length > 0
            ? `${warnings.length} to polish`
            : 'Ready'}
      </p>
    </div>
  )
}

function AddTaskDialog({ open, onOpenChange, catalog, onPick, pending }) {
  const types = catalog?.task_types ?? []
  const groups = [...new Set(types.map((t) => t.group))]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
          <DialogDescription>
            What kind of work is this? It decides what the student gets and how it is scored — and it
            cannot be changed afterwards, so pick the one that matches the work.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-5 overflow-y-auto">
          {groups.map((group) => (
            <div key={group}>
              <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-outline">{group}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {types.filter((t) => t.group === group).map((t) => (
                  <button
                    key={t.type}
                    onClick={() => onPick(t.type)}
                    disabled={pending}
                    className="rounded-xl border border-border bg-white p-3.5 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50 cursor-pointer disabled:cursor-default"
                  >
                    <p className="font-display text-[0.88rem] font-extrabold text-on-surface">{t.label}</p>
                    <p className="mt-1 text-[0.74rem] leading-relaxed text-on-surface-variant">{t.summary}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function SimStudioPage() {
  useHandoff()
  const { id } = useParams()
  const navigate = useNavigate()
  const cmsBase = useCmsBasePath()
  const { hasPermission } = useAuth()
  const isPlatformAdmin = hasPermission()

  const { data: sim, isLoading, isError, error } = useAdminSimulation(id)
  const { data: catalog, isLoading: catalogLoading } = useBuilderCatalog()
  const format = catalog?.format ?? DEFAULT_FORMAT

  const [page, setPage] = useState(PAGE.SETUP)
  // undefined = the dialog is shut. A number, or null for "no week", is an
  // open dialog carrying where the new task should land — null is a real
  // value here, so it cannot double as the closed state.
  const [addingToWeek, setAddingToWeek] = useState(undefined)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [scaffolding, setScaffolding] = useState(false)

  const createTask = useCreateTask(id)
  const updateTask = useUpdateTask(id)
  const deleteTask = useDeleteTask(id)
  const duplicateTask = useDuplicateTask(id)
  const reorderTasks = useReorderTasks(id)
  const updateSim = useUpdateSimulation(id)
  const publishSim = usePublishSimulation(id)
  const unpublishSim = useUnpublishSimulation(id)
  const patchScope = usePatchPublishScope(id)

  const report = useMemo(() => readiness(sim, format), [sim, format])
  const issuesFor = useCallback((task) => checkTask(task, format), [format])

  const ready = !isLoading && !catalogLoading && (!!sim || isError)

  // ── structure edits ──────────────────────────────────────────────────────

  function handleAddTask(week) { setAddingToWeek(week ?? null) }
  function closeAddTask() { setAddingToWeek(undefined) }

  function handlePickType(type) {
    const week = addingToWeek
    const index = nextTaskIndex(sim.tasks)
    createTask.mutate(
      {
        task_index: index,
        week,
        title: week != null ? `Week ${week} · new task` : 'New task',
        type,
        config: blankConfigFor(type, format),
        xp_award: 50,
      },
      {
        onSuccess: (created) => {
          closeAddTask()
          setPage(PAGE.task(created.id))
          toast.success('Task added — start with the brief')
        },
        onError: (e) => toast.error(e.message || 'Could not add the task'),
      }
    )
  }

  function handleAddWeek() {
    const { weeks } = groupIntoWeeks(sim.tasks ?? [], sim.section_labels)
    const next = weeks.length ? Math.max(...weeks.map((w) => w.week)) + 1 : 1
    updateSim.mutate(
      { section_labels: { ...(sim.section_labels || {}), [String(next)]: `Week ${next}` } },
      {
        onSuccess: () => { setPage(PAGE.week(next)); toast.success(`Week ${next} added — now add its tasks`) },
        onError: (e) => toast.error(e.message || 'Could not add a week'),
      }
    )
  }

  /** Dragging a task does two things at once: it renumbers the whole list and
   *  it may move the task into a different week. Both are sent, in that order,
   *  because a reorder that landed a task in a new week without updating
   *  `week` would put it visually inside a section it does not belong to. */
  function handleMove({ taskIds, taskId, week }) {
    const task = sim.tasks.find((t) => t.id === taskId)
    reorderTasks.mutate(taskIds, {
      onError: () => toast.error('Could not reorder'),
      onSuccess: () => {
        if (task && task.week !== week) {
          updateTask.mutate({ taskId, week }, { onError: () => toast.error('Could not move it into that week') })
        }
      },
    })
  }

  function handleDuplicate(task) {
    duplicateTask.mutate(task.id, {
      onSuccess: (copy) => { setPage(PAGE.task(copy.id)); toast.success(`Duplicated “${task.title}”`) },
      onError: (e) => toast.error(e.message || 'Could not duplicate'),
    })
  }

  function handleDelete(task) {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        setPendingDelete(null)
        if (page === PAGE.task(task.id)) setPage(PAGE.REVIEW)
        toast.success('Task removed')
      },
      onError: (e) => toast.error(e.message || 'Could not delete'),
    })
  }

  /** Create the scaffold one task at a time, in order.
   *
   *  Sequential on purpose: `task_index` is unique per simulation, and firing
   *  ten creates in parallel races on it — the server returns 409 for the
   *  losers and the author is left with a half-built week and no explanation. */
  async function handleScaffold(plan) {
    setScaffolding(true)
    let made = 0
    try {
      await updateSim.mutateAsync({
        section_labels: { ...(sim.section_labels || {}), ...plan.sectionLabels },
      })
      for (const task of plan.tasks) {
        await createTask.mutateAsync(task)
        made += 1
      }
      toast.success(`Created ${made} tasks across ${format.weeks} weeks`)
      setPage(PAGE.week(1))
    } catch (e) {
      toast.error(
        made > 0
          ? `Created ${made} of ${plan.tasks.length} tasks, then stopped: ${e.message}`
          : (e.message || 'Could not scaffold')
      )
    } finally {
      setScaffolding(false)
    }
  }

  // ── publish ──────────────────────────────────────────────────────────────

  function handlePublish() {
    if (isPlatformAdmin) { setScopeOpen(true); return }
    publishSim.mutate({}, {
      onSuccess: () => toast.success('Published'),
      onError: (e) => toast.error(e.message),
    })
  }

  function handleScopeConfirm(body) {
    const mut = sim.status === 'PUBLISHED' ? patchScope : publishSim
    mut.mutate(body, {
      onSuccess: () => { setScopeOpen(false); toast.success(sim.status === 'PUBLISHED' ? 'Scope updated' : 'Published') },
      onError: (e) => toast.error(e.message),
    })
  }

  function handlePreview() {
    window.open(`/simulations/${sim.slug}/overview`, '_blank')
  }

  // ── render ───────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <>
        <StudioBoot ready />
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
          <p className="text-sm text-on-surface-variant">{error?.message || 'Could not load this simulation.'}</p>
          <button
            onClick={() => navigate(`${cmsBase}/content/sim-builder`)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold cursor-pointer"
          >
            Back to the builder
          </button>
        </div>
      </>
    )
  }

  if (!ready || !sim) return <StudioBoot ready={false} detail="Loading your simulation" />

  const openTask = page.startsWith('task:')
    ? sim.tasks?.find((t) => String(t.id) === page.slice(5))
    : null
  const openWeek = page.startsWith('week:') ? Number(page.slice(5)) : null

  return (
    <>
      <StudioBoot ready detail={sim.title} />

      <div className="flex h-screen flex-col bg-white">
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-4">
          <button
            onClick={() => navigate(`${cmsBase}/content/sim-builder`)}
            className="flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-surface-low cursor-pointer"
            title="All simulations"
          >
            <ArrowLeft className="h-4 w-4 text-on-surface-variant" />
            <img src={logo} alt="" className="h-6 w-6 rounded object-cover" />
          </button>

          <div className="h-5 w-px shrink-0 bg-border" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.86rem] font-bold text-on-surface">{sim.title}</p>
            <p className="truncate text-[0.68rem] text-outline">
              {sim.slug} · {sim.tasks?.length ?? 0} tasks
            </p>
          </div>

          <ReadinessMeter report={report} />

          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide',
              sim.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-high text-on-surface-variant'
            )}
          >
            {sim.status}
          </span>

          <button
            onClick={handlePreview}
            className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[0.78rem] font-bold text-on-surface-variant transition-colors hover:border-primary hover:text-primary sm:inline-flex cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Preview
          </button>

          {sim.status === 'PUBLISHED' ? (
            <button
              onClick={() => unpublishSim.mutate(undefined, { onSuccess: () => toast.success('Unpublished') })}
              className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[0.78rem] font-bold text-on-surface transition-colors hover:border-red-300 hover:text-red-600 cursor-pointer"
            >
              Unpublish
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishSim.isPending}
              className="shrink-0 rounded-lg bg-on-surface px-3.5 py-1.5 text-[0.78rem] font-bold text-white transition-colors hover:bg-primary disabled:opacity-50 cursor-pointer"
            >
              {publishSim.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Publish'}
            </button>
          )}
        </header>

        {/* ── Outline | page ──────────────────────────────────────────── */}
        <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: 'minmax(0,17rem) minmax(0,1fr)' }}>
          <div className="min-h-0 border-r border-border bg-surface-low/40">
            <StudioOutline
              sim={sim}
              page={page}
              onSelect={setPage}
              issuesFor={issuesFor}
              simIssues={report.simIssues}
              onAddTask={handleAddTask}
              onAddWeek={handleAddWeek}
              onDuplicate={handleDuplicate}
              onDelete={setPendingDelete}
              onMove={handleMove}
            />
          </div>

          <main className="min-h-0 overflow-hidden">
            {page === PAGE.SETUP && <SetupPage sim={sim} simId={id} />}
            {page === PAGE.ONBOARDING && <OnboardingPage sim={sim} simId={id} />}
            {openWeek != null && (
              <WeekPage
                sim={sim} simId={id} week={openWeek} format={format}
                onOpenTask={(task) => setPage(PAGE.task(task.id))}
                onAddTask={handleAddTask}
              />
            )}
            {openTask && (
              <TaskPage
                key={openTask.id}
                simId={id}
                task={openTask}
                catalog={catalog}
                format={format}
              />
            )}
            {page === PAGE.REVIEW && (
              <ReviewPage
                sim={sim}
                report={report}
                format={format}
                onJumpToTask={(task) => setPage(PAGE.task(task.id))}
                onScaffold={handleScaffold}
                scaffolding={scaffolding}
                onPublish={handlePublish}
                publishing={publishSim.isPending || patchScope.isPending}
                onPreview={handlePreview}
              />
            )}
            {/* A task or week that was deleted while open leaves `page`
                pointing at nothing. Say so rather than rendering a blank. */}
            {!openTask && openWeek == null && ![PAGE.SETUP, PAGE.ONBOARDING, PAGE.REVIEW].includes(page) && (
              <div className="flex h-full items-center justify-center px-6">
                <p className="text-sm text-on-surface-variant">That page is gone. Pick another from the outline.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      <AddTaskDialog
        open={addingToWeek !== undefined}
        onOpenChange={(open) => !open && closeAddTask()}
        catalog={catalog}
        onPick={handlePickType}
        pending={createTask.isPending}
      />

      <PublishScopeModal
        open={scopeOpen}
        onOpenChange={setScopeOpen}
        onConfirm={handleScopeConfirm}
        confirming={publishSim.isPending || patchScope.isPending}
        title={sim.status === 'PUBLISHED' ? 'Edit publish scope' : 'Publish to universities'}
        confirmLabel={sim.status === 'PUBLISHED' ? 'Save scope' : 'Publish'}
        initialAvailableToAll={sim.available_to_all_universities !== false}
        initialUniversityIds={sim.university_ids || []}
      />

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{pendingDelete?.title}”?</DialogTitle>
            <DialogDescription>
              This removes the task and everything written on it — the brief, the explainer, the
              check, and its grading wiring. Student progress on other tasks is untouched. There is
              no undo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPendingDelete(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold cursor-pointer"
            >
              Keep it
            </button>
            <button
              onClick={() => handleDelete(pendingDelete)}
              disabled={deleteTask.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              {deleteTask.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
