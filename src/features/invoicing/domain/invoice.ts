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

export type CreatedInvoice = {
  id: string
  status: 'draft'
}

const clientRowSchema = z.object({
  id: z.string().uuid(),
  min_billable_quantity: z.number().nullable(),
})

const createDraftResultSchema = z.object({
  id: z.string().uuid(),
  status: z.literal('draft'),
})

export async function createInvoiceDraft(
  userId: string,
  values: InvoiceFormValues,
): Promise<Result<CreatedInvoice>> {
  const supabase = createServiceClient()

  // 1. Fetch client to apply the billing floor on parcel lines.
  const { data: rawClient, error: clientErr } = await supabase
    .from('invoice_clients')
    .select('id, min_billable_quantity')
    .eq('id', values.client_id)
    .eq('user_id', userId)
    .single()

  if (clientErr || !rawClient) return { ok: false, error: 'not_found' }

  const client = clientRowSchema.parse(rawClient)

  // 2. Build lines with floor applied + totals computed.
  const lines = values.lines.map((line, index) => {
    const floor =
      values.billing_unit === 'parcel' ? client.min_billable_quantity : null

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

  // 3. Insert invoice + lines atomically via RPC — a two-step insert
  // would leave an orphan draft if the process died between them.
  const { data: rawResult, error: rpcErr } = await supabase
    .rpc('create_invoice_draft', {
      p_client_id: values.client_id,
      p_vat_regime: values.vat_regime,
      p_billing_unit: values.billing_unit,
      p_notes: values.notes || null,
      p_lines: lines,
    })
    .single()

  if (rpcErr || !rawResult) {
    console.error('[createInvoiceDraft] rpc error', { code: rpcErr?.code })
    return { ok: false, error: 'db_error' }
  }

  return { ok: true, data: createDraftResultSchema.parse(rawResult) }
}
