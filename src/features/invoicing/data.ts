import { cacheLife, cacheTag } from 'next/cache'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import type { InvoiceStatus, PaymentStatus } from './schemas'

// ============================================================
// TYPES
// ============================================================

export type InvoiceListItem = {
  id: string
  number: string | null
  status: InvoiceStatus
  payment_status: PaymentStatus
  issued_on: string | null
  due_on: string | null
  total_incl_vat: number
  client_name: string
}

export type ClientOption = {
  id: string
  name: string
  siret: string | null
  city: string | null
}

// Defined here, not in the component: the data layer must not depend
// on the UI layer. The component imports this type, never the reverse.
export type InvoiceSummary = {
  pendingCents: number
  pendingCount: number
  overdueCents: number
  overdueCount: number
  collectedCents: number
  collectedCount: number
}

// ============================================================
// SCHEMAS — module level, built once, not per call
// ============================================================

const userIdSchema = z.string().uuid()
const invoiceIdSchema = z.string().uuid()

// The generated Supabase types describe the SCHEMA, not the RESPONSE.
// Because `invoices_client_id_fkey` is `isOneToOne: false`, the generator
// types the embed as an array — but PostgREST returns an OBJECT for a
// many-to-one embed. Accept both shapes, normalise once, trust neither.
const clientEmbedSchema = z
  .union([
    z.object({ name: z.string() }),
    z.array(z.object({ name: z.string() })),
  ])
  .nullable()

const invoiceRowSchema = z.object({
  id: z.string(),
  number: z.string().nullable(),
  status: z.enum(['draft', 'finalised']),
  payment_status: z.enum(['unpaid', 'paid']),
  issued_on: z.string().nullable(),
  due_on: z.string().nullable(),
  total_incl_vat: z.number(),
  invoice_clients: clientEmbedSchema,
})

function clientName(embed: z.infer<typeof clientEmbedSchema>): string {
  if (!embed) return ''
  return Array.isArray(embed) ? (embed[0]?.name ?? '') : embed.name
}

// ============================================================
// CONSTANTS
// ============================================================

// Hard caps: the server never returns more than this, whatever is asked.
const SEARCH_LIMIT = 8
const RECENT_LIMIT = 5
const PAGE_SIZE = 25

const LIST_COLS =
  'id, number, status, payment_status, issued_on, due_on, total_incl_vat, invoice_clients(name)'

// ============================================================
// INVOICES — list
// ============================================================

export async function listMyInvoices(userId: string): Promise<InvoiceListItem[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`invoices:${userId}`)

  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) return []

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(LIST_COLS)
    .eq('user_id', parsed.data) // defense in depth: the service key bypasses RLS
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) {
    console.error('[listMyInvoices] db error', {
      userId: parsed.data,
      code: error.code,
    })
    return []
  }

  return (data ?? []).map((raw) => {
    const row = invoiceRowSchema.parse(raw)
    return {
      id: row.id,
      number: row.number,
      status: row.status,
      payment_status: row.payment_status,
      issued_on: row.issued_on,
      due_on: row.due_on,
      total_incl_vat: row.total_incl_vat,
      client_name: clientName(row.invoice_clients),
    }
  })
}

// ============================================================
// SUMMARY — aggregated in SQL over the whole set
// ============================================================
// Deliberately NOT derived from listMyInvoices(): that one is paginated,
// so its totals would be silently wrong past the first page. Summing in
// SQL also keeps the arithmetic in `numeric`, which is exact.

const EMPTY_SUMMARY: InvoiceSummary = {
  pendingCents: 0,
  pendingCount: 0,
  overdueCents: 0,
  overdueCount: 0,
  collectedCents: 0,
  collectedCount: 0,
}

export async function getInvoiceSummary(userId: string): Promise<InvoiceSummary> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`invoices:${userId}`)

  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) return EMPTY_SUMMARY

  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('invoice_summary', {
    p_user_id: parsed.data,
  })

  // `returns table (...)` gives an array. Take the first row explicitly
  // rather than `.single()`, whose typing does not narrow RPC results.
  const row = data?.[0]

  if (error || !row) {
    console.error('[getInvoiceSummary] rpc error', { code: error?.code })
    return EMPTY_SUMMARY
  }

  return {
    pendingCents: Number(row.pending_cents),
    pendingCount: row.pending_count,
    overdueCents: Number(row.overdue_cents),
    overdueCount: row.overdue_count,
    collectedCents: Number(row.collected_cents),
    collectedCount: row.collected_count,
  }
}

// ============================================================
// CLIENTS — searched, never listed
// ============================================================
// Two entry points for the combobox:
//   - before typing: the 5 most recently billed clients (~80% of picks)
//   - from 2 characters: trigram search, capped at 8 rows

export async function listRecentClients(userId: string): Promise<ClientOption[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`clients:${userId}`)

  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) return []

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('invoice_clients')
    .select('id, name, siret, city')
    .eq('user_id', parsed.data)
    .order('updated_at', { ascending: false })
    .limit(RECENT_LIMIT)

  if (error) {
    console.error('[listRecentClients] db error', { code: error.code })
    return []
  }
  return data ?? []
}

// Not cached on purpose: caching per search term would create one entry
// per keystroke ("pha", "phar", "pharm"...) with almost no cache hits.
export async function searchClients(
  userId: string,
  term: string,
): Promise<ClientOption[]> {
  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) return []

  // Below 2 characters the trigram index is useless and the result set
  // would be huge — the caller shows the recent list instead.
  const cleaned = term.trim()
  if (cleaned.length < 2) return []

  // Strip PostgREST pattern metacharacters: a user typing "%" would
  // otherwise turn this into a full table scan (accidental DoS).
  const safe = cleaned.replace(/[%_,()]/g, ' ')

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('invoice_clients')
    .select('id, name, siret, city')
    .eq('user_id', parsed.data)
    .or(`name.ilike.%${safe}%,siret.ilike.${safe}%`)
    .limit(SEARCH_LIMIT)

  if (error) {
    console.error('[searchClients] db error', { code: error.code })
    return []
  }
  return data ?? []
}

// ============================================================
// INVOICE — detail with its lines
// ============================================================

export async function getInvoice(userId: string, invoiceId: string) {
  const okUser = userIdSchema.safeParse(userId)
  const okInvoice = invoiceIdSchema.safeParse(invoiceId)
  if (!okUser.success || !okInvoice.success) return null

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(
      `id, number, kind, status, payment_status, vat_regime, billing_unit,
       issued_on, due_on, paid_on, total_excl_vat, vat_amount, total_incl_vat,
       notes, finalised_at, created_at,
       invoice_clients(id, name, siret, vat_number, address_line, postal_code, city),
       invoice_lines(id, order_index, description, quantity, unit_price, line_total)`,
    )
    .eq('id', okInvoice.data)
    .eq('user_id', okUser.data) // without this, knowing a UUID would leak the invoice
    .single()

  if (error) {
    console.error('[getInvoice] db error', {
      invoiceId: okInvoice.data,
      code: error.code,
    })
    return null
  }
  return data
}