import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, MessageSquare, Settings, LayoutDashboard, ChevronsLeft, ChevronsRight, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useMentorSessions, useDeleteMentorSession } from '../../hooks'

/** Left nav shell for the AI Mentor page, matching the reference app-shell
 * layout (New Chat / recent conversations / Settings & Help / profile card).
 * Items from the reference with no real equivalent here (Project, Library,
 * Admin Pages, Integration, upgrade banner) are intentionally left out rather
 * than faked — everything shown here does something. Collapsible to an
 * icon-only rail so the chat gets more width when the sidebar isn't needed.
 *
 * Owns its own navigation (via the `:sessionId` route param) rather than
 * taking callbacks from CareerTwin.jsx — the session list lives entirely
 * here, so it can switch/delete conversations without the parent knowing
 * anything about session ids beyond the one it's currently viewing.
 *
 * `hasMessages` (whether the CURRENTLY open chat has any messages yet) is the
 * one thing it does take from the parent — purely so "New Chat" can no-op
 * when you're already looking at an empty, unused chat instead of stacking
 * up multiple blank conversations from repeated clicks. */
export default function ChatSidebar({ hasMessages }) {
  const navigate = useNavigate()
  const { sessionId: sessionIdParam } = useParams()
  const activeSessionId = sessionIdParam ? Number(sessionIdParam) : null
  const { user } = useAuth()
  const { data: sessions } = useMentorSessions()
  const deleteSession = useDeleteMentorSession()
  const [collapsed, setCollapsed] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const avatarInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  function handleNewChat() {
    // Already on a blank, never-used chat — nothing to do. Without this,
    // clicking "New Chat" twice in a row would leave a trail of empty
    // "New conversation" entries in the list below.
    if (!hasMessages) return
    // No backend call here — a session only gets created once the student
    // actually sends a first message (see useMentorChat's sendMessage /
    // CareerTwin's handleMessageSaved). Creating one eagerly used to leave a
    // phantom empty session behind every time, which then tripped the guard
    // above on the very next click — "New Chat" would work once and then
    // appear to do nothing until that phantom got a message or was deleted.
    navigate('/ai-mentor')
  }

  async function handleDelete(id) {
    try {
      await deleteSession.mutateAsync(id)
      if (id === activeSessionId) navigate('/ai-mentor')
    } finally {
      setConfirmDeleteId(null)
    }
  }

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
          onClick={handleNewChat}
          title="Start a new conversation"
          className={`group/new w-full flex items-center gap-2 border border-border rounded-lg py-2 text-sm font-semibold text-on-surface bg-white cursor-pointer
                      transition-all duration-200 hover:border-primary hover:shadow-sm hover:-translate-y-px active:translate-y-0 active:scale-[0.99] ${
            collapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          <Plus className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/new:rotate-90 group-hover/new:text-primary" />
          {!collapsed && 'New Chat'}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 flex-1 min-h-0 overflow-y-auto">
          <p className="section-label px-1.5 mb-1.5">Recent</p>
          {sessions?.length ? (
            <div className="space-y-0.5">
              {sessions.map((s, i) => (
                <div
                  key={s.id}
                  // Staggered one-shot reveal. Only fires for nodes as they
                  // mount, so a react-query refetch doesn't replay it for
                  // rows that were already on screen.
                  style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                  className={`mentor-rise group relative flex items-center rounded-lg transition-colors duration-150 ${
                    s.id === activeSessionId
                      ? 'bg-primary/10 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary'
                      : 'hover:bg-white'
                  }`}
                >
                  {confirmDeleteId === s.id ? (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 w-full">
                      <span className="text-[11px] text-red-600 font-medium flex-1">Delete this chat?</span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleteSession.isPending}
                        className="text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded px-1.5 py-0.5 cursor-pointer disabled:opacity-50"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[11px] text-on-surface-variant hover:text-on-surface cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate(`/ai-mentor/c/${s.id}`)}
                        title={s.title}
                        className={`flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-left text-sm truncate cursor-pointer ${
                          s.id === activeSessionId ? 'text-primary font-medium' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{s.title}</span>
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(s.id)}
                        title="Delete conversation"
                        className="shrink-0 p-1 mr-1 rounded text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="px-1.5 text-xs text-on-surface-variant">No conversations yet.</p>
          )}
        </div>
      )}

      {/* `mt-auto` keeps this pinned to the bottom in the collapsed rail too,
          where the scrolling conversation list above it isn't rendered and
          nothing else claims the leftover height. */}
      <div className="mt-auto shrink-0 px-3 pb-3">
        {!collapsed && <p className="section-label px-1.5 mb-1.5 mt-3">Settings &amp; Help</p>}
        <button
          onClick={() => navigate('/ai-mentor/settings')}
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
          onClick={() => navigate('/ai-mentor/settings')}
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
