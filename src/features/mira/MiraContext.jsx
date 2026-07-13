import { createContext, useContext, useState, useCallback } from 'react'
import { DURATIONS, selectQuestions } from './questionBank'
import { scoreAnswer, buildResults } from './scoring'

const MiraContext = createContext(null)

export function MiraProvider({ children }) {
  const [config, setConfig] = useState(null)       // { interviewType, role, difficulty, duration }
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])        // [{ text, method }]
  const [perQuestion, setPerQuestion] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState(null)

  const startInterview = useCallback((cfg) => {
    const durationMeta = DURATIONS.find(d => d.label === cfg.duration) || DURATIONS[0]
    const picked = selectQuestions({
      interviewType: cfg.interviewType,
      difficulty: cfg.difficulty,
      count: durationMeta.questionCount,
    })
    setConfig(cfg)
    setQuestions(picked)
    setAnswers([])
    setPerQuestion([])
    setCurrentIndex(0)
    setResults(null)
  }, [])

  const submitAnswer = useCallback((text, method = 'typed') => {
    const question = questions[currentIndex]
    if (!question) return
    const score = scoreAnswer(question, text)

    setAnswers(prev => [...prev, { text, method }])
    setPerQuestion(prev => [...prev, score])
    setCurrentIndex(i => i + 1)
  }, [questions, currentIndex])

  // Called once the last answer has been recorded — computed separately from
  // submitAnswer so it always sees the freshest perQuestion/answers state.
  const computeResults = useCallback(() => {
    const r = buildResults({ questions, answers, perQuestion })
    setResults(r)
    return r
  }, [questions, answers, perQuestion])

  const resetSession = useCallback(() => {
    setConfig(null)
    setQuestions([])
    setAnswers([])
    setPerQuestion([])
    setCurrentIndex(0)
    setResults(null)
  }, [])

  const value = {
    config,
    questions,
    answers,
    perQuestion,
    currentIndex,
    results,
    startInterview,
    submitAnswer,
    computeResults,
    resetSession,
  }

  return <MiraContext.Provider value={value}>{children}</MiraContext.Provider>
}

export function useMira() {
  const ctx = useContext(MiraContext)
  if (!ctx) throw new Error('useMira must be used within a MiraProvider')
  return ctx
}
