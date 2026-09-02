import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireUserId, domainError } from '@/lib/api/route-helpers'
import { listMyInvoices, getInvoiceSummary } from '@/features/invoicing/data'
import { invoiceFormSchema } from '@/features/invoicing/schemas'
import { createInvoiceDraft } from '@/features/invoicing/domain/invoice'

// GET /api/invoicing/invoices — read by TanStack Query in the client component.
// Server Components call listMyInvoices() directly for the first paint.
export async function GET() {
  const session = await requireUserId()
  if (!session.ok) return session.response

  const [invoices, summary] = await Promise.all([
    listMyInvoices(session.userId),
    getInvoiceSummary(session.userId),
  ])

  return NextResponse.json({ invoices, summary })
}

// POST /api/invoicing/invoices — creates a draft invoice + its lines.
// Returns 201 + { id } so the client can redirect to the draft editor.
// Totals and billing floor are applied server-side; the client never
// sends computed amounts — only raw quantities and unit prices.
export async function POST(request: Request) {
  const session = await requireUserId()
  if (!session.ok) return session.response

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = invoiceFormSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const result = await createInvoiceDraft(session.userId, parsed.data)
  if (!result.ok) return domainError(result.error)

  revalidateTag(`invoices:${session.userId}`, { expire: 0 })

  return NextResponse.json(result.data, { status: 201 })
}
