import { Wrench } from 'lucide-react'
import { TECHNOLOGIES } from '../../marketing/data/technologies'

// The tools and skills a simulation actually puts in your hands.
//
// Driven by `simulation.skills`, which every simulation already has, so this
// works for a CMS-authored sim without anyone filling in a new field. Where a
// skill names a technology we happen to have a mark for, the mark is shown;
// where it names a practice ("Accessibility", "State Management") there is no
// logo and none is invented — a generic icon on half the row would look like
// missing images rather than a deliberate distinction.
//
// The logo set is the one already in public/images/tech/ for the landing page
// strip. Matching is on a normalised name, so "React", "react" and "React.js"
// all resolve, and an unmatched skill degrades to a plain chip.

const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9+]/g, '')

// Built once from the shared catalogue, plus the aliases a `skills` array
// realistically contains. Keys are normalised.
const LOGO_BY_NAME = (() => {
  const map = {}
  for (const t of TECHNOLOGIES) map[normalise(t.name)] = t
  const alias = {
    reactjs: 'React', nodejs: 'Node.js', node: 'Node.js',
    js: 'JavaScript', es6: 'JavaScript', typescript: 'JavaScript',
    postgres: 'PostgreSQL', sql: 'PostgreSQL',
    cpp: 'C++', 'c++': 'C++',
    git: 'GitHub', rails: 'Ruby on Rails', ruby: 'Ruby on Rails',
    shell: 'Bash', bash: 'Bash',
    pytorch: 'PyTorch', tensorflow: 'TensorFlow',
  }
  for (const [key, name] of Object.entries(alias)) {
    const found = TECHNOLOGIES.find((t) => t.name === name)
    if (found) map[normalise(key)] = found
  }
  return map
})()

export function techForSkills(skills = []) {
  return skills.map((skill) => ({
    skill,
    logo: LOGO_BY_NAME[normalise(skill)]?.logo ?? null,
  }))
}

export default function TechYouWillUse({ skills = [], hasCodeSandbox }) {
  if (!skills.length) return null
  const items = techForSkills(skills)
  const withLogos = items.filter((i) => i.logo)
  const rest = items.filter((i) => !i.logo)

  return (
    <section className="mb-12">
      <h2 className="mb-1.5 flex items-center gap-2.5 font-display text-xl font-extrabold text-on-surface">
        <span className="h-4 w-1 shrink-0 rounded-full bg-primary" />
        Technology you&apos;ll use
      </h2>
      <p className="mb-5 text-sm leading-relaxed text-on-surface-variant">
        {hasCodeSandbox
          ? 'You write real code against these — every task is graded by running it, not by reading it.'
          : 'The tools and practices this simulation puts in your hands.'}
      </p>

      {withLogos.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2.5">
          {withLogos.map(({ skill, logo }) => (
            <span
              key={skill}
              className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-sm"
            >
              {/* alt="" — the visible label beside it is the accessible name,
                  so a filled alt would have it announced twice. */}
              <img src={logo} alt="" className="h-5 w-5 shrink-0 object-contain" />
              <span className="text-sm font-bold text-on-surface">{skill}</span>
            </span>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rest.map(({ skill }) => (
            <span
              key={skill}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-low px-3.5 py-2 text-sm font-semibold text-on-surface-variant"
            >
              <Wrench className="h-3.5 w-3.5 shrink-0 opacity-60" />
              {skill}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
