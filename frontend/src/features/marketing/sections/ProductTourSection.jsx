import { Check, Play, Mail, Award } from 'lucide-react'
import { StickyScroll } from '../../../components/ui/sticky-scroll-reveal'

/** Browser-chrome wrapper so each mini screen reads as a product shot
 * rather than a floating card. */
function MiniScreen({ label, accent = 'bg-primary', children }) {
  return (
    <div className="h-full rounded-2xl border border-border bg-white shadow-2xl overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-low border-b border-border shrink-0">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <span className="mx-auto text-[11px] font-medium text-on-surface-variant">{label}</span>
      </div>
      <div className={`h-1 shrink-0 ${accent}`} />
      <div className="flex-1 p-5 overflow-hidden">{children}</div>
    </div>
  )
}

function OfferScreen() {
  return (
    <MiniScreen label="worklearn.ai / offer">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Offer letter</p>
      <h4 className="text-lg font-extrabold text-on-surface leading-tight mb-1">Junior Data Analyst</h4>
      <p className="text-xs text-on-surface-variant mb-4">Growth &amp; Analytics · Lumen Corporation</p>
      <div className="rounded-lg bg-surface-low border border-border p-3 text-xs text-on-surface-variant leading-relaxed mb-4">
        “Really glad to have you on the team. I'll send you tasks exactly as I would
        to any analyst — take a real swing at each one.”
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="h-7 w-7 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">PS</span>
        <div>
          <p className="text-xs font-bold text-on-surface leading-none">Priya Sharma</p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">Growth &amp; Analytics Manager</p>
        </div>
      </div>
      <span className="block w-full text-center bg-primary text-white text-xs font-bold rounded-lg py-2">
        Accept &amp; start
      </span>
    </MiniScreen>
  )
}

function BriefScreen() {
  return (
    <MiniScreen label="worklearn.ai / task 3">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-3.5 w-3.5 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Task 3 of 5</p>
      </div>
      <h4 className="text-base font-extrabold text-on-surface leading-tight mb-2">Segment the customer base</h4>
      <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
        Pull the last 12 months of orders and tell me which customers we should
        actually be spending on. I need it before Thursday.
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mb-2">What to submit</p>
      <ul className="space-y-1.5">
        {['An RFM segmentation of all customers', 'Your cut-offs, and why you chose them', 'One recommendation you can defend'].map((t) => (
          <li key={t} className="flex items-start gap-2 text-xs text-on-surface-variant">
            <span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" />
            {t}
          </li>
        ))}
      </ul>
    </MiniScreen>
  )
}

function EditorScreen() {
  const lines = [
    [['t', 'import'], ['p', ' pandas '], ['t', 'as'], ['p', ' pd']],
    [],
    [['c', '# score every customer on recency + spend']],
    [['p', 'rfm = orders.'], ['f', 'groupby'], ['p', '('], ['s', "'customer_id'"], ['p', ').'], ['f', 'agg'], ['p', '(']],
    [['p', '    recency=('], ['s', "'order_date'"], ['p', ', '], ['s', "'max'"], ['p', '),']],
    [['p', '    monetary=('], ['s', "'revenue'"], ['p', ', '], ['s', "'sum'"], ['p', '),']],
    [['p', ')']],
  ]
  const CLS = { t: 'text-violet-300', f: 'text-sky-300', s: 'text-emerald-300', c: 'text-slate-500 italic', p: 'text-slate-300' }

  return (
    <MiniScreen label="worklearn.ai / editor" accent="bg-slate-800">
      <div className="rounded-lg bg-[#111827] p-3 mb-3">
        <pre className="font-mono text-[10px] leading-[1.7]">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none text-slate-600 w-5 shrink-0 text-right pr-2">{i + 1}</span>
              <span className="whitespace-pre">
                {line.map(([k, txt], j) => <span key={j} className={CLS[k]}>{txt}</span>)}
              </span>
            </div>
          ))}
        </pre>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant border border-border rounded px-2 py-1">
          <Play className="h-2.5 w-2.5" fill="currentColor" /> Run
        </span>
        <span className="text-[10px] font-semibold text-white bg-primary rounded px-2 py-1">Submit</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
          <Check className="h-3 w-3" /> All checks passed
        </span>
      </div>
    </MiniScreen>
  )
}

function CertificateScreen() {
  return (
    <MiniScreen label="worklearn.ai / portfolio" accent="bg-emerald-600">
      <div className="text-center">
        <span className="inline-flex h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center mb-3">
          <Award className="h-6 w-6" />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Certificate of completion</p>
        <h4 className="text-base font-extrabold text-on-surface leading-tight mb-1">Junior Data Analyst</h4>
        <p className="text-xs text-on-surface-variant mb-4">Lumen Corporation</p>
      </div>
      <div className="rounded-lg border border-border bg-surface-low p-3 mb-3">
        <p className="text-[10px] text-on-surface-variant mb-1">Certificate number</p>
        <p className="font-mono text-xs font-bold text-on-surface">WL-DAJOB-2026-8CA092</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border p-2 text-center">
          <p className="text-sm font-extrabold text-on-surface">5/5</p>
          <p className="text-[10px] text-on-surface-variant">tasks</p>
        </div>
        <div className="rounded-lg border border-border p-2 text-center">
          <p className="text-sm font-extrabold text-on-surface">88%</p>
          <p className="text-[10px] text-on-surface-variant">avg score</p>
        </div>
      </div>
    </MiniScreen>
  )
}

const TOUR = [
  {
    title: 'Get hired into the role',
    description: 'You start with an offer letter and a manager, not a syllabus. From the first minute you are on a team with something expected of you.',
    content: <OfferScreen />,
  },
  {
    title: 'Take a brief like a real one',
    description: 'Tasks arrive the way work does — some context, a deadline, and enough ambiguity that you have to make a judgment call and stand behind it.',
    content: <BriefScreen />,
  },
  {
    title: 'Do the work in the browser',
    description: 'Write the code, build the analysis, run the call. Nothing to install, and you can run it as many times as you like before you submit.',
    content: <EditorScreen />,
  },
  {
    title: 'Walk away with proof',
    description: 'Finishing earns a certificate with a number anyone can check, plus a portfolio entry built from work you actually completed.',
    content: <CertificateScreen />,
  },
]

export default function ProductTourSection() {
  return (
    <section id="product-tour" className="bg-white py-20">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">A look inside</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4">
            What it actually feels like
          </h2>
          <p className="text-base text-on-surface-variant leading-relaxed">
            Scroll through a full simulation, start to finish.
          </p>
        </div>

        <StickyScroll content={TOUR} />
      </div>
    </section>
  )
}
