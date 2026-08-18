import { motion, useReducedMotion } from 'motion/react'
import { PartyPopper, ArrowRight, Star, Trophy, Sparkles } from 'lucide-react'

// The moment a week is finished.
//
// Deliberately the one place in this runtime that is loud. Everything else —
// the brief, the workbench, the assessment — is quiet and businesslike because
// it's meant to feel like a job. Finishing three tickets and their checks is
// the point at which a person should be allowed to feel something, and a
// toast that fades in four seconds does not do that.
//
// It is a full-screen scene rather than a banner for the same reason: it has to
// interrupt. It's also the only natural stopping point in the programme — the
// place where someone puts it down for the night — so it ends with an explicit
// choice rather than dropping them into the next brief.
//
// Respects prefers-reduced-motion throughout: the confetti isn't rendered at
// all, and the scene appears complete and static rather than animating in.

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  // Deterministic, not random: a re-render mid-animation would otherwise
  // reshuffle every piece and make the whole thing twitch.
  left: `${(i * 37) % 100}%`,
  delay: (i % 6) * 0.12,
  duration: 2.4 + (i % 5) * 0.35,
  rotate: (i % 2 ? 1 : -1) * (180 + (i % 4) * 90),
  color: ['bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-indigo-400', 'bg-sky-400'][i % 5],
  size: i % 3 === 0 ? 'h-3 w-2' : 'h-2 w-2',
}))

function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {CONFETTI.map((c) => (
        <motion.span
          key={c.id}
          className={`absolute top-0 rounded-[2px] ${c.color} ${c.size}`}
          style={{ left: c.left }}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: '105vh', opacity: [0, 1, 1, 0], rotate: c.rotate }}
          transition={{ duration: c.duration, delay: c.delay, ease: 'linear', repeat: Infinity }}
        />
      ))}
    </div>
  )
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-center">
      <Icon className="mx-auto h-5 w-5 text-amber-300" />
      <p className="mt-1.5 font-display text-xl font-extrabold tabular-nums text-white">{value}</p>
      <p className="text-[0.7rem] font-bold uppercase tracking-wider text-white/45">{label}</p>
    </div>
  )
}

export default function WeekCompleteScene({
  weekLabel, weekNumber, tasksCompleted, xpEarned, avgScore,
  nextSectionLabel, onContinue, onRoadmap,
}) {
  const reduceMotion = useReducedMotion()
  const rise = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#0d1b2a]/95 p-4 backdrop-blur-sm sm:p-8">
      {!reduceMotion && <Confetti />}

      <motion.div
        {...rise}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#12233a] shadow-2xl ring-1 ring-white/10"
      >
        {/* Cartoon badge. Built from two rings and an emoji rather than an
            illustration file — it scales, needs no asset, and can't 404. */}
        <div className="relative px-6 pt-10 text-center sm:px-10">
          <motion.div
            initial={reduceMotion ? false : { scale: 0.5, rotate: -12 }}
            animate={reduceMotion ? false : { scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/25 ring-8 ring-amber-400/15"
          >
            <PartyPopper className="h-11 w-11 text-[#12233a]" />
          </motion.div>

          <p className="mt-6 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-amber-300">
            Week {weekNumber} complete
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
            {weekLabel}
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-[0.95rem] leading-relaxed text-white/60">
            That&apos;s every ticket for the week shipped and checked. Genuinely well done — this is
            the part most people don&apos;t finish.
          </p>
        </div>

        <div className="flex gap-3 px-6 pt-7 sm:px-10">
          <Stat icon={Trophy} value={tasksCompleted} label="Tickets" />
          <Stat icon={Sparkles} value={`${xpEarned}`} label="XP" />
          {avgScore != null && <Stat icon={Star} value={`${avgScore}%`} label="Average" />}
        </div>

        <div className="flex flex-col gap-2.5 p-6 sm:p-10 sm:pt-7">
          <button
            onClick={onContinue}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 font-display text-sm font-extrabold text-[#0d1b2a] transition-colors hover:bg-emerald-400"
          >
            {nextSectionLabel ? `Move to ${nextSectionLabel}` : 'Move to the next section'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={onRoadmap}
            className="w-full rounded-full px-6 py-3 text-sm font-semibold text-white/55 transition-colors hover:bg-white/5 hover:text-white"
          >
            Take a break — back to the roadmap
          </button>
        </div>
      </motion.div>
    </div>
  )
}
