import { useState } from 'react'
import { Bot, CreditCard, Database } from 'lucide-react'
import ConfigSection from '../../shared/ConfigSection'

const TABS = [
  {
    key: 'ai', label: 'AI Provider', icon: Bot,
    notice: 'Saved for real, but not yet wired into the running app — the AI Mentor still reads its provider/keys from environment variables. Live wiring is a follow-up.',
  },
  {
    key: 'billing', label: 'Billing Provider', icon: CreditCard,
    notice: 'No payment provider is integrated yet — these values are stored for when billing is built, they don\'t process real transactions.',
  },
  {
    key: 'database', label: 'Database', icon: Database,
    notice: 'Changes here don\'t reconnect the running database — stored for reference/handover until wired up.',
  },
]

/** Configuration Center — gated by config.view/config.manage (SUPER_ADMIN
 * bypasses, an ADMIN needs the permission on their assigned role). Real
 * save/load, not yet wired into live behavior — see ConfigSection.jsx /
 * backend's platform_config.py. */
export default function ConfigurationPage() {
  const [active, setActive] = useState('ai')
  const activeTab = TABS.find((t) => t.key === active)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer -mb-px ${
              active === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      <ConfigSection category={activeTab.key} noticeText={activeTab.notice} />
    </div>
  )
}
