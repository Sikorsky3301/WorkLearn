import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { streamChat, api } from '../../shared/api/client'
import { useAuth, ROLES } from '../auth/AuthContext'
import aiMentorIcon from '../../assets/ai-mentor-icon.png'

export default function AIMentor() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (user?.role === ROLES.SUPER_ADMIN) {
    return (
      <div className="max-w-container mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🤖</span>
        </div>
        <h2 className="text-lg font-bold text-on-surface mb-2">AI Mentor is for enrolled students</h2>
        <p className="text-sm text-on-surface-variant mb-6">As a platform admin you don't have a student profile. Switch to a student account to use the AI Mentor.</p>
        <button onClick={() => navigate('/admin')} className="btn-primary text-sm px-5 py-2">Back to Admin Panel</button>
      </div>
    )
  }

  const [messages, setMessages]           = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [input, setInput]                 = useState('')
  const [streaming, setStreaming]         = useState(false)
  const [clearing, setClearing]           = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const messagesRef = useRef(null)
  // Whether we should auto-follow new content — true by default, but turned
  // off the moment the user scrolls away from the bottom so reading earlier
  // messages during a streaming reply doesn't keep getting yanked away.
  const autoScrollRef = useRef(true)

  useEffect(() => {
    api.get('/api/chat/history')
      .then(data => setMessages(data))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [])

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

  function handleMessagesScroll() {
    const el = messagesRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    autoScrollRef.current = distanceFromBottom < 120
  }

  async function sendMessage() {
    if (!input.trim() || streaming) return

    // Sending a message is an intentional action — resume following the
    // conversation even if the user had scrolled up beforehand.
    autoScrollRef.current = true

    const userText = input.trim()
    setInput('')

    const history = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    }))

    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', text: '', live: true }])

    try {
      await streamChat({
        message: userText,
        conversationHistory: history,
        context: {},
        onChunk: (chunk) => {
          setMessages(prev => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            updated[updated.length - 1] = { ...last, text: last.text + chunk }
            return updated
          })
        },
        onDone: () => {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], live: false }
            return updated
          })
          setStreaming(false)
        },
      })
    } catch (err) {
      const isStale = err?.message?.toLowerCase().includes('not found') || err?.message?.toLowerCase().includes('unauthorized')
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          text: isStale
            ? 'Your session has expired. Please log out and sign in again.'
            : 'Something went wrong. Please try again.',
          live: false,
        }
        return updated
      })
      setStreaming(false)
    }
  }

  async function clearChat() {
    setClearing(true)
    try {
      await api.del('/api/chat/history')
      setMessages([])
    } catch {}
    setClearing(false)
    setShowClearConfirm(false)
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="max-w-container mx-auto px-6 py-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="mb-5 shrink-0">
        <h1 className="text-2xl font-bold text-on-surface">AI Mentor</h1>
        <p className="text-sm text-on-surface-variant">
          Ask anything about your simulation, career path, or skills. Your mentor knows your progress.
        </p>
      </div>

      {/* Main grid — fills remaining height */}
      <div className="grid grid-cols-4 gap-5 flex-1 min-h-0">

        {/* ── Col 1: Mentor card ── */}
        <div className="col-span-1 self-start">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden">
                  <img src={aiMentorIcon} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">AI Mentor</p>
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                  Always available
                </p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your mentor reads your simulation progress, skill scores, and XP automatically — no need to explain your context.
            </p>
            <div className="mt-4 pt-3 border-t border-border">
              {['Data Analysis', 'Python & SQL', 'Career Guidance', 'Simulation Help'].map(tag => (
                <span key={tag} className="inline-block mr-1.5 mb-1 chip">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Col 2–4: Chat ── */}
        <div className="col-span-3 flex flex-col min-h-0">
          <div className="card flex flex-col h-full min-h-0">

            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-border mb-4 shrink-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg overflow-hidden">
                  <img src={aiMentorIcon} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">AI Mentor</p>
                <p className="text-xs text-on-surface-variant">Reads your simulation progress, skill scores &amp; XP</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {messages.length > 0 && !showClearConfirm && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs text-on-surface-variant hover:text-red-500 font-medium transition-colors flex items-center gap-1"
                  >
                    <TrashIcon /> Clear chat
                  </button>
                )}
                {showClearConfirm && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">Delete all messages?</span>
                    <button
                      onClick={clearChat}
                      disabled={clearing}
                      className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {clearing ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="text-xs text-on-surface-variant hover:text-on-surface font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Live
                </span>
              </div>
            </div>

            {/* Messages — fixed height, scrolls inside */}
            <div ref={messagesRef} onScroll={handleMessagesScroll} className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 mb-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-10">
                  <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 mt-0.5">
                    <img src={aiMentorIcon} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-surface-low border border-border rounded-lg rounded-tl-none px-3 py-2.5 text-xs leading-relaxed text-on-surface" style={{ maxWidth: '78%' }}>
                    Hi {firstName}! I'm your AI Mentor. I can see your simulation progress, skill scores, and XP — so feel free to ask me anything without explaining your context. What would you like help with?
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={msg.id ?? i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 mt-0.5">
                      <img src={aiMentorIcon} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div style={{ maxWidth: '78%' }}>
                    <div className={`px-3 py-2.5 rounded-lg text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-surface-low border border-border text-on-surface rounded-tl-none'
                    }`}>
                      {msg.text}
                      {msg.live && <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="shrink-0">
              <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors bg-white">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask anything about your simulation, career, or skills..."
                  className="flex-1 text-sm outline-none bg-transparent text-on-surface placeholder-gray-400"
                  disabled={streaming}
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={sendMessage}
                    disabled={streaming || !input.trim()}
                    className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <SendIcon />
                  </button>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5 text-center">
                Your simulation history, quiz scores and skill gaps are sent automatically with every message.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}


function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}
