import { Check } from 'lucide-react'

/** "What you'll learn" checklist — derived from the simulation's own real
 * `skills` array (no fabricated content, no backend change), phrased as a
 * short outcome line per skill so a bare tag list ("SQL", "Python") reads
 * like a course's learning outcomes instead of a chip cloud. Heading sits
 * inside the bordered box so the whole thing reads as one distinct block. */
export default function WhatYoullLearn({ skills }) {
  if (!skills?.length) return null

  return (
    <div className="border border-border rounded-xl p-6">
      <h2 className="text-lg font-bold text-on-surface mb-5">What you'll learn</h2>
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
        {skills.map((skill) => (
          <div key={skill} className="flex items-start gap-3 text-sm text-on-surface-variant">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              Apply <span className="font-semibold text-on-surface">{skill}</span> in a real, hands-on work simulation
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
