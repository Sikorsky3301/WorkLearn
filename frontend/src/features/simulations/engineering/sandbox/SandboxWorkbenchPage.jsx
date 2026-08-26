import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import {
  RotateCcw, Play, Send, ArrowRight, Loader2, ExternalLink, AlertTriangle, Sparkles, Wand2,
  ClipboardCheck, Lightbulb, BookOpen, Settings,
} from 'lucide-react'
import { useSimulationFull, useEnrollment, useSubmitSandbox } from '../../../../hooks'
import { adoptHandoffToken } from '../../../../lib/tabHandoff'
import { postSimEvent, SIM_EVENT } from '../../../../lib/simChannel'
import { defineWorkLearnThemes } from '../../shared/monacoThemes'
import { describeSubmitError } from './submitError'
import SandboxAiPanel from './SandboxAiPanel'
import PostTaskAssessment from './PostTaskAssessment'
import TaskCompleteDialog from './TaskCompleteDialog'
import HelpDrawer from './HelpDrawer'
import SplitHandle, { usePersistentSize, useElementSize, maxForPane } from './SplitHandle'
import EditorSettingsPanel from './EditorSettingsPanel'
import { useEditorSettings, monacoOptions } from './useEditorSettings'
import { useSandboxAutocomplete } from './useSandboxAutocomplete'
import { buildRoadmap } from '../lib/roadmapModel'
import { ASSESSMENT_PASS_MARK, hasPassedAssessment, weekCompletion } from '../lib/assessment'
import WeekCompleteScene from '../assessment/WeekCompleteScene'
import WorkbenchTopBar from './WorkbenchTopBar'
import ExerciseRail from './ExerciseRail'
import ConsolePane from './ConsolePane'

// The full-screen coding workbench, opened in its own browser tab.
//
// Layout follows the reference: brief on the left, editor top-right, console
// bottom-right, segmented progress along the bottom. It renders OUTSIDE
// MainLayout (see AppRouter) so it owns the entire viewport — the app navbar
// would just eat vertical space the editor wants.
//
// Grading is unchanged from the inline playground: the same
// POST /api/sandbox/{enrollmentId}/tasks/{taskId}/submit, with `dry_run` true
// for Run and false for Submit. The server runs the code in Docker and awards
// server-side, which is why nothing here calls the generic complete-task
// endpoint — doing both would award the XP twice.

// The editor never shrinks below these, however far a divider is dragged —
// past roughly this width Monaco's gutter and scrollbar leave no usable column
// for code, and past this height there aren't enough visible lines to work in.
//
// The width is only a FLOOR. The real minimum is measured from the toolbar at
// runtime (see `minEditorWidth`): 420px is plenty for code and nowhere near
// enough for Run code, Submit answer, Hint, Solution, Ask AI and the rest, so
// dragging the brief to this limit sliced the toolbar in half and left the
// only two buttons that matter off the edge.
const MIN_EDITOR_WIDTH_FLOOR = 420
const MIN_EDITOR_HEIGHT = 180
// The filename chip plus the row's own padding and gap, which sit beside the
// measured button group.
const TOOLBAR_CHROME = 150
const RAIL_MIN = 280
// Low enough to collapse the console to just its tab strip, which is a
// legitimate thing to want while writing rather than debugging.
const CONSOLE_MIN = 44

const MONACO_LANGUAGE = {
  html: 'html',
  javascript: 'javascript',
  jsx: 'javascript',
  python: 'python',
  text: 'plaintext',
}

