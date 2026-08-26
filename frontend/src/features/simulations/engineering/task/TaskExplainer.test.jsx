import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TaskExplainer, { TaskReference } from './TaskExplainer'

// The redesign's whole claim is "same information, less on screen at once".
// These pin both halves of that: the reading path is always visible, the
// reference material is present but collapsed, and nothing was dropped in the
// split between the two exports.

const explainer = {
  situation: 'Enigma is relaunching its marketing site.',
  outcome: 'One HTML file that renders a complete page.',
  preview: '| Enigma   Home  Features |',
  concepts: [
    { term: 'Semantic HTML', plain: 'Tags that say what a thing is.', why: 'Screen readers use them.' },
    { term: 'Flexbox', plain: 'A one-axis layout tool.', why: 'It is built for rows.' },
  ],
  steps: [
    { title: 'Structure the page', plain: 'Use header, nav, main and footer.', code: '<header></header>', deeper: 'Landmarks map to ARIA roles.' },
    { title: 'Lay out the hero', plain: 'Flexbox or Grid.', deeper: 'Grid is more machinery than this needs.' },
  ],
  contract: [{ name: 'submission.html', must: 'A single file' }],
  mistakes: ['Using a div with class="header".'],
  further: ['MDN: semantic HTML'],
}

describe('TaskExplainer — the reading path', () => {
  it('renders nothing without an explainer', () => {
    const { container } = render(<TaskExplainer />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the brief and the outcome without any interaction', () => {
    render(<TaskExplainer explainer={explainer} />)
    expect(screen.getByText(/Enigma is relaunching/)).toBeInTheDocument()
    expect(screen.getByText(/One HTML file/)).toBeInTheDocument()
    expect(screen.getByText('What finished looks like')).toBeInTheDocument()
  })

  it('shows every step, numbered, without any interaction', () => {
    render(<TaskExplainer explainer={explainer} />)
    expect(screen.getByText('Structure the page')).toBeInTheDocument()
    expect(screen.getByText('Lay out the hero')).toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText(/How to build it · 2 steps/)).toBeInTheDocument()
  })

  // The two reading levels are the point of the authoring contract. `plain` is
  // always there; `deeper` must be reachable but must not be shouting.
  it('keeps the deeper note behind a toggle', () => {
    render(<TaskExplainer explainer={explainer} />)
    expect(screen.getByText('Use header, nav, main and footer.')).toBeInTheDocument()
    expect(screen.queryByText(/Landmarks map to ARIA roles/)).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByText('Why it works this way')[0])
    expect(screen.getByText(/Landmarks map to ARIA roles/)).toBeInTheDocument()
  })

  // The reference material moved to its own export. If the split ever leaks it
  // back in, the page renders it twice.
  it('does not render the reference material itself', () => {
    render(<TaskExplainer explainer={explainer} />)
    expect(screen.queryByText('New ideas in this task')).not.toBeInTheDocument()
    expect(screen.queryByText('Where this usually goes wrong')).not.toBeInTheDocument()
  })
})

describe('TaskReference — what you consult', () => {
  it('renders nothing when there is nothing to consult', () => {
    const { container } = render(
      <TaskReference explainer={{ steps: [], concepts: [], contract: [], mistakes: [], further: [] }} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('lists every section with a count, collapsed', () => {
    render(<TaskReference explainer={explainer} />)
    for (const title of [
      'New ideas in this task',
      'Exact names your code must use',
      'Where this usually goes wrong',
      'If you want to go further',
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
    // The count is what lets somebody decide whether to open a section
    // without opening it.
    expect(screen.getByText('2')).toBeInTheDocument()

    // Collapsed: the contents are not in the document yet.
    expect(screen.queryByText('Semantic HTML')).not.toBeInTheDocument()
    expect(screen.queryByText(/class="header"/)).not.toBeInTheDocument()
  })

  it('opens a section on click', () => {
    render(<TaskReference explainer={explainer} />)
    fireEvent.click(screen.getByText('New ideas in this task'))
    expect(screen.getByText('Semantic HTML')).toBeInTheDocument()
    expect(screen.getByText('Tags that say what a thing is.')).toBeInTheDocument()
    expect(screen.getByText('Screen readers use them.')).toBeInTheDocument()
  })

  it('keeps sections independent', () => {
    render(<TaskReference explainer={explainer} />)
    fireEvent.click(screen.getByText('Where this usually goes wrong'))
    expect(screen.getByText(/class="header"/)).toBeInTheDocument()
    // Opening one must not open the others.
    expect(screen.queryByText('Semantic HTML')).not.toBeInTheDocument()
  })

  it('together the two exports still carry every authored field', () => {
    const { container: a } = render(<TaskExplainer explainer={explainer} />)
    const { container: b } = render(<TaskReference explainer={explainer} />)
    // Open everything in the reference so its contents are in the DOM.
    for (const title of [
      'New ideas in this task',
      'Exact names your code must use',
      'Where this usually goes wrong',
      'If you want to go further',
    ]) {
      fireEvent.click(screen.getByText(title))
    }
    const text = a.textContent + b.textContent
    expect(text).toContain(explainer.situation)
    expect(text).toContain(explainer.outcome)
    expect(text).toContain(explainer.preview)
    expect(text).toContain('Semantic HTML')
    expect(text).toContain('submission.html')
    expect(text).toContain(explainer.mistakes[0])
    expect(text).toContain(explainer.further[0])
    for (const step of explainer.steps) expect(text).toContain(step.title)
  })
})
