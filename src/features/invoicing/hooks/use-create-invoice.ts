'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@/i18n/navigation'
import { createInvoice } from '../services/invoice'

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const onSuccess = () => {
    // Retour à la liste : le brouillon fraîchement créé y apparaît, ce qui
    // confirme la création. Sa ligne mène à l'éditeur pour le compléter.
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    router.push('/facturation')
  }

  return useMutation({
    mutationFn: createInvoice,
    onSuccess,
  })
}