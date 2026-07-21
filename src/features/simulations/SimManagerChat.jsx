import { useEffect, useRef, useState } from 'react'
import ManagerChatWidgetBase from './ManagerChatWidgetBase'
import { getGenericManagerReply, getGenericGreeting } from './genericManagerChatKnowledge'

let uidSeq = 0
const uid = (prefix) => `${prefix}_${Date.now()}_${(uidSeq += 1)}`

/** Self-contained manager chat widget for job simulations that don't have
 * their own zustand store (da-job-sim, frontend-dev-sim) — messages live in
 * local component state rather than a persisted store, same as the rest of
 * each workspace's local UI state. Replies are rule-based (see
 * genericManagerChatKnowledge.js) — no AI/LLM call is made. UI shell is
 * shared with sales-crm-sim via ManagerChatWidgetBase. */
export default function SimManagerChat({ manager, company, task, taskKey }) {
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const greetedKeysRef = useRef(new Set())
  const replyTimerRef = useRef(null)

  // The manager introduces each task's brief the first time it's entered.
  useEffect(() => {
    if (greetedKeysRef.current.has(taskKey)) return
    const isFirstTask = greetedKeysRef.current.size === 0
    greetedKeysRef.current.add(taskKey)
    setMessages((prev) => [...prev, { id: uid('mmsg'), role: 'manager', text: getGenericGreeting(task, { isFirstTask }) }])
  }, [taskKey, task])

  useEffect(() => () => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current)
  }, [])

  function handleSend(text) {
    setMessages((prev) => [...prev, { id: uid('mmsg'), role: 'user', text }])
    setTyping(true)
    replyTimerRef.current = setTimeout(() => {
      setMessages((prev) => [...prev, { id: uid('mmsg'), role: 'manager', text: getGenericManagerReply(text, task) }])
      setTyping(false)
    }, 550 + Math.random() * 350)
  }

  return (
    <ManagerChatWidgetBase
      manager={manager}
      company={company}
      messages={messages}
      typing={typing}
      onSend={handleSend}
    />
  )
}
