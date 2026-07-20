import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Trophy, ThumbsUp, ThumbsDown, Lightbulb, RotateCcw, History, Award, ListChecks } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useFinalScore } from '../../../../shared/api/hooks'
import { computeRuleBasedScores, buildAttemptSummary, combineFinalScores } from '../engine/scoringEngine'
import { formatElapsed } from '../engine/useSimEngine'
import { SIM_META } from '../engine/simulationConfig'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/ui/shadcn/card'
import { Button } from '../../../../shared/ui/shadcn/button'
import { Badge } from '../../../../shared/ui/shadcn/badge'
import RecruiterReplayView from './RecruiterReplayView'
import CrmCertificate from './CrmCertificate'

const RECOMMENDATION_COLOR = {
  'Strong Hire': 'bg-emerald-100 text-emerald-700',
  Hire: 'bg-emerald-100 text-emerald-700',
  'Leaning Hire': 'bg-amber-100 text-amber-700',
  'No Hire': 'bg-red-100 text-red-700',
}

export default function SimResults({ onReviewStages }) {
  const navigate = useNavigate()
  const state = useCrmSimStore()
  const scores = useCrmSimStore((s) => s.scores)
  const setScores = useCrmSimStore((s) => s.setScores)
  const resetSimulation = useCrmSimStore((s) => s.resetSimulation)
  const { mutateAsync: fetchFinalScore } = useFinalScore()
  const requested = useRef(false)
  const [error, setError] = useState(false)
  const [showReplay, setShowReplay] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)

  useEffect(() => {
    if (scores || requested.current) return
    requested.current = true
    const ruleBased = computeRuleBasedScores(state)

    // Plain awaited promise instead of mutate(vars, {onSuccess, onError}) —
    // those per-call callbacks are dispatched through the mutation observer
    // tied to this render, and React 18 StrictMode's dev-only simulated
    // mount→cleanup→mount on first mount can tear that observer down before
    // the network response arrives. The request still completes (visible in
    // the Network tab) but the callback that would call setScores never
    // fires, leaving the UI stuck on the spinner forever. mutateAsync's
    // returned promise isn't tied to any observer, so it resolves reliably
    // regardless of StrictMode or remounts.
    // Belt-and-suspenders timeout: if the request genuinely hangs (LLM
    // provider outage, network stall) the spinner still can't run forever —
    // fall back to rule-based-only scores after 30s instead.
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('final-score timed out')), 30_000))

    ;(async () => {
      try {
        const llmResult = await Promise.race([
          fetchFinalScore({ allStageData: buildAttemptSummary(state), eventLog: state.eventLog }),
          timeout,
        ])
        setScores(combineFinalScores(ruleBased, llmResult))
      } catch {
        setError(true)
        setScores(combineFinalScores(ruleBased, null))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!scores) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-surface-low">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-sm text-on-surface-variant">Scoring your attempt…</p>
      </div>
    )
  }

  const radarData = Object.entries(scores.categoryScores).map(([key, value]) => ({
    category: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
    score: value,
  }))

  if (showReplay) {
    return <RecruiterReplayView onBack={() => setShowReplay(false)} />
  }

  if (showCertificate) {
    return <CrmCertificate onBack={() => setShowCertificate(false)} />
  }

  return (
    <div className="min-h-screen bg-surface-low py-10">
      <div className="max-w-container mx-auto px-6 space-y-6">
        <div className="text-center">
          <Trophy className="h-10 w-10 text-primary mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">{SIM_META.title} — {SIM_META.company}</p>
          <h1 className="text-4xl font-bold text-on-surface mt-1">Simulation Complete</h1>
          <p className="text-xs text-on-surface-variant mt-1">Completed in {formatElapsed(state.elapsedSeconds)}</p>
          {error && <p className="text-xs text-amber-600 mt-2">AI scoring was unavailable — showing rule-based results only.</p>}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <p className="text-6xl font-bold text-primary">{scores.overall}</p>
              <p className="text-xs text-on-surface-variant mb-4">Overall Score</p>
              <Badge className={`${RECOMMENDATION_COLOR[scores.hiringRecommendation] ?? 'bg-surface-container text-on-surface-variant'} text-sm px-3 py-1`}>
                {scores.hiringRecommendation}
              </Badge>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Skill Breakdown</CardTitle></CardHeader>
            <CardContent className="pt-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="#e5e1e9" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="score" stroke="#312E81" fill="#312E81" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-1.5"><ThumbsUp className="h-4 w-4 text-emerald-600" /> Strengths</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {scores.strengths.length === 0 && <p className="text-sm text-on-surface-variant">No strengths returned.</p>}
              {scores.strengths.map((s, i) => <p key={i} className="text-sm text-on-surface bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">{s}</p>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-1.5"><ThumbsDown className="h-4 w-4 text-red-600" /> Weaknesses</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {scores.weaknesses.length === 0 && <p className="text-sm text-on-surface-variant">No weaknesses returned.</p>}
              {scores.weaknesses.map((s, i) => <p key={i} className="text-sm text-on-surface bg-red-50 border border-red-100 rounded-md px-3 py-2">{s}</p>)}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-1.5"><Lightbulb className="h-4 w-4 text-primary" /> Coaching Notes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {scores.coachingNotes.map((s, i) => (
              <p key={i} className="text-sm text-on-surface-variant leading-relaxed">"{s}"</p>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          <Button onClick={() => setShowCertificate(true)}><Award className="h-4 w-4" /> View Certificate</Button>
          {onReviewStages && (
            <Button variant="outline" onClick={onReviewStages}><ListChecks className="h-4 w-4" /> Review Previous Stages</Button>
          )}
          <Button variant="outline" onClick={() => setShowReplay(true)}><History className="h-4 w-4" /> View Full Replay</Button>
          <Button variant="secondary" onClick={() => { resetSimulation(); navigate('/simulations/sales-crm-sim/overview') }}>
            <RotateCcw className="h-4 w-4" /> Restart Simulation
          </Button>
          <Button variant="ghost" onClick={() => navigate('/simulations')}>Back to Simulations</Button>
        </div>
      </div>
    </div>
  )
}
