import { z } from 'zod'
import { apiClient } from '@/lib/api/client'
import type { IssuerFormValues } from '../schemas'

const saveResponseSchema = z.object({ saved: z.literal(true) })

export function saveIssuer(values: IssuerFormValues) {
  return apiClient.put('/api/invoicing/issuer', saveResponseSchema, values)
}
