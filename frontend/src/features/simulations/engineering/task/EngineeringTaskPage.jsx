import { useMemo, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Sparkles, Briefcase, CircleCheck,
} from 'lucide-react'
import { useSimulationFull, useEnrollment } from '../../../../hooks'
import { buildRoadmap, TASK_STATUS } from '../lib/roadmapModel'
import { useBriefingSeen } from '../briefing/useBriefingSeen'
import ManagerBriefingScene from '../briefing/ManagerBriefingScene'
import { useSandboxLauncher, useLiveTaskResult, SandboxButton } from './SandboxLaunch'
import { useScrolledPast, useNavbarHeight } from '../../generic/StickyOverviewBar'
import TaskMentorPanel from './TaskMentorPanel'
import ManagerPanel, { useManagerUnreadCount } from './ManagerPanel'
import TaskExplainer from './TaskExplainer'
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
// Deliberately NOT here:
//   • Hints and the model solution — they belong in the sandbox, beside the
//     editor where you're actually stuck.
//   • "What you'll hand in" — the sandbox submits the file for you, so a
//     section explaining the upload described something that doesn't happen.
//   • "How your work is marked" — the contract block inside the explainer says
//     what the checks look for, in the place where you're deciding what to
//     name things. A separate marking section repeated it at a distance.
//   • The manager's briefing and the replay button — the briefing scene plays
//     it, and the manager panel keeps every brief. Three copies of the same
//     paragraph on one page was two too many.

/** A dot separator for the header's facts line. */
function Dot() {
  return <span aria-hidden="true" className="text-white/20">·</span>
}

// What the student is about to write, in words rather than a config key.
const LANGUAGE_META = {
  html: 'HTML & CSS',
  javascript: 'JavaScript',
  jsx: 'React · JSX',
  python: 'Python',
  text: 'Written answer',
}

