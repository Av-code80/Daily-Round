import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireUserId, parseParam, domainError, uuidSchema } from '@/lib/api/route-helpers'
import { invoiceFormSchema } from '@/features/invoicing/schemas'
import { updateInvoiceDraft } from '@/features/invoicing/domain/invoice'

// PUT, not PATCH: the body carries the invoice in full, lines included,
// and replaces what is stored. Sending a partial set of lines would be
// ambiguous — is a missing line deleted, or simply left alone?

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await requireUserId()
  if (!session.ok) return session.response

  const { id } = await params
  const invoiceId = parseParam(uuidSchema, id, 'invoice id')
  if (!invoiceId.ok) return invoiceId.response

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

  const result = await updateInvoiceDraft(
    session.userId,
    invoiceId.value,
    parsed.data,
  )
  if (!result.ok) return domainError(result.error)

  revalidateTag(`invoices:${session.userId}`, { expire: 0 })

  return NextResponse.json(result.data)
}
