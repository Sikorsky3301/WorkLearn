import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SimPricing from './SimPricing'
import { pricingFor, formatPrice, discountPercent } from './placeholderPricing'

describe('placeholderPricing', () => {
  it('falls back to default pricing for an unknown simulation', () => {
    expect(pricingFor('some-brand-new-sim')).toEqual(pricingFor('__missing__'))
  })

  it('formats prices with Indian digit grouping', () => {
    expect(formatPrice(3199)).toBe('₹3,199')
  })

  it('computes the discount percentage', () => {
    expect(discountPercent({ price: 499, listPrice: 3199 })).toBe(84)
  })

  it('reports no discount when the list price does not exceed the price', () => {
    expect(discountPercent({ price: 499, listPrice: 499 })).toBe(0)
    expect(discountPercent({ price: 499, listPrice: null })).toBe(0)
  })
})

describe('SimPricing', () => {
  it('shows the price, struck list price, and saving', () => {
    render(<SimPricing slug="da-job-sim" />)
    expect(screen.getByText('₹499')).toBeInTheDocument()
    expect(screen.getByText('₹3,199')).toBeInTheDocument()
    expect(screen.getByText('84% off')).toBeInTheDocument()
  })

  it('renders a price for a simulation with no explicit entry', () => {
    render(<SimPricing slug="not-a-real-sim" />)
    expect(screen.getByText('₹499')).toBeInTheDocument()
  })
})
