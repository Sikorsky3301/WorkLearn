import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MessageCircle, TrendingUp, Settings, LayoutDashboard, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useSkillGPS } from '../../hooks'

/** Left nav shell for the AI Mentor page, matching the reference app-shell
 * layout (New Chat / Features nav / Settings & Help / profile card). Items
 * from the reference with no real equivalent here (Project, Library, Admin
 * Pages, Integration, upgrade banner) are intentionally left out rather than
 * faked — everything shown here does something. Collapsible to an icon-only
 * rail so the chat gets more width when the sidebar isn't needed. */
export default function ChatSidebar({ onNewChat, hasMessages }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: gpsData } = useSkillGPS(user?.target_role || 'junior_da')
  const [collapsed, setCollapsed] = useState(false)

  const topGaps = gpsData?.top_gaps ?? []
  const avatarInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <aside
      className={`shrink-0 border-r border-border bg-surface-low flex flex-col h-full transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      <div className={`flex items-center p-3 pb-0 ${collapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={onNewChat}
          disabled={!hasMessages}
          title={hasMessages ? 'Start a fresh conversation' : 'Already a fresh chat'}
          className={`w-full flex items-center gap-2 border border-border rounded-lg py-2 text-sm font-semibold text-on-surface hover:border-primary hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white ${
            collapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          <Plus className="h-4 w-4 shrink-0" /> {!collapsed && 'New Chat'}
        </button>
      </div>

      <nav className="px-3">
        {!collapsed && <p className="section-label px-1.5 mb-1.5">Mentor</p>}
        <div
          title="Chat"
          className={`w-full flex items-center gap-2.5 py-1.5 rounded-lg text-sm font-medium text-primary bg-primary/10 ${
            collapsed ? 'justify-center px-0' : 'px-2'
          }`}
        >
          <MessageCircle className="h-4 w-4 shrink-0" /> {!collapsed && 'Chat'}
        </div>
      </nav>

      {!collapsed && topGaps.length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Biggest Skill Gaps
          </p>
          <div className="space-y-2.5">
            {topGaps.slice(0, 3).map((gap) => {
              const pct = gap.required ? Math.min(100, Math.round((gap.current / gap.required) * 100)) : 0
              return (
                <div key={gap.skill}>
                  <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                    <span className="truncate pr-2">{gap.skill}</span>
                    <span className="shrink-0 tabular-nums">{gap.current}/{gap.required}</span>
                  </div>
                  <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-auto px-3 pb-3">
        {!collapsed && <p className="section-label px-1.5 mb-1.5">Settings &amp; Help</p>}
        <button
          onClick={() => navigate('/settings')}
          title="Settings"
          className={`w-full flex items-center gap-2.5 py-1.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-white transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-0' : 'px-2'
          }`}
        >
          <Settings className="h-4 w-4 shrink-0" /> {!collapsed && 'Settings'}
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          title="Dashboard"
          className={`w-full flex items-center gap-2.5 py-1.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-white transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-0' : 'px-2'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" /> {!collapsed && 'Dashboard'}
        </button>

        <button
          onClick={() => navigate('/settings')}
          title={user?.name || 'Profile'}
          className={`w-full flex items-center gap-2.5 mt-3 pt-3 border-t border-border py-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer text-left ${
            collapsed ? 'justify-center px-0' : 'px-1.5'
          }`}
        >
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{avatarInitials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate">{user?.name}</p>
              <p className="text-[11px] text-on-surface-variant truncate">{user?.email || user?.roll_no}</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
