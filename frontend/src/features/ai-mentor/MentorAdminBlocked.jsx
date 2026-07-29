import { useNavigate } from 'react-router-dom'
import { Bot } from 'lucide-react'

/** "Not for admins" placeholder shown at /ai-mentor for SUPER_ADMIN users,
 * who have no student profile for the mentor to read progress from. */
export default function MentorAdminBlocked() {
  const navigate = useNavigate()
  return (
    <div className="max-w-container mx-auto px-6 py-16 text-center">
      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Bot className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-on-surface mb-2">AI Mentor is for enrolled students</h2>
      <p className="text-sm text-on-surface-variant mb-6">As a platform admin you don't have a student profile. Switch to a student account to use the AI Mentor.</p>
      <button onClick={() => navigate('/super-admin')} className="btn-primary text-sm px-5 py-2 cursor-pointer">Back to Admin Panel</button>
    </div>
  )
}
