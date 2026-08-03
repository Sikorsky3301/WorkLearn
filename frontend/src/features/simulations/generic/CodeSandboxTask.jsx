import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useSubmitSandbox } from '../../../hooks'
import { Textarea } from '../../../components/ui/shadcn/textarea'
import { Button } from '../../../components/ui/shadcn/button'
import JupyterPlayground from '../da-job-sim/JupyterPlayground'
import FrontendPlayground from '../frontend-dev-sim/FrontendPlayground'

/** Thin wrapper choosing the right existing sandbox editor by
 * `task.config.language`/`submission_mode` — both JupyterPlayground and
 * FrontendPlayground are already fully generic (enrollmentId/taskId props,
 * post to /api/sandbox/.../submit), so no changes were needed there. Grading
 * for registered_grader tasks already happens server-side in sandbox.py,
 * which also awards XP/skills directly — so onComplete here only updates
 * local generic-store bookkeeping (skipServerAward: true), it must NOT also
 * call the generic complete-task endpoint or XP would be double-awarded. */
export default function CodeSandboxTask({ simId, enrollmentId, task, onComplete }) {
  const config = task.config || {}

  function handleGraded(result, { isSubmit }) {
    if (isSubmit && typeof result.score === 'number') {
      onComplete({ score: result.score, rubric_rating: result }, { skipServerAward: true })
    }
  }

  if (config.submission_mode === 'text') {
    return <TextSubmissionSandbox enrollmentId={enrollmentId} task={task} onGraded={handleGraded} />
  }

  if (config.language === 'python') {
    return (
      <JupyterPlayground
        starterCode={config.starter_code || ''}
        enrollmentId={enrollmentId}
        taskId={task.task_index}
        outputFilename={config.output_filename}
        onGraded={handleGraded}
      />
    )
  }

  return (
    <FrontendPlayground
      starterCode={config.starter_code || ''}
      enrollmentId={enrollmentId}
      taskId={task.task_index}
      submissionFilename={config.input_filename}
      language={config.language}
      showPreview={config.language === 'html'}
      onGraded={handleGraded}
    />
  )
}

function TextSubmissionSandbox({ enrollmentId, task, onGraded }) {
  const [text, setText] = useState('')
  const submitSandbox = useSubmitSandbox(enrollmentId, task.task_index)

  function handleSubmit() {
    if (!text.trim() || submitSandbox.isPending) return
    submitSandbox.mutate(
      { text, dry_run: false },
      {
        onSuccess: (result) => onGraded(result, { isSubmit: true }),
        onError: () => toast.error('Could not grade this submission right now — try again.'),
      }
    )
  }

  return (
    <div className="space-y-4">
      <Textarea rows={14} placeholder="Write your response…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!text.trim() || submitSandbox.isPending}>
          {submitSandbox.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Submit for Grading
        </Button>
      </div>
    </div>
  )
}
