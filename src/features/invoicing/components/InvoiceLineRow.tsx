'use client'

import { useWatch, type Control } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { Trash2, Info } from 'lucide-react'
import type { InvoiceFormValues } from '../schemas'
import { lineTotalCents, formatCents, applyBillingFloor } from '../utils'

type Props = {
  control: Control<InvoiceFormValues>
  index: number
  /** Client's contractual floor, null when the client has none. */
  floor: number | null
  onRemoveAction: () => void
  canRemove: boolean
}

export function InvoiceLineRow({ control, index, floor, onRemoveAction, canRemove }: Props) {
  const t = useTranslations('Invoicing.line')

  // Scoped to THIS line: typing in line 3 re-renders line 3 only.
  // `useWatch({ name: 'lines' })` would re-render every row on every
  // keystroke, and the plain `watch()` would re-render the whole form.
  const line = useWatch({ control, name: `lines.${index}` })

  const quantity = line?.quantity ?? ''
  const unitPrice = line?.unit_price ?? ''

  // The floor is a contract clause: below it, the client is billed at
  // the floor. Never applied silently — `raised` drives the notice.
  const { billed, raised } = applyBillingFloor(quantity, floor)
  const total = lineTotalCents(String(billed), unitPrice)

  return (
    <div className='rounded-xl border border-foreground/10 p-3'>
      <div className='flex items-start gap-2'>
        <div className='min-w-0 flex-[2.4]'>
          <label
            htmlFor={`line-${index}-description`}
            className='mb-1 block text-[10px] text-foreground/60'
          >
            {t('description')}
          </label>
          <input
            id={`line-${index}-description`}
            className='h-12 w-full rounded-lg border border-foreground/20 px-3 text-sm'
          />
        </div>

        <div className='flex-[0.8]'>
          <label
            htmlFor={`line-${index}-quantity`}
            className='mb-1 block text-[10px] text-foreground/60'
          >
            {t('quantity')}
          </label>
          <input
            id={`line-${index}-quantity`}
            inputMode='numeric'
            className='h-12 w-full rounded-lg border border-foreground/20 px-3 font-mono text-sm'
          />
        </div>

        <div className='flex-[1.1]'>
          <label
            htmlFor={`line-${index}-price`}
            className='mb-1 block text-[10px] text-foreground/60'
          >
            {t('unitPrice')}
          </label>
          <input
            id={`line-${index}-price`}
            inputMode='decimal'
            className='h-12 w-full rounded-lg border border-foreground/20 px-3 font-mono text-sm'
          />
        </div>

        {/* Computed, never editable: an editable total could contradict
            quantity x unit price and make the invoice unauditable. */}
        <div className='flex-1 text-right'>
          <span className='mb-1 block text-[10px] text-foreground/60'>{t('total')}</span>
          <output
            htmlFor={`line-${index}-quantity line-${index}-price`}
            className='flex h-12 items-center justify-end font-mono text-sm font-semibold'
          >
            {total === null ? '—' : formatCents(total)}
          </output>
        </div>

        <button
          type='button'
          onClick={onRemoveAction}
          disabled={!canRemove}
          aria-label={t('remove', { index: index + 1 })}
          className='mt-6 shrink-0 p-2 text-foreground/40 hover:text-destructive disabled:opacity-30'
        >
          <Trash2 className='h-4 w-4' aria-hidden />
        </button>
      </div>

      {raised && (
        <p className='mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-500'>
          <Info className='h-3.5 w-3.5 shrink-0' aria-hidden />
          {t('floorApplied', { entered: quantity, billed })}
        </p>
      )}
    </div>
  )
}