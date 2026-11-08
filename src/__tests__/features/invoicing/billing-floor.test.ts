import { describe, it, expect } from 'vitest'
import { applyBillingFloor } from '@/features/invoicing/utils'

// The floor decides how much the client is actually billed, so the
// boundary matters as much as the happy path: billing one parcel too
// many is an overcharge on a legal document.
describe('applyBillingFloor', () => {
  it('bills the real quantity when it clears the floor', () => {
    expect(applyBillingFloor('50', 40)).toEqual({ billed: 50, raised: false })
  })

  it('raises up to the floor and says so', () => {
    expect(applyBillingFloor('30', 40)).toEqual({ billed: 40, raised: true })
  })

  it('does not raise a quantity sitting exactly on the floor', () => {
    expect(applyBillingFloor('40', 40)).toEqual({ billed: 40, raised: false })
  })

  it('bills as entered when the client has no floor', () => {
    expect(applyBillingFloor('3', null)).toEqual({ billed: 3, raised: false })
  })

  it('accepts the French decimal comma', () => {
    expect(applyBillingFloor('3,5', null)).toEqual({ billed: 3.5, raised: false })
  })

  it('treats an unusable quantity as nothing billable', () => {
    expect(applyBillingFloor('', 40)).toEqual({ billed: 0, raised: false })
    expect(applyBillingFloor('abc', 40)).toEqual({ billed: 0, raised: false })
    expect(applyBillingFloor('0', 40)).toEqual({ billed: 0, raised: false })
    expect(applyBillingFloor('-5', 40)).toEqual({ billed: 0, raised: false })
  })
})
