import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, getFormatter } from 'next-intl/server'
import { AlertTriangle } from 'lucide-react'
import { z } from 'zod'
import { getInvoice, getIssuer } from '../data'
import { dbAmountToCents, formatCents, sirenFromSiret } from '../utils'

// The two legal states read from completely different places, and that
// decision is made ONCE here rather than scattered through the markup.
//
// A finalised invoice reads ONLY its own frozen columns — never
// invoice_clients or invoice_issuers. Those live rows can legitimately
// diverge from what was true at finalisation (the client moved, the
// driver changed address); the document must show what was actually
// issued, not what is true today.
//
// A draft has no frozen columns yet, so it reads the live rows. That is
// the point of a preview: a corrected address must show up immediately,
// because once finalised it can never be corrected again.

const lineSchema = z.object({
  order_index: z.number(),
  description: z.string(),
  quantity: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
})

const amountsSchema = z.object({
  vat_regime: z.enum(['franchise', 'standard']),
  operation_category: z.enum(['goods', 'services', 'mixed']),
  total_excl_vat: z.number(),
  vat_amount: z.number(),
  total_incl_vat: z.number(),
  invoice_lines: z.array(lineSchema),
})

const finalisedSchema = amountsSchema.extend({
  number: z.string(),
  issued_on: z.string(),
  due_on: z.string(),
  client_name: z.string(),
  client_siret: z.string().nullable(),
  client_address_line: z.string().nullable(),
  client_postal_code: z.string().nullable(),
  client_city: z.string().nullable(),
  // Nullable rather than required: invoices finalised before the issuer
  // freeze was introduced kept their columns empty by design, since
  // making up an identity for a legal document was worse than leaving
  // it blank. The document renders a "legacy invoice" banner instead
  // of crashing when it meets one of them.
  issuer_company_name: z.string().nullable(),
  issuer_siret: z.string().nullable(),
  issuer_address_line: z.string().nullable(),
  issuer_postal_code: z.string().nullable(),
  issuer_city: z.string().nullable(),
})

// PostgREST returns an OBJECT for a many-to-one embed while the generated
// types describe an array. Accept both, normalise once — same trade-off
// as the editor and the list query.
const embeddedClientSchema = z.object({
  name: z.string(),
  siret: z.string().nullable(),
  address_line: z.string().nullable(),
  postal_code: z.string().nullable(),
  city: z.string().nullable(),
})

const draftSchema = amountsSchema.extend({
  invoice_clients: z
    .union([embeddedClientSchema, z.array(embeddedClientSchema)])
    .nullable(),
})

type Party = {
  name: string
  siret: string | null
  addressLine: string | null
  postalCode: string | null
  city: string | null
}

type DocumentView = {
  isDraft: boolean
  operationCategory: 'goods' | 'services' | 'mixed'
  /** Null on a draft: a legal number is only consumed at finalisation. */
  number: string | null
  issuedOn: string | null
  dueOn: string | null
  issuer: Party | null
  client: Party
  vatRegime: 'franchise' | 'standard'
  totalExclVat: number
  vatAmount: number
  totalInclVat: number
  lines: z.infer<typeof lineSchema>[]
}

function firstEmbedded(
  embed: z.infer<typeof draftSchema>['invoice_clients'],
): z.infer<typeof embeddedClientSchema> | null {
  if (!embed) return null
  return Array.isArray(embed) ? (embed[0] ?? null) : embed
}

type Props = { invoiceId: string }

