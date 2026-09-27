import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { redirect as localeRedirect } from '@/i18n/navigation'
import { getTranslations, getFormatter } from 'next-intl/server'
import { AlertTriangle } from 'lucide-react'
import { z } from 'zod'
import { getInvoice } from '../data'
import { dbAmountToCents, formatCents } from '../utils'

// A finalised invoice reads ONLY its own frozen columns — never
// invoice_clients or invoice_issuers. Those live rows can legitimately
// diverge from what was true at finalisation (the client moved, the
// driver changed address); the document must show what was actually
// issued, not what is true today.
const documentSchema = z.object({
  number: z.string(),
  issued_on: z.string(),
  due_on: z.string(),
  total_excl_vat: z.number(),
  vat_amount: z.number(),
  total_incl_vat: z.number(),
  vat_regime: z.enum(['franchise', 'standard']),
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
  invoice_lines: z.array(
    z.object({
      order_index: z.number(),
      description: z.string(),
      quantity: z.number(),
      unit_price: z.number(),
      line_total: z.number(),
    }),
  ),
})

type Props = { invoiceId: string; locale: string }

export async function InvoiceDocument({ invoiceId, locale }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const raw = await getInvoice(session.user.id, invoiceId)
  if (!raw) notFound()

  // Draft preview is a separate, deliberately smaller feature: it needs
  // the live client/issuer join instead of the (still empty) frozen
  // columns. Until it exists, a draft's own place is the editor.
  if (raw.status === 'draft') {
    localeRedirect({ href: `/facturation/${invoiceId}/editer`, locale })
  }

  const invoice = documentSchema.parse(raw)
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

  const lines = [...invoice.invoice_lines].sort(
    (a, b) => a.order_index - b.order_index,
  )
  const hasIssuerSnapshot = invoice.issuer_company_name !== null

  return (
    <div className='rounded-xl border border-foreground/10 bg-background p-7 print:border-none print:p-0'>
      {!hasIssuerSnapshot && (
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
          {hasIssuerSnapshot ? (
            <>
              <p className='text-base font-medium text-[#1B2838] dark:text-foreground'>
                {invoice.issuer_company_name}
              </p>
              <p>{invoice.issuer_address_line}</p>
              <p>
                {invoice.issuer_postal_code} {invoice.issuer_city}
              </p>
              <p className='mt-1 font-mono text-xs'>
                {t('document.siret')} {invoice.issuer_siret}
              </p>
            </>
          ) : (
            <p className='italic text-foreground/50'>
              {t('document.issuerUnknown')}
            </p>
          )}
        </div>

        <div className='text-right'>
          <p className='text-xl font-medium text-[#1B2838] dark:text-foreground'>
            {t('document.title')}
          </p>
          <p className='mt-0.5 font-mono text-[15px] text-[#1B2838] dark:text-foreground'>
            {invoice.number}
          </p>
          <div className='mt-2 text-sm leading-relaxed text-foreground/70'>
            <p>{t('document.issuedOn', { date: date(invoice.issued_on) })}</p>
            <p>{t('document.dueOn', { date: date(invoice.due_on) })}</p>
          </div>
        </div>
      </div>

      <div className='mt-6 max-w-xs rounded-lg border border-foreground/10 bg-foreground/5 p-4'>
        <p className='mb-1 text-xs text-foreground/60'>
          {t('document.billedTo')}
        </p>
        <p className='text-[15px] font-medium text-[#1B2838] dark:text-foreground'>
          {invoice.client_name}
        </p>
        <div className='text-sm leading-relaxed text-foreground/70'>
          {invoice.client_address_line && <p>{invoice.client_address_line}</p>}
          {invoice.client_postal_code && invoice.client_city && (
            <p>
              {invoice.client_postal_code} {invoice.client_city}
            </p>
          )}
          {invoice.client_siret && (
            <p className='mt-1 font-mono text-xs'>
              {t('document.siret')} {invoice.client_siret}
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
            <tr
              key={line.order_index}
              className='border-b border-foreground/10'
            >
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
              {cents(invoice.total_excl_vat)}
            </span>
          </div>
          <div className='flex justify-between py-1.5'>
            <span className='text-foreground/70'>{t('document.vat')}</span>
            <span className='font-mono text-foreground/60'>
              {invoice.vat_regime === 'franchise'
                ? t('document.vatNotApplicable')
                : cents(invoice.vat_amount)}
            </span>
          </div>
          <div className='mt-1 flex justify-between border-t border-foreground/20 py-2.5'>
            <span className='font-medium text-[#1B2838] dark:text-foreground'>
              {t('document.totalInclVat')}
            </span>
            <span className='font-mono text-base font-medium text-[#1B2838] dark:text-foreground'>
              {cents(invoice.total_incl_vat)}
            </span>
          </div>
        </div>
      </div>

      <div className='mt-7 border-t border-foreground/10 pt-4 text-xs leading-relaxed text-foreground/60'>
        {invoice.vat_regime === 'franchise' && (
          <p className='text-foreground/70'>{t('document.franchiseMention')}</p>
        )}
        <p>{t('document.latePaymentMention')}</p>
      </div>
    </div>
  )
}
