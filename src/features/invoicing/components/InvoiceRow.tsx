import { getTranslations } from 'next-intl/server'
import { AlertTriangle, Check, FileText, Send } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { InvoiceListItem } from '../data'
import {
  displayStatus,
  daysOverdue,
  dbAmountToCents,
  formatCents,
} from '../utils'
import { InvoiceStatusPill } from './InvoiceStatusPill'
import { PaymentToggle } from './PaymentToggle'

const ICON = {
  draft: { Icon: FileText, tone: 'bg-foreground/5 text-foreground/60' },
  unpaid: { Icon: Send, tone: 'bg-[#FF6B35]/10 text-[#FF6B35]' },
  overdue: { Icon: AlertTriangle, tone: 'bg-destructive/10 text-destructive' },
  paid: {
    Icon: Check,
    tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
} as const

export async function InvoiceRow({ invoice }: { invoice: InvoiceListItem }) {
  const t = await getTranslations('Invoicing.list')

  const status = displayStatus(invoice)
  const late = status === 'overdue' ? daysOverdue(invoice.due_on) : undefined
  const { Icon, tone } = ICON[status]

  return (
    // A plain <div>, NOT a <Link>. Interactive content cannot nest:
    // a <button> inside an <a> is invalid HTML, and the click bubbles
    // up to the anchor, navigating away instead of mutating.
    <div className='rounded-xl border border-foreground/10 bg-background p-4 transition-colors hover:bg-foreground/5'>
      <div className='flex items-start gap-3'>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className='h-5 w-5' aria-hidden />
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-center justify-between gap-2'>
            {/* Only the client name is a link now */}
            <Link
              href={`/facturation/${invoice.id}`}
              aria-label={`${invoice.client_name} — ${invoice.number ?? t('tabDrafts')}`}
              className='truncate font-semibold text-[#1B2838] hover:underline dark:text-foreground'
            >
              {invoice.client_name}
            </Link>
            <InvoiceStatusPill status={status} daysLate={late} />
          </div>

          <p className='mt-1 font-mono text-sm text-foreground/60'>
            {invoice.number ?? '—'}
            <span className='mx-1.5'>·</span>
            {formatCents(dbAmountToCents(invoice.total_incl_vat))}
          </p>

          {/* A draft has no payment: the DB refuses it (constraint
              invoices_payment_requires_finalised), so we never offer it */}
          {invoice.status === 'finalised' && (
            <div className='mt-3 max-w-[220px]'>
              <PaymentToggle
                invoiceId={invoice.id}
                status={invoice.payment_status}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}