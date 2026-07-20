import { useRef, useState } from 'react'
import { ArrowLeft, Award, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../../auth/AuthContext'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { SIM_META } from '../engine/simulationConfig'
import { Button } from '../../../../shared/ui/shadcn/button'
import nimbusLogoImg from '../../../../assets/nimbus-logo.png'

function formatDate(iso) {
  const d = iso ? new Date(iso) : new Date()
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function CrmCertificate({ onBack }) {
  const { user } = useAuth()
  const scores = useCrmSimStore((s) => s.scores)
  const completedAt = useCrmSimStore((s) => s.completedAt)
  const certRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!certRef.current) return
    setDownloading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      const fileName = `Nimbus-CRM-Certificate-${(user?.name || 'candidate').replace(/\s+/g, '-')}.pdf`
      pdf.save(fileName)
      toast.success('Certificate downloaded')
    } catch {
      toast.error('Could not generate the certificate — try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-low py-10">
      <div className="max-w-container mx-auto px-6 space-y-6">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back to results</Button>

        {/* Certificate — this exact node is what gets captured for the PDF */}
        <div
          ref={certRef}
          className="mx-auto w-full max-w-3xl bg-white border-[10px] border-primary/10 rounded-2xl p-12 text-center relative"
        >
          <div className="absolute inset-4 border border-primary/20 rounded-xl pointer-events-none" />

          <img src={nimbusLogoImg} alt={SIM_META.company} className="h-8 w-auto object-contain mx-auto mb-6" />

          <div className="flex items-center justify-center gap-2 mb-4">
            <Award className="h-5 w-5 text-primary" />
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Certificate of Completion</p>
          </div>

          <p className="text-sm text-on-surface-variant mb-1">This certifies that</p>
          <h1 className="text-3xl font-bold text-on-surface mb-1">{user?.name || 'Candidate'}</h1>
          <p className="text-sm text-on-surface-variant mb-6">has successfully completed the</p>

          <h2 className="text-xl font-bold text-primary mb-1">{SIM_META.title}</h2>
          <p className="text-sm text-on-surface-variant mb-8">Job Simulation · {SIM_META.company}</p>

          <div className="w-24 h-px bg-border mx-auto mb-8" />

          <p className="text-sm text-on-surface leading-relaxed max-w-xl mx-auto mb-8">
            Demonstrating hands-on experience across the full enterprise sales cycle — lead qualification,
            account research, cold outreach, discovery, CRM pipeline management, objection handling,
            proposal writing, and closing.
          </p>

          {scores && (
            <div className="flex items-center justify-center gap-10 mb-10">
              <div>
                <p className="text-3xl font-bold text-primary">{scores.overall}</p>
                <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Overall Score</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <p className="text-lg font-bold text-on-surface">{scores.hiringRecommendation}</p>
                <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Hiring Recommendation</p>
              </div>
            </div>
          )}

          <div className="flex items-end justify-between max-w-xl mx-auto pt-6 border-t border-border">
            <div className="text-left">
              <p className="text-sm font-semibold text-on-surface italic">{SIM_META.manager.name}</p>
              <p className="text-[11px] text-on-surface-variant">{SIM_META.manager.role}, {SIM_META.company}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-on-surface">{formatDate(completedAt)}</p>
              <p className="text-[11px] text-on-surface-variant">Date Completed</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? 'Preparing…' : 'Download Certificate (PDF)'}
          </Button>
        </div>
      </div>
    </div>
  )
}
