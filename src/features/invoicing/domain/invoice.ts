import 'server-only'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import type { DomainError } from '@/lib/api/errors'
import type { InvoiceFormValues } from '../schemas'
import {
  parseAmountToCents,
  centsToDbAmount,
  lineTotalCents,
  applyBillingFloor,
} from '../utils'

type Result<T> = { ok: true; data: T } | { ok: false; error: DomainError }

export type InvoiceDraftRef = {
  id: string
  status: 'draft'
}

const clientRowSchema = z.object({
  id: z.string().uuid(),
  min_billable_quantity: z.number().nullable(),
})

const draftResultSchema = z.object({
  id: z.string().uuid(),
  status: z.literal('draft'),
})

// PostgREST surfaces a raised SQLSTATE as `code`. The RPCs raise
// no_data_found for "gone or not yours" and check_violation for
// "already finalised", so the API can answer 404 and 409 instead of 500.
const PG_ERROR: Record<string, DomainError> = {
  P0002: 'not_found',
  '23514': 'already_finalised',
}

function domainErrorFor(code: string | undefined): DomainError {
  return (code && PG_ERROR[code]) || 'db_error'
}

// Shared by create and update: were the two to diverge, editing a draft
// would become a way to bypass the client's contractual floor.
function buildLines(values: InvoiceFormValues, minBillableQuantity: number | null) {
  const floor = values.billing_unit === 'parcel' ? minBillableQuantity : null

  return values.lines.map((line, index) => {
    const { billed } = applyBillingFloor(line.quantity, floor)
    const unitPriceCents = parseAmountToCents(line.unit_price) ?? 0
    const total = lineTotalCents(String(billed), line.unit_price) ?? 0

    return {
      order_index: index,
      description: line.description,
      quantity: billed,
      unit_price: centsToDbAmount(unitPriceCents),
      line_total: centsToDbAmount(total),
    }
  })
}

export async function createInvoiceDraft(
  userId: string,
  values: InvoiceFormValues,
): Promise<Result<InvoiceDraftRef>> {
  const supabase = createServiceClient()

  // 1. Fetch client to apply the billing floor on parcel lines
  const { data: rawClient, error: clientErr } = await supabase
    .from('invoice_clients')
    .select('id, min_billable_quantity')
    .eq('id', values.client_id)
    .eq('user_id', userId)
    .single()

  if (clientErr || !rawClient) return { ok: false, error: 'not_found' }

  const client = clientRowSchema.parse(rawClient)
  const lines = buildLines(values, client.min_billable_quantity)

  // 2. Insert invoice + lines atomically via RPC — a two-step insert
  // would leave an orphan draft if the process died between them.
  const { data: rawResult, error: rpcErr } = await supabase
    .rpc('create_invoice_draft', {
      p_user_id: userId,
      p_client_id: values.client_id,
      p_vat_regime: values.vat_regime,
      p_billing_unit: values.billing_unit,
      p_notes: values.notes || null,
      p_lines: lines,
    })
    .single()

  if (rpcErr || !rawResult) {
    console.error('[createInvoiceDraft] rpc error', { code: rpcErr?.code })
    return { ok: false, error: domainErrorFor(rpcErr?.code) }
  }

  return { ok: true, data: draftResultSchema.parse(rawResult) }
}

/**
 * Rewrites a draft's header and its whole set of lines. The RPC holds a
 * row lock while it checks the status, so a concurrent finalisation
 * cannot slip in between the check and the write.
 */
export async function updateInvoiceDraft(
  userId: string,
  invoiceId: string,
  values: InvoiceFormValues,
): Promise<Result<InvoiceDraftRef>> {
  const supabase = createServiceClient()

  // Only for the floor value — the RPC re-checks ownership authoritatively.
  const { data: rawClient, error: clientErr } = await supabase
    .from('invoice_clients')
    .select('id, min_billable_quantity')
    .eq('id', values.client_id)
    .eq('user_id', userId)
    .single()

  if (clientErr || !rawClient) return { ok: false, error: 'not_found' }

  const client = clientRowSchema.parse(rawClient)
  const lines = buildLines(values, client.min_billable_quantity)

  const { data: rawResult, error: rpcErr } = await supabase
    .rpc('update_invoice_draft', {
      p_user_id: userId,
      p_invoice_id: invoiceId,
      p_client_id: values.client_id,
      p_vat_regime: values.vat_regime,
      p_billing_unit: values.billing_unit,
      p_notes: values.notes || null,
      p_lines: lines,
    })
    .single()

  if (rpcErr || !rawResult) {
    console.error('[updateInvoiceDraft] rpc error', { code: rpcErr?.code })
    return { ok: false, error: domainErrorFor(rpcErr?.code) }
  }

  return { ok: true, data: draftResultSchema.parse(rawResult) }
}
