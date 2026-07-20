import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Clock, Lightbulb, CheckCircle2, Trophy } from 'lucide-react'
import { useEnrollment, useEnroll, useOnboarding } from '../../../shared/api/hooks'
import { cn } from '../../../shared/utils/cn'
import { Popover, PopoverTrigger, PopoverContent } from '../../../shared/ui/shadcn/popover'
import { Badge } from '../../../shared/ui/shadcn/badge'
import { useCrmSimStore } from './store/useCrmSimStore'
import { useSimTimer, formatElapsed } from './engine/useSimEngine'
import { STAGES, SIM_META, stageByIndex } from './engine/simulationConfig'
import SimOnboarding from '../SimOnboarding'
import nimbusLogoImg from '../../../assets/nimbus-logo.png'

import Stage1LeadQualification from './stages/Stage1LeadQualification'
import Stage2Research from './stages/Stage2Research'
import Stage3ColdOutreach from './stages/Stage3ColdOutreach'
import Stage4DiscoveryCall from './stages/Stage4DiscoveryCall'
import Stage5Crm from './stages/Stage5Crm'
import Stage6ObjectionHandling from './stages/Stage6ObjectionHandling'
import Stage7Proposal from './stages/Stage7Proposal'
import Stage8Close from './stages/Stage8Close'
import SimResults from './results/SimResults'

const STAGE_COMPONENTS = {
  1: Stage1LeadQualification,
  2: Stage2Research,
  3: Stage3ColdOutreach,
  4: Stage4DiscoveryCall,
  5: Stage5Crm,
  6: Stage6ObjectionHandling,
  7: Stage7Proposal,
  8: Stage8Close,
}

const SIM_ID = 'sales-crm-sim'

function StageStepper({ currentStageIndex, completedStages, onJump }) {
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage) => {
        const done = completedStages.includes(stage.index)
        const active = currentStageIndex === stage.index
        const unlocked = done || active || completedStages.includes(stage.index - 1) || stage.index === 1
        return (
          <button
            key={stage.id}
            type="button"
            disabled={!unlocked}
            onClick={() => unlocked && onJump(stage.index)}
            title={stage.title}
            className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors shrink-0',
              done && 'bg-emerald-500 text-white',
              !done && active && 'bg-primary text-white ring-2 ring-primary/25',
              !done && !active && unlocked && 'bg-surface-high text-on-surface-variant hover:bg-surface-container cursor-pointer',
              !unlocked && 'bg-surface-high text-outline/50 cursor-not-allowed'
            )}
          >
            {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : stage.index}
          </button>
        )
      })}
    </div>
  )
}

