import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReadinessChart from './ReadinessChart'

const history = [
  { date: null, readiness: 0, label: 'Start' },
  { date: '2026-08-12', readiness: 20, label: 'Landing Hero Section' },
  { date: '2026-08-17', readiness: 86, label: 'Task Manager App' },
]

describe('ReadinessChart', () => {
  it('prompts instead of drawing an empty axis when there is no history', () => {
    render(<ReadinessChart history={[]} currentReadiness={0} roleLabel="Junior Frontend Developer" />)
    expect(screen.getByText(/first graded task will start this chart/i)).toBeInTheDocument()
  })

  it('summarises the series it drew', () => {
    render(<ReadinessChart history={history} currentReadiness={86} roleLabel="Junior Frontend Developer" />)
    expect(screen.getByText('Latest 86%')).toBeInTheDocument()
    expect(screen.getByText(/2 graded tasks/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /rose to 86%/i })).toBeInTheDocument()
  })

  // The replay uses today's award values, so it can legitimately disagree with
  // the stored balance. The card must say so rather than let two different
  // numbers sit on the page unexplained.
  it('explains the gap when the replay and the stored balance disagree', () => {
    render(<ReadinessChart history={history} currentReadiness={70} roleLabel="Junior Frontend Developer" />)
    expect(screen.getByText(/aren.t backfilled/i)).toBeInTheDocument()
  })

  it('stays quiet when they agree', () => {
    render(<ReadinessChart history={history} currentReadiness={86} roleLabel="Junior Frontend Developer" />)
    expect(screen.queryByText(/aren.t backfilled/i)).not.toBeInTheDocument()
  })
})
