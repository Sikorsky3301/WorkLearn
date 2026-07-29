import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import sparklesLoader from '../../assets/sparkles-loader.lottie'

/** Shown inside the assistant bubble while waiting for the first streamed
 * chunk (tool-resolution + network round-trip to the model can take a few
 * seconds before any text arrives) — a looping sparkles animation matching
 * the mentor logo's sparkle mark. */
export default function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-0.5" role="status" aria-label="AI Mentor is thinking">
      <DotLottieReact
        src={sparklesLoader}
        loop
        autoplay
        style={{ width: 28, height: 28 }}
      />
      <span className="text-[11px] text-on-surface-variant">Thinking…</span>
    </div>
  )
}
