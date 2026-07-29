import { useCrmSimStore } from '../../store/useCrmSimStore'
import { useStageCompletion } from '../../engine/useSimEngine'
import { stageByIndex } from '../../engine/simulationConfig'
import { StageHeader, StageFooterNav } from '../StageChrome'
import CrmShellLayout from './CrmShellLayout'

const STAGE = stageByIndex(5)

export default function Stage5Crm() {
  const crm = useCrmSimStore((s) => s.crm)
  const { completeStageIndex } = useStageCompletion()

  const criteriaMet = [
    crm.accounts.length > 0,
    crm.contacts.length > 0,
    crm.opportunities.some((o) => o.stage && o.probability != null && o.expectedCloseDate),
    crm.tasks.length > 0,
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-57px-49px)]">
      <div className="px-6 pt-5 pb-1 bg-white border-b border-border shrink-0">
        <StageHeader stage={STAGE} />
      </div>
      <div className="flex-1 min-h-0">
        <CrmShellLayout />
      </div>
      <div className="px-6 bg-white border-t border-border shrink-0">
        <StageFooterNav stage={STAGE} criteriaMet={criteriaMet} onContinue={(quizScore) => completeStageIndex(5, { quizScore })} />
      </div>
    </div>
  )
}
