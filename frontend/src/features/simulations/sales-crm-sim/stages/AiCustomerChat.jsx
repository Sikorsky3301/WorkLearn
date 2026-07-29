import { useEffect, useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAiCustomer } from '../../../../shared/api/hooks'
import { personalityMeta, moodMeta } from '../ai/aiCustomerPersonalities'
import { Badge } from '../../../../shared/ui/shadcn/badge'
import { Textarea } from '../../../../shared/ui/shadcn/textarea'
import { Button } from '../../../../shared/ui/shadcn/button'
import { cn } from '../../../../shared/utils/cn'

/** Shared discovery-call / objection-handling chat UI — Stage 4 and Stage 6
 * are the same "talk to the AI customer" engine with a different `mode` and
 * conversational posture (see ai_customer_system_prompt on the backend). */
export default function AiCustomerChat({ mode, contact, personalityKey, transcript, mood, onAppendMessage, onMoodChange, promptContext }) {
  const [input, setInput] = useState('')
  const { mutate: sendToAi, isPending } = useAiCustomer()
  const scrollRef = useRef(null)
  const persona = personalityMeta(personalityKey)
  const moodInfo = moodMeta(mood)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [transcript, isPending])

  function handleSend() {
    const text = input.trim()
    if (!text || isPending) return

    onAppendMessage({ role: 'user', content: text, timestamp: new Date().toISOString() })
    setInput('')

    sendToAi(
      {
        personality: personalityKey,
        mood,
        mode,
        history: transcript.map((m) => ({ role: m.role, content: m.content })),
        message: text,
        context: promptContext,
      },
      {
        onSuccess: (res) => {
          onAppendMessage({ role: 'assistant', content: res.reply, timestamp: new Date().toISOString() })
          if (res.mood) onMoodChange(res.mood)
        },
        onError: () => toast.error('The AI customer is unavailable right now — try again.'),
      }
    )
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[560px] rounded-xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-surface-low">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
            {contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{contact.name}</p>
            <p className="text-xs text-on-surface-variant truncate">{contact.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className={cn('border-transparent', persona.color)}>{persona.label}</Badge>
          <Badge className={cn('border-transparent', moodInfo.color)}>{moodInfo.emoji} {moodInfo.label}</Badge>
        </div>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {transcript.length === 0 && (
          <p className="text-xs text-on-surface-variant text-center py-8">
            Say hello to start the {mode === 'discovery' ? 'discovery call' : 'conversation'}.
          </p>
        )}
        {transcript.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[75%] rounded-xl px-3.5 py-2 text-sm leading-relaxed',
                m.role === 'user' ? 'bg-primary text-white' : 'bg-surface-low text-on-surface'
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex justify-start">
            <div className="bg-surface-low rounded-xl px-3.5 py-2 text-sm text-on-surface-variant flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> typing…
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 flex items-end gap-2">
        <Textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message… (Enter to send, Shift+Enter for a new line)"
          className="resize-none"
        />
        <Button size="icon" onClick={handleSend} disabled={isPending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
