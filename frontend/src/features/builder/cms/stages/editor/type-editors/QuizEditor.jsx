import { Plus } from 'lucide-react'
import { Input } from '../../../../../../components/ui/shadcn/input'

// ── quiz ──────────────────────────────────────────────────────────────────
export default function QuizEditor({ questions, onChange }) {
  function update(i, patch) {
    const next = [...questions]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  function add() { onChange([...questions, { question: '', options: ['', ''], correct: 0 }]) }
  function remove(i) { onChange(questions.filter((_, idx) => idx !== i)) }

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="border border-border rounded-lg p-3 space-y-2">
          <Input value={q.question} placeholder="Question" onChange={(e) => update(i, { question: e.target.value })} />
          {(q.options || []).map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <input type="radio" checked={q.correct === oi} onChange={() => update(i, { correct: oi })} />
              <Input
                value={opt}
                placeholder={`Option ${oi + 1}`}
                onChange={(e) => {
                  const opts = [...q.options]; opts[oi] = e.target.value
                  update(i, { options: opts })
                }}
              />
            </div>
          ))}
          <button type="button" onClick={() => update(i, { options: [...(q.options || []), ''] })} className="text-xs text-primary">+ option</button>
          <button onClick={() => remove(i)} className="text-xs text-red-500 ml-3">Remove question</button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add question</button>
    </div>
  )
}
