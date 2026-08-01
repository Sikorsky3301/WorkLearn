import { useState } from 'react'
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useGradeText } from '../../../hooks'
import { Textarea } from '../../../shared/ui/shadcn/textarea'
import { Input } from '../../../shared/ui/shadcn/input'
import { Label } from '../../../shared/ui/shadcn/label'
import { Button } from '../../../shared/ui/shadcn/button'
import { Card, CardContent } from '../../../shared/ui/shadcn/card'

function extractScore(result) {
  if (typeof result.overall === 'number') return result.overall
  const scores = Object.values(result.scores || result.categoryScores || {})
  if (scores.length) return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  return null
}

/** Long-form text submission, either one free-text textarea or a set of
 * named fields (e.g. subject/body/cta for a cold email) driven by
 * `task.config.fields`. Graded either by an LLM judge (config.grading_mode
 * === "llm", via the generic /grade-text endpoint) or manually (submission
 * just gets marked complete with no auto score). */
export default function TextRubricTask({ simId, task, onComplete }) {
  const fields = task.config?.fields || []
  const isFieldMode = fields.length > 0
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.key, ''])))
  const [freeText, setFreeText] = useState('')
  const [grade, setGrade] = useState(null)
  const { mutate: gradeText, isPending } = useGradeText(simId, task.task_index)

  const combinedText = isFieldMode
    ? fields.map((f) => `${f.label}: ${values[f.key] || ''}`).join('\n\n')
    : freeText

  const requiredFilled = isFieldMode
    ? fields.every((f) => !f.required || (values[f.key] || '').trim())
    : freeText.trim().length > 0

  function handleSubmit() {
    if (!requiredFilled) return
    if (task.config?.grading_mode !== 'llm') {
      onComplete({ score: null, rubric_rating: null })
      return
    }
    gradeText(
      { text: combinedText, fields: isFieldMode ? values : {} },
      {
        onSuccess: (result) => {
          setGrade(result)
          onComplete({ score: extractScore(result), rubric_rating: result })
        },
        onError: () => toast.error('Could not grade this right now — try again.'),
      }
    )
  }

  return (
    <div className="space-y-4">
      {isFieldMode ? (
        fields.map((f) => (
          <div key={f.key}>
            <Label className="mb-1.5 block">{f.label}</Label>
            {f.type === 'textarea' ? (
              <Textarea
                rows={8}
                value={values[f.key] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            ) : (
              <Input
                value={values[f.key] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            )}
          </div>
        ))
      ) : (
        <Textarea
          rows={14}
          placeholder="Write your response…"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
        />
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!requiredFilled || isPending}>
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
