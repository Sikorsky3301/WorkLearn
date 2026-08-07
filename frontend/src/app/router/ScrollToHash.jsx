import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** React Router does not act on the URL hash — the browser only honours it on
 * a full page load, so a client-side navigation to `/home#pricing` lands at
 * the top of the page and the link reads as broken. This restores the
 * expected behaviour for the marketing site's on-page anchors (Pricing,
 * Campus plans), and scrolls to the top on any ordinary route change.
 *
 * `requestAnimationFrame` waits for the new route to paint — the target
 * element does not exist yet on the tick the location changes. */
export default function ScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!hash) {
        window.scrollTo({ top: 0 })
        return
      }
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0 })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}
