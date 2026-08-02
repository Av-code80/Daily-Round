import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import { DomainError } from '@/lib/api/errors'

// Business errors the transport layer maps to HTTP status codes.
// The domain never knows what a status code is.

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: DomainError }

/**
 * Finalises a draft invoice: assigns the next legal number and freezes
 * the document. Delegates to the `finalise_invoice` SQL function so the
 * number assignment happens inside a single transaction with a row lock
 * — two concurrent calls queue instead of producing a duplicate number.
 *
 * Caller must have authenticated the session and pass the verified
 * user id; the SQL function re-checks ownership against the row.
 */
export async function finaliseInvoice(
  userId: string,
  invoiceId: string,
): Promise<Result<{ number: string }>> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc('finalise_invoice', {
    p_invoice_id: invoiceId,
    p_user_id: userId,
  })
  console.log('[finalise] rpc →', { data, error })
  if (error) {
    // Postgres RAISE EXCEPTION messages are mapped to domain errors here,
    // so the HTTP layer never has to read database internals.
    const message = error.message ?? ''

    if (message.includes('invoice not found')) {
      return { ok: false, error: 'not_found' }
    }
    if (message.includes('does not belong')) {
      return { ok: false, error: 'forbidden' }
    }
    if (message.includes('already finalised')) {
      return { ok: false, error: 'already_finalised' }
    }
    if (message.includes('without lines')) {
      return { ok: false, error: 'no_lines' }
    }

    console.error('[finaliseInvoice] rpc error', {
      userId,
      invoiceId,
      code: error.code,
      message: error.message,
    })
    return { ok: false, error: 'db_error' }
  }

  if (typeof data !== 'string') {
    console.error('[finaliseInvoice] unexpected rpc payload', {
      userId,
      invoiceId,
    })
    return { ok: false, error: 'db_error' }
  }

  return { ok: true, data: { number: data } }
}
