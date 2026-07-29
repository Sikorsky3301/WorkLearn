import StageQuiz from '../sales-crm-sim/stages/StageQuiz'

/** Standalone `type: "quiz"` task — a pure knowledge-check with no other
 * content. Reuses StageQuiz.jsx as-is (already fully generic: questions/
 * stageTitle/onFinish props only), always open since the quiz IS the task. */
export default function QuizTask({ task, onComplete }) {
  const questions = task.config?.questions || []

  function handleFinish(scorePct) {
    onComplete({ score: scorePct, quiz_score: scorePct })
  }

  return (
    <StageQuiz
      open={true}
      onOpenChange={() => {}}
      questions={questions}
      stageTitle={task.title}
      onFinish={handleFinish}
    />
  )
}
