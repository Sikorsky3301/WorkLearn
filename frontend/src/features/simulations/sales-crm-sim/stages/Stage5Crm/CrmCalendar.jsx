import { useMemo, useState } from 'react'
import { isSameDay, format } from 'date-fns'
import { Plus, CalendarDays } from 'lucide-react'
import { useCrmSimStore } from '../../../../../stores/useCrmSimStore'
import { Calendar } from '../../../../../shared/ui/shadcn/calendar'
import { Card, CardContent } from '../../../../../shared/ui/shadcn/card'
import { Input } from '../../../../../shared/ui/shadcn/input'
import { Button } from '../../../../../shared/ui/shadcn/button'
import { Label } from '../../../../../shared/ui/shadcn/label'

export default function CrmCalendar() {
  const events = useCrmSimStore((s) => s.crm.events)
  const tasks = useCrmSimStore((s) => s.crm.tasks)
  const addCalendarEvent = useCrmSimStore((s) => s.addCalendarEvent)

  const [selected, setSelected] = useState(new Date())
  const [title, setTitle] = useState('')

  const dayEvents = useMemo(
    () => events.filter((e) => e.date && isSameDay(new Date(e.date), selected)),
    [events, selected]
  )
  const dayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), selected)),
    [tasks, selected]
  )

  const eventDays = useMemo(() => new Set(events.filter((e) => e.date).map((e) => new Date(e.date).toDateString())), [events])

  function handleAdd() {
    if (!title.trim()) return
    addCalendarEvent({ title: title.trim(), date: selected.toISOString() })
    setTitle('')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-on-surface">Calendar</h1>
      <div className="grid lg:grid-cols-[auto_1fr] gap-5">
        <Card className="w-fit">
          <CardContent className="p-4">
            <Calendar selected={selected} onSelect={setSelected} />
            {eventDays.size > 0 && (
              <p className="text-[11px] text-on-surface-variant mt-2">{eventDays.size} day(s) with scheduled events</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-on-surface">
              <CalendarDays className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">{format(selected, 'EEEE, MMMM d, yyyy')}</p>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="mb-1.5 block">Add event on this day</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Demo with Atlas Forge" />
              </div>
              <Button onClick={handleAdd}><Plus className="h-4 w-4" /> Add</Button>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">Events</p>
              {dayEvents.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No events scheduled.</p>
              ) : (
                <ul className="space-y-1.5">
                  {dayEvents.map((e) => (
                    <li key={e.id} className="text-sm text-on-surface bg-surface-low rounded-md px-3 py-2">{e.title}</li>
                  ))}
                </ul>
              )}
            </div>

            {dayTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">Tasks due</p>
                <ul className="space-y-1.5">
                  {dayTasks.map((t) => (
                    <li key={t.id} className="text-sm text-on-surface bg-amber-50 border border-amber-200 rounded-md px-3 py-2">{t.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
