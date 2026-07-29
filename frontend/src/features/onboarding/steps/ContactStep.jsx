import { Phone, MapPin, Briefcase, FolderGit2, Globe } from 'lucide-react'
import IconField from '../../../shared/ui/IconField'

export default function ContactStep({ value, onChange }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <IconField icon={Phone} placeholder="Phone number" value={value.phone} onChange={(v) => onChange('phone', v)} />
        <IconField icon={MapPin} placeholder="Location" value={value.location} onChange={(v) => onChange('location', v)} />
        <IconField icon={Briefcase} placeholder="LinkedIn URL" value={value.linkedin_url} onChange={(v) => onChange('linkedin_url', v)} />
        <IconField icon={FolderGit2} placeholder="GitHub URL" value={value.github_url} onChange={(v) => onChange('github_url', v)} />
        <IconField icon={Globe} placeholder="Website URL" value={value.website_url} onChange={(v) => onChange('website_url', v)} className="col-span-2" />
      </div>
      <p className="text-xs text-on-surface-variant mt-4">
        Everything here is optional and can be changed anytime from your Portfolio.
      </p>
    </div>
  )
}
