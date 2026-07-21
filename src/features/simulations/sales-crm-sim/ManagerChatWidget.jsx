import { useEffect, useRef, useState } from 'react'
import { useCrmSimStore } from './store/useCrmSimStore'
import { SIM_META } from './engine/simulationConfig'
import ManagerChatWidgetBase from '../ManagerChatWidgetBase'

/** Manager chat for Derek Holt, wired to useCrmSimStore. Replies are
 * rule-based (see data/managerChatKnowledge.js) — no AI/LLM call is made
 * here, unlike the AI-customer chats in stages 4/6. Scoped to this
 * simulation only; mounted from CrmSimShell. UI shell is shared with the
 * other job simulations via ManagerChatWidgetBase. */
export default function ManagerChatWidget() {
  const messages = useCrmSimStore((s) => s.managerChat.messages)
  const currentStageIndex = useCrmSimStore((s) => s.currentStageIndex)
  const sendManagerMessage = useCrmSimStore((s) => s.sendManagerMessage)
  const appendManagerReply = useCrmSimStore((s) => s.appendManagerReply)
  const greetStageForManagerChat = useCrmSimStore((s) => s.greetStageForManagerChat)

  const [typing, setTyping] = useState(false)
  const replyTimerRef = useRef(null)

  // Derek introduces each stage's task the first time it's entered.
  useEffect(() => {
    greetStageForManagerChat(currentStageIndex)
  }, [currentStageIndex, greetStageForManagerChat])

  useEffect(() => () => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current)
  }, [])

  function handleSend(text) {
    sendManagerMessage(text)
    setTyping(true)
    replyTimerRef.current = setTimeout(() => {
      appendManagerReply(text)
      setTyping(false)
    }, 550 + Math.random() * 350)
  }

  return (
    <ManagerChatWidgetBase
      manager={{ name: SIM_META.manager.name, role: SIM_META.manager.role, photo: SIM_META.manager.photo, initials: SIM_META.manager.avatar }}
      company={SIM_META.company}
      messages={messages}
      typing={typing}
      onSend={handleSend}
    />
  )
}
