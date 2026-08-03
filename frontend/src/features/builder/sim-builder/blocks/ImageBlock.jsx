import { useRef, useState } from 'react'
import { Image as ImageIcon, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImage, resolveMediaUrl } from '../../../../lib/client'
import { Input } from '../../../../components/ui/shadcn/input'
import { Label } from '../../../../components/ui/shadcn/label'
import { Button } from '../../../../components/ui/shadcn/button'

export const meta = { label: 'Image', icon: ImageIcon }

export function Editor({ config, onChange }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadImage(file)
      onChange({ ...config, url })
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">Image</Label>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 border border-border bg-surface-low rounded-lg flex items-center justify-center overflow-hidden">
            {config.url ? (
              <img src={resolveMediaUrl(config.url)} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-5 w-5 text-on-surface-variant/40" />
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <Input value={config.url || ''} placeholder="or paste an image URL…" onChange={(e) => onChange({ ...config, url: e.target.value })} className="text-xs" />
          </div>
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block">Caption</Label>
        <Input value={config.caption || ''} onChange={(e) => onChange({ ...config, caption: e.target.value })} />
      </div>
    </div>
  )
}

export function Preview({ config }) {
  if (!config.url) {
    return (
      <div className="h-40 rounded-lg bg-surface-low border border-dashed border-border flex items-center justify-center text-on-surface-variant/50">
        <ImageIcon className="h-8 w-8" />
      </div>
    )
  }
  return (
    <figure>
      <img src={resolveMediaUrl(config.url)} alt={config.caption || ''} className="w-full rounded-lg object-cover max-h-80" />
      {config.caption && <figcaption className="text-xs text-on-surface-variant mt-1.5 text-center">{config.caption}</figcaption>}
    </figure>
  )
}
