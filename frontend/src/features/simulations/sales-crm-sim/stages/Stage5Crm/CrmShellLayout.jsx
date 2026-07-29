import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, Building2, Contact, Activity, CheckSquare,
  Calendar, Target, Kanban, BarChart3, Search,
} from 'lucide-react'
import { cn } from '../../../../../shared/utils/cn'
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../../../../../shared/ui/shadcn/command'

import CrmDashboard from './CrmDashboard'
import CrmLeads from './CrmLeads'
import CrmAccounts from './CrmAccounts'
import CrmContacts from './CrmContacts'
import CrmActivities from './CrmActivities'
import CrmTasks from './CrmTasks'
import CrmCalendar from './CrmCalendar'
import CrmOpportunities from './CrmOpportunities'
import CrmPipeline from './CrmPipeline'
import CrmReports from './CrmReports'

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, Component: CrmDashboard },
  { id: 'leads', label: 'Leads', icon: Users, Component: CrmLeads },
  { id: 'accounts', label: 'Accounts', icon: Building2, Component: CrmAccounts },
  { id: 'contacts', label: 'Contacts', icon: Contact, Component: CrmContacts },
  { id: 'opportunities', label: 'Opportunities', icon: Target, Component: CrmOpportunities },
  { id: 'pipeline', label: 'Pipeline', icon: Kanban, Component: CrmPipeline },
  { id: 'activities', label: 'Activities', icon: Activity, Component: CrmActivities },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, Component: CrmTasks },
  { id: 'calendar', label: 'Calendar', icon: Calendar, Component: CrmCalendar },
  { id: 'reports', label: 'Reports', icon: BarChart3, Component: CrmReports },
]

export default function CrmShellLayout({ onNavigate }) {
  const [section, setSection] = useState('dashboard')
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const active = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0]
  const ActiveComponent = active.Component

  function go(id) {
    setSection(id)
    setPaletteOpen(false)
  }

  return (
    <div className="flex h-full min-h-[520px]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-white flex flex-col">
        <button
          onClick={() => setPaletteOpen(true)}
          className="mx-3 mt-3 mb-1 flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs text-on-surface-variant hover:border-primary transition-colors"
        >
          <Search className="h-3.5 w-3.5" /> Quick jump
          <kbd className="ml-auto text-[10px] font-mono bg-surface-low px-1 rounded">⌘K</kbd>
        </button>
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
                section === s.id ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
              )}
            >
              <s.icon className="h-4 w-4 shrink-0" /> {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-surface-low">
        <div className="px-6 py-5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4">
            <span>Nimbus CRM</span>
            <span className="text-border">/</span>
            <span className="text-on-surface font-medium">{active.label}</span>
          </nav>
          <ActiveComponent onNavigate={go} />
        </div>
      </div>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Jump to a CRM module..." />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup heading="Modules">
            {SECTIONS.map((s) => (
              <CommandItem key={s.id} onSelect={() => go(s.id)}>
                <s.icon className="h-4 w-4 mr-2" /> {s.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
