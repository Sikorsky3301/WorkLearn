import { useState } from 'react'
import { Phone, Mail, Users2, StickyNote, Plus } from 'lucide-react'
import { useCrmSimStore } from '../../store/useCrmSimStore'
import { Card, CardContent } from '../../../../../shared/ui/shadcn/card'
import { Button } from '../../../../../shared/ui/shadcn/button'
import { Input } from '../../../../../shared/ui/shadcn/input'
import { Textarea } from '../../../../../shared/ui/shadcn/textarea'
import { Label } from '../../../../../shared/ui/shadcn/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../../shared/ui/shadcn/select'
import { ACTIVITY_TYPES } from './crmConstants'

const TYPE_ICON = { Call: Phone, Email: Mail, Meeting: Users2, Note: StickyNote }

export default function CrmActivities() {
  const activities = useCrmSimStore((s) => s.crm.activities)
  const addActivity = useCrmSimStore((s) => s.addActivity)
  const [type, setType] = useState('Call')
  const [subject, setSubject] = useState('')
  const [notes, setNotes] = useState('')

  function handleAdd() {
    if (!subject.trim()) return
    addActivity({ type, subject: subject.trim(), notes: notes.trim() })
    setSubject('')
    setNotes('')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-on-surface">Activities</h1>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid sm:grid-cols-[140px_1fr] gap-3">
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Left voicemail re: pricing question" />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional details..." />
          </div>
          <Button onClick={handleAdd} size="sm"><Plus className="h-3.5 w-3.5" /> Log activity</Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {activities.length === 0 && (
          <p className="text-sm text-on-surface-variant text-center py-6">No activities logged yet.</p>
        )}
        {activities.map((a) => {
          const Icon = TYPE_ICON[a.type] ?? StickyNote
          return (
            <div key={a.id} className="flex items-start gap-3 p-3 bg-white border border-border rounded-lg">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-on-surface">{a.subject}</p>
                  <span className="text-[11px] text-on-surface-variant shrink-0">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                {a.notes && <p className="text-xs text-on-surface-variant mt-0.5">{a.notes}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
