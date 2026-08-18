import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScrolledPast } from './StickyOverviewBar'

// The bar must appear only when the hero has gone ABOVE the viewport — not
// when the sentinel simply isn't intersecting, which is also true on first
// paint when it sits below the fold. Getting that backwards shows the
// condensed header immediately, on top of the full one it exists to replace.

let observerCallback
let observed

function stubIntersectionObserver() {
  observed = []
  class FakeIO {
    constructor(cb) { observerCallback = cb }
    observe(node) { observed.push(node) }
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', FakeIO)
}

/** Fire the observer as the browser would. */
function report({ isIntersecting, top }) {
  act(() => observerCallback([{ isIntersecting, boundingClientRect: { top } }]))
}

afterEach(() => {
  vi.unstubAllGlobals()
  observerCallback = undefined
})

describe('useScrolledPast', () => {
  it('starts false and observes the node it is given', () => {
    stubIntersectionObserver()
    const node = {}
    const { result } = renderHook(() => useScrolledPast(node))
    expect(result.current).toBe(false)
    expect(observed).toEqual([node])
  })

  it('is true once the sentinel has left above the viewport', () => {
    stubIntersectionObserver()
    const { result } = renderHook(() => useScrolledPast({}))
    report({ isIntersecting: false, top: -400 })
    expect(result.current).toBe(true)
  })

  it('stays false while the sentinel is below the fold', () => {
    stubIntersectionObserver()
    const { result } = renderHook(() => useScrolledPast({}))
    // First paint on a tall hero: not intersecting, but BELOW — showing the
    // bar here would stack it on the hero it replaces.
    report({ isIntersecting: false, top: 1200 })
    expect(result.current).toBe(false)
  })

  it('goes false again when scrolled back to the top', () => {
    stubIntersectionObserver()
    const { result } = renderHook(() => useScrolledPast({}))
    report({ isIntersecting: false, top: -400 })
    expect(result.current).toBe(true)
    report({ isIntersecting: true, top: 20 })
    expect(result.current).toBe(false)
  })

  it('does nothing without a node, and survives a missing IntersectionObserver', () => {
    stubIntersectionObserver()
    const { result } = renderHook(() => useScrolledPast(null))
    expect(result.current).toBe(false)

    vi.stubGlobal('IntersectionObserver', undefined)
    const { result: r2 } = renderHook(() => useScrolledPast({}))
    expect(r2.current).toBe(false)
  })
})
