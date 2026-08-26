// The honest placeholder for a Learn tab that has a home now but no content
// yet — Leaderboard, Courses, Assessments, Competitions. Same instinct as the
// admin portal's EmptyState "ships in Phase 2" notices: say plainly that
// nothing is behind this yet, rather than a blank page or a broken link.

export default function ComingSoon({ icon: Icon, title, description }) {
  return (
    <div className="mx-auto max-w-container px-6 py-8">
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-white px-6 py-20 text-center">
        {Icon && (
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </span>
        )}
        <span className="mb-3 inline-flex items-center rounded-full bg-surface-low px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
          In development
        </span>
        <h1 className="text-xl font-bold text-on-surface">{title}</h1>
        {description && (
          <p className="mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
