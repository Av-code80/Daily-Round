import { describe, it, expect } from 'vitest'
import { parseAmountToCents, sumLineTotalsCents, dbAmountToCents } from '@/features/invoicing/utils'

describe('money', () => {
  it('accepts the French comma', () => {
    expect(parseAmountToCents('65,00')).toBe(6500)
    expect(parseAmountToCents('65.00')).toBe(6500)
  })

  it('rejects more than two decimals', () => {
    expect(parseAmountToCents('65,001')).toBeNull()
  })

  it('does not drift where floats would', () => {
    // 0.1 + 0.2 !== 0.3 in float arithmetic
    const lines = [
      { quantity: '1', unit_price: '0,10' },
      { quantity: '1', unit_price: '0,20' },
    ]
    expect(sumLineTotalsCents(lines)).toBe(30)
  })

  it('recovers exact cents from a float coming from the DB', () => {
    expect(dbAmountToCents(64.99999999999999)).toBe(6500)
  })
})