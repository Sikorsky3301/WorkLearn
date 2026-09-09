import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react'
import { useMentorSettings, useUpdateMentorSettings, useClearMentorHistory, useSkillGpsRoles } from '../../hooks'
import RoleSelector from '../skill-gps/components/RoleSelector'

/** A real, mentor-scoped settings page — replaces the old redirect to the
 * generic (fake) app-wide Settings page. Everything here is backend-wired:
 * the target role the mentor talks to a student about (auto-derived from
 * their enrollment unless explicitly overridden here) and their mentor
 * conversation history. No decorative toggles. */
export default function AiMentorSettings() {
  const navigate = useNavigate()
  const { data: settings, isLoading: settingsLoading } = useMentorSettings()
  const { data: catalog, isLoading: catalogLoading } = useSkillGpsRoles()
  const updateSettings = useUpdateMentorSettings()
  const clearHistory = useClearMentorHistory()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const tracks = catalog?.tracks ?? []
  const targetRole = settings?.target_role ?? null
  const activeTrack = useMemo(
    () => tracks.find((t) => t.roles.some((r) => r.key === targetRole)) ?? tracks[0] ?? null,
    [tracks, targetRole],
  )

  async function handleClear() {
    try { await clearHistory.mutateAsync() } finally { setShowClearConfirm(false) }
  }

  const loading = settingsLoading || catalogLoading

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <button
        onClick={() => navigate('/ai-mentor')}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mentor
      </button>

      <h1 className="text-2xl font-bold text-on-surface">AI Mentor Settings</h1>
      <p className="mt-1 text-sm text-on-surface-variant">
        Controls specific to your AI Mentor — not your account-wide settings.
      </p>

      {loading ? (
        <div className="mt-6 space-y-5 animate-pulse">
          <div className="h-40 rounded-xl border border-border bg-surface-low" />
          <div className="h-32 rounded-xl border border-border bg-surface-low" />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* Target role */}
          <section className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-on-surface">Target Role</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${
                  settings?.is_override ? 'bg-primary/10 text-primary' : 'bg-surface-high text-on-surface-variant'
                }`}
              >
                {settings?.is_override ? 'Custom override' : 'Auto-detected'}
              </span>
            </div>
            <p className="mb-4 text-sm text-on-surface-variant">
              Your mentor coaches you toward <span className="font-semibold text-on-surface">{settings?.target_role_label}</span>.
              {settings?.is_override
                ? ' You set this yourself — it will stay even if you enroll in a different domain.'
                : ' Automatically picked from the domain of your most recent enrollment.'}
            </p>

            {tracks.length > 0 && (
              <RoleSelector
                tracks={tracks}
                activeTrack={activeTrack}
                targetRole={targetRole}
                onSelect={(role) => updateSettings.mutate(role)}
              />
            )}

            {settings?.is_override && (
              <button
                onClick={() => updateSettings.mutate(null)}
                disabled={updateSettings.isPending}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset to automatic
              </button>
            )}
          </section>

          {/* Conversation history */}
          <section className="card">
            <h2 className="mb-1 font-bold text-on-surface">Conversation History</h2>
            <p className="mb-4 text-sm text-on-surface-variant">
              {settings?.message_count ?? 0} message{settings?.message_count === 1 ? '' : 's'} stored with your mentor.
            </p>

            {showClearConfirm ? (
              <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5">
                <span className="text-xs font-medium text-red-700">Delete the whole conversation?</span>
                <button
                  onClick={handleClear}
                  disabled={clearHistory.isPending}
                  className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50 cursor-pointer"
                >
                  {clearHistory.isPending ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-xs font-medium text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={!settings?.message_count}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear conversation history
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
