import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMira } from './MiraContext'
import { INTERVIEW_TYPES, ROLES, DIFFICULTIES, DURATIONS } from './questionBank'
import { FileUpload } from '../../components/ui/file-upload'

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div className="mb-6">
      <label className="section-label mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
              value === opt
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-on-surface-variant border-border hover:border-primary'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MiraSetup() {
  const navigate = useNavigate()
  const { startInterview } = useMira()

  const [interviewType, setInterviewType] = useState('Technical')
  const [role, setRole] = useState('AI/ML Engineer')
  const [customRole, setCustomRole] = useState('')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [duration, setDuration] = useState('20 minutes')
  const [resumeFile, setResumeFile] = useState(null)

  const durationMeta = DURATIONS.find(d => d.label === duration)
  const effectiveRole = role === 'Custom role' ? (customRole.trim() || 'Custom role') : role

  function handleBegin() {
    startInterview({ interviewType, role: effectiveRole, difficulty, duration, resumeFileName: resumeFile?.name })
    navigate('/mira/session')
  }

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-on-surface">Customize Your Mock Interview</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Set up your session — MIRA will tailor the interview to your choices.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="card mb-5">
          <OptionGroup label="Interview Type" options={INTERVIEW_TYPES} value={interviewType} onChange={setInterviewType} />
          <OptionGroup label="Role / Domain" options={ROLES} value={role} onChange={setRole} />

          {role === 'Custom role' && (
            <div className="-mt-4 mb-6">
              <input
                type="text"
                value={customRole}
                onChange={e => setCustomRole(e.target.value)}
                placeholder="e.g. Machine Learning Research Intern"
                className="input"
              />
            </div>
          )}

          <OptionGroup label="Difficulty" options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
          <OptionGroup label="Duration" options={DURATIONS.map(d => d.label)} value={duration} onChange={setDuration} />

          <div className="flex items-center gap-4 p-4 bg-surface-low border border-border rounded-lg mb-5">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">
                {durationMeta?.questionCount} questions · {interviewType} · {effectiveRole} · {difficulty}
                {resumeFile && <> · Personalized from <span className="text-primary">{resumeFile.name}</span></>}
              </p>
              <p className="text-xs text-on-surface-variant">
                MIRA will score each answer on communication, technical accuracy, and confidence.
              </p>
            </div>
          </div>

          <button onClick={handleBegin} className="btn-primary w-full py-3 text-sm font-semibold">
            Begin Interview →
          </button>
        </div>

        <div className="card mb-5">
          <label className="section-label mb-1 block">Personalize with Resume / JD</label>
          <p className="text-xs text-on-surface-variant mb-4">
            Optional — upload your resume or a job description and MIRA will lean on it when picking questions.
          </p>
          <div className="border border-dashed border-border rounded-lg">
            <FileUpload onChange={(uploaded) => setResumeFile(uploaded[0] ?? null)} />
          </div>
          {resumeFile && (
            <button
              type="button"
              onClick={() => setResumeFile(null)}
              className="btn-ghost text-xs mt-3"
            >
              Remove {resumeFile.name}
            </button>
          )}
        </div>

        <div className="card bg-primary/5 border-primary/20">
          <p className="text-xs font-semibold text-primary mb-2">Tips for best results</p>
          <ul className="space-y-1.5 text-xs text-on-surface-variant">
            {[
              'Answer as if you were speaking to a real interviewer — explain your reasoning, not just your conclusion.',
              'Use concrete examples, numbers, or terminology relevant to the question.',
              'Aim for 60–220 words per answer — enough depth without rambling.',
              "It's okay to take a moment to think before answering.",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span> {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
