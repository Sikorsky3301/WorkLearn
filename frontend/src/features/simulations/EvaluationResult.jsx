import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const evalData = {
  'q3-systems': {
    title: 'Q3 Systems Optimization',
    simulation: 'Enterprise Cloud Integration',
    submittedAt: 'Today, 11:42 AM',
    evaluator: 'AI Evaluator',
    totalScore: 94,
    xpEarned: 320,
    rubric: [
      { criterion: 'Problem Framing', score: 4, max: 5, feedback: 'Strong situational context with clear problem boundaries. Could be sharper on the business impact quantification.' },
      { criterion: 'Stakeholder Alignment', score: 5, max: 5, feedback: 'Excellent — correctly identified all key stakeholders and addressed each concern individually.' },
      { criterion: 'Risk Identification', score: 4, max: 5, feedback: 'Identified the top 3 technical risks. Missed the compliance risk around PII in the legacy billing tables.' },
      { criterion: 'Migration Plan Quality', score: 5, max: 5, feedback: 'The phased rollout approach with feature flags and rollback triggers is exactly right. Well structured.' },
      { criterion: 'Communication Clarity', score: 4, max: 5, feedback: 'Executive summary was clear and concise. Technical sections assumed too much background for a mixed audience.' },
    ],
    strengths: [
      'Correctly structured the roll-back plan before starting the migration window',
      'Proactively addressed the CTO\'s concern about QA phases',
      'Used data from the stakeholder messages to prioritize task sequencing',
    ],
    improvements: [
      'Include a compliance risk register — especially for PII in legacy billing tables',
      'Quantify the business impact of each risk (revenue at risk, affected users)',
      'Executive summary should be written for a non-technical audience first',
    ],
    skillDeltas: [
      { skill: 'Risk Management', before: 62, after: 78, color: 'bg-indigo-500' },
      { skill: 'Stakeholder Communication', before: 71, after: 84, color: 'bg-violet-500' },
      { skill: 'Technical Planning', before: 55, after: 69, color: 'bg-blue-500' },
      { skill: 'Executive Presence', before: 68, after: 72, color: 'bg-teal-500' },
    ],
    submission: `Phase 1 — Discovery & Risk Assessment

I reviewed the API documentation and identified three critical issues with the B3 Legacy system:
1. Non-standard XML TransactionWrapper tag requires custom parsing logic
2. The 3-week QA phase must be embedded in the migration timeline before the Q3 window
3. CPU spikes in /var/legacy/ must be resolved before any data migration begins

Phase 2 — Risk Mitigation Plan

Primary risks identified:
- Migration window overlap with billing cycle (HIGH — defer to week of Oct 14)
- Rollback trigger: if error rate exceeds 0.5%, auto-revert to B3 Legacy within 15 minutes
- Customer communication plan drafted for 4,200 enterprise users

Phase 3 — Stakeholder Actions

CTO (Elena Vasco): Timeline updated to include 3-week QA phase. Confirmed with Engineering Lead.
Engineering Lead (Marcus Chen): Escalated CPU spike investigation — awaiting resolution ETA.
Product Director (David Miller): Legacy UI for internal billing users preserved via feature flag.`,
  },
}

const scoreColor = (pct) => {
  if (pct >= 90) return 'text-green-600'
  if (pct >= 75) return 'text-blue-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-red-600'
}

const scoreLabel = (pct) => {
  if (pct >= 90) return 'Excellent'
  if (pct >= 75) return 'Proficient'
  if (pct >= 60) return 'Adequate'
  return 'Needs Work'
}

