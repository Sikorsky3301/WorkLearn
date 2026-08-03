import { useNavigate } from 'react-router-dom'
import { Trophy, Download, Copy, Check, ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useUserCertificates } from '../../../hooks'
import { useAuth } from '../../auth/AuthContext'
import { downloadCertificatePdf } from '../../../lib/pdf'
import CredentialShield, { variantFor } from '../../portfolio/components/credentials/CredentialShield'

/**
 * Terminal screen for a finished simulation.
 *
 * This used to be a dead end — a trophy, one line of text, and a "Back to
 * Simulations" button — which meant the completion certificate the backend
 * had just issued was never surfaced at the one moment the student most
 * wants it. It now shows the real credential (number, stats, download) and
 * routes onward to the Portfolio rather than only backwards.
 */
export default function SimulationCompleteScreen({ simulation, taskCount, slug }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading } = useUserCertificates()
  const [copied, setCopied] = useState(false)

  const certificate = (data?.certificates ?? []).find((c) => c.simulation_id === slug)

  function copyNumber() {
    if (!certificate) return
    navigator.clipboard?.writeText(certificate.certificate_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-low px-6 py-12">
      <div className="w-full max-w-lg text-center">
        <span className="inline-flex h-14 w-14 rounded-full bg-primary/[0.07] text-primary items-center justify-center mb-4">
          <Trophy className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-bold text-on-surface mb-1.5">Simulation complete</h1>
        <p className="text-sm text-on-surface-variant mb-7">
          You finished all {taskCount} tasks of {simulation.title}.
        </p>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-white shadow-sm py-10 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : certificate ? (
          <div className="rounded-xl border border-border bg-white shadow-sm p-6 text-left">
            <div className="flex items-start gap-5">
              <CredentialShield
                word="COMPLETED"
                sublabel="Certified"
                variant={variantFor(certificate.simulation_id || certificate.certificate_number)}
                className="w-16 h-auto shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
                  Certificate earned
                </p>
                <p className="text-sm font-bold text-on-surface leading-snug">{certificate.simulation_title}</p>
                {certificate.company && (
                  <p className="text-xs text-on-surface-variant mt-0.5">{certificate.company}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-on-surface-variant flex-wrap">
                  <span>{certificate.tasks_completed}/{certificate.total_tasks} tasks</span>
                  {certificate.average_score != null && <span>Avg. {certificate.average_score}%</span>}
                </div>
              </div>
            </div>

            <button
              onClick={copyNumber}
              title="Copy certificate number"
              className="w-full mt-4 inline-flex items-center justify-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-2 rounded-lg bg-surface-low border border-border text-on-surface hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              {certificate.certificate_number}
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            </button>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => downloadCertificatePdf(certificate, user)}
                className="btn-primary flex-1 text-sm py-2.5"
              >
                <Download className="h-4 w-4" /> Download certificate
              </button>
              <button onClick={() => navigate('/portfolio')} className="btn-secondary text-sm py-2.5 px-4">
                Portfolio <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          // Issuance is server-side and non-fatal — if it didn't land, say so
          // plainly instead of pretending the certificate doesn't exist.
          <div className="rounded-xl border border-border bg-white shadow-sm p-6">
            <p className="text-sm text-on-surface-variant">
              Your certificate is being issued — check the{' '}
              <button onClick={() => navigate('/portfolio')} className="text-primary font-semibold hover:underline cursor-pointer">
                Certificates tab in your Portfolio
              </button>{' '}
              in a moment.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate('/simulations')}
          className="mt-6 text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          ← Back to simulations
        </button>
      </div>
    </div>
  )
}
