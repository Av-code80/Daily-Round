import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireUserId, parseParam, domainError, uuidSchema } from '@/lib/api/route-helpers'
import { setPaymentStatus } from '@/features/invoicing/domain/payment'

// PATCH, not POST: setting an invoice to "paid" twice leaves the same
// state, so the operation is idempotent and PATCH is the honest verb.
// Finalisation is POST for the opposite reason — replaying it must fail.

const bodySchema = z.object({
  payment_status: z.enum(['paid', 'unpaid']),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await requireUserId()
  if (!session.ok) return session.response

  const { id } = await params
  const invoiceId = parseParam(uuidSchema, id, 'invoice id')
  if (!invoiceId.ok) return invoiceId.response

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'payment_status must be "paid" or "unpaid"' },
      { status: 400 },
    )
  }

  const result = await setPaymentStatus(
    session.userId,
    invoiceId.value,
    parsed.data.payment_status,
  )
  if (!result.ok) return domainError(result.error)

  revalidateTag(`invoices:${session.userId}`, { expire: 0 })

  return NextResponse.json(result.data)
}
