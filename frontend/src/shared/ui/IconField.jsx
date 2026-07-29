/** Text input with a leading icon — used anywhere a contact-style field
 * (phone, location, LinkedIn, GitHub, website...) needs a visual hint of
 * what it's for. Shared by EditProfileModal and the onboarding wizard's
 * ContactStep so both stay visually identical. */
export default function IconField({ icon: Icon, className = '', value, onChange, ...rest }) {
  return (
    <div className={`relative ${className}`}>
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant pointer-events-none" />
      <input {...rest} value={value} onChange={(e) => onChange(e.target.value)} className="input text-sm pl-9" />
    </div>
  )
}
