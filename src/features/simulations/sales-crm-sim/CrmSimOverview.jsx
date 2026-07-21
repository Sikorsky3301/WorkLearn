import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  BookOpen, Clock, Target, CheckCircle2, ChevronDown, Users, TrendingUp,
  UserSearch, Search, Mail, Phone, Database, ShieldQuestion, FileText, Trophy,
} from 'lucide-react'
import { useEnrollment } from '../../../shared/api/hooks'
import { Badge } from '../../../shared/ui/shadcn/badge'
import { Button } from '../../../shared/ui/shadcn/button'
import { cn } from '../../../shared/utils/cn'
import { STAGES, SIM_META } from './engine/simulationConfig'
import nimbusLogoImg from '../../../assets/nimbus-logo.png'

const SIM_ID = 'sales-crm-sim'
const SIM_PATH = '/simulations/sales-crm-sim'

const OBJECTIVES = [
  'Qualify an inbound lead and defend your scoring with real reasoning.',
  'Research an account like a rep who actually wants to win the deal.',
  'Write cold outreach that earns a reply, not a delete.',
  'Run a discovery call that uncovers real pain, budget, and timeline.',
  'Work a deal in a real CRM — accounts, contacts, opportunities, pipeline.',
  'Handle real objections with substance, not scripted reassurance.',
  'Build a proposal that makes an honest business case.',
  'Close — demo, signature, negotiation, and a clean handoff to onboarding.',
]

