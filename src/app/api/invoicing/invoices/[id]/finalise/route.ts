import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import {
  requireUserId,
  parseParam,
  domainError,
  uuidSchema,
} from '@/lib/api/route-helpers'
import { finaliseInvoice } from '@/features/invoicing/domain/finalise'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: RouteContext) {
  const session = await requireUserId()
  if (!session.ok) return session.response

  const { id } = await params
  const invoiceId = parseParam(uuidSchema, id, 'invoice id')
  if (!invoiceId.ok) return invoiceId.response

  const result = await finaliseInvoice(session.userId, invoiceId.value)
  if (!result.ok) return domainError(result.error)

  revalidateTag(`invoices:${session.userId}`, { expire: 0 })

  return NextResponse.json({ number: result.data.number })
}
