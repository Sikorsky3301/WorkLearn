import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  GraduationCap, Clock, ListChecks, Target, Trophy, ShieldCheck, Maximize2,
  AlertTriangle, Loader2, ArrowRight, Lock, Eye, MonitorX,
} from 'lucide-react'
import { adoptHandoffToken } from '../../../../lib/tabHandoff'
import { useAssessment, useEnrollment, useSimulationFull } from '../../../../hooks'
import AssessmentRunner from './AssessmentRunner'
import { useProctoredSession, formatClock, PROCTOR_STATE } from './useProctoredSession'

// The closing exam, in its own tab, under exam conditions.
//
// ── WHY A SEPARATE TAB AND A SEPARATE ROUTE ────────────────────────────────
//
// It used to render inside the task page: the app navbar above it, the roadmap
// one click away, no clock and nothing stopping a student reading the answer in
// another tab. That is fine for the five-question check after a task, which is
// a learning device. It is not fine for the paper a certificate is issued
// against.
//
// This route sits outside MainLayout, owns the whole viewport, and runs in
// three phases:
//
//   BRIEF     what it is, how long, how many questions, what it is worth, and
//             the rules — stated before the clock starts, never during.
//   RUNNING   fullscreen, a countdown, one question set at a time.
//   PAUSED    the moment focus or fullscreen is lost. Questions covered, clock
//             stopped, switch counted.
//
// ── HONESTY ABOUT WHAT PROCTORING MEANS HERE ──────────────────────────────
//
// No browser can stop someone reading a second device, and this does not claim
// to. What it does is make leaving deliberate and visible: the clock stops so
// leaving buys no thinking time, an overlay covers the paper, and every switch
// is counted and shown back. The rules panel says that in those words rather
// than implying surveillance the product does not have.

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/45">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-1.5 font-display text-lg font-extrabold text-white">{value}</p>
      {hint && <p className="mt-0.5 text-[0.7rem] text-white/40">{hint}</p>}
    </div>
  )
}

function Rule({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-3 text-[0.85rem] leading-relaxed text-white/70">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
      <span>{children}</span>
    </li>
  )
}

/** Phase 1 — everything the student needs to decide whether to start now. */
function BriefScreen({ sim, task, data, onStart, starting }) {
  const questionCount = data?.questions?.length ?? task?.config?.question_count ?? 0
  const passMark = data?.pass_mark || task?.config?.pass_mark || 0
  const minutes = data?.duration_minutes || 0
  const xp = data?.xp_award ?? task?.xp_award ?? 0
  const previous = data?.previous_score

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
        <p className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-emerald-300">
          <GraduationCap className="h-4 w-4" /> Final assessment
        </p>
        <h1 className="mt-3 font-display text-[1.9rem] font-extrabold leading-tight tracking-tight text-white sm:text-[2.3rem]">
          {data?.title || task?.title || 'Final Assessment'}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {sim?.title}{sim?.company ? ` · ${sim.company}` : ''}
        </p>

        {(data?.description || task?.objective) && (
          <p className="mt-5 max-w-2xl text-[0.98rem] leading-relaxed text-white/70">
            {data?.description || task?.objective}
          </p>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={ListChecks} label="Questions" value={questionCount} />
          <Stat
            icon={Clock} label="Time limit"
            value={minutes ? `${minutes} min` : 'Untimed'}
            hint={minutes ? 'Auto-submits at zero' : undefined}
          />
          <Stat icon={Target} label="Pass mark" value={passMark ? `${passMark}%` : '—'} />
          <Stat icon={Trophy} label="Worth" value={xp ? `${xp} XP` : '—'} />
        </div>

        {previous != null && (
          <p className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-[0.85rem] text-amber-100">
            You have already sat this and scored <strong>{previous}%</strong>. Starting again replaces
            that score.
          </p>
        )}

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6">
          <p className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-white/50">
            <ShieldCheck className="h-3.5 w-3.5" /> Exam conditions
          </p>
          <ul className="mt-4 space-y-3">
            <Rule icon={Maximize2}>
              Starting puts this tab into <strong className="text-white">fullscreen</strong>. Stay there
              until you submit.
            </Rule>
            <Rule icon={MonitorX}>
              Leaving fullscreen, switching tab, or moving to another window{' '}
              <strong className="text-white">pauses the assessment</strong> and covers the questions.
              You resume with a click.
            </Rule>
            <Rule icon={Eye}>
              Every switch is <strong className="text-white">counted and submitted with your
              attempt</strong>. The clock stops while you are away, so leaving buys no extra time —
              it is recorded, not punished automatically.
            </Rule>
            <Rule icon={Lock}>
              Answers are graded on the server. Nothing in this page contains the answer key.
            </Rule>
            {minutes > 0 && (
              <Rule icon={Clock}>
                You have <strong className="text-white">{minutes} minutes</strong> from the moment you
                press start. It submits itself when the clock reaches zero.
              </Rule>
            )}
          </ul>
        </div>

        <button
          onClick={onStart}
          disabled={starting || !questionCount}
          className="group mt-8 inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-6 py-4 text-[0.95rem] font-extrabold text-[#04140c] transition-colors hover:bg-emerald-400 disabled:opacity-50 sm:w-auto"
        >
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Maximize2 className="h-4 w-4" />}
          Start the assessment
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <p className="mt-3 text-[0.75rem] text-white/35">
          The clock starts when you press this. Close the tab to leave without attempting.
        </p>
      </div>
    </div>
  )
}

