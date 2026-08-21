import { useState } from 'react'

// Readiness over time, drawn from the completion log.
//
// Hand-rolled SVG rather than a charting dependency: it is one series of a few
// dozen points, and the app already ships 2.2MB of JS. `vectorEffect` keeps the
// stroke a real 2px while preserveAspectRatio="none" lets the plot stretch to
// whatever width the column gives it.
//
// UserSkill stores a running total with no history, so the server reconstructs
// this by replaying completions against TODAY's award values. That is stated on
// the card, and where it disagrees with the stored balance the difference is
// shown rather than hidden — see the footnote.

const W = 600
const H = 170
const PAD = { top: 14, right: 8, bottom: 22, left: 30 }

export default function ReadinessChart({ history, currentReadiness, roleLabel }) {
  const [hover, setHover] = useState(null)

  if (!history || history.length < 2) {
    return (
      <Frame roleLabel={roleLabel}>
        <p className="py-10 text-center text-sm text-on-surface-variant">
          Your first graded task will start this chart.
        </p>
      </Frame>
    )
  }

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (i) => PAD.left + (i / (history.length - 1)) * plotW
  const y = (v) => PAD.top + plotH - (Math.min(100, v) / 100) * plotH

  const line = history.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.readiness)}`).join(' ')
  const area = `${line} L${x(history.length - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z`

  const last = history[history.length - 1]
  const drift = currentReadiness != null ? last.readiness - currentReadiness : 0

  return (
    <Frame roleLabel={roleLabel}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-44 w-full"
          role="img"
          aria-label={`Readiness rose to ${last.readiness}% across ${history.length - 1} completed tasks`}
        >
          <defs>
            <linearGradient id="gps-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#312E81" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#312E81" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((v) => (
            <line
              key={v}
              x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)}
              stroke="#E5E7EB" strokeWidth="1" vectorEffect="non-scaling-stroke"
              strokeDasharray={v === 0 || v === 100 ? undefined : '3 4'}
            />
          ))}

          <path d={area} fill="url(#gps-area)" />
          <path
            d={line}
            fill="none" stroke="#312E81" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {history.map((p, i) => (
            <g key={i}>
              <circle
                cx={x(i)} cy={y(p.readiness)} r={hover === i ? 4 : 2.5}
                fill="#fff" stroke="#312E81" strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {/* Invisible wide target — 2.5px dots are not a hit area. */}
              <rect
                x={x(i) - plotW / (history.length * 2)} y={0}
                width={plotW / history.length} height={H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          ))}
        </svg>

        {/* Y labels sit outside the stretched SVG so they never distort. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-7 flex-col justify-between pb-6 pt-2 text-[0.6rem] font-semibold tabular-nums text-on-surface-variant">
          <span>100</span><span>50</span><span>0</span>
        </div>

        {hover != null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-border bg-white px-2.5 py-1.5 shadow-panel"
            style={{ left: `${(x(hover) / W) * 100}%`, bottom: '100%' }}
          >
            <p className="whitespace-nowrap text-[0.7rem] font-bold text-on-surface">
              {history[hover].readiness}% readiness
            </p>
            <p className="max-w-[12rem] truncate text-[0.65rem] text-on-surface-variant">
              {history[hover].label}
            </p>
            {history[hover].date && (
              <p className="text-[0.6rem] tabular-nums text-on-surface-variant">{history[hover].date}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
        <span>{history.length - 1} graded tasks · earliest {history[1]?.date ?? '—'}</span>
        <span className="font-semibold text-on-surface">Latest {last.readiness}%</span>
      </div>

      {Math.abs(drift) > 2 && (
        // Honest rather than tidy: the replay and the stored balance can differ
        // when an award was added to a task after a student had already
        // completed it. Saying so is more useful than quietly picking one.
        <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-on-surface-variant">
          This curve replays your completed tasks against today&apos;s awards and reaches{' '}
          <strong className="font-semibold text-on-surface">{last.readiness}%</strong>. Your stored
          balance is <strong className="font-semibold text-on-surface">{currentReadiness}%</strong> —
          points added to a task after you finished it aren&apos;t backfilled.
        </p>
      )}
    </Frame>
  )
}

function Frame({ roleLabel, children }) {
  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <header className="mb-4">
        <h2 className="text-sm font-bold text-on-surface">Readiness over time</h2>
        <p className="text-xs text-on-surface-variant">
          Measured against the {roleLabel} benchmark after each graded task
        </p>
      </header>
      {children}
    </section>
  )
}
