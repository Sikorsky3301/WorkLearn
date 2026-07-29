import { useState } from 'react'
import { CheckCircle2, Circle, ArrowRight, Brain } from 'lucide-react'
import { Button } from '../../../../shared/ui/shadcn/button'
import { cn } from '../../../../shared/utils/cn'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { STAGE_QUIZZES } from '../data/stageQuizzes'
import StageQuiz from './StageQuiz'

export function StageHeader({ stage }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
        Stage {stage.index} of 8 — {stage.shortTitle}
      </p>
      <h1 className="text-xl font-bold text-on-surface mb-1.5">{stage.title}</h1>
      <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">{stage.briefing}</p>
    </div>
  )
}

export function StageFooterNav({ stage, criteriaMet, isLast, onContinue }) {
  const allMet = criteriaMet.length > 0 && criteriaMet.every(Boolean)
  const alreadyCompleted = useCrmSimStore((s) => s.completedStages.includes(stage.index))
  const quiz = STAGE_QUIZZES[stage.index]
  const hasQuiz = !alreadyCompleted && quiz?.length > 0
  const [quizOpen, setQuizOpen] = useState(false)

  function handleClick() {
    if (hasQuiz) setQuizOpen(true)
    else onContinue()
  }

  function handleQuizFinish(scorePct) {
    setQuizOpen(false)
    onContinue(scorePct)
  }

  return (
    <>
      <div className="mt-8 border-t border-border pt-5 flex items-center justify-between gap-4 flex-wrap">
        <ul className="flex flex-wrap gap-2">
          {stage.successCriteria.map((c, i) => (
            <li
              key={i}
              className={cn(
                'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors',
                criteriaMet[i] ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-on-surface-variant bg-surface-low border-border'
              )}
            >
              {criteriaMet[i] ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
              {c}
            </li>
          ))}
        </ul>
        <Button onClick={handleClick} disabled={!allMet} className="shrink-0">
          {hasQuiz && <Brain className="h-4 w-4" />}
          {hasQuiz ? 'Quick Check →' : isLast ? 'Finish Simulation' : 'Continue'}
          {!hasQuiz && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>

      {quiz?.length > 0 && (
        <StageQuiz
          open={quizOpen}
          onOpenChange={setQuizOpen}
          questions={quiz}
          stageTitle={stage.title}
          onFinish={handleQuizFinish}
        />
      )}
    </>
  )
}
