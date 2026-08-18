import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ArrowRight, CheckCheck, CircleCheck } from 'lucide-react'
import { useAgentMessages, useMarkMessageRead } from '../../../../hooks'
import { resolveMediaUrl } from '../../../../lib/client'
import { TASK_STATUS } from '../lib/roadmapModel'

// The manager rail: everything your manager has actually said to you on this
// simulation, plus the task they're currently waiting on.
//
// Two sources, kept visibly separate rather than merged into one fake
// chronology:
//
//   • Task briefs — `task.briefing`, the manager-voiced text attached to each
//     task. These are assignments, ordered by task index. They have no
//     timestamp, because they aren't events; they're part of the task.
//   • Notes — real `AgentMessage` rows from `GET /api/agent-messages`, posted
//     server-side (manager congratulations on first completion, enrolment
//     welcome, scheduler nudges). These DO have timestamps.
//
// Interleaving the two would mean inventing times for the briefs, or guessing
// which note belongs to which task from ordering alone — the messages carry no
// task reference. Two labelled groups tells the truth and reads just as well.
//
// Read state is owned by NotificationBell; this panel shows it and can clear
// it, but only for THIS simulation's messages — never a blanket mark-all,
// which would silently wipe unread notices from other simulations.

const relativeTime = (iso) => {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

function GroupLabel({ children }) {
  return (
    <p className="pt-1 text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">
      {children}
    </p>
  )
}

/** One manager utterance. Square, left-aligned, attributed — the manager is
 *  the only speaker here, so there is no need for chat-style sides. */
function Note({ meta, children, unread, onClick }) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      onClick={onClick}
      className={`block w-full border border-border bg-white p-3.5 text-left ${
        unread ? 'border-l-4 border-l-primary' : ''
      } ${onClick ? 'transition-colors hover:border-primary/40' : ''}`}
    >
      <span className="mb-1.5 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-wider text-on-surface-variant">
        {meta}
        {unread && <span className="rounded-full bg-primary px-2 py-0.5 text-[0.6rem] tracking-normal text-white">New</span>}
      </span>
      <span className="block whitespace-pre-wrap text-sm leading-relaxed text-on-surface">{children}</span>
    </Wrapper>
  )
}

export default function ManagerPanel({ slug, manager = {}, company, roadmap, onClose }) {
  const navigate = useNavigate()
  const { data } = useAgentMessages()
  const markRead = useMarkMessageRead()

  // Oldest first: a conversation reads downward. The endpoint returns newest
  // first because the bell wants it that way.
  const notes = useMemo(() => (data?.messages ?? [])
    .filter((m) => m.simulation_slug === slug)
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  [data, slug])

  const unread = notes.filter((m) => !m.read)

  // Briefs for work that has actually been handed to you — a locked task's
  // brief hasn't been given yet, and showing it here would leak ahead.
  const briefs = useMemo(() => (roadmap?.sections ?? [])
    .flatMap((s) => s.tasks)
    .filter((t) => t.status !== TASK_STATUS.LOCKED && t.briefing),
  [roadmap])

  const latest = roadmap?.currentTask
  const firstName = (manager.name || 'your manager').split(' ')[0]

  return (
    <div className="flex h-full flex-col border-l border-border bg-surface-low/40">
      {/* ── Who ── */}
      <div className="flex items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-4 py-3">
        {manager.photo_url ? (
          <img src={resolveMediaUrl(manager.photo_url)} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
            {manager.avatar || 'M'}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-sm font-extrabold text-emerald-900">
            {manager.name || 'Your manager'}
          </span>
          <span className="block truncate text-xs text-emerald-800/80">
            {[manager.role, company].filter(Boolean).join(' · ')}
          </span>
        </span>
        {onClose && (
          <button
            onClick={onClose}
            title="Close"
            aria-label="Close the manager panel"
            className="shrink-0 rounded-full p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Latest task given — pinned, so it stays visible however far the
             conversation is scrolled ── */}
      <div className="border-b border-border bg-white px-4 py-3.5">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">
          {latest ? 'Latest task assigned' : 'Assignments'}
        </p>
        {latest ? (
          <>
            <p className="mt-1.5 font-display text-sm font-extrabold leading-snug text-on-surface">
              Task {latest.task_index} · {latest.title}
            </p>
            {latest.objective && (
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-on-surface-variant">{latest.objective}</p>
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
              {latest.xp_award > 0 && (
                <span className="bg-surface-low px-2 py-1 font-mono text-[0.7rem] font-bold text-on-surface-variant">
                  {latest.xp_award} XP
                </span>
              )}
              <button
                onClick={() => navigate(`/simulations/${slug}/task/${latest.task_index}`)}
                className="group ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
              >
                Open task
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </>
        ) : (
          <p className="mt-1.5 flex items-center gap-2 text-sm text-on-surface">
            <CircleCheck className="h-4 w-4 shrink-0 text-emerald-500" />
            Everything {firstName} assigned is done.
          </p>
        )}
      </div>

      {/* ── The conversation ── */}
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {briefs.length === 0 && notes.length === 0 && (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            Nothing from {firstName} yet.
          </p>
        )}

        {briefs.length > 0 && <GroupLabel>Task briefs</GroupLabel>}
        {briefs.map((t) => (
          <Note
            key={`brief-${t.task_index}`}
            meta={
              <>
                <span className="truncate">Task {t.task_index} · {t.title}</span>
                {t.status === TASK_STATUS.COMPLETE && (
                  <CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                )}
              </>
            }
          >
            {t.briefing}
          </Note>
        ))}

        {notes.length > 0 && (
          <>
            <GroupLabel>Notes from {firstName}</GroupLabel>
            {notes.map((m) => (
              <Note
                key={m.id}
                meta={relativeTime(m.created_at)}
                unread={!m.read}
                onClick={m.read ? undefined : () => markRead.mutate(m.id)}
              >
                {m.content}
              </Note>
            ))}
          </>
        )}
      </div>

      {unread.length > 0 && (
        <div className="border-t border-border bg-white p-3">
          <button
            onClick={() => unread.forEach((m) => markRead.mutate(m.id))}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark {unread.length === 1 ? 'this note' : `these ${unread.length} notes`} as read
          </button>
        </div>
      )}
    </div>
  )
}

/** Unread notes for one simulation — drives the badge on the Manager button.
 *  Lives here so the button and the panel agree on what "unread" means. */
export function useManagerUnreadCount(slug) {
  const { data } = useAgentMessages()
  return (data?.messages ?? []).filter((m) => m.simulation_slug === slug && !m.read).length
}
