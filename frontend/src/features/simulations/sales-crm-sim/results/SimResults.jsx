import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Loader2, ThumbsUp, AlertTriangle, Lightbulb, RotateCcw, History,
  Award, ListChecks, PartyPopper, Sparkles,
} from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useFinalScore } from '../../../../shared/api/hooks'
import { computeRuleBasedScores, buildAttemptSummary, combineFinalScores } from '../engine/scoringEngine'
import { formatElapsed } from '../engine/useSimEngine'
import { SIM_META } from '../engine/simulationConfig'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/ui/shadcn/card'
import { Button } from '../../../../shared/ui/shadcn/button'
import { Badge } from '../../../../shared/ui/shadcn/badge'
import { cn } from '../../../../shared/utils/cn'
import RecruiterReplayView from './RecruiterReplayView'
import CrmCertificate from './CrmCertificate'

const RECOMMENDATION_STYLE = {
  'Strong Hire': { color: 'bg-emerald-100 text-emerald-700', ring: '#059669' },
  Hire: { color: 'bg-emerald-100 text-emerald-700', ring: '#059669' },
  'Leaning Hire': { color: 'bg-amber-100 text-amber-700', ring: '#d97706' },
  'No Hire': { color: 'bg-red-100 text-red-700', ring: '#dc2626' },
}

const CATEGORY_COLOR = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#6366f1', '#64748b', '#312E81']

function useCountUp(target, durationMs = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    function tick(now) {
      const pct = Math.min(1, (now - start) / durationMs)
      setValue(Math.round(target * (1 - Math.pow(1 - pct, 3)))) // ease-out cubic
      if (pct < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return value
}

function ScoreRing({ value, ringColor }) {
  const animated = useCountUp(value)
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - animated / 100)
  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#eae7ef" strokeWidth="14" />
        <circle
          cx="80" cy="80" r={radius} fill="none" stroke={ringColor} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-on-surface tabular-nums">{animated}</span>
        <span className="text-[11px] text-on-surface-variant">Overall Score</span>
      </div>
    </div>
  )
}

const stagger = { animate: { transition: { staggerChildren: 0.06 } } }
const fadeUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

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

  if (showReplay) {
    return <RecruiterReplayView onBack={() => setShowReplay(false)} />
  }

  if (showCertificate) {
    return <CrmCertificate onBack={() => setShowCertificate(false)} />
  }

  const radarData = Object.entries(scores.categoryScores).map(([key, value]) => ({
    category: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
    score: value,
  }))
  const recommendation = RECOMMENDATION_STYLE[scores.hiringRecommendation] ?? { color: 'bg-surface-container text-on-surface-variant', ring: '#312E81' }

  return (
    <div className="min-h-screen bg-surface-low py-10">
      <div className="max-w-container mx-auto px-6 space-y-6">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white text-center px-6 py-10"
        >
          <div className="absolute -top-16 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <PartyPopper className="h-8 w-8 mx-auto mb-2 opacity-90" />
            <p className="text-xs font-semibold text-blue-100 uppercase tracking-widest">{SIM_META.title} — {SIM_META.company}</p>
            <h1 className="text-3xl sm:text-4xl font-bold mt-1">Simulation Complete</h1>
            <p className="text-xs text-blue-100 mt-1">Completed in {formatElapsed(state.elapsedSeconds)}</p>
            {error && (
              <p className="text-xs text-amber-200 mt-2 inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AI scoring was unavailable — showing rule-based results only.
              </p>
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ duration: 0.35, delay: 0.1 }} className="lg:col-span-1">
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                <ScoreRing value={scores.overall} ringColor={recommendation.ring} />
                <Badge className={cn(recommendation.color, 'text-sm px-3 py-1 mt-4')}>
                  {scores.hiringRecommendation}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ duration: 0.35, delay: 0.15 }} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader><CardTitle>Skill Breakdown</CardTitle></CardHeader>
              <CardContent className="pt-2 grid sm:grid-cols-2 gap-4 items-center">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="75%">
                      <PolarGrid stroke="#e5e1e9" />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 9 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar dataKey="score" stroke="#312E81" fill="#312E81" fillOpacity={0.35} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5">
                  {radarData.map((d, i) => (
                    <div key={d.category}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-on-surface-variant">{d.category}</span>
                        <span className="font-semibold text-on-surface">{d.score}</span>
                      </div>
                      <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: CATEGORY_COLOR[i % CATEGORY_COLOR.length] }}
                          initial={{ width: 0 }} animate={{ width: `${d.score}%` }} transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial="initial" animate="animate" variants={stagger} transition={{ delay: 0.2 }}>
            <Card className="h-full">
              <CardHeader><CardTitle className="flex items-center gap-1.5"><ThumbsUp className="h-4 w-4 text-emerald-600" /> Strengths</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {scores.strengths.length === 0 && <p className="text-sm text-on-surface-variant">No strengths returned.</p>}
                {scores.strengths.map((s, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-lg px-3.5 py-2.5">
                    <ThumbsUp className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-on-surface leading-snug">{s}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial="initial" animate="animate" variants={stagger} transition={{ delay: 0.25 }}>
            <Card className="h-full">
              <CardHeader><CardTitle className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-600" /> Growth Areas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {scores.weaknesses.length === 0 && <p className="text-sm text-on-surface-variant">No weaknesses returned.</p>}
                {scores.weaknesses.map((s, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-lg px-3.5 py-2.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-on-surface leading-snug">{s}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial="initial" animate="animate" variants={stagger} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-1.5"><Lightbulb className="h-4 w-4 text-primary" /> Coaching Notes</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {scores.coachingNotes.map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="flex items-start gap-3 bg-primary/5 border border-primary/10 rounded-lg px-3.5 py-3">
                  <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{s}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-3 pt-2 flex-wrap"
        >
          <Button onClick={() => setShowCertificate(true)} className="bg-blue-600 hover:bg-blue-700">
            <Award className="h-4 w-4" /> View Certificate
          </Button>
          {onReviewStages && (
            <Button variant="outline" onClick={onReviewStages}><ListChecks className="h-4 w-4" /> Review Previous Stages</Button>
          )}
          <Button variant="outline" onClick={() => setShowReplay(true)}><History className="h-4 w-4" /> View Full Replay</Button>
          <Button variant="secondary" onClick={() => { resetSimulation(); navigate('/simulations/sales-crm-sim/overview') }}>
            <RotateCcw className="h-4 w-4" /> Restart Simulation
          </Button>
          <Button variant="ghost" onClick={() => navigate('/simulations')}>Back to Simulations</Button>
        </motion.div>
      </div>
    </div>
  )
}
