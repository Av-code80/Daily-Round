import { useTranslations } from 'next-intl'
import { CircleCheck } from 'lucide-react'
import { formatCents } from '../utils'
import type { InvoiceSummary } from '../data'

type TileProps = {
  label: string
  cents: number
  count: number
  accent: string
  tone?: 'danger'
}

function SummaryTile({ label, cents, count, accent, tone }: TileProps) {
  const t = useTranslations('Invoicing.summary')

  return (
    <div
      className={`flex-1 border-l-[3px] px-4 py-3 ${accent} ${
        tone === 'danger' ? 'bg-destructive/5' : ''
      }`}
    >
      <p className='text-[11px] text-foreground/60'>{label}</p>
      <div className='flex items-baseline gap-2'>
        <span className='font-mono text-lg font-semibold'>
          {formatCents(cents)}
        </span>
        <span className='text-[11px] text-foreground/50'>
          {t('invoiceCount', { count })}
        </span>
      </div>
    </div>
  )
}

export function InvoiceSummaryBar({ summary }: { summary: InvoiceSummary }) {
  const t = useTranslations('Invoicing.summary')

  // A doubled "0 € · 0 invoice" reads like a loading bug. When there is
  // nothing to chase, say so positively instead.
  const nothingOutstanding =
    summary.pendingCents === 0 && summary.overdueCents === 0

  if (nothingOutstanding) {
    return (
      <div className='flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3'>
        <CircleCheck className='h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400' aria-hidden />
        <div>
          <p className='text-sm font-medium text-emerald-800 dark:text-emerald-300'>
            {t('allCollected')}
          </p>
          <p className='text-xs text-emerald-700/80 dark:text-emerald-400/80'>
            {t('allCollectedHint')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex divide-x divide-foreground/10 overflow-hidden rounded-xl border border-foreground/10'>
      <SummaryTile
        label={t('pending')}
        cents={summary.pendingCents}
        count={summary.pendingCount}
        accent='border-l-foreground/25'
      />
      <SummaryTile
        label={t('overdue')}
        cents={summary.overdueCents}
        count={summary.overdueCount}
        accent='border-l-destructive'
        tone='danger'
      />
      <SummaryTile
        label={t('collected')}
        cents={summary.collectedCents}
        count={summary.collectedCount}
        accent='border-l-emerald-500'
      />
    </div>
  )
}