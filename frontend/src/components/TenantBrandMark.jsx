import { resolveMediaUrl } from '../lib/client'
import { useTenant } from '../features/auth/TenantContext'
import worklearnLogo from '../assets/logo.png'

const SIZES = {
  sm: {
    img: 'h-9 w-auto max-w-[8.5rem]',
    powered: 'text-[9px]',
    brand: 'text-[11px]',
    mark: 'w-3.5 h-3.5',
  },
  md: {
    img: 'h-24 w-auto max-w-[16rem]',
    powered: 'text-[10px]',
    brand: 'text-xs',
    mark: 'w-4 h-4',
  },
  lg: {
    img: 'h-12 w-auto max-w-[11rem]',
    powered: 'text-[10px]',
    brand: 'text-xs',
    mark: 'w-4 h-4',
  },
}

/** Compact marketing chip — stays readable in a w-60 sidebar without
 * pushing nav items (e.g. Students) out of the first viewport. */
function PoweredByWorkLearn({ size = 'sm' }) {
  const s = SIZES[size] || SIZES.sm
  return (
    <div
      className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-primary/15 bg-primary/[0.04] dark:bg-primary/10 px-2 py-0.5"
      title="Powered by WorkLearn"
    >
      <span className={`${s.powered} font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 shrink-0`}>
        Powered by
      </span>
      <img
        src={worklearnLogo}
        alt=""
        aria-hidden
        className={`${s.mark} rounded-[3px] object-cover shrink-0`}
      />
      <span className={`${s.brand} font-extrabold tracking-tight text-slate-800 dark:text-slate-100 truncate`}>
        Work<span className="text-primary">Learn</span>
      </span>
    </div>
  )
}

/**
 * Partner subdomain brand: university logo (or WorkLearn fallback) with
 * "Powered by WorkLearn" underneath. On the academy host, renders the
 * WorkLearn logo + wordmark (no powered-by line).
 */
export default function TenantBrandMark({ size = 'sm', className = '' }) {
  const { tenant, isPartner } = useTenant()
  const s = SIZES[size] || SIZES.sm
  const uniLogo = tenant?.logo_url ? resolveMediaUrl(tenant.logo_url) : null
  const src = isPartner && uniLogo ? uniLogo : worklearnLogo
  const alt = isPartner && uniLogo ? (tenant?.name || 'University') : 'WorkLearn'
  const wordSize = size === 'lg' ? 'text-base' : 'text-sm'

  if (!isPartner) {
    return (
      <div className={`flex items-end gap-2 min-w-0 ${className}`}>
        <img
          src={worklearnLogo}
          alt="WorkLearn"
          className={`${size === 'md' || size === 'lg' ? 'w-10 h-10 rounded-xl' : 'w-8 h-8 rounded'} object-cover object-bottom shrink-0`}
        />
        <span className={`font-bold text-on-surface tracking-tight ${wordSize}`}>WorkLearn</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-start gap-1.5 min-w-0 max-w-full ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${s.img} object-contain object-left-bottom shrink-0 rounded-sm`}
      />
      <PoweredByWorkLearn size={size} />
    </div>
  )
}
