import { useCallback, useRef, useState } from 'react'
import { streamChat, api } from '../../lib/client'

/** Owns all AI Mentor chat state/logic — message list, streaming, stop,
 * retry, clear, and per-message feedback — so CareerTwin.jsx stays a thin
 * presentational shell. Extracted once the UI grew past a single-file
 * amount of behavior (markdown, stop button, retry, feedback all added at
 * once — see the "implement every suggested UI feature" pass). */
export function useMentorChat() {
  const [messages, setMessages] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef(null)

  const loadHistory = useCallback(() => {
    setHistoryLoading(true)
    return api.get('/api/chat/history')
      .then((data) => setMessages(data.map((m) => ({ ...m, createdAt: m.created_at }))))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [])

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || streaming) return

    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))

    setMessages((prev) => [...prev, { role: 'user', text: userText }])
    setStreaming(true)
    setMessages((prev) => [...prev, { role: 'assistant', text: '', live: true }])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChat({
        message: userText,
        conversationHistory: history,
        context: {},
        signal: controller.signal,
        onChunk: (chunk) => {
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            updated[updated.length - 1] = { ...last, text: last.text + chunk }
            return updated
          })
        },
        onDone: ({ messageId }) => {
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1], live: false, id: messageId, createdAt: new Date().toISOString(),
            }
            return updated
          })
          setStreaming(false)
        },
      })
    } catch (err) {
      if (err?.name === 'AbortError') {
        // Stopped intentionally via the Stop button — keep whatever text
        // arrived so far, no error framing.
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], live: false }
          return updated
        })
      } else {
        const isStale = err?.message?.toLowerCase().includes('not found') || err?.message?.toLowerCase().includes('unauthorized')
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            text: isStale
              ? 'Your session has expired. Please log out and sign in again.'
              : 'Something went wrong. Please try again.',
            live: false,
            error: true,
            retryText: userText,
          }
          return updated
        })
      }
      setStreaming(false)
    } finally {
      abortRef.current = null
    }
  }, [messages, streaming])

  function stopStreaming() {
    abortRef.current?.abort()
  }

  // Drops the failed user+error-assistant pair, then resends the same text.
  function retry(userText) {
    setMessages((prev) => prev.slice(0, -2))
    sendMessage(userText)
  }

  async function clearChat() {
    await api.del('/api/chat/history')
    setMessages([])
  }

  async function submitFeedback(messageId, feedback) {
    const previous = messages.find((m) => m.id === messageId)?.feedback ?? null
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback } : m)))
    try {
      await api.patch(`/api/chat/history/${messageId}/feedback`, { feedback })
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback: previous } : m)))
    }
  }

  return {
    messages, historyLoading, streaming,
    loadHistory, sendMessage, stopStreaming, retry, clearChat, submitFeedback,
  }
}
