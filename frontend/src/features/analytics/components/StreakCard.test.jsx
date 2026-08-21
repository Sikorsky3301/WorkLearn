import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StreakCard from './StreakCard'

describe('StreakCard', () => {
  it('reports a live streak counted today', () => {
    render(<StreakCard streak={{ current: 5, longest: 9, last_active: '2026-08-19', active_today: true }} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Counted today')).toBeInTheDocument()
    expect(screen.getByText('9 days')).toBeInTheDocument()
  })

  // The streak the old backend would have reported as 0: worked yesterday,
  // hasn't started today. It is still alive, and the card says how to keep it.
  it('keeps a streak alive when today has not been worked yet', () => {
    render(<StreakCard streak={{ current: 3, longest: 3, last_active: '2026-08-18', active_today: false }} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Keep it alive today')).toBeInTheDocument()
    expect(screen.getByText(/finish one to extend the streak/i)).toBeInTheDocument()
  })

  it('does not nag when there is no streak to lose', () => {
    render(<StreakCard streak={{ current: 0, longest: 0, last_active: null, active_today: false }} />)
    expect(screen.getByText('Not started')).toBeInTheDocument()
    expect(screen.queryByText(/extend the streak/i)).not.toBeInTheDocument()
  })

  it('survives a missing streak object', () => {
    render(<StreakCard />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
