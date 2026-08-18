import { useCallback, useEffect, useRef, useState } from 'react'

// Draggable dividers for the workbench panes.
//
// Pointer events rather than mouse events, so a pen or a touch drag works the
// same as a mouse — and `setPointerCapture` means the drag keeps tracking even
// when the cursor outruns the 6px handle, which is most of the time. Without
// capture, a fast drag leaves the handle behind and the pane stops following
// the cursor, which feels broken.
//
// The value is owned by the caller (a width or height in px) so it can be
// persisted and applied to a CSS grid template; this component only reports
// where the divider should now be.

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

/** Layout sizes, remembered per browser.
 *
 * People set a workbench up once — a wide brief while reading, a tall console
 * while debugging — and resetting it on every task would make the feature
 * annoying enough to ignore. Guarded because Safari's private mode throws on
 * localStorage access rather than returning null. */
export function usePersistentSize(key, initial) {
  const [size, setSize] = useState(() => {
    try {
      const stored = Number(window.localStorage.getItem(key))
      return Number.isFinite(stored) && stored > 0 ? stored : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, String(size))
    } catch { /* storage unavailable — the layout just won't persist */ }
  }, [key, size])

  return [size, setSize]
}

/** The live size of an element, via ResizeObserver.
 *
 * Needed because a divider's sensible maximum depends on how much room there
 * actually is: a stored 760px rail is fine on a desktop and leaves nothing for
 * the editor on a small laptop, and the same applies to console height on a
 * short window. Watching the container means each limit follows the window
 * instead of being guessed once at design time.
 *
 * Returns a CALLBACK ref, not a useRef object, and that distinction matters
 * here. The elements it watches live past several early returns, so they
 * aren't mounted on the first commit — and an effect keyed on a ref object
 * would run once against `null` and never re-run, because the ref's identity
 * never changes. Holding the node in state re-runs the effect the moment it
 * appears.
 *
 * @returns [refCallback, { width, height }]
 */
export function useElementSize() {
  const [node, setNode] = useState(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!node || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      // Guarded so a resize that changes only one axis doesn't re-render every
      // consumer of the other.
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return [setNode, size]
}

/** The largest a pane may be while leaving its sibling `minSibling`.
 *
 * `available` is 0 until ResizeObserver first reports, so `fallback` covers
 * the frame before measurement. The `Math.max` matters on very small
 * containers, where the two constraints genuinely conflict: the pane's own
 * minimum wins and the layout's `overflow-hidden` clips, rather than a
 * negative maximum inverting the clamp and pinning the divider to the wrong
 * edge. */
export function maxForPane({ available, minSibling, minSelf, fallback }) {
  return available ? Math.max(minSelf, available - minSibling) : fallback
}

/**
 * @param orientation 'vertical' = a vertical bar dragged left/right (resizes a
 *                    width); 'horizontal' = a bar dragged up/down (a height).
 * @param invert      true when growing the pane means moving the pointer
 *                    *against* the axis — e.g. the console sits below its
 *                    handle, so dragging up makes it taller.
 */
export default function SplitHandle({
  orientation, value, min, max, onChange, label, invert = false, tone = 'light',
  className = '',
}) {
  const isVertical = orientation === 'vertical'
  const drag = useRef(null)
  const [active, setActive] = useState(false)

  const apply = useCallback((next) => onChange(clamp(next, min, max)), [onChange, min, max])

  const onPointerDown = (e) => {
    // Stops the browser turning the drag into a text selection across the
    // editor, which leaves everything highlighted when you let go.
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { origin: isVertical ? e.clientX : e.clientY, initial: value }
    setActive(true)
  }

  const onPointerMove = (e) => {
    if (!drag.current) return
    const delta = (isVertical ? e.clientX : e.clientY) - drag.current.origin
    apply(drag.current.initial + (invert ? -delta : delta))
  }

  const end = (e) => {
    if (!drag.current) return
    drag.current = null
    setActive(false)
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // A divider that only responds to dragging is unusable without a mouse.
  // role="separator" with a focusable handle and arrow keys is the documented
  // pattern, and costs about six lines.
  const onKeyDown = (e) => {
    const STEP = e.shiftKey ? 64 : 16
    const [less, more] = isVertical ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown']
    if (e.key === less) { e.preventDefault(); apply(value + (invert ? STEP : -STEP)) }
    else if (e.key === more) { e.preventDefault(); apply(value + (invert ? -STEP : STEP)) }
    else if (e.key === 'Home') { e.preventDefault(); apply(min) }
    else if (e.key === 'End') { e.preventDefault(); apply(max) }
  }

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={isVertical ? 'vertical' : 'horizontal'}
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
      onDoubleClick={() => apply(Math.round((min + max) / 2))}
      title="Drag to resize · double-click to centre"
      className={`
        group relative z-10 shrink-0 touch-none transition-colors focus:outline-none
        ${isVertical ? 'w-px cursor-col-resize self-stretch' : 'h-px w-full cursor-row-resize'}
        ${active
          ? 'bg-primary'
          : tone === 'dark'
            ? 'bg-slate-700 hover:bg-primary focus-visible:bg-primary'
            : 'bg-slate-200 hover:bg-primary focus-visible:bg-primary'}
        ${className}
      `}
    >
      {/* The divider IS the border — one hairline, not a bar sitting next to
          one. The panes it separates deliberately carry no border of their own,
          because two lines a few pixels apart is what made this look like a
          chunky grab bar rather than an edge you can move.

          A 1px target is unhittable, so this invisible child extends the
          pointer area to ~9px either side. It's a descendant, so hovering it
          still triggers the parent's :hover and its events still bubble to the
          parent's drag handlers — the visible line never changes width. */}
      <span
        aria-hidden="true"
        className={`
          absolute transition-colors
          ${isVertical ? '-inset-x-1 inset-y-0' : '-inset-y-1 inset-x-0'}
          ${active ? 'bg-primary/20' : 'group-hover:bg-primary/10 group-focus-visible:bg-primary/20'}
        `}
      />
    </div>
  )
}
