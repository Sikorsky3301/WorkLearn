import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScroll, useTransform } from 'motion/react'
import { GoogleGeminiEffect } from '../../components/ui/google-gemini-effect'

export default function MiraGeminiSection() {
  const navigate = useNavigate()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2])
  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2])
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2])
  const pathLengthFourth = useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2])
  const pathLengthFifth = useTransform(scrollYProgress, [0, 0.8], [0, 1.2])

  return (
    <div ref={ref} className="h-[200vh] bg-white border border-border w-full rounded-2xl relative pt-40 overflow-clip mb-10">
      <GoogleGeminiEffect
        title="MIRA"
        description="Configure your interview type and difficulty, answer real AI-driven questions one at a time, and walk away with structured feedback on communication, technical accuracy, and confidence."
        cta={
          <button
            onClick={() => navigate('/mira/setup')}
            className="btn-primary rounded-full px-5 py-2.5 text-sm font-bold cursor-pointer"
          >
            Start Mock Interview →
          </button>
        }
        pathLengths={[pathLengthFirst, pathLengthSecond, pathLengthThird, pathLengthFourth, pathLengthFifth]}
      />
    </div>
  )
}
