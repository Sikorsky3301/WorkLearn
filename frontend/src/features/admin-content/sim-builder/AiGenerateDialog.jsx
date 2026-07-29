import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAiGenerateSimBuilder } from '../../../shared/api/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../shared/ui/shadcn/dialog'

/** Toolbar "AI Generate" — scoped to structural skeleton generation (Weeks
 * -> Pages -> Blocks with minimal on-topic config), not full content
 * authoring. Reuses the existing multi-provider LLM service on the backend
 * (app/services/llm.py) via POST .../ai-generate. Appends to the project,
 * never overwrites existing pages. */
export default function AiGenerateDialog({ projectId, onClose }) {
  const [prompt, setPrompt] = useState('')
  const aiGenerate = useAiGenerateSimBuilder(projectId)

  function handleGenerate() {
    if (!prompt.trim()) return
    aiGenerate.mutate(prompt.trim(), {
      onSuccess: (res) => {
        toast.success(`Added ${res.pages_created} page${res.pages_created === 1 ? '' : 's'}`)
        onClose()
      },
      onError: (e) => toast.error(e?.message || 'AI generation failed'),
    })
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Generate</DialogTitle>
          <DialogDescription>
            Describe the simulation and Sim Builder will draft a Weeks → Pages → Blocks skeleton for you to refine.
            Appended after your existing pages — nothing here gets overwritten.
          </DialogDescription>
        </DialogHeader>
        <textarea
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="e.g. A 2-week customer support onboarding simulation covering ticket triage and escalation"
          className="input w-full resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={aiGenerate.isPending || !prompt.trim()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg disabled:opacity-50 cursor-pointer"
          >
            {aiGenerate.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {aiGenerate.isPending ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
