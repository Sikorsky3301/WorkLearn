import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SkillMatrix from './SkillMatrix'

const skill = (over = {}) => ({
  skill: 'Component Design',
  skill_key: 'component_design',
  category: 'Cognitive',
  current: 10,
  required: 40,
  status: 'gap',
  points_available: 25,
  sources: [
    {
      simulation_slug: 'frontend-dev-sim',
      simulation_title: 'Frontend Developer Job Simulation',
      task_index: 7,
      task_title: 'Your First React Component',
      week: 3,
      points: 15,
      completed: true,
    },
    {
      simulation_slug: 'frontend-dev-sim',
      simulation_title: 'Frontend Developer Job Simulation',
      task_index: 8,
      task_title: 'Controlled Form Component',
      week: 3,
      points: 25,
      completed: false,
    },
  ],
  ...over,
})

const base = {
  filter: 'all',
  onFilter: () => {},
  counts: { all: 1, gap: 1, met: 0 },
  roleLabel: 'Junior Frontend Developer',
  onOpenTask: () => {},
}

describe('SkillMatrix', () => {
  it('shows the score against the benchmark and the shortfall', () => {
    render(<SkillMatrix {...base} skills={[skill()]} />)
    expect(screen.getByText('Component Design')).toBeInTheDocument()
    expect(screen.getByText('/40')).toBeInTheDocument()
    expect(screen.getByText('−30')).toBeInTheDocument()
  })

  it('marks a met skill with a surplus rather than a shortfall', () => {
    render(<SkillMatrix {...base} skills={[skill({ current: 55, status: 'met' })]} />)
    expect(screen.getByText('+15')).toBeInTheDocument()
  })

  // The point of the redesign: a gap is only actionable if you can see the
  // work that closes it. These rows are collapsed until asked for.
  it('hides the source tasks until the row is expanded', () => {
    render(<SkillMatrix {...base} skills={[skill()]} />)
    expect(screen.queryByText('Your First React Component')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { expanded: false }))

    expect(screen.getByText('Your First React Component')).toBeInTheDocument()
    expect(screen.getByText('Controlled Form Component')).toBeInTheDocument()
  })

  it('separates points already earned from points still available', () => {
    render(<SkillMatrix {...base} skills={[skill()]} />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByText('+15 earned')).toBeInTheDocument()
    expect(screen.getByText('+25')).toBeInTheDocument()
    expect(screen.getByText('25 still available')).toBeInTheDocument()
  })

  it('navigates to the task that awards the points', () => {
    const onOpenTask = vi.fn()
    render(<SkillMatrix {...base} skills={[skill()]} onOpenTask={onOpenTask} />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    fireEvent.click(screen.getByText('Controlled Form Component'))
    expect(onOpenTask).toHaveBeenCalledWith(
      expect.objectContaining({ simulation_slug: 'frontend-dev-sim', task_index: 8 }),
    )
  })

  it('says so plainly when no task on the platform awards a skill', () => {
    render(<SkillMatrix {...base} skills={[skill({ sources: [] })]} />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByText(/no task on the platform currently awards/i)).toBeInTheDocument()
  })

  it('explains an empty gap filter instead of rendering a blank panel', () => {
    render(<SkillMatrix {...base} skills={[]} filter="gap" counts={{ all: 7, gap: 0, met: 7 }} />)
    expect(screen.getByText(/no gaps left/i)).toBeInTheDocument()
  })
})
