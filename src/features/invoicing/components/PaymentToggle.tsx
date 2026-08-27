'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { setPaymentStatus } from '../services/invoice'
import type { PaymentStatus } from '../schemas'

const OPTIONS = ['unpaid', 'paid'] as const
const LABEL: Record<PaymentStatus, string> = { unpaid: 'Impayée', paid: 'Payée' }

type Props = { invoiceId: string; status: PaymentStatus }

/**
 * Optimism lives in local state, not in the TanStack cache.
 *
 * The list is rendered by a Server Component, so no `useQuery` reads
 * it — writing to `queryClient` would update an entry nothing renders.
 * Same approach as TourneeStatusSwitcher: show the new value at once,
 * roll back on failure, then `router.refresh()` to re-run the server
 * render and pick up fields the client cannot guess (here `paid_on`).
 */
export function PaymentToggle({ invoiceId, status: initial }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<PaymentStatus>(initial)

  const mutation = useMutation({
    mutationFn: (next: PaymentStatus) => setPaymentStatus(invoiceId, next),
    onError: (_e, _next, context) => {
      setStatus(context as PaymentStatus) // restore the snapshot
      toast.error('Le paiement n’a pas pu être enregistré')
    },
    // Runs on both paths: success replaces the guess with server truth,
    // failure repairs a screen that may have drifted.
    onSettled: () => router.refresh(),
  })

  const pick = (next: PaymentStatus) => {
    if (next === status || mutation.isPending) return
    const snapshot = status
    setStatus(next) // optimistic: the UI moves before the network does
    mutation.mutate(next, { onError: () => setStatus(snapshot) })
  }

  return (
    <div
      role='radiogroup'
      aria-label='Statut de paiement'
      aria-busy={mutation.isPending}
      className='flex gap-1.5'
    >
      {OPTIONS.map((option) => {
        const active = status === option
        return (
          <button
            key={option}
            type='button'
            role='radio'
            aria-checked={active}
            disabled={mutation.isPending || active}
            onClick={() => pick(option)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-2 text-sm transition-colors disabled:opacity-60 ${
              active
                ? 'border-[#FF6B35]/45 bg-[#FF6B35]/10 font-medium text-[#C4501F]'
                : 'border-foreground/15 text-foreground/60 hover:bg-foreground/5'
            }`}
          >
            {mutation.isPending && mutation.variables === option && (
              <Loader2 className='h-3.5 w-3.5 animate-spin' aria-hidden />
            )}
            {LABEL[option]}
          </button>
        )
      })}
    </div>
  )
}