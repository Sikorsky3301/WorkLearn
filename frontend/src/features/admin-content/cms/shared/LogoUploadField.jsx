import { useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImage, resolveMediaUrl } from '../../../../lib/client'
import { Label } from '../../../../shared/ui/shadcn/label'
import { Input } from '../../../../shared/ui/shadcn/input'
import { Button } from '../../../../shared/ui/shadcn/button'

/** Shared upload widget for the CMS's two image fields (Simulation.logo_url,
 * manager.photo_url) — file upload with a live preview, plus a plain URL
 * input as a fallback for pasting an already-hosted image link. */
export default function LogoUploadField({ label, value, onChange, round = false }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadImage(file)
      onChange(url)
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <div className="flex items-center gap-3">
        <div className={`h-14 w-14 shrink-0 border border-border bg-surface-low flex items-center justify-center overflow-hidden ${round ? 'rounded-full' : 'rounded-lg'}`}>
          {value ? (
            <img src={resolveMediaUrl(value)} alt="" className="h-full w-full object-cover" />
          ) : (
            <Upload className="h-5 w-5 text-on-surface-variant/40" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload image
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Input
            value={value || ''}
            placeholder="or paste an image URL…"
            onChange={(e) => onChange(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>
    </div>
  )
}
