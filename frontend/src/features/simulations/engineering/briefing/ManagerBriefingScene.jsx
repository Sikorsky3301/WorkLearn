import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ArrowRight, SkipForward } from 'lucide-react'
import { resolveMediaUrl } from '../../../../lib/client'
import { TextGenerateEffect } from '../../../../components/ui/text-generate-effect'

// The manager hands you the task.
//
// A full-screen scene rather than an inline bubble: the point is that work
// arrives from a person, not from a page. It plays once per task (see
// useBriefingSeen) and is always skippable.
//
// The words are `task.briefing` — the CMS field that is already written in the
// manager's voice and already feeds the floating chat widget's greeting. No
// new content and nothing for an author to keep in sync.
//
// ACCESSIBILITY: under `prefers-reduced-motion` the scene renders complete and
// static — the text is fully present immediately and the button is live. It is
// never skipped outright, because that would silently remove the briefing for
// those users; the same words also remain on the task page behind it.

export default function ManagerBriefingScene({ manager, company, task, onDismiss }) {
  const reduceMotion = useReducedMotion()
  const [textDone, setTextDone] = useState(reduceMotion)

  const name = manager?.name || 'Your manager'
  const role = manager?.role || 'Simulation manager'
  const photo = manager?.photo_url ? resolveMediaUrl(manager.photo_url) : null
  const initials = manager?.avatar || name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  const words = task?.briefing?.trim()

  // Reveal the CTA once the words have had time to land, so it doesn't compete
  // with the sentence being read. TextGenerateEffect staggers at 0.06s/word.
  useEffect(() => {
    if (reduceMotion || !words) return undefined
    const ms = Math.min(words.split(' ').length * 60 + 400, 6000)
    const id = setTimeout(() => setTextDone(true), ms)
    return () => clearTimeout(id)
  }, [words, reduceMotion])

  // Escape always gets you out.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onDismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  if (!words) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0920]/95 px-6 backdrop-blur-md"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Briefing from ${name}`}
      >
        <button
          onClick={onDismiss}
          className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <SkipForward className="h-3.5 w-3.5" /> Skip
        </button>

        <motion.div
          className="w-full max-w-xl text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {photo ? (
            <img
              src={photo}
              alt=""
              className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-white/15"
            />
          ) : (
            <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary font-display text-2xl font-extrabold text-white ring-4 ring-white/15">
              {initials}
            </span>
          )}

          <p className="mt-5 font-display text-lg font-bold text-white">{name}</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            {role}{company ? ` · ${company}` : ''}
          </p>

          <div className="mt-8 rounded-2xl bg-white/[0.07] p-6 text-left ring-1 ring-white/10">
            {reduceMotion ? (
              <p className="text-base leading-relaxed text-white/90">{words}</p>
            ) : (
              <TextGenerateEffect words={words} className="text-base leading-relaxed text-white/90" />
            )}
          </div>

          <motion.button
            onClick={onDismiss}
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-white/90 disabled:opacity-0"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: textDone ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            aria-hidden={!textDone}
          >
            Got it — show me the task
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
