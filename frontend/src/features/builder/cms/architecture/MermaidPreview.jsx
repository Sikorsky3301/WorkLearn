import { useEffect, useState } from 'react'
import mermaid from 'mermaid'
import { cn } from '../../../../lib/cn'

let mermaidReady = false

function ensureMermaid() {
  if (mermaidReady) return
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' })
  mermaidReady = true
}

export async function renderMermaidSvg(source) {
  ensureMermaid()
  const id = `mmd-${Math.random().toString(36).slice(2, 10)}`
  const { svg } = await mermaid.render(id, source)
  return svg
}

/** Strict Mermaid SVG preview. Does not execute click handlers. */
export default function MermaidPreview({ source, className }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!source?.trim()) {
      setSvg('')
      setError('')
      return undefined
    }
    renderMermaidSvg(source)
      .then((next) => {
        if (!cancelled) {
          setSvg(next)
          setError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSvg('')
          setError(err?.message || 'Could not render this diagram.')
        }
      })
    return () => { cancelled = true }
  }, [source])

  if (error) {
    return <p className={cn('text-xs text-red-600 whitespace-pre-wrap', className)}>{error}</p>
  }
  if (!svg) {
    return <p className={cn('text-xs text-on-surface-variant', className)}>No diagram yet — Run to preview.</p>
  }
  return (
    <div
      className={cn('overflow-auto rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-900 p-3 [&_svg]:max-w-full', className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
