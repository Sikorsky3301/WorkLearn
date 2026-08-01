import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins plain class strings', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 0, 'b')).toBe('a b')
  })

  it('resolves conflicting Tailwind utilities to the last one wins', () => {
    // The reason this helper exists at all: plain clsx would emit both
    // classes and let CSS source order decide, which silently breaks when a
    // component's own class list happens to be declared after the caller's
    // override in the stylesheet.
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('lets a later conditional override an earlier fixed class', () => {
    const active = true
    expect(cn('text-on-surface-variant', active && 'text-on-surface')).toBe('text-on-surface')
  })
})
