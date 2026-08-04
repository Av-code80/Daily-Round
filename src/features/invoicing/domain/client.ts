import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import type { DomainError } from '@/lib/api/errors'
import type { ClientOption } from '../data'

type Result<T> = { ok: true; data: T } | { ok: false; error: DomainError }

/**
 * Creates a client from the combobox's "create as new" shortcut.
 * Only the name is known at that point — SIRET, address and payment
 * terms are filled later from the Clients page. The invoice can be
 * drafted immediately; the legal mentions are only required at
 * finalisation, so we do not block the driver here.
 */
export async function createClient(
  userId: string,
  name: string,
): Promise<Result<ClientOption>> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('invoice_clients')
    .insert({ user_id: userId, name })
    .select('id, name, siret, city, payment_terms_days, min_billable_quantity')
    .single()

  if (error) {
    console.error('[createClient] db error', { userId, code: error.code })
    return { ok: false, error: 'db_error' }
  }

  return { ok: true, data }
}