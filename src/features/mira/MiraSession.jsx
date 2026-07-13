import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMira } from './MiraContext'
import { useSpeechRecognition } from './useSpeechRecognition'

export default function MiraSession() {
  const navigate = useNavigate()
  const { config, questions, currentIndex, submitAnswer, computeResults } = useMira()

  const [answer, setAnswer] = useState('')
  const [usedVoice, setUsedVoice] = useState(false)

  const currentQ = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  const handleVoiceResult = useCallback((text) => {
    setUsedVoice(true)
    setAnswer(prev => (prev ? `${prev} ${text}` : text))
  }, [])

  const { supported: speechSupported, listening, start: startListening, stop: stopListening } =
    useSpeechRecognition({ onResult: handleVoiceResult })

  // No active session (e.g. direct nav or page refresh) — send back to setup.
  useEffect(() => {
    if (!config || questions.length === 0) {
      navigate('/mira/setup', { replace: true })
    }
  }, [config, questions, navigate])

  useEffect(() => {
    setAnswer('')
    setUsedVoice(false)
    stopListening()
  }, [currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentQ) return null

  function handleSubmit() {
    if (!answer.trim()) return
    stopListening()
    submitAnswer(answer, usedVoice ? 'spoken' : 'typed')

    if (isLast) {
      computeResults()
      navigate('/mira/results')
    }
  }

  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Mock Interview in Progress</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {config?.interviewType} · {config?.role} · {config?.difficulty}
          </p>
        </div>
        <button
          onClick={() => navigate('/mira/setup')}
          className="btn-secondary text-xs px-4 py-2"
        >
          ← End Session
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full ${i < currentIndex ? 'bg-green-500' : i === currentIndex ? 'bg-primary' : 'bg-surface-high'}`}
            />
          ))}
          <span className="text-xs text-on-surface-variant shrink-0">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Interviewer */}
        <div className="card mb-4" style={{ animation: 'fadeIn 0.25s ease' }} key={currentQ.id}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant mb-1">
                MIRA · {currentQ.type} Question · {currentQ.difficulty}
              </p>
              <p className="text-base font-semibold text-on-surface leading-relaxed">{currentQ.question}</p>
            </div>
          </div>
        </div>

        {/* Answer */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <label className="section-label">Your Answer</label>
            {speechSupported && (
              <button
                type="button"
                onClick={() => (listening ? stopListening() : startListening())}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  listening
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-white border-border text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${listening ? 'bg-red-500 animate-pulse' : 'bg-outline-variant'}`} />
                {listening ? 'Listening… tap to stop' : 'Speak answer'}
              </button>
            )}
          </div>

          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={7}
            placeholder="Type your answer here, or use the mic above to speak it..."
            className="input resize-none text-sm w-full mb-3"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">{words} words</span>
            <button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              className="btn-primary text-sm px-6 py-2 disabled:opacity-50"
            >
              {isLast ? 'Submit & Finish →' : 'Submit & Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