function SegmentedProgress({ tasks, currentIndex, onJump }) {
  return (
    <div className="flex items-center gap-1.5">
      {tasks.map((t) => {
        const done = t.status === 'complete'
        const current = t.task_index === currentIndex
        return (
          <button
            key={t.task_index}
            onClick={() => onJump(t)}
            title={`Task ${t.task_index}: ${t.title}`}
            className={`h-1.5 w-10 rounded-full transition-colors ${
              current ? 'bg-indigo-500' : done ? 'bg-emerald-500' : 'bg-slate-200 hover:bg-slate-300'
            }`}
          >
            <span className="sr-only">Task {t.task_index}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function SandboxWorkbenchPage() {
  const { slug, taskIndex } = useParams()
  const navigate = useNavigate()
  const index = Number(taskIndex)

  // Adopt the handed-off session BEFORE any query fires. A `useState`
  // initializer runs during render, ahead of the effects that trigger fetches;
  // an effect would be too late and the first request would 401.
  const [hasSession] = useState(() => adoptHandoffToken())

  const { data, isLoading } = useSimulationFull(slug)
  const { data: enrollment, isLoading: loadingEnrollment } = useEnrollment(slug)

  const simulation = data?.simulation
  const tasks = useMemo(() => data?.tasks ?? [], [data])
  const roadmap = useMemo(() => buildRoadmap({
    tasks,
    sectionLabels: simulation?.section_labels || {},
    completions: enrollment?.task_completions || [],
  }), [tasks, simulation, enrollment])

  const allTasks = useMemo(() => roadmap.sections.flatMap((s) => s.tasks), [roadmap])
  const task = allTasks.find((t) => t.task_index === index)
  const section = roadmap.sections.find((s) => s.tasks.some((t) => t.task_index === index))

  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [isSubmit, setIsSubmit] = useState(false)
  const [graded, setGraded] = useState(false)
  // The mini assessment opens by itself the moment a submit is graded — see
  // PostTaskAssessment. `assessmentOpen` is separate from `graded` so closing
  // it doesn't undo the graded state, and so it can be reopened.
  const [assessmentOpen, setAssessmentOpen] = useState(false)
  // The score lands here first. A graded submit used to open the quiz
  // immediately, which meant the work itself was never acknowledged and there
  // was no way back to the editor without answering five questions.
  const [completeOpen, setCompleteOpen] = useState(false)

  // Minimum time the boot screen stays up, in THIS tab.
  //
  // This is the tab the student is actually looking at: window.open moves
  // focus here, so the overlay on the task page they came from is painting on
  // a background tab where nobody can see it. Whatever is shown during the
  // wait has to be shown HERE.
  //
  // A floor rather than a duration — the task often resolves from cache in
  // under 100ms, and a boot screen that appears and vanishes inside one blink
  // reads as a flicker rather than as opening something.
  const [booting, setBooting] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), BOOT_MIN_MS)
    return () => clearTimeout(t)
  }, [])
  // Set when the assessment is being used as a gate on Next rather than as the
  // optional check that pops up on grading — it changes the footer's wording
  // and what happens on a pass.
  const [assessmentIsGate, setAssessmentIsGate] = useState(false)
  // The score from an attempt made in this tab. Held separately from the
  // enrollment's stored quiz_score so the gate opens the instant the student
  // passes, without waiting on a refetch.
  const [assessmentScore, setAssessmentScore] = useState(null)
  const [weekSceneOpen, setWeekSceneOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [help, setHelp] = useState(null) // null | 'hints' | 'solution'
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Font, theme, size and the rest — persisted, so they carry across tasks.
  // `autocomplete` lives in here too rather than as separate state, so the
  // toolbar toggle and the settings panel can't disagree about it.
  const { settings, update: updateSettings, reset: resetSettings } = useEditorSettings()
  const autocomplete = settings.autocomplete

  // Pane sizes, in px, remembered across tasks and sessions.
  const [railWidth, setRailWidth] = usePersistentSize('wl-workbench-rail', 380)
  const [consoleHeight, setConsoleHeight] = usePersistentSize('wl-workbench-console', 220)

  // Both ceilings come from the room actually available, not from fixed
  // numbers: a stored 760px rail is reasonable on a desktop and leaves the
  // editor unusable on a 1024px laptop, and a 640px console does the same to a
  // short window.
  const [splitRef, splitSize] = useElementSize()
  const [editorColRef, editorColSize] = useElementSize()
  // The toolbar's button group is `shrink-0`, so its measured width is its
  // NATURAL width regardless of how narrow the pane gets — which makes it a
  // reliable answer to "how much room do these buttons actually need?".
  // Measured rather than hardcoded so adding a button later moves the limit on
  // its own instead of silently pushing the last one off the edge again.
  const [toolbarRef, toolbarSize] = useElementSize()

  const minEditorWidth = Math.max(
    MIN_EDITOR_WIDTH_FLOOR,
    toolbarSize.width ? toolbarSize.width + TOOLBAR_CHROME : 0,
  )

  const railMax = maxForPane({
    available: splitSize.width, minSibling: minEditorWidth, minSelf: RAIL_MIN, fallback: 760,
  })
  const consoleMax = maxForPane({
    available: editorColSize.height, minSibling: MIN_EDITOR_HEIGHT, minSelf: CONSOLE_MIN, fallback: 640,
  })

  // Shrinking the window can leave a stored size that no longer fits. Pull it
  // back in rather than letting the editor get squeezed out of view.
  useEffect(() => {
    if (splitSize.width && railWidth > railMax) setRailWidth(railMax)
  }, [splitSize.width, railMax, railWidth, setRailWidth])

  useEffect(() => {
    if (editorColSize.height && consoleHeight > consoleMax) setConsoleHeight(consoleMax)
  }, [editorColSize.height, consoleMax, consoleHeight, setConsoleHeight])

  // Registers Monaco's inline-completion provider; returns the onMount handler.
  const registerAutocomplete = useSandboxAutocomplete({
    enabled: autocomplete,
    slug,
    taskIndex: index,
    language: task?.config?.language,
  })

  const submitSandbox = useSubmitSandbox(enrollment?.id, index)

  // Prose, not code: nothing is executed, an LLM judge reads what was written.
  // Everything below that says "code" has to say something else.
  const isTextTask = task?.config?.submission_mode === 'text'

  // Load starter code when the task arrives or changes. Keyed on task_index so
  // navigating between tasks in this same tab resets the editor.
  useEffect(() => {
    if (!task) return
    setCode(task.config?.starter_code ?? '')
    setResult(null)
    setGraded(false)
    setCompleteOpen(false)
    setAssessmentOpen(false)
    setAssessmentIsGate(false)
    setAssessmentScore(null)
    setWeekSceneOpen(false)
    setHelp(null)

    // Tell the tab that opened this one that the sandbox is genuinely usable,
    // so its "Opening…" spinner stops when the wait actually ends rather than
    // after a guessed interval. Fired here because this effect only runs once
    // the task has resolved — session adopted, simulation fetched, editor
    // about to mount with real starter code.
    postSimEvent({ kind: SIM_EVENT.SANDBOX_READY, slug, taskIndex: task.task_index })
  }, [task?.task_index]) // eslint-disable-line react-hooks/exhaustive-deps

  const execute = useCallback(async (dryRun) => {
    if (!enrollment?.id || submitSandbox.isPending) return
    setIsSubmit(!dryRun)
    try {
      // A text task is judged from `text`, a code task is run from `code`, and
      // the server reads exactly one of them. Sending `code` for the Executive
      // Brief is what made it fail with "text is required for this task" on
      // every submission — the last graded step of the simulation could not be
      // completed at all.
      const payload = isTextTask
        ? { text: code, dry_run: dryRun }
        : { code, dry_run: dryRun }
      const res = await submitSandbox.mutateAsync(payload)
      setResult(res)
      if (!dryRun) {
        setGraded(true)
        // The completion dialog, not the quiz. It offers the quiz.
        setCompleteOpen(true)
        // Tell the tab that opened this one. It has no other way to learn that
        // a score changed — see lib/simChannel.js.
        postSimEvent({
          kind: SIM_EVENT.TASK_GRADED,
          slug,
          taskIndex: index,
          score: res?.score ?? null,
        })
      }
    } catch {
      // Surfaced through submitSandbox.isError below.
    }
  }, [code, enrollment?.id, submitSandbox, slug, index, isTextTask])

  if (isLoading || loadingEnrollment || booting) {
    return <SandboxBooting taskTitle={task?.title} />
  }

  // No session and no handoff: a bookmarked or pasted URL. Say so plainly
  // rather than bouncing to /login, which loses the task they wanted.
  if (!hasSession && !enrollment) {
    return (
      <FullScreenNotice
        title="This sandbox needs your session"
        body="Open it from the task page in your simulation tab so it can carry your login across."
        action={{ label: 'Go to the simulation', onClick: () => navigate(`/simulations/${slug}/roadmap`) }}
      />
    )
  }
  if (!task) {
    return (
      <FullScreenNotice
        title="Task not found"
        body="That task doesn't exist in this simulation."
        action={{ label: 'Back to roadmap', onClick: () => navigate(`/simulations/${slug}/roadmap`) }}
      />
    )
  }
  if (task.type !== 'code_sandbox') {
    return (
      <FullScreenNotice
        title="This task has no sandbox"
        body="It's completed on the task page itself."
        action={{ label: 'Open the task', onClick: () => navigate(`/simulations/${slug}/task/${index}`) }}
      />
    )
  }

  // Only meaningful while isError is true; computing it here keeps the JSX
  // below readable.
  const submitFailure = describeSubmitError(submitSandbox.error)

  const language = task.config?.language
  const filename = task.config?.input_filename || `submission.${language === 'python' ? 'py' : language === 'html' ? 'html' : 'js'}`
  const canPreview = language === 'html'
  const nextTask = allTasks.find((t) => t.task_index === index + 1)
  const prevTask = allTasks.find((t) => t.task_index === index - 1)
  const goOutline = () => navigate(`/simulations/${slug}/roadmap`)

  // Always the task's description page — never straight into the next
  // sandbox, even though the next task has one.
  //
  // Dropping someone directly into an editor skips the brief entirely: the
  // manager's briefing, the concepts defined before they're used, the worked
  // steps, and the contract naming the exact ids the hidden tests look for.
  // They'd arrive at a starter file for a task nobody had explained, and the
  // sandbox is one click from there anyway.
  const advance = () => {
    if (!nextTask) return goOutline()
    navigate(`/simulations/${slug}/task/${nextTask.task_index}`)
  }

  // Non-null only when this task is the last of its week AND every task in that
  // week is now complete and passed. Computed from the live score so it fires
  // on the attempt that earned it, not on the next page load.
  const weekDone = weekCompletion(roadmap, index, assessmentScore)

  // `task.quizScore` comes from the enrollment, so a pass earned on a previous
  // visit still counts and the gate doesn't re-run for work already checked.
  const assessmentPassed = hasPassedAssessment(assessmentScore, task.quizScore)

  const goNext = () => {
    if (assessmentPassed) return advance()
    setAssessmentIsGate(true)
    setAssessmentOpen(true)
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* The arrows navigate between TASKS, not between editors — same
          reasoning as `advance` below. */}
      <WorkbenchTopBar
        company={simulation.company}
        sectionLabel={section?.label}
        task={task}
        taskCount={roadmap.overall.total}
        xp={task.xp_award}
        hasPrev={!!prevTask}
        hasNext={!!nextTask}
        onPrev={() => prevTask && navigate(`/simulations/${slug}/task/${prevTask.task_index}`)}
        onNext={() => nextTask && navigate(`/simulations/${slug}/task/${nextTask.task_index}`)}
        onOutline={goOutline}
      />

      {/* Flex rather than a fixed grid template, so the dividers can drive the
          sizes. The px values ride in as CSS variables because inline styles
          can't be made responsive — below `lg` the panes stack and the stored
          width is ignored. */}
      <div
        ref={splitRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row"
        style={{ '--rail-w': `${railWidth}px`, '--console-h': `${consoleHeight}px` }}
      >
        {/* No border-r: the divider below is the border. Two lines a pixel
            apart was the bulk. */}
        <div className="min-h-0 w-full lg:w-[var(--rail-w)] lg:shrink-0">
          <ExerciseRail task={task} sectionLabel={section?.label} result={result} isSubmit={isSubmit} />
        </div>

        {/* `hidden lg:flex`, not `lg:block` — a block wrapper gave the handle
            no height to stretch into, so it collapsed to a zero-height strip
            that could never be grabbed. Below `lg` the panes stack and there
            is nothing horizontal to resize. */}
        <SplitHandle
          orientation="vertical"
          label="Resize the exercise panel"
          value={railWidth}
          min={RAIL_MIN}
          max={railMax}
          onChange={setRailWidth}
          className="hidden lg:block"
        />
        {/* Stacked layout still needs the line, just not a draggable one. */}
        <span className="block border-b border-slate-200 lg:hidden" aria-hidden="true" />

        {/* `min-w-0` is load-bearing. A flex item defaults to
            `min-width: auto`, which refuses to shrink below its content's
            intrinsic width — so as the brief was dragged wider this column
            kept its own width instead of yielding, and the editor slid off the
            right of the window. Nothing about it looks like a sizing rule,
            which is why it's easy to leave out and hard to spot afterwards. */}
        <div ref={editorColRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Editor — flex-1 so it absorbs whatever the console isn't using. */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-900">
            {/* The toolbar must never be what sets the editor's minimum width:
                it scrolls sideways instead, and the filename truncates. */}
            <div className="flex shrink-0 items-center justify-between gap-3 overflow-x-auto border-b border-slate-700 px-3 py-2">
              <span className="truncate rounded-md bg-slate-800 px-3 py-1 font-mono text-xs font-semibold text-slate-200">
                {filename}
              </span>
              {/* shrink-0: the buttons keep their natural size rather than
                  compressing, so the measured width above is the real one and
                  nothing gets squeezed into illegibility on the way to being
                  cut off. */}
              <div ref={toolbarRef} className="flex shrink-0 items-center gap-2">
                {/* Hints and the worked solution, moved out of the exercise
                    rail. Here they're one click from the cursor when you get
                    stuck, and invisible when you don't. */}
                <button
                  onClick={() => setHelp((h) => (h === 'hints' ? null : 'hints'))}
                  title="Hints for this task"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold transition-colors ${
                    help === 'hints'
                      ? 'bg-amber-500/25 text-amber-200'
                      : 'text-amber-300/80 hover:bg-slate-800 hover:text-amber-200'
                  }`}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Hint</span>
                </button>
                <button
                  onClick={() => setHelp((h) => (h === 'solution' ? null : 'solution'))}
                  title="The worked solution"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold transition-colors ${
                    help === 'solution'
                      ? 'bg-slate-700 text-slate-100'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Solution</span>
                </button>
                <span className="mx-0.5 h-5 w-px bg-slate-700" aria-hidden="true" />
                <button
                  onClick={() => updateSettings({ autocomplete: !autocomplete })}
                  title={autocomplete ? 'AI autocomplete on — click to turn off' : 'AI autocomplete off — click to turn on'}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold transition-colors ${
                    autocomplete
                      ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                      : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Autocomplete</span>
                </button>
                <button
                  onClick={() => setAiOpen((v) => !v)}
                  title="Ask AI about your code"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold transition-colors ${
                    aiOpen
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ask AI</span>
                </button>
                <span className="mx-0.5 h-5 w-px bg-slate-700" aria-hidden="true" />
                {/* The panel itself is NOT rendered here. This row scrolls
                    horizontally, and an overflow container clips absolutely
                    positioned descendants — a dropdown anchored inside it was
                    rendered and then cut off, so the button appeared dead.
                    It lives over the editor instead, below. */}
                <button
                  data-settings-trigger
                  onClick={() => setSettingsOpen((v) => !v)}
                  aria-expanded={settingsOpen}
                  title="Editor settings — font, theme, size"
                  className={`p-2 transition-colors ${
                    settingsOpen
                      ? 'bg-slate-700 text-slate-100'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCode(task.config?.starter_code ?? '')}
                  title={isTextTask ? 'Clear and start again' : 'Reset to starter code'}
                  className="p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                {!isTextTask && (
                  <button
                    onClick={() => execute(true)}
                    disabled={submitSandbox.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3.5 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-50"
                  >
                    {submitSandbox.isPending && !isSubmit
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Play className="h-3.5 w-3.5" />}
                    Run code
                  </button>
                )}
                <button
                  onClick={() => execute(false)}
                  disabled={submitSandbox.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                >
                  {submitSandbox.isPending && isSubmit
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Send className="h-3.5 w-3.5" />}
                  {isTextTask ? 'Submit brief' : 'Submit answer'}
                </button>
              </div>
            </div>

            {/* `relative` so the AI window can float over the editor. */}
            <div className="relative min-h-0 flex-1">
              <Editor
                height="100%"
                language={MONACO_LANGUAGE[language] ?? 'plaintext'}
                theme={settings.theme}
                beforeMount={defineWorkLearnThemes}
                onMount={registerAutocomplete}
                value={code}
                onChange={(v) => setCode(v ?? '')}
                options={
                  isTextTask
                    ? {
                        ...monacoOptions(settings),
                        // Written for a person, not a parser.
                        wordWrap: 'on',
                        lineNumbers: 'off',
                        folding: false,
                        renderLineHighlight: 'none',
                        occurrencesHighlight: 'off',
                        matchBrackets: 'never',
                        quickSuggestions: false,
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: Math.max(14, settings.fontSize ?? 14),
                        lineHeight: 1.7,
                        padding: { top: 20, bottom: 20 },
                      }
                    : monacoOptions(settings)
                }
              />

              <SandboxAiPanel
                open={aiOpen}
                onClose={() => setAiOpen(false)}
                slug={slug}
                taskIndex={index}
                language={language}
                code={code}
                onApplyCode={setCode}
              />

              <HelpDrawer
                open={help !== null}
                tab={help ?? 'hints'}
                onTab={setHelp}
                onClose={() => setHelp(null)}
                task={task}
              />

              {/* Anchored to the editor surface, not to its toolbar button —
                  the toolbar scrolls sideways and would clip this. Same
                  container the AI panel and help drawer float in. */}
              <EditorSettingsPanel
                open={settingsOpen}
                settings={settings}
                update={updateSettings}
                reset={resetSettings}
                onClose={() => setSettingsOpen(false)}
              />
            </div>
          </div>

          <SplitHandle
            orientation="horizontal"
            label="Resize the console"
            value={consoleHeight}
            min={CONSOLE_MIN}
            max={consoleMax}
            invert
            tone="dark"
            onChange={setConsoleHeight}
          />

          {/* No border-t — the divider above is the border. */}
          <div className="min-h-0 h-[14rem] shrink-0 lg:h-[var(--console-h)]">
            <ConsolePane result={result} previewHtml={code} canPreview={canPreview} />
          </div>
        </div>
      </div>

      {/* Bottom bar — progress, and the way forward once graded. */}
      <footer className="flex h-14 shrink-0 items-center justify-between gap-4 border-t border-slate-200 bg-white px-4">
        <SegmentedProgress
          tasks={allTasks}
          currentIndex={index}
          onJump={(t) => navigate(`/sandbox/${slug}/${t.task_index}`)}
        />

        {submitSandbox.isError && (
          <div className="flex min-w-0 items-start gap-2 text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="min-w-0 text-xs leading-snug">
              <span className="font-bold">{submitFailure.title}</span>
              {submitFailure.status && (
                <span className="ml-1.5 font-mono text-[0.65rem] text-rose-500">HTTP {submitFailure.status}</span>
              )}
              <span className="block text-rose-600/90">{submitFailure.detail}</span>
            </p>
            {submitFailure.canRetry && (
              <button
                /* `isSubmit` records what the failed attempt was, so this
                   retries the same action rather than silently downgrading a
                   Submit into a Run. */
                onClick={() => execute(!isSubmit)}
                className="shrink-0 rounded-lg border border-rose-300 px-2.5 py-1 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {graded && (
          <button
            onClick={() => setAssessmentOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            <ClipboardCheck className="h-4 w-4" /> Mini assessment
          </button>
        )}

        {graded && (
          // Next is gated on the assessment. Clicking it opens the quiz rather
          // than moving on, and only a pass at ASSESSMENT_PASS_MARK releases
          // the navigation — see goNext.
          nextTask ? (
            <button
              onClick={goNext}
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            >
              {assessmentPassed ? 'Next section' : 'Next — take the quiz'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              onClick={goNext}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
            >
              {assessmentPassed ? 'Finish — back to roadmap' : 'Finish — take the quiz'}
              <ExternalLink className="h-4 w-4" />
            </button>
          )
        )}
      </footer>

      <TaskCompleteDialog
        open={completeOpen}
        score={result?.score}
        xpAwarded={result?.xp_awarded}
        skillsAwarded={result?.skills_awarded}
        taskTitle={task.title}
        passMark={ASSESSMENT_PASS_MARK}
        quizTaken={assessmentScore != null || task.quizScore != null}
        onTakeQuiz={() => { setCompleteOpen(false); setAssessmentOpen(true) }}
        onClose={() => setCompleteOpen(false)}
      />

      {assessmentOpen && enrollment?.id && (
        <PostTaskAssessment
          enrollmentId={enrollment.id}
          taskIndex={index}
          taskTitle={task.title}
          score={result?.score}
          passMark={ASSESSMENT_PASS_MARK}
          isGate={assessmentIsGate}
          onScored={setAssessmentScore}
          onClose={() => setAssessmentOpen(false)}
          nextLabel={weekDone ? 'See your week' : nextTask ? 'Next task' : 'Finish — back to roadmap'}
          onNext={() => {
            setAssessmentOpen(false)
            // A finished week gets its moment before the next brief. Without
            // this, the reward for three tickets and three quizzes is being
            // handed a fourth.
            if (weekDone) setWeekSceneOpen(true)
            else advance()
          }}
        />
      )}

      {weekSceneOpen && weekDone && (
        <WeekCompleteScene
          weekLabel={weekDone.weekLabel}
          weekNumber={weekDone.weekNumber}
          tasksCompleted={weekDone.tasksCompleted}
          xpEarned={weekDone.xpEarned}
          avgScore={weekDone.avgScore}
          nextSectionLabel={weekDone.nextSection?.label}
          onContinue={() => { setWeekSceneOpen(false); advance() }}
          onRoadmap={() => { setWeekSceneOpen(false); goOutline() }}
        />
      )}
    </div>
  )
}

const BOOT_MIN_MS = 2000

/** What the student sees while the sandbox tab comes up.
 *
 * Dark, because the editor it hands over to is a code surface and a white
 * flash between the two is the most jarring thing in the sequence. */
function SandboxBooting({ taskTitle }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0b0f14]" role="status" aria-live="polite">
      <div className="cube-loader" />
      <p className="mt-8 font-display text-base font-extrabold text-white">
        Opening your sandbox
      </p>
      {taskTitle && (
        <p className="mt-1 max-w-xs text-center text-sm text-white/55">{taskTitle}</p>
      )}
      <p className="mt-6 text-xs text-white/35">Loading the editor and your files</p>
    </div>
  )
}


function FullScreenNotice({ title, body, action }) {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-lg font-extrabold text-on-surface">{title}</h1>
        {body && <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{body}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
