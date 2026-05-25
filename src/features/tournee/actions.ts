'use server'

import { z } from 'zod'
import { updateTag } from 'next/cache'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import {
  stopFormSchema,
  tourneeFormSchema,
  tourneeStatusSchema,
  type StopFormValues,
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

// ============================================================
// STOPS — internal ownership helpers
// ------------------------------------------------------------
// The service client bypasses RLS, so every stop write must
// verify at the application layer that the caller owns the
// parent tournée. RLS on `stops` remains as defense-in-depth.
// ============================================================
async function isTourneeOwner(
  tourneeId: string,
  userId: string,
): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tournees')
    .select('id')
    .eq('id', tourneeId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

async function getStopOwner(
  stopId: string,
): Promise<{ tournee_id: string; user_id: string } | null> {
  const supabase = createServiceClient()
  const { data: stop } = await supabase
    .from('stops')
    .select('tournee_id')
    .eq('id', stopId)
    .maybeSingle()
  if (!stop) return null

  const { data: tournee } = await supabase
    .from('tournees')
    .select('user_id')
    .eq('id', stop.tournee_id)
    .maybeSingle()
  if (!tournee) return null

  return { tournee_id: stop.tournee_id, user_id: tournee.user_id }
}

// ============================================================
// ADD STOP
// ------------------------------------------------------------
// `order_index` is server-assigned (max + 1) — driver never
// sends one. `location` is intentionally left unset; geocoding
// runs in Phase 3b and back-fills the column.
// ============================================================
export async function addStop(
  tourneeId: string,
  input: StopFormValues,
): Promise<CreateResult> {
  if (!idSchema.safeParse(tourneeId).success) {
    return { ok: false, error: 'invalid_id' }
  }
  const parsed = stopFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'not_authenticated' }
  const userId = session.user.id

  if (!(await isTourneeOwner(tourneeId, userId))) {
    return { ok: false, error: 'not_found' }
  }

  const supabase = createServiceClient()

  const { data: lastStop } = await supabase
    .from('stops')
    .select('order_index')
    .eq('tournee_id', tourneeId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextIndex = (lastStop?.order_index ?? -1) + 1

  const v = parsed.data
  const { data, error } = await supabase
    .from('stops')
    .insert({
      tournee_id: tourneeId,
      address: v.address,
      order_index: nextIndex,
      time_window_start: v.time_window_start === '' ? null : v.time_window_start,
      time_window_end: v.time_window_end === '' ? null : v.time_window_end,
      priority: v.priority,
      weight_kg: v.weight_kg === '' ? null : Number(v.weight_kg),
      notes: v.notes === '' ? null : v.notes,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[addStop] db error', {
      userId,
      tourneeId,
      code: error.code,
      message: error.message,
    })
    return { ok: false, error: 'db_error' }
  }

  updateTag(`tournee:${tourneeId}`)
  return { ok: true, id: data.id }
}

// ============================================================
// DELETE STOP
// ============================================================
export async function deleteStop(stopId: string): Promise<SimpleResult> {
  if (!idSchema.safeParse(stopId).success) {
    return { ok: false, error: 'invalid_id' }
  }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'not_authenticated' }
  const userId = session.user.id

  const owner = await getStopOwner(stopId)
  if (!owner || owner.user_id !== userId) {
    return { ok: false, error: 'not_found' }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('stops').delete().eq('id', stopId)
  if (error) {
    console.error('[deleteStop] db error', { userId, stopId, code: error.code })
    return { ok: false, error: 'db_error' }
  }

  updateTag(`tournee:${owner.tournee_id}`)
  return { ok: true }
}

// ============================================================
// REORDER STOPS — full-list atomic update
// ------------------------------------------------------------
// Client sends the new ID order; server rewrites order_index
// for every stop. Last-write-wins. order_index has no UNIQUE
// constraint, so transient collisions during the rewrite are
// harmless.
// ============================================================
export async function reorderStops(
  tourneeId: string,
  newOrder: string[],
): Promise<SimpleResult> {
  if (!idSchema.safeParse(tourneeId).success) {
    return { ok: false, error: 'invalid_id' }
  }
  const orderParse = z.array(idSchema).min(1).max(500).safeParse(newOrder)
  if (!orderParse.success) return { ok: false, error: 'invalid_input' }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'not_authenticated' }
  const userId = session.user.id

  if (!(await isTourneeOwner(tourneeId, userId))) {
    return { ok: false, error: 'not_found' }
  }

  const supabase = createServiceClient()

  // Verify the proposed order lists exactly the stops of this tournée
  const { data: current } = await supabase
    .from('stops')
    .select('id')
    .eq('tournee_id', tourneeId)
  if (!current) return { ok: false, error: 'db_error' }

  const currentIds = new Set(current.map((r) => r.id))
  if (
    newOrder.length !== currentIds.size ||
    newOrder.some((id) => !currentIds.has(id))
  ) {
    return { ok: false, error: 'order_mismatch' }
  }

  for (let i = 0; i < newOrder.length; i++) {
    const { error } = await supabase
      .from('stops')
      .update({ order_index: i })
      .eq('id', newOrder[i])
      .eq('tournee_id', tourneeId)
    if (error) {
      console.error('[reorderStops] db error', {
        userId,
        tourneeId,
        code: error.code,
      })
      return { ok: false, error: 'db_error' }
    }
  }

  updateTag(`tournee:${tourneeId}`)
  return { ok: true }
}

// ============================================================
// MARK STOP DELIVERED
// ============================================================
export async function markStopDelivered(
  stopId: string,
): Promise<SimpleResult> {
  if (!idSchema.safeParse(stopId).success) {
    return { ok: false, error: 'invalid_id' }
  }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'not_authenticated' }
  const userId = session.user.id

  const owner = await getStopOwner(stopId)
  if (!owner || owner.user_id !== userId) {
    return { ok: false, error: 'not_found' }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('stops')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', stopId)
  if (error) {
    console.error('[markStopDelivered] db error', {
      userId,
      stopId,
      code: error.code,
    })
    return { ok: false, error: 'db_error' }
  }

  updateTag(`tournee:${owner.tournee_id}`)
  return { ok: true }
}
