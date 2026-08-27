import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PaymentStatus } from '../schemas'
import { setPaymentStatus } from '../services/invoice'
import { InvoiceListItem } from '../data'
import { toast } from 'sonner'

export function usePaymentStatus(invoiceId: string) {
  const queryClient = useQueryClient()
  const listKey = ['invoices'] as const

  return useMutation({
    mutationFn: (next: PaymentStatus) => setPaymentStatus(invoiceId, next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      // Snapshot the previous value
      const previous = queryClient.getQueryData<InvoiceListItem[]>(listKey)
      // Write the guess. The UI reacts instantly
      queryClient.setQueryData<InvoiceListItem[]>(listKey, (old) =>
        old?.map((invoice) =>
          invoice.id === invoiceId
            ? { ...invoice, payment_status: next }
            : invoice,
        ),
      )
      return { previous }
    },

    onError: (_err, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous)
      }
      toast.error('Failed to update payment status. Please try again.')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}
