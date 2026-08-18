import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GraduationCap, Clock, ListChecks, Target } from 'lucide-react'
import AssessmentRunner from './AssessmentRunner'
import { resolveMediaUrl } from '../../../../lib/client'

// The closing exam.
//
// Its own layout rather than the two-column task page: fifty questions beside a
// docked mentor rail would be cramped, and the mentor has no business being
// open during an assessment anyway.
//
// Ten questions a page. A single scroll of fifty is demoralising to open and
// impossible to gauge progress through; paging gives an honest "3 of 5" and a
// natural place to pause.

const PER_PAGE = 10

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border border-white/10 bg-white/5 px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-emerald-300" />
      <span className="min-w-0">
        <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-white/45">{label}</span>
        <span className="block font-display text-sm font-extrabold text-white">{value}</span>
      </span>
    </div>
  )
}

export default function FinalAssessmentPage({ slug, task, simulation, enrollmentId }) {
  const navigate = useNavigate()
  const manager = simulation?.manager || {}
  const questionCount = task.config?.question_count || 50
  const passMark = task.config?.pass_mark || 0

  return (
    <div className="min-h-screen bg-surface-low/50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <button
          onClick={() => navigate(`/simulations/${slug}/roadmap`)}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to roadmap
        </button>

        <div className="bg-[#0d1b2a] p-7 text-white sm:p-9">
          <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-emerald-300">
            <GraduationCap className="h-4 w-4" /> Final assessment
          </p>

          <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {task.title}
          </h1>
          {task.objective && (
            <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-white/70">{task.objective}</p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat icon={ListChecks} label="Questions" value={questionCount} />
            <Stat icon={Target} label="Pass mark" value={passMark ? `${passMark}%` : '—'} />
            <Stat icon={Clock} label="Time limit" value="None" />
          </div>
        </div>

        {task.briefing && (
          <div className="mt-5 flex gap-4 border border-border bg-white p-5 sm:p-6">
            {manager.photo_url ? (
              <img src={resolveMediaUrl(manager.photo_url)} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {manager.avatar || 'M'}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface">{manager.name || 'Your manager'}</p>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-on-surface">{task.briefing}</p>
            </div>
          </div>
        )}

        <div className="mt-5">
          <AssessmentRunner
            enrollmentId={enrollmentId}
            taskIndex={task.task_index}
            perPage={PER_PAGE}
          />
        </div>
      </div>
    </div>
  )
}
