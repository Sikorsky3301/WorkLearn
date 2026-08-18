import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, MessageSquare, CalendarClock, AlarmClock, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useAgentMessages, useMarkMessageRead, useMarkAllRead } from '../hooks'

// The notification bell.
//
// The whole notification stack already existed and was wired to nothing: an
// `agent_messages` table, three endpoints, and `useAgentMessages` polling every
// 30 seconds in hooks/messages.js — with no component importing any of it.
// This is that missing consumer, not a new system.
//
// Messages are server-originated only (a scheduler, plus manager congratulations
// posted on task completion by award_task_completion). There is no client-side
// "create notification" path, and there shouldn't be.

const ICON = {
  REVIEW: MessageSquare,
  STANDUP: CalendarClock,
  REMINDER: AlarmClock,
  NUDGE: Sparkles,
}

const TONE = {
  REVIEW: 'bg-emerald-50 text-emerald-700',
  STANDUP: 'bg-indigo-50 text-indigo-700',
  REMINDER: 'bg-amber-50 text-amber-700',
  NUDGE: 'bg-violet-50 text-violet-700',
}

function relativeTime(iso) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  const { data } = useAgentMessages()
  const markRead = useMarkMessageRead()
  const markAll = useMarkAllRead()

  const messages = useMemo(() => data?.messages ?? [], [data])
  const unread = messages.filter((m) => !m.read).length

  // Ring only when the count goes UP — re-rendering with the same unread
  // count shouldn't re-animate, or the bell twitches on every poll.
  const prevUnread = useRef(unread)
  const [ring, setRing] = useState(false)
  useEffect(() => {
    if (unread > prevUnread.current) {
      setRing(true)
      const id = setTimeout(() => setRing(false), 900)
      prevUnread.current = unread
      return () => clearTimeout(id)
    }
    prevUnread.current = unread
    return undefined
  }, [unread])

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (!panelRef.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const openMessage = (m) => {
    if (!m.read) markRead.mutate(m.id)
    setOpen(false)
    // The backend joins the slug through the enrollment, so a message about a
    // simulation can land you on that simulation.
    if (m.simulation_slug) navigate(`/simulations/${m.simulation_slug}/roadmap`)
  }

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative rounded-full border border-border bg-surface-low p-2 text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        animate={ring && !reduceMotion ? { rotate: [0, -12, 10, -8, 6, 0] } : { rotate: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[0.6rem] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </motion.button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-bold text-on-surface">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-on-surface-variant">
                Nothing yet. Your manager will be in touch.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {messages.map((m) => {
                  const Icon = ICON[m.type] ?? MessageSquare
                  return (
                    <li key={m.id}>
                      <button
                        onClick={() => openMessage(m)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-low ${
                          m.read ? '' : 'bg-primary/[0.03]'
                        }`}
                      >
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TONE[m.type] ?? TONE.REVIEW}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-relaxed text-on-surface">{m.content}</span>
                          <span className="mt-0.5 block text-xs text-on-surface-variant">{relativeTime(m.created_at)}</span>
                        </span>
                        {!m.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
