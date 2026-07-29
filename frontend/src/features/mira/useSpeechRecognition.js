import { useState, useRef, useCallback, useEffect } from 'react'

// Thin wrapper around the browser's native SpeechRecognition API (Chrome/Edge
// only). Purely client-side — no backend required. Callers should treat
// `supported: false` as "hide the mic button," not an error.
export function useSpeechRecognition({ onResult } = {}) {
  const SpeechRecognitionImpl = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null
  const supported = !!SpeechRecognitionImpl

  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const start = useCallback(() => {
    if (!supported || listening) return
    const recognition = new SpeechRecognitionImpl()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript
      }
      if (finalText) onResult?.(finalText)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [supported, listening, onResult, SpeechRecognitionImpl])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { supported, listening, start, stop }
}
