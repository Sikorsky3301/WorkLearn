import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SandboxOpeningOverlay } from '../simulations/engineering/task/SandboxLaunch'

// The cube loader shipped once without being visible anywhere, for two
// separate reasons, and neither would fail a build:
//
//   1. it was only mounted on the TASK page — but window.open moves focus to
//      the new tab, so that overlay paints on a background tab nobody is
//      looking at. The sandbox tab itself had no loader at all.
//   2. a markup change that dropped the `cube-loader` class would leave the
//      overlay rendering an empty box, silently.
//
// These pin the class and the copy. Where it is MOUNTED is the other half and
// is covered by the boot branch in SandboxWorkbenchPage.

describe('SandboxOpeningOverlay', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<SandboxOpeningOverlay open={false} taskTitle="Clean the Data" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the cube loader element when open', () => {
    const { container } = render(<SandboxOpeningOverlay open taskTitle="Clean the Data" />)
    expect(container.querySelector('.cube-loader')).not.toBeNull()
  })

  it('says what is happening and which task', () => {
    render(<SandboxOpeningOverlay open taskTitle="Clean the Data" />)
    expect(screen.getByText('Opening your sandbox')).toBeInTheDocument()
    expect(screen.getByText('Clean the Data')).toBeInTheDocument()
    expect(screen.getByText(/opens in a new tab/i)).toBeInTheDocument()
  })

  it('is announced to assistive technology', () => {
    render(<SandboxOpeningOverlay open taskTitle="Clean the Data" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('survives a missing task title', () => {
    const { container } = render(<SandboxOpeningOverlay open />)
    expect(container.querySelector('.cube-loader')).not.toBeNull()
  })
})
