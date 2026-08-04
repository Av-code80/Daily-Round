import { z } from 'zod'
import { apiClient } from '@/lib/api/client'

const clientOptionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  siret: z.string().nullable(),
  city: z.string().nullable(),
  payment_terms_days: z.number(),
  min_billable_quantity: z.number().nullable(),
})

const clientListSchema = z.array(clientOptionSchema)

export type ClientOptionDto = z.infer<typeof clientOptionSchema>

export function listRecentClients() {
  return apiClient.get('/api/invoicing/clients?recent=1', clientListSchema)
}

export function searchClients(term: string) {
  // encodeURIComponent, not template concatenation: a client named
  // "Dupont & Fils" would otherwise truncate the query at the &.
  return apiClient.get(
    `/api/invoicing/clients?q=${encodeURIComponent(term)}`,
    clientListSchema,
  )
}

export function createClient(name: string) {
  return apiClient.post('/api/invoicing/clients', clientOptionSchema, { name })
}