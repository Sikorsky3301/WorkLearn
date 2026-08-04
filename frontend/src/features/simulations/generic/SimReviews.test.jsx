import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SimReviews from './SimReviews'
import { PLACEHOLDER_REVIEWS } from './placeholderReviews'

describe('SimReviews', () => {
  it('renders nothing when rating is null', () => {
    const { container } = render(<SimReviews rating={null} ratingCount={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders every placeholder review', () => {
    render(<SimReviews rating={4.8} ratingCount={1247} />)
    for (const review of PLACEHOLDER_REVIEWS) {
      expect(screen.getByText(review.name)).toBeInTheDocument()
      expect(screen.getByText(review.relativeTime)).toBeInTheDocument()
      expect(screen.getByText(review.body)).toBeInTheDocument()
    }
  })

  it('shows the aggregate rating and rating count in the section header', () => {
    render(<SimReviews rating={4.8} ratingCount={1247} />)
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText('1,247 ratings')).toBeInTheDocument()
  })

  it('labels a simulation with no ratings yet instead of showing a zero count', () => {
    render(<SimReviews rating={0} ratingCount={0} />)
    expect(screen.getByText('New simulation')).toBeInTheDocument()
  })
})
