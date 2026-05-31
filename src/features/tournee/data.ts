import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/lib/types/database'
import type { TourneeStatus } from './schemas'

type StopStatus = Database['public']['Enums']['stop_status']

export type StopListItem = {
  id: string
  address: string
  order_index: number
  status: StopStatus
  time_window_start: string | null
  time_window_end: string | null
  priority: number | null
  weight_kg: number | null
  notes: string | null
  completed_at: string | null
  geocoded: boolean
}

export type TourneeListItem = {
  id: string
  date: string
  name: string
  vehicle_type: string
  status: TourneeStatus
  parcel_count: number | null
  notes: string | null
  created_at: string
}

export type TourneeDetail = TourneeListItem // Phase 1: same shape; Phase 3 may extend with stops

const userIdSchema = z.string().uuid()
const tourneeIdSchema = z.string().uuid()

const SELECT_COLS =
  'id, date, name, vehicle_type, status, parcel_count, notes, created_at'

// ============================================================
// LIST — driver's own tournées, newest first
// ============================================================
export async function listMyTournees(
  userId: string,
): Promise<TourneeListItem[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`tournees:${userId}`)

  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) return []

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tournees')
    .select(SELECT_COLS)
    .eq('user_id', parsed.data)
    .order('date', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[listMyTournees] db error', { userId, code: error.code })
    return []
  }

  return data as TourneeListItem[]
}

// ============================================================
// DETAIL — single tournée, owner-only
// ============================================================
export async function getTournee(
  userId: string,
  tourneeId: string,
): Promise<TourneeDetail | null> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`tournee:${tourneeId}`)

  const u = userIdSchema.safeParse(userId)
  const t = tourneeIdSchema.safeParse(tourneeId)
  if (!u.success || !t.success) return null

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tournees')
    .select(SELECT_COLS)
    .eq('id', t.data)
    .eq('user_id', u.data) // owner-only — never serve another user's tournée
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // 0 rows
    console.error('[getTournee] db error', {
      userId,
      tourneeId,
      code: error.code,
    })
    return null
  }

  return data as TourneeDetail
}

// ============================================================
// LIST STOPS — owner-scoped, ordered by sequence
// ============================================================
export async function listStops(
  userId: string,
  tourneeId: string,
): Promise<StopListItem[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`tournee:${tourneeId}`)

  const u = userIdSchema.safeParse(userId)
  const t = tourneeIdSchema.safeParse(tourneeId)
  if (!u.success || !t.success) return []

  const supabase = createServiceClient()

  // Defense-in-depth: confirm the caller owns the parent tournée
  // before reading its stops (service client bypasses RLS).
  const { data: parent } = await supabase
    .from('tournees')
    .select('id')
    .eq('id', t.data)
    .eq('user_id', u.data)
    .maybeSingle()
  if (!parent) return []

  const { data, error } = await supabase
    .from('stops')
    .select(
      'id, address, order_index, status, time_window_start, time_window_end, priority, weight_kg, notes, completed_at, location',
    )
    .eq('tournee_id', t.data)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('[listStops] db error', {
      userId,
      tourneeId,
      code: error.code,
    })
    return []
  }

  return (data ?? []).map((row) => ({
    ...row,
    geocoded: row.location !== null,
  }))
}
