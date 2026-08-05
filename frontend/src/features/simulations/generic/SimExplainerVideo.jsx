import { useEffect, useState } from 'react'
import { Play, X } from 'lucide-react'

/** Explainer-video block for a simulation's overview page. Lazy by design,
 * same approach as the Dashboard's WelcomeVideoCard: the <video> element
 * (and its ~20MB source) only mounts once the student actually clicks Play,
 * so simply loading the overview page never fetches it. Renders nothing for
 * a simulation with no video (see SIM_BRANDING.explainerVideo). */
export default function SimExplainerVideo({ src, poster, title, company }) {
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

  if (!src) return null

  return (
    <div className="mt-12">
      <h2 className="flex items-center gap-2 text-lg font-bold text-on-surface mb-4">
        <span className="h-4 w-1 rounded-full bg-primary shrink-0" />
        Watch the walkthrough
      </h2>

      <button
        onClick={() => setPlaying(true)}
        className="group relative block w-full aspect-video rounded-xl overflow-hidden border border-border bg-gradient-to-br from-[#151046] via-primary-dark to-[#0f0d2e] cursor-pointer"
      >
        {poster && (
          <img
            src={poster}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" aria-hidden="true" />

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-primary ml-1" fill="currentColor" />
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 text-left">
          <p className="text-white font-bold text-base drop-shadow">{title}</p>
          <p className="text-white/70 text-sm mt-0.5 drop-shadow">
            A walkthrough of the work you'll do at {company}
          </p>
        </div>
      </button>

      {playing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-dark/90 via-black/80 to-black/85 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setPlaying(false) }}
        >
          <div className="w-full max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white text-sm font-semibold">{title}</p>
              <button
                onClick={() => setPlaying(false)}
                aria-label="Close video"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <video src={src} controls autoPlay className="w-full aspect-video rounded-xl shadow-2xl bg-black">
              Your browser doesn't support embedded video.
            </video>
          </div>
        </div>
      )}
    </div>
  )
}
