import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCrmSimStore } from '../../../../../stores/useCrmSimStore'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../../shared/ui/shadcn/table'
import { Button } from '../../../../../shared/ui/shadcn/button'
import { Input } from '../../../../../shared/ui/shadcn/input'
import { Label } from '../../../../../shared/ui/shadcn/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../../shared/ui/shadcn/dialog'

const schema = z.object({
  name: z.string().min(2, 'Account name is required'),
  industry: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
})

export default function CrmAccounts() {
  const accounts = useCrmSimStore((s) => s.crm.accounts)
  const addAccount = useCrmSimStore((s) => s.addAccount)
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  function onSubmit(values) {
    addAccount(values)
    toast.success(`Account "${values.name}" created`)
    reset()
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-on-surface">Accounts</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Account</Button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl bg-white">
          <Building2 className="h-8 w-8 text-outline mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">No accounts yet. Create one for {'"'}Atlas Forge Manufacturing{'"'} to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.industry || '—'}</TableCell>
                  <TableCell>{a.website || '—'}</TableCell>
                  <TableCell>{a.phone || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Account</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label className="mb-1.5 block">Account name</Label>
              <Input {...register('name')} placeholder="Atlas Forge Manufacturing" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Industry</Label>
              <Input {...register('industry')} placeholder="Industrial Manufacturing" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Website</Label>
                <Input {...register('website')} placeholder="atlasforge.com" />
              </div>
              <div>
                <Label className="mb-1.5 block">Phone</Label>
                <Input {...register('phone')} placeholder="(555) 000-0000" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Create Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
