import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'

/**
 * Generic left nav for a PortalShell. `sections`:
 *   [{ label?: string, items: [{ label, icon: LucideIcon, to, end?, badge? }] }]
 * Used by both the Admin and SuperAdmin portals with different section data.
 */
export default function Sidebar({ title, subtitle, sections, footer }) {
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section, i) => (
          <div key={section.label ?? i}>
            {section.label && (
              <p className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    )
                  }
                >
                  {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{item.label}</span>
                  {item.badge != null && (
                    <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {footer && <div className="border-t border-slate-200 dark:border-slate-800 p-3">{footer}</div>}
    </aside>
  )
}
