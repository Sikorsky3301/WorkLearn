import { Bot, Compass, ShieldCheck, Mic, FolderGit2, Layers, Check, ArrowUpRight } from 'lucide-react'
import { BentoGrid, BentoGridItem } from '../../../components/ui/bento-grid'
import { Highlight } from '../../../components/ui/hero-highlight'
import { Reveal } from '../../../components/ui/reveal'
import { CAREER_DOMAINS } from '../../../lib/careerDomains'

/* Each header is a small abstract visual, not a screenshot — the product
   shots live in AppShowcaseSection. Kept as tiny local components so the
   feature list below reads as data. Every figure shown is illustrative. */

function ReviewHeader() {
  const rubric = [
    { label: 'Correct segmentation', got: 28, of: 30 },
    { label: 'Justified cut-offs', got: 19, of: 30 },
    { label: 'Actionable recommendation', got: 21, of: 25 },
    { label: 'Clarity of write-up', got: 14, of: 15 },
  ]
  return (
    <div className="rounded-xl border border-border bg-surface-low p-3">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold text-on-surface">Priya's review · Task 3</span>
        <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-px font-mono text-[10px] font-bold text-amber-800">
          82 / 100
        </span>
      </div>
      <div className="space-y-1.5">
        {rubric.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <span className="w-[42%] shrink-0 truncate text-[9.5px] text-on-surface-variant">{r.label}</span>
            <span className="h-1.5 flex-1 track">
              <span
                className={`block h-full rounded-full ${r.got / r.of >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${(r.got / r.of) * 100}%` }}
              />
            </span>
            <span className="w-9 shrink-0 text-right font-mono text-[9px] font-bold text-on-surface">
              {r.got}/{r.of}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillBarsHeader() {
  const bars = [
    { label: 'SQL', now: 78, need: 70 },
    { label: 'Python', now: 52, need: 65 },
    { label: 'Statistics', now: 41, need: 60 },
  ]
  return (
    <div className="rounded-xl border border-border bg-surface-low p-3 space-y-2.5">
      {bars.map((b) => (
        <div key={b.label}>
          <div className="flex justify-between text-[9.5px] font-semibold mb-1">
            <span className="text-on-surface-variant">{b.label}</span>
            <span className="font-mono text-on-surface">
              {b.now}
              <span className="text-on-surface-variant/60">/{b.need}</span>
            </span>
          </div>
          <div className="relative h-1.5 track">
            <div
              className={`h-full rounded-full ${b.now >= b.need ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${b.now}%` }}
            />
            <span className="absolute inset-y-0 w-px bg-on-surface" style={{ left: `${b.need}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function CertificateHeader() {
  return (
    <div className="rounded-xl border border-border bg-surface-low p-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-px flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-on-surface leading-tight">Junior Data Analyst</p>
          <p className="font-mono text-[10px] font-bold text-on-surface-variant mt-0.5">WL-DAJOB-2026-8CA092</p>
          <p className="mt-1.5 inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-px text-[9px] font-bold text-emerald-700">
            <Check className="h-2.5 w-2.5" strokeWidth={3} /> Verified · issued 6 Aug 2026
          </p>
        </div>
      </div>
    </div>
  )
}

function InterviewHeader() {
  const heights = [30, 55, 82, 48, 96, 38, 70, 88, 44, 62, 34, 78, 52, 90, 40]
  return (
    <div className="rounded-xl border border-border bg-surface-low p-3">
      <div className="flex items-end justify-center gap-[3px] h-9 mb-2.5">
        {heights.map((h, i) => (
          <span key={i} className="w-[3px] rounded-full bg-violet-400" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="flex justify-between gap-2 border-t border-border pt-2">
        {[
          { k: 'Structure', v: '8.1' },
          { k: 'Evidence', v: '7.4' },
          { k: 'Filler words', v: '11' },
          { k: 'Pace', v: '142 wpm' },
        ].map((s) => (
          <div key={s.k} className="text-center">
            <p className="font-mono text-[11px] font-extrabold text-on-surface leading-none">{s.v}</p>
            <p className="text-[8.5px] text-on-surface-variant mt-0.5">{s.k}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PortfolioHeader() {
  const entries = [
    { t: 'Customer segmentation for a retail brand', m: '5 tasks · 88% avg' },
    { t: 'Responsive nav rebuild', m: '5 tasks · 91% avg' },
  ]
  return (
    <div className="rounded-xl border border-border bg-surface-low p-3 space-y-1.5">
      {entries.map((e) => (
        <div key={e.t} className="flex items-center gap-2 rounded-lg border border-border bg-white px-2.5 py-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-orange-100 text-orange-700">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[10px] font-bold text-on-surface leading-tight">{e.t}</span>
            <span className="block font-mono text-[9px] text-on-surface-variant">{e.m}</span>
          </span>
          <ArrowUpRight className="h-3 w-3 shrink-0 text-on-surface-variant/50" />
        </div>
      ))}
      <p className="pt-0.5 text-[9px] text-on-surface-variant/70">Written from the work, not from a template.</p>
    </div>
  )
}

function DomainsHeader() {
  return (
    <div className="flex flex-wrap content-start gap-1.5 rounded-xl border border-border bg-surface-low p-3 overflow-hidden">
      {CAREER_DOMAINS.slice(0, 12).map(({ key, label, Icon }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-[10px] font-semibold text-on-surface-variant"
        >
          <Icon className="h-3 w-3 text-teal-600" /> {label}
        </span>
      ))}
      <span className="inline-flex items-center rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-700">
        +{Math.max(CAREER_DOMAINS.length - 12, 0)} more
      </span>
    </div>
  )
}

const FEATURES = [
  {
    title: 'A manager who reviews your work',
    description:
      "Every submission comes back scored against the same rubric the task was written from — with the line items you dropped marks on, not a grade you have to interpret.",
    header: <ReviewHeader />,
    icon: <Bot className="h-4 w-4" />,
    accent: 'rose',
    className: 'md:col-span-2',
    stats: [
      { value: '4', label: 'rubric criteria per task' },
      { value: '< 60s', label: 'typical turnaround' },
      { value: '100%', label: 'feedback tied to a criterion' },
    ],
  },
  {
    title: 'Skill GPS',
    description: 'Your assessed level against the benchmark for the role you want. The gap is the plan.',
    header: <SkillBarsHeader />,
    icon: <Compass className="h-4 w-4" />,
    accent: 'emerald',
    className: 'md:col-span-1',
    stats: [
      { value: '6', label: 'skills tracked' },
      { value: '74%', label: 'role match' },
    ],
  },
  {
    title: 'Credentials that verify',
    description: 'Each certificate carries a number anyone can check against the tasks that earned it.',
    header: <CertificateHeader />,
    icon: <ShieldCheck className="h-4 w-4" />,
    accent: 'amber',
    className: 'md:col-span-1',
    stats: [
      { value: '5/5', label: 'tasks required' },
      { value: 'Public', label: 'verification page' },
    ],
  },
  {
    title: 'Mock interviews with MIRA',
    description: 'Answer out loud and get scored on what you actually said, not on how you felt it went.',
    header: <InterviewHeader />,
    icon: <Mic className="h-4 w-4" />,
    accent: 'violet',
    className: 'md:col-span-1',
    stats: [
      { value: '12', label: 'question banks' },
      { value: '4', label: 'scored dimensions' },
    ],
  },
  {
    title: 'A portfolio that builds itself',
    description: 'Finished simulations become case studies with the brief, your approach, and the score attached.',
    header: <PortfolioHeader />,
    icon: <FolderGit2 className="h-4 w-4" />,
    accent: 'orange',
    className: 'md:col-span-1',
    stats: [
      { value: '1 link', label: 'to send a recruiter' },
      { value: 'Auto', label: 'updated on completion' },
    ],
  },
  {
    title: 'Sixteen career areas, one path each',
    description:
      'From data and engineering through to healthcare administration and legal — pick the direction and the briefs, rubrics and skill benchmarks follow it.',
    header: <DomainsHeader />,
    icon: <Layers className="h-4 w-4" />,
    accent: 'teal',
    className: 'md:col-span-3',
    stats: [
      { value: '16', label: 'career areas' },
      { value: '5', label: 'tasks per simulation' },
      { value: '0', label: 'lectures to sit through' },
    ],
  },
]

export default function FeaturesBentoSection() {
  return (
    <section id="features" className="bg-white py-20">
      <div className="max-w-container mx-auto px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <p className="eyebrow mb-3">Everything included</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4">
            More than a <Highlight>course platform</Highlight>
          </h2>
          <p className="text-base text-on-surface-variant leading-relaxed">
            The support structure around the work matters as much as the work itself.
          </p>
        </Reveal>

        <BentoGrid>
          {FEATURES.map((f) => (
            <BentoGridItem key={f.title} {...f} />
          ))}
        </BentoGrid>
      </div>
    </section>
  )
}
