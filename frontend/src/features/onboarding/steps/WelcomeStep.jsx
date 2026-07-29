import { Sparkles } from 'lucide-react'

export default function WelcomeStep({ name }) {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center mb-5">
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <h2 className="text-lg font-bold text-on-surface mb-2">Welcome to WorkLearn{name ? `, ${name}` : ''}!</h2>
      <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
        Let's set up your profile so we can personalize your job simulations, skill tracking, and AI Mentor guidance.
        It only takes a couple of minutes.
      </p>
    </div>
  )
}
