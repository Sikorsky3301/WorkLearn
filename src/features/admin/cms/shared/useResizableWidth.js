import { useCallback, useRef, useState } from 'react'

/** Vanilla mousedown/mousemove/mouseup drag-to-resize, adapted from the
 * height-resize pattern in JupyterPlayground.jsx (lines 354-372) to width.
 * `reverse: true` flips delta direction for a handle on a column's LEFT edge
 * (dragging left should still grow that column). */
export function useResizableWidth({ initial, min, max, reverse = false }) {
  const [width, setWidth] = useState(initial)
  const resizingRef = useRef(false)

  const startResize = useCallback((e) => {
    e.preventDefault()
    resizingRef.current = true
    const startX = e.clientX
    const startWidth = width
    const onMove = (moveEvent) => {
      if (!resizingRef.current) return
      const rawDelta = moveEvent.clientX - startX
      const delta = reverse ? -rawDelta : rawDelta
      setWidth(Math.min(max, Math.max(min, startWidth + delta)))
    }
    const onUp = () => {
      resizingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [width, min, max, reverse])

  return [width, startResize]
}
