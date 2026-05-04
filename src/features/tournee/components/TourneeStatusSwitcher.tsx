'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

import { updateTourneeStatus } from '../actions'
import { TOURNEE_STATUSES, type TourneeStatus } from '../schemas'

const PILL: Record<TourneeStatus, { active: string; idle: string }> = {
  pending: {
    active: 'bg-foreground/10 text-foreground border-foreground/30',
    idle: 'border-foreground/15 text-foreground/60 hover:bg-foreground/5',
  },
  in_progress: {
    active: 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/40',
    idle: 'border-foreground/15 text-foreground/60 hover:bg-foreground/5',
  },
  completed: {
    active:
      'bg-emerald-500/10 text-emerald-700 border-emerald-500/40 dark:text-emerald-400',
    idle: 'border-foreground/15 text-foreground/60 hover:bg-foreground/5',
  },
}

type Props = {
  tourneeId: string
  initialStatus: TourneeStatus
}

export function TourneeStatusSwitcher({ tourneeId, initialStatus }: Props) {
  const t = useTranslations('Tournee')
  const [status, setStatus] = useState<TourneeStatus>(initialStatus)

  const mutation = useMutation({
    mutationFn: (next: TourneeStatus) => updateTourneeStatus(tourneeId, next),
  })

  const onPick = (next: TourneeStatus) => {
    if (next === status || mutation.isPending) return
    const prev = status
    setStatus(next) // optimistic
    mutation.mutate(next, {
      onError: () => setStatus(prev),
      onSuccess: (r) => {
        if (!r.ok) setStatus(prev)
      },
    })
  }

  return (
    <div
      role='radiogroup'
      aria-label={t('detail.statusLabel')}
      className='grid grid-cols-3 gap-1.5'
    >
      {TOURNEE_STATUSES.map((s) => {
        const active = status === s
        return (
          <button
            key={s}
            type='button'
            role='radio'
            aria-checked={active}
            disabled={mutation.isPending && active}
            onClick={() => onPick(s)}
            className={`flex h-12 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors ${
              active ? PILL[s].active : PILL[s].idle
            }`}
          >
            {mutation.isPending && active && (
              <Loader2 className='h-3.5 w-3.5 animate-spin' aria-hidden />
            )}
            {t(`status.${s}`)}
          </button>
        )
      })}
    </div>
  )
}
