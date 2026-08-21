import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminSimulation, useUpdateSimulation, useApplyArchitecture } from '../../../../hooks'
import { Button } from '../../../../components/ui/shadcn/button'
import MermaidArchitectureEditor from '../architecture/MermaidArchitectureEditor'
import { AUTHOR_STARTER_MMD } from '../architecture/constants'

export default function ArchitectureTab({ simId }) {
  const { data: sim } = useAdminSimulation(simId)
  const updateSim = useUpdateSimulation(simId)
  const applyArch = useApplyArchitecture(simId)
  const [source, setSource] = useState('')
  const [parseResult, setParseResult] = useState(null)

  useEffect(() => {
    if (!sim) return
    setSource(sim.architecture_mermaid || AUTHOR_STARTER_MMD)
  }, [sim?.id, sim?.architecture_mermaid])

  function handleSave() {
    updateSim.mutate(
      { architecture_mermaid: source },
      {
        onSuccess: () => toast.success('Architecture diagram saved'),
        onError: (e) => toast.error(e.message || 'Could not save'),
      },
    )
  }

  function handleApply(mode) {
    if (mode === 'replace' && !window.confirm('Replace all existing stages with the diagram? This cannot be undone.')) {
      return
    }
    applyArch.mutate(
      { mermaid: source, mode },
      {
        onSuccess: (res) => {
          setParseResult({ tasks: (res.tasks || []).map((t) => ({ task_index: t.task_index, title: t.title, type: t.type, week: t.week })), warnings: res.warnings || [], errors: [] })
          toast.success(mode === 'replace' ? 'Stages replaced from diagram' : 'Stages appended from diagram')
        },
        onError: (e) => toast.error(e.message || 'Could not apply diagram'),
      },
    )
  }

  if (!sim) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-bold text-on-surface dark:text-slate-100">Architecture diagram</h2>
        <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">
          Paste Mermaid flowchart code, Run it to preview the stage plan, then append or replace CMS stages.
        </p>
      </div>
      <MermaidArchitectureEditor
        source={source}
        onChange={setSource}
        parseResult={parseResult}
        onParseResult={setParseResult}
      />
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onClick={handleSave} disabled={updateSim.isPending}>
          {updateSim.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save diagram
        </Button>
        <Button variant="outline" onClick={() => handleApply('append')} disabled={applyArch.isPending || !source.trim()}>
          Append stages
        </Button>
        <Button onClick={() => handleApply('replace')} disabled={applyArch.isPending || !source.trim()}>
          Replace all stages
        </Button>
      </div>
    </div>
  )
}
