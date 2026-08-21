import { useState } from 'react'
import { Loader2, Play } from 'lucide-react'
import { api } from '../../../../lib/client'
import { Button } from '../../../../components/ui/shadcn/button'
import { Textarea } from '../../../../components/ui/shadcn/textarea'
import MermaidPreview, { renderMermaidSvg } from './MermaidPreview'
import { AUTHOR_STARTER_MMD, TASK_TYPE_HINT } from './constants'

export default function MermaidArchitectureEditor({
  source,
  onChange,
  parseResult,
  onParseResult,
}) {
  const [previewSource, setPreviewSource] = useState('')
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState('')

  async function handleRun() {
    setRunning(true)
    setRunError('')
    try {
      await renderMermaidSvg(source)
      setPreviewSource(source)
      const plan = await api.post('/api/admin/simulations/architecture/parse', { mermaid: source })
      onParseResult?.(plan)
      if (plan.errors?.length) setRunError(plan.errors.join('; '))
    } catch (e) {
      setPreviewSource('')
      onParseResult?.(null)
      setRunError(e?.message || 'Could not run this diagram.')
    } finally {
      setRunning(false)
    }
  }

  const tasks = parseResult?.tasks || []

  return (
    <div className="space-y-4">
      <p className="text-xs text-on-surface-variant dark:text-slate-400">{TASK_TYPE_HINT}</p>
      <Textarea
        rows={16}
        value={source}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs"
        placeholder={AUTHOR_STARTER_MMD}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={handleRun} disabled={running || !source.trim()}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run
        </Button>
        <button
          type="button"
          className="text-xs font-semibold text-primary hover:underline"
          onClick={() => onChange(AUTHOR_STARTER_MMD)}
        >
          Insert example
        </button>
      </div>
      {runError && <p className="text-xs text-red-600">{runError}</p>}
      {parseResult?.warnings?.length > 0 && (
        <p className="text-xs text-amber-700">{parseResult.warnings.join(' ')}</p>
      )}
      <MermaidPreview source={previewSource} />
      {tasks.length > 0 && (
        <div className="rounded-lg border border-border dark:border-slate-700 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-surface-low dark:bg-slate-800/60 text-on-surface-variant dark:text-slate-400">
              <tr>
                <th className="text-left font-semibold px-3 py-2">#</th>
                <th className="text-left font-semibold px-3 py-2">Week</th>
                <th className="text-left font-semibold px-3 py-2">Title</th>
                <th className="text-left font-semibold px-3 py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.task_index} className="border-t border-border dark:border-slate-800 text-on-surface dark:text-slate-200">
                  <td className="px-3 py-1.5">{t.task_index}</td>
                  <td className="px-3 py-1.5">{t.week ?? '—'}</td>
                  <td className="px-3 py-1.5">{t.title}</td>
                  <td className="px-3 py-1.5 font-mono">{t.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
