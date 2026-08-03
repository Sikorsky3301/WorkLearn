import { Loader2 } from 'lucide-react'
import { Input } from '../../../../components/ui/shadcn/input'
import { Textarea } from '../../../../components/ui/shadcn/textarea'
import { Label } from '../../../../components/ui/shadcn/label'
import { Card, CardContent } from '../../../../components/ui/shadcn/card'
import { Button } from '../../../../components/ui/shadcn/button'
import LogoUploadField from '../shared/LogoUploadField'

function patch(draft, setDraft, path, value) {
  const next = structuredClone(draft)
  let obj = next
  const keys = path.split('.')
  for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
  obj[keys[keys.length - 1]] = value
  setDraft(next)
}

export default function ManagerOnboardingTab({ draft, setDraft, onSave, saving }) {
  const p = (path) => (e) => patch(draft, setDraft, path, e.target.value)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Manager</h3>
          <LogoUploadField
            label="Manager photo"
            round
            value={draft.manager?.photo_url}
            onChange={(v) => patch(draft, setDraft, 'manager.photo_url', v)}
          />
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label className="mb-1.5 block">Name</Label>
              <Input value={draft.manager?.name || ''} onChange={p('manager.name')} />
            </div>
            <div>
              <Label className="mb-1.5 block">Role</Label>
              <Input value={draft.manager?.role || ''} onChange={p('manager.role')} />
            </div>
            <div>
              <Label className="mb-1.5 block">Avatar initials (fallback if no photo)</Label>
              <Input value={draft.manager?.avatar || ''} maxLength={2} onChange={p('manager.avatar')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Onboarding</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Company name</Label>
              <Input value={draft.onboarding?.company?.name || ''} onChange={p('onboarding.company.name')} />
            </div>
            <div>
              <Label className="mb-1.5 block">Industry</Label>
              <Input value={draft.onboarding?.company?.industry || ''} onChange={p('onboarding.company.industry')} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">About the company</Label>
            <Textarea rows={2} value={draft.onboarding?.company?.about || ''} onChange={p('onboarding.company.about')} />
          </div>
          <div>
            <Label className="mb-1.5 block">Manager's intro message</Label>
            <Textarea rows={5} value={draft.onboarding?.intro || ''} onChange={p('onboarding.intro')} />
          </div>
          <div>
            <Label className="mb-1.5 block">What you'll learn (one per line)</Label>
            <Textarea
              rows={4}
              value={(draft.onboarding?.learn || []).join('\n')}
              onChange={(e) => patch(draft, setDraft, 'onboarding.learn', e.target.value.split('\n').filter(Boolean))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Offer letter</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Offer title</Label>
              <Input value={draft.onboarding?.offer?.title || ''} onChange={p('onboarding.offer.title')} />
            </div>
            <div>
              <Label className="mb-1.5 block">Role</Label>
              <Input value={draft.onboarding?.offer?.role || ''} onChange={p('onboarding.offer.role')} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Offer body</Label>
            <Textarea rows={4} value={draft.onboarding?.offer?.body || ''} onChange={p('onboarding.offer.body')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
        </Button>
      </div>
    </div>
  )
}
