import { useState } from 'react'
import StageQuiz from '../sales-crm-sim/stages/StageQuiz'
import { GenericTaskHeader } from './GenericStageChrome'
import ReferenceDataPanel from './ReferenceDataPanel'
import ModelSolutionPanel from './ModelSolutionPanel'
import { taskTypeRegistry } from './taskTypeRegistry'

/** Dispatches to the renderer for `task.type`, wrapped in the shared
 * title/objective header. Handles the optional post_task_quiz gate
 * (shown once a task's own type-component signals completion, before the
 * completion is actually finalized) — matches sales-crm-sim's real UX (a
 * quiz gate after a stage's real work), reused generically for any type. */
export default function GenericStageRenderer({ simId, enrollmentId, task, taskCount, onTaskComplete }) {
  const [quizOpen, setQuizOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)
  const quiz = task.config?.post_task_quiz?.questions

  function handleTypeComplete(payload, opts) {
    if (quiz?.length) {
      setPendingPayload({ payload, opts })
      setQuizOpen(true)
    } else {
      onTaskComplete(payload, opts)
    }
  }

  function handleQuizFinish(scorePct) {
    setQuizOpen(false)
    const { payload, opts } = pendingPayload || {}
    onTaskComplete({ ...payload, quiz_score: scorePct }, opts)
  }

  const entry = taskTypeRegistry[task.type]
  const Renderer = entry?.RendererComponent

  return (
    <div>
      <GenericTaskHeader task={task} taskCount={taskCount} />

      <ReferenceDataPanel referenceData={task.reference_data} />

      {Renderer ? (
        <Renderer simId={simId} enrollmentId={enrollmentId} task={task} onComplete={handleTypeComplete} />
      ) : (
        <p className="text-sm text-on-surface-variant">Unsupported task type: {task.type}</p>
      )}

      <ModelSolutionPanel modelSolution={task.model_solution} />

      {quiz?.length > 0 && (
        <StageQuiz
          open={quizOpen}
          onOpenChange={setQuizOpen}
          questions={quiz}
          stageTitle={task.title}
          onFinish={handleQuizFinish}
        />
      )}
    </div>
  )
}
