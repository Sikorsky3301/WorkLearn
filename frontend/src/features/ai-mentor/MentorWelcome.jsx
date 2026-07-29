import { Sparkles, Target, TrendingUp } from 'lucide-react'
import aiMentorIcon from '../../assets/ai-mentor-icon.png'

const CARD_ICONS = [Sparkles, Target, TrendingUp]

/** Centered empty-conversation state — mentor icon, greeting, and up to 3
 * real domain-aware topic cards (from GET /api/mentor/topics) a student can
 * click to send a first message. Shown in place of the message list until
 * there's at least one message in the conversation. */
export default function MentorWelcome({ firstName, topics, onTopicClick }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
      <div className="relative mb-5">
        <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-violet-400/30 to-fuchsia-400/30 blur-2xl" />
        <img src={aiMentorIcon} alt="" className="relative w-16 h-16 rounded-2xl shadow-lg" />
      </div>

      <h1 className="text-2xl font-extrabold text-on-surface mb-1.5 text-center">Welcome, {firstName}</h1>
      <p className="text-sm text-on-surface-variant text-center max-w-md">
        Ask anything about your simulation, career path, or skills.
      </p>
      <p className="text-sm text-on-surface-variant mb-7">Not sure where to start?</p>

      {topics.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3 w-full max-w-2xl">
          {topics.slice(0, 3).map((topic, i) => {
            const Icon = CARD_ICONS[i % CARD_ICONS.length]
            return (
              <button
                key={topic}
                onClick={() => onTopicClick(topic)}
                className="card text-left hover:border-primary transition-colors cursor-pointer p-4"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-bold text-on-surface mb-1">{topic}</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">Get help with {topic.toLowerCase()}.</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
