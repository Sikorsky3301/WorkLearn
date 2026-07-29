/** Used both for genuine empty lists and for the honest "ships in Phase 2"
 * placeholders (e.g. Admin portal's Analytics/Feature Flags pages) — the
 * copy is what tells those two cases apart, not the component. */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        </div>
      )}
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">{title}</p>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}
