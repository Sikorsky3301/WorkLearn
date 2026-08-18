import { useState } from 'react'
import {
  ChevronDown, Code2, ClipboardList, MessageSquare, FileText, Table2, ClipboardCheck,
} from 'lucide-react'

// One collapsible week of the curriculum.
//
// A ten-task simulation rendered flat is a wall you scroll past rather than
// read, and the thing a prospective student actually wants first is the SHAPE
// of the programme — how many sections, what each is called, how long it runs.
// Collapsing to headers answers that in one screen; expanding answers "what
// exactly will I build".
//
// The first section starts open. A curriculum that is entirely closed on
// arrival looks empty and gives no sample of the detail underneath, so nobody
// learns there is anything worth opening.

const TYPE_META = {
  code_sandbox: { icon: Code2, label: 'Code' },
  quiz: { icon: ClipboardList, label: 'Quiz' },
  ai_roleplay_chat: { icon: MessageSquare, label: 'Roleplay' },
  text_rubric: { icon: FileText, label: 'Written' },
  structured_form: { icon: Table2, label: 'Form' },
  crm_workspace: { icon: Table2, label: 'CRM' },
}

export default function CurriculumSection({ label, tasks, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  // Summarised on the closed header, so the section still says something
  // useful without being expanded.
  const xp = tasks.reduce((sum, t) => sum + (t.xp_award || 0), 0)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-low/60 sm:px-5"
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-on-surface">{label}</span>
          </span>
          <span className="shrink-0 text-xs text-on-surface-variant">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            {xp > 0 && <span className="ml-2 font-mono font-bold text-primary">{xp} XP</span>}
          </span>
        </button>
      </h3>

      {/* Unmounted rather than hidden: a ten-section curriculum would
          otherwise put every task in the DOM for a page most visitors only
          skim, and there is no state inside these rows worth preserving. */}
      {open && (
        <div className="divide-y divide-border border-t border-border">
          {tasks.map((t) => {
            const meta = TYPE_META[t.type]
            const Icon = meta?.icon
            return (
              <div key={t.id} className="flex items-start gap-4 p-4 transition-colors hover:bg-surface-low/60 sm:px-5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {t.task_index}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-on-surface">{t.title}</p>
                  {t.objective && (
                    <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{t.objective}</p>
                  )}
                  {/* Count only — the questions and answers stay server-side.
                      Worth showing here because "10 tasks" and "10 tasks each
                      followed by a check" are different commitments. */}
                  {t.assessment_summary && !t.config?.is_final_assessment && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-on-surface-variant/80">
                      <ClipboardCheck className="h-3 w-3" />
                      {t.assessment_summary.question_count}-question check after this
                    </p>
                  )}
                </div>
                {Icon && (
                  <span
                    title={meta.label}
                    className="mt-0.5 hidden shrink-0 items-center gap-1.5 rounded-lg bg-surface-low px-2 py-1 text-[0.65rem] font-bold text-on-surface-variant sm:inline-flex"
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
