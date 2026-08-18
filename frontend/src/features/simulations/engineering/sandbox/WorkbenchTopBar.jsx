import { ArrowLeft, ArrowRight, LayoutList, Zap } from 'lucide-react'
import logo from '../../../../assets/logo.png'

// The workbench's only chrome.
//
// This route renders outside MainLayout — no app Navbar — so the logo sits at
// the far left as the one piece of orientation, and the breadcrumb tells you
// which simulation and section you're inside. Prev/Outline/Next mirror the
// reference: the outline button goes back to the roadmap, which IS the outline.

export default function WorkbenchTopBar({
  company, sectionLabel, task, taskCount, xp,
  onPrev, onNext, onOutline, hasPrev, hasNext,
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4">
      <button onClick={onOutline} className="flex shrink-0 items-center gap-2" title="Back to roadmap">
        <img src={logo} alt="WorkLearn" className="h-7 w-7 rounded-lg object-cover" />
      </button>

      <nav className="hidden min-w-0 items-center gap-2 text-sm sm:flex" aria-label="Breadcrumb">
        <span className="truncate font-semibold text-on-surface-variant">{company}</span>
        <span className="text-outline-variant" aria-hidden="true">/</span>
        {sectionLabel && (
          <>
            <span className="truncate text-on-surface-variant">{sectionLabel}</span>
            <span className="text-outline-variant" aria-hidden="true">/</span>
          </>
        )}
        <span className="truncate font-bold text-on-surface">{task?.title}</span>
      </nav>

      <div className="mx-auto flex shrink-0 items-center gap-1 rounded-full border border-slate-200 p-1">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-low disabled:opacity-30"
          aria-label="Previous task"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onOutline}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-low"
        >
          <LayoutList className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Course outline</span>
          <span className="tabular-nums text-on-surface-variant">
            {task?.task_index}/{taskCount}
          </span>
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-low disabled:opacity-30"
          aria-label="Next task"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {xp > 0 && (
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200 sm:inline-flex">
          <Zap className="h-3.5 w-3.5" /> {xp} XP
        </span>
      )}
    </header>
  )
}
