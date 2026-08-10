import { motion, useReducedMotion } from 'motion/react'
import { ArrowUp, ArrowDown, Flame } from 'lucide-react'
import AppWindow from './AppWindow'

// Illustrative sample data.
const KPIS = [
  { label: 'Hours logged', value: '47.5', delta: '+8.2', dir: 'up', sub: 'vs. last 30 days' },
  { label: 'Tasks submitted', value: '23', delta: '+5', dir: 'up', sub: 'across 4 simulations' },
  { label: 'Average score', value: '84%', delta: '+6', dir: 'up', sub: 'first-attempt only' },
  { label: 'Rework rate', value: '18%', delta: '−4', dir: 'down', sub: 'resubmitted tasks' },
]

// Hours per week, most recent last.
const WEEKS = [
  { w: 'W23', hrs: 2.5 }, { w: 'W24', hrs: 4.0 }, { w: 'W25', hrs: 3.0 },
  { w: 'W26', hrs: 6.5 }, { w: 'W27', hrs: 5.0 }, { w: 'W28', hrs: 1.5 },
  { w: 'W29', hrs: 7.0 }, { w: 'W30', hrs: 8.5 }, { w: 'W31', hrs: 6.0 },
  { w: 'W32', hrs: 9.5 }, { w: 'W33', hrs: 7.5 }, { w: 'W34', hrs: 11.0 },
]
const PEAK = Math.max(...WEEKS.map((d) => d.hrs))

// Rolling average score, same 12 weeks — drawn as an SVG polyline.
const SCORES = [61, 64, 63, 69, 72, 70, 75, 78, 77, 81, 83, 84]

const SUBMISSIONS = [
  { task: 'Segment the customer base', sim: 'Junior Data Analyst', when: '2h ago', score: null },
  { task: 'Clean the Q1–Q4 orders export', sim: 'Junior Data Analyst', when: 'Aug 4', score: 92 },
  { task: 'Handle the pricing objection', sim: 'SDR — Nimbus CRM', when: 'Aug 2', score: 76 },
  { task: 'Ship the responsive nav', sim: 'Frontend Developer', when: 'Jul 31', score: 88 },
]

function scoreTone(s) {
  if (s >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (s >= 70) return 'bg-amber-50 text-amber-800 border-amber-200'
  return 'bg-rose-50 text-rose-700 border-rose-200'
}

export default function AnalyticsScreen() {
  const reduceMotion = useReducedMotion()
  const animated = !reduceMotion

  // Map scores onto a 0–100 viewBox, floor 50 so the line uses the full height.
  const points = SCORES.map((s, i) => `${(i / (SCORES.length - 1)) * 100},${100 - ((s - 50) / 40) * 100}`).join(' ')

  return (
    <AppWindow url="worklearn.ai/analytics" active="analytics">
      <div className="h-full flex flex-col p-4 gap-3 overflow-hidden">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-lg border border-border p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-on-surface-variant/70 truncate">
                {k.label}
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono text-[19px] font-extrabold leading-none text-on-surface">{k.value}</span>
                {/* Green either way — a falling rework rate is an improvement,
                    so the arrow shows direction and the colour shows whether
                    that direction is good. */}
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600">
                  {k.dir === 'up' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                  {k.delta}
                </span>
              </div>
              <p className="text-[9px] text-on-surface-variant/70 mt-0.5 truncate">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-3 flex-1 min-h-0">
          {/* Hours per week */}
          <div className="rounded-lg border border-border p-3.5 flex flex-col min-h-0">
            <div className="flex items-baseline justify-between mb-3 shrink-0">
              <p className="text-[10px] font-bold text-on-surface">Hours on task, last 12 weeks</p>
              <span className="flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[9px] font-bold text-orange-700">
                <Flame className="h-2.5 w-2.5" /> 12-day streak
              </span>
            </div>

            <div className="flex-1 min-h-0 flex items-end gap-[5px]">
              {WEEKS.map((d, i) => (
                <div key={d.w} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="font-mono text-[8px] font-bold text-on-surface-variant/60">{d.hrs}</span>
                  {/* Bars grow from the baseline, left to right. The screen is
                      remounted on every step change, so this replays. */}
                  <motion.span
                    initial={animated ? { height: 0 } : false}
                    animate={{ height: `${(d.hrs / PEAK) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.16 + i * 0.025, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full rounded-t-[3px] ${i === WEEKS.length - 1 ? 'bg-orange-500' : 'bg-orange-300'}`}
                  />
                  <span className="font-mono text-[8px] text-on-surface-variant/50">{d.w}</span>
                </div>
              ))}
            </div>

            {/* Score trend */}
            <div className="mt-3 pt-3 border-t border-border shrink-0">
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-on-surface-variant/70">
                  Rolling average score
                </p>
                <span className="font-mono text-[10px] font-bold text-emerald-600">61% → 84%</span>
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
                {/* pathLength normalises the line to 0–1 regardless of its real
                    length, so the draw-on animation is just 0 → 1. */}
                <motion.polyline
                  points={points}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={animated ? { pathLength: 0 } : false}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.75, delay: 0.34, ease: 'easeInOut' }}
                />
              </svg>
            </div>
          </div>

          {/* Recent submissions */}
          <div className="rounded-lg border border-border p-3.5 flex flex-col min-h-0">
            <p className="text-[10px] font-bold text-on-surface mb-2.5 shrink-0">Recent submissions</p>
            <div className="space-y-2 min-h-0">
              {SUBMISSIONS.map((s) => (
                <div key={s.task} className="flex items-start gap-2 pb-2 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-semibold text-on-surface leading-snug truncate">{s.task}</p>
                    <p className="text-[9px] text-on-surface-variant truncate">
                      {s.sim} · {s.when}
                    </p>
                  </div>
                  {s.score === null ? (
                    <span className="shrink-0 rounded border border-border bg-surface-low px-1.5 py-0.5 text-[9px] font-bold text-on-surface-variant">
                      Grading
                    </span>
                  ) : (
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ${scoreTone(s.score)}`}>
                      {s.score}%
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-auto pt-2 text-[9px] text-on-surface-variant/60">
              Every score traces back to the rubric that produced it.
            </p>
          </div>
        </div>
      </div>
    </AppWindow>
  )
}
