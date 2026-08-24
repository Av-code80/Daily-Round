import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import type { DomainError } from '@/lib/api/errors'
import type { PaymentStatus } from '../schemas'

type Result<T> = { ok: true; data: T } | { ok: false; error: DomainError }

export type PaymentUpdate = {
  id: string
  payment_status: PaymentStatus
  paid_on: string | null
}

// Artificial latency so optimistic updates are actually visible while
// drilling. Remove before shipping — see DRILL note in the route handler.
const DRILL_LATENCY_MS = 1200

/**
 * Flips an invoice between paid and unpaid.
 *
 * This is the ONLY field that may change once an invoice is finalised —
 * the DB trigger `guard_finalised_invoice` rejects anything else. The
 * schema also enforces `paid_on` is set exactly when the status is paid,
 * so both move together or the row is refused.
 */
export async function setPaymentStatus(
  userId: string,
  invoiceId: string,
  next: PaymentStatus,
): Promise<Result<PaymentUpdate>> {
  await new Promise((r) => setTimeout(r, DRILL_LATENCY_MS))

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('invoices')
    .update({
      payment_status: next,
      paid_on: next === 'paid' ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq('id', invoiceId)
    .eq('user_id', userId) // defense in depth: the service key bypasses RLS
    .eq('status', 'finalised') // a draft has no payment to track
    .select('id, payment_status, paid_on')
    .single()

  if (error) {
    // No row matched: either not this user's invoice, or still a draft.
    if (error.code === 'PGRST116') return { ok: false, error: 'not_found' }
    console.error('[setPaymentStatus] db error', {
      userId,
      invoiceId,
      code: error.code,
    })
    return { ok: false, error: 'db_error' }
  }

  return { ok: true, data }
}
