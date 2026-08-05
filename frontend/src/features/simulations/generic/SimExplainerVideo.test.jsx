import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SimExplainerVideo from './SimExplainerVideo'

describe('SimExplainerVideo', () => {
  it('renders nothing when the simulation has no video', () => {
    const { container } = render(<SimExplainerVideo title="Some Sim" company="Acme" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the play affordance without mounting the video up front', () => {
    const { container } = render(
      <SimExplainerVideo src="/videos/x.mp4" title="Frontend Sim" company="Enigma" />
    )
    expect(screen.getByText('Watch the walkthrough')).toBeInTheDocument()
    expect(screen.getByText(/A walkthrough of the work you'll do at Enigma/)).toBeInTheDocument()
    // Lazy by design — the multi-MB <video> must not be in the DOM until play.
    expect(container.querySelector('video')).toBeNull()
  })
})
