import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useSimulations, useUpdateProfile, useUploadPhoto, useAddEducation, useCompleteOnboarding } from '../../hooks'
import OnboardingLayout from './components/OnboardingLayout'
import WelcomeStep from './steps/WelcomeStep'
import ProfileStep from './steps/ProfileStep'
import ContactStep from './steps/ContactStep'
import DomainStep from './steps/DomainStep'
import EducationStep from './steps/EducationStep'
import ReviewStep from './steps/ReviewStep'

const STEPS = ['welcome', 'profile', 'contact', 'domain', 'education', 'review']

const STEP_COPY = {
  welcome:   { title: 'Welcome to WorkLearn', subtitle: "Let's get your profile set up." },
  profile:   { title: 'Tell us about yourself', subtitle: 'This appears on your public Portfolio.' },
  contact:   { title: 'How can recruiters reach you?', subtitle: "All optional — add what you're comfortable sharing." },
  domain:    { title: 'Choose your career domain', subtitle: "We'll highlight matching job simulations for you." },
  education: { title: 'Your education', subtitle: 'Optional — add your academic background.' },
  review:    { title: 'Review & finish', subtitle: 'Confirm everything looks right, then get started.' },
}

/** First-login onboarding wizard — gated in app/router/guards/ProtectedRoute
 * (a STUDENT with onboarding_completed=false is redirected here on every
 * route until they finish). Data is only persisted once, on the final step
 * — see handleFinish. */
export default function OnboardingWizard() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  // Already onboarded (e.g. navigated back here manually) — nothing to do.
  useEffect(() => {
    if (user?.onboarding_completed) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const { data: simsData } = useSimulations()
  const domains = useMemo(
    () => [...new Set((simsData?.simulations || []).map((s) => s.domain).filter(Boolean))],
    [simsData]
  )

  const [stepIdx, setStepIdx] = useState(0)
  const [form, setForm] = useState({
    headline: '', bio: '', phone: '', location: '',
    linkedin_url: '', github_url: '', website_url: '', preferred_domain: '',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [educationEntries, setEducationEntries] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const updateProfile = useUpdateProfile()
  const uploadPhoto = useUploadPhoto()
  const addEducation = useAddEducation()
  const completeOnboarding = useCompleteOnboarding()

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  function handlePhotoSelect(file) {
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const step = STEPS[stepIdx]
  const isLast = stepIdx === STEPS.length - 1
  const canGoNext = step !== 'domain' || Boolean(form.preferred_domain)

  async function handleFinish() {
    setSubmitting(true)
    setError('')
    try {
      if (photoFile) await uploadPhoto.mutateAsync(photoFile)
      await updateProfile.mutateAsync({
        headline: form.headline, bio: form.bio, phone: form.phone, location: form.location,
        linkedin_url: form.linkedin_url, github_url: form.github_url, website_url: form.website_url,
        preferred_domain: form.preferred_domain || null,
      })
      for (const entry of educationEntries) {
        if (!entry.institution?.trim()) continue
        await addEducation.mutateAsync({
          ...entry,
          start_year: entry.start_year ? Number(entry.start_year) : null,
          end_year: entry.end_year ? Number(entry.end_year) : null,
        })
      }
      await completeOnboarding.mutateAsync()
      await refreshUser()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong — please try again.')
      setSubmitting(false)
    }
  }

  const { title, subtitle } = STEP_COPY[step]

  return (
    <OnboardingLayout step={stepIdx} totalSteps={STEPS.length} title={title} subtitle={subtitle}>
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</div>}

      {step === 'welcome' && <WelcomeStep name={user?.name?.split(' ')[0]} />}
      {step === 'profile' && (
        <ProfileStep value={form} onChange={set} photoPreview={photoPreview} onPhotoSelect={handlePhotoSelect} name={user?.name} />
      )}
      {step === 'contact' && <ContactStep value={form} onChange={set} />}
      {step === 'domain' && (
        <DomainStep domains={domains} selected={form.preferred_domain} onSelect={(d) => set('preferred_domain', d)} />
      )}
      {step === 'education' && <EducationStep entries={educationEntries} onChange={setEducationEntries} />}
      {step === 'review' && (
        <ReviewStep form={{ ...form, educationEntries }} photoPreview={photoPreview} name={user?.name} email={user?.email} />
      )}

      <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
        {stepIdx > 0 ? (
          <button type="button" onClick={() => setStepIdx((i) => i - 1)} disabled={submitting} className="btn-secondary text-sm px-5 py-2 cursor-pointer disabled:opacity-50">
            Back
          </button>
        ) : <span />}

        {isLast ? (
          <button type="button" onClick={handleFinish} disabled={submitting} className="btn-primary text-sm px-6 py-2 cursor-pointer disabled:opacity-60">
            {submitting ? 'Setting up...' : 'Get Started →'}
          </button>
        ) : (
          <button
            type="button" onClick={() => setStepIdx((i) => i + 1)} disabled={!canGoNext}
            className="btn-primary text-sm px-6 py-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        )}
      </div>
    </OnboardingLayout>
  )
}
