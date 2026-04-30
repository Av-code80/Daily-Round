import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listDoorCodes } from '@/features/door-codes/data'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ cacheLife: mocks.cacheLife, cacheTag: mocks.cacheTag }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: mocks.createServiceClient }))

// Returns a chainable Supabase query mock that resolves to `result` when awaited.
// Every chained method (select, order, limit, eq, or) returns the same chain object,
// so conditional branches (.eq / .or) all resolve correctly.
function makeSupabase(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    then(
      resolve: (v: { data: unknown; error: unknown }) => unknown,
      reject?: (e: unknown) => unknown,
    ) {
      return Promise.resolve(result).then(resolve, reject)
    },
  }
  chain.select.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  chain.limit.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.or.mockReturnValue(chain)
  return { from: vi.fn().mockReturnValue(chain) }
}

const mockRow = {
  id: '1',
  address: '12 Rue de la Paix',
  city: 'Paris',
  postal_code: '75001',
  arrondissement: 1,
  code: 'B512',
  floor: '3',
  instructions: null,
  parking_hint: null,
  created_at: '2026-01-01T00:00:00Z',
}

describe('listDoorCodes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a list of door codes on success', async () => {
    mocks.createServiceClient.mockReturnValue(makeSupabase({ data: [mockRow], error: null }))
    const result = await listDoorCodes({})
    expect(result).toEqual([mockRow])
  })

  it('returns an empty array when the DB returns an error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.createServiceClient.mockReturnValue(makeSupabase({ data: null, error: { message: 'timeout' } }))
    const result = await listDoorCodes({})
    expect(result).toEqual([])
  })

  it('calls .eq() with the postal code when postal param is provided', async () => {
    const sb = makeSupabase({ data: [], error: null })
    mocks.createServiceClient.mockReturnValue(sb)
    await listDoorCodes({ postal: '75001' })
    const chain = sb.from.mock.results[0].value
    expect(chain.eq).toHaveBeenCalledWith('postal_code', '75001')
  })

  it('calls .or() with ilike filters when search param is provided', async () => {
    const sb = makeSupabase({ data: [], error: null })
    mocks.createServiceClient.mockReturnValue(sb)
    await listDoorCodes({ search: 'paix' })
    const chain = sb.from.mock.results[0].value
    expect(chain.or).toHaveBeenCalledWith('address.ilike.%paix%,city.ilike.%paix%')
  })

  it('does NOT call .eq() or .or() when no filters are given', async () => {
    const sb = makeSupabase({ data: [], error: null })
    mocks.createServiceClient.mockReturnValue(sb)
    await listDoorCodes({})
    const chain = sb.from.mock.results[0].value
    expect(chain.eq).not.toHaveBeenCalled()
    expect(chain.or).not.toHaveBeenCalled()
  })
})
