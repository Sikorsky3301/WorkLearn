import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRoleplayMessage } from '../../../hooks'
import { Textarea } from '../../../shared/ui/shadcn/textarea'
import { Button } from '../../../shared/ui/shadcn/button'
import { Badge } from '../../../shared/ui/shadcn/badge'
import { Label } from '../../../shared/ui/shadcn/label'
import { cn } from '../../../lib/cn'

/** Generic AI-roleplay chat task (discovery calls, objection handling, etc.)
 * — same UX pattern as sales-crm-sim's AiCustomerChat.jsx, but persona/
 * context/mode come entirely from task.config instead of a hardcoded
 * personality file, and it posts to the generic roleplay-message endpoint. */
export default function AiRoleplayChatTask({ simId, task, onComplete }) {
  const persona = task.config?.persona || { name: 'Contact', role: '' }
  const minMessages = task.config?.min_messages_for_completion || 4

  const [transcript, setTranscript] = useState([])
  const [mood, setMood] = useState(persona.opening_mood || 'neutral')
  const [input, setInput] = useState('')
  const [notes, setNotes] = useState('')
  const { mutate: sendMessage, isPending } = useRoleplayMessage(simId, task.task_index)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [transcript, isPending])

  function handleSend() {
    const text = input.trim()
    if (!text || isPending) return
    const userMsg = { role: 'user', content: text }
    setTranscript((t) => [...t, userMsg])
    setInput('')

    sendMessage(
      { history: transcript, message: text, mood },
      {
        onSuccess: (res) => {
          setTranscript((t) => [...t, { role: 'assistant', content: res.reply }])
          if (res.mood) setMood(res.mood)
        },
        onError: () => toast.error('The AI contact is unavailable right now — try again.'),
      }
    )
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canComplete = transcript.length >= minMessages && notes.trim().length > 0

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 flex flex-col h-[520px] rounded-xl border border-border bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-surface-low">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{persona.name}</p>
            <p className="text-xs text-on-surface-variant truncate">{persona.role}</p>
          </div>
          <Badge variant="secondary">{mood}</Badge>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {transcript.length === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-8">Say hello to start the conversation.</p>
          )}
          {transcript.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[75%] rounded-xl px-3.5 py-2 text-sm leading-relaxed', m.role === 'user' ? 'bg-primary text-white' : 'bg-surface-low text-on-surface')}>
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

        <div className="border-t border-border p-3 flex items-end gap-2">
          <Textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Type your message… (Enter to send, Shift+Enter for a new line)" className="resize-none" />
          <Button size="icon" onClick={handleSend} disabled={isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-3">
        <div>
          <Label className="mb-1.5 block">Call notes</Label>
          <Textarea rows={10} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Key points, budget, timeline, next steps…" />
        </div>
        <p className="text-xs text-on-surface-variant">{transcript.length} / {minMessages}+ messages exchanged</p>
        <Button className="w-full" disabled={!canComplete} onClick={() => onComplete({ score: null, rubric_rating: { transcript, notes } })}>
          <CheckCircle2 className="h-4 w-4" /> Mark Complete
        </Button>
      </div>
    </div>
  )
}
