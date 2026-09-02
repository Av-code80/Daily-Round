import { z } from 'zod'
import { apiClient } from '@/lib/api/client'
import { PaymentStatus, type InvoiceFormValues } from '../schemas'

// The response contract, declared as a schema. If the API ever changes
// shape, this throws at the boundary instead of leaking undefined into
// the UI three components deeper.
const finaliseResponseSchema = z.object({
  number: z.string().min(1),
})

const paymentResponseSchema = z.object({
  id: z.string().min(1),
  payment_status: z.enum(['paid', 'unpaid']),
  paid_on: z.string().nullable(),
})

const createInvoiceResponseSchema = z.object({
  id: z.string().min(1),
  status: z.literal('draft'),
})

export function createInvoice(values: InvoiceFormValues) {
  return apiClient.post(
    '/api/invoicing/invoices',
    createInvoiceResponseSchema,
    values,
  )
}

export function finaliseInvoice(invoiceId: string) {
  return apiClient.post(
    `/api/invoicing/invoices/${invoiceId}/finalise`,
    finaliseResponseSchema,
  )
}

export function setPaymentStatus(invoiceId: string, next: PaymentStatus) {
  return apiClient.patch(
    `/api/invoicing/invoices/${invoiceId}/payment`,
    paymentResponseSchema,
    {payment_status: next},
  )

}