import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WhatYoullLearn from './WhatYoullLearn'

describe('WhatYoullLearn', () => {
  it('renders nothing when skills is empty', () => {
    const { container } = render(<WhatYoullLearn skills={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when skills is absent', () => {
    const { container } = render(<WhatYoullLearn />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders one line per skill', () => {
    render(<WhatYoullLearn skills={['SQL', 'Python', 'Analytics']} />)
    expect(screen.getByText('SQL')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })
})