export default function CrmSimShell() {
  const navigate = useNavigate()

  const status = useCrmSimStore((s) => s.status)
  const enrollmentId = useCrmSimStore((s) => s.enrollmentId)
  const currentStageIndex = useCrmSimStore((s) => s.currentStageIndex)
  const completedStages = useCrmSimStore((s) => s.completedStages)
  const elapsedSeconds = useCrmSimStore((s) => s.elapsedSeconds)
  const startSimulation = useCrmSimStore((s) => s.startSimulation)
  const goToStage = useCrmSimStore((s) => s.goToStage)

  const { data: enrollment, isError: enrollError } = useEnrollment(SIM_ID)
  const { mutate: enroll, isPending: enrolling } = useEnroll(SIM_ID)
  const { data: onboarding, isLoading: onboardingLoading } = useOnboarding(SIM_ID)
  const triedEnroll = useRef(false)
  const [onboardingGate, setOnboardingGate] = useState(null)
  // Lets a candidate who has already finished revisit any stage's content
  // read-only-ish (fields are still technically editable, but re-completing
  // an already-completed stage is a guarded no-op — see useStageCompletion)
  // without losing the results screen; toggled from SimResults / the header.
  const [reviewMode, setReviewMode] = useState(false)

  useSimTimer()

  useEffect(() => {
    if (enrollmentId) return
    if (enrollment?.id) {
      startSimulation(enrollment.id)
      return
    }
    if (enrollError && !triedEnroll.current && !enrolling) {
      triedEnroll.current = true
      enroll(undefined, { onSuccess: (res) => startSimulation(res.enrollment.id) })
    }
  }, [enrollment, enrollError, enrolling, enrollmentId, enroll, startSimulation])

  // Latch the onboarding gate once on first load (so accepting doesn't yank
  // the celebration screen out from under the user) — same pattern as
  // DASimulationWorkspace's onboarding gate.
  useEffect(() => {
    if (onboarding && onboardingGate === null) {
      setOnboardingGate(!onboarding.accepted)
    }
  }, [onboarding, onboardingGate])

  const stage = stageByIndex(currentStageIndex)
  const StageComponent = STAGE_COMPONENTS[currentStageIndex]
  const progressPct = Math.round((completedStages.length / STAGES.length) * 100)

  if (status === 'completed' && !reviewMode) {
    return <SimResults onReviewStages={() => setReviewMode(true)} />
  }

  if (onboardingLoading || onboardingGate === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-low">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (onboardingGate) {
    return <SimOnboarding sim={SIM_ID} onAccept={() => setOnboardingGate(false)} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-low">
      {/* Immersive top bar — replaces the global Navbar's visual weight without unmounting it */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-container mx-auto px-6 h-14 flex items-center gap-4">
          {reviewMode ? (
            <button
              onClick={() => setReviewMode(false)}
              className="flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors text-sm font-semibold shrink-0"
            >
              <Trophy className="h-4 w-4" /> Back to Results
            </button>
          ) : (
            <button
              onClick={() => navigate('/simulations/sales-crm-sim/overview')}
              className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium shrink-0"
            >
              <X className="h-4 w-4" /> Exit
            </button>
          )}

          <div className="h-6 w-px bg-border shrink-0" />

          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <img src={nimbusLogoImg} alt={SIM_META.company} className="h-5 w-auto object-contain shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface leading-tight truncate">{SIM_META.company}</p>
              <p className="text-[11px] text-on-surface-variant leading-tight">{SIM_META.product}</p>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <StageStepper currentStageIndex={currentStageIndex} completedStages={completedStages} onJump={goToStage} />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {reviewMode ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-transparent hidden sm:inline-flex">Reviewing completed simulation</Badge>
            ) : (
              <Badge variant="secondary" className="hidden sm:inline-flex">{progressPct}% complete</Badge>
            )}
            <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant tabular-nums">
              <Clock className="h-3.5 w-3.5" /> {formatElapsed(elapsedSeconds)}
            </span>
            <HintsCoach stage={stage} />
          </div>
        </div>
      </header>

      {/* Main stage content */}
      <main className="flex-1">
        {currentStageIndex === 5 ? (
          StageComponent && <StageComponent />
        ) : (
          <div className="max-w-container mx-auto px-6 py-8">
            {StageComponent && <StageComponent />}
          </div>
        )}
      </main>

      {/* In-character footer instead of the global site Footer (see FOOTERLESS_ROUTES in App.jsx) */}
      <footer className="border-t border-border bg-white py-3">
        <div className="max-w-container mx-auto px-6 flex items-center gap-2.5 text-xs text-on-surface-variant">
          {SIM_META.manager.photo ? (
            <img src={SIM_META.manager.photo} alt={SIM_META.manager.name} className="h-6 w-6 rounded-full object-cover shrink-0" />
          ) : (
            <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {SIM_META.manager.avatar}
            </span>
          )}
          <span>
            <span className="font-semibold text-on-surface">{SIM_META.manager.name}</span> · {SIM_META.manager.role}, {SIM_META.company}
          </span>
        </div>
      </footer>
    </div>
  )
}

function HintsCoach({ stage }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary transition-colors"
        >
          <Lightbulb className="h-3.5 w-3.5" /> AI Coach
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Hints — {stage.shortTitle}</p>
        <ul className="space-y-2 mb-3">
          {stage.hints.map((h, i) => (
            <li key={i} className="text-xs text-on-surface-variant leading-relaxed flex items-start gap-1.5">
              <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" /> {h}
            </li>
          ))}
        </ul>
        <div className="pt-2 border-t border-border">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">This stage is scored on</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(stage.rubric).map(([key, weight]) => (
              <Badge key={key} variant="outline" className="text-[10px]">
                {key} {Math.round(weight * 100)}%
              </Badge>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
