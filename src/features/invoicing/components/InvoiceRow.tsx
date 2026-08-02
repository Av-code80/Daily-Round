import { getTranslations } from 'next-intl/server'
import { ChevronRight, AlertTriangle, Check, FileText, Send } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { InvoiceListItem } from '../data'
import { displayStatus, daysOverdue, dbAmountToCents, formatCents } from '../utils'
import { InvoiceStatusPill } from './InvoiceStatusPill'

// Icon per status, mirroring the pill. Kept next to the pill's own map
// so a status can never gain a colour without gaining an icon.
const ICON = {
  draft: { Icon: FileText, tone: 'bg-foreground/5 text-foreground/60' },
  unpaid: { Icon: Send, tone: 'bg-[#FF6B35]/10 text-[#FF6B35]' },
  overdue: { Icon: AlertTriangle, tone: 'bg-destructive/10 text-destructive' },
  paid: { Icon: Check, tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
} as const

export async function InvoiceRow({ invoice }: { invoice: InvoiceListItem }) {
  const t = await getTranslations('Invoicing.list')

  // Derived, never stored: an invoice becomes overdue by the passing of
  // time, so it cannot be a column that would go stale overnight.
  const status = displayStatus(invoice)
  const late = status === 'overdue' ? daysOverdue(invoice.due_on) : undefined
  const { Icon, tone } = ICON[status]

  return (
    <Link
      href={`/facturation/${invoice.id}`}
      aria-label={`${invoice.client_name} — ${invoice.number ?? t('tabDrafts')}`}
      className='flex items-start gap-3 rounded-xl border border-foreground/10 bg-background p-4 transition-colors hover:bg-foreground/5'
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className='h-5 w-5' aria-hidden />
      </div>

      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <p className='truncate font-semibold text-[#1B2838] dark:text-foreground'>
            {invoice.client_name}
          </p>
          <InvoiceStatusPill status={status} daysLate={late} />
        </div>
        <p className='mt-1 font-mono text-sm text-foreground/60'>
          {invoice.number ?? '—'}
          <span className='mx-1.5'>·</span>
          {formatCents(dbAmountToCents(invoice.total_incl_vat))}
        </p>
      </div>

      <ChevronRight className='mt-3 h-5 w-5 shrink-0 text-foreground/30' aria-hidden />
    </Link>
  )
}