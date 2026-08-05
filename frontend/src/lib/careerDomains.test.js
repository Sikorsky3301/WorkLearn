import { describe, it, expect } from 'vitest'
import { CAREER_DOMAINS, findDomain } from './careerDomains'
import { resolveDomainIcon } from './domainIcons'
import { domainDescription } from './domainMeta'

describe('careerDomains', () => {
  it('offers substantially more than the published-simulation domains', () => {
    // The old picker derived its list from useSimulations() — 3 options.
    expect(CAREER_DOMAINS.length).toBeGreaterThanOrEqual(12)
  })

  it('has unique keys and labels, and every entry is fully populated', () => {
    const keys = CAREER_DOMAINS.map((d) => d.key)
    const labels = CAREER_DOMAINS.map((d) => d.label)
    expect(new Set(keys).size).toBe(keys.length)
    expect(new Set(labels).size).toBe(labels.length)
    for (const d of CAREER_DOMAINS) {
      expect(d.label).toBeTruthy()
      expect(d.description).toBeTruthy()
      expect(d.Icon).toBeTruthy()
    }
  })

  it('covers the domains of the currently published simulations', () => {
    for (const label of ['Data Analytics', 'Engineering', 'Sales']) {
      expect(findDomain(label)).toBeDefined()
    }
  })

  it('looks up case-insensitively and tolerates missing input', () => {
    expect(findDomain('data analytics')?.label).toBe('Data Analytics')
    expect(findDomain(undefined)).toBeUndefined()
    expect(findDomain('Not A Real Domain')).toBeUndefined()
  })
})

describe('domain resolvers consult the catalogue', () => {
  it('gives curated domains their own icon and blurb, not the generic fallback', () => {
    // These 6 previously matched none of the substring rules and all fell
    // through to the generic Layers icon + "Explore real-world X" blurb.
    for (const label of ['Product Management', 'Marketing', 'Finance', 'HR & Recruiting', 'Healthcare Administration', 'Customer Support']) {
      expect(resolveDomainIcon(label)).toBe(findDomain(label).Icon)
      expect(domainDescription(label)).toBe(findDomain(label).description)
      expect(domainDescription(label)).not.toContain('Explore real-world')
    }
  })

  it('still falls back for free-text CMS domains outside the catalogue', () => {
    expect(resolveDomainIcon('Frontend Developer')).toBeTruthy()
    expect(domainDescription('Underwater Basket Weaving')).toContain('Explore real-world')
  })
})
