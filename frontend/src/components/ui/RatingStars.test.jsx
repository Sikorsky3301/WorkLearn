import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RatingStars from './RatingStars'

describe('RatingStars', () => {
  it('renders nothing when rating is null', () => {
    const { container } = render(<RatingStars rating={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the rating to one decimal place', () => {
    render(<RatingStars rating={4.5} count={120} />)
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('shows the learner count with locale thousands separators by default', () => {
    render(<RatingStars rating={4.5} count={12000} />)
    expect(screen.getByText('(12,000)')).toBeInTheDocument()
  })

  it('hides the count when showCount is false', () => {
    render(<RatingStars rating={4.5} count={12000} showCount={false} />)
    expect(screen.queryByText('(12,000)')).not.toBeInTheDocument()
  })

  it('hides the count when there are zero ratings, even with showCount true', () => {
    render(<RatingStars rating={0} count={0} />)
    expect(screen.queryByText('(0)')).not.toBeInTheDocument()
  })
})
