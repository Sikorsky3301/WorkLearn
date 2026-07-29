import { useState } from 'react'
import { Sparkles, StopCircle } from 'lucide-react'

/** Input row + domain-aware quick-prompt chips (from GET /api/mentor/topics,
 * see ChatSidebar) + a Stop button that swaps in for Send while a reply is
 * streaming. */
export default function ChatInput({ streaming, onSend, onStop, quickTopics = [] }) {
  const [input, setInput] = useState('')

  function handleSend() {
    if (!input.trim() || streaming) return
    onSend(input.trim())
    setInput('')
  }

  function handleQuickTopic(topic) {
    if (streaming) return
    onSend(`Can you help me with ${topic}?`)
  }

  return (
    <div className="shrink-0 px-6 pt-2 pb-4 border-t border-border bg-white">
      <div className="max-w-3xl mx-auto">
        {quickTopics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {quickTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => handleQuickTopic(topic)}
                disabled={streaming}
                className="text-[11px] font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 px-2.5 py-1 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5 border border-border rounded-2xl px-4 py-3 focus-within:border-primary transition-colors bg-white shadow-sm">
          <Sparkles className="h-4 w-4 text-primary/50 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask your AI Mentor anything..."
            className="flex-1 text-sm outline-none bg-transparent text-on-surface placeholder-gray-400"
            disabled={streaming}
          />
          <div className="flex items-center gap-2 shrink-0">
            {streaming ? (
              <button
                onClick={onStop}
                title="Stop generating"
                className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <StopCircle className="h-4 w-4 text-white" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                <SendIcon />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-on-surface-variant mt-2 text-center">
          AI Mentor may make mistakes — your progress, scores, and XP are shared automatically with every message.
        </p>
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
