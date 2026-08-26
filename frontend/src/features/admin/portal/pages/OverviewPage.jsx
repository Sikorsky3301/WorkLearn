import { Link } from 'react-router-dom'
import {
  Users, Activity, Building2, GraduationCap, Award, UserX,
  ShieldCheck, ArrowRight, Wand2, UserPlus, Blocks,
} from 'lucide-react'
import { useAuth } from '../../../auth/AuthContext'
import { useAdminStats } from '../../../../hooks'
import { openAuthedTab } from '../../../../lib/tabHandoff'
import ActivityFeed from '../../shared/ActivityFeed'
import EmptyState from '../../../../components/design-system/EmptyState'

/**
 * The portal's landing page.
 *
 * WHAT IT WAS: a sentence of welcome copy and two numbers — Total Users and
 * Active Today — on a page with nothing else on it.
 *
 * /api/admin/stats was already computing SIX figures on every load, four of
 * which were thrown away: universities, certificates, direct users, and
 * university students. An overview that answers two questions and silently
 * discards four is not an overview; it is a header.
 *
 * It now shows the whole payload, the recent activity that was buried on its
 * own page, and the three things an admin actually comes here to start.
 */

function Metric({ label, value, sub, icon: Icon, loading, to, onClick, tone = 'default' }) {
  const body = (
    <>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {Icon && (
          <Icon className={`h-4 w-4 ${tone === 'warn' ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`} />
        )}
      </div>
      <p className="font-display text-[1.75rem] font-extrabold leading-none tabular-nums text-slate-900 dark:text-slate-100">
        {loading ? <span className="text-slate-300 dark:text-slate-700">—</span> : value}
      </p>
      {sub && <p className="mt-1.5 text-[0.72rem] leading-snug text-slate-500 dark:text-slate-400">{sub}</p>}
    </>
  )

  const shell =
    'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ' +
    (to || onClick ? 'transition-colors hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer' : '')

  if (to) return <Link to={to} className={`block ${shell}`}>{body}</Link>
  if (onClick) return <button onClick={onClick} className={`block w-full text-left ${shell}`}>{body}</button>
  return <div className={shell}>{body}</div>
}

function QuickAction({ icon: Icon, label, description, to, onClick }) {
  const inner = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.84rem] font-semibold text-slate-900 dark:text-slate-100">{label}</span>
        <span className="block truncate text-[0.72rem] text-slate-500 dark:text-slate-400">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-600 dark:text-slate-700 dark:group-hover:text-slate-300" />
    </>
  )
  const cls =
    'group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 cursor-pointer'
  return onClick
    ? <button onClick={onClick} className={cls}>{inner}</button>
    : <Link to={to} className={cls}>{inner}</Link>
}

export default function OverviewPage() {
  const { user, hasPermission } = useAuth()
  const canViewStats = hasPermission('analytics.view_platform')
  const canViewActivity = hasPermission('activity.view_feed')
  const { data: stats, isLoading } = useAdminStats()

  const n = (v) => (v ?? 0).toLocaleString()

  return (
    <div className="space-y-7">
      <header className="border-t-2 border-slate-900 pt-4 dark:border-slate-100">
        <h1 className="font-display text-[1.6rem] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
          {user?.name?.split(' ')[0] ? `Hello, ${user.name.split(' ')[0]}` : 'Overview'}
        </h1>
        <p className="mt-1 text-[0.85rem] text-slate-500 dark:text-slate-400">
          Signed in as{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {user?.admin_role_name || 'Admin'}
          </span>{' '}
          — the sidebar shows only what your role grants.
        </p>
      </header>

      {canViewStats ? (
        <>
          <section>
            <h2 className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              People
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric
                label="Total users" value={n(stats?.total_users)} icon={Users} loading={isLoading}
                to="/admin/users" sub="Every account except platform admins"
              />
              <Metric
                label="Active today" value={n(stats?.active_today)} icon={Activity} loading={isLoading}
                sub="Seen since 00:00 UTC"
              />
              <Metric
                label="Active this week" value={n(stats?.active_this_week)} icon={Activity} loading={isLoading}
                sub="Seen in the last 7 days"
              />
              <Metric
                label="Suspended" value={n(stats?.suspended_users)} icon={UserX} loading={isLoading}
                tone={stats?.suspended_users ? 'warn' : 'default'}
                to="/admin/users" sub="Cannot sign in"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Reach
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric
                label="Universities" value={n(stats?.universities)} icon={Building2} loading={isLoading}
                to="/admin/universities" sub="Tenants with at least one account"
              />
              <Metric
                label="Partner students" value={n(stats?.university_students)} icon={GraduationCap} loading={isLoading}
                sub="Provisioned through a university"
              />
              <Metric
                label="Direct signups" value={n(stats?.direct_users)} icon={UserPlus} loading={isLoading}
                sub="Joined the platform themselves"
              />
              <Metric
                label="Certificates" value={n(stats?.certificates)} icon={Award} loading={isLoading}
                sub={`${n(stats?.enrollments)} enrollments in total`}
              />
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="No permissions granted yet"
          description="Ask your Super Admin to assign a role with the permissions you need."
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {canViewActivity && (
          <section className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Recent activity
              </h2>
              <Link to="/admin/activity" className="text-[0.72rem] font-semibold text-primary hover:underline">
                See all
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
              <ActivityFeed limit={8} />
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            Start something
          </h2>
          <div className="space-y-2">
            <QuickAction
              icon={Wand2} label="Sim Builder"
              description="Build or edit a simulation"
              onClick={() => openAuthedTab('/admin/content/sim-builder')}
            />
            <QuickAction
              icon={UserPlus} label="Provision a user"
              description="Add one account, or bulk import"
              to="/admin/users"
            />
            <QuickAction
              icon={Blocks} label="Simulations"
              description="Publish, scope and retire"
              to="/admin/simulations"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
