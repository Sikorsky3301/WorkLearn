import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send, Check, Undo2, Loader2, Wand2 } from 'lucide-react'
import { api } from '../../../../lib/client'
import MarkdownMessage from '../../../../components/ui/MarkdownMessage'

// The in-sandbox AI assistant: a small floating window over the editor.
//
// It can propose a rewrite of the file, but it NEVER edits the buffer on its
// own. A proposal renders as a preview with Accept / Reject, and only Accept
// writes to the editor — so the code in front of the student is always
// something they chose. Accept is also undoable for one step, because
// silently replacing a file someone has been working in is hostile even when
// they asked for it.

function ProposedCode({ code, onAccept, onReject }) {
  return (
    <div className="border border-emerald-300 bg-emerald-50">
      <div className="flex items-center gap-2 border-b border-emerald-200 px-3 py-2">
        <Wand2 className="h-3.5 w-3.5 text-emerald-700" />
        <span className="text-xs font-bold text-emerald-900">Suggested change to your file</span>
      </div>
      <pre className="max-h-52 overflow-auto bg-slate-900 p-3 font-mono text-[0.7rem] leading-relaxed text-slate-200">
        {code}
      </pre>
      <div className="flex gap-2 p-2.5">
        <button
          onClick={onAccept}
          className="inline-flex flex-1 items-center justify-center gap-1.5 bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
        >
          <Check className="h-3.5 w-3.5" /> Accept &amp; replace
        </button>
        <button
          onClick={onReject}
          className="inline-flex items-center justify-center gap-1.5 border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-50"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export default function SandboxAiPanel({
  open, onClose, slug, taskIndex, language, code, onApplyCode,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [undoTo, setUndoTo] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  // A different task is a different file and a different problem.
  useEffect(() => { setMessages([]); setUndoTo(null) }, [slug, taskIndex])

  const ask = async (text) => {
    const question = text.trim()
    if (!question || busy) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setBusy(true)
    try {
      const res = await api.post('/api/sandbox-ai/chat', {
        simulation_slug: slug,
        task_index: taskIndex,
        language,
        message: question,
        code,
        history: messages.map((m) => ({ role: m.role, content: m.text })),
      })
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: res.reply,
        proposed: res.proposed_code || null,
      }])
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: err?.message || 'The assistant is unavailable right now. Try again in a moment.',
        error: true,
      }])
    } finally {
      setBusy(false)
    }
  }

  const accept = (i, proposed) => {
    setUndoTo(code)          // snapshot BEFORE overwriting
    onApplyCode(proposed)
    setMessages((prev) => prev.map((m, idx) => (idx === i ? { ...m, applied: true, proposed: null } : m)))
  }

  const reject = (i) => {
    setMessages((prev) => prev.map((m, idx) => (idx === i ? { ...m, proposed: null, rejected: true } : m)))
  }

  // Escape closes it. A floating panel over the editor that can only be
  // dismissed by hitting one small target is a panel people leave open and
  // then type around.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="absolute bottom-4 right-4 z-30 flex max-h-[32rem] w-[22rem] flex-col border border-border bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
        <span className="flex items-center gap-2 font-display text-sm font-extrabold text-emerald-900">
          <span className="flex h-6 w-6 items-center justify-center bg-emerald-600 text-white">
            <Sparkles className="h-3 w-3" />
          </span>
          Ask AI
        </span>
        {/* A close button was already here, but as a bare 24px glyph at the
            same weight and colour as the undo beside it — nothing marked it
            as the way out. Now it has its own hit area, a hover surface and a
            divider separating it from the actions, so it reads as chrome
            rather than as a third action. */}
        <div className="flex items-center gap-0.5">
          {undoTo != null && (
            <button
              onClick={() => { onApplyCode(undoTo); setUndoTo(null) }}
              title="Undo the last accepted change"
              aria-label="Undo the last accepted change"
              className="flex h-7 w-7 items-center justify-center rounded-full text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="mx-0.5 h-4 w-px bg-emerald-300/70" aria-hidden="true" />
          <button
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close the AI panel"
            className="flex h-7 w-7 items-center justify-center rounded-full text-emerald-800 transition-colors hover:bg-emerald-600 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs leading-relaxed text-on-surface-variant">
              I can see your file and what this task needs. Ask me to explain something, or to
              write a change — you&apos;ll get to accept or reject it before anything is edited.
            </p>
            {['Why isn\'t my layout centering?', 'Add the missing footer', 'Explain this error'].map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="block w-full border border-border px-3 py-2 text-left text-xs text-on-surface transition-colors hover:border-emerald-400 hover:bg-emerald-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="space-y-2">
            <div className={m.role === 'user' ? 'flex justify-end' : ''}>
              <div
                className={`max-w-[92%] px-3 py-2 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'whitespace-pre-wrap bg-primary text-white'
                    : m.error
                      ? 'whitespace-pre-wrap border border-rose-200 bg-rose-50 text-rose-800'
                      : 'border border-border bg-surface-low/60 text-on-surface'
                }`}
              >
                {/* Only the model's prose is markdown. The student's message
                    and error text stay literal. */}
                {m.role === 'user' || m.error
                  ? m.text
                  : <MarkdownMessage>{m.text}</MarkdownMessage>}
              </div>
            </div>
            {m.proposed && (
              <ProposedCode code={m.proposed} onAccept={() => accept(i, m.proposed)} onReject={() => reject(i)} />
            )}
            {m.applied && (
              <p className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-emerald-700">
                <Check className="h-3 w-3" /> Applied to your editor
              </p>
            )}
            {m.rejected && (
              <p className="text-[0.7rem] font-semibold text-on-surface-variant">Suggestion dismissed</p>
            )}
          </div>
        ))}

        {busy && (
          <p className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(input) }} className="border-t border-border p-2.5">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your code…"
            className="min-w-0 flex-1 border border-border px-2.5 py-2 text-xs text-on-surface placeholder-on-surface-variant/60 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  )
}
