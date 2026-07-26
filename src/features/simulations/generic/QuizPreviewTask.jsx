import { useState } from 'react'
import { PlayCircle } from 'lucide-react'
import StageQuiz from '../sales-crm-sim/stages/StageQuiz'

/** Preview-mode stand-in for QuizTask, used only by the CMS admin builder
 * (TaskLivePreviewPane, InteractiveSimPreview). The real QuizTask hardcodes
 * the quiz dialog open with `onOpenChange={() => {}}` — a deliberate no-op,
 * since for a real student a standalone quiz task IS the task and there's
 * nothing to back out of. That's wrong for an admin previewing content: they
 * need to be able to dismiss it while still editing other fields, without
 * getting trapped (StageQuiz also blocks outside-clicks via
 * onInteractOutside, so a no-op onOpenChange leaves genuinely no way out).
 * This wraps the same StageQuiz component with a real closable open state. */
export default function QuizPreviewTask({ task, onComplete }) {
  const questions = task.config?.questions || []
  const [open, setOpen] = useState(true)
  const [lastScore, setLastScore] = useState(null)

  if (!questions.length) {
    return <p className="text-sm text-on-surface-variant">No questions configured yet.</p>
  }

  function handleFinish(scorePct) {
    setLastScore(scorePct)
    setOpen(false)
    onComplete?.({ score: scorePct, quiz_score: scorePct })
  }

  return (
    <div>
      <StageQuiz open={open} onOpenChange={setOpen} questions={questions} stageTitle={task.title} onFinish={handleFinish} />
      {!open && (
        <div className="space-y-2">
          {lastScore != null && <p className="text-sm text-on-surface-variant">Last preview score: {lastScore}%</p>}
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg cursor-pointer"
          >
            <PlayCircle className="h-4 w-4" /> Preview quiz
          </button>
        </div>
      )}
    </div>
  )
}
