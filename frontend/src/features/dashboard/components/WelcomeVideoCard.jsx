import { useEffect, useState } from 'react'
import { Play, X } from 'lucide-react'

const VIDEO_SRC = '/videos/welcome-to-worklearn.mp4'
const THUMBNAIL_SRC = '/videos/welcome-to-worklearn-thumb.jpg'

/** Compact explainer-video row at the top of the Dashboard — small thumbnail
 * + play button on the left, copy on the right, so it reads as a quick
 * invite rather than a full banner competing with the rest of the page.
 * Always shown (no dismiss) — lazy by design instead: the <video> element
 * (and its ~8MB source) only mounts once the student actually clicks Play,
 * so just loading the Dashboard never fetches it. */
export default function WelcomeVideoCard() {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const onKey = (e) => { if (e.key === 'Escape') setPlaying(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [playing])

  return (
    <>
      <div className="relative rounded-xl border border-primary/15 shadow-sm p-0 overflow-hidden mb-6 group bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        {/* Faint dot-grid texture, same decorative language used elsewhere
            (Portfolio's profile card, the simulation overview hero) — gives
            this "featured" row a bit of depth instead of a flat tint. */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #312E81 1.5px, transparent 1.5px)', backgroundSize: '18px 18px' }}
          aria-hidden="true"
        />
        <button onClick={() => setPlaying(true)} className="relative w-full flex items-center gap-4 p-3 text-left cursor-pointer">
          {/* Thumbnail — a real frame from the video, kept small so this reads
              as a quick prompt rather than a full banner. */}
          <div className="relative w-32 sm:w-40 aspect-video shrink-0 rounded-lg overflow-hidden bg-black">
            <img
              src={THUMBNAIL_SRC}
              alt="Welcome to WorkLearn — platform overview video"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-primary/90 flex items-center justify-center shadow-lg ring-2 ring-white/40 group-hover:scale-110 group-hover:bg-primary transition-transform">
                <Play className="h-3.5 w-3.5 text-white ml-0.5" fill="currentColor" />
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">New</span>
              <span className="text-[11px] text-on-surface-variant">2 min watch</span>
            </div>
            <p className="font-bold text-on-surface text-sm">Welcome to WorkLearn</p>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-snug line-clamp-2">
              A quick overview of how job simulations, your AI Mentor, and your Portfolio all fit together.
            </p>
          </div>
        </button>
      </div>

      {playing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-dark/90 via-black/80 to-black/85 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setPlaying(false) }}
        >
          <div className="w-full max-w-3xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white text-sm font-semibold">Welcome to WorkLearn</p>
              <button
                onClick={() => setPlaying(false)}
                aria-label="Close video"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <video
              src={VIDEO_SRC}
              controls
              autoPlay
              className="w-full aspect-video rounded-xl shadow-2xl bg-black"
            >
              Your browser doesn't support embedded video.
            </video>
          </div>
        </div>
      )}
    </>
  )
}
