import { useEffect, useState } from 'react'

// The screen the Sim Builder tab shows while it opens.
//
// WHY A FLOOR AND A CEILING
//
// The builder needs three things before it can render anything useful: the
// simulation with all its tasks, the grader/dataset/skill catalogue, and its
// own chunk. On a warm cache that can land in under 200ms, and a loader that
// appears and vanishes inside 200ms reads as a flicker — worse than no loader,
// because the eye registers something went wrong without registering what.
//
// So: MIN_MS is a floor the loader stays up for even when everything is
// already there, and `ready` releases it after that. There is no timeout
// ceiling here on purpose — unlike a container boot, nothing is being waited
// on that can hang; if the queries fail the builder renders its own error
// state, and this screen simply gets out of the way.

const MIN_MS = 1100

export default function StudioBoot({ ready, title = 'Sim Builder', detail = 'Loading your simulation' }) {
  const [floorPassed, setFloorPassed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setFloorPassed(true), MIN_MS)
    return () => clearTimeout(t)
  }, [])

  if (ready && floorPassed) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-[#0f1720] text-white"
    >
      <div className="studio-loader" aria-hidden="true" />
      <div className="text-center">
        <p className="font-display text-lg font-extrabold tracking-tight">{title}</p>
        <p className="mt-1.5 text-sm text-white/55">{detail}</p>
      </div>
      <span className="sr-only">{detail}</span>
    </div>
  )
}
