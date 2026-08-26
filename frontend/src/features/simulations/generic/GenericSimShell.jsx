import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { X, Clock } from 'lucide-react'
import { useEnrollment, useEnroll, useOnboarding, useCompleteTask, useSimulationFull } from '../../../hooks'
import { resolveMediaUrl } from '../../../lib/client'
import { cn } from '../../../lib/cn'
import { Badge } from '../../../components/ui/shadcn/badge'
import SimOnboarding from '../SimOnboarding'
import SimManagerChat from '../SimManagerChat'
import GenericStageRenderer from './GenericStageRenderer'
import SimulationCompleteScreen from './SimulationCompleteScreen'
import { useGenericSimStore } from '../../../app/store/useGenericSimStore'
import { hasWorkbenchExperience } from '../engineering/lib/hasWorkbenchExperience'

// SimManagerChat/genericManagerChatKnowledge.js operate on task.message/
// whatToDo/whatToSubmit/hints/skills/subject/title — this maps the backend's
// SimulationTask field names onto that shape (a naming adapter, no new logic).
function toManagerChatTask(task) {
  return {
    id: task.task_index,
    title: task.title,
    subject: task.objective || task.title,
    message: task.briefing,
    whatToDo: task.what_to_do || [],
    whatToSubmit: task.what_to_submit?.length ? task.what_to_submit : (task.success_criteria || []),
    hints: task.hints || [],
    skills: Object.keys(task.skill_awards || {}),
  }
}

function toManagerChatPersona(manager) {
  return {
    name: manager?.name, role: manager?.role, initials: manager?.avatar,
    photo: manager?.photo_url ? resolveMediaUrl(manager.photo_url) : null,
  }
}

function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function TaskStepper({ tasks, currentTaskIndex, completedTasks, onJump }) {
  return (
    <div className="flex items-center gap-1">
      {tasks.map((t, i) => {
        const done = completedTasks.includes(t.task_index)
        const active = currentTaskIndex === t.task_index
        const unlocked = done || active || completedTasks.includes(t.task_index - 1) || i === 0
        return (
          <button
            key={t.id}
            type="button"
            disabled={!unlocked}
            onClick={() => unlocked && onJump(t.task_index)}
            title={t.title}
            className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors shrink-0',
              done && 'bg-emerald-500 text-white',
              !done && active && 'bg-primary text-white ring-2 ring-primary/25',
              !done && !active && unlocked && 'bg-surface-high text-on-surface-variant hover:bg-surface-container cursor-pointer',
              !unlocked && 'bg-surface-high text-outline/50 cursor-not-allowed'
            )}
          >
            {done ? '✓' : t.task_index}
          </button>
        )
      })}
    </div>
  )
}

/** Generic simulation shell for any CMS-authored (or migrated) simulation —
 * mirrors sales-crm-sim/CrmSimShell.jsx's header/stepper/footer/manager-chat/
 * onboarding-gate structure, but fetches its definition from the API
 * (useSimulationFull) instead of importing a hardcoded config. */
