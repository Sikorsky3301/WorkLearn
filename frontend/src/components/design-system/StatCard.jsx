export default function StatCard({ label, value, icon: Icon, trend, trendLabel }) {
  const trendPositive = typeof trend === 'number' && trend >= 0
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
      </div>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
      {typeof trend === 'number' && (
        <p className={`text-xs font-medium mt-1 ${trendPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {trendPositive ? '+' : ''}{trend}% {trendLabel}
        </p>
      )}
    </div>
  )
}
