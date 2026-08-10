import { motion, useReducedMotion } from 'motion/react'
import { Check, Paperclip, Clock, CornerUpRight, MessageSquare } from 'lucide-react'
import AppWindow from './AppWindow'

// Illustrative sample data — Lumen Corporation and its staff are fictional.
const TASKS = [
  { n: 1, title: 'Get set up and meet the team', state: 'done', score: '100%' },
  { n: 2, title: 'Clean the Q1–Q4 orders export', state: 'done', score: '92%' },
  { n: 3, title: 'Segment the customer base', state: 'active' },
  { n: 4, title: 'Build the retention dashboard', state: 'todo' },
  { n: 5, title: 'Present findings to leadership', state: 'todo' },
]

const DELIVERABLES = [
  'An RFM segmentation covering all 8,412 customers',
  'Your recency and monetary cut-offs, and why you chose them',
  'One spend recommendation you can defend in the Thursday review',
]

export default function SimulationScreen() {
  const reduce = Boolean(useReducedMotion())

  return (
    <AppWindow url="worklearn.ai/simulations/junior-data-analyst" active="simulations">
      <div className="h-full flex flex-col">
        {/* Role header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3 shrink-0">
          <span className="h-8 w-8 rounded-lg bg-orange-500 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
            LC
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold text-on-surface leading-tight truncate">Junior Data Analyst</p>
            <p className="text-[10px] text-on-surface-variant">Growth &amp; Analytics · Lumen Corporation</p>
          </div>
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <span className="hidden md:flex items-center gap-1.5 text-[10px] font-semibold text-on-surface-variant">
              <Clock className="h-3 w-3" /> Day 4 of 10
            </span>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-24 rounded-full bg-surface-highest overflow-hidden">
                <motion.span
                  initial={reduce ? false : { width: 0 }}
                  animate={{ width: '40%' }}
                  transition={{ duration: 0.55, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="block h-full rounded-full bg-emerald-500"
                />
              </span>
              <span className="font-mono text-[10px] font-bold text-on-surface">2/5</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Task list */}
          <div className="hidden md:flex w-[236px] shrink-0 flex-col border-r border-border p-3 gap-1">
            <p className="px-1.5 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/70">
              Your tasks
            </p>
            {TASKS.map((t, i) => (
              <motion.div
                key={t.n}
                initial={reduce ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.32, delay: 0.16 + i * 0.045 }}
                className={`flex items-start gap-2 rounded-lg px-2 py-2 ${
                  t.state === 'active' ? 'bg-orange-50 border border-orange-200' : ''
                }`}
              >
                <span
                  className={`mt-px h-4 w-4 shrink-0 rounded-full text-[9px] font-bold flex items-center justify-center ${
                    t.state === 'done'
                      ? 'bg-emerald-500 text-white'
                      : t.state === 'active'
                        ? 'bg-orange-500 text-white'
                        : 'border border-outline-variant text-on-surface-variant/60'
                  }`}
                >
                  {t.state === 'done' ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : t.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[11px] leading-snug ${
                      t.state === 'todo' ? 'text-on-surface-variant/60 font-medium' : 'text-on-surface font-semibold'
                    }`}
                  >
                    {t.title}
                  </span>
                  {t.score && (
                    <span className="mt-0.5 inline-block font-mono text-[9px] font-bold text-emerald-700">
                      Graded {t.score}
                    </span>
                  )}
                  {t.state === 'active' && (
                    <span className="mt-0.5 inline-block text-[9px] font-bold uppercase tracking-wide text-orange-600">
                      In progress
                    </span>
                  )}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Brief */}
          <div className="flex-1 min-w-0 p-5 overflow-hidden">
            <div className="flex items-start gap-2.5 mb-3">
              <span className="h-8 w-8 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                PS
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-on-surface leading-tight">
                  Priya Sharma <span className="font-medium text-on-surface-variant">· Growth &amp; Analytics Manager</span>
                </p>
                <p className="text-[10px] text-on-surface-variant">Today at 09:14</p>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                Due Thu · 2 days left
              </span>
            </div>

            <h4 className="text-[15px] font-extrabold text-on-surface leading-tight mb-2">
              Task 3 — Segment the customer base
            </h4>
            <p className="text-[11.5px] text-on-surface-variant leading-relaxed mb-4">
              Finance wants next quarter's retention budget cut by 15% and I need to know where it
              can come from. Pull the last 12 months of orders and tell me which customers we should
              actually still be spending on — and which we shouldn't. Don't over-engineer it; I'd
              rather have a defensible answer Thursday than a perfect one next month.
            </p>

            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2">
              What to submit
            </p>
            <ul className="space-y-1.5 mb-4">
              {DELIVERABLES.map((d) => (
                <li key={d} className="flex items-start gap-2 text-[11px] text-on-surface-variant leading-snug">
                  <span className="mt-[5px] h-1 w-1 rounded-full bg-orange-500 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-low px-2.5 py-1.5">
                <Paperclip className="h-3 w-3 text-on-surface-variant shrink-0" />
                <span className="font-mono text-[10px] font-medium text-on-surface">orders_2025_full_year.csv</span>
                <span className="text-[9px] text-on-surface-variant">2.4 MB · 8,412 rows</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white">
                Open workspace <CornerUpRight className="h-3 w-3" />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-bold text-on-surface">
                <MessageSquare className="h-3 w-3" /> Ask Priya
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppWindow>
  )
}