function RailButton({ icon: Icon, label, shortLabel, badge = 0, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
        active
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
      {badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[0.6rem] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

/** Fallback for a task with no `explainer` — older simulations, or one an
 *  admin built in the CMS without filling the richer content in. */
function PlainSteps({ steps }) {
  if (!steps?.length) return null
  return (
    <section className="border border-border bg-white">
      <header className="border-b border-emerald-200 bg-emerald-50 px-5 py-3.5 sm:px-6">
        <h2 className="font-display text-base font-extrabold text-emerald-900">What to build</h2>
      </header>
      <ol className="space-y-4 p-5 sm:p-6">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {i + 1}
            </span>
            <span className="pt-0.5 text-[0.95rem] leading-relaxed text-on-surface">{step}</span>
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
  // re-run for work that has already been checked.
  const assessmentPassed = hasPassedAssessment(assessmentScore, task.quizScore)
  const weekDone = weekCompletion(roadmap, index, assessmentScore)

  return (
    <div className="min-h-screen bg-surface-low/50">
      {/* Takes over from the card once it has scrolled away, so the editor is
          never more than one click from wherever you are in the brief. */}
      {task.type === 'code_sandbox' && sandboxOffScreen && !showBriefing && (
        <div
          className="fixed inset-x-0 z-40 border-b border-white/10 bg-[#0f1720] text-white shadow-lg"
          style={{ top: navbarHeight }}
        >
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-2.5">
            <p className="min-w-0 flex-1 truncate text-sm">
              <span className="font-bold">Task {task.task_index}</span>
              <span className="ml-2 text-white/50">{task.title}</span>
            </p>
            <SandboxButton
              onClick={launcher.open}
              opening={launcher.opening}
              launched={launcher.launched}
              graded={done}
              compact
              className="bg-emerald-500 text-[#0f1720] hover:bg-emerald-400"
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

      {/* Full width for the task by default. Opening the manager or the mentor
          splits the page and docks that panel on the right, so neither one
          means leaving the task — the rail is its own scroll container pinned
          to the viewport, so it stays put while the task scrolls. */}
      <div className={`grid ${rail ? 'lg:grid-cols-[minmax(0,1fr)_25rem]' : 'grid-cols-1'}`}>
        <div className="min-w-0 space-y-5 px-6 py-8 xl:px-10">

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
                label={manager.name ? `${manager.name.split(' ')[0]}, your manager` : 'Your manager'}
                shortLabel="Manager"
                badge={managerUnread}
                active={rail === 'manager'}
                onClick={() => toggleRail('manager')}
              />
              <RailButton
                icon={Sparkles}
                label="Ask your mentor"
                shortLabel="Mentor"
                active={rail === 'mentor'}
                onClick={() => toggleRail('mentor')}
              />
            </div>
          </div>

          {/* ── Header ──
              Rewritten to stop reading as a generated card: the old version
              stacked a breadcrumb, a big number tile, a title, a subtitle, a
              row of five chips and a progress bar — every fact given equal
              weight and its own decoration, which is exactly what makes a
              layout feel machine-assembled.

              Now there is a clear hierarchy. One line of context, the title,
              the objective, and a single quiet facts line. The number lives
              beside the section label as text, not in a tile. The progress bar
              is a hairline under the whole header rather than a fenced-off
              panel. Ground is a flat near-black — no indigo, since the page's
              own accent is a blue-violet and would vanish into it. */}
          <header ref={setHeaderRef} className="overflow-hidden rounded-2xl bg-[#0f1720] text-white ring-1 ring-white/[0.07]">
            <div className="p-6 sm:p-8">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white/35">
                <span>{section?.label ?? 'Task'}</span>
                <span aria-hidden="true" className="text-white/20">/</span>
                <span>Task {task.task_index}</span>
                {done && (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <CircleCheck className="h-3.5 w-3.5" /> Completed
                  </span>
                )}
              </p>

              {/* Title and the launch button on one row: the button belongs
                  with the thing it acts on, and giving it its own panel put a
                  screen of chrome between the header and the actual brief. */}
              <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                <h1 className="min-w-0 font-display text-[1.75rem] font-extrabold leading-[1.15] tracking-tight sm:text-[2.125rem]">
                  {task.title}
                </h1>

                {task.type === 'code_sandbox' && (
                  <SandboxButton
                    onClick={launcher.open}
                    opening={launcher.opening}
                    launched={launcher.launched}
                    graded={liveResult != null}
                    className="mt-1 bg-emerald-500 text-[#0f1720] hover:bg-emerald-400"
                  />
                )}
              </div>

              {task.objective && (
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/65">
                  {task.objective}
                </p>
              )}

              {/* One line, separated by dots rather than five bordered chips.
                  These are facts you glance at, not controls. `liveResult`
                  rather than `task.score` so a grade landing in the sandbox tab
                  shows up here without a reload. */}
              <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-white/45">
                {LANGUAGE_META[task.config?.language] && (
                  <span className="font-semibold text-white/70">{LANGUAGE_META[task.config.language]}</span>
                )}
                {task.xp_award > 0 && <><Dot /><span>{task.xp_award} XP</span></>}
                {stepCount > 0 && <><Dot /><span>{stepCount} steps</span></>}
                {liveResult?.score != null && (
                  <><Dot /><span className="text-emerald-400">Scored {liveResult.score}%</span></>
                )}
                {liveResult?.quizScore != null && (
                  <><Dot /><span className="text-emerald-400">Quiz {liveResult.quizScore}%</span></>
                )}
                {launcher.launched && !launcher.opening && liveResult == null && (
                  <><Dot /><span className="text-white/60">Open in another tab</span></>
                )}
              </p>
            </div>

            {/* Week progress as a hairline across the full width — present, but
                not competing with the title for attention. */}
            {section && section.tasks.length > 1 && (
              <div className="flex gap-px" title={`${section.completedCount} of ${section.total} done in ${section.label}`}>
                {section.tasks.map((t) => (
                  <span
                    key={t.task_index}
                    className={`h-1 flex-1 ${
                      t.task_index === task.task_index
                        ? 'bg-amber-400'
                        : t.status === TASK_STATUS.COMPLETE
                          ? 'bg-emerald-400/60'
                          : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}
          </header>

          {/* ── The task, both reading levels ── */}
          {explainer ? <TaskExplainer explainer={explainer} /> : <PlainSteps steps={task.what_to_do} />}

          <ReferenceDataPanel referenceData={task.reference_data} />

          {/* ── The check that follows the work ── */}
          {done && (
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
          <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-white p-5">
            <button
              onClick={() => navigate(`/simulations/${slug}/roadmap`)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
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
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
              >
                {assessmentPassed ? `Next: ${nextTask.title}` : 'Next — take the quiz'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
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
