import { Sparkles, Target, Compass, Lightbulb, ArrowUpRight } from 'lucide-react'
import aiMentorIcon from '../../assets/ai-mentor-icon.png'

const CARD_ICONS = [Sparkles, Target, Compass, Lightbulb]

/** Centered empty-conversation state — mentor icon, greeting, and up to 4
 * real starter QUESTIONS (from GET /api/mentor/topics) a student can click to
 * send as their first message.
 *
 * The cards used to send "Can you help me with {topic}?", built from the same
 * short chip labels the input bar uses. That is exactly the shape of question
 * the mentor's own guardrails are written to refuse to answer outright — so
 * every card opened the conversation with the mentor asking the student to
 * narrow it down. The server now supplies whole, specific questions instead
 * (persona-written, and the first one names the task they have open), and
 * they are sent verbatim. */
export default function MentorWelcome({ firstName, starters, onPromptClick }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
      <div className="mentor-rise relative mb-5">
        <div className="mentor-orb-glow absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-violet-400/30 to-fuchsia-400/30 blur-2xl" />
        <img src={aiMentorIcon} alt="" className="relative w-16 h-16 rounded-2xl shadow-lg" />
      </div>

      <h1 className="mentor-rise text-2xl font-extrabold text-on-surface mb-1.5 text-center" style={{ animationDelay: '60ms' }}>
        Welcome, {firstName}
      </h1>
      <p
        className="mentor-rise text-sm text-on-surface-variant text-center max-w-md mb-7"
        style={{ animationDelay: '120ms' }}
      >
        Ask anything about your simulation, career path, or skills.
      </p>

      {starters.length > 0 && (
        <div className="w-full max-w-2xl">
          <p
            className="mentor-rise section-label mb-2.5 text-center"
            style={{ animationDelay: '180ms' }}
          >
            Try asking
          </p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {starters.map((prompt, i) => {
              const Icon = CARD_ICONS[i % CARD_ICONS.length]
              return (
                <button
                  key={prompt}
                  onClick={() => onPromptClick(prompt)}
                  style={{ animationDelay: `${220 + i * 70}ms` }}
                  className="mentor-rise group flex items-start gap-2.5 text-left bg-white border border-border rounded-xl p-3.5 cursor-pointer
                             transition-all duration-200 hover:border-primary hover:shadow-panel-raised hover:-translate-y-0.5
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  <span className="w-7 h-7 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-on-surface leading-snug">{prompt}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 mt-1 text-on-surface-variant/40 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
