import { Users, Building2, Activity as ActivityIcon, Award, GraduationCap, TrendingUp } from 'lucide-react'
import { usePlatformAnalytics } from '../../hooks'
import StatCard from '../../shared/design-system/StatCard'
import GrowthChart from './GrowthChart'

/** Real platform-wide/cohort analytics — shared by both portals. */
export default function PlatformAnalytics() {
  const { data, isLoading } = usePlatformAnalytics(30)
  const s = data?.summary

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Users" value={isLoading ? '—' : (s?.total_users ?? 0).toLocaleString()} icon={Users} />
        <StatCard label="Daily Active" value={isLoading ? '—' : (s?.dau ?? 0).toLocaleString()} icon={ActivityIcon} />
        <StatCard label="Weekly Active" value={isLoading ? '—' : (s?.wau ?? 0).toLocaleString()} icon={ActivityIcon} />
        <StatCard label="Monthly Active" value={isLoading ? '—' : (s?.mau ?? 0).toLocaleString()} icon={ActivityIcon} />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Universities" value={isLoading ? '—' : s?.universities ?? 0} icon={Building2} />
        <StatCard label="Simulations" value={isLoading ? '—' : s?.total_simulations ?? 0} icon={GraduationCap} />
        <StatCard label="Enrollments" value={isLoading ? '—' : (s?.total_enrollments ?? 0).toLocaleString()} icon={Award} />
        <StatCard label="Completion Rate" value={isLoading ? '—' : `${s?.completion_rate ?? 0}%`} icon={TrendingUp} />
      </div>
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
        {isLoading ? (
          <div className="h-52 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        ) : (
          <GrowthChart data={data?.growth} />
        )}
      </div>
    </div>
  )
}
