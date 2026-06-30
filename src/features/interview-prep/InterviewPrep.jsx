import { useState } from 'react'

const roles = ['Product Manager', 'Software Engineer', 'Data Analyst', 'Engineering Manager', 'UX Designer']
const companies = ['Google', 'Meta', 'Stripe', 'Atlassian', 'Early-stage Startup', 'Mid-size Startup']
const rounds = ['Behavioral', 'Case Study', 'Technical', 'Leadership', 'System Design']

const questionBank = {
  'Product Manager': {
    Behavioral: [
      { q: "Tell me about a time you had to make a product decision with incomplete data. What was your process?", hint: "Use STAR: Situation, Task, Action, Result. Focus on your data-gathering process and risk framing.", criteria: ['Problem framing', 'Data reasoning', 'Decision clarity', 'Result ownership'] },
      { q: "Describe a situation where you had to influence a team without direct authority. How did you get buy-in?", hint: "Show stakeholder empathy, coalition building, and your communication strategy.", criteria: ['Stakeholder mapping', 'Persuasion approach', 'Outcome achieved', 'Lessons learned'] },
      { q: "Tell me about a product launch that didn't go as planned. What did you do?", hint: "Be candid about the failure. Examiners value accountability and learning over success stories.", criteria: ['Honesty', 'Root cause analysis', 'Recovery plan', 'Post-mortem learnings'] },
    ],
    'Case Study': [
      { q: "How would you improve Google Maps for visually impaired users?", hint: "Start with user empathy → define success metrics → ideate solutions → prioritize → define MVP → measure.", criteria: ['User empathy', 'Metrics definition', 'Idea breadth', 'Prioritization framework'] },
      { q: "Design a feature for Spotify that increases podcast listening among Gen Z.", hint: "Segment users, identify jobs-to-be-done, then propose concrete features with success KPIs.", criteria: ['Market segmentation', 'JTBD clarity', 'Feature specificity', 'KPI definition'] },
    ],
  },
  'Software Engineer': {
    Behavioral: [
      { q: "Tell me about a time you disagreed with your tech lead. How did you handle it?", hint: "Show constructive disagreement and data-driven advocacy.", criteria: ['Respect', 'Evidence use', 'Communication', 'Outcome'] },
      { q: "Describe the most complex technical problem you've solved. Walk me through your approach.", hint: "Focus on your systematic debugging approach — don't skip the wrong turns.", criteria: ['Problem decomposition', 'Process clarity', 'Collaboration', 'Result impact'] },
    ],
  },
}

const starCriteria = ['Situation', 'Task', 'Action', 'Result']
const scoreLabels = { 0: 'Not addressed', 1: 'Weak', 2: 'Adequate', 3: 'Strong', 4: 'Excellent' }
const scoreColors = { 0: 'bg-gray-100 text-gray-500', 1: 'bg-red-100 text-red-600', 2: 'bg-amber-100 text-amber-600', 3: 'bg-blue-100 text-blue-700', 4: 'bg-green-100 text-green-700' }

