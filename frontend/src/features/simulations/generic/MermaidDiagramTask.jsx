import { useState } from 'react'
import { Loader2, Sparkles, CheckCircle2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { useGradeText } from '../../../hooks'
import { Textarea } from '../../../components/ui/shadcn/textarea'
import { Button } from '../../../components/ui/shadcn/button'
import { Card, CardContent } from '../../../components/ui/shadcn/card'
import MermaidPreview, { renderMermaidSvg } from '../../builder/cms/architecture/MermaidPreview'
import { STUDENT_STARTER_MMD } from '../../builder/cms/architecture/constants'

function extractScore(result) {
  if (typeof result.overall === 'number') return result.overall
  const scores = Object.values(result.scores || result.categoryScores || {})
  if (scores.length) return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  return null
}

/** Student writes Mermaid flowchart source, Runs a live SVG, then submits.
 * Manual grading marks complete; LLM mode reuses /grade-text. */
export default function MermaidDiagramTask({ simId, task, onComplete }) {
  const starter = task.config?.starter_code || STUDENT_STARTER_MMD
  const [source, setSource] = useState(starter)
  const [previewSource, setPreviewSource] = useState('')
  const [renderedOk, setRenderedOk] = useState(false)
  const [runError, setRunError] = useState('')
  const [running, setRunning] = useState(false)
  const [grade, setGrade] = useState(null)
  const { mutate: gradeText, isPending } = useGradeText(simId, task.task_index)

  const minWords = Number(task.config?.min_words) || 0
  const wordCount = source.trim() ? source.trim().split(/\s+/).length : 0
  const wordsOk = !minWords || wordCount >= minWords

  async function handleRun() {
    setRunning(true)
    setRunError('')
    setRenderedOk(false)
    try {
      await renderMermaidSvg(source)
      setPreviewSource(source)
      setRenderedOk(true)
    } catch (e) {
      setPreviewSource('')
      setRenderedOk(false)
      setRunError(e?.message || 'Could not render this flowchart. Check the Mermaid syntax.')
    } finally {
      setRunning(false)
    }
  }

  function handleSubmit() {
    if (!renderedOk || !wordsOk) return
    if (task.config?.grading_mode !== 'llm') {
      onComplete({ score: null, rubric_rating: null })
      return
    }
    if (!simId) {
      onComplete({ score: null, rubric_rating: null })
      return
    }
    gradeText(
      { text: source, fields: {} },
      {
        onSuccess: (result) => {
          setGrade(result)
          onComplete({ score: extractScore(result), rubric_rating: result })
        },
        onError: () => toast.error('Could not grade this right now — try again.'),
      },
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-on-surface-variant">
        Write Mermaid flowchart code that defines the architecture. Run it to check the diagram, then submit.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Textarea
            rows={16}
            value={source}
            onChange={(e) => {
              setSource(e.target.value)
              setRenderedOk(false)
            }}
            className="font-mono text-xs"
            placeholder={STUDENT_STARTER_MMD}
          />
          {minWords > 0 && (
            <p className="text-[11px] text-on-surface-variant mt-1">{wordCount}/{minWords} words</p>
          )}
        </div>
        <div>
          <MermaidPreview source={previewSource} />
        </div>
      </div>
      {runError && <p className="text-xs text-red-600">{runError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={handleRun} disabled={running || !source.trim()}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run
        </Button>
        <Button onClick={handleSubmit} disabled={!renderedOk || !wordsOk || isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {task.config?.grading_mode === 'llm' ? 'Submit for Grading' : 'Submit'}
        </Button>
      </div>
      {grade && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-on-surface">Score: {extractScore(grade)}/100</p>
              {grade.feedback && <p className="text-sm text-on-surface-variant mt-1">{grade.feedback}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
