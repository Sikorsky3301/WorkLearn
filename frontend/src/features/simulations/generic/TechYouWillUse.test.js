import { describe, it, expect } from 'vitest'
import { techForSkills } from './TechYouWillUse'

// A skills array is free text authored in the CMS, so the matching has to be
// forgiving without being wrong: a missed match costs a logo, but a WRONG
// match puts the React mark next to "Ruby on Rails" in front of a student
// deciding whether to enrol.

describe('techForSkills', () => {
  const logoFor = (skill) => techForSkills([skill])[0].logo

  it('matches a technology by name', () => {
    expect(logoFor('React')).toBe('/images/tech/react.svg')
    expect(logoFor('Python')).toBe('/images/tech/python.svg')
  })

  it('ignores case, spacing and punctuation', () => {
    // All three spellings occur in real `skills` arrays.
    expect(logoFor('react')).toBe('/images/tech/react.svg')
    expect(logoFor('React.js')).toBe('/images/tech/react.svg')
    expect(logoFor('node.js')).toBe('/images/tech/nodedotjs.svg')
  })

  it('keeps the + in C++ rather than normalising it away', () => {
    expect(logoFor('C++')).toBe('/images/tech/cplusplus.svg')
  })

  it('returns no logo for a practice rather than inventing one', () => {
    // These are real entries in frontend-dev-sim's skills array. A generic
    // icon on half the row would read as broken images, not as a distinction.
    expect(logoFor('Accessibility')).toBeNull()
    expect(logoFor('State Management')).toBeNull()
    expect(logoFor('Async Data')).toBeNull()
  })

  it('does not match a technology it merely contains', () => {
    // Guards against substring matching, which would put the React mark on
    // anything containing "react".
    expect(logoFor('Reacting to feedback')).toBeNull()
  })

  it('preserves the authored label, not the catalogue spelling', () => {
    // The chip shows what the CMS says; only the logo comes from the map.
    expect(techForSkills(['react'])[0].skill).toBe('react')
  })

  it('handles an empty or missing list', () => {
    expect(techForSkills([])).toEqual([])
    expect(techForSkills()).toEqual([])
  })
})
