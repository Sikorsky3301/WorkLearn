import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Check } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { useUpdateSimulation } from '../../../../hooks'
import MetadataTab from '../../cms/tabs/MetadataTab'
import ManagerOnboardingTab from '../../cms/tabs/ManagerOnboardingTab'

// Setup and Onboarding.
//
// Both wrap the CMS builder's existing tabs rather than reimplementing them —
// those forms are correct, they cover every field on the model, and rewriting
// them would be churn with a real chance of dropping one. What they lacked was
// a place to live that made sense next to the task pages, and a save control
// that says whether there is anything to save.

function PageShell({ title, standfirst, dirty, saving, onSave, children }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-white px-8 py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h2 className="font-display text-[1.6rem] font-extrabold leading-tight tracking-tight text-on-surface">
              {title}
            </h2>
            <p className="mt-1.5 max-w-xl text-[0.85rem] leading-relaxed text-on-surface-variant">
              {standfirst}
            </p>
          </div>
          <button
            onClick={onSave}
            disabled={!dirty || saving}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[0.82rem] font-bold transition-colors',
              dirty ? 'bg-on-surface text-white hover:bg-primary cursor-pointer' : 'bg-surface-low text-outline cursor-default'
            )}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : dirty ? null : <Check className="h-3.5 w-3.5" />}
            {saving ? 'Saving' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
        <div className="max-w-3xl">{children}</div>
      </div>
    </div>
  )
}

function useSimDraft(sim, simId) {
  const [draft, setDraft] = useState(sim)
  const update = useUpdateSimulation(simId)
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(sim), [draft, sim])

  useEffect(() => { setDraft((d) => (dirty ? d : sim)) }, [sim]) // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    update.mutate(draft, {
      onSuccess: () => toast.success('Saved'),
      onError: (e) => toast.error(e.message || 'Could not save'),
    })
  }

  return { draft, setDraft, dirty, saving: update.isPending, save }
}

export function SetupPage({ sim, simId }) {
  const { draft, setDraft, dirty, saving, save } = useSimDraft(sim, simId)

  return (
    <PageShell
      title="Setup"
      standfirst="The card a student sees before they enrol, and the details every page of the simulation reads from."
      dirty={dirty} saving={saving} onSave={save}
    >
      <MetadataTab draft={draft} setDraft={setDraft} isNew={false} />
    </PageShell>
  )
}

export function OnboardingPage({ sim, simId }) {
  const { draft, setDraft, dirty, saving, save } = useSimDraft(sim, simId)

  return (
    <PageShell
      title="Onboarding"
      standfirst="The first five minutes: who the student is working for, who their manager is, and the offer letter that puts them in the role."
      dirty={dirty} saving={saving} onSave={save}
    >
      <ManagerOnboardingTab draft={draft} setDraft={setDraft} onSave={save} saving={saving} />
    </PageShell>
  )
}
