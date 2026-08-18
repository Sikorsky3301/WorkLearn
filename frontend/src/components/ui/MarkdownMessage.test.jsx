import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarkdownMessage from './MarkdownMessage'

// The bug this guards: react-markdown alone has no GFM, so a pipe table
// rendered as literal text — one unreadable wrapped line of `|---|---|`.
// remark-gfm is what fixes it, and it is easy to drop when someone
// "simplifies" the imports later.

describe('MarkdownMessage', () => {
  it('renders a GFM table as a real table, not as pipes', () => {
    render(<MarkdownMessage>{`
| Skill | Target |
|-------|--------|
| SQL   | Window functions |
`}</MarkdownMessage>)

    expect(screen.getByRole('table')).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Skill' })).toBeTruthy()
    expect(screen.getByRole('cell', { name: 'Window functions' })).toBeTruthy()
    // The literal pipe row must not survive as text.
    expect(document.body.textContent).not.toContain('|---')
  })

  it('gives the table its own scroll container', () => {
    // Without this a wide table pushes the chat bubble past its column.
    const { container } = render(<MarkdownMessage>{'| a | b |\n|---|---|\n| 1 | 2 |'}</MarkdownMessage>)
    expect(container.querySelector('.overflow-x-auto table')).toBeTruthy()
  })

  it('still renders ordinary markdown', () => {
    render(<MarkdownMessage>{'**bold** and `code`\n\n- one\n- two'}</MarkdownMessage>)
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByText('code').tagName).toBe('CODE')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('survives empty text mid-stream', () => {
    // Streaming starts with '' — react-markdown renders nothing for it, which
    // collapses the bubble; the component substitutes a space.
    const { container } = render(<MarkdownMessage>{''}</MarkdownMessage>)
    expect(container.firstChild).toBeTruthy()
  })
})
