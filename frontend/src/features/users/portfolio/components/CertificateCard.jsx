import { Download, Copy, Check, Calendar } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { downloadCertificatePdf } from '../../../../lib/pdf'
import CredentialShield, { variantFor } from './credentials/CredentialShield'

/** One earned completion certificate. The certificate number is the whole
 * point of the credential — it's shown in full (not truncated) and
 * copyable, since that's the string a recruiter would be given to verify. */
export default function CertificateCard({ certificate }) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  function copyNumber() {
    navigator.clipboard?.writeText(certificate.certificate_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="flex gap-5 p-5 rounded-xl border border-border bg-white hover:border-primary/40 hover:shadow-md transition-all">
      <CredentialShield
        word="COMPLETED"
        sublabel="Certified"
        variant={variantFor(certificate.simulation_id || certificate.certificate_number)}
        className="w-16 h-auto shrink-0"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-on-surface leading-snug">{certificate.simulation_title}</p>
        {certificate.company && (
          <p className="text-xs text-on-surface-variant mt-0.5">{certificate.company}</p>
        )}

        <div className="flex items-center gap-3 mt-2 text-[11px] text-on-surface-variant flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(certificate.issued_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span>{certificate.tasks_completed}/{certificate.total_tasks} tasks</span>
          {certificate.average_score != null && <span>Avg. {certificate.average_score}%</span>}
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={copyNumber}
            title="Copy certificate number"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-1 rounded-md bg-surface-low border border-border text-on-surface hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            {certificate.certificate_number}
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
          </button>

          <button
            onClick={() => downloadCertificatePdf(certificate, user)}
            className="btn-primary text-xs px-3 py-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </div>
    </div>
  )
}
