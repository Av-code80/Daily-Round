import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/api/route-helpers'
import { listMyInvoices, getInvoiceSummary } from '@/features/invoicing/data'

/**
 * GET /api/invoicing/invoices
 *
 * Exists so the list can be READ by a client component through TanStack
 * Query. Without a `useQuery` reading this, an optimistic
 * `setQueryData(['invoices'])` writes into a cache entry nothing
 * renders — the network call succeeds and the screen never moves.
 *
 * Server Components can still call `listMyInvoices()` directly for the
 * first paint; this route is the interactive path.
 */
export async function GET() {
  const session = await requireUserId()
  if (!session.ok) return session.response

  // Independent reads: run them in parallel, not in a waterfall.
  const [invoices, summary] = await Promise.all([
    listMyInvoices(session.userId),
    getInvoiceSummary(session.userId),
  ])

  return NextResponse.json({ invoices, summary })
}
