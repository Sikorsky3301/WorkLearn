import { CardContainer, CardBody, CardItem } from '../../../components/ui/three-d-card'
import daJobSimBanner from '../../../assets/da-job-sim-banner.jpg'

// Playful geometric confetti around the product card — the colourful,
// light-background feel of the reference, but arranged around something real
// (an actual task brief) rather than pure abstract art. Decorative only.
const DOTS = [
  { className: 'bg-rose-500 h-5 w-5 top-[6%] right-[18%]' },
  { className: 'bg-orange-500 h-7 w-7 top-[2%] right-[6%]' },
  { className: 'bg-amber-400 h-4 w-4 top-[16%] right-[2%]' },
  { className: 'bg-emerald-500 h-6 w-6 bottom-[16%] -left-3' },
  { className: 'bg-violet-500 h-4 w-4 bottom-[4%] left-[14%]' },
  { className: 'bg-teal-400 h-3 w-3 top-[44%] -left-4' },
]

export default function HeroIllustration() {
  return (
    <div className="relative">
      {/* Soft colour wash behind the card */}
      <div className="pointer-events-none absolute -inset-8 -z-10" aria-hidden="true">
        <div className="absolute right-6 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-4 left-0 h-48 w-48 rounded-full bg-rose-400/10 blur-3xl" />
      </div>

      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 -z-0" aria-hidden="true">
        {DOTS.map((d, i) => (
          <span key={i} className={`absolute rounded-full shadow-sm ${d.className}`} />
        ))}
        <span className="absolute right-[10%] bottom-[6%] h-10 w-10 rounded-xl bg-amber-300/80 rotate-12 shadow-sm" />
        <span className="absolute left-[6%] top-[8%] h-8 w-8 rounded-full border-[5px] border-rose-500" />
      </div>

      <CardContainer defaultActive containerClassName="py-0">
        <CardBody className="relative w-full h-auto rounded-2xl border border-border bg-white p-4 shadow-2xl">
          <CardItem translateZ={60} className="w-full">
            <img
              src={daJobSimBanner}
              alt="A WorkLearn job simulation workspace"
              className="w-full h-48 object-cover rounded-xl"
            />
          </CardItem>
          <CardItem translateZ={40} className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Task 3 of 5</p>
            <p className="text-lg font-bold text-on-surface mt-1">Segment the customer base</p>
          </CardItem>
          <CardItem translateZ={30} className="mt-2">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              “Pull the last 12 months of orders and tell me which customers we should
              actually be spending on. I need it before Thursday.”
            </p>
          </CardItem>
          <CardItem translateZ={50} className="mt-4 flex items-center gap-2.5 border-t border-border pt-3">
            <span className="h-8 w-8 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              PS
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-on-surface leading-tight">Priya Sharma</span>
              <span className="block text-[11px] text-on-surface-variant">Your manager · Lumen Corporation</span>
            </span>
          </CardItem>
        </CardBody>
      </CardContainer>
    </div>
  )
}
