import { useTranslations } from 'next-intl'
import { AlertTriangle, Check, FileText, Send } from 'lucide-react'
import type { DisplayStatus } from '../utils'

// One source of truth for how a status looks. Every surface — table,
// card, detail header — reads from here, so a colour never drifts.
const PILL = {
  draft: {
    className: 'bg-foreground/10 text-foreground/70',
    Icon: FileText,
  },
  unpaid: {
    className: 'bg-[#FF6B35]/15 text-[#C4501F] dark:text-[#FF9A70]',
    Icon: Send,
  },
  overdue: {
    className: 'bg-destructive/15 text-destructive',
    Icon: AlertTriangle,
  },
  paid: {
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    Icon: Check,
  },
} as const satisfies Record<
  DisplayStatus,
  { className: string; Icon: typeof Check }
>

type Props = {
  status: DisplayStatus
  /** Days past due — appended for overdue invoices only. */
  daysLate?: number
}

export function InvoiceStatusPill({ status, daysLate }: Props) {
  const t = useTranslations('Invoicing.status')
  const { className, Icon } = PILL[status]

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {/* Icon + colour =  coding: readable without colour perception */}
      <Icon className='h-3 w-3 shrink-0' aria-hidden />
      {status === 'overdue' && daysLate
        ? t('overdueDays', { days: daysLate })
        : t(status)}
    </span>
  )
}