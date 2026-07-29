/** Generic top bar for a PortalShell page — a title/description on the
 * left, arbitrary actions (theme toggle, user menu, buttons) on the right. */
export default function Topbar({ title, description, actions }) {
  return (
    <header className="h-14 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6">
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none truncate">{title}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
