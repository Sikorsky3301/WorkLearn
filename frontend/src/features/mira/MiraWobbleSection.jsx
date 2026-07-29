import { useNavigate } from 'react-router-dom'
import { WobbleCard } from '../../shared/ui/wobble-card'

export default function MiraWobbleSection() {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
      <WobbleCard containerClassName="col-span-1 lg:col-span-2 min-h-[280px] bg-primary">
        <div className="max-w-md">
          <h3 className="text-left text-balance text-xl md:text-2xl font-bold tracking-tight text-white">
            Practice interviews that actually adapt to you
          </h3>
          <p className="mt-3 text-left text-sm text-white/70 leading-relaxed">
            MIRA asks technical, HR, and behavioral questions matched to your role, difficulty, and — if you upload one — your resume or a job description.
          </p>
        </div>
      </WobbleCard>

      <WobbleCard containerClassName="col-span-1 min-h-[280px] bg-secondary">
        <h3 className="text-left text-balance text-xl md:text-2xl font-bold tracking-tight text-white">
          Instant, structured feedback
        </h3>
        <p className="mt-3 text-left text-sm text-white/70 leading-relaxed">
          Communication, technical accuracy, and confidence — scored right after your session, with concrete suggestions per question.
        </p>
      </WobbleCard>

      <WobbleCard containerClassName="col-span-1 lg:col-span-3 min-h-[220px] bg-on-surface">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-lg">
            <h3 className="text-left text-balance text-xl md:text-2xl font-bold tracking-tight text-white">
              From setup to feedback in under 10 minutes
            </h3>
            <p className="mt-3 text-left text-sm text-white/60 leading-relaxed">
              Pick a type and difficulty, answer one question at a time, and walk away with a clear picture of what to improve.
            </p>
          </div>
          <button
            onClick={() => navigate('/mira/setup')}
            className="shrink-0 bg-white text-on-surface rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-white/90 transition-colors cursor-pointer"
          >
            Start Mock Interview →
          </button>
        </div>
      </WobbleCard>
    </div>
  )
}
