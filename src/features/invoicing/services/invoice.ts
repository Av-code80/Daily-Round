import { z } from 'zod'
import { apiClient } from '@/lib/api/client'

// The response contract, declared as a schema. If the API ever changes
// shape, this throws at the boundary instead of leaking undefined into
// the UI three components deeper.
const finaliseResponseSchema = z.object({
  number: z.string().min(1),
})

export function finaliseInvoice(invoiceId: string) {
  return apiClient.post(
    `/api/invoicing/invoices/${invoiceId}/finalise`,
    finaliseResponseSchema,
  )
}