import { useEffect, useState } from 'react'
import { Brain, CheckCircle2, XCircle, ArrowRight, PartyPopper } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../shared/ui/shadcn/dialog'
import { Button } from '../../../../shared/ui/shadcn/button'
import { Progress } from '../../../../shared/ui/shadcn/progress'
import { cn } from '../../../../shared/utils/cn'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

/** A quick 5-question check-in shown once, right after a stage is first
 * completed and before the next one unlocks — reinforces what just happened
 * instead of letting "Continue" be a single unthinking click. */
export default function StageQuiz({ open, onOpenChange, questions, stageTitle, onFinish }) {
  const [step, setStep] = useState(0) // 0..questions.length-1, then questions.length = results screen
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])

  useEffect(() => {
    if (open) {
      setStep(0)
      setSelected(null)
      setAnswers([])
    }
  }, [open])

  if (!questions?.length) return null

  const isResults = step >= questions.length
  const question = !isResults ? questions[step] : null
  const correctCount = answers.filter((a) => a.correct).length
  const scorePct = Math.round((correctCount / questions.length) * 100)

  function pick(optionIndex) {
    if (selected != null) return // already locked in for this question
    setSelected(optionIndex)
  }

  function handleNext() {
    const isCorrect = selected === question.correct
    setAnswers((prev) => [...prev, { question: question.question, correct: isCorrect }])
    setSelected(null)
    setStep((s) => s + 1)
  }

  function handleFinish() {
    onFinish?.(scorePct)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        {!isResults ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-primary" />
                <DialogTitle>Quick Check — {stageTitle}</DialogTitle>
              </div>
              <DialogDescription>Question {step + 1} of {questions.length}</DialogDescription>
            </DialogHeader>

            <Progress value={((step + (selected != null ? 1 : 0)) / questions.length) * 100} className="mb-2" />

            <p className="text-sm font-semibold text-on-surface leading-relaxed mt-2 mb-4">{question.question}</p>

            <div className="space-y-2">
              {question.options.map((opt, i) => {
                const isSelected = selected === i
                const isCorrectOpt = i === question.correct
                const revealed = selected != null
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pick(i)}
                    disabled={revealed}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors',
                      !revealed && 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer',
                      revealed && isCorrectOpt && 'border-emerald-300 bg-emerald-50 text-emerald-800',
                      revealed && isSelected && !isCorrectOpt && 'border-red-300 bg-red-50 text-red-800',
                      revealed && !isSelected && !isCorrectOpt && 'border-border opacity-50'
                    )}
                  >
                    <span className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold',
                      !revealed && 'border-border text-on-surface-variant',
                      revealed && isCorrectOpt && 'border-emerald-400 bg-emerald-500 text-white',
                      revealed && isSelected && !isCorrectOpt && 'border-red-400 bg-red-500 text-white',
                      revealed && !isSelected && !isCorrectOpt && 'border-border text-on-surface-variant'
                    )}>
                      {OPTION_LETTERS[i]}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {revealed && isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                    {revealed && isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
                  </button>
                )
              })}
            </div>

            <Button className="mt-5 w-full" onClick={handleNext} disabled={selected == null}>
              {step === questions.length - 1 ? 'See Results' : 'Next Question'} <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <PartyPopper className="h-4 w-4 text-primary" />
                <DialogTitle>Nice work</DialogTitle>
              </div>
              <DialogDescription>Here's how the check-in went.</DialogDescription>
            </DialogHeader>

            <div className="text-center py-4">
              <p className="text-5xl font-bold text-primary mb-1">{correctCount}/{questions.length}</p>
              <p className="text-sm text-on-surface-variant">
                {scorePct >= 80 ? 'Sharp — bonus XP unlocked.' : scorePct >= 60 ? 'Solid grasp of the stage.' : 'Worth reviewing this stage again later.'}
              </p>
            </div>

            <Button className="w-full" onClick={handleFinish}>
              Continue to the Next Stage <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
