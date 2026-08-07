import { motion, useReducedMotion } from 'motion/react'
import { ChevronDown, ArrowUpRight, Target } from 'lucide-react'
import AppWindow from './AppWindow'

// Illustrative sample data. `now` is the learner's assessed level, `need` the
// benchmark for the selected target role — both on the same 0–100 scale.
const SKILLS = [
  { label: 'SQL & data modelling', now: 78, need: 70, from: '+6 since Jul' },
  { label: 'Data visualisation', now: 66, need: 60, from: '+11 since Jul' },
  { label: 'Stakeholder comms', now: 58, need: 55, from: '+3 since Jul' },
  { label: 'Python for analysis', now: 52, need: 65, from: '+2 since Jul' },
  { label: 'Experiment design', now: 34, need: 55, from: 'no change' },
  { label: 'Statistics', now: 41, need: 60, from: '−1 since Jul' },
]

const ACTIONS = [
  { title: 'Retail A/B Test Analyst', meta: 'Simulation · ~4 hrs', lifts: 'Experiment design +18' },
  { title: 'Confidence intervals drill', meta: 'Practice set · 25 min', lifts: 'Statistics +9' },
  { title: 'Pandas groupby workout', meta: 'Practice set · 40 min', lifts: 'Python +7' },
]

function gapTone(now, need) {
  if (now >= need) return { bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'On track' }
  if (need - now <= 15) return { bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-800 border-amber-200', text: `−${need - now}` }
  return { bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 border-rose-200', text: `−${need - now}` }
}

export default function SkillGpsScreen() {
  const reduceMotion = useReducedMotion()
  const animated = !reduceMotion

  return (
    <AppWindow url="worklearn.ai/skill-gps" active="skills">
      <div className="h-full flex flex-col">
        {/* Target role bar */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 shrink-0">
            Target role
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-low px-2.5 py-1.5 text-[11px] font-bold text-on-surface">
            Data Analyst · Mid-level <ChevronDown className="h-3 w-3 text-on-surface-variant" />
          </span>
          <div className="ml-auto flex items-center gap-2.5 shrink-0">
            <span className="text-[10px] font-semibold text-on-surface-variant">Role match</span>
            <span className="font-mono text-lg font-extrabold text-emerald-600 leading-none">74%</span>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
              +9 this month
            </span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Skill bars */}
          <div className="flex-1 min-w-0 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/70">
                Where you stand
              </p>
              <span className="flex items-center gap-3 text-[9px] font-semibold text-on-surface-variant">
                <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-emerald-500" /> you</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-px bg-on-surface" /> role benchmark</span>
              </span>
            </div>

            <div className="space-y-[13px]">
              {SKILLS.map((s, i) => {
                const tone = gapTone(s.now, s.need)
                return (
                  <div key={s.label}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[11px] font-semibold text-on-surface">{s.label}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-on-surface-variant/70">{s.from}</span>
                        <span className="font-mono text-[10px] font-bold text-on-surface">
                          {s.now}
                          <span className="font-medium text-on-surface-variant/60">/{s.need}</span>
                        </span>
                        <span className={`rounded border px-1.5 py-px text-[9px] font-bold ${tone.chip}`}>{tone.text}</span>
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-surface-highest overflow-hidden">
                      {/* Fills out to the assessed level on arrival, top row
                          first — the screen remounts on every step change. */}
                      <motion.div
                        initial={animated ? { width: 0 } : false}
                        animate={{ width: `${s.now}%` }}
                        transition={{ duration: 0.6, delay: 0.28 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full rounded-full ${tone.bar}`}
                      />
                      {/* Benchmark tick */}
                      <span
                        className="absolute inset-y-0 w-px bg-on-surface"
                        style={{ left: `${s.need}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Next actions */}
          <aside className="hidden lg:flex w-[228px] shrink-0 flex-col border-l border-border p-4 gap-2.5">
            <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/70">
              <Target className="h-3 w-3" /> Close the gap
            </p>
            <p className="text-[10px] leading-snug text-on-surface-variant -mt-1 mb-1">
              Ordered by how much each one moves your weakest skill.
            </p>
            {ACTIONS.map((a, i) => (
              <div key={a.title} className="rounded-lg border border-border p-2.5 hover:border-emerald-300 transition-colors">
                <div className="flex items-start gap-2">
                  <span className="mt-px h-4 w-4 shrink-0 rounded bg-surface-container text-[9px] font-bold text-on-surface-variant flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-on-surface leading-snug">{a.title}</p>
                    <p className="text-[9px] text-on-surface-variant mt-0.5">{a.meta}</p>
                    <p className="mt-1.5 inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-700">
                      <ArrowUpRight className="h-2.5 w-2.5" /> {a.lifts}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </AppWindow>
  )
}
