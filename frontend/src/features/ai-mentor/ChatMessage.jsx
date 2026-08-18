import { useState } from 'react'
import MarkdownMessage from '../../components/ui/MarkdownMessage'
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react'
import aiMentorIcon from '../../assets/ai-mentor-icon.png'
import ThinkingIndicator from './ThinkingIndicator'

/** One chat bubble. Assistant text renders as real markdown (the model
 * outputs headers/bold/lists/code — previously shown as literal `**`/`###`
 * characters via whitespace-pre-wrap). Adds copy/timestamp/thumbs-up-down on
 * finished assistant replies, and a Retry action on the error state. While
 * waiting for the first streamed chunk (tool-resolution + network round-trip
 * can take a few seconds), shows an animated ThinkingIndicator + pulses the
 * mentor avatar instead of an empty bubble. */
export default function ChatMessage({ msg, onRetry, onFeedback }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'
  const isWaiting = !isUser && msg.live && !msg.text

  function handleCopy() {
    navigator.clipboard.writeText(msg.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className={`flex items-start gap-2.5 group ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-lg overflow-hidden shrink-0 mt-0.5 ${isWaiting ? 'mentor-avatar-thinking' : ''}`}>
          <img src={aiMentorIcon} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div style={{ maxWidth: '78%' }}>
        <div
          className={`px-3 py-2.5 rounded-lg text-xs leading-relaxed ${
            msg.error
              ? 'bg-red-50 border border-red-200 text-red-700 rounded-tl-none'
              : isUser
                ? 'bg-primary text-white rounded-tr-none whitespace-pre-wrap'
                : 'bg-surface-low border border-border text-on-surface rounded-tl-none'
          }`}
        >
          {isWaiting ? (
            <ThinkingIndicator />
          ) : isUser || msg.error ? (
            msg.text
          ) : (
            <MarkdownMessage>{msg.text}</MarkdownMessage>
          )}
          {msg.live && msg.text && <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm" />}
        </div>

        {!msg.live && (
          <div className={`flex items-center gap-2 mt-1 px-1 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : ''}`}>
            {time && <span className="text-[10px] text-on-surface-variant/60">{time}</span>}

            {msg.error && (
              <button
                onClick={() => onRetry(msg.retryText)}
                className="flex items-center gap-1 text-[10px] font-semibold text-red-600 hover:text-red-700 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Retry
              </button>
            )}

            {!isUser && !msg.error && msg.text && (
              <>
                <button onClick={handleCopy} title="Copy" className="text-on-surface-variant/50 hover:text-on-surface-variant cursor-pointer">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
                {msg.id && (
                  <>
                    <button
                      onClick={() => onFeedback(msg.id, msg.feedback === 'up' ? null : 'up')}
                      title="Good response"
                      className={`cursor-pointer transition-colors ${msg.feedback === 'up' ? 'text-emerald-600' : 'text-on-surface-variant/50 hover:text-on-surface-variant'}`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onFeedback(msg.id, msg.feedback === 'down' ? null : 'down')}
                      title="Bad response"
                      className={`cursor-pointer transition-colors ${msg.feedback === 'down' ? 'text-red-500' : 'text-on-surface-variant/50 hover:text-on-surface-variant'}`}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
