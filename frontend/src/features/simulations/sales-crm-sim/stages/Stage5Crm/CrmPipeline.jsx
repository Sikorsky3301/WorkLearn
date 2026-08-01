import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { useCrmSimStore } from '../../../../../stores/useCrmSimStore'
import { cn } from '../../../../../lib/cn'
import { PIPELINE_STAGES, STAGE_DEFAULT_PROBABILITY, formatCurrency, formatDate } from './crmConstants'

function OpportunityCard({ opp, accountName, dragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: opp.id })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'bg-white border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:border-primary/40 transition-colors',
        dragging && 'opacity-40'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-on-surface leading-snug">{opp.name}</p>
        <GripVertical className="h-3.5 w-3.5 text-outline shrink-0 mt-0.5" />
      </div>
      <p className="text-xs text-on-surface-variant mt-1">{accountName}</p>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-sm font-bold text-primary">{formatCurrency(opp.amount)}</span>
        <span className="text-[11px] text-on-surface-variant">{opp.probability}%</span>
      </div>
      <p className="text-[11px] text-on-surface-variant mt-1">Close: {formatDate(opp.expectedCloseDate)}</p>
    </div>
  )
}

function Column({ stage, opportunities, accounts }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const total = opportunities.reduce((s, o) => s + (Number(o.amount) || 0), 0)

  return (
    <div className="w-64 shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs font-bold text-on-surface uppercase tracking-wide">{stage}</p>
        <span className="text-[11px] text-on-surface-variant">{opportunities.length}</span>
      </div>
      <p className="text-[11px] text-on-surface-variant px-1 mb-2">{formatCurrency(total)}</p>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[300px] rounded-lg p-2 space-y-2 border-2 border-dashed transition-colors',
          isOver ? 'border-primary/50 bg-primary/5' : 'border-transparent bg-surface-container/40'
        )}
      >
        {opportunities.map((o) => (
          <OpportunityCard key={o.id} opp={o} accountName={accounts.find((a) => a.id === o.accountId)?.name ?? '—'} />
        ))}
      </div>
    </div>
  )
}

export default function CrmPipeline() {
  const opportunities = useCrmSimStore((s) => s.crm.opportunities)
  const accounts = useCrmSimStore((s) => s.crm.accounts)
  const updateOpportunity = useCrmSimStore((s) => s.updateOpportunity)
  const [activeId, setActiveId] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const newStage = over.id
    const opp = opportunities.find((o) => o.id === active.id)
    if (!opp || opp.stage === newStage) return
    updateOpportunity(opp.id, { stage: newStage, probability: STAGE_DEFAULT_PROBABILITY[newStage] ?? opp.probability })
    toast.success(`"${opp.name}" moved to ${newStage}`)
  }

  const activeOpp = opportunities.find((o) => o.id === activeId)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-on-surface">Pipeline</h1>
      {opportunities.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl bg-white">
          <p className="text-sm text-on-surface-variant">Create an opportunity in the Opportunities tab to see it here.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {PIPELINE_STAGES.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                accounts={accounts}
                opportunities={opportunities.filter((o) => o.stage === stage)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeOpp && <OpportunityCard opp={activeOpp} accountName={accounts.find((a) => a.id === activeOpp.accountId)?.name ?? '—'} />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