const STAT_PILLS = [
  { icon: BookOpen, label: '8 stages', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { icon: Clock, label: '3–5 hours', color: 'bg-violet-50 text-violet-700 border-violet-100' },
  { icon: Users, label: 'AI prospect calls', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { icon: TrendingUp, label: 'Live CRM & pipeline', color: 'bg-amber-50 text-amber-700 border-amber-100' },
]

// One icon + color per stage — replaces the plain numbered circle so the
// timeline reads at a glance instead of just counting up.
const STAGE_STYLE = [
  { icon: UserSearch, bg: 'bg-blue-500' },
  { icon: Search, bg: 'bg-violet-500' },
  { icon: Mail, bg: 'bg-amber-500' },
  { icon: Phone, bg: 'bg-emerald-500' },
  { icon: Database, bg: 'bg-cyan-500' },
  { icon: ShieldQuestion, bg: 'bg-rose-500' },
  { icon: FileText, bg: 'bg-indigo-500' },
  { icon: Trophy, bg: 'bg-blue-700' },
]

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

export default function CrmSimOverview() {
  const navigate = useNavigate()
  const { data: enrollment, isLoading } = useEnrollment(SIM_ID)
  const status = enrollment?.status
  const stagesDone = enrollment?.task_completions?.length ?? 0

  const [expanded, setExpanded] = useState(new Set())
  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-on-surface-variant mb-6">
        <button className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/simulations')}>Simulations</button>
        <span className="text-border">/</span>
        <span className="text-on-surface font-medium">{SIM_META.title}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ duration: 0.35 }}>
            <div className="flex items-center gap-3 mb-4">
              <img src={nimbusLogoImg} alt={SIM_META.company} className="h-9 w-auto object-contain shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-blue-100 text-blue-700 border-transparent">Sales</Badge>
                <Badge variant="outline">Intermediate</Badge>
                <Badge variant="outline">{SIM_META.industry}</Badge>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-on-surface mb-3 leading-tight tracking-tight">
              {SIM_META.title}
            </h1>

            <p className="text-on-surface-variant leading-relaxed mb-5 max-w-2xl">
              Run a complete enterprise sales cycle at {SIM_META.company}. You'll qualify a real inbound lead,
              research the account, send cold outreach, run a discovery call with an AI prospect, work the
              deal inside a real CRM, handle objections, write a proposal, and close — exactly like a first
              week on the job under your manager, {SIM_META.manager.name}.
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              {STAT_PILLS.map((stat) => (
                <span key={stat.label} className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border', stat.color)}>
                  <stat.icon className="h-3.5 w-3.5" /> {stat.label}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="card overflow-hidden"
            initial={fadeUp.initial} animate={fadeUp.animate} transition={{ duration: 0.35, delay: 0.05 }}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-on-surface">The Sales Cycle — Stage by Stage</h2>
              <span className="text-xs font-medium text-on-surface-variant">{STAGES.length} stages</span>
            </div>
            <p className="text-xs text-on-surface-variant mb-5">Click a stage to see what you'll do and how it's scored.</p>

            <div className="relative">
              <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />
              {STAGES.map((stage, i) => {
                const isLast = i === STAGES.length - 1
                const isOpen = expanded.has(stage.id)
                const { icon: StageIcon, bg } = STAGE_STYLE[i] ?? STAGE_STYLE[0]
                return (
                  <div key={stage.id} className={`relative flex items-start gap-4 ${isLast ? '' : 'pb-6'}`}>
                    <div className={cn('relative z-10 w-9 h-9 rounded-full ring-1 ring-white/40 flex items-center justify-center shrink-0 shadow-sm text-white', bg)}>
                      <StageIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <button
                        onClick={() => toggle(stage.id)}
                        aria-expanded={isOpen}
                        className="w-full flex items-start justify-between gap-3 text-left group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5 text-primary">Stage {stage.index}</p>
                          <p className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors">{stage.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{stage.objective}</p>
                        </div>
                        <ChevronDown className={`text-on-surface-variant shrink-0 mt-1 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="mt-3 pl-3 border-l-2 border-border space-y-3 animate-[fadeIn_0.2s_ease]">
                          <p className="text-xs text-on-surface-variant leading-relaxed">{stage.briefing}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(stage.rubric).map(([key, weight]) => (
                              <span key={key} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                {key} {Math.round(weight * 100)}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            className="card"
            initial={fadeUp.initial} animate={fadeUp.animate} transition={{ duration: 0.35, delay: 0.1 }}
          >
            <h2 className="text-lg font-bold text-on-surface mb-4">What You'll Practice</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {OBJECTIVES.map((obj, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 bg-surface-low border border-transparent rounded-lg hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                >
                  <Target className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-on-surface leading-snug">{obj}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="space-y-5 lg:sticky lg:top-20"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="card border-2 border-blue-200 shadow-sm relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-700 mb-3 relative">
              {status === 'completed' ? 'Completed' : status ? 'In Progress' : 'Get Started'}
            </p>

            {isLoading ? (
              <div className="h-11 bg-surface-high rounded-lg animate-pulse mb-4" />
            ) : (
              <Button
                className="w-full py-5 text-sm mb-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate(SIM_PATH)}
              >
                {status === 'completed' ? 'Review Simulation' : status ? 'Continue Simulation' : 'Start Simulation'}
              </Button>
            )}

            {status && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-on-surface-variant font-medium">Your progress</span>
                  <span className="font-semibold text-on-surface">{stagesDone} / {STAGES.length} stages</span>
                </div>
                <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${Math.round((stagesDone / STAGES.length) * 100)}%` }} />
                </div>
              </div>
            )}

            <ul className="space-y-2.5 pt-4 border-t border-border">
              <li className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" /> 8 stages, one continuous deal
              </li>
              <li className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" /> Real-time AI prospect conversations
              </li>
              <li className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" /> Full CRM — leads to closed deal
              </li>
              <li className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" /> Scored results &amp; hiring recommendation
              </li>
            </ul>
          </div>

          <div className="card border-2 border-blue-100 bg-blue-50/30">
            <div className="pb-4 mb-4 border-b border-border">
              <p className="text-[11px] font-bold tracking-widest text-blue-700 uppercase mb-1">Company</p>
              <p className="font-bold text-on-surface text-sm">{SIM_META.company}</p>
            </div>
            <p className="text-xs text-on-surface leading-relaxed">
              {SIM_META.company} sells {SIM_META.product} into the {SIM_META.industry} market. Your target
              account for this simulation is {SIM_META.targetCustomer}.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              {SIM_META.manager.photo ? (
                <img src={SIM_META.manager.photo} alt={SIM_META.manager.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{SIM_META.manager.avatar}</span>
                </div>
              )}
              <div>
                <p className="font-semibold text-on-surface text-sm">Your Manager: {SIM_META.manager.name}</p>
                <p className="text-xs text-on-surface-variant">{SIM_META.manager.role}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Every stage is scored — Derek reviews your CRM hygiene, your emails, and your call transcripts
              the same way a real sales manager would.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
