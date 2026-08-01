import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { MoreVertical, Trash2 } from 'lucide-react'
import { useAuth, ROLES } from '../auth/AuthContext'
import { useMentorTopics } from '../../hooks'
import { useMentorChat } from './useMentorChat'
import ChatSidebar from './ChatSidebar'
import MentorWelcome from './MentorWelcome'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import MentorAdminBlocked from './MentorAdminBlocked'
import aiMentorIcon from '../../assets/ai-mentor-icon.png'

/** AI Mentor — a single-page chat-app shell (left nav sidebar + main panel)
 * matching the reference app-shell layout: New Chat / nav in the sidebar, a
 * top bar with a "..." menu, a centered welcome state with topic cards when
 * the conversation is empty, and a bottom-pinned input bar once messages
 * exist. */
export default function AIMentor() {
  const { user } = useAuth()

  if (user?.role === ROLES.SUPER_ADMIN) return <MentorAdminBlocked />

  const {
    messages, historyLoading, streaming,
    loadHistory, sendMessage, stopStreaming, retry, clearChat, submitFeedback,
  } = useMentorChat()
  const { data: topicsData } = useMentorTopics()

  const [clearing, setClearing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const menuRef = useRef(null)
  const messagesRef = useRef(null)
  // Whether we should auto-follow new content — true by default, but turned
  // off the moment the user scrolls away from the bottom so reading earlier
  // messages during a streaming reply doesn't keep getting yanked away.
  const autoScrollRef = useRef(true)

  useEffect(() => { loadHistory() }, [loadHistory])

  // Snap to the bottom exactly once, instantly, right when history finishes
  // loading — useLayoutEffect so it happens before paint, avoiding a visible
  // flash of the top of the conversation before jumping down.
  useLayoutEffect(() => {
    if (historyLoading) return
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [historyLoading])

  // Auto-scroll during an active conversation — scrolls the chat container
  // only (never the page), and only while the user hasn't manually scrolled
  // up to re-read something.
  useEffect(() => {
    if (historyLoading) return
    const el = messagesRef.current
    if (!el || !autoScrollRef.current) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, historyLoading])

  useEffect(() => {
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleMessagesScroll() {
    const el = messagesRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    autoScrollRef.current = distanceFromBottom < 120
  }

  function handleSend(text) {
    // Sending a message is an intentional action — resume following the
    // conversation even if the user had scrolled up beforehand.
    autoScrollRef.current = true
    sendMessage(text)
  }

  async function handleClear() {
    setClearing(true)
    try { await clearChat() } catch { /* keep existing messages on failure */ }
    setClearing(false)
    setShowClearConfirm(false)
    setMenuOpen(false)
  }

  const firstName = user?.name?.split(' ')[0] || 'there'
  const hasMessages = messages.length > 0
  const showWelcome = !historyLoading && !hasMessages

  return (
    <div className="flex" style={{ height: 'calc(100vh - 52px)' }}>
      <ChatSidebar onNewChat={() => setShowClearConfirm(true)} hasMessages={hasMessages} />

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-lg overflow-hidden">
                <img src={aiMentorIcon} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface leading-none">AI Mentor</p>
              {topicsData?.tagline && (
                <p className="text-[11px] text-on-surface-variant mt-0.5">{topicsData.tagline}</p>
              )}
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-low transition-colors cursor-pointer"
            >
              <MoreVertical className="h-4 w-4 text-on-surface-variant" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-border rounded-xl shadow-lg z-50 py-1">
                <button
                  onClick={() => { setMenuOpen(false); setShowClearConfirm(true) }}
                  disabled={!hasMessages}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear chat
                </button>
              </div>
            )}
          </div>
        </div>

        {showClearConfirm && (
          <div className="flex items-center justify-center gap-3 px-5 py-2 bg-red-50 border-b border-red-100 shrink-0">
            <span className="text-xs text-red-700 font-medium">Delete the whole conversation?</span>
            <button
              onClick={handleClear}
              disabled={clearing}
              className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {clearing ? 'Deleting…' : 'Delete'}
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="text-xs text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Body */}
        {historyLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : showWelcome ? (
          <MentorWelcome
            firstName={firstName}
            topics={topicsData?.topics ?? []}
            onTopicClick={(topic) => handleSend(`Can you help me with ${topic}?`)}
          />
        ) : (
          <div
            ref={messagesRef}
            onScroll={handleMessagesScroll}
            className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4"
          >
            {messages.map((msg, i) => (
              <ChatMessage key={msg.id ?? i} msg={msg} onRetry={retry} onFeedback={submitFeedback} />
            ))}
          </div>
        )}

        <ChatInput
          streaming={streaming}
          onSend={handleSend}
          onStop={stopStreaming}
          quickTopics={hasMessages ? (topicsData?.topics ?? []) : []}
        />
      </div>
    </div>
  )
}
