import { motion, useReducedMotion } from 'motion/react'
import { Sparkles, Send, TrendingDown, BookOpen } from 'lucide-react'
import AppWindow from './AppWindow'

// Illustrative sample conversation.
const CHIPS = ['Show me a worked example', 'Why is 90 days wrong here?', 'What should I redo first?']

const CONTEXT = [
  { label: 'Active simulation', value: 'Junior Data Analyst', tone: 'text-on-surface' },
  { label: 'Last graded task', value: 'Task 2 — 92%', tone: 'text-emerald-700' },
  { label: 'Weakest skill', value: 'Statistics — 41/60', tone: 'text-rose-700' },
  { label: 'Sessions this week', value: '6 · 41 min', tone: 'text-on-surface' },
]

// The thread plays back in order on arrival — question, then answer, then the
// follow-up chips — so it reads as a live exchange rather than a static
// transcript. The screen is remounted on every step change (see AppWindow),
// so this replays each time.
const bubble = (delay, reduce) => ({
  initial: reduce ? false : { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.42, delay, ease: [0.16, 1, 0.3, 1] },
})

export default function MentorScreen() {
  const reduce = Boolean(useReducedMotion())

  return (
    <AppWindow url="worklearn.ai/ai-mentor" active="mentor">
      <div className="h-full flex">
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Thread header */}
          <div className="flex items-center gap-2 border-b border-border px-5 py-3 shrink-0">
            <span className="h-7 w-7 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[12px] font-extrabold text-on-surface leading-tight">Career Twin</p>
              <p className="text-[10px] text-on-surface-variant">Knows every task you've submitted</p>
            </div>
            <span className="ml-auto rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
              Online
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-hidden px-5 py-4 space-y-3">
            <motion.div className="flex justify-end" {...bubble(0.18, reduce)}>
              <p className="max-w-[78%] rounded-xl rounded-br-sm bg-primary px-3.5 py-2.5 text-[11.5px] leading-relaxed text-white">
                I got 68% on the segmentation task. The feedback says my cut-offs weren't defensible
                — what did I actually get wrong?
              </p>
            </motion.div>

            <motion.div className="flex justify-start" {...bubble(0.42, reduce)}>
              <div className="max-w-[86%] rounded-xl rounded-bl-sm border border-border bg-surface-low px-3.5 py-3">
                <p className="text-[11.5px] leading-relaxed text-on-surface mb-2.5">
                  Two things, and only one of them is really about statistics.
                </p>
                <ol className="space-y-2 mb-2.5">
                  <li className="flex gap-2 text-[11px] leading-relaxed text-on-surface-variant">
                    <span className="mt-px h-4 w-4 shrink-0 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <span>
                      You used a flat <span className="font-mono text-[10.5px] font-semibold text-on-surface">90-day</span> recency
                      window. Lumen's median repurchase gap is 134 days, so a third of your “churned”
                      customers had simply not hit their normal reorder point yet.
                    </span>
                  </li>
                  <li className="flex gap-2 text-[11px] leading-relaxed text-on-surface-variant">
                    <span className="mt-px h-4 w-4 shrink-0 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <span>
                      You never said <em>why</em> 90 days. Priya's rubric gives 30% to justification —
                      the number matters less than showing the distribution you read it off.
                    </span>
                  </li>
                </ol>
                <p className="text-[11px] leading-relaxed text-on-surface-variant">
                  Re-run it with quintiles instead of fixed thresholds and put the histogram in your
                  write-up. That alone should move you into the 80s.
                </p>
              </div>
            </motion.div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {CHIPS.map((c, i) => (
                <motion.span
                  key={c}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.66 + i * 0.06 }}
                  className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700"
                >
                  {c}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-border px-5 py-3 shrink-0">
            <div className="flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-2">
              <span className="flex-1 text-[11px] text-on-surface-variant/60">Ask about anything you've submitted…</span>
              <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                <Send className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Context rail */}
        <aside className="hidden lg:flex w-[196px] shrink-0 flex-col border-l border-border p-3.5 gap-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/70">
            What it's reading
          </p>
          <div className="space-y-2.5">
            {CONTEXT.map((c) => (
              <div key={c.label}>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-on-surface-variant/60">{c.label}</p>
                <p className={`text-[11px] font-bold ${c.tone}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto rounded-lg border border-amber-200 bg-amber-50 p-2.5">
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 mb-1">
              <TrendingDown className="h-3 w-3" /> Flagged for you
            </span>
            <p className="text-[10px] leading-snug text-amber-900">
              Statistics has been your lowest skill for 3 weeks running.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 underline underline-offset-2">
              <BookOpen className="h-3 w-3" /> Open drill
            </span>
          </div>
        </aside>
      </div>
    </AppWindow>
  )
}
