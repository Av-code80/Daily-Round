import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireUserId, domainError } from '@/lib/api/route-helpers'
import { buildIssuerFormSchema } from '@/features/invoicing/schemas'
import { saveIssuer } from '@/features/invoicing/domain/issuer'

// The client already validated with its own translated schema before
// this request was ever sent, so a validation failure here only means a
// malformed or bypassed request. The message is never rendered to a
// user — the identity function keeps the schema's shape without needing
// a request-scoped translator for a string nobody reads.
const issuerFormSchema = buildIssuerFormSchema((key) => key)

// PUT and not POST: there is exactly one identity per driver, and
// sending it twice leaves the same state.
export async function PUT(request: Request) {
  const session = await requireUserId()
  if (!session.ok) return session.response

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = issuerFormSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const result = await saveIssuer(session.userId, parsed.data)
  if (!result.ok) return domainError(result.error)

  revalidateTag(`issuer:${session.userId}`, { expire: 0 })

  return NextResponse.json({ saved: true })
}
