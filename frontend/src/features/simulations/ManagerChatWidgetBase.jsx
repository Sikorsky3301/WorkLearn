import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from '../../shared/ui/shadcn/button'
import { Textarea } from '../../shared/ui/shadcn/textarea'

/** Shared floating bottom-right manager-chat shell — collapsed FAB + expanded
 * panel, unread badge/pulse, aria-live announcements, Escape-to-close with
 * focus return, mobile-responsive layout. Purely presentational/interaction
 * state (open/unread/pulse/typing indicator, composer input); message
 * content and reply generation are owned by the caller via `messages` +
 * `onSend`, so each job simulation can plug in its own rule-based manager
 * knowledge without duplicating this UI. Used by sales-crm-sim, da-job-sim,
 * and frontend-dev-sim. */
export default function ManagerChatWidgetBase({
  manager, // { name, role, photo?, initials }
  company,
  messages, // [{ id, role: 'user' | 'manager', text }]
  typing = false,
  onSend,
  placeholder = 'Ask your manager about this task…',
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [unread, setUnread] = useState(0)
  const [pulse, setPulse] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  const prevCountRef = useRef(0)
  const scrollRef = useRef(null)
  const toggleRef = useRef(null)

  // Track newly-arrived manager messages: announce for screen readers, and
  // when the panel is collapsed, bump the unread badge + pulse the button.
  useEffect(() => {
    const prevCount = prevCountRef.current
    prevCountRef.current = messages.length
    if (messages.length <= prevCount) return

    const newManagerMsgs = messages.slice(prevCount).filter((m) => m.role === 'manager')
    if (!newManagerMsgs.length) return

    setAnnouncement(newManagerMsgs[newManagerMsgs.length - 1].text)
    if (!open) {
      setUnread((u) => u + newManagerMsgs.length)
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 1000)
      return () => clearTimeout(t)
    }
  }, [messages, open])

  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open, typing])

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  // The toggle button unmounts while the panel is open (see render below), so
  // wait for it to remount before returning focus to it on close.
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (wasOpenRef.current && !open) {
      requestAnimationFrame(() => toggleRef.current?.focus())
    }
    wasOpenRef.current = open
  }, [open])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    onSend(text)
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Screen-reader announcer for new manager replies, whether or not the panel is open */}
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={`Chat with ${manager.name}, your manager`}
          className={cn(
            'fixed z-50 flex flex-col bg-white border border-border shadow-2xl overflow-hidden',
            'inset-x-0 bottom-0 h-[85dvh] rounded-t-2xl',
            'sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-auto sm:max-h-[70vh] sm:w-[380px] sm:rounded-2xl',
            'animate-in fade-in slide-in-from-bottom-4 duration-200'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-surface-low shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {manager.photo ? (
                <img src={manager.photo} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
              ) : (
                <span className={cn('h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white', manager.avatarClass || 'bg-primary')}>
                  {manager.initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{manager.name}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{manager.role}, {company}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-high hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Transcript */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((m) => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line',
                    m.role === 'user' ? 'bg-primary text-white' : 'bg-surface-low text-on-surface'
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-surface-low rounded-xl px-3.5 py-2 text-sm text-on-surface-variant">
                  {manager.name.split(' ')[0]} is typing…
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border p-3 flex items-end gap-2 shrink-0">
            <Textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="resize-none min-h-0 h-10 py-2"
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim()} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Collapsed floating action button — only shown when the panel is closed,
          so it never overlaps the expanded panel (which fills most of the
          viewport on mobile) or duplicates the header's own close control. */}
      {!open && (
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Chat with ${manager.name}, your manager${unread ? ` (${unread} new)` : ''}`}
          aria-expanded={open}
          className={cn(
            'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl flex items-center justify-center overflow-hidden',
            manager.photo ? 'bg-primary' : (manager.avatarClass || 'bg-primary'),
            'transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
            pulse && 'animate-bounce'
          )}
        >
          {manager.photo ? (
            <img src={manager.photo} alt="" className="h-full w-full object-cover" />
          ) : manager.initials ? (
            <span className="text-white text-sm font-bold">{manager.initials}</span>
          ) : (
            <MessageCircle className="h-6 w-6 text-white" />
          )}

          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 h-5 min-w-[1.25rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}
    </>
  )
}
