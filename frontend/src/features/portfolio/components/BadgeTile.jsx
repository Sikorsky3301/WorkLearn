import { Calendar, Download } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { downloadBadgePdf } from '../../../lib/pdf'
import CredentialShield, { variantFor } from './credentials/CredentialShield'

/** The short word stamped inside the crest. Badge labels are long and
 * simulation-specific ("Junior Data Analyst Job Simulation — Journey"), so
 * the trailing segment after the em dash is the actual credential type —
 * that's what belongs on the mark, with the full label kept below it. */
function crestWord(badge) {
  const label = badge.label || ''
  const tail = label.split('—').pop().trim()
  return (tail || badge.badge_key || 'Badge').toUpperCase()
}

export default function BadgeTile({ badge }) {
  const { user } = useAuth()

  return (
    <div className="group relative flex flex-col items-center text-center p-4 rounded-xl border border-border bg-white hover:border-primary/40 hover:shadow-md transition-all">
      <CredentialShield
        word={crestWord(badge)}
        sublabel="Certified"
        variant={variantFor(badge.badge_key || badge.label || 'badge')}
        className="w-20 h-auto mb-3 shrink-0"
      />

      <p className="text-xs font-bold text-on-surface leading-tight line-clamp-2">{badge.label}</p>
      <p className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
        <Calendar className="h-2.5 w-2.5" />
        {new Date(badge.granted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>

      <button
        onClick={() => downloadBadgePdf(badge, user)}
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-border text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
      >
        <Download className="h-3 w-3" /> PDF
      </button>
    </div>
  )
}
