import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useNavbarHeight } from '../simulations/generic/StickyOverviewBar'
import {
  History, Trophy, BookOpen, Blocks, ClipboardCheck, BookMarked, Terminal, Swords,
  PanelLeftOpen, PanelLeftClose,
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

/** The nav list itself, shared between the always-full desktop rail and the
 * mobile rail (icon-only collapsed, or full when expanded) — one source for
 * the item markup so the two never drift apart.
 * `showLabels=false` renders icon-only tiles, centered, with the section
 * headings and item text dropped entirely rather than hidden (no point
 * shipping text into the DOM that's never going to be readable at that
 * width) and `onItemClick` fires after navigating, so the mobile overlay
 * closes itself once you've actually picked something. */
function SidebarNav({ showLabels, onItemClick }) {
  return (
    <nav className="space-y-5">
      {SECTIONS.map((section, i) => (
        <div key={section.label ?? i}>
          {showLabels && section.label && (
            <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-widest text-white/35">
              {section.label}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemClick}
                title={showLabels ? undefined : item.label}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                    !showLabels && 'justify-center px-0',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {showLabels && <span className="truncate">{item.label}</span>}
                {showLabels && item.badge && (
                  <span className="ml-auto shrink-0 rounded-full bg-emerald-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-950">
                    {item.badge}
                  </span>
                )}
                {!showLabels && item.badge && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </NavLink>
            ))}
          </div>
          {i === 0 && <div className="mt-5 border-t border-white/10" />}
        </div>
      ))}
    </nav>
  )
}

export default function LearnSidebar() {
  const navbarHeight = useNavbarHeight()
  // Mobile/tablet only (< lg): the sidebar starts minimized to a slim
  // icon-only rail instead of the fixed 240px it used to render at
  // regardless of viewport — on a phone that left the content pane a
  // sliver. Every item still navigates directly from the collapsed rail
  // (it's icons, not a dead end); "expand" just reveals labels, as an
  // overlay over the content rather than pushing it, since there still
  // isn't room for a 240px panel AND content side by side at these widths.
  const [expanded, setExpanded] = useState(false)

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
  const stickyStyle = { position: 'sticky', top: navbarHeight, height: `calc(100vh - ${navbarHeight}px)` }

  return (
    <>
      {/* Desktop — unchanged: always full, no minimize control (there's
          room for it, so there's nothing to fix here). */}
      <aside
        className="hidden lg:block w-60 shrink-0 self-start bg-[#0f0d2e] px-3 py-5"
        style={stickyStyle}
      >
        <SidebarNav showLabels />
      </aside>

      {/* Mobile/tablet — collapsed icon rail, always present in flow. */}
      <aside
        className="lg:hidden w-14 shrink-0 self-start bg-[#0f0d2e] px-2 py-5 flex flex-col items-center gap-4"
        style={stickyStyle}
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center justify-center rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Expand menu"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <div className="w-full">
          <SidebarNav showLabels={false} />
        </div>
      </aside>

      {/* Mobile/tablet — expanded overlay, only mounted while open.
          Backdrop closes it on tap, same as the Navbar's own dropdowns. */}
      {expanded && (
        <div className="lg:hidden fixed inset-0 z-50" style={{ top: navbarHeight }}>
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setExpanded(false)}
            aria-hidden="true"
          />
          <aside
            className="absolute left-0 top-0 h-full w-60 bg-[#0f0d2e] px-3 py-5 shadow-2xl overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="mb-4 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <PanelLeftClose className="h-4 w-4" /> Minimize
            </button>
            <SidebarNav showLabels onItemClick={() => setExpanded(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
