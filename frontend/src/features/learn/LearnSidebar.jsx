import { NavLink } from 'react-router-dom'
import { useNavbarHeight } from '../simulations/generic/StickyOverviewBar'
import {
  History, Trophy, BookOpen, Blocks, ClipboardCheck, BookMarked, Terminal, Swords,
} from 'lucide-react'
import { cn } from '../../lib/cn'

// The Learn hub's own left rail — secondary to the app's top Navbar, which
// stays mounted above it (MainLayout keeps rendering it; this is a page, not
// a replacement shell). It groups the eight surfaces a learner moves between
// while working through the platform, most of which did not have a shared
// home before: Job Simulations and Sandbox each had their own top-level nav
// entry and nothing tied them to Assessments, a Leaderboard or Resources as
// parts of one "Learn" area.
//
// Two sections, matching how the items actually differ:
//   LEARN   surfaces about becoming skilled — courses, the simulations
//           themselves, checks on what you know, and material to read.
//   APPLY   surfaces where you use what you have — a free-form sandbox and,
//           eventually, competitions against other learners.
//
// `badge` marks something genuinely new rather than a permanent label —
// it should come off once the feature has been live a while, the same
// convention the admin Sidebar uses for its own NEW-flagged items.
const SECTIONS = [
  {
    items: [
      { label: 'My Activity', icon: History, to: '/learn/activity' },
      { label: 'Leaderboard', icon: Trophy, to: '/learn/leaderboard', badge: 'NEW' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { label: 'Courses', icon: BookOpen, to: '/learn/courses' },
      { label: 'Job Simulations', icon: Blocks, to: '/learn/simulations' },
      { label: 'Assessments', icon: ClipboardCheck, to: '/learn/assessments' },
      { label: 'Resources', icon: BookMarked, to: '/learn/resources', badge: 'NEW' },
    ],
  },
  {
    label: 'Apply',
    items: [
      { label: 'Sandbox', icon: Terminal, to: '/learn/sandbox' },
      { label: 'Competitions', icon: Swords, to: '/learn/competitions' },
    ],
  },
]

export default function LearnSidebar() {
  const navbarHeight = useNavbarHeight()

  // Pinned to the viewport while the content pane scrolls past it — the
  // same "sticky, not scrollable" behaviour the rest of the app uses for a
  // side panel (see StagesTab's task editor). `self-start` is load-bearing:
  // LearnHub lays this out as a flex row, and a flex item defaults to
  // STRETCHING to match its tallest sibling's height. Stretched to the full
  // height of a long content pane, the sidebar would already occupy that
  // whole height from the start, and `sticky` has nothing left to do —
  // there'd be no "shorter than its container" gap for it to hold position
  // within. `self-start` keeps the sidebar at its OWN height (the viewport,
  // via the inline style below) so sticky can actually keep it in view.
  return (
    <aside
      className="w-60 shrink-0 self-start bg-[#0f0d2e] px-3 py-5"
      style={{ position: 'sticky', top: navbarHeight, height: `calc(100vh - ${navbarHeight}px)` }}
    >
      <nav className="space-y-5">
        {SECTIONS.map((section, i) => (
          <div key={section.label ?? i}>
            {section.label && (
              <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-widest text-white/35">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto shrink-0 rounded-full bg-emerald-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-950">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
            {i === 0 && <div className="mt-5 border-t border-white/10" />}
          </div>
        ))}
      </nav>
    </aside>
  )
}
