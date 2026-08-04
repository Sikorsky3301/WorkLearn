import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from './Avatar'

describe('Avatar', () => {
  it('renders an image when src is provided', () => {
    render(<Avatar src="/photo.jpg" alt="Jane" initials="JD" />)
    const img = screen.getByRole('img', { name: 'Jane' })
    expect(img).toHaveAttribute('src', '/photo.jpg')
  })

  it('renders initials when src is absent', () => {
    render(<Avatar initials="JD" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders initials when src is null', () => {
    render(<Avatar src={null} initials="MW" />)
    expect(screen.getByText('MW')).toBeInTheDocument()
  })

  it('applies the size-appropriate box class', () => {
    const { container } = render(<Avatar initials="AB" size="lg" />)
    expect(container.firstChild).toHaveClass('h-11', 'w-11')
  })
})
