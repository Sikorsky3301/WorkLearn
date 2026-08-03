import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Contact as ContactIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useCrmSimStore } from '../../../../../app/store/useCrmSimStore'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../../components/ui/shadcn/table'
import { Button } from '../../../../../components/ui/shadcn/button'
import { Input } from '../../../../../components/ui/shadcn/input'
import { Label } from '../../../../../components/ui/shadcn/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../../components/ui/shadcn/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../../components/ui/shadcn/dialog'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  title: z.string().optional(),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  accountId: z.string().min(1, 'Select an account'),
})

export default function CrmContacts() {
  const contacts = useCrmSimStore((s) => s.crm.contacts)
  const accounts = useCrmSimStore((s) => s.crm.accounts)
  const addContact = useCrmSimStore((s) => s.addContact)
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  function onSubmit(values) {
    addContact(values)
    toast.success(`Contact "${values.name}" created`)
    reset()
    setOpen(false)
  }

  const accountName = (id) => accounts.find((a) => a.id === id)?.name ?? '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-on-surface">Contacts</h1>
        <Button onClick={() => setOpen(true)} disabled={accounts.length === 0}><Plus className="h-4 w-4" /> New Contact</Button>
      </div>

      {accounts.length === 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">Create an account first — every contact belongs to one.</p>
      )}

      {contacts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl bg-white">
          <ContactIcon className="h-8 w-8 text-outline mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">No contacts yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.title || '—'}</TableCell>
                  <TableCell>{accountName(c.accountId)}</TableCell>
                  <TableCell>{c.email || '—'}</TableCell>
                  <TableCell>{c.phone || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label className="mb-1.5 block">Full name</Label>
              <Input {...register('name')} placeholder="Marcus Webb" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Title</Label>
              <Input {...register('title')} placeholder="VP of Operations" />
            </div>
            <div>
              <Label className="mb-1.5 block">Account</Label>
              <Controller
                control={control}
                name="accountId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.accountId && <p className="text-xs text-red-600 mt-1">{errors.accountId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Email</Label>
                <Input {...register('email')} placeholder="marcus@atlasforge.com" />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label className="mb-1.5 block">Phone</Label>
                <Input {...register('phone')} placeholder="(555) 000-0000" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Create Contact</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
