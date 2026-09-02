'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createInvoice } from '../services/invoice'

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const onSuccess = (id: string) => {
    // Invalider la liste et rediriger vers l'éditeur de brouillon.
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    router.push(`/facturation/${id}/editer`)
  }

  return useMutation({
    mutationFn: createInvoice,
    onSuccess: (data) => onSuccess(data.id),
  })
}