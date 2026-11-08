import { describe, it, expect, vi, afterEach } from 'vitest'
import { displayStatus, daysOverdue } from '@/features/invoicing/utils'

const finalisedUnpaid = (due_on: string | null) =>
  ({ status: 'finalised', payment_status: 'unpaid', due_on }) as const

// 2026-03-10T23:30Z is already 2026-03-11 in Paris (CET, UTC+1).
// Anything comparing dates in UTC would still read 2026-03-10 here.
const PARIS_IS_A_DAY_AHEAD = new Date('2026-03-10T23:30:00Z')

// Only Date is faked: hijacking setTimeout as well stalls the test
// environment's own async machinery.
function freeze(instant: Date) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(instant)
}

afterEach(() => vi.useRealTimers())

describe('displayStatus', () => {
  it('calls a draft a draft, whatever its dates say', () => {
    freeze(new Date('2026-03-11T10:00:00Z'))
    expect(
      displayStatus({
        status: 'draft',
        payment_status: 'unpaid',
        due_on: '2020-01-01',
      }),
    ).toBe('draft')
  })

  it('never calls a paid invoice overdue', () => {
    freeze(new Date('2026-03-11T10:00:00Z'))
    expect(
      displayStatus({
        status: 'finalised',
        payment_status: 'paid',
        due_on: '2020-01-01',
      }),
    ).toBe('paid')
  })

  it('is overdue once the due date has passed', () => {
    freeze(new Date('2026-03-11T10:00:00Z'))
    expect(displayStatus(finalisedUnpaid('2026-03-10'))).toBe('overdue')
  })

  // The whole day is still owed: due today is not late.
  it('is not overdue on the due date itself', () => {
    freeze(new Date('2026-03-11T10:00:00Z'))
    expect(displayStatus(finalisedUnpaid('2026-03-11'))).toBe('unpaid')
  })

  it('is merely unpaid when no due date exists', () => {
    freeze(new Date('2026-03-11T10:00:00Z'))
    expect(displayStatus(finalisedUnpaid(null))).toBe('unpaid')
  })

  it('uses the Paris day, not the UTC day, just after midnight', () => {
    freeze(PARIS_IS_A_DAY_AHEAD)
    // In Paris it is already the 11th, so the 10th is in the past.
    expect(displayStatus(finalisedUnpaid('2026-03-10'))).toBe('overdue')
    expect(displayStatus(finalisedUnpaid('2026-03-11'))).toBe('unpaid')
  })
})

describe('daysOverdue', () => {
  it('counts nothing without a due date', () => {
    expect(daysOverdue(null)).toBe(0)
  })

  it('counts the days since the due date', () => {
    freeze(new Date('2026-03-11T10:00:00Z'))
    expect(daysOverdue('2026-03-08')).toBe(3)
  })

  it('counts zero on the due date', () => {
    freeze(new Date('2026-03-11T10:00:00Z'))
    expect(daysOverdue('2026-03-11')).toBe(0)
  })

  it('goes negative before the due date', () => {
    freeze(new Date('2026-03-11T10:00:00Z'))
    expect(daysOverdue('2026-03-14')).toBe(-3)
  })

  it('counts from the Paris day just after midnight', () => {
    freeze(PARIS_IS_A_DAY_AHEAD)
    expect(daysOverdue('2026-03-10')).toBe(1)
  })
})
