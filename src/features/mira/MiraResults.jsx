import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMira } from './MiraContext'

function ScoreRing({ score, size = 96 }) {
  const r = size / 2 - 8
  const circumference = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e1e9" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#312E81" strokeWidth="8"
          strokeDasharray={`${circumference * score / 100} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-primary">{score}%</span>
      </div>
    </div>
  )
}

function ScoreBar({ label, score }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-on-surface-variant">{label}</span>
        <span className="text-xs font-bold text-primary">{score}%</span>
      </div>
      <div className="w-full h-2 bg-surface-high rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function MiraResults() {
  const navigate = useNavigate()
  const { config, results, questions, resetSession } = useMira()

  useEffect(() => {
    if (!results) navigate('/mira/setup', { replace: true })
  }, [results, navigate])

  if (!results) return null

  function practiceAgain() {
    resetSession()
    navigate('/mira/setup')
  }

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-on-surface">Your Interview Feedback</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {config?.interviewType} · {config?.role} · {config?.difficulty} · {questions.length} questions
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Summary */}
        <div className="card mb-5 border-primary/20 bg-primary/5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <ScoreRing score={results.overallScore} />
            <div className="flex-1 w-full">
              <p className="font-bold text-on-surface text-lg mb-3 text-center sm:text-left">Overall Score</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ScoreBar label="Communication" score={results.communicationScore} />
                <ScoreBar label="Technical Accuracy" score={results.technicalScore} />
                <ScoreBar label="Confidence" score={results.confidenceScore} />
              </div>
              <div className="flex gap-2 mt-4 justify-center sm:justify-start">
                <button onClick={practiceAgain} className="btn-primary text-xs px-4 py-2">Practice Again</button>
                <button onClick={() => navigate('/mira')} className="btn-secondary text-xs px-4 py-2">Back to MIRA</button>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths + Improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="card">
            <p className="section-label mb-3">Strengths</p>
            <ul className="space-y-2">
              {results.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="text-green-600 font-bold shrink-0">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <p className="section-label mb-3">Areas to Improve</p>
            <ul className="space-y-2">
              {results.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="text-amber-600 font-bold shrink-0">!</span> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Suggested improvements */}
        {results.suggestions.length > 0 && (
          <div className="card mb-5">
            <p className="section-label mb-3">Suggested Answer Improvements</p>
            <div className="space-y-3">
              {results.suggestions.map((s, i) => (
                <div key={i} className="p-3 bg-surface-low border border-border rounded-lg">
                  <p className="text-xs font-semibold text-on-surface mb-1">{s.question}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{s.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next steps */}
        <div className="card mb-5">
          <p className="section-label mb-3">Recommended Next Steps</p>
          <ul className="space-y-1.5 text-sm text-on-surface-variant">
            {results.nextSteps.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span> {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-4">
          {results.perQuestion.map((p, i) => (
            <div key={i} className="card">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-semibold text-on-surface flex-1 mr-4">Q{i + 1}: {p.question.question}</p>
                <span className="text-sm font-bold text-primary shrink-0">{p.overall}%</span>
              </div>
              <div className="p-3 bg-surface-low border border-border rounded-lg mb-3 text-sm text-on-surface-variant leading-relaxed">
                {p.answer.text}
                <span className="ml-2 chip align-middle">{p.answer.method}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Technical', v: p.technical },
                  { label: 'Communication', v: p.communication },
                  { label: 'Confidence', v: p.confidence },
                ].map(m => (
                  <div key={m.label} className="p-2 rounded-lg text-center border border-border bg-white">
                    <p className="text-xs font-bold text-on-surface">{m.label}</p>
                    <p className="text-xs mt-0.5 text-primary font-semibold">{m.v}%</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
