// Deterministic, text-metric heuristic used to turn typed/spoken answers into
// scores until a real LLM grader is wired up. Everything here is a function
// of the actual answer text so results stay stable and testable — no
// randomness like the old interview-prep page used.

const HEDGE_PHRASES = ["i don't know", 'not sure', 'i guess', 'maybe', 'kind of', 'sort of', 'i think maybe', 'um', 'uh']

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function scoreAnswer(question, answerText) {
  const text = (answerText || '').toLowerCase()
  const words = wordCount(answerText)

  // Technical accuracy: how many of the question's key concepts were mentioned.
  const hits = question.keywords.filter(k => text.includes(k.toLowerCase())).length
  const technical = clamp((hits / question.keywords.length) * 115)

  // Communication: rewards a well-developed answer (~60-220 words), penalizes
  // very short or extremely rambling ones.
  let communication
  if (words === 0) communication = 0
  else if (words < 20) communication = clamp(words * 3)
  else if (words <= 220) communication = clamp(60 + Math.min(words, 220) / 220 * 40)
  else communication = clamp(100 - (words - 220) / 10)

  // Confidence: penalize hedging language and very thin answers.
  const hedgeHits = HEDGE_PHRASES.filter(p => text.includes(p)).length
  let confidence = 90 - hedgeHits * 18
  if (words < 15) confidence -= 35
  confidence = clamp(confidence)

  const overall = clamp(technical * 0.45 + communication * 0.35 + confidence * 0.2)

  return { technical, communication, confidence, overall, words, keywordHits: hits }
}

function bucketNextSteps(overall) {
  if (overall < 45) {
    return [
      'Revisit core ML fundamentals (bias-variance, overfitting, evaluation metrics) before your next attempt.',
      'Practice explaining concepts out loud in under 2 minutes — clarity matters as much as correctness.',
      'Redo this session at Beginner difficulty to build a stronger baseline.',
    ]
  }
  if (overall < 75) {
    return [
      'Add more concrete examples and metrics to your answers — specificity is what separates good from great responses.',
      'Practice the 2-3 weakest topics from this session until they feel automatic.',
      'Try the Intermediate or Advanced difficulty next to keep pushing.',
    ]
  }
  return [
    'Strong session — try Advanced difficulty or a Mixed interview type to simulate a tougher panel.',
    'Time-box your answers to under 90 seconds to sharpen delivery for real interviews.',
    'Consider practicing a live/spoken session if you typed this one, to build verbal fluency.',
  ]
}

export function buildResults({ questions, answers, perQuestion }) {
  const n = perQuestion.length || 1
  const avg = key => clamp(perQuestion.reduce((s, p) => s + p[key], 0) / n)

  const overallScore = avg('overall')
  const communicationScore = avg('communication')
  const technicalScore = avg('technical')
  const confidenceScore = avg('confidence')

  const chronological = perQuestion.map((p, i) => ({ ...p, question: questions[i], answer: answers[i] }))
  const ranked = [...chronological].sort((a, b) => b.overall - a.overall)

  const strong = ranked.slice(0, Math.min(2, ranked.length))
  const weak = [...ranked].reverse().slice(0, Math.min(2, ranked.length))

  const strengths = strong.map(r =>
    r.overall >= 60
      ? `Solid answer on "${r.question.question}" — clear structure with relevant technical terms.`
      : `Attempted every question with reasonable effort, including "${r.question.question}".`
  )

  const improvements = weak.map(r => {
    if (r.words < 15) return `Your answer to "${r.question.question}" was too short — aim to explain your reasoning, not just state a conclusion.`
    if (r.keywordHits === 0) return `"${r.question.question}" was missing the key concepts an interviewer would expect — review this topic.`
    return `Add more specificity and concrete examples when answering "${r.question.question}".`
  })

  const suggestions = weak.map(r => ({
    question: r.question.question,
    suggestion: r.question.idealPointers,
  }))

  return {
    overallScore,
    communicationScore,
    technicalScore,
    confidenceScore,
    strengths: strengths.length ? strengths : ['You completed the full session — that consistency is itself a strength.'],
    improvements: improvements.length ? improvements : ['Keep practicing to build even more depth in your answers.'],
    suggestions,
    nextSteps: bucketNextSteps(overallScore),
    perQuestion: chronological,
  }
}
