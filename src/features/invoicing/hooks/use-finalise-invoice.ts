'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/errors'
import { finaliseInvoice } from '../services/invoice'
import { useRouter } from '@/i18n/navigation'

/**
 * Finalisation is NOT optimistic, on purpose: the server assigns the
 * legal number and we cannot predict it. Showing a fake number then
 * correcting it would be worse than a one-second wait.
 */
export function useFinaliseInvoice() {
  const t = useTranslations('Invoicing')
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (invoiceId: string) => finaliseInvoice(invoiceId),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice'] })
      toast.success(t('toasts.finalised', { number: data.number }))
      router.push('/facturation')
    },
    onError: (error: Error) => {
      if (error instanceof ApiError) {
        // Branch on the business code, never on the message text
        if (error.code === 'already_finalised') {
          return toast.error(t('toasts.alreadyFinalised'))
        }
        if (error.code === 'no_lines') {
          return toast.error(t('toasts.noLines'))
        }
      }
      toast.error(t('toasts.finaliseError'))
    },
  })
}