import { Video as VideoIcon } from 'lucide-react'
import { Input } from '../../../../shared/ui/shadcn/input'
import { Label } from '../../../../shared/ui/shadcn/label'

export const meta = { label: 'Video', icon: VideoIcon }

export function Editor({ config, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">Video URL</Label>
        <Input value={config.url || ''} placeholder="YouTube, Vimeo, or direct .mp4 URL" onChange={(e) => onChange({ ...config, url: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Caption</Label>
        <Input value={config.caption || ''} onChange={(e) => onChange({ ...config, caption: e.target.value })} />
      </div>
    </div>
  )
}

function toEmbedUrl(url) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

export function Preview({ config }) {
  if (!config.url) {
    return (
      <div className="h-40 rounded-lg bg-surface-low border border-dashed border-border flex items-center justify-center text-on-surface-variant/50">
        <VideoIcon className="h-8 w-8" />
      </div>
    )
  }
  const embedUrl = toEmbedUrl(config.url)
  return (
    <figure>
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        {embedUrl ? (
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={config.caption || 'Video'} />
        ) : (
          <video src={config.url} controls className="w-full h-full" />
        )}
      </div>
      {config.caption && <figcaption className="text-xs text-on-surface-variant mt-1.5 text-center">{config.caption}</figcaption>}
    </figure>
  )
}
