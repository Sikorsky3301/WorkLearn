import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '../../lib/cn'

const STORAGE_KEY = 'wl-portal-sidebar-collapsed'

/**
 * Generic left nav for a PortalShell. `sections`:
 *   [{ label?: string, items: [{ label, icon: LucideIcon, to, end?, badge? }] }]
 * Optional `brand` replaces the default title/subtitle header (e.g. tenant logo).
 * Collapses to an icon-only rail; preference persists in localStorage.
 */
export default function Sidebar({ title, subtitle, brand, sections, footer }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch { /* ignore quota / private mode */ }
  }, [collapsed])

  const toggle = () => setCollapsed((v) => !v)

  return (
    <aside
      className={cn(
        'shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen sticky top-0 transition-all duration-200',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      <div
        className={cn(
          'border-b border-slate-200 dark:border-slate-800',
          collapsed ? 'px-2 py-3 flex justify-center' : 'px-4 py-5'
        )}
      >
        {!collapsed && (
          <div className="mb-3">
            {brand || (
              <>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
                {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
              </>
            )}
          </div>
        )}
        <div className={cn('flex', collapsed ? 'justify-center' : 'justify-end')}>
          <button
            type="button"
            onClick={toggle}
            title={collapsed ? 'Show menu' : 'Hide menu'}
            aria-label={collapsed ? 'Show menu' : 'Hide menu'}
            aria-expanded={!collapsed}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <nav className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'px-1.5 space-y-1' : 'px-3 space-y-5')}>
        {sections.map((section, i) => (
          <div key={section.label ?? i}>
            {!collapsed && section.label && (
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
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center rounded-lg text-sm font-medium transition-colors',
                      collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-1.5',
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    )
                  }
                >
                  {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge != null && (
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

      {!collapsed && footer && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-3">{footer}</div>
      )}
    </aside>
  )
}
