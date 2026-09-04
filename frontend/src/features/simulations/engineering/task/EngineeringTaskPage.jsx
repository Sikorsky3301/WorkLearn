import { useMemo, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Sparkles, Briefcase } from 'lucide-react'
import { useSimulationFull, useEnrollment } from '../../../../hooks'
import { buildRoadmap, TASK_STATUS } from '../lib/roadmapModel'
import { useBriefingSeen } from '../briefing/useBriefingSeen'
import ManagerBriefingScene from '../briefing/ManagerBriefingScene'
import {
  useSandboxLauncher, useLiveTaskResult, SandboxButton, SandboxOpeningOverlay,
} from './SandboxLaunch'
import { useScrolledPast, useNavbarHeight } from '../../generic/StickyOverviewBar'
import TaskMentorPanel from './TaskMentorPanel'
import ManagerPanel, { useManagerUnreadCount } from './ManagerPanel'
import TaskExplainer, { TaskReference } from './TaskExplainer'
import TaskMasthead from './TaskMasthead'
import MiniAssessmentCard from './MiniAssessmentCard'
import { ASSESSMENT_PASS_MARK, hasPassedAssessment, weekCompletion } from '../lib/assessment'
import WeekCompleteScene from '../assessment/WeekCompleteScene'
import FinalAssessmentPage from '../assessment/FinalAssessmentPage'
import ReferenceDataPanel from '../../generic/ReferenceDataPanel'

// One task, written for someone who has never done this before AND for someone
// who has done it for years.
//
// The page renders `config.explainer` (see TaskExplainer.jsx and the authoring
// contract in backend app/cms_templates/engineering/__init__.py), which carries
// both reading levels. `what_to_do` is still the fallback for any task that
// predates the explainer, so an older simulation doesn't render an empty page.
//
// ── THE LAYOUT, AND WHY IT IS ONE COLUMN ───────────────────────────────────
//
// This was a two-column workspace: the prose capped at a readable measure on
// the left, and the reference material — concepts, the grading contract, the
// mistakes — pinned in the column that cap freed up. It was a reasonable
// answer to "half a desktop viewport is doing nothing", and it cost more than
// it returned: two scroll regions, a sticky sub-column, and a layout that
// silently became something else whenever the manager or mentor rail opened.
//
// It is now one column, centred, capped. The reference sits under the steps as
// the third and last section, closed. Empty margin either side of a task brief
// is not a layout failure — it is what makes the brief look like the only
// thing being asked of you, which on this page is true.
//
// Deliberately NOT here:
//   • Hints and the model solution — they belong in the sandbox, beside the
//     editor where you're actually stuck.
//   • "What you'll hand in" — the sandbox submits the file for you, so a
//     section explaining the upload described something that doesn't happen.
//   • "How your work is marked" — the contract block inside the reference says
//     what the checks look for, in the place where you're deciding what to
//     name things. A separate marking section repeated it at a distance.
//   • The manager's briefing and the replay button — the briefing scene plays
//     it, and the manager panel keeps every brief. Three copies of the same
//     paragraph on one page was two too many.

// What the student is about to write, in words rather than a config key.
const LANGUAGE_META = {
  html: 'HTML & CSS',
  javascript: 'JavaScript',
  jsx: 'React · JSX',
  python: 'Python',
  text: 'Written answer',
}

/** Manager / mentor. Icon-first and short-labelled: these open a panel, they
 *  are not the action of the page, and the old full-sentence label ("Priya,
 *  your manager") gave one of them more visual weight than the button that
 *  starts the work. The full name still rides along as the tooltip. */
