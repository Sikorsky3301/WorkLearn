import { useState } from 'react'

// Grade per graded task, in order, against your own running average.
//
// Nothing on the old page showed scores at all — it reported XP, which measures
// volume of work, and never quality of it. A student could see a rising XP bar
// while their grades fell.
//
// Tasks with no score (quizzes, briefs awaiting review) are absent rather than
// plotted as zero, and the card says how many were left out.

const W = 600
const H = 150
const PAD = { top: 12, right: 6, bottom: 8, left: 26 }

export default function ScoreTrend({ trend, periodLabel }) {
  const [hover, setHover] = useState(null)
  const points = trend ?? []

  if (points.length === 0) {
    return (
      <Frame periodLabel={periodLabel}>
        <p className="py-10 text-center text-sm text-on-surface-variant">
          No graded tasks in this period yet.
        </p>
      </Frame>
    )
  }

  const avg = Math.round(points.reduce((a, p) => a + p.score, 0) / points.length)
  const best = Math.max(...points.map((p) => p.score))
  const worst = Math.min(...points.map((p) => p.score))

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  // A single graded task has no line to draw — pin it to the middle so the dot
  // is visible instead of hugging the left edge.
  const x = (i) => (points.length === 1 ? PAD.left + plotW / 2 : PAD.left + (i / (points.length - 1)) * plotW)
  const y = (v) => PAD.top + plotH - (Math.min(100, Math.max(0, v)) / 100) * plotH

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.score)}`).join(' ')

  return (
    <Frame periodLabel={periodLabel} summary={`avg ${avg} · best ${best} · lowest ${worst}`}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-36 w-full" role="img"
          aria-label={`${points.length} graded tasks, average score ${avg} out of 100`}>
          {[0, 50, 100].map((v) => (
            <line key={v} x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)}
              stroke="#E5E7EB" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}

          {/* The average, as the reference every dot is read against. */}
          <line x1={PAD.left} x2={W - PAD.right} y1={y(avg)} y2={y(avg)}
            stroke="#645efb" strokeWidth="1.5" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />

          {points.length > 1 && (
            <path d={line} fill="none" stroke="#312E81" strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          )}

          {points.map((p, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(p.score)} r={hover === i ? 5 : 3.5}
                fill={p.score >= avg ? '#312E81' : '#fff'} stroke="#312E81" strokeWidth="2"
                vectorEffect="non-scaling-stroke" />
              <rect x={x(i) - plotW / (points.length * 2)} y={0}
                width={Math.max(plotW / points.length, 12)} height={H} fill="transparent"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            </g>
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-6 flex-col justify-between pb-2 pt-2 text-[0.6rem] font-semibold tabular-nums text-on-surface-variant">
          <span>100</span><span>50</span><span>0</span>
        </div>

        {hover != null && (
          <div className="pointer-events-none absolute bottom-full mb-1 -translate-x-1/2 rounded-lg border border-border bg-white px-2.5 py-1.5 shadow-panel"
            style={{ left: `${(x(hover) / W) * 100}%` }}>
            <p className="text-[0.7rem] font-bold tabular-nums text-on-surface">{points[hover].score}/100</p>
            <p className="max-w-[12rem] truncate text-[0.65rem] text-on-surface-variant">{points[hover].task}</p>
            <p className="text-[0.6rem] tabular-nums text-on-surface-variant">{points[hover].date}</p>
          </div>
        )}
      </div>

      <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[0.7rem] text-on-surface-variant">
        <span className="inline-block h-0 w-4 border-t-2 border-dashed border-secondary" />
        Your average across these {points.length} graded task{points.length === 1 ? '' : 's'}
      </p>
    </Frame>
  )
}

function Frame({ periodLabel, summary, children }) {
  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-on-surface">Score trend</h2>
          <p className="text-xs text-on-surface-variant">Graded tasks · {periodLabel}</p>
        </div>
        {summary && <p className="text-xs font-semibold tabular-nums text-on-surface">{summary}</p>}
      </header>
      {children}
    </section>
  )
}