/** Phase 3 — shown over the paper the instant focus is lost. */
function PauseOverlay({ session, onResume }) {
  const last = session.violations[session.violations.length - 1]
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#04070d]/95 px-6 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-amber-400/25 bg-[#0d1117] p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/15">
          <AlertTriangle className="h-6 w-6 text-amber-300" />
        </span>
        <h2 className="mt-5 font-display text-xl font-extrabold text-white">Assessment paused</h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-white/60">
          {last ? `You ${last.reason}.` : 'You left the assessment.'} The clock is stopped and your
          answers are safe.
        </p>

        <div className="mt-5 flex items-center justify-center gap-6 rounded-xl border border-white/10 bg-white/[0.03] py-3">
          <span>
            <span className="block text-[0.6rem] font-bold uppercase tracking-wider text-white/40">Time left</span>
            <span className="block font-display text-lg font-extrabold tabular-nums text-white">
              {session.remaining == null ? 'Untimed' : formatClock(session.remaining)}
            </span>
          </span>
          <span className="h-8 w-px bg-white/10" />
          <span>
            <span className="block text-[0.6rem] font-bold uppercase tracking-wider text-white/40">Switches</span>
            <span className="block font-display text-lg font-extrabold tabular-nums text-amber-300">
              {session.switchCount}
            </span>
          </span>
        </div>

        <button
          onClick={onResume}
          className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-extrabold text-[#04140c] transition-colors hover:bg-emerald-400"
        >
          <Maximize2 className="h-4 w-4" /> Return to fullscreen and resume
        </button>
        <p className="mt-3 text-[0.72rem] text-white/35">
          This switch has been recorded and will be submitted with your attempt.
        </p>
      </div>
    </div>
  )
}

/** The bar above the paper while it is running. */
function ExamBar({ session, title, answered, total }) {
  const low = session.remaining != null && session.remaining <= 120
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0d1117] px-5">
      <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-emerald-300">
        <GraduationCap className="h-4 w-4" /> <span className="hidden sm:inline">Final assessment</span>
      </p>
      <span className="hidden min-w-0 flex-1 truncate text-sm font-semibold text-white/60 md:block">
        {title}
      </span>

      <span className="ml-auto flex items-center gap-4">
        <span className="text-[0.78rem] font-semibold tabular-nums text-white/50">
          {answered}/{total} answered
        </span>
        {session.switchCount > 0 && (
          <span
            title={`${session.switchCount} switch${session.switchCount === 1 ? '' : 'es'} recorded`}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-[0.7rem] font-bold text-amber-300"
          >
            <AlertTriangle className="h-3 w-3" /> {session.switchCount}
          </span>
        )}
        {session.remaining != null && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-sm font-extrabold tabular-nums ${
              low ? 'bg-rose-500/20 text-rose-300' : 'bg-white/[0.06] text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> {formatClock(session.remaining)}
          </span>
        )}
      </span>
    </header>
  )
}

