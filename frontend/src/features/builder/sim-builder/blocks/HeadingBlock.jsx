import { Heading as HeadingIcon } from 'lucide-react'
import { Input } from '../../../../components/ui/shadcn/input'
import { Label } from '../../../../components/ui/shadcn/label'

export const meta = { label: 'Heading', icon: HeadingIcon }

export function Editor({ config, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">Text</Label>
        <Input value={config.text || ''} onChange={(e) => onChange({ ...config, text: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Level</Label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange({ ...config, level: lvl })}
              className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium cursor-pointer transition-colors ${config.level === lvl ? 'border-primary bg-primary/10 text-primary' : 'border-border text-on-surface-variant'}`}
            >
              H{lvl}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Preview({ config }) {
  const level = config.level || 2
  const sizeClass = { 1: 'text-3xl', 2: 'text-2xl', 3: 'text-xl', 4: 'text-lg' }[level] || 'text-2xl'
  const Tag = `h${level}`
  return <Tag className={`${sizeClass} font-bold text-on-surface`}>{config.text || 'Heading'}</Tag>
}
