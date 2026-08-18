import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { TECHNOLOGIES } from './technologies'

// These logos are referenced by URL, not imported — which is what lets a new
// one be added by dropping a file in public/images/tech/, and also what means
// a typo'd filename fails silently as a broken image at the top of the landing
// page rather than at build time. This is the check that would have caught it.

describe('TECHNOLOGIES', () => {
  it('points every entry at a file that exists', () => {
    const missing = TECHNOLOGIES.filter(
      ({ logo }) => !existsSync(join(process.cwd(), 'public', logo)),
    )
    expect(missing.map((t) => t.logo)).toEqual([])
  })

  it('has no duplicate keys or names', () => {
    const keys = TECHNOLOGIES.map((t) => t.key)
    const names = TECHNOLOGIES.map((t) => t.name)
    expect(new Set(keys).size).toBe(keys.length)
    // The marquee keys its list on `name`, so a duplicate would collide.
    expect(new Set(names).size).toBe(names.length)
  })

  it('spells the display names as brands, not as filenames', () => {
    // The slug is a filename; the caption is what a person reads.
    const byKey = Object.fromEntries(TECHNOLOGIES.map((t) => [t.key, t.name]))
    expect(byKey.nodedotjs).toBe('Node.js')
    expect(byKey.cplusplus).toBe('C++')
    expect(byKey.huggingface).toBe('Hugging Face')
    expect(byKey.rubyonrails).toBe('Ruby on Rails')
  })
})