export default function GenericSimShell() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const status = useGenericSimStore(slug, (s) => s.status)
  const enrollmentId = useGenericSimStore(slug, (s) => s.enrollmentId)
  const currentTaskIndex = useGenericSimStore(slug, (s) => s.currentTaskIndex)
  const completedTasks = useGenericSimStore(slug, (s) => s.completedTasks)
  const elapsedSeconds = useGenericSimStore(slug, (s) => s.elapsedSeconds)
  const startSimulation = useGenericSimStore(slug, (s) => s.startSimulation)
  const goToTask = useGenericSimStore(slug, (s) => s.goToTask)
  const completeTaskLocal = useGenericSimStore(slug, (s) => s.completeTask)
  const tick = useGenericSimStore(slug, (s) => s.tick)

  const { data: full, isLoading: fullLoading } = useSimulationFull(slug)
  const { data: enrollment, isError: enrollError } = useEnrollment(slug)
  const { mutate: enroll, isPending: enrolling, isError: enrollFailed, reset: resetEnroll } = useEnroll(slug)
  const { data: onboarding, isLoading: onboardingLoading } = useOnboarding(slug)
  const { mutate: completeTaskRemote } = useCompleteTask(enrollmentId)
  const triedEnroll = useRef(false)
  const [onboardingGate, setOnboardingGate] = useState(null)
  // `enrollmentId` above comes from the persisted (localStorage) zustand
  // store, so it's available instantly on mount even before any network
  // request — including when it's stale (the Enrollment row it points to
  // was removed server-side, e.g. an admin's bulk de-enroll, or a reset
  // dev database). Everything below has to gate on this CONFIRMED id, not
  // the persisted one, or a stale id lets the offer-letter Accept button
  // render even though the backend has no matching enrollment, producing
  // exactly the 400 ("Enroll in the simulation before accepting the
  // offer") this whole gate exists to prevent.
  const [confirmedEnrollmentId, setConfirmedEnrollmentId] = useState(null)

  useEffect(() => {
    if (status !== 'in_progress') return
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [status, tick])

  // Step 1 — make sure the student is actually enrolled, and that the
  // enrollment really exists server-side right now. useOnboarding() is a
  // single fast GET with no enrollment dependency, while confirming/creating
  // an enrollment here can take two sequential round trips (the 404 check,
  // then the enroll POST) — so without this gate, the offer letter's Accept
  // button could render (and be clicked) well before enrollment actually
  // finished.
  useEffect(() => {
    if (enrollment?.id) {
      // Found a real enrollment server-side. If it doesn't match what the
      // persisted store remembers (stale id, or a first-time enroll),
      // (re)start the store's progress from this — the real one.
      if (enrollment.id !== enrollmentId) startSimulation(enrollment.id)
      setConfirmedEnrollmentId(enrollment.id)
      return
    }
    // 404 — no enrollment exists server-side (a new user, or the persisted
    // id was stale and got cleaned up/never existed). Enroll fresh.
    if (enrollError && !triedEnroll.current && !enrolling) {
      triedEnroll.current = true
      enroll(undefined, {
        onSuccess: (res) => {
          startSimulation(res.enrollment.id)
          setConfirmedEnrollmentId(res.enrollment.id)
        },
      })
    }
  }, [enrollment, enrollError, enrolling, enrollmentId, enroll, startSimulation])

  // Step 2 — only once enrollment is confirmed, decide whether the offer
  // letter still needs accepting.
  useEffect(() => {
    if (!confirmedEnrollmentId) return
    if (onboarding && onboardingGate === null) {
      setOnboardingGate(!onboarding.accepted)
    }
  }, [confirmedEnrollmentId, onboarding, onboardingGate])

  if (enrollFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-low">
        <div className="text-center max-w-sm px-6">
          <p className="text-sm text-on-surface-variant mb-4">
            Couldn't enroll you in this simulation — check your connection and try again.
          </p>
          <button
            onClick={() => { triedEnroll.current = false; resetEnroll() }}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (fullLoading || onboardingLoading || !confirmedEnrollmentId || onboardingGate === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-low">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (onboardingGate) {
    return <SimOnboarding sim={slug} onAccept={() => setOnboardingGate(false)} />
  }

  if (!full) {
    return <div className="min-h-screen flex items-center justify-center text-on-surface-variant">Simulation not found.</div>
  }

  const { simulation, tasks } = full
  const task = tasks.find((t) => t.task_index === currentTaskIndex) || tasks[0]
  const progressPct = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  function handleTaskComplete(payload, opts = {}) {
    if (!opts.skipServerAward && enrollmentId) {
      completeTaskRemote({
        taskId: task.task_index, score: payload.score ?? null,
        quizScore: payload.quiz_score ?? null, rubricRating: payload.rubric_rating ?? null,
      })
    }
    completeTaskLocal(task.task_index, tasks.length)
  }

  if (status === 'completed') {
    return <SimulationCompleteScreen simulation={simulation} taskCount={tasks.length} slug={slug} />
  }

  // ── Engineering handoff ──────────────────────────────────────────────────
  // This shell stays the single owner of auto-enrolment and the offer-letter
  // gate for EVERY simulation — both have already run by this point, so a
  // brand-new student who clicked "Start Simulation" arrives here properly
  // enrolled and onboarded exactly as before.
  //
  // What changes is what comes next: engineering simulations hand off to
  // their own runtime (roadmap → task page → sandbox workbench) instead of
  // the stepper-and-inline-sandbox UI below. Without this the old runtime
  // stayed live for a first-timer's entire session — the overview CTA only
  // redirects students who are ALREADY enrolled, so new starters fell
  // straight through into it.
  //
  // Deliberately placed AFTER the completed check so a student who finished
  // under the old flow can still reach their completion screen and
  // certificate rather than being bounced past it.
  //
  // Everything below this line now serves da-job-sim and sales-crm-sim only.
  if (hasWorkbenchExperience(simulation)) {
    return <Navigate to={`/simulations/${slug}/roadmap`} replace />
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-low">
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-container mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/learn/simulations')}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium shrink-0"
          >
            <X className="h-4 w-4" /> Exit
          </button>

          <div className="h-6 w-px bg-border shrink-0" />

          <div className="flex items-center gap-2 min-w-0 shrink-0">
            {simulation.logo_url && (
              <img src={resolveMediaUrl(simulation.logo_url)} alt={simulation.company} className="h-6 w-auto max-w-[90px] object-contain shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface leading-tight truncate">{simulation.company}</p>
              <p className="text-[11px] text-on-surface-variant leading-tight truncate">{simulation.title}</p>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <TaskStepper tasks={tasks} currentTaskIndex={currentTaskIndex} completedTasks={completedTasks} onJump={goToTask} />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Badge variant="secondary" className="hidden sm:inline-flex">{progressPct}% complete</Badge>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant tabular-nums">
              <Clock className="h-3.5 w-3.5" /> {formatElapsed(elapsedSeconds)}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-container mx-auto px-6 py-8">
          {task && (
            <GenericStageRenderer
              simId={slug}
              enrollmentId={enrollmentId}
              task={task}
              taskCount={tasks.length}
              onTaskComplete={handleTaskComplete}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-white py-3">
        <div className="max-w-container mx-auto px-6 flex items-center gap-2.5 text-xs text-on-surface-variant">
          {simulation.manager?.photo_url ? (
            <img src={resolveMediaUrl(simulation.manager.photo_url)} alt={simulation.manager.name} className="h-6 w-6 rounded-full object-cover shrink-0" />
          ) : (
            <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {simulation.manager?.avatar || 'M'}
            </span>
          )}
          <span>
            <span className="font-semibold text-on-surface">{simulation.manager?.name}</span> · {simulation.manager?.role}, {simulation.company}
          </span>
        </div>
      </footer>

      {task && (
        <SimManagerChat
          manager={toManagerChatPersona(simulation.manager)}
          company={simulation.company}
          task={toManagerChatTask(task)}
          taskKey={task.task_index}
        />
      )}
    </div>
  )
}
