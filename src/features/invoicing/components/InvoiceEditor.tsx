import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { redirect as localeRedirect } from '@/i18n/navigation'
import { z } from 'zod'
import { getInvoice } from '../data'
import { dbAmountToCents } from '../utils'
import {
  invoiceStatusSchema,
  vatRegimeSchema,
  billingUnitSchema,
  type InvoiceFormValues,
} from '../schemas'
import { InvoiceForm } from './InvoiceForm'

const embeddedClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  min_billable_quantity: z.number().nullable(),
})

// PostgREST returns an OBJECT for a many-to-one embed while the generated
// types describe an array. Accept both, normalise once — same trade-off as
// the list query in data.ts.
const draftSchema = z.object({
  status: invoiceStatusSchema,
  vat_regime: vatRegimeSchema,
  billing_unit: billingUnitSchema,
  notes: z.string().nullable(),
  invoice_clients: z
    .union([embeddedClientSchema, z.array(embeddedClientSchema)])
    .nullable(),
  invoice_lines: z.array(
    z.object({
      order_index: z.number(),
      description: z.string(),
      quantity: z.number(),
      unit_price: z.number(),
    }),
  ),
})

type DraftRow = z.infer<typeof draftSchema>

function embeddedClient(embed: DraftRow['invoice_clients']) {
  if (!embed) return null
  return Array.isArray(embed) ? (embed[0] ?? null) : embed
}

function toFormValues(row: DraftRow, clientId: string): InvoiceFormValues {
  return {
    client_id: clientId,
    vat_regime: row.vat_regime,
    billing_unit: row.billing_unit,
    notes: row.notes ?? '',
    // order_index is the stored order; the array order coming back from
    // PostgREST is not guaranteed to match it.
    lines: [...row.invoice_lines]
      .sort((a, b) => a.order_index - b.order_index)
      .map((line) => ({
        description: line.description,
        quantity: String(line.quantity),
        unit_price: (dbAmountToCents(line.unit_price) / 100).toFixed(2),
      })),
  }
}

type Props = { invoiceId: string; locale: string }

export async function InvoiceEditor({ invoiceId, locale }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const raw = await getInvoice(session.user.id, invoiceId)
  if (!raw) notFound()

  const invoice = draftSchema.parse(raw)

  // A finalised invoice is immutable: editing it is not "missing", it is
  // simply not an available action, so send the user back to the list.
  if (invoice.status === 'finalised') {
    localeRedirect({ href: '/facturation', locale })
  }

  const client = embeddedClient(invoice.invoice_clients)

  return (
    <InvoiceForm
      invoiceId={invoiceId}
      defaultValues={toFormValues(invoice, client?.id ?? '')}
      initialClient={client}
    />
  )
}
