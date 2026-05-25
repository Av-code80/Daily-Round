'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { reorderStops } from '../../actions'

const KNOWN_ERRORS = ['order_mismatch', 'db_error'] as const
type KnownError = (typeof KNOWN_ERRORS)[number]

type Item = { id: string; address: string }

type Props = {
  tourneeId: string
  initialStops: Item[]
}

export function ReorderStops({ tourneeId, initialStops }: Props) {
  const t = useTranslations('Tournee.stops.reorderMode')
  const router = useRouter()
  const [stops, setStops] = useState<Item[]>(initialStops)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<KnownError | null>(null)

  function move(index: number, delta: number) {
    const next = index + delta
    if (next < 0 || next >= stops.length) return
    setStops((prev) => {
      const copy = [...prev]
      const tmp = copy[index]
      copy[index] = copy[next]
      copy[next] = tmp
      return copy
    })
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await reorderStops(
        tourneeId,
        stops.map((s) => s.id),
      )
      if (!result.ok) {
        setError(
          (KNOWN_ERRORS as readonly string[]).includes(result.error)
            ? (result.error as KnownError)
            : 'db_error',
        )
        return
      }
      router.push(`/tournees/${tourneeId}`)
      router.refresh()
    })
  }

  if (stops.length === 0) {
    return <p className='text-sm text-foreground/60'>—</p>
  }

  return (
    <div className='space-y-3'>
      <ol className='space-y-2'>
        {stops.map((stop, i) => (
          <li
            key={stop.id}
            className='flex items-center gap-3 rounded-xl border border-foreground/10 bg-background p-3'
          >
            <span className='font-mono text-sm text-foreground/50'>
              {i + 1}.
            </span>
            <span className='min-w-0 flex-1 truncate text-sm'>
              {stop.address}
            </span>
            <button
              type='button'
              aria-label='Move up'
              onClick={() => move(i, -1)}
              disabled={i === 0 || pending}
              className='flex h-12 w-12 items-center justify-center rounded-xl hover:bg-foreground/5 disabled:opacity-30'
            >
              <ChevronUp className='h-5 w-5' aria-hidden />
            </button>
            <button
              type='button'
              aria-label='Move down'
              onClick={() => move(i, 1)}
              disabled={i === stops.length - 1 || pending}
              className='flex h-12 w-12 items-center justify-center rounded-xl hover:bg-foreground/5 disabled:opacity-30'
            >
              <ChevronDown className='h-5 w-5' aria-hidden />
            </button>
          </li>
        ))}
      </ol>

      <button
        type='button'
        onClick={handleSave}
        disabled={pending}
        className='h-14 w-full rounded-xl bg-[#FF6B35] font-semibold text-white shadow-lg active:bg-[#e5602e] disabled:opacity-50'
      >
        {pending ? t('saving') : t('save')}
      </button>

      {error && (
        <p className='text-center text-sm text-red-600'>{t(`errors.${error}`)}</p>
      )}
    </div>
  )
}
