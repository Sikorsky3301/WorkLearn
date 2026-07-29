import { useRef } from 'react'
import { Camera } from 'lucide-react'

export default function ProfileStep({ value, onChange, photoPreview, onPhotoSelect, name }) {
  const fileRef = useRef(null)
  const initials = name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          {photoPreview ? (
            <img src={photoPreview} alt="" className="w-20 h-20 rounded-2xl object-cover border border-border" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors cursor-pointer"
            aria-label="Add photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhotoSelect(f) }}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-on-surface">Add a profile photo</p>
          <p className="text-xs text-on-surface-variant">Optional — helps recruiters recognize you. PNG/JPG/WEBP, up to 5MB.</p>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Headline</label>
        <input
          className="input text-sm" placeholder="e.g. Aspiring Data Analyst"
          value={value.headline} onChange={(e) => onChange('headline', e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Bio</label>
        <textarea
          rows={3} className="input text-sm resize-none" placeholder="A short summary about you and what you're working towards"
          value={value.bio} onChange={(e) => onChange('bio', e.target.value)}
        />
      </div>
    </div>
  )
}
