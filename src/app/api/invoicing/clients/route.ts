import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireUserId, domainError } from '@/lib/api/route-helpers'
import { listRecentClients, searchClients } from '@/features/invoicing/data'
import { createClient } from '@/features/invoicing/domain/client'

// Same rule as the schema: 2 to 120 characters, trimmed.
const createBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
})

export async function GET(request: Request) {
  const session = await requireUserId()
  if (!session.ok) return session.response

  const { searchParams } = new URL(request.url)
  const term = searchParams.get('q')?.trim() ?? ''

  // Under 2 characters the trigram index is useless, so we serve the
  // recent list instead of running a query that would scan the table.
  const clients =
    term.length >= 2
      ? await searchClients(session.userId, term)
      : await listRecentClients(session.userId)

  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const session = await requireUserId()
  if (!session.ok) return session.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = createBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Name must be between 2 and 120 characters' },
      { status: 400 },
    )
  }

  const result = await createClient(session.userId, parsed.data.name)
  if (!result.ok) return domainError(result.error)

  revalidateTag(`clients:${session.userId}`, { expire: 0 })

  return NextResponse.json(result.data, { status: 201 })
}
