import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Target } from 'lucide-react'
import { toast } from 'sonner'
import { useCrmSimStore } from '../../../../../stores/useCrmSimStore'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../../shared/ui/shadcn/table'
import { Button } from '../../../../../shared/ui/shadcn/button'
import { Input } from '../../../../../shared/ui/shadcn/input'
import { Label } from '../../../../../shared/ui/shadcn/label'
import { Badge } from '../../../../../shared/ui/shadcn/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../../shared/ui/shadcn/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../../shared/ui/shadcn/dialog'
import { PIPELINE_STAGES, STAGE_DEFAULT_PROBABILITY, STAGE_COLORS, formatCurrency, formatDate } from './crmConstants'

const schema = z.object({
  name: z.string().min(2, 'Opportunity name is required'),
  accountId: z.string().min(1, 'Select an account'),
  contactId: z.string().optional(),
  stage: z.string().min(1),
  probability: z.coerce.number().min(0).max(100),
  amount: z.coerce.number().min(0),
  expectedCloseDate: z.string().min(1, 'Set an expected close date'),
})

export default function CrmOpportunities() {
  const opportunities = useCrmSimStore((s) => s.crm.opportunities)
  const accounts = useCrmSimStore((s) => s.crm.accounts)
  const contacts = useCrmSimStore((s) => s.crm.contacts)
  const addOpportunity = useCrmSimStore((s) => s.addOpportunity)
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { stage: 'Qualification', probability: 10 },
  })

  const stageValue = watch('stage')

  function onSubmit(values) {
    addOpportunity(values)
    toast.success(`Opportunity "${values.name}" created`)
    reset({ stage: 'Qualification', probability: 10 })
    setOpen(false)
  }

  function onStageChange(value) {
    setValue('stage', value)
    setValue('probability', STAGE_DEFAULT_PROBABILITY[value] ?? 10)
  }

  const accountName = (id) => accounts.find((a) => a.id === id)?.name ?? '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-on-surface">Opportunities</h1>
        <Button onClick={() => setOpen(true)} disabled={accounts.length === 0}><Plus className="h-4 w-4" /> New Opportunity</Button>
      </div>

      {opportunities.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl bg-white">
          <Target className="h-8 w-8 text-outline mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">No opportunities yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Close Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell>{accountName(o.accountId)}</TableCell>
                  <TableCell><Badge className={STAGE_COLORS[o.stage]}>{o.stage}</Badge></TableCell>
                  <TableCell>{o.probability}%</TableCell>
                  <TableCell>{formatCurrency(o.amount)}</TableCell>
                  <TableCell>{formatDate(o.expectedCloseDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Opportunity</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label className="mb-1.5 block">Opportunity name</Label>
              <Input {...register('name')} placeholder="Atlas Forge — Nimbus CRM Platform" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Account</Label>
                <Controller control={control} name="accountId" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
                {errors.accountId && <p className="text-xs text-red-600 mt-1">{errors.accountId.message}</p>}
              </div>
              <div>
                <Label className="mb-1.5 block">Contact</Label>
                <Controller control={control} name="contactId" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                    <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1.5 block">Stage</Label>
                <Select value={stageValue} onValueChange={onStageChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PIPELINE_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Probability %</Label>
                <Input type="number" min={0} max={100} {...register('probability')} />
              </div>
              <div>
                <Label className="mb-1.5 block">Amount ($)</Label>
                <Input type="number" min={0} {...register('amount')} placeholder="120000" />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Expected close date</Label>
              <Input type="date" {...register('expectedCloseDate')} />
              {errors.expectedCloseDate && <p className="text-xs text-red-600 mt-1">{errors.expectedCloseDate.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Create Opportunity</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