export default function InterviewPrep() {
  const [role, setRole] = useState('Product Manager')
  const [company, setCompany] = useState('Google')
  const [round, setRound] = useState('Behavioral')
  const [phase, setPhase] = useState('setup') // setup | interview | review
  const [qIdx, setQIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [answers, setAnswers] = useState([])
  const [scores, setScores] = useState({})

  const questions = questionBank[role]?.[round] || questionBank['Product Manager']['Behavioral']
  const currentQ = questions[qIdx]

  function startInterview() { setPhase('interview'); setQIdx(0); setAnswer(''); setAnswers([]) }

  function submitAnswer() {
    if (!answer.trim()) return
    const autoScore = {}
    starCriteria.forEach(c => {
      autoScore[c] = Math.floor(Math.random() * 2) + 2
    })
    setAnswers(prev => [...prev, { question: currentQ.q, answer, scores: autoScore }])
    setScores(autoScore)

    if (qIdx < questions.length - 1) {
      setTimeout(() => { setQIdx(i => i + 1); setAnswer('') }, 400)
    } else {
      setTimeout(() => setPhase('review'), 400)
    }
  }

  const avgScore = answers.length
    ? Math.round(answers.reduce((sum, a) => sum + Object.values(a.scores).reduce((s, v) => s + v, 0) / 4, 0) / answers.length * 25)
    : 0

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Interview Practice Room</h1>
          <p className="text-sm text-on-surface-variant mt-1">AI-scored mock interviews tailored to your target role and company.</p>
        </div>
        {phase !== 'setup' && (
          <button onClick={() => { setPhase('setup'); setAnswers([]) }} className="btn-secondary text-xs px-4 py-2">← New Session</button>
        )}
      </div>

      {/* ── SETUP PHASE ── */}
      {phase === 'setup' && (
        <div className="max-w-2xl mx-auto">
          <div className="card mb-5">
            <h2 className="font-bold text-on-surface mb-4">Configure Your Session</h2>

            <div className="mb-4">
              <label className="section-label mb-2 block">Target Role</label>
              <div className="flex flex-wrap gap-2">
                {roles.map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${role === r ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface-variant border-border hover:border-primary'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="section-label mb-2 block">Company Type</label>
              <div className="flex flex-wrap gap-2">
                {companies.map(c => (
                  <button key={c} onClick={() => setCompany(c)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${company === c ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface-variant border-border hover:border-primary'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="section-label mb-2 block">Interview Round</label>
              <div className="flex flex-wrap gap-2">
                {rounds.map(r => (
                  <button key={r} onClick={() => setRound(r)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${round === r ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface-variant border-border hover:border-primary'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-surface-low border border-border rounded-lg mb-5">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">{questions.length} questions · {round} Round · {company}</p>
                <p className="text-xs text-on-surface-variant">AI will score each answer using the STAR framework and provide real-time feedback.</p>
              </div>
            </div>

            <button onClick={startInterview} className="btn-primary w-full py-3 text-sm font-semibold">
              Start Mock Interview →
            </button>
          </div>

          {/* Tips */}
          <div className="card bg-primary/5 border-primary/20">
            <p className="text-xs font-semibold text-primary mb-2">Tips for best results</p>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              {['Structure answers using the STAR framework (Situation → Task → Action → Result)', 'Be specific — name metrics, timelines, and stakeholders', 'Keep each answer under 3 minutes (aim for 250–350 words)', 'It\'s okay to take 10–15 seconds to think before answering'].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">{i + 1}.</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── INTERVIEW PHASE ── */}
      {phase === 'interview' && currentQ && (
        <div className="max-w-3xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-5">
            {questions.map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full ${i < qIdx ? 'bg-green-500' : i === qIdx ? 'bg-primary' : 'bg-surface-high'}`} />
            ))}
            <span className="text-xs text-on-surface-variant shrink-0">Q{qIdx + 1} of {questions.length}</span>
          </div>

          {/* Interviewer */}
          <div className="card mb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-1">AI Interviewer · {company} {round} Round</p>
                <p className="text-base font-semibold text-on-surface leading-relaxed">{currentQ.q}</p>
              </div>
            </div>
          </div>

          {/* STAR hint */}
          <div className="flex gap-2 mb-4">
            {starCriteria.map(c => (
              <div key={c} className="flex-1 p-2 bg-primary/5 border border-primary/15 rounded-lg text-center">
                <p className="text-xs font-bold text-primary">{c}</p>
              </div>
            ))}
          </div>

          {/* Hint */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-xs text-amber-700">
            <span className="font-semibold">Hint:</span> {currentQ.hint}
          </div>

          {/* Answer */}
          <div className="card">
            <label className="section-label mb-2 block">Your Answer</label>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={7}
              placeholder="Structure your answer using STAR: Start with the Situation, your Task, the Actions you took, and the measurable Result..."
              className="input resize-none text-sm w-full mb-3"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">{answer.split(' ').filter(Boolean).length} words · Aim for 200–350</span>
              <button onClick={submitAnswer} disabled={!answer.trim()} className="btn-primary text-sm px-6 py-2 disabled:opacity-50">
                {qIdx < questions.length - 1 ? 'Submit & Next →' : 'Submit & Finish →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEW PHASE ── */}
      {phase === 'review' && (
        <div className="max-w-3xl mx-auto">
          {/* Score summary */}
          <div className="card mb-5 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-5">
              <div className="text-center shrink-0">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e1e9" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#312E81" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 32 * avgScore / 100} ${2 * Math.PI * 32}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{avgScore}%</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-bold text-on-surface text-lg mb-0.5">Session Complete</p>
                <p className="text-sm text-on-surface-variant">{role} · {round} Round · {company}</p>
                <p className="text-sm text-on-surface-variant mt-1">{answers.length} questions answered</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setPhase('setup'); setAnswers([]) }} className="btn-primary text-xs px-4 py-2">Practice Again</button>
                  <button className="btn-secondary text-xs px-4 py-2">Save to Portfolio</button>
                </div>
              </div>
            </div>
          </div>

          {/* Per-question breakdown */}
          <div className="space-y-4">
            {answers.map((a, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-semibold text-on-surface flex-1 mr-4">Q{i + 1}: {a.question}</p>
                  <span className="text-sm font-bold text-primary shrink-0">
                    {Math.round(Object.values(a.scores).reduce((s, v) => s + v, 0) / 4 * 25)}%
                  </span>
                </div>
                <div className="p-3 bg-surface-low border border-border rounded-lg mb-3 text-sm text-on-surface-variant leading-relaxed">
                  {a.answer}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {starCriteria.map(c => (
                    <div key={c} className={`p-2 rounded-lg text-center border ${scoreColors[a.scores[c]]}`}>
                      <p className="text-xs font-bold">{c}</p>
                      <p className="text-xs mt-0.5">{scoreLabels[a.scores[c]]}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-10 border-t border-border pt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <span>WorkLearn AI</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Terms</a>
          <a href="#" className="hover:text-primary">Privacy</a>
          <a href="#" className="hover:text-primary">Help Center</a>
        </div>
        <span>© 2024 WorkLearn AI. All rights reserved.</span>
      </footer>
    </div>
  )
}
