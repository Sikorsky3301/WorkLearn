import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { ContainerScroll } from '../../../components/ui/container-scroll-animation'
import { Highlight } from '../../../components/ui/hero-highlight'
import DashboardScreen from '../components/screens/DashboardScreen'
import SimulationScreen from '../components/screens/SimulationScreen'
import MentorScreen from '../components/screens/MentorScreen'
import SkillGpsScreen from '../components/screens/SkillGpsScreen'
import AnalyticsScreen from '../components/screens/AnalyticsScreen'

/* The product showcase. The pages advance on their own so a visitor who never
   touches anything still sees all five, and the tabs are there for anyone who
   wants to jump — the frame tilts flat as the section arrives.

   Each tab corresponds to a route that exists in the app — see
   app/router/AppRouter.jsx. The screens are laid out from the real page
   components (Dashboard.jsx, GenericSimShell, CareerTwin, SkillGPS,
   Analytics), so the structure is theirs; the data in them is sample data. */
const PAGES = [
  { id: 'dashboard', label: 'Dashboard', route: '/dashboard', Screen: DashboardScreen },
  { id: 'simulation', label: 'Job simulation', route: '/simulations/:slug', Screen: SimulationScreen },
  { id: 'mentor', label: 'AI Mentor', route: '/ai-mentor', Screen: MentorScreen },
  { id: 'skills', label: 'Skill GPS', route: '/skill-gps', Screen: SkillGpsScreen },
  { id: 'analytics', label: 'Analytics', route: '/analytics', Screen: AnalyticsScreen },
]

// Long enough to read a screen, short enough that all five fit inside the time
// the section is realistically on somebody's display.
const DWELL_MS = 5200

export default function AppShowcaseSection() {
  const [index, setIndex] = useState(0)
  // Clicking a tab is the visitor taking over — autoplay stops for good rather
  // than yanking the screen out from under them a few seconds later.
  const [autoplay, setAutoplay] = useState(true)
  const [hovering, setHovering] = useState(false)

  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { amount: 0.35 })
  const reduceMotion = useReducedMotion()

  const cycling = autoplay && inView && !hovering && !reduceMotion

  // A timeout per step rather than one long-lived interval: the step restarts
  // cleanly whenever it's paused/resumed, which keeps the pill progress bar
  // (keyed on the same index) in sync with the actual advance.
  useEffect(() => {
    if (!cycling) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % PAGES.length), DWELL_MS)
    return () => clearTimeout(id)
  }, [cycling, index])

  const active = PAGES[index]
  const ActiveScreen = active.Screen

  return (
    <section id="the-app" ref={sectionRef} className="bg-white">
      <div className="max-w-container mx-auto px-6">
        <ContainerScroll
          titleComponent={
            <>
              <p className="eyebrow mb-3">The product</p>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface mb-4">
                Every screen you'll <Highlight>actually use</Highlight>
              </h2>
              <p className="text-base text-on-surface-variant leading-relaxed max-w-xl mx-auto mb-8">
                Five pages carry the whole product. They play through on their own — or pick one.
              </p>

              <div className="flex flex-wrap justify-center gap-1.5">
                {PAGES.map((p, i) => {
                  const isActive = i === index
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setIndex(i)
                        setAutoplay(false)
                      }}
                      aria-pressed={isActive}
                      className={`relative overflow-hidden rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
                          isActive
                            ? 'border-on-surface bg-on-surface text-white'
                            : 'border-border bg-white text-on-surface-variant hover:border-on-surface/30'
                        }`}
                    >
                      {p.label}
                      {/* Countdown to the next screen. Only on the active pill,
                          and only while it's actually running. */}
                      {isActive && cycling && (
                        <motion.span
                          key={index}
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-white/60"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: DWELL_MS / 1000, ease: 'linear' }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          }
        >
          {/* Hovering the frame holds the current screen so it can be read. */}
          <div
            className="relative h-full w-full"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            {/* Keyed so each screen's own mount animations replay on arrival.
                Absolute so the outgoing one cross-fades under the incoming one
                instead of pushing the layout around. */}
            <AnimatePresence initial={false}>
              <motion.div
                key={active.id}
                className="absolute inset-0"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -14 }}
                transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <ActiveScreen />
              </motion.div>
            </AnimatePresence>
          </div>
        </ContainerScroll>

        <p className="pb-16 text-center font-mono text-[11px] text-on-surface-variant/60">
          {active.route}
        </p>
      </div>
    </section>
  )
}