export async function InvoiceDocument({ invoiceId }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const raw = await getInvoice(session.user.id, invoiceId)
  if (!raw) notFound()

  let view: DocumentView

  if (raw.status === 'draft') {
    const draft = draftSchema.parse(raw)
    const client = firstEmbedded(draft.invoice_clients)
    if (!client) notFound()

    const issuer = await getIssuer(session.user.id)

    view = {
      isDraft: true,
      number: null,
      issuedOn: null,
      dueOn: null,
      issuer: issuer && {
        name: issuer.company_name,
        siret: issuer.siret,
        addressLine: issuer.address_line,
        postalCode: issuer.postal_code,
        city: issuer.city,
      },
      client: {
        name: client.name,
        siret: client.siret,
        addressLine: client.address_line,
        postalCode: client.postal_code,
        city: client.city,
      },
      operationCategory: draft.operation_category,
      vatRegime: draft.vat_regime,
      totalExclVat: draft.total_excl_vat,
      vatAmount: draft.vat_amount,
      totalInclVat: draft.total_incl_vat,
      lines: draft.invoice_lines,
    }
  } else {
    const invoice = finalisedSchema.parse(raw)

    view = {
      isDraft: false,
      number: invoice.number,
      issuedOn: invoice.issued_on,
      dueOn: invoice.due_on,
      issuer:
        invoice.issuer_company_name === null
          ? null
          : {
              name: invoice.issuer_company_name,
              siret: invoice.issuer_siret,
              addressLine: invoice.issuer_address_line,
              postalCode: invoice.issuer_postal_code,
              city: invoice.issuer_city,
            },
      client: {
        name: invoice.client_name,
        siret: invoice.client_siret,
        addressLine: invoice.client_address_line,
        postalCode: invoice.client_postal_code,
        city: invoice.client_city,
      },
      operationCategory: invoice.operation_category,
      vatRegime: invoice.vat_regime,
      totalExclVat: invoice.total_excl_vat,
      vatAmount: invoice.vat_amount,
      totalInclVat: invoice.total_incl_vat,
      lines: invoice.invoice_lines,
    }
  }

  const t = await getTranslations('Invoicing')
  const format = await getFormatter()

  const cents = (amount: number) => formatCents(dbAmountToCents(amount))
  const date = (iso: string) =>
    format.dateTime(new Date(`${iso}T00:00:00`), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    })

  const lines = [...view.lines].sort((a, b) => a.order_index - b.order_index)

  // Mandatory mention from 1 September 2026: the central directory routes
  // invoices on the SIREN, so it is spelled out rather than left implicit
  // inside the SIRET.
  const issuerSiren = sirenFromSiret(view.issuer?.siret ?? null)
  const clientSiren = sirenFromSiret(view.client.siret)

  return (
    <div className='rounded-xl border border-foreground/10 bg-background p-7 print:border-none print:p-0'>
      {/* Deliberately NOT print:hidden, unlike the legacy banner below: a
          printed draft that omitted this warning would be indistinguishable
          from a real invoice. */}
      {view.isDraft && (
        <div
          role='status'
          className='mb-5 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-500'
        >
          <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden />
          {t('document.draftBanner')}
        </div>
      )}

      {!view.isDraft && view.issuer === null && (
        <div
          role='status'
          className='mb-5 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500 print:hidden'
        >
          <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden />
          {t('document.legacyNoIssuer')}
        </div>
      )}

      <div className='flex flex-wrap justify-between gap-6'>
        <div className='text-sm leading-relaxed text-foreground/70'>
          {view.issuer ? (
            <>
              <p className='text-base font-medium text-[#1B2838] dark:text-foreground'>
                {view.issuer.name}
              </p>
              <p>{view.issuer.addressLine}</p>
              <p>
                {view.issuer.postalCode} {view.issuer.city}
              </p>
              <p className='mt-1 font-mono text-xs'>
                {t('document.siret')} {view.issuer.siret}
              </p>
              {issuerSiren && (
                <p className='font-mono text-xs'>
                  {t('document.siren')} {issuerSiren}
                </p>
              )}
            </>
          ) : (
            <p className='italic text-foreground/50'>
              {view.isDraft
                ? t('document.issuerMissing')
                : t('document.issuerUnknown')}
            </p>
          )}
        </div>

        <div className='text-right'>
          <p className='text-xl font-medium text-[#1B2838] dark:text-foreground'>
            {t('document.title')}
          </p>
          <p className='mt-0.5 font-mono text-[15px] text-[#1B2838] dark:text-foreground'>
            {view.number ?? t('document.draftLabel')}
          </p>
          {view.issuedOn && view.dueOn && (
            <div className='mt-2 text-sm leading-relaxed text-foreground/70'>
              <p>{t('document.issuedOn', { date: date(view.issuedOn) })}</p>
              <p>{t('document.dueOn', { date: date(view.dueOn) })}</p>
            </div>
          )}
        </div>
      </div>

      <div className='mt-6 max-w-xs rounded-lg border border-foreground/10 bg-foreground/5 p-4'>
        <p className='mb-1 text-xs text-foreground/60'>
          {t('document.billedTo')}
        </p>
        <p className='text-[15px] font-medium text-[#1B2838] dark:text-foreground'>
          {view.client.name}
        </p>
        <div className='text-sm leading-relaxed text-foreground/70'>
          {view.client.addressLine && <p>{view.client.addressLine}</p>}
          {view.client.postalCode && view.client.city && (
            <p>
              {view.client.postalCode} {view.client.city}
            </p>
          )}
          {view.client.siret && (
            <p className='mt-1 font-mono text-xs'>
              {t('document.siret')} {view.client.siret}
            </p>
          )}
          {clientSiren && (
            <p className='font-mono text-xs'>
              {t('document.siren')} {clientSiren}
            </p>
          )}
        </div>
      </div>

      <table className='mt-6 w-full text-sm'>
        <thead>
          <tr className='border-b border-foreground/20 text-left text-foreground/60'>
            <th className='py-2 font-medium'>{t('line.description')}</th>
            <th className='w-[70px] py-2 text-right font-medium'>
              {t('line.quantity')}
            </th>
            <th className='w-[110px] py-2 text-right font-medium'>
              {t('line.unitPrice')}
            </th>
            <th className='w-[120px] py-2 text-right font-medium'>
              {t('document.lineTotal')}
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.order_index} className='border-b border-foreground/10'>
              <td className='py-2.5 text-[#1B2838] dark:text-foreground'>
                {line.description}
              </td>
              <td className='py-2.5 text-right font-mono text-foreground/70'>
                {line.quantity}
              </td>
              <td className='py-2.5 text-right font-mono text-foreground/70'>
                {cents(line.unit_price)}
              </td>
              <td className='py-2.5 text-right font-mono text-[#1B2838] dark:text-foreground'>
                {cents(line.line_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className='mt-4 flex justify-end'>
        <div className='min-w-[260px] text-sm'>
          <div className='flex justify-between py-1.5'>
            <span className='text-foreground/70'>
              {t('document.totalExclVat')}
            </span>
            <span className='font-mono text-[#1B2838] dark:text-foreground'>
              {cents(view.totalExclVat)}
            </span>
          </div>
          <div className='flex justify-between py-1.5'>
            <span className='text-foreground/70'>{t('document.vat')}</span>
            <span className='font-mono text-foreground/60'>
              {view.vatRegime === 'franchise'
                ? t('document.vatNotApplicable')
                : cents(view.vatAmount)}
            </span>
          </div>
          <div className='mt-1 flex justify-between border-t border-foreground/20 py-2.5'>
            <span className='font-medium text-[#1B2838] dark:text-foreground'>
              {t('document.totalInclVat')}
            </span>
            <span className='font-mono text-base font-medium text-[#1B2838] dark:text-foreground'>
              {cents(view.totalInclVat)}
            </span>
          </div>
        </div>
      </div>

      <div className='mt-7 border-t border-foreground/10 pt-4 text-xs leading-relaxed text-foreground/60'>
        <p className='text-foreground/70'>
          {t('document.operationCategoryMention', {
            category: t(`document.operationCategories.${view.operationCategory}`),
          })}
        </p>
        {view.vatRegime === 'franchise' && (
          <p className='text-foreground/70'>{t('document.franchiseMention')}</p>
        )}
        <p>{t('document.latePaymentMention')}</p>
      </div>
    </div>
  )
}
