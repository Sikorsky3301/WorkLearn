import { ArrowRight, Check, Play, Sparkles } from 'lucide-react'
import AppWindow from './AppWindow'

// Mirrors the real /dashboard (features/dashboard/Dashboard.jsx): the
// "Welcome back, <first name>" header, the welcome-video card, then a
// one-third / two-thirds split of "Your Manager" against "Job Simulations"
// grouped by domain with a "Recommended" badge on the student's preferred one.
// Sample values throughout — the layout is the real one, the data is not.

const ASSIGNMENT = {
  company: 'Lumen Corporation',
  manager: 'Priya Sharma',
  role: 'Growth & Analytics Manager',
  task: 'Task 3 — Segment the customer base',
  progress: 40,
}

const GROUPS = [
  {
    domain: 'Data & Analytics',
    recommended: true,
    sims: [
      { title: 'Junior Data Analyst', company: 'Lumen Corporation', tasks: 5, hrs: '6–8 hrs', accent: 'bg-indigo-700' },
      { title: 'Retail A/B Test Analyst', company: 'Lumen Corporation', tasks: 5, hrs: '4 hrs', accent: 'bg-indigo-500' },
    ],
  },
  {
    domain: 'Engineering',
    recommended: false,
    sims: [{ title: 'Frontend Developer', company: 'Enigma Labs', tasks: 5, hrs: '7 hrs', accent: 'bg-slate-800' }],
  },
  {
    domain: 'Sales & Business Development',
    recommended: false,
    sims: [{ title: 'SDR — Outbound', company: 'Nimbus CRM', tasks: 8, hrs: '5 hrs', accent: 'bg-teal-700' }],
  },
]

export default function DashboardScreen() {
  return (
    <AppWindow url="worklearn.ai/dashboard" active="dashboard">
      <div className="h-full overflow-hidden p-5">
        <div className="mb-4">
          <p className="text-[17px] font-bold tracking-tight text-on-surface leading-tight">Welcome back, Ananya</p>
          <p className="text-[11px] text-on-surface-variant">Your AI-managed career learning platform.</p>
        </div>

        {/* Welcome video card */}
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-surface-low px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Play className="h-3.5 w-3.5" fill="currentColor" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold text-on-surface leading-tight">Welcome to WorkLearn</span>
            <span className="block text-[10px] text-on-surface-variant">2 min · how the simulations work</span>
          </span>
          <span className="ml-auto shrink-0 rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold text-on-surface-variant">
            Watch
          </span>
        </div>

        <div className="grid grid-cols-3 items-start gap-4">
          {/* Your Manager */}
          <div className="col-span-1 space-y-2">
            <p className="text-[11px] font-bold text-on-surface">Your Manager</p>
            <div className="rounded-xl border border-border bg-white p-3.5">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  PS
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold text-on-surface leading-tight">{ASSIGNMENT.manager}</span>
                  <span className="block text-[9px] text-on-surface-variant truncate">{ASSIGNMENT.role}</span>
                </span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">
                Current task
              </p>
              <p className="text-[11px] font-semibold leading-snug text-on-surface mb-3">{ASSIGNMENT.task}</p>
              <div className="mb-1 flex items-center justify-between text-[9px] font-semibold text-on-surface-variant">
                <span>{ASSIGNMENT.company}</span>
                <span className="font-mono">2/5</span>
              </div>
              <div className="track h-1.5 mb-3">
                <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${ASSIGNMENT.progress}%` }} />
              </div>
              <span className="flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-[10px] font-bold text-white">
                Continue <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            <div className="rounded-xl border border-border bg-white p-3">
              <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold text-on-surface">
                <Sparkles className="h-3 w-3 text-primary" /> Skill GPS
              </span>
              <p className="text-[9px] text-on-surface-variant leading-snug">
                74% match to Data Analyst · Statistics is your biggest gap.
              </p>
            </div>
          </div>

          {/* Job Simulations */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[11px] font-bold text-on-surface">Job Simulations</p>
                <p className="text-[9px] text-on-surface-variant">
                  Complete real tasks, earn XP, and build verified skills.
                </p>
              </div>
              <span className="text-[9px] font-semibold text-primary">View all →</span>
            </div>

            {GROUPS.map((g) => (
              <div key={g.domain}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {g.domain}
                  </span>
                  {g.recommended && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[8px] font-bold text-primary">
                      Recommended
                    </span>
                  )}
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-1.5">
                  {g.sims.map((s) => (
                    <div
                      key={s.title}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-2"
                    >
                      <span className={`h-7 w-7 shrink-0 rounded-md ${s.accent}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-bold text-on-surface leading-tight truncate">
                          {s.title}
                        </span>
                        <span className="block text-[9px] text-on-surface-variant truncate">{s.company}</span>
                      </span>
                      <span className="hidden shrink-0 font-mono text-[9px] text-on-surface-variant sm:block">
                        {s.tasks} tasks · {s.hrs}
                      </span>
                      <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[9px] font-bold text-on-surface-variant">
                        <Check className="inline h-2.5 w-2.5" /> Free task
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppWindow>
  )
}
