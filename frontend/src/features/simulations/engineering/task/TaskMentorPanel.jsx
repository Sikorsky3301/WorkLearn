import { useCallback, useEffect, useRef, useState } from 'react'
import { Sparkles, Send, Square, RotateCcw, Bot, X } from 'lucide-react'
import { streamChat } from '../../../../lib/client'
import MarkdownMessage from '../../../../components/ui/MarkdownMessage'

// The AI mentor, scoped to the task you're looking at.
//
// Reuses the existing `streamChat` SSE client rather than reimplementing the
// stream, and passes a task POINTER as `context` — {simulation_slug,
// task_index}. The server resolves the real task from that and appends it to
// the system prompt (see _task_context_block in ai_mentor.py), so the mentor
// can answer "what does semantic HTML mean here" without the page having to
// ship the task text into the prompt itself.
//
// Keeps its own conversation rather than using useMentorChat: that hook loads
// the student's whole global mentor history, which is the wrong thing to drop
// someone into when they're mid-task with one specific question.

const STARTERS = [
  'Explain this task in simpler words',
  'What does the first step actually mean?',
  "I'm stuck — how do I start?",
  'What mistakes should I avoid here?',
]

function Bubble({ role, text, live }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'whitespace-pre-wrap bg-primary text-white'
            : 'border border-border bg-white text-on-surface'
        }`}
      >
        {/* The student's own message is plain text and stays that way — only
            the model's reply is markdown. Rendering user input as markdown
            would mangle any code or asterisks they typed. */}
        {isUser ? text : <MarkdownMessage>{text}</MarkdownMessage>}
        {live && !text && <span className="text-on-surface-variant">Thinking…</span>}
        {live && text && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-primary/60 align-middle" />}
      </div>
    </div>
  )
}

export default function TaskMentorPanel({ slug, taskIndex, taskTitle, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef(null)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  // A new task is a new conversation — carrying the previous task's thread
  // over would have the mentor answering about work already finished.
  useEffect(() => {
    abortRef.current?.abort()
    setMessages([])
    setInput('')
    setStreaming(false)
  }, [slug, taskIndex])

  const send = useCallback(async (text) => {
    const question = text.trim()
    if (!question || streaming) return

    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: question }, { role: 'assistant', text: '', live: true }])
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChat({
        message: question,
        conversationHistory: history,
        // Pointer only — the server reads the task from the database.
        context: { simulation_slug: slug, task_index: taskIndex },
        signal: controller.signal,
        onChunk: (chunk) => setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          next[next.length - 1] = { ...last, text: last.text + chunk }
          return next
        }),
        onDone: () => {
          setMessages((prev) => {
            const next = [...prev]
            next[next.length - 1] = { ...next[next.length - 1], live: false }
            return next
          })
          setStreaming(false)
        },
      })
    } catch (err) {
      const aborted = err?.name === 'AbortError'
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = aborted
          ? { ...next[next.length - 1], live: false }
          : { role: 'assistant', text: 'Sorry — I couldn’t answer that just now. Try again in a moment.', error: true }
        return next
      })
      setStreaming(false)
    }
  }, [messages, streaming, slug, taskIndex])

  return (
    <div className="flex h-full flex-col border-l border-border bg-surface-low/40">
      {/* Same green title box as the cards in the main column, so the rail
          reads as part of the same page rather than a bolted-on widget. */}
      <div className="flex items-center justify-between gap-3 border-b border-emerald-200 bg-emerald-50 px-5 py-3.5">
        <h2 className="flex items-center gap-2.5 font-display text-sm font-extrabold text-emerald-900">
          <span className="flex h-7 w-7 items-center justify-center bg-emerald-600 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          Ask your AI mentor
        </h2>
        <div className="flex shrink-0 items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={() => { abortRef.current?.abort(); setMessages([]) }}
              title="Start over"
              className="rounded-full p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            // Closing only hides the rail — the parent keeps this mounted, so
            // reopening returns to the same conversation.
            <button
              onClick={onClose}
              title="Close the mentor"
              aria-label="Close the mentor"
              className="rounded-full p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="border border-border bg-white p-4">
              <Bot className="mb-2 h-5 w-5 text-primary" />
              <p className="text-sm leading-relaxed text-on-surface">
                I can see <strong className="font-semibold">{taskTitle}</strong> and what it&apos;s asking for.
                Ask me anything about it — I&apos;ll explain, not just hand you the answer.
              </p>
            </div>
            <div>
              <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">
                Try asking
              </p>
              <div className="space-y-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-full border border-border bg-white px-4 py-2.5 text-left text-sm text-on-surface transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} {...m} />)
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input) }}
        className="border-t border-border bg-white p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
            }}
            rows={2}
            placeholder="Ask about this task…"
            className="min-h-0 flex-1 resize-none rounded-2xl border border-border px-4 py-2 text-sm text-on-surface placeholder-on-surface-variant/60 focus:border-primary focus:outline-none"
          />
          {streaming ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              title="Stop"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-on-surface text-white"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              title="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