const PER_PAGE = 10

export default function ProctoredAssessmentPage() {
  // MUST run during render, before the first authenticated fetch — see
  // lib/tabHandoff.js.
  useState(() => adoptHandoffToken())

  const { slug, taskIndex } = useParams()
  const index = Number(taskIndex)

  const { data: full, isLoading: loadingSim } = useSimulationFull(slug)
  const { data: enrollment, isLoading: loadingEnrollment } = useEnrollment(slug)
  const enrollmentId = enrollment?.id

  const { data, isLoading: loadingAssessment, isError, error } = useAssessment(enrollmentId, index)

  const sim = full?.simulation
  const task = useMemo(
    () => (full?.tasks ?? []).find((t) => t.task_index === index),
    [full, index]
  )

  const [answeredCount, setAnsweredCount] = useState(0)
  const [autoSubmit, setAutoSubmit] = useState(0)

  // The clock reaching zero submits whatever is answered. Bumping a counter
  // rather than calling into the runner keeps the runner in charge of its own
  // submit — two things calling it would double-post.
  const handleExpire = useCallback(() => setAutoSubmit((n) => n + 1), [])

  const session = useProctoredSession({
    durationMinutes: data?.duration_minutes ?? 0,
    onExpire: handleExpire,
  })

  useEffect(() => {
    document.title = task?.title ? `${task.title} · Assessment` : 'Final assessment'
  }, [task?.title])

  const loading = loadingSim || loadingEnrollment || (enrollmentId && loadingAssessment)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#04070d]">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    )
  }

  if (!enrollment || isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#04070d] px-6 text-center">
        <AlertTriangle className="h-7 w-7 text-amber-300" />
        <p className="max-w-md text-sm text-white/60">
          {!enrollment
            ? 'You are not enrolled in this simulation, so there is no assessment to sit.'
            : (error?.message || 'This assessment could not be loaded.')}
        </p>
        <button
          onClick={() => window.close()}
          className="mt-2 cursor-pointer rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 hover:text-white"
        >
          Close this tab
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#04070d] text-white">
      {session.state === PROCTOR_STATE.IDLE ? (
        <BriefScreen
          sim={sim}
          task={task}
          data={data}
          starting={false}
          onStart={session.start}
        />
      ) : (
        <div className="flex min-h-screen flex-col">
          <ExamBar
            session={session}
            title={data?.title || task?.title}
            answered={answeredCount}
            total={data?.questions?.length ?? 0}
          />

          {/* The paper. Blurred out while paused so the overlay is not merely
              a translucent sheet somebody can read through. */}
          <main className={`flex-1 ${session.paused ? 'pointer-events-none blur-md select-none' : ''}`}>
            <div className="mx-auto w-full max-w-3xl px-6 py-8">
              <AssessmentRunner
                enrollmentId={enrollmentId}
                taskIndex={index}
                perPage={PER_PAGE}
                theme="dark"
                autoStart
                forceSubmitSignal={autoSubmit}
                proctorReport={{
                  switch_count: session.switchCount,
                  violations: session.violations,
                  seconds_taken: session.elapsed,
                }}
                onAnsweredChange={setAnsweredCount}
                onGraded={session.finish}
              />
            </div>
          </main>
        </div>
      )}

      {session.paused && <PauseOverlay session={session} onResume={session.resume} />}
    </div>
  )
}
