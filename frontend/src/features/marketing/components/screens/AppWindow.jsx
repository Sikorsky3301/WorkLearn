import { motion, useReducedMotion } from 'motion/react'
import { LayoutDashboard, Briefcase, Bot, Compass, BarChart3, FolderGit2, Lock } from 'lucide-react'

// Shared chrome for the four product mockups in ProductTourSection. These are
// hand-built rather than screenshots so they stay legible at any size, keep
// the real type scale, and don't go stale every time the app is restyled.
//
// The whole window is remounted by the AnimatePresence in
// components/ui/sticky-scroll-reveal.jsx each time the active step changes,
// so the mount animations below replay on every swap — the app reads as
// assembling itself rather than appearing whole.
//
// Everything inside is illustrative sample data — see each screen file.

const SIDEBAR = [
  { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'simulations', label: 'Simulations', Icon: Briefcase },
  { key: 'mentor', label: 'AI Mentor', Icon: Bot },
  { key: 'skills', label: 'Skill GPS', Icon: Compass },
  { key: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { key: 'portfolio', label: 'Portfolio', Icon: FolderGit2 },
]

const NAV_ITEM = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

export default function AppWindow({ url, active, children }) {
  const reduceMotion = useReducedMotion()
  const animated = !reduceMotion

  return (
    <div className="h-full w-full rounded-2xl border border-border bg-white shadow-2xl shadow-on-surface/10 overflow-hidden flex flex-col select-none">
      {/* Browser bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-low border-b border-border shrink-0">
        <span className="flex gap-1.5 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <motion.span
          initial={animated ? { opacity: 0, y: -4 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mx-auto flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1 text-[11px] font-medium text-on-surface-variant max-w-[60%] truncate"
        >
          <Lock className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
          {url}
        </motion.span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* App sidebar */}
        <motion.nav
          initial={animated ? 'hidden' : false}
          animate="show"
          transition={{ staggerChildren: 0.035, delayChildren: 0.12 }}
          className="hidden sm:flex w-[168px] shrink-0 flex-col gap-0.5 border-r border-border bg-surface-low/60 p-2.5"
        >
          <motion.div variants={NAV_ITEM} className="flex items-center gap-2 px-2 py-2 mb-2">
            <span className="h-6 w-6 rounded-md bg-primary text-white text-[10px] font-extrabold flex items-center justify-center">W</span>
            <span className="text-xs font-extrabold text-on-surface tracking-tight">WorkLearn</span>
          </motion.div>
          {SIDEBAR.map(({ key, label, Icon }) => (
            <motion.span
              key={key}
              variants={NAV_ITEM}
              className={`flex items-center gap-2 rounded-md px-2 py-[7px] text-[11px] font-semibold ${
                key === active ? 'bg-white text-primary shadow-sm border border-border' : 'text-on-surface-variant'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </motion.span>
          ))}
          <motion.div
            variants={NAV_ITEM}
            className="mt-auto flex items-center gap-2 rounded-md border border-border bg-white px-2 py-2"
          >
            <span className="h-6 w-6 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">AR</span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold text-on-surface leading-tight truncate">Ananya Rao</span>
              <span className="block text-[9px] text-on-surface-variant leading-tight">Level 4 · 1,280 XP</span>
            </span>
          </motion.div>
        </motion.nav>

        {/* Screen body */}
        <motion.div
          initial={animated ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 min-w-0 overflow-hidden"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
