import 'server-only'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import type { DomainError } from '@/lib/api/errors'   // au lieu de features/invoicing/...

// Domain errors -> HTTP. The single place in the app that knows both.
const DOMAIN_STATUS: Record<DomainError, number> = {
  not_found: 404,
  forbidden: 403,
  already_finalised: 409,
  no_lines: 422,
  db_error: 500,
}

/**
 * Authenticates the caller. Returns the user id, or a ready-to-return
 * 401 Response. Every route handler starts with this — a route handler
 * is a public URL, unlike a Server Action which carries the session.
 */
export async function requireUserId(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { ok: true, userId: session.user.id }
}

/** Validates a route param, returning a 400 Response on failure. */
export function parseParam<T>(
  schema: z.ZodType<T>,
  value: unknown,
  label: string,
): { ok: true; value: T } | { ok: false; response: NextResponse } {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json({ error: `Invalid ${label}` }, { status: 400 }),
    }
  }
  return { ok: true, value: parsed.data }
}

/** Consistent error shape for the whole API: { error, code }. */
export function domainError(error: DomainError): NextResponse {
  return NextResponse.json({ error, code: error }, { status: DOMAIN_STATUS[error] })
}

export const uuidSchema = z.string().uuid()