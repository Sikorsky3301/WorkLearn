import { useState } from 'react'
import { Plus, Trash2, CheckSquare } from 'lucide-react'
import { useCrmSimStore } from '../../../../../app/store/useCrmSimStore'
import { Card, CardContent } from '../../../../../components/ui/shadcn/card'
import { Button } from '../../../../../components/ui/shadcn/button'
import { Input } from '../../../../../components/ui/shadcn/input'
import { Label } from '../../../../../components/ui/shadcn/label'
import { Badge } from '../../../../../components/ui/shadcn/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../../components/ui/shadcn/select'
import { cn } from '../../../../../lib/cn'
import { formatDate } from './crmConstants'

const PRIORITIES = { high: 'danger', medium: 'warning', low: 'secondary' }

export default function CrmTasks() {
  const tasks = useCrmSimStore((s) => s.crm.tasks)
  const addTask = useCrmSimStore((s) => s.addTask)
  const toggleTask = useCrmSimStore((s) => s.toggleTask)
  const deleteTask = useCrmSimStore((s) => s.deleteTask)

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')

  function handleAdd() {
    if (!title.trim()) return
    addTask({ title: title.trim(), dueDate: dueDate || null, priority })
    setTitle('')
    setDueDate('')
  }

  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-on-surface">Tasks</h1>

      <Card>
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-[1fr_150px_130px_auto] gap-3 items-end">
            <div>
              <Label className="mb-1.5 block">Task</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Follow up on pricing question" />
            </div>
            <div>
              <Label className="mb-1.5 block">Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd}><Plus className="h-4 w-4" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl bg-white">
          <CheckSquare className="h-8 w-8 text-outline mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">No tasks yet — every opportunity needs a next step.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {[...open, ...done].map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-white border border-border rounded-lg">
              <button
                onClick={() => toggleTask(t.id)}
                className={cn(
                  'h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                  t.done ? 'bg-emerald-500 border-emerald-500' : 'border-border hover:border-primary'
                )}
              >
                {t.done && <CheckSquare className="h-3.5 w-3.5 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', t.done ? 'line-through text-on-surface-variant' : 'text-on-surface')}>{t.title}</p>
                {t.dueDate && <p className="text-[11px] text-on-surface-variant">Due {formatDate(t.dueDate)}</p>}
              </div>
              <Badge variant={PRIORITIES[t.priority] ?? 'secondary'} className="capitalize shrink-0">{t.priority}</Badge>
              <button onClick={() => deleteTask(t.id)} className="text-outline hover:text-red-600 transition-colors shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
