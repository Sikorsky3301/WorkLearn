import { useMemo, useRef, useState } from 'react'
import { useTheme } from '../../shared/design-system/theme/useTheme'

const WIDTH = 640
const HEIGHT = 200
const PAD = { top: 16, right: 16, bottom: 8, left: 44 }

function niceMax(value) {
  if (value <= 0) return 10
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  let niceNormalized
  if (normalized <= 1) niceNormalized = 1
  else if (normalized <= 2) niceNormalized = 2
  else if (normalized <= 5) niceNormalized = 5
  else niceNormalized = 10
  return niceNormalized * magnitude
}

/** Single-series cumulative-user-growth line chart. No legend (one series —
 * the subtitle names it), 2px round-cap line, hairline recessive gridlines,
 * crosshair+tooltip on hover, direct end-label, and a table-view toggle so
 * every value stays reachable without hovering. */
export default function GrowthChart({ data }) {
  const { theme } = useTheme()
  const [hoverIdx, setHoverIdx] = useState(null)
  const [showTable, setShowTable] = useState(false)
  const svgRef = useRef(null)

  const lineColor = theme === 'dark' ? '#818cf8' : '#312E81'
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0'
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b'
  const ringColor = theme === 'dark' ? '#0f172a' : '#ffffff'

  const points = data ?? []
  const maxY = useMemo(() => niceMax(Math.max(1, ...points.map((p) => p.cumulative_users))), [points])

  const innerW = WIDTH - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom

  const xFor = (i) => PAD.left + (points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2)
  const yFor = (v) => PAD.top + innerH - (v / maxY) * innerH

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.cumulative_users)}`).join(' ')
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxY * f))

  function handleMove(e) {
    if (!svgRef.current || points.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH
    const idx = Math.round(((x - PAD.left) / innerW) * (points.length - 1))
    setHoverIdx(Math.max(0, Math.min(points.length - 1, idx)))
  }

  if (points.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-10">Not enough data yet for this range.</p>
  }

  const last = points[points.length - 1]
  const hovered = hoverIdx != null ? points[hoverIdx] : null

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">User growth — cumulative</p>
        <button onClick={() => setShowTable((v) => !v)} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
          {showTable ? 'Show chart' : 'View as table'}
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                <th className="text-left py-1.5 text-slate-500 dark:text-slate-400 font-semibold">Date</th>
                <th className="text-right py-1.5 text-slate-500 dark:text-slate-400 font-semibold">New users</th>
                <th className="text-right py-1.5 text-slate-500 dark:text-slate-400 font-semibold">Cumulative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {points.map((p) => (
                <tr key={p.date}>
                  <td className="py-1.5 text-slate-700 dark:text-slate-300">{p.date}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{p.new_users}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{p.cumulative_users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-auto"
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {yTicks.map((t) => (
              <line key={t} x1={PAD.left} x2={WIDTH - PAD.right} y1={yFor(t)} y2={yFor(t)} stroke={gridColor} strokeWidth="1" />
            ))}
            {yTicks.map((t) => (
              <text key={`label-${t}`} x={PAD.left - 8} y={yFor(t) + 3} textAnchor="end" fontSize="9" fill={textColor}>
                {t.toLocaleString()}
              </text>
            ))}

            {hoverIdx != null && (
              <line x1={xFor(hoverIdx)} x2={xFor(hoverIdx)} y1={PAD.top} y2={PAD.top + innerH} stroke={gridColor} strokeWidth="1" />
            )}

            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            <circle cx={xFor(points.length - 1)} cy={yFor(last.cumulative_users)} r="5" fill={ringColor} />
            <circle cx={xFor(points.length - 1)} cy={yFor(last.cumulative_users)} r="4" fill={lineColor} />
            <text x={xFor(points.length - 1) - 6} y={yFor(last.cumulative_users) - 10} textAnchor="end" fontSize="11" fontWeight="600" fill={textColor}>
              {last.cumulative_users.toLocaleString()}
            </text>

            {hoverIdx != null && (
              <circle cx={xFor(hoverIdx)} cy={yFor(points[hoverIdx].cumulative_users)} r="4" fill={lineColor} stroke={ringColor} strokeWidth="2" />
            )}
          </svg>

          {hovered && (
            <div
              className="absolute top-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-2.5 py-1.5 text-xs pointer-events-none whitespace-nowrap"
              style={{ left: `${(xFor(hoverIdx) / WIDTH) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <p className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{hovered.cumulative_users.toLocaleString()} users</p>
              <p className="text-slate-500 dark:text-slate-400">{hovered.date} · +{hovered.new_users} new</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
