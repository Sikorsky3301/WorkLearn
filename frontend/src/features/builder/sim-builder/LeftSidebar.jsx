import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, FileText, Image as ImageIcon, LayoutTemplate } from 'lucide-react'
import { cn } from '../../../lib/cn'

const TABS = [
  { id: 'pages', label: 'Pages', Icon: FileText },
  { id: 'assets', label: 'Assets', Icon: ImageIcon },
  { id: 'templates', label: 'Templates', Icon: LayoutTemplate },
]

/** Weeks -> Pages tree navigator, plus Assets/Templates tabs present per the
 * requested layout but stubbed "Coming soon" in v1. */
export default function LeftSidebar({ pages, activePageId, onSelectPage, onAddPage, onDeletePage }) {
  const [tab, setTab] = useState('pages')
  const [collapsedWeeks, setCollapsedWeeks] = useState(() => new Set())

  const weeks = []
  let currentWeek
  pages.forEach((page, i) => {
    if (i === 0 || page.week !== currentWeek) {
      currentWeek = page.week
      weeks.push({ week: page.week, pages: [] })
    }
    weeks[weeks.length - 1].pages.push(page)
  })

  function toggleWeek(week) {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev)
      next.has(week) ? next.delete(week) : next.add(week)
      return next
    })
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-white flex flex-col">
      <div className="flex border-b border-border">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors cursor-pointer border-b-2',
              tab === id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'pages' && (
          <div className="space-y-3">
            {pages.length === 0 && (
              <p className="text-xs text-on-surface-variant px-1 py-4 text-center">No pages yet.</p>
            )}
            {weeks.map((w, wi) => (
              <div key={wi}>
                <button
                  onClick={() => toggleWeek(w.week)}
                  className="w-full flex items-center gap-1.5 px-1 mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  {collapsedWeeks.has(w.week) ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {w.week != null ? `Week ${w.week}` : 'Ungrouped'}
                </button>
                {!collapsedWeeks.has(w.week) && (
                  <div className="space-y-0.5">
                    {w.pages.map((page) => (
                      <div key={page.id} className="group relative">
                        <button
                          onClick={() => onSelectPage(page.id)}
                          className={cn(
                            'w-full flex items-center gap-2 pl-2.5 pr-7 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left',
                            page.id === activePageId ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
                          )}
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate flex-1">{page.title}</span>
                          <span className="text-[10px] text-on-surface-variant/60 shrink-0">{page.blocks.length}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeletePage(page) }}
                          title="Delete page"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer p-1"
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() => onAddPage()}
              className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add page
            </button>
          </div>
        )}

        {tab === 'assets' && (
          <div className="text-center py-10">
            <ImageIcon className="h-8 w-8 text-on-surface-variant/30 mx-auto mb-2" />
            <p className="text-xs text-on-surface-variant">Asset library coming soon.</p>
          </div>
        )}

        {tab === 'templates' && (
          <div className="text-center py-10">
            <LayoutTemplate className="h-8 w-8 text-on-surface-variant/30 mx-auto mb-2" />
            <p className="text-xs text-on-surface-variant">Templates gallery coming soon.</p>
          </div>
        )}
      </div>
    </aside>
  )
}
