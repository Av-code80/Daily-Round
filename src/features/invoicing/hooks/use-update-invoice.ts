'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/errors'
import { updateInvoice } from '../services/invoice'
import type { InvoiceFormValues } from '../schemas'

type Variables = { invoiceId: string; values: InvoiceFormValues }

/**
 * Saving a draft is NOT optimistic: the server re-applies the client's
 * billing floor, so the stored quantities can legitimately differ from
 * what was typed. Showing the typed values as saved would be a lie.
 */
export function useUpdateInvoice() {
  const t = useTranslations('Invoicing')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, values }: Variables) =>
      updateInvoice(invoiceId, values),

    onSuccess: (_data, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      toast.success(t('toasts.saved'))
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && error.code === 'already_finalised') {
        return toast.error(t('toasts.alreadyFinalised'))
      }
      toast.error(t('toasts.saveError'))
    },
  })
}
