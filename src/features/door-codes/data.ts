import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'

const listParamsSchema = z.object({
  search: z.string().trim().max(100).optional(),
  postal: z
    .string()
    .trim()
    .regex(/^\d{5}$/)
    .optional(),
})

export type DoorCodeListItem = {
  id: string
  address: string
  city: string
  postal_code: string | null
  arrondissement: number | null
  code: string
  floor: string | null
  instructions: string | null
  parking_hint: string | null
  created_at: string
}

export async function listDoorCodes(params: z.infer<typeof listParamsSchema>) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`codes:${params.postal ?? 'all'}`)

  const { search, postal } = listParamsSchema.parse(params)
  const supabase = createServiceClient()

  let query = supabase
    .from('door_codes')
    .select(
      'id, address, city, postal_code, arrondissement, code, floor, instructions, parking_hint, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(20)

  if (postal) query = query.eq('postal_code', postal)
  if (search)
    query = query.or(`address.ilike.%${search}%,city.ilike.%${search}%`)

  const { data, error } = await query

  if (error) {
    console.error('[listDoorCodes] db error', error)
    return []
  }

  return data as DoorCodeListItem[]
}