export default function EvaluationResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('feedback')
  const [showResubmit, setShowResubmit] = useState(false)

  const data = evalData[id] || evalData['q3-systems']
  const pct = Math.round((data.rubric.reduce((s, r) => s + r.score, 0) / data.rubric.reduce((s, r) => s + r.max, 0)) * 100)
  const circum = 2 * Math.PI * 40

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-5">
        <button onClick={() => navigate('/simulations')} className="hover:text-primary">Simulations</button>
        <span>/</span>
        <span>{data.simulation}</span>
        <span>/</span>
        <span className="text-on-surface font-medium">Evaluation Result</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{data.title}</h1>
          <p className="text-sm text-on-surface-variant mt-1">Evaluated by {data.evaluator} · Submitted {data.submittedAt}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/simulations')} className="btn-secondary text-xs px-4 py-2">← Back to Workspace</button>
          <button onClick={() => setShowResubmit(true)} className="btn-primary text-xs px-4 py-2">Re-submit Improved Version</button>
        </div>
      </div>

      {/* Score summary */}
      <div className="card mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-8">
          {/* Donut */}
          <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
            <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
              <circle cx="48" cy="48" r="40" fill="none" stroke="#312E81" strokeWidth="10"
                strokeDasharray={`${circum * pct / 100} ${circum}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${scoreColor(pct)}`}>{pct}%</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-lg font-bold ${scoreColor(pct)}`}>{scoreLabel(pct)}</span>
              <span className="chip bg-green-100 text-green-700 font-semibold">+{data.xpEarned} XP</span>
            </div>
            <p className="text-sm text-on-surface-variant mb-3">{data.simulation} — scored {data.rubric.reduce((s, r) => s + r.score, 0)} / {data.rubric.reduce((s, r) => s + r.max, 0)} points across {data.rubric.length} criteria</p>
            <div className="flex gap-2">
              {data.rubric.map(r => (
                <div key={r.criterion} className="text-center">
                  <div className={`text-xs font-bold ${r.score === r.max ? 'text-green-600' : 'text-on-surface-variant'}`}>{r.score}/{r.max}</div>
                  <div className="text-[10px] text-on-surface-variant leading-none mt-0.5 w-20 truncate">{r.criterion}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill deltas */}
          <div className="shrink-0 w-56 space-y-2">
            <p className="text-xs font-semibold text-on-surface-variant mb-2">Skills Improved</p>
            {data.skillDeltas.map(s => (
              <div key={s.skill}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-on-surface-variant">{s.skill}</span>
                  <span className="text-xs font-semibold text-green-600">+{s.after - s.before}</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden relative">
                  <div className="h-full bg-surface-high rounded-full absolute" style={{ width: `${s.before}%` }} />
                  <div className={`h-full ${s.color} rounded-full absolute transition-all`} style={{ width: `${s.after}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-5">
        {[
          { key: 'feedback', label: 'AI Feedback & Rubric' },
          { key: 'submission', label: 'Your Submission' },
          { key: 'benchmark', label: 'Benchmark Comparison' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Feedback tab */}
      {activeTab === 'feedback' && (
        <div className="grid grid-cols-3 gap-5">
          {/* Rubric */}
          <div className="col-span-2 space-y-3">
            <h2 className="text-sm font-bold text-on-surface mb-3">Rubric Breakdown</h2>
            {data.rubric.map((r, i) => (
              <div key={i} className="card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-on-surface">{r.criterion}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: r.max }).map((_, j) => (
                        <div key={j} className={`w-5 h-5 rounded ${j < r.score ? 'bg-primary' : 'bg-surface-high'}`} />
                      ))}
                    </div>
                    <span className={`text-sm font-bold ${r.score === r.max ? 'text-green-600' : r.score >= r.max * 0.7 ? 'text-blue-600' : 'text-amber-600'}`}>{r.score}/{r.max}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-border rounded-full mb-2">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(r.score / r.max) * 100}%` }} />
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{r.feedback}</p>
              </div>
            ))}
          </div>

          {/* Strengths & improvements */}
          <div className="space-y-4">
            <div className="card border-green-200 bg-green-50/50">
              <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Strengths
              </p>
              <ul className="space-y-2">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-on-surface-variant leading-snug flex items-start gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0 mt-1" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card border-amber-200 bg-amber-50/50">
              <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Areas to Improve
              </p>
              <ul className="space-y-2">
                {data.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-on-surface-variant leading-snug flex items-start gap-1.5">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-1" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <p className="text-xs font-bold text-on-surface mb-3">Recommended Next Steps</p>
              <div className="space-y-2">
                <button onClick={() => navigate('/ai-mentor')} className="w-full text-left p-2.5 bg-surface-low rounded-lg border border-border hover:border-primary transition-colors">
                  <p className="text-xs font-semibold text-on-surface">Discuss with AI Mentor</p>
                  <p className="text-xs text-on-surface-variant">Book a session to work through your weak areas</p>
                </button>
                <button onClick={() => navigate('/simulations')} className="w-full text-left p-2.5 bg-surface-low rounded-lg border border-border hover:border-primary transition-colors">
                  <p className="text-xs font-semibold text-on-surface">Revisit the Job Simulation</p>
                  <p className="text-xs text-on-surface-variant">Review your tasks and retry weaker areas</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission tab */}
      {activeTab === 'submission' && (
        <div className="card max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-on-surface">Your Submitted Response</p>
            <span className="chip text-xs">{data.submittedAt}</span>
          </div>
          <pre className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap font-sans bg-surface-low border border-border rounded-lg p-4">
            {data.submission}
          </pre>
        </div>
      )}

      {/* Benchmark tab */}
      {activeTab === 'benchmark' && (
        <div className="space-y-4 max-w-2xl">
          <div className="card">
            <h3 className="text-sm font-bold text-on-surface mb-4">Your Score vs. Cohort</h3>
            {[
              { label: 'Your Score', pct: 94, color: 'bg-primary', highlight: true },
              { label: 'Cohort Average', pct: 78, color: 'bg-blue-400' },
              { label: 'Top 10%', pct: 96, color: 'bg-green-500' },
              { label: 'Passing Threshold', pct: 70, color: 'bg-amber-400' },
            ].map(row => (
              <div key={row.label} className={`mb-3 p-2.5 rounded-lg ${row.highlight ? 'bg-primary/5 border border-primary/20' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${row.highlight ? 'text-primary' : 'text-on-surface-variant'}`}>{row.label}</span>
                  <span className={`text-xs font-bold ${row.highlight ? 'text-primary' : 'text-on-surface-variant'}`}>{row.pct}%</span>
                </div>
                <div className="h-2 bg-border rounded-full">
                  <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-on-surface-variant mt-2">You scored in the <span className="font-bold text-primary">top 8%</span> of all learners who attempted this evaluation.</p>
          </div>
        </div>
      )}

      {/* Resubmit modal */}
      {showResubmit && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowResubmit(false)}>
          <div className="bg-white rounded-xl border border-border p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-on-surface mb-2">Re-submit Improved Version</h2>
            <p className="text-sm text-on-surface-variant mb-4">Address the feedback above and submit an improved response. This will replace your current submission and be re-evaluated.</p>
            <textarea rows={8} placeholder="Paste your improved response here..." className="input resize-none text-sm w-full mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowResubmit(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={() => setShowResubmit(false)} className="btn-primary text-sm px-4 py-2">Submit for Re-evaluation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