function RailButton({ icon: Icon, label, title, badge = 0, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={title || label}
      className={`relative inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[0.8rem] font-bold transition-colors ${
        active
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-white text-on-surface-variant hover:border-outline-variant hover:text-on-surface'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
      {badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[0.6rem] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

/** Fallback for a task with no `explainer` — older simulations, or one an
 *  admin built in the CMS without filling the richer content in. Same step
 *  cards as TaskExplainer, so a thin task still looks like it belongs to this
 *  page rather than to an older one. */
function PlainSteps({ steps }) {
  if (!steps?.length) return null
  return (
    <section>
      <h2 className="mb-5 font-display text-[1.05rem] font-extrabold text-on-surface">
        What to build · {steps.length} steps
      </h2>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3.5 rounded-xl border border-border bg-white p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-[0.78rem] font-extrabold tabular-nums text-primary">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="pt-1.5 text-[0.95rem] leading-relaxed text-on-surface">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function EngineeringTaskPage() {
  const { slug, taskIndex } = useParams()
  const navigate = useNavigate()
  const index = Number(taskIndex)

  const { data, isLoading } = useSimulationFull(slug)
  const {
    data: enrollment, isLoading: loadingEnrollment, isFetching: fetchingEnrollment,
  } = useEnrollment(slug)

  const simulation = data?.simulation
  const tasks = useMemo(() => data?.tasks ?? [], [data])

  const roadmap = useMemo(() => buildRoadmap({
    tasks,
    sectionLabels: simulation?.section_labels || {},
    completions: enrollment?.task_completions || [],
  }), [tasks, simulation, enrollment])

  const task = roadmap.sections.flatMap((s) => s.tasks).find((t) => t.task_index === index)
  const [briefingSeen, markBriefingSeen] = useBriefingSeen(slug, index)

  // One rail, two occupants: 'mentor' | 'manager' | null. They share the column
  // rather than stacking, so the task never loses more than a quarter of the
  // width and the buttons behave like tabs. The mentor stays mounted once used
  // so switching away and back doesn't discard the conversation.
  const [rail, setRail] = useState(null)
  const [mentorEverOpened, setMentorEverOpened] = useState(false)
  // The mini assessment gates the next task, so "Next" has to be able to open
  // it — which means the page owns whether it's open, not the card.
  const [assessmentOpen, setAssessmentOpen] = useState(false)
  const [assessmentScore, setAssessmentScore] = useState(null)
  const [weekSceneOpen, setWeekSceneOpen] = useState(false)

  // Launching the sandbox is shared between the card at the top and the sticky
  // bar that replaces it on scroll, so both show the same buffering state —
  // two independent launchers would let one spin while the other looked idle.
  const launcher = useSandboxLauncher(slug, index)
  // Callback ref: the header renders past this component's early returns, so
  // an effect keyed on a ref object would run once against null and never
  // re-run.
  const [headerRef, setHeaderRef] = useState(null)
  const sandboxOffScreen = useScrolledPast(headerRef)
  const navbarHeight = useNavbarHeight()
  // Kept live over BroadcastChannel, so a grade earned in the sandbox tab
  // reaches this page's header without a reload.
  const liveResult = useLiveTaskResult(slug, index, task?.score ?? null, task?.quizScore ?? null)
  const toggleRail = (which) => {
    if (which === 'mentor') setMentorEverOpened(true)
    setRail((cur) => (cur === which ? null : which))
  }
  const managerUnread = useManagerUnreadCount(slug)

  if (isLoading || loadingEnrollment || fetchingEnrollment) {
    return <div className="mx-auto max-w-3xl px-6 py-20 text-sm text-on-surface-variant">Loading task…</div>
  }
  if (!enrollment) return <Navigate to={`/simulations/${slug}`} replace />
  if (!task) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm text-on-surface-variant">That task doesn&apos;t exist in this simulation.</p>
        <button onClick={() => navigate(`/simulations/${slug}/roadmap`)} className="mt-3 text-sm font-semibold text-primary">
          Back to the roadmap
        </button>
      </div>
    )
  }
  if (task.status === TASK_STATUS.LOCKED) {
    return <Navigate to={`/simulations/${slug}/roadmap`} replace />
  }

  // The closing exam gets its own layout — fifty questions in a two-column
  // workspace beside a mentor rail would be unreadable.
  if (task.config?.is_final_assessment) {
    return (
      <FinalAssessmentPage
        slug={slug}
        task={task}
        simulation={simulation}
        enrollmentId={enrollment.id}
      />
    )
  }

  const section = roadmap.sections.find((s) => s.tasks.some((t) => t.task_index === index))
  const manager = simulation.manager || {}
  const nextTask = tasks.find((t) => t.task_index === index + 1)
  const showBriefing = !briefingSeen && Boolean(task.briefing)
  const done = task.status === TASK_STATUS.COMPLETE
  const explainer = task.config?.explainer
  const stepCount = explainer?.steps?.length || task.what_to_do?.length || 0
  // A pass recorded on a previous visit still counts, so the gate doesn't
  // re-run for work that has already been checked. A task with no
  // assessment content at all (task.assessment_summary null — e.g.
  // da-job-sim, which never authored per-task mini assessments) has
  // nothing to pass, so it counts as already passed rather than
  // permanently blocking "Next" — see hasPassedAssessment's hasAssessment
  // param.
  const hasAssessment = Boolean(task.assessment_summary)
  const assessmentPassed = hasPassedAssessment(assessmentScore, task.quizScore, hasAssessment)
  const weekDone = weekCompletion(roadmap, index, assessmentScore)

  return (
    // A faint tint rather than flat white. Every card on the page is white, and
    // on a white ground the assignment card and the step rows had no edges —
    // the borders were doing all the work alone.
    <div className="min-h-screen bg-surface-low/40">
      {/* Covers the page while the sandbox opens in another tab. It also
          swallows clicks for the duration, which is the actual fix for
          people clicking twice and getting two tabs. */}
      <SandboxOpeningOverlay open={launcher.opening} taskTitle={task.title} />
      {/* Takes over from the card once it has scrolled away, so the editor is
          never more than one click from wherever you are in the brief. */}
      {task.type === 'code_sandbox' && sandboxOffScreen && !showBriefing && (
        <div
          className="fixed inset-x-0 z-40 border-b border-border bg-white/95 shadow-[0_1px_12px_rgba(16,24,40,0.08)] backdrop-blur"
          style={{ top: navbarHeight }}
        >
          <div className="mx-auto flex max-w-4xl items-center gap-4 px-5 py-2.5 sm:px-6">
            <p className="min-w-0 flex-1 truncate text-sm">
              <span className="font-bold text-on-surface">Task {task.task_index}</span>
              <span className="ml-2 text-on-surface-variant">{task.title}</span>
            </p>
            <SandboxButton
              onClick={launcher.open}
              opening={launcher.opening}
              launched={launcher.launched}
              graded={done}
              compact
              className="bg-primary text-white hover:bg-primary-dark"
            />
          </div>
        </div>
      )}

      {showBriefing && (
        <ManagerBriefingScene
          manager={manager}
          company={simulation.company}
          task={task}
          onDismiss={markBriefingSeen}
        />
      )}

      {/* Opening the manager or the mentor splits the page and docks that panel
          on the right, so neither one means leaving the task — the rail is its
          own scroll container pinned to the viewport, so it stays put while the
          task scrolls. */}
      <div className={`grid ${rail ? 'lg:grid-cols-[minmax(0,1fr)_25rem]' : 'grid-cols-1'}`}>
        <div className="min-w-0 px-5 py-8 sm:px-6">
          <div className="mx-auto w-full max-w-4xl space-y-8">

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => navigate(`/simulations/${slug}/roadmap`)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" /> Back to roadmap
              </button>

              <div className="ml-auto flex items-center gap-2">
                <RailButton
                  icon={Briefcase}
                  label="Manager"
                  title={manager.name ? `${manager.name}, your manager` : 'Your manager'}
                  badge={managerUnread}
                  active={rail === 'manager'}
                  onClick={() => toggleRail('manager')}
                />
                <RailButton
                  icon={Sparkles}
                  label="Mentor"
                  title="Ask your mentor"
                  active={rail === 'mentor'}
                  onClick={() => toggleRail('mentor')}
                />
              </div>
            </div>

            {/* ── The assignment card ── */}
            <div ref={setHeaderRef}>
              <TaskMasthead
                task={task}
                section={section}
                language={LANGUAGE_META[task.config?.language]}
                stepCount={stepCount}
                liveResult={liveResult}
                done={done}
              >
                {task.type === 'code_sandbox' && (
                  <SandboxButton
                    onClick={launcher.open}
                    opening={launcher.opening}
                    launched={launcher.launched}
                    graded={liveResult != null}
                  />
                )}
              </TaskMasthead>
            </div>

            {/* ── The task itself: brief, steps, then what you consult ── */}
            <div className="space-y-10">
              {explainer ? <TaskExplainer explainer={explainer} /> : <PlainSteps steps={task.what_to_do} />}
              {explainer && <TaskReference explainer={explainer} />}
            </div>

            <ReferenceDataPanel referenceData={task.reference_data} />

            {/* ── The check that follows the work ── */}
            {/* Only for a task that actually has one — MiniAssessmentCard's
                own GET 404s ("This task doesn't have an assessment") for a
                task like da-job-sim's that never authored one, and showing
                a "Mini assessment" button that always fails to open was a
                bug, not a legitimate empty state. */}
            {done && hasAssessment && (
              <MiniAssessmentCard
                enrollmentId={enrollment.id}
                taskIndex={task.task_index}
                quizScore={task.quizScore}
                passMark={ASSESSMENT_PASS_MARK}
                open={assessmentOpen}
                onOpen={setAssessmentOpen}
                onScored={(score) => {
                  setAssessmentScore(score)
                  // Fires here too, not only in the sandbox: the assessment can
                  // legitimately be taken from either surface, and a week should
                  // be celebrated wherever it was actually finished.
                  if (weekCompletion(roadmap, index, score)) setWeekSceneOpen(true)
                }}
              />
            )}

            {/* ── Move on ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <button
                onClick={() => navigate(`/simulations/${slug}/roadmap`)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" /> All tasks
              </button>
              {nextTask && done && (
                <button
                  onClick={() => {
                    // Same rule as the sandbox: the assessment is the gate, so
                    // Next opens it rather than skipping past it.
                    if (assessmentPassed) navigate(`/simulations/${slug}/task/${nextTask.task_index}`)
                    else setAssessmentOpen(true)
                  }}
                  className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
                >
                  {assessmentPassed ? `Next: ${nextTask.title}` : 'Next — take the quiz'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── The rail: manager or mentor, never both ── */}
        {(rail || mentorEverOpened) && (
          <aside className={`lg:sticky lg:top-0 lg:h-screen ${rail ? '' : 'hidden'}`}>
            {rail === 'manager' && (
              <ManagerPanel
                slug={slug}
                manager={manager}
                company={simulation.company}
                roadmap={roadmap}
                onClose={() => setRail(null)}
              />
            )}
            <div className={`h-full ${rail === 'mentor' ? '' : 'hidden'}`}>
              {mentorEverOpened && (
                <TaskMentorPanel
                  slug={slug}
                  taskIndex={index}
                  taskTitle={task.title}
                  onClose={() => setRail(null)}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {weekSceneOpen && weekDone && (
        <WeekCompleteScene
          weekLabel={weekDone.weekLabel}
          weekNumber={weekDone.weekNumber}
          tasksCompleted={weekDone.tasksCompleted}
          xpEarned={weekDone.xpEarned}
          avgScore={weekDone.avgScore}
          nextSectionLabel={weekDone.nextSection?.label}
          onContinue={() => {
            setWeekSceneOpen(false)
            if (nextTask) navigate(`/simulations/${slug}/task/${nextTask.task_index}`)
            else navigate(`/simulations/${slug}/roadmap`)
          }}
          onRoadmap={() => { setWeekSceneOpen(false); navigate(`/simulations/${slug}/roadmap`) }}
        />
      )}
    </div>
  )
}
