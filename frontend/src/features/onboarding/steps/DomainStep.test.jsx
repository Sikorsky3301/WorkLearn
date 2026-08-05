import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DomainStep from './DomainStep'
import { CAREER_DOMAINS } from '../../../lib/careerDomains'

describe('DomainStep', () => {
  it('renders the full curated catalogue regardless of published simulations', () => {
    render(<DomainStep selected={null} onSelect={() => {}} />)
    for (const d of CAREER_DOMAINS) {
      expect(screen.getByText(d.label)).toBeInTheDocument()
    }
  })

  it('reports the selected domain by its label (what preferred_domain stores)', () => {
    const onSelect = vi.fn()
    render(<DomainStep selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Product Management'))
    expect(onSelect).toHaveBeenCalledWith('Product Management')
  })

  it('marks the selected domain as pressed', () => {
    render(<DomainStep selected="Marketing" onSelect={() => {}} />)
    const selected = screen.getByText('Marketing').closest('button')
    expect(selected).toHaveAttribute('aria-pressed', 'true')
  })
})
