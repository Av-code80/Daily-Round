import { describe, it, expect, vi, afterEach } from 'vitest'
import { logDbError } from '@/lib/supabase/log-error'

function captureLog(run: () => void) {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  run()
  const call = spy.mock.calls[0]
  return { scope: call?.[0], payload: call?.[1] as Record<string, unknown> }
}

afterEach(() => vi.restoreAllMocks())

describe('logDbError', () => {
  it('keeps the message a transport failure carries', () => {
    // The real shape of a network outage: a message, and no code at all.
    const { payload } = captureLog(() =>
      logDbError('[listMyInvoices] db error', {
        message: 'TypeError: fetch failed',
      }),
    )
    expect(payload.message).toBe('TypeError: fetch failed')
  })

  it('keeps the code and details a PostgREST error carries', () => {
    const { scope, payload } = captureLog(() =>
      logDbError('[saveIssuer] db error', {
        message: 'duplicate key value',
        code: '23505',
        details: 'Key (user_id) already exists.',
      }),
    )
    expect(scope).toBe('[saveIssuer] db error')
    expect(payload).toMatchObject({
      code: '23505',
      details: 'Key (user_id) already exists.',
    })
  })

  it('merges the caller context', () => {
    const { payload } = captureLog(() =>
      logDbError('[getInvoice] db error', { code: 'PGRST116' }, { invoiceId: 'abc' }),
    )
    expect(payload.invoiceId).toBe('abc')
    expect(payload.code).toBe('PGRST116')
  })

  // The whole point of the helper: never log an object that says nothing.
  it('never logs an empty payload', () => {
    const { payload } = captureLog(() => logDbError('[getIssuer] db error', null))
    expect(Object.keys(payload).length).toBeGreaterThan(0)
    expect(payload.unknownError).toBe('null')
  })
})
