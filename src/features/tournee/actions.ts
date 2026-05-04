'use server'

import { z } from 'zod'
import { updateTag } from 'next/cache'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import {
  tourneeFormSchema,
  tourneeStatusSchema,
  type TourneeFormValues,
  type TourneeStatus,
} from './schemas'

type CreateResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

type SimpleResult =
  | { ok: true }
  | { ok: false; error: string }

const idSchema = z.string().uuid()

// 'YYYY-MM-DD' → 'Tournée du DD/MM/YYYY'
function tourneeName(dateIso: string) {
  const [y, m, d] = dateIso.split('-')
  return `Tournée du ${d}/${m}/${y}`
}

// ============================================================
// CREATE
// ============================================================
export async function createTournee(
  input: TourneeFormValues,
): Promise<CreateResult> {
  const parsed = tourneeFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'not_authenticated' }
  const userId = session.user.id

  const { date, vehicle_type, parcel_count, notes } = parsed.data

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tournees')
    .insert({
      user_id: userId,
      name: tourneeName(date),
      date,
      vehicle_type,
      parcel_count: parcel_count === '' ? 0 : Number(parcel_count),
      notes: notes === '' ? null : notes,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createTournee] db error', {
      userId,
      code: error.code,
      message: error.message,
    })
    return { ok: false, error: 'db_error' }
  }

  updateTag(`tournees:${userId}`)
  return { ok: true, id: data.id }
}

// ============================================================
// UPDATE STATUS
// ============================================================
export async function updateTourneeStatus(
  tourneeId: string,
  status: TourneeStatus,
): Promise<SimpleResult> {
  if (!idSchema.safeParse(tourneeId).success) {
    return { ok: false, error: 'invalid_id' }
  }
  if (!tourneeStatusSchema.safeParse(status).success) {
    return { ok: false, error: 'invalid_status' }
  }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'not_authenticated' }
  const userId = session.user.id

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('tournees')
    .update({ status })
    .eq('id', tourneeId)
    .eq('user_id', userId) // defense-in-depth: scope writes to the owner

  if (error) {
    console.error('[updateTourneeStatus] db error', {
      userId,
      tourneeId,
      code: error.code,
    })
    return { ok: false, error: 'db_error' }
  }

  updateTag(`tournees:${userId}`)
  updateTag(`tournee:${tourneeId}`)
  return { ok: true }
}

// ============================================================
// DELETE
// ============================================================
export async function deleteTournee(tourneeId: string): Promise<SimpleResult> {
  if (!idSchema.safeParse(tourneeId).success) {
    return { ok: false, error: 'invalid_id' }
  }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'not_authenticated' }
  const userId = session.user.id

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('tournees')
    .delete()
    .eq('id', tourneeId)
    .eq('user_id', userId)

  if (error) {
    console.error('[deleteTournee] db error', {
      userId,
      tourneeId,
      code: error.code,
    })
    return { ok: false, error: 'db_error' }
  }

  updateTag(`tournees:${userId}`)
  updateTag(`tournee:${tourneeId}`)
  return { ok: true }
}
