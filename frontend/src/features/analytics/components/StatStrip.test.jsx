import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatStrip from './StatStrip'

const stat = (over = {}) => ({
  key: 'xp',
  label: 'XP earned',
  unit: 'XP',
  value: 500,
  previous: 200,
  delta: 300,
  direction: 'up',
  comparison: 'vs previous 7 days',
  ...over,
})

describe('StatStrip', () => {
  it('shows the value and its real delta', () => {
    render(<StatStrip stats={[stat()]} />)
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('+300')).toBeInTheDocument()
    expect(screen.getByText('vs previous 7 days')).toBeInTheDocument()
  })

  // The bug this replaced: `up` was hardcoded true, so a decline was drawn as
  // a green rise, and the delta beside the arrow was never sent at all.
  it('renders a decline as a decline', () => {
    render(<StatStrip stats={[stat({ value: 100, previous: 400, delta: -300, direction: 'down' })]} />)
    expect(screen.getByText('-300')).toBeInTheDocument()
  })

  it('draws no delta at all when there is nothing to compare against', () => {
    render(<StatStrip stats={[stat({ delta: null, direction: 'flat', comparison: null })]} />)
    expect(screen.queryByText(/^[+-]/)).not.toBeInTheDocument()
    expect(screen.getByText('Over the whole period')).toBeInTheDocument()
  })

  it('surfaces an empty comparison window rather than implying no change', () => {
    render(<StatStrip stats={[stat({
      delta: null, direction: 'flat', previous: null,
      comparison: 'Nothing to compare in the previous 7 days',
    })]} />)
    expect(screen.getByText('Nothing to compare in the previous 7 days')).toBeInTheDocument()
  })

  // A student with no graded tasks has no average. Zero would read as a fail.
  it('shows a dash, not a zero, for a missing average', () => {
    render(<StatStrip stats={[stat({
      key: 'avg_score', label: 'Average score', unit: '/100',
      value: null, previous: null, delta: null, direction: 'flat', comparison: null,
    })]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.getByText('No graded tasks yet')).toBeInTheDocument()
  })
})
